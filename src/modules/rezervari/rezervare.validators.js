// Regulile de validare pentru rutele de rezervari.
import { body, param } from 'express-validator';

export const idRezervareParamRules = [
  param('id_rezervare')
    .isInt({ min: 1 })
    .withMessage('Id-ul rezervarii trebuie sa fie un numar pozitiv.')
    .toInt(),
];

export const rezervareBodyRules = [
  body('id_slot')
    .isInt({ min: 1 })
    .withMessage('Id-ul slotului trebuie sa fie un numar pozitiv.')
    .toInt(),
];
