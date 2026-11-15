import {
  createEroareNeautentificat,
  verifyToken,
} from '../modules/auth/token.service.js';

/** @typedef {import('../utils/app-error.js').AppError} AppError */

const PREFIX_BEARER = 'Bearer ';

/**
 * Lasa cererea sa treaca doar cu un token valid in antetul
 * `Authorization: Bearer <token>` si pune pe `req.utilizator` datele
 * utilizatorului curent (`id_utilizator`, `rol`).
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 * @throws {AppError} 401 daca tokenul lipseste, e invalid sau a expirat.
 */
export function autentificare(req, _res, next) {
  const antet = req.get('Authorization') ?? '';
  const token = antet.startsWith(PREFIX_BEARER)
    ? antet.slice(PREFIX_BEARER.length)
    : '';
  const utilizator = token ? verifyToken(token) : undefined;
  if (!utilizator) {
    throw createEroareNeautentificat();
  }
  req.utilizator = utilizator;
  next();
}
