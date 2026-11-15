// Tabela facilitate, exact ca in scriptul din pagina Confluence
// „Implementarea bazei de date”.

/**
 * Creeaza tabela facilitate.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function up({ context: sequelize }) {
  await sequelize.query(`
    CREATE TABLE facilitate (
      id_facilitate      SERIAL PRIMARY KEY,
      denumire           VARCHAR(100) NOT NULL UNIQUE,
      tip                VARCHAR(50) NOT NULL,
      capacitate_maxima  INT NOT NULL CHECK (capacitate_maxima > 0),
      locatie            VARCHAR(150) NOT NULL
    )
  `);
}

/**
 * Sterge tabela facilitate.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function down({ context: sequelize }) {
  await sequelize.query('DROP TABLE facilitate');
}
