// Punctul de pornire: verifica conexiunea la PostgreSQL si porneste serverul.
import { createApp } from './app.js';
import { sequelize } from './config/database.js';
import { env } from './config/env.js';

try {
  await sequelize.authenticate();
} catch (err) {
  console.error(
    `Nu ma pot conecta la PostgreSQL (${env.db.host}:${env.db.port}/` +
      `${env.db.name}). Verifica fisierul .env.`,
  );
  console.error(err.message);
  process.exit(1);
}

createApp().listen(env.port, () => {
  console.info(`Server pornit pe http://localhost:${env.port}/api/v1`);
});
