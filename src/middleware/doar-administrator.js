import { AppError } from '../utils/app-error.js';

const HTTP_FORBIDDEN = 403;
const ROL_ADMINISTRATOR = 'Administrator';

/**
 * Lasa cererea sa treaca doar daca utilizatorul curent are rolul
 * `Administrator`. Se foloseste dupa `autentificare`, care pune pe
 * `req.utilizator` rolul din token.
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 * @throws {AppError} 403 ACCES_INTERZIS pentru orice alt rol.
 */
export function doarAdministrator(req, _res, next) {
  if (req.utilizator?.rol !== ROL_ADMINISTRATOR) {
    throw new AppError(
      HTTP_FORBIDDEN,
      'ACCES_INTERZIS',
      'Doar un administrator poate face aceasta operatie.',
    );
  }
  next();
}
