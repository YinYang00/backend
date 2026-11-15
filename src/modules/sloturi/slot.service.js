// Regulile pentru sloturi. Serviciul nu cunoaste req/res: primeste date simple
// si arunca AppError pentru situatiile prevazute.
import { QueryTypes } from 'sequelize';

import { sequelize } from '../../config/database.js';
import { FUS_ORAR, toIsoRomania } from '../../utils/ora-romania.js';
import { findFacilitateById } from '../facilitati/facilitate.service.js';

/** @typedef {import('../../utils/app-error.js').AppError} AppError */

/**
 * Un slot asa cum iese din API. `stare` si `locuri_libere` se calculeaza
 * (ADR 0003); un slot nou nu are rezervari, deci are toate locurile libere.
 * @typedef {{id_slot: number, id_facilitate: number, ora_inceput: string,
 *   ora_sfarsit: string, stare: string, locuri_libere: number}} SlotPublic
 */

// Sloturile se genereaza in ora locala si abia apoi se transforma in
// TIMESTAMPTZ, ca o zi cu schimbarea orei sa aiba tot sloturi de ora fixa.
// Sloturile care exista deja (aceeasi facilitate si ora de inceput) se sar.
const SQL_GENEREAZA_SLOTURI = `
  INSERT INTO slot (id_facilitate, ora_inceput, ora_sfarsit)
  SELECT :idFacilitate,
         inceput AT TIME ZONE :fusOrar,
         (inceput + make_interval(mins => :durataMinute)) AT TIME ZONE :fusOrar
  FROM generate_series(
    CAST(:data AS DATE) + CAST(:oraInceput AS TIME),
    CAST(:data AS DATE) + CAST(:oraSfarsit AS TIME)
      - make_interval(mins => :durataMinute),
    make_interval(mins => :durataMinute)
  ) AS inceput
  ON CONFLICT (id_facilitate, ora_inceput) DO NOTHING
  RETURNING id_slot, id_facilitate, ora_inceput, ora_sfarsit, stare
`;

/**
 * Genereaza sloturile consecutive ale unei zile pentru o facilitate. Ultimul
 * slot nu depaseste ora de sfarsit; sloturile care exista deja se sar.
 * @param {number} idFacilitate
 * @param {{data: string, ora_inceput: string, ora_sfarsit: string,
 *   durata_minute: number}} interval Data `YYYY-MM-DD` si orele `HH:MM`, in
 *   ora Romaniei.
 * @returns {Promise<SlotPublic[]>} Sloturile create, in ordinea orei.
 * @throws {AppError} 404 daca facilitatea nu exista.
 */
export async function createSloturi(idFacilitate, interval) {
  const facilitate = await findFacilitateById(idFacilitate);
  const sloturi = await sequelize.query(SQL_GENEREAZA_SLOTURI, {
    type: QueryTypes.SELECT,
    replacements: {
      idFacilitate,
      fusOrar: FUS_ORAR,
      data: interval.data,
      oraInceput: interval.ora_inceput,
      oraSfarsit: interval.ora_sfarsit,
      durataMinute: interval.durata_minute,
    },
  });
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
