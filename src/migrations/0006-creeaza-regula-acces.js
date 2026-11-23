// Tabela regula_acces, identica cu cea din scriptul din pagina Confluence
// „Implementarea bazei de date”. Indexul pe (id_facilitate,
// categorie_utilizator) il creeaza constrangerea UNIQUE.

/**
 * Creeaza tabela regula_acces.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function up({ context: sequelize }) {
  await sequelize.query(`
    CREATE TABLE regula_acces (
      id_regula             SERIAL PRIMARY KEY,
      id_facilitate         INT NOT NULL
                              REFERENCES facilitate (id_facilitate) ON DELETE CASCADE,
      categorie_utilizator  categorie_utilizator NOT NULL,
      ore_maxim_saptamana   INT NOT NULL CHECK (ore_maxim_saptamana > 0),
      prioritate            INT NOT NULL DEFAULT 1
                              CHECK (prioritate BETWEEN 1 AND 5),
      zile_avans_maxim      INT NOT NULL DEFAULT 7
                              CHECK (zile_avans_maxim BETWEEN 1 AND 30),
      UNIQUE (id_facilitate, categorie_utilizator)
    )
  `);
}

/**
 * Sterge tabela regula_acces.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function down({ context: sequelize }) {
  await sequelize.query('DROP TABLE regula_acces');
}
