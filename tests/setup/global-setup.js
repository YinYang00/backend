import { sequelize } from '../../src/config/database.js';
import { migrator } from '../../src/config/migrator.js';
import { assertBazaTest } from './baza-test.js';

/**
 * Aduce schema bazei de test la zi, o singura data inainte de toate testele.
 */
export default async function setup() {
  assertBazaTest();
  await migrator.up();
  await sequelize.close();
}
