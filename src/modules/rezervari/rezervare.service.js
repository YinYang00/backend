// Regulile pentru rezervari. Serviciul nu cunoaste req/res: primeste date
// simple si arunca AppError pentru situatiile prevazute.
import { randomUUID } from 'node:crypto';

import {
  ExclusionConstraintError,
  ForeignKeyConstraintError,
  Op,
  QueryTypes,
} from 'sequelize';

import { sequelize } from '../../config/database.js';
import { AppError } from '../../utils/app-error.js';
import { toIsoRomania } from '../../utils/ora-romania.js';
import { createEroareNeautentificat } from '../auth/token.service.js';

import { Rezervare, STARE_ANULATA, STARI_ACTIVE } from './rezervare.model.js';

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const STARE_MENTENANTA = 'Mentenanta';
const ROL_ADMINISTRATOR = 'Administrator';
// Constrangerea EXCLUDE din migrarea 0005: rezervarile active ale unui
// utilizator nu se suprapun in timp, la nicio facilitate.
const CONSTRANGERE_REZERVARE_SUPRAPUSA = 'ex_rezervare_suprapusa';

/**
 * O rezervare din lista utilizatorului, fara codul QR.
 * @typedef {{id_rezervare: number, stare_rezervare: string,
 *   data_crearii: string,
 *   slot: {id_slot: number, ora_inceput: string, ora_sfarsit: string},
 *   facilitate: {id_facilitate: number, denumire: string}}} RezervareListata
 */

/**
 * O rezervare asa cum iese din API, cu codul QR.
 * @typedef {RezervareListata & {cod_qr: string}} RezervarePublica
 */

/**
 * O rezervare citita din baza, impreuna cu slotul si facilitatea ei.
 * @typedef {{id_rezervare: number, id_utilizator: number,
 *   stare_rezervare: string, cod_qr: string, data_crearii: Date,
 *   id_slot: number, ora_inceput: Date, ora_sfarsit: Date,
 *   id_facilitate: number, denumire: string}} RandRezervare
 */

// Rezervarea cu slotul si facilitatea ei; cererile adauga WHERE si ORDER BY.
const SQL_REZERVARI_CU_SLOT = `
  SELECT r.id_rezervare, r.id_utilizator, r.stare_rezervare, r.cod_qr,
         r.data_crearii, s.id_slot, s.ora_inceput, s.ora_sfarsit,
         f.id_facilitate, f.denumire
  FROM rezervare r
  JOIN slot s ON s.id_slot = r.id_slot
  JOIN facilitate f ON f.id_facilitate = s.id_facilitate
`;

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
 * Eroarea pentru un utilizator care are deja o rezervare activa in acelasi
 * interval orar, pe acest slot sau la alta facilitate.
 * @returns {AppError}
 */
