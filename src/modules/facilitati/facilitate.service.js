// Regulile de business pentru facilitati. Serviciul nu cunoaste req/res:
// primeste date simple si arunca AppError pentru situatiile prevazute.
import { ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize';

import { AppError } from '../../utils/app-error.js';

import { Facilitate } from './facilitate.model.js';

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;

/**
 * Transforma incalcarea constrangerii UNIQUE pe denumire intr-un 409.
 * @param {Error} err
 * @param {string} denumire
 * @returns {Error}
 */
function toConflictError(err, denumire) {
  if (err instanceof UniqueConstraintError) {
    return new AppError(
      HTTP_CONFLICT,
      'DENUMIRE_DUPLICATA',
      `Exista deja o facilitate cu denumirea "${denumire}".`,
    );
  }
  return err;
}

/**
 * Listeaza toate facilitatile, ordonate dupa id.
 * @returns {Promise<Facilitate[]>}
 */
export async function findAllFacilitati() {
  return Facilitate.findAll({ order: [['id_facilitate', 'ASC']] });
}

/**
 * Cauta o facilitate dupa id.
 * @param {number} id
 * @param {{transaction?: import('sequelize').Transaction,
 *   lock?: boolean}} [optiuni] In tranzactie, `lock` blocheaza randul
 *   (`SELECT ... FOR UPDATE`) pana la sfarsitul ei.
 * @returns {Promise<Facilitate>}
 * @throws {AppError} 404 daca facilitatea nu exista.
 */
export async function findFacilitateById(id, optiuni = {}) {
  const facilitate = await Facilitate.findByPk(id, optiuni);
  if (!facilitate) {
    throw new AppError(
      HTTP_NOT_FOUND,
      'FACILITATE_NEGASITA',
      `Facilitatea cu id ${id} nu exista.`,
    );
  }
  return facilitate;
}

/**
 * Adauga o facilitate noua.
 * @param {{denumire: string, tip: string, capacitate_maxima: number,
 *   locatie: string}} date
 * @returns {Promise<Facilitate>}
 * @throws {AppError} 409 daca denumirea exista deja.
 */
export async function createFacilitate(date) {
  try {
    return await Facilitate.create(date);
  } catch (err) {
    throw toConflictError(err, date.denumire);
  }
}

/**
 * Modifica o facilitate existenta.
 * @param {number} id
 * @param {{denumire: string, tip: string, capacitate_maxima: number,
 *   locatie: string}} date
 * @returns {Promise<Facilitate>}
 * @throws {AppError} 404 daca nu exista, 409 daca denumirea e folosita.
 */
export async function updateFacilitate(id, date) {
  const facilitate = await findFacilitateById(id);
  try {
    return await facilitate.update(date);
  } catch (err) {
    throw toConflictError(err, date.denumire);
  }
}

/**
 * Sterge o facilitate.
 * @param {number} id
 * @returns {Promise<void>}
 * @throws {AppError} 404 daca facilitatea nu exista, 409 daca are rezervari.
 */
export async function removeFacilitate(id) {
  const facilitate = await findFacilitateById(id);
  try {
    await facilitate.destroy();
  } catch (err) {
    // Sloturile se sterg in cascada, dar rezervarile lor nu (ON DELETE
    // RESTRICT, migrarea 0004), ca sa nu se piarda istoricul.
    if (err instanceof ForeignKeyConstraintError) {
      throw new AppError(
        HTTP_CONFLICT,
        'FACILITATE_CU_REZERVARI',
        `Facilitatea cu id ${id} are rezervari si nu poate fi stearsa.`,
      );
    }
    throw err;
  }
}
