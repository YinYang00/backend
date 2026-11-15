import { verifyToken } from '../modules/auth/token.service.js';
import { AppError } from '../utils/app-error.js';

const HTTP_UNAUTHORIZED = 401;
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
    throw new AppError(
      HTTP_UNAUTHORIZED,
      'NEAUTENTIFICAT',
      'Autentifica-te ca sa continui.',
    );
  }
  req.utilizator = utilizator;
  next();
}
