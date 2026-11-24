// Limitele regulilor de acces la rezervarea unui slot. Zilele si saptamanile
// se socotesc in PostgreSQL, in ora Romaniei, ca sa ramana corecte si cand se
// schimba ora.
import { QueryTypes, Transaction } from 'sequelize';

import { sequelize } from '../../config/database.js';
import { AppError } from '../../utils/app-error.js';
import { FUS_ORAR } from '../../utils/ora-romania.js';
import { createEroareNeautentificat } from '../auth/token.service.js';
import { RegulaAcces } from '../reguli-acces/regula-acces.model.js';
import { Utilizator } from '../utilizatori/utilizator.model.js';

import { STARI_ACTIVE } from './rezervare.model.js';

const HTTP_UNPROCESSABLE = 422;
const SECUNDE_PE_ORA = 3600;

// Zilele se aduna la ora locala: 7 zile de azi la 10:00 inseamna tot 10:00,
// chiar daca intre timp se schimba ora.
const SQL_PREA_DEVREME = `
  SELECT CAST(:oraInceput AS TIMESTAMPTZ) AT TIME ZONE :fusOrar >
         (CURRENT_TIMESTAMP AT TIME ZONE :fusOrar)
           + make_interval(days => :zileAvansMaxim) AS prea_devreme
`;

// Durata slotului cerut, plus duratele rezervarilor active ale utilizatorului la
// aceeasi facilitate, in aceeasi saptamana. date_trunc da lunea saptamanii; un
// slot care trece de miezul noptii tine intreg de saptamana in care incepe.
const SQL_SECUNDE_SAPTAMANA = `
  SELECT EXTRACT(EPOCH FROM
           cerut.ora_sfarsit - cerut.ora_inceput
           + COALESCE(SUM(s.ora_sfarsit - s.ora_inceput), INTERVAL '0')
         ) AS secunde
  FROM slot cerut
  LEFT JOIN (
    slot s JOIN rezervare r
      ON r.id_slot = s.id_slot
      AND r.id_utilizator = :idUtilizator
      AND r.stare_rezervare IN (:stariActive)
  ) ON s.id_facilitate = cerut.id_facilitate
    AND date_trunc('week', s.ora_inceput AT TIME ZONE :fusOrar)
      = date_trunc('week', cerut.ora_inceput AT TIME ZONE :fusOrar)
  WHERE cerut.id_slot = :idSlot
  GROUP BY cerut.id_slot
`;

/**
 * Verifica zilele maxime in avans ale regulii.
 * @param {RegulaAcces} regula
 * @param {{ora_inceput: Date}} slot
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<void>}
 * @throws {AppError} 422 PREA_DEVREME.
 */
async function assertZileAvans(regula, slot, transaction) {
  const [{ prea_devreme: preaDevreme }] = await sequelize.query(
    SQL_PREA_DEVREME,
    {
      type: QueryTypes.SELECT,
      replacements: {
        fusOrar: FUS_ORAR,
        oraInceput: slot.ora_inceput,
        zileAvansMaxim: regula.zile_avans_maxim,
      },
      transaction,
    },
  );
  if (preaDevreme) {
    throw new AppError(
      HTTP_UNPROCESSABLE,
      'PREA_DEVREME',
      `Slotul se poate rezerva cu cel mult ${regula.zile_avans_maxim} zile in avans.`,
    );
  }
}

/**
 * Verifica orele maxime pe saptamana ale regulii.
 * @param {RegulaAcces} regula
 * @param {{id_slot: number}} slot
 * @param {number} idUtilizator
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<void>}
 * @throws {AppError} 422 LIMITA_SAPTAMANALA.
 */
async function assertOreSaptamana(regula, slot, idUtilizator, transaction) {
  const [{ secunde }] = await sequelize.query(SQL_SECUNDE_SAPTAMANA, {
    type: QueryTypes.SELECT,
    replacements: {
      fusOrar: FUS_ORAR,
      idSlot: slot.id_slot,
      idUtilizator,
      stariActive: STARI_ACTIVE,
    },
    transaction,
  });
  if (Number(secunde) > regula.ore_maxim_saptamana * SECUNDE_PE_ORA) {
    throw new AppError(
      HTTP_UNPROCESSABLE,
      'LIMITA_SAPTAMANALA',
      `Rezervarea depaseste limita de ${regula.ore_maxim_saptamana} ore pe saptamana la aceasta facilitate.`,
    );
  }
}

/**
 * Verifica, cu slotul deja blocat, limitele regulii de acces a facilitatii
 * pentru categoria utilizatorului. Fara regula, nu exista limite.
 * @param {{id_slot: number, id_facilitate: number, ora_inceput: Date}} slot
 * @param {number} idUtilizator
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<void>}
 * @throws {AppError} 401 daca contul utilizatorului nu mai exista; 422
 *   PREA_DEVREME sau LIMITA_SAPTAMANALA.
 */
export async function assertLimiteAcces(slot, idUtilizator, transaction) {
  // Randul utilizatorului ramane blocat pana la sfarsitul tranzactiei: doua
  // rezervari simultane ale lui, pe sloturi diferite, nu trec impreuna peste
  // limita saptamanala.
  const utilizator = await Utilizator.findByPk(idUtilizator, {
    attributes: ['categorie'],
    lock: Transaction.LOCK.NO_KEY_UPDATE,
    transaction,
  });
  if (!utilizator) {
    throw createEroareNeautentificat();
  }
  const regula = await RegulaAcces.findOne({
    where: {
      id_facilitate: slot.id_facilitate,
      categorie_utilizator: utilizator.categorie,
    },
    transaction,
  });
  if (!regula) {
    return;
  }
  await assertZileAvans(regula, slot, transaction);
  await assertOreSaptamana(regula, slot, idUtilizator, transaction);
}