function createEroareRezervareSuprapusa() {
  return new AppError(
    HTTP_CONFLICT,
    'REZERVARE_SUPRAPUSA',
    'Ai deja o rezervare activa in acest interval orar.',
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
 * Un slot inceput nu mai primeste rezervari si nici anulari.
 * @param {{ora_inceput: Date}} slot
 * @returns {boolean}
 */
function isSlotInceput(slot) {
  return slot.ora_inceput <= new Date();
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
  if (isSlotInceput(slot)) {
    throw createEroareSlotOcupat('Slotul a inceput deja.');
  }
  const rezervariActive = await Rezervare.findAll({
    attributes: ['id_utilizator'],
    where: {
      id_slot: slot.id_slot,
      stare_rezervare: { [Op.in]: STARI_ACTIVE },
    },
    transaction,
  });
  if (
    rezervariActive.some(
      (rezervare) => rezervare.id_utilizator === idUtilizator,
    )
  ) {
    throw createEroareRezervareSuprapusa();
  }
  if (rezervariActive.length >= slot.capacitate_maxima) {
    throw createEroareSlotOcupat('Slotul nu mai are locuri libere.');
  }
}

/**
 * Pastreaza datele rezervarii care apar in lista, fara codul QR.
 * @param {Rezervare | RandRezervare} rezervare
 * @param {SlotBlocat | RandRezervare} slot
 * @returns {RezervareListata}
 */
function toRezervareListata(rezervare, slot) {
  return {
    id_rezervare: rezervare.id_rezervare,
    stare_rezervare: rezervare.stare_rezervare,
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
 * Pastreaza datele rezervarii care ies din API, cu codul QR.
 * @param {Rezervare | RandRezervare} rezervare
 * @param {SlotBlocat | RandRezervare} slot
 * @returns {RezervarePublica}
 */
function toRezervarePublica(rezervare, slot) {
  return { ...toRezervareListata(rezervare, slot), cod_qr: rezervare.cod_qr };
}

/**
 * Verifica ca utilizatorul curent poate vedea rezervarea: a lui, sau orice
 * rezervare pentru administrator.
 * @param {RandRezervare | undefined} rand rezervarea citita din baza
 * @param {number} idRezervare
 * @param {{id_utilizator: number, rol: string}} utilizator utilizatorul curent
 * @returns {void}
 * @throws {AppError} 404 daca rezervarea nu exista sau e a altui utilizator;
 *   raspunsul e acelasi, ca sa nu se afle ca rezervarea exista.
 */
function assertRezervareVizibila(rand, idRezervare, utilizator) {
  const vizibila =
    rand &&
    (utilizator.rol === ROL_ADMINISTRATOR ||
      rand.id_utilizator === utilizator.id_utilizator);
  if (!vizibila) {
    throw new AppError(
      HTTP_NOT_FOUND,
      'REZERVARE_NEGASITA',
      `Rezervarea cu id ${idRezervare} nu exista.`,
    );
  }
}

/**
 * Rezervarile utilizatorului, in toate starile, ordonate dupa ora slotului.
 * @param {number} idUtilizator
 * @returns {Promise<RezervareListata[]>}
 */
export async function findRezervariUtilizator(idUtilizator) {
  const randuri = await sequelize.query(
    `${SQL_REZERVARI_CU_SLOT}
     WHERE r.id_utilizator = :idUtilizator
     ORDER BY s.ora_inceput, r.id_rezervare`,
    { type: QueryTypes.SELECT, replacements: { idUtilizator } },
  );
  return randuri.map((rand) => toRezervareListata(rand, rand));
}

/**
 * O rezervare, cu codul QR. Utilizatorul isi vede doar rezervarile proprii;
 * administratorul vede orice rezervare.
 * @param {number} idRezervare
 * @param {{id_utilizator: number, rol: string}} utilizator utilizatorul curent
 * @returns {Promise<RezervarePublica>}
 * @throws {AppError} 404 daca rezervarea nu exista sau e a altui utilizator;
 *   raspunsul e acelasi, ca sa nu se afle ca rezervarea exista.
 */
export async function findRezervareById(idRezervare, utilizator) {
  const [rand] = await sequelize.query(
    `${SQL_REZERVARI_CU_SLOT} WHERE r.id_rezervare = :idRezervare`,
    { type: QueryTypes.SELECT, replacements: { idRezervare } },
  );
  assertRezervareVizibila(rand, idRezervare, utilizator);
  return toRezervarePublica(rand, rand);
}

/**
 * Rezerva un loc pentru utilizator intr-un slot. Totul se face intr-o
 * tranzactie, cu randul slotului blocat (ADR 0003).
 * @param {number} idUtilizator
 * @param {number} idSlot
 * @returns {Promise<RezervarePublica>}
 * @throws {AppError} 401 daca contul utilizatorului nu mai exista; 404 daca
 *   slotul nu exista; 409 SLOT_OCUPAT daca slotul e in mentenanta, a inceput
 *   sau e plin; 409 REZERVARE_SUPRAPUSA daca utilizatorul are deja o
 *   rezervare activa suprapusa in timp, la orice facilitate.
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
    // Baza de date refuza o rezervare suprapusa cu alta rezervare activa a
    // utilizatorului, chiar daca cele doua cereri au blocat sloturi diferite.
    // O coliziune de cod_qr ramane o eroare neprevazuta (500).
    if (
      err instanceof ExclusionConstraintError &&
      err.constraint === CONSTRANGERE_REZERVARE_SUPRAPUSA
    ) {
      throw createEroareRezervareSuprapusa();
    }
    // Tokenul e valid, dar contul a fost sters intre timp: id_utilizator nu
    // mai exista, deci cererea nu mai are un utilizator autentificat.
    if (err instanceof ForeignKeyConstraintError) {
      throw createEroareNeautentificat();
    }
    throw err;
  }
}

/**
 * Anuleaza o rezervare: trece in starea Anulata si nu mai ocupa loc. Randul
 * rezervarii ramane blocat pana la sfarsitul tranzactiei, deci doua anulari
 * simultane nu trec amandoua.
 * @param {number} idRezervare
 * @param {{id_utilizator: number, rol: string}} utilizator utilizatorul curent
 * @returns {Promise<RezervarePublica>}
 * @throws {AppError} 404 daca rezervarea nu exista sau e a altui utilizator
 *   (administratorul anuleaza orice rezervare); 409 REZERVARE_INACTIVA daca
 *   rezervarea nu e activa; 409 ANULARE_TARZIE daca slotul a inceput.
 */
export async function cancelRezervare(idRezervare, utilizator) {
  return sequelize.transaction(async (transaction) => {
    const [rand] = await sequelize.query(
      `${SQL_REZERVARI_CU_SLOT} WHERE r.id_rezervare = :idRezervare
       FOR UPDATE OF r`,
      { type: QueryTypes.SELECT, replacements: { idRezervare }, transaction },
    );
    assertRezervareVizibila(rand, idRezervare, utilizator);
    if (!STARI_ACTIVE.includes(rand.stare_rezervare)) {
      throw new AppError(
        HTTP_CONFLICT,
        'REZERVARE_INACTIVA',
        'Rezervarea nu mai este activa: este deja anulata sau neonorata.',
      );
    }
    if (isSlotInceput(rand)) {
      throw new AppError(
        HTTP_CONFLICT,
        'ANULARE_TARZIE',
        'Rezervarea nu se mai poate anula: slotul a inceput deja.',
      );
    }
    await Rezervare.update(
      { stare_rezervare: STARE_ANULATA },
      { where: { id_rezervare: idRezervare }, transaction },
    );
    return toRezervarePublica(
      { ...rand, stare_rezervare: STARE_ANULATA },
      rand,
    );
  });
}
