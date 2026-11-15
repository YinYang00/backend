// Ruleaza inaintea fiecarui fisier de test (setupFiles in vitest.config.js):
// fiecare test porneste cu tabelele goale si cu id-urile de la 1.
import { afterAll, beforeEach } from 'vitest';

import { sequelize } from '../../src/config/database.js';
import { MIGRARI_TABLE } from '../../src/config/migrator.js';
import { assertBazaTest } from './baza-test.js';

assertBazaTest();

beforeEach(async () => {
  const [tabele] = await sequelize.query(
    'SELECT tablename FROM pg_tables WHERE schemaname = :schema ' +
      'AND tablename <> :migrari',
    { replacements: { schema: 'public', migrari: MIGRARI_TABLE } },
  );
  if (tabele.length === 0) {
    return;
  }
  const lista = tabele.map(({ tablename }) => `"${tablename}"`).join(', ');
  await sequelize.query(`TRUNCATE ${lista} RESTART IDENTITY CASCADE`);
});

afterAll(async () => {
  await sequelize.close();
});
