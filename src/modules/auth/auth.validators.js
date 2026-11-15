// Regulile de validare pentru rutele de autentificare, aceleasi limite ca in
// tabela utilizator din PostgreSQL.
import { body } from 'express-validator';

const MAX_NUME = 100;
const MAX_EMAIL = 150;
const MIN_PAROLA = 8;
// bcrypt foloseste doar primii 72 de octeti ai parolei; restul ar fi ignorat
// fara eroare. Se numara octeti, nu caractere: o diacritica ocupa doi.
const MAX_OCTETI_PAROLA = 72;

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
    .withMessage(`Parola are minimum ${MIN_PAROLA} caractere.`)
    .custom((parola) => Buffer.byteLength(parola) <= MAX_OCTETI_PAROLA)
    .withMessage(
      `Parola are maximum ${MAX_OCTETI_PAROLA} de octeti ` +
        '(o litera cu diacritice ocupa doi).',
    ),
];

// La login nu se verifica formatul: o adresa sau o parola gresita primeste
// acelasi 401 ca orice alte date care nu se potrivesc unui cont.
export const loginBodyRules = [
  body('email')
    .isString()
    .withMessage('Campul email este obligatoriu.')
    .trim()
    .toLowerCase(),
  body('parola').isString().withMessage('Campul parola este obligatoriu.'),
];
