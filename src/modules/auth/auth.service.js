// Regulile pentru crearea conturilor si autentificare. Serviciul nu cunoaste
// req/res: primeste date simple si arunca AppError pentru situatiile prevazute.
import bcrypt from 'bcrypt';
import { UniqueConstraintError } from 'sequelize';

import { AppError } from '../../utils/app-error.js';
import { Utilizator } from '../utilizatori/utilizator.model.js';
import { toUtilizatorPublic } from '../utilizatori/utilizator.service.js';

import { createToken } from './token.service.js';

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_CONFLICT = 409;
const BCRYPT_ROUNDS = 10;

/**
 * @typedef {import('../utilizatori/utilizator.service.js').UtilizatorPublic}
 *   UtilizatorPublic
 */

// Categoria se deduce din domeniul e-mailului institutional (GLOSSARY.md).
const CATEGORIE_DUPA_DOMENIU = new Map([
  ['student.usv.ro', 'Student'],
  ['usv.ro', 'CadruDidactic'],
]);

/**
 * Categoria utilizatorului dupa domeniul e-mailului.
 * @param {string} email
 * @returns {string | undefined} Categoria, sau undefined pentru un domeniu
 *   care nu este al USV.
 */
function getCategorieByEmail(email) {
  const domeniu = email.slice(email.lastIndexOf('@') + 1).toLowerCase();
  return CATEGORIE_DUPA_DOMENIU.get(domeniu);
}

/**
 * Creeaza contul unui utilizator nou, cu rolul Utilizator.
 * @param {{nume: string, email: string, parola: string}} date
 * @returns {Promise<UtilizatorPublic>}
 * @throws {AppError} 400 daca e-mailul nu este al USV.
 */
export async function registerUtilizator({ nume, email, parola }) {
  const categorie = getCategorieByEmail(email);
  if (!categorie) {
    throw new AppError(
      HTTP_BAD_REQUEST,
      'EMAIL_NEINSTITUTIONAL',
      'Contul se face doar cu un e-mail @student.usv.ro sau @usv.ro.',
    );
  }
  try {
    const utilizator = await Utilizator.create({
      nume,
      email,
      parola_hash: await bcrypt.hash(parola, BCRYPT_ROUNDS),
      categorie,
      rol: 'Utilizator',
    });
    return toUtilizatorPublic(utilizator);
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      throw new AppError(
        HTTP_CONFLICT,
        'EMAIL_EXISTENT',
        `Exista deja un cont cu e-mailul ${email}.`,
      );
    }
    throw err;
  }
}

/**
 * Autentifica un utilizator dupa e-mail si parola.
 * @param {{email: string, parola: string}} date
 * @returns {Promise<{token: string, utilizator: UtilizatorPublic}>}
 * @throws {AppError} 401 daca e-mailul nu are cont sau parola e gresita.
 */
export async function loginUtilizator({ email, parola }) {
  const utilizator = await Utilizator.findOne({ where: { email } });
  // Acelasi raspuns in ambele cazuri, ca sa nu se poata afla ce e-mailuri
  // au cont.
  if (!utilizator || !(await bcrypt.compare(parola, utilizator.parola_hash))) {
    throw new AppError(
      HTTP_UNAUTHORIZED,
      'AUTENTIFICARE_ESUATA',
      'E-mailul sau parola nu sunt corecte.',
    );
  }
  return {
    token: createToken(utilizator),
    utilizator: toUtilizatorPublic(utilizator),
  };
}
