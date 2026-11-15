// Tabela utilizator si tipurile ei enumerate, ca in scriptul din pagina
// Confluence „Implementarea bazei de date”. Orele sunt TIMESTAMPTZ, ca in tot
// API-ul (ISO 8601 cu offset).

/**
 * Creeaza tipurile categorie_utilizator si rol_utilizator si tabela
 * utilizator.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function up({ context: sequelize }) {
  await sequelize.query(`
    CREATE TYPE categorie_utilizator AS ENUM
      ('Student', 'CadruDidactic', 'PersonalAdministrativ')
  `);
  await sequelize.query(`
    CREATE TYPE rol_utilizator AS ENUM ('Utilizator', 'Administrator')
  `);
  await sequelize.query(`
    CREATE TABLE utilizator (
      id_utilizator  SERIAL PRIMARY KEY,
      nume           VARCHAR(100) NOT NULL,
      email          VARCHAR(150) NOT NULL UNIQUE,
      parola_hash    VARCHAR(255) NOT NULL,
      categorie      categorie_utilizator NOT NULL,
      rol            rol_utilizator NOT NULL DEFAULT 'Utilizator',
      data_crearii   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Sterge tabela utilizator si tipurile ei enumerate.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function down({ context: sequelize }) {
  await sequelize.query('DROP TABLE utilizator');
  await sequelize.query('DROP TYPE rol_utilizator');
  await sequelize.query('DROP TYPE categorie_utilizator');
}
