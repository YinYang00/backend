// Garantia „zero rezervari suprapuse” pentru acelasi utilizator (pagina
// Confluence „Tehnologii backend”, sectiunea Prevenirea rezervarilor duble).
// O constrangere EXCLUDE poate folosi doar coloanele tabelei, deci intervalul
// orar al slotului se copiaza in rezervare.interval_orar. Il completeaza un
// trigger, nu serviciul, ca nicio cale de INSERT sa nu-l poata gresi.
// Constrangerea este partiala, doar pentru rezervarile active, ca o rezervare
// anulata sa nu blocheze una noua (ADR 0003). Ea acopera si cazul „acelasi
// slot de doua ori”, deci indexul unic uq_rezervare_activa din 0004 dispare.
// shortcut: intervalul nu urmeaza o schimbare ulterioara a orelor slotului;
// azi orele unui slot nu se modifica, la o ruta care le schimba trebuie
// actualizate si rezervarile lui.

/**
 * Adauga interval_orar, triggerul care il completeaza si constrangerea EXCLUDE.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function up({ context: sequelize }) {
  await sequelize.query(
    'ALTER TABLE rezervare ADD COLUMN interval_orar TSTZRANGE',
  );
  await sequelize.query(`
    UPDATE rezervare r
    SET interval_orar = tstzrange(s.ora_inceput, s.ora_sfarsit)
    FROM slot s
    WHERE s.id_slot = r.id_slot
  `);
  await sequelize.query(
    'ALTER TABLE rezervare ALTER COLUMN interval_orar SET NOT NULL',
  );
  await sequelize.query(`
    CREATE FUNCTION completeaza_interval_rezervare() RETURNS trigger AS $$
    BEGIN
      SELECT tstzrange(ora_inceput, ora_sfarsit) INTO NEW.interval_orar
      FROM slot WHERE id_slot = NEW.id_slot;
      RETURN NEW;
    END
    $$ LANGUAGE plpgsql
  `);
  await sequelize.query(`
    CREATE TRIGGER trg_interval_rezervare
    BEFORE INSERT OR UPDATE OF id_slot ON rezervare
    FOR EACH ROW EXECUTE FUNCTION completeaza_interval_rezervare()
  `);
  await sequelize.query(`
    ALTER TABLE rezervare ADD CONSTRAINT ex_rezervare_suprapusa
    EXCLUDE USING gist (id_utilizator WITH =, interval_orar WITH &&)
    WHERE (stare_rezervare IN ('Confirmata', 'PrezentaConfirmata'))
  `);
  await sequelize.query('DROP INDEX uq_rezervare_activa');
}

/**
 * Revine la indexul unic din 0004 si sterge interval_orar cu triggerul lui.
 * @param {object} params
 * @param {import('sequelize').Sequelize} params.context
 */
export async function down({ context: sequelize }) {
  await sequelize.query(`
    CREATE UNIQUE INDEX uq_rezervare_activa ON rezervare (id_utilizator, id_slot)
    WHERE stare_rezervare IN ('Confirmata', 'PrezentaConfirmata')
  `);
  await sequelize.query(
    'ALTER TABLE rezervare DROP CONSTRAINT ex_rezervare_suprapusa',
  );
  await sequelize.query('DROP TRIGGER trg_interval_rezervare ON rezervare');
  await sequelize.query('DROP FUNCTION completeaza_interval_rezervare()');
  await sequelize.query('ALTER TABLE rezervare DROP COLUMN interval_orar');
}
