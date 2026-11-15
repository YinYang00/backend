// Tabela slot, ca in scriptul din pagina Confluence „Implementarea bazei de
// date”, cu doua diferente: orele sunt TIMESTAMPTZ, ca in tot API-ul, iar
// stare_slot are doar valorile pe care le decide administratorul (ADR 0003:
// ocuparea se calculeaza din rezervari, nu se memoreaza). Indexul pe
// (id_facilitate, ora_inceput) il creeaza constrangerea UNIQUE.

/**
 * Creeaza tipul stare_slot si tabela slot.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function up({ context: sequelize }) {
  await sequelize.query(`
    CREATE TYPE stare_slot AS ENUM ('Liber', 'Mentenanta')
  `);
  await sequelize.query(`
    CREATE TABLE slot (
      id_slot        SERIAL PRIMARY KEY,
      id_facilitate  INT NOT NULL
                       REFERENCES facilitate (id_facilitate) ON DELETE CASCADE,
      ora_inceput    TIMESTAMPTZ NOT NULL,
      ora_sfarsit    TIMESTAMPTZ NOT NULL,
      stare          stare_slot NOT NULL DEFAULT 'Liber',
      CHECK (ora_sfarsit > ora_inceput),
      UNIQUE (id_facilitate, ora_inceput)
    )
  `);
}

/**
 * Sterge tabela slot si tipul stare_slot.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function down({ context: sequelize }) {
  await sequelize.query('DROP TABLE slot');
  await sequelize.query('DROP TYPE stare_slot');
}
