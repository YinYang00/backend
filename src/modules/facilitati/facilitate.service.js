// Regulile de business pentru facilitati. Serviciul nu cunoaste req/res:
// primeste date simple si arunca AppError pentru situatiile prevazute.
import { UniqueConstraintError } from 'sequelize';

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
 * @returns {Promise<Facilitate>}
 * @throws {AppError} 404 daca facilitatea nu exista.
 */
export async function findFacilitateById(id) {
  const facilitate = await Facilitate.findByPk(id);
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
 * @throws {AppError} 404 daca facilitatea nu exista.
 */
export async function removeFacilitate(id) {
  const facilitate = await findFacilitateById(id);
  await facilitate.destroy();
}
