// Regulile de validare pentru rutele de rezervari.
import { body } from 'express-validator';

export const rezervareBodyRules = [
  body('id_slot')
    .isInt({ min: 1 })
    .withMessage('Id-ul slotului trebuie sa fie un numar pozitiv.')
    .toInt(),
];
