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

// In Express 5 eroarea de pornire (de exemplu portul ocupat) ajunge in
// callback, nu ca exceptie, deci trebuie verificata explicit.
createApp().listen(env.port, (err) => {
  if (err) {
    console.error(
      `Serverul nu a putut porni pe portul ${env.port}: ${err.message}. ` +
        'Opreste aplicatia care foloseste portul sau schimba PORT in .env.',
    );
    process.exit(1);
  }
  console.info(`Server pornit pe http://localhost:${env.port}/api/v1`);
});
