// Tabela rezervare, ca in scriptul din pagina Confluence „Implementarea bazei
// de date”, cu patru diferente: data_crearii este TIMESTAMPTZ, ca in tot
// API-ul; id_slot are ON DELETE RESTRICT, ca stergerea unui slot sau a unei
// facilitati sa nu stearga in tacere rezervarile (si istoricul lor, YT-48); „un utilizator, un slot” este un index unic partial, doar pentru
// rezervarile active, ca o rezervare anulata sa nu blocheze una noua
// (ADR 0003); triggerele de capacitate nu se preiau, capacitatea o verifica
// serviciul de rezervare (ADR 0003).

/**
 * Creeaza tipul stare_rezervare, tabela rezervare si indecsii ei.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function up({ context: sequelize }) {
  await sequelize.query(`
    CREATE TYPE stare_rezervare AS ENUM
      ('Confirmata', 'PrezentaConfirmata', 'Anulata', 'Neonorata')
  `);
  await sequelize.query(`
    CREATE TABLE rezervare (
      id_rezervare     SERIAL PRIMARY KEY,
      id_utilizator    INT NOT NULL
                         REFERENCES utilizator (id_utilizator) ON DELETE CASCADE,
      id_slot          INT NOT NULL
                         REFERENCES slot (id_slot) ON DELETE RESTRICT,
      stare_rezervare  stare_rezervare NOT NULL DEFAULT 'Confirmata',
      cod_qr           VARCHAR(64) NOT NULL UNIQUE,
      data_crearii     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await sequelize.query(`
    CREATE UNIQUE INDEX uq_rezervare_activa ON rezervare (id_utilizator, id_slot)
    WHERE stare_rezervare IN ('Confirmata', 'PrezentaConfirmata')
  `);
  await sequelize.query(
    'CREATE INDEX idx_rezervare_utilizator ON rezervare (id_utilizator)',
  );
  await sequelize.query(
    'CREATE INDEX idx_rezervare_slot ON rezervare (id_slot)',
  );
}

/**
 * Sterge tabela rezervare si tipul stare_rezervare.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function down({ context: sequelize }) {
  await sequelize.query('DROP TABLE rezervare');
  await sequelize.query('DROP TYPE stare_rezervare');
}
