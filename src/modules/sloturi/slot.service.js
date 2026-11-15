// Regulile pentru sloturi. Serviciul nu cunoaste req/res: primeste date simple
// si arunca AppError pentru situatiile prevazute.
import { ForeignKeyConstraintError, QueryTypes } from 'sequelize';

import { sequelize } from '../../config/database.js';
import { AppError } from '../../utils/app-error.js';
import { FUS_ORAR, toIsoRomania } from '../../utils/ora-romania.js';
import { findFacilitateById } from '../facilitati/facilitate.service.js';

const HTTP_BAD_REQUEST = 400;

/**
 * Un slot asa cum iese din API. `stare` si `locuri_libere` se calculeaza
 * (ADR 0003); un slot nou nu are rezervari, deci are toate locurile libere.
 * @typedef {{id_slot: number, id_facilitate: number, ora_inceput: string,
 *   ora_sfarsit: string, stare: string, locuri_libere: number}} SlotPublic
 */

// Inceputul si sfarsitul zilei se transforma intai din ora Romaniei in
// TIMESTAMPTZ, apoi sloturile se genereaza in timp absolut: fiecare slot
// dureaza exact durata ceruta, si in zilele in care se schimba ora (cand o ora
// locala lipseste sau apare de doua ori). Sloturile care exista deja sau care
// s-ar suprapune cu unul existent (constrangerile UNIQUE si EXCLUDE din
// migrarea 0003) se sar.
const SQL_GENEREAZA_SLOTURI = `
  INSERT INTO slot (id_facilitate, ora_inceput, ora_sfarsit)
  SELECT :idFacilitate,
         inceput,
         inceput + make_interval(mins => :durataMinute)
  FROM generate_series(
    (CAST(:data AS DATE) + CAST(:oraInceput AS TIME)) AT TIME ZONE :fusOrar,
    ((CAST(:data AS DATE) + CAST(:oraSfarsit AS TIME)) AT TIME ZONE :fusOrar)
      - make_interval(mins => :durataMinute),
    make_interval(mins => :durataMinute)
  ) AS inceput
  ON CONFLICT DO NOTHING
  RETURNING id_slot, id_facilitate, ora_inceput, ora_sfarsit, stare
`;

// Cate minute reale are programul zilei. In ziua trecerii la ora de vara o ora
// locala lipseste, deci 02:00-04:00 are doar 60 de minute reale, iar 03:30 (care
// nu exista) ajunge dupa 04:00.
const SQL_MINUTE_REALE = `
  SELECT EXTRACT(EPOCH FROM
    ((CAST(:data AS DATE) + CAST(:oraSfarsit AS TIME)) AT TIME ZONE :fusOrar)
    - ((CAST(:data AS DATE) + CAST(:oraInceput AS TIME)) AT TIME ZONE :fusOrar)
  ) / 60 AS minute
`;

/**
 * Parametrii comuni ai interogarilor pentru programul unei zile.
 * @param {{data: string, ora_inceput: string, ora_sfarsit: string,
 *   durata_minute: number}} programZi
 * @returns {object}
 */
function toReplacements(programZi) {
  return {
    fusOrar: FUS_ORAR,
    data: programZi.data,
    oraInceput: programZi.ora_inceput,
    oraSfarsit: programZi.ora_sfarsit,
    durataMinute: programZi.durata_minute,
  };
}

/**
 * Verifica in timp absolut ca macar un slot incape in programul zilei. Regulile
 * din validator compara orele locale, care difera de cele reale doar in zilele
 * cu schimbarea orei.
 * @param {{data: string, ora_inceput: string, ora_sfarsit: string,
 *   durata_minute: number}} programZi
 * @returns {Promise<void>}
 * @throws {AppError} 400 daca durata nu incape in timpul real al programului.
 */
async function assertDurataIncape(programZi) {
  const [{ minute }] = await sequelize.query(SQL_MINUTE_REALE, {
    type: QueryTypes.SELECT,
    replacements: toReplacements(programZi),
  });
  if (Number(minute) < programZi.durata_minute) {
    throw new AppError(
      HTTP_BAD_REQUEST,
      'DATE_INVALIDE',
      'Durata nu incape in programul zilei: in aceasta zi se schimba ora.',
    );
  }
}

/**
 * Insereaza sloturile zilei si intoarce randurile create.
 * @param {number} idFacilitate
 * @param {{data: string, ora_inceput: string, ora_sfarsit: string,
 *   durata_minute: number}} programZi
 * @returns {Promise<object[]>}
 */
async function insertSloturi(idFacilitate, programZi) {
  // QueryTypes.SELECT face ca sequelize.query sa intoarca direct randurile din
  // RETURNING, ca la un SELECT.
  return sequelize.query(SQL_GENEREAZA_SLOTURI, {
    type: QueryTypes.SELECT,
    replacements: { idFacilitate, ...toReplacements(programZi) },
  });
}

/**
 * Genereaza sloturile consecutive ale unei zile pentru o facilitate. Ultimul
 * slot nu depaseste ora de sfarsit; sloturile care exista deja sau care s-ar
 * suprapune cu unul existent se sar.
 * @param {number} idFacilitate
 * @param {{data: string, ora_inceput: string, ora_sfarsit: string,
 *   durata_minute: number}} programZi Data `YYYY-MM-DD` si orele `HH:MM`, in
 *   ora Romaniei.
 * @returns {Promise<SlotPublic[]>} Sloturile create, in ordinea orei.
 * @throws {AppError} 400 daca durata nu incape in timpul real al programului,
 *   404 daca facilitatea nu exista.
 */
export async function createSloturi(idFacilitate, programZi) {
  const facilitate = await findFacilitateById(idFacilitate);
  await assertDurataIncape(programZi);
  let sloturi;
  try {
    sloturi = await insertSloturi(idFacilitate, programZi);
  } catch (err) {
    // Facilitatea a fost stearsa intre verificare si INSERT: cautarea din nou
    // arunca acelasi 404 FACILITATE_NEGASITA, nu un 500.
    if (err instanceof ForeignKeyConstraintError) {
      await findFacilitateById(idFacilitate);
    }
    throw err;
  }
  return sloturi
    .sort((primul, alDoilea) => primul.ora_inceput - alDoilea.ora_inceput)
    .map((slot) => ({
      id_slot: slot.id_slot,
      id_facilitate: slot.id_facilitate,
      ora_inceput: toIsoRomania(slot.ora_inceput),
      ora_sfarsit: toIsoRomania(slot.ora_sfarsit),
      stare: slot.stare,
      locuri_libere: facilitate.capacitate_maxima,
    }));
}
