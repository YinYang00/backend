// Regulile pentru crearea conturilor. Serviciul nu cunoaste req/res: primeste
// date simple si arunca AppError pentru situatiile prevazute.
import bcrypt from 'bcrypt';
import { UniqueConstraintError } from 'sequelize';

import { AppError } from '../../utils/app-error.js';
import { Utilizator } from '../utilizatori/utilizator.model.js';

const HTTP_BAD_REQUEST = 400;
const HTTP_CONFLICT = 409;
const BCRYPT_ROUNDS = 10;

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
function findCategorie(email) {
  const domeniu = email.slice(email.lastIndexOf('@') + 1).toLowerCase();
  return CATEGORIE_DUPA_DOMENIU.get(domeniu);
}

/**
 * Datele utilizatorului care pot iesi din server (fara hash-ul parolei).
 * @param {Utilizator} utilizator
 * @returns {{id_utilizator: number, nume: string, email: string,
 *   categorie: string, rol: string}}
 */
function toUtilizatorPublic(utilizator) {
  return {
    id_utilizator: utilizator.id_utilizator,
    nume: utilizator.nume,
    email: utilizator.email,
    categorie: utilizator.categorie,
    rol: utilizator.rol,
  };
}

/**
 * Creeaza contul unui utilizator nou, cu rolul Utilizator.
 * @param {{nume: string, email: string, parola: string}} date
 * @returns {Promise<{id_utilizator: number, nume: string, email: string,
 *   categorie: string, rol: string}>}
 * @throws {AppError} 400 daca e-mailul nu este al USV.
 */
export async function registerUtilizator({ nume, email, parola }) {
  const categorie = findCategorie(email);
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
