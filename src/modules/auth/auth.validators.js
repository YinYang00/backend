// Regulile de validare pentru rutele de autentificare, aceleasi limite ca in
// tabela utilizator din PostgreSQL.
import { body } from 'express-validator';

const MAX_NUME = 100;
const MAX_EMAIL = 150;
const MIN_PAROLA = 8;

export const inregistrareBodyRules = [
  body('nume')
    .isString()
    .withMessage('Campul nume este obligatoriu.')
    .trim()
    .notEmpty()
    .withMessage('Campul nume este obligatoriu.')
    .isLength({ max: MAX_NUME })
    .withMessage(`Campul nume are maximum ${MAX_NUME} caractere.`),
  body('email')
    .isString()
    .withMessage('Campul email este obligatoriu.')
    .trim()
    .isEmail()
    .withMessage('Adresa de e-mail nu este valida.')
    // Coloana email e UNIQUE, dar compara cu majuscule; aceeasi adresa se
    // salveaza mereu la fel, ca sa nu poata avea doua conturi.
    .toLowerCase()
    .isLength({ max: MAX_EMAIL })
    .withMessage(`Campul email are maximum ${MAX_EMAIL} caractere.`),
  body('parola')
    .isString()
    .withMessage('Campul parola este obligatoriu.')
    .isLength({ min: MIN_PAROLA })
    .withMessage(`Parola are minimum ${MIN_PAROLA} caractere.`),
];
