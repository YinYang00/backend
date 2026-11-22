// Pregateste backend-ul dupa clonare: creeaza .env daca lipseste, asteapta
// baza de date, apoi ruleaza `npm run db:init` (migrarile si datele de demo).
// Rulat din nou, nu modifica nimic.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { setTimeout as wait } from 'node:timers/promises';

const ENV = new URL('../.env', import.meta.url);
const ENV_EXEMPLU = new URL('../.env.example', import.meta.url);
// Aceeasi parola ca valoarea implicita din docker-compose.yml.
const PAROLA_DOCKER = 'postgres';
const PORT_DOCKER = 5432;
const OCTETI_SECRET = 32;
// Containerul porneste in cateva secunde; dupa 30 de incercari renuntam.
const INCERCARI = 30;
const PAUZA_MS = 1000;

/**
 * Creeaza .env din .env.example, cu parola bazei din Docker si un JWT_SECRET
 * aleator. Un .env existent nu se modifica.
 */
function createEnv() {
  if (existsSync(ENV)) {
    console.info('Fisierul .env exista deja; nu l-am modificat.');
    return;
  }
  const secret = randomBytes(OCTETI_SECRET).toString('hex');
  const continut = readFileSync(ENV_EXEMPLU, 'utf8')
    .replace(/^DB_PASSWORD=.*$/m, `DB_PASSWORD=${PAROLA_DOCKER}`)
    .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`)
    // Portul ales la `docker compose up -d` cand 5432 este ocupat (README).
    .replace(/^DB_PORT=.*$/m, `DB_PORT=${process.env.DB_PORT ?? PORT_DOCKER}`);
  writeFileSync(ENV, continut);
  console.info('Am creat .env (parola bazei din Docker si un JWT_SECRET nou).');
}

/**
 * Asteapta pana cand baza de date accepta conexiuni.
 * @param {import('sequelize').Sequelize} sequelize
 * @returns {Promise<void>}
 * @throws {Error} Eroarea ultimei incercari, daca baza nu porneste la timp.
 */
async function waitForBaza(sequelize) {
  for (let incercare = 1; ; incercare += 1) {
    try {
      await sequelize.authenticate();
      return;
    } catch (err) {
      if (incercare === INCERCARI) {
        throw err;
      }
      if (incercare === 1) {
        console.info('Astept pornirea bazei de date...');
      }
      await wait(PAUZA_MS);
    }
  }
}

createEnv();

// Importat abia dupa crearea .env, pentru ca env.js citeste .env la import.
const { sequelize } = await import('../src/config/database.js');
try {
  await waitForBaza(sequelize);
  // init-db.js ruleaza migrarile si datele de demo, apoi inchide conexiunea.
  await import('./init-db.js');
} catch (err) {
  console.error(`Nu m-am putut conecta la baza de date: ${err.message}`);
  console.error(
    'Porneste PostgreSQL cu `docker compose up -d`, apoi ruleaza din nou `npm run setup`.',
  );
  process.exitCode = 1;
  await sequelize.close();
}
