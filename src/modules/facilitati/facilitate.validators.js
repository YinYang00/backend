// Regulile de validare pentru rutele de facilitati, aceleasi limite ca in
// tabela facilitate din PostgreSQL.
import { body, param } from 'express-validator';

const MAX_DENUMIRE = 100;
const MAX_TIP = 50;
const MAX_LOCATIE = 150;

/**
 * Valideaza un camp text obligatoriu cu lungime maxima.
 * @param {string} camp
 * @param {number} max
 * @returns {import('express-validator').ValidationChain}
 */
function requiredText(camp, max) {
  return body(camp)
    .isString()
    .withMessage(`Campul ${camp} este obligatoriu.`)
    .trim()
    .notEmpty()
    .withMessage(`Campul ${camp} este obligatoriu.`)
    .isLength({ max })
    .withMessage(`Campul ${camp} are maximum ${max} caractere.`);
}

export const idParamRules = [
  param('id_facilitate')
    .isInt({ min: 1 })
    .withMessage('Id-ul facilitatii trebuie sa fie un numar pozitiv.')
    .toInt(),
];

export const facilitateBodyRules = [
  requiredText('denumire', MAX_DENUMIRE),
  requiredText('tip', MAX_TIP),
  body('capacitate_maxima')
    .isInt({ min: 1 })
    .withMessage('Capacitatea maxima trebuie sa fie un numar intreg pozitiv.')
    .toInt(),
  requiredText('locatie', MAX_LOCATIE),
];
