// Datele utilizatorilor care pot iesi din server.
import { createEroareNeautentificat } from '../auth/token.service.js';

import { Utilizator } from './utilizator.model.js';

/** @typedef {import('../../utils/app-error.js').AppError} AppError */

/**
 * Datele utilizatorului care pot iesi din server (fara hash-ul parolei).
 * @typedef {{id_utilizator: number, nume: string, email: string,
 *   categorie: string, rol: string}} UtilizatorPublic
 */

/**
 * Pastreaza doar datele publice ale utilizatorului.
 * @param {Utilizator} utilizator
 * @returns {UtilizatorPublic}
 */
export function toUtilizatorPublic(utilizator) {
  return {
    id_utilizator: utilizator.id_utilizator,
    nume: utilizator.nume,
    email: utilizator.email,
    categorie: utilizator.categorie,
    rol: utilizator.rol,
  };
}

/**
 * Profilul utilizatorului autentificat.
 * @param {number} idUtilizator Id-ul din tokenul cererii.
 * @returns {Promise<UtilizatorPublic>}
 * @throws {AppError} 401 daca contul din token nu mai exista.
 */
export async function findProfil(idUtilizator) {
  const utilizator = await Utilizator.findByPk(idUtilizator);
  if (!utilizator) {
    throw createEroareNeautentificat();
  }
  return toUtilizatorPublic(utilizator);
}
