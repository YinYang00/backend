import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { facilitatiRouter } from './modules/facilitati/facilitate.routes.js';
import { rezervariRouter } from './modules/rezervari/rezervare.routes.js';
import { sloturiRouter } from './modules/sloturi/slot.routes.js';
import { utilizatoriRouter } from './modules/utilizatori/utilizator.routes.js';

const API_PREFIX = '/api/v1';

/**
 * Construieste aplicatia Express, fara sa porneasca serverul (folosita si in
 * teste).
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get(`${API_PREFIX}/health`, (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(`${API_PREFIX}/auth`, authRouter);
  app.use(`${API_PREFIX}/facilitati`, facilitatiRouter);
  app.use(`${API_PREFIX}/facilitati/:id_facilitate/sloturi`, sloturiRouter);
  app.use(`${API_PREFIX}/rezervari`, rezervariRouter);
  app.use(`${API_PREFIX}/utilizatori`, utilizatoriRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
