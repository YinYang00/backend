// Tokenurile JWT ale aplicatiei: semnate cu JWT_SECRET, valabile 24h, fara
// refresh token. Contin doar ce trebuie pentru a recunoaste utilizatorul.
import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';
import { AppError } from '../../utils/app-error.js';

const DURATA_TOKEN = '24h';
const HTTP_UNAUTHORIZED = 401;

/**
 * Datele pe care serverul le citeste dintr-un token valid.
 * @typedef {{id_utilizator: number, rol: string}} DateToken
 */

/**
 * Secretul de semnare. Lipsa lui este o greseala de configurare, nu o eroare
 * a clientului.
 * @returns {string}
 */
function getSecret() {
  if (!env.jwtSecret) {
    throw new Error('Variabila de mediu JWT_SECRET nu este setata.');
  }
  return env.jwtSecret;
}

/**
 * Pastreaza doar campurile care intra in token (fara iat si exp la citire).
 * @param {DateToken} sursa
 * @returns {DateToken}
 */
function toDateToken(sursa) {
  return { id_utilizator: sursa.id_utilizator, rol: sursa.rol };
}

/**
 * Creeaza tokenul de autentificare al unui utilizator.
 * @param {DateToken} utilizator
 * @returns {string}
 */
export function createToken(utilizator) {
  return jwt.sign(toDateToken(utilizator), getSecret(), {
    expiresIn: DURATA_TOKEN,
  });
}

/**
 * Eroarea pentru o cerere care nu vine de la un utilizator recunoscut (token
 * lipsa, invalid, expirat sau al unui cont care nu mai exista).
 * @returns {AppError} 401 NEAUTENTIFICAT.
 */
export function createEroareNeautentificat() {
  return new AppError(
    HTTP_UNAUTHORIZED,
    'NEAUTENTIFICAT',
    'Autentifica-te ca sa continui.',
  );
}

/**
 * Verifica semnatura si expirarea unui token.
 * @param {string} token
 * @returns {DateToken | undefined} Datele din token, sau undefined daca
 *   tokenul este invalid ori a expirat.
 */
export function verifyToken(token) {
  try {
    return toDateToken(jwt.verify(token, getSecret()));
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return undefined;
    }
    throw err;
  }
}
