// Regulile de acces ale unei facilitati. Serviciul nu cunoaste req/res:
// primeste date simple si arunca AppError pentru situatiile prevazute.
import { sequelize } from '../../config/database.js';
import { findFacilitateById } from '../facilitati/facilitate.service.js';

import { CAMPURI_REGULA, RegulaAcces } from './regula-acces.model.js';

/** @typedef {import('../../utils/app-error.js').AppError} AppError */

/**
 * O regula de acces asa cum intra si iese din API.
 * @typedef {{categorie_utilizator: string, ore_maxim_saptamana: number,
 *   prioritate: number, zile_avans_maxim: number}} RegulaPublica
 */

/**
 * Regulile unei facilitati, fara verificarea existentei ei.
 * @param {number} idFacilitate
 * @param {import('sequelize').Transaction} [transaction]
 * @returns {Promise<RegulaPublica[]>}
 */
async function findReguli(idFacilitate, transaction) {
  return RegulaAcces.findAll({
    attributes: CAMPURI_REGULA,
    where: { id_facilitate: idFacilitate },
    // Ordinea tipului enumerat: Student, CadruDidactic, PersonalAdministrativ.
    order: [['categorie_utilizator', 'ASC']],
    raw: true,
    transaction,
  });
}

/**
 * Regulile de acces ale unei facilitati, cate una pe categorie.
 * @param {number} idFacilitate
 * @returns {Promise<RegulaPublica[]>}
 * @throws {AppError} 404 daca facilitatea nu exista.
 */
export async function findReguliAcces(idFacilitate) {
  await findFacilitateById(idFacilitate);
  return findReguli(idFacilitate);
}

/**
 * Inlocuieste toate regulile de acces ale unei facilitati cu cele primite,
 * intr-o tranzactie. O lista goala lasa facilitatea fara limite.
 * @param {number} idFacilitate
 * @param {RegulaPublica[]} reguli
 * @returns {Promise<RegulaPublica[]>} Regulile salvate.
 * @throws {AppError} 404 daca facilitatea nu exista.
 */
export async function replaceReguliAcces(idFacilitate, reguli) {
  return sequelize.transaction(async (transaction) => {
    // Blocheaza randul facilitatii pana la sfarsitul tranzactiei: doua
    // inlocuiri simultane ruleaza una dupa alta (altfel a doua nu vede
    // regulile inserate de prima si incalca UNIQUE), iar facilitatea nu poate
    // fi stearsa intre verificare si inserare.
    await findFacilitateById(idFacilitate, { transaction, lock: true });
    await RegulaAcces.destroy({
      where: { id_facilitate: idFacilitate },
      transaction,
    });
    await RegulaAcces.bulkCreate(
      reguli.map((regula) => ({ ...regula, id_facilitate: idFacilitate })),
      { transaction },
    );
    return findReguli(idFacilitate, transaction);
  });
}
