import { env } from '../../src/config/env.js';

/**
 * Opreste testele daca baza de date nu este una de test. Testele golesc
 * tabelele, deci nu au voie sa ruleze pe baza de date de dezvoltare.
 * @throws {Error} Daca numele bazei nu se termina in _test.
 */
export function assertBazaTest() {
  if (!env.db.name.endsWith('_test')) {
    throw new Error(
      `Testele ruleaza doar pe o baza *_test (DB_NAME=${env.db.name}).`,
    );
  }
}
