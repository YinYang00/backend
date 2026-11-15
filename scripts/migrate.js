// Ruleaza migrarile care nu au fost inca aplicate pe baza din .env.
import { sequelize } from '../src/config/database.js';
import { migrator } from '../src/config/migrator.js';

const aplicate = await migrator.up();
if (aplicate.length === 0) {
  console.info('Schema este la zi; nu am rulat nicio migrare.');
} else {
  for (const { name } of aplicate) {
    console.info(`Migrare aplicata: ${name}`);
  }
}
await sequelize.close();
