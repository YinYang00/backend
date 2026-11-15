// Ruleaza migrarile care nu au fost inca aplicate pe baza din .env.
import { sequelize } from '../src/config/database.js';
import { runMigrari } from '../src/config/migrator.js';

try {
  await runMigrari();
} catch (err) {
  console.error(`Migrarile nu au putut fi aplicate: ${err.message}`);
  console.error('Vezi sectiunea „Baza de date si migrarile” din README.');
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
