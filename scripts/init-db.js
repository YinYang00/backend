// Aduce schema la zi prin migrari (ADR 0001), apoi adauga datele de demo care
// lipsesc (scripts/date-demo.js). Rulat din nou, nu modifica nimic.
import { sequelize } from '../src/config/database.js';
import { runMigrari } from '../src/config/migrator.js';

import { addDateDemo } from './date-demo.js';

try {
  await runMigrari();
  await addDateDemo();
} catch (err) {
  console.error(`Baza de date nu a putut fi pregatita: ${err.message}`);
  console.error('Vezi sectiunea „Instalare” din README.');
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
