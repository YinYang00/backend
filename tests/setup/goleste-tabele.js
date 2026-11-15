// Ruleaza inaintea fiecarui fisier de test (setupFiles in vitest.config.js):
// fiecare test porneste cu tabelele goale si cu id-urile de la 1.
import { afterAll, beforeEach } from 'vitest';

import { sequelize } from '../../src/config/database.js';
import { MIGRARI_TABELA } from '../../src/config/migrator.js';
import { assertBazaTest } from './baza-test.js';

// Verificarea ruleaza si in global-setup.js; aici e repetata pentru ca acest
// fisier goleste tabelele, deci baza de dezvoltare ramane protejata chiar daca
// globalSetup e scos vreodata din vitest.config.js.
assertBazaTest();

beforeEach(async () => {
  const [tabele] = await sequelize.query(
    `SELECT tablename FROM pg_tables
     WHERE schemaname = 'public' AND tablename <> :migrari`,
    { replacements: { migrari: MIGRARI_TABELA } },
  );
  if (tabele.length === 0) {
    return;
  }
  const lista = tabele.map(({ tablename }) => `"${tablename}"`).join(', ');
  await sequelize.query(`TRUNCATE ${lista} RESTART IDENTITY CASCADE`);
});

// Fiecare fisier de test are propria conexiune, pentru ca vitest izoleaza
// fisierele (isolate: true, implicit), deci o poate inchide la final.
afterAll(async () => {
  await sequelize.close();
});
