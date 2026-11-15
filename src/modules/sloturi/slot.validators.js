// Regulile de validare pentru generarea sloturilor. Data si orele sunt in ora
// Romaniei, ca in pagina tichetului YT-44.
import { body } from 'express-validator';

import { getAziRomania } from '../../utils/ora-romania.js';

const FORMAT_DATA = /^\d{4}-\d{2}-\d{2}$/;
const FORMAT_ORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const MINUTE_PE_ORA = 60;
const MESAJ_DATA = 'Campul data trebuie sa fie o data YYYY-MM-DD.';

/**
 * Minutele trecute de la miezul noptii pana la o ora `HH:MM`.
 * @param {string} ora
 * @returns {number}
 */
function toMinute(ora) {
  const [ore, minute] = ora.split(':').map(Number);
  return ore * MINUTE_PE_ORA + minute;
}

/**
 * Valideaza o ora obligatorie in formatul `HH:MM`.
 * @param {string} camp
 * @returns {import('express-validator').ValidationChain}
 */
function requiredOra(camp) {
  const mesaj = `Campul ${camp} trebuie sa fie o ora HH:MM.`;
  return body(camp)
    .isString()
    .withMessage(mesaj)
    .matches(FORMAT_ORA)
    .withMessage(mesaj);
}

/**
 * Cate minute are programul zilei, de la ora de inceput la cea de sfarsit,
 * sau undefined daca una dintre ore lipseste ori e gresita (atunci regula
 * orei respective raporteaza eroarea).
 * @param {object} corp Corpul cererii.
 * @param {unknown} corp.ora_inceput
 * @param {unknown} corp.ora_sfarsit
 * @returns {number | undefined}
 */
function getMinuteProgram({ ora_inceput: inceput, ora_sfarsit: sfarsit }) {
  if (!FORMAT_ORA.test(inceput) || !FORMAT_ORA.test(sfarsit)) {
    return undefined;
  }
  return toMinute(sfarsit) - toMinute(inceput);
}

export const generareBodyRules = [
  body('data')
    .isString()
    .withMessage(MESAJ_DATA)
    .matches(FORMAT_DATA)
    .withMessage(MESAJ_DATA)
    .isISO8601({ strict: true })
    .withMessage(MESAJ_DATA)
    // Comparatia de siruri e corecta pentru formatul YYYY-MM-DD.
    .custom((data) => data >= getAziRomania())
    .withMessage('Nu se pot genera sloturi pentru o zi din trecut.'),
  requiredOra('ora_inceput'),
  requiredOra('ora_sfarsit')
    .custom((_sfarsit, { req }) => {
      const minute = getMinuteProgram(req.body);
      return minute === undefined || minute > 0;
    })
    .withMessage('Ora de sfarsit trebuie sa fie dupa ora de inceput.'),
  body('durata_minute')
    .isInt({ min: 1 })
    .withMessage('Durata trebuie sa fie un numar intreg pozitiv de minute.')
    .toInt()
    .custom((durata, { req }) => {
      const minute = getMinuteProgram(req.body);
      return minute === undefined || durata <= minute;
    })
    .withMessage('Durata nu poate fi mai mare decat programul zilei.'),
];
