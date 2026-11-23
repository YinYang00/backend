// Regulile de validare pentru rutele de rezervari.
import { body, param } from 'express-validator';

// Cel mai mare id pe care il poate avea o coloana SERIAL (INTEGER) din PostgreSQL.
const MAX_ID = 2147483647;

export const idRezervareParamRules = [
  param('id_rezervare')
    .isInt({ min: 1, max: MAX_ID })
    .withMessage('Id-ul rezervarii trebuie sa fie un numar pozitiv.')
    .toInt(),
];

// Cel mai mare id pe care il poate avea o coloana SERIAL (INTEGER) din PostgreSQL.
const MAX_ID = 2147483647;

export const rezervareBodyRules = [
  body('id_slot')
    .isInt({ min: 1, max: MAX_ID })
    .withMessage('Id-ul slotului trebuie sa fie un numar pozitiv.')
    .toInt(),
];
