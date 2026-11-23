// Regulile de validare pentru PUT /facilitati/:id_facilitate/reguli-acces:
// limitele din tabela regula_acces (migrarea 0006), plus o limita de sus
// pentru ore_maxim_saptamana, ca o valoare prea mare sa dea 400, nu 500.
import { body } from 'express-validator';

import { CATEGORII_UTILIZATOR } from './regula-acces.model.js';

const MAX_PRIORITATE = 5;
const MAX_ZILE_AVANS = 30;
const MESAJ_CATEGORIE = `Campul categorie_utilizator trebuie sa fie una dintre: ${CATEGORII_UTILIZATOR.join(', ')}.`;
// Orele unei saptamani: o limita mai mare nu ar limita nimic.
const MAX_ORE_SAPTAMANA = 7 * 24;

/**
 * Inceputul regulilor pentru un camp din fiecare regula a listei. Opreste
 * listele: validatorii express-validator verifica o lista element cu element,
 * deci `[]` sau `[6]` ar trece drept valori valide.
 * @param {string} camp
 * @param {string} mesaj
 * @returns {import('express-validator').ValidationChain}
 */
function campInRegula(camp, mesaj) {
  return body(`*.${camp}`)
    .custom((valoare) => !Array.isArray(valoare))
    .withMessage(mesaj)
    .bail();
}

/**
 * Valideaza un camp intreg obligatoriu din fiecare regula a listei.
 * @param {string} camp
 * @param {{min: number, max?: number}} limite
 * @param {string} mesaj
 * @returns {import('express-validator').ValidationChain}
 */
function intregInRegula(camp, limite, mesaj) {
  return campInRegula(camp, mesaj).isInt(limite).withMessage(mesaj).toInt();
}

/**
 * Verifica faptul ca fiecare categorie apare cel mult o data in lista.
 * @param {Array<{categorie_utilizator: string}>} reguli
 * @returns {boolean}
 * @throws {Error} Daca o categorie se repeta.
 */
function categoriiUnice(reguli) {
  const categorii = reguli.map((regula) => regula.categorie_utilizator);
  if (new Set(categorii).size !== categorii.length) {
    throw new Error('Fiecare categorie poate avea o singura regula.');
  }
  return true;
}

/**
 * Un obiect JSON simplu (nu lista, nu null).
 * @param {unknown} valoare
 * @returns {boolean}
 */
function isObiect(valoare) {
  return (
    typeof valoare === 'object' && valoare !== null && !Array.isArray(valoare)
  );
}

export const reguliBodyRules = [
  body()
    .isArray()
    .withMessage('Corpul cererii trebuie sa fie o lista de reguli.')
    .bail()
    .custom((reguli) => reguli.every((regula) => isObiect(regula)))
    .withMessage('Fiecare regula trebuie sa fie un obiect.')
    .bail()
    .custom(categoriiUnice),
  campInRegula('categorie_utilizator', MESAJ_CATEGORIE)
    .isIn(CATEGORII_UTILIZATOR)
    .withMessage(MESAJ_CATEGORIE),
  intregInRegula(
    'ore_maxim_saptamana',
    { min: 1, max: MAX_ORE_SAPTAMANA },
    `Campul ore_maxim_saptamana trebuie sa fie un numar intreg intre 1 si ${MAX_ORE_SAPTAMANA}.`,
  ),
  intregInRegula(
    'prioritate',
    { min: 1, max: MAX_PRIORITATE },
    `Campul prioritate trebuie sa fie un numar intreg intre 1 si ${MAX_PRIORITATE}.`,
  ),
  intregInRegula(
    'zile_avans_maxim',
    { min: 1, max: MAX_ZILE_AVANS },
    `Campul zile_avans_maxim trebuie sa fie un numar intreg intre 1 si ${MAX_ZILE_AVANS}.`,
  ),
];
