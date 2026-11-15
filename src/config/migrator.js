// Schema bazei de date se construieste doar din migrarile din src/migrations
// (ADR 0001). Umzug le ruleaza in ordinea numelui fisierului si tine evidenta
// celor rulate intr-o tabela din aceeasi baza de date.
import { fileURLToPath } from 'node:url';

import { SequelizeStorage, Umzug } from 'umzug';

import { sequelize } from './database.js';

/** Tabela in care Umzug noteaza migrarile deja rulate. */
export const MIGRARI_TABLE = 'SequelizeMeta';

const MIGRARI_DIR = fileURLToPath(new URL('../migrations', import.meta.url));

/**
 * Ruleaza migrarile din src/migrations; fiecare primeste conexiunea Sequelize
 * in `context`.
 * @type {Umzug<import('sequelize').Sequelize>}
 */
export const migrator = new Umzug({
  migrations: { glob: ['*.js', { cwd: MIGRARI_DIR }] },
  context: sequelize,
  storage: new SequelizeStorage({ sequelize, tableName: MIGRARI_TABLE }),
  // Fara logger-ul implicit, care ar scrie obiecte brute in consola si la
  // fiecare rulare a testelor; scripturile isi afiseaza singure rezultatul.
  logger: undefined,
});
