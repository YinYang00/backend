import { validationResult } from 'express-validator';

import { AppError } from '../utils/app-error.js';

const HTTP_BAD_REQUEST = 400;

/**
 * Opreste cererea cu 400 daca regulile express-validator de dinainte au gasit
 * date invalide. Mesajul contine prima eroare gasita.
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 */
export function validate(req, _res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const [first] = errors.array();
    throw new AppError(HTTP_BAD_REQUEST, 'DATE_INVALIDE', first.msg);
  }
  next();
}
