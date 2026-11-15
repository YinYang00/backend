// Regulile pentru rezervari. Serviciul nu cunoaste req/res: primeste date
// simple si arunca AppError pentru situatiile prevazute.
import { randomUUID } from 'node:crypto';

import { Op, QueryTypes, UniqueConstraintError } from 'sequelize';

import { sequelize } from '../../config/database.js';
import { AppError } from '../../utils/app-error.js';
import { toIsoRomania } from '../../utils/ora-romania.js';

import { Rezervare, STARI_ACTIVE } from './rezervare.model.js';

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const STARE_MENTENANTA = 'Mentenanta';
// Indexul unic partial din migrarea 0004: un utilizator, un slot, activ.
const INDEX_REZERVARE_ACTIVA = 'uq_rezervare_activa';

/**
 * O rezervare asa cum iese din API.
 * @typedef {{id_rezervare: number, stare_rezervare: string, cod_qr: string,
 *   data_crearii: string,
 *   slot: {id_slot: number, ora_inceput: string, ora_sfarsit: string},
 *   facilitate: {id_facilitate: number, denumire: string}}} RezervarePublica
 */

/**
 * Randul slotului blocat, impreuna cu facilitatea lui.
 * @typedef {{id_slot: number, ora_inceput: Date, ora_sfarsit: Date,
 *   stare: string, id_facilitate: number, denumire: string,
 *   capacitate_maxima: number}} SlotBlocat
 */

// Blocheaza randul slotului pana la sfarsitul tranzactiei (ADR 0003): doua
// rezervari pentru acelasi slot asteapta una dupa alta, deci numaratoarea
// locurilor ramane corecta.
const SQL_SLOT_BLOCAT = `
  SELECT s.id_slot, s.ora_inceput, s.ora_sfarsit, s.stare,
         f.id_facilitate, f.denumire, f.capacitate_maxima
  FROM slot s
  JOIN facilitate f ON f.id_facilitate = s.id_facilitate
  WHERE s.id_slot = :idSlot
  FOR UPDATE OF s
`;

/**
 * Eroarea pentru un slot care nu mai primeste rezervari.
 * @param {string} motiv
 * @returns {AppError}
 */
function createEroareSlotOcupat(motiv) {
  return new AppError(HTTP_CONFLICT, 'SLOT_OCUPAT', motiv);
}

/**
 * Eroarea pentru un utilizator care are deja o rezervare activa pe slot.
 * @returns {AppError}
 */
function createEroareRezervareSuprapusa() {
  return new AppError(
    HTTP_CONFLICT,
    'REZERVARE_SUPRAPUSA',
    'Ai deja o rezervare activa pe acest slot.',
  );
}

/**
 * Citeste si blocheaza slotul, impreuna cu facilitatea lui.
 * @param {number} idSlot
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<SlotBlocat>}
 * @throws {AppError} 404 daca slotul nu exista.
 */
async function findSlotBlocat(idSlot, transaction) {
  const [slot] = await sequelize.query(SQL_SLOT_BLOCAT, {
    type: QueryTypes.SELECT,
    replacements: { idSlot },
    transaction,
  });
  if (!slot) {
    throw new AppError(
      HTTP_NOT_FOUND,
      'SLOT_NEGASIT',
      `Slotul cu id ${idSlot} nu exista.`,
    );
  }
  return slot;
}

/**
 * Verifica, cu slotul deja blocat, ca utilizatorul poate ocupa un loc.
 * @param {SlotBlocat} slot
 * @param {number} idUtilizator
 * @param {import('sequelize').Transaction} transaction
 * @returns {Promise<void>}
 * @throws {AppError} 409 SLOT_OCUPAT sau REZERVARE_SUPRAPUSA.
 */
async function assertLocDisponibil(slot, idUtilizator, transaction) {
  if (slot.stare === STARE_MENTENANTA) {
    throw createEroareSlotOcupat('Slotul este blocat pentru mentenanta.');
  }
  if (slot.ora_inceput <= new Date()) {
    throw createEroareSlotOcupat('Slotul a inceput deja.');
  }
  const active = await Rezervare.findAll({
    attributes: ['id_utilizator'],
    where: {
      id_slot: slot.id_slot,
      stare_rezervare: { [Op.in]: STARI_ACTIVE },
    },
    transaction,
  });
  if (active.some((rezervare) => rezervare.id_utilizator === idUtilizator)) {
    throw createEroareRezervareSuprapusa();
  }
  if (active.length >= slot.capacitate_maxima) {
    throw createEroareSlotOcupat('Slotul nu mai are locuri libere.');
  }
}

/**
 * Pastreaza datele rezervarii care ies din API.
 * @param {Rezervare} rezervare
 * @param {SlotBlocat} slot
 * @returns {RezervarePublica}
 */
function toRezervarePublica(rezervare, slot) {
  return {
    id_rezervare: rezervare.id_rezervare,
    stare_rezervare: rezervare.stare_rezervare,
    cod_qr: rezervare.cod_qr,
    data_crearii: toIsoRomania(rezervare.data_crearii),
    slot: {
      id_slot: slot.id_slot,
      ora_inceput: toIsoRomania(slot.ora_inceput),
      ora_sfarsit: toIsoRomania(slot.ora_sfarsit),
    },
    facilitate: {
      id_facilitate: slot.id_facilitate,
      denumire: slot.denumire,
    },
  };
}

/**
 * Rezerva un loc pentru utilizator intr-un slot. Totul se face intr-o
 * tranzactie, cu randul slotului blocat (ADR 0003).
 * @param {number} idUtilizator
 * @param {number} idSlot
 * @returns {Promise<RezervarePublica>}
 * @throws {AppError} 404 daca slotul nu exista; 409 SLOT_OCUPAT daca slotul e
 *   in mentenanta, a inceput sau e plin; 409 REZERVARE_SUPRAPUSA daca
 *   utilizatorul are deja o rezervare activa pe slot.
 */
export async function createRezervare(idUtilizator, idSlot) {
  try {
    return await sequelize.transaction(async (transaction) => {
      const slot = await findSlotBlocat(idSlot, transaction);
      await assertLocDisponibil(slot, idUtilizator, transaction);
      const rezervare = await Rezervare.create(
        { id_utilizator: idUtilizator, id_slot: idSlot, cod_qr: randomUUID() },
        { transaction },
      );
      return toRezervarePublica(rezervare, slot);
    });
  } catch (err) {
    // Plasa de siguranta: indexul unic partial opreste o a doua rezervare
    // activa a aceluiasi utilizator chiar daca verificarea de mai sus ar fi
    // ocolita. O coliziune de cod_qr ramane o eroare neprevazuta (500).
    if (
      err instanceof UniqueConstraintError &&
      err.parent?.constraint === INDEX_REZERVARE_ACTIVA
    ) {
      throw createEroareRezervareSuprapusa();
    }
    throw err;
  }
}
