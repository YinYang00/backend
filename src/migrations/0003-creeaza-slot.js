// Tabela slot, ca in scriptul din pagina Confluence „Implementarea bazei de
// date”, cu doua diferente: orele sunt TIMESTAMPTZ, ca in tot API-ul, iar
// stare_slot are doar valorile pe care le decide administratorul (ADR 0003:
// ocuparea se calculeaza din rezervari, nu se memoreaza). Indexul pe
// (id_facilitate, ora_inceput) il creeaza constrangerea UNIQUE. Constrangerea
// EXCLUDE (extensia btree_gist, ADR 0001) opreste sloturile suprapuse ale
// aceleiasi facilitati, de exemplu cand o zi se genereaza a doua oara cu alta
// durata; altfel un teren s-ar putea rezerva de doua ori in acelasi timp.

/**
 * Creeaza tipul stare_slot si tabela slot.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function up({ context: sequelize }) {
  await sequelize.query('CREATE EXTENSION IF NOT EXISTS btree_gist');
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
      UNIQUE (id_facilitate, ora_inceput),
      EXCLUDE USING gist (
        id_facilitate WITH =,
        tstzrange(ora_inceput, ora_sfarsit) WITH &&
      )
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
