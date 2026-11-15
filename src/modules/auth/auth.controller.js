// Controller-ul primeste cererea, apeleaza serviciul si raspunde JSON.
// Erorile ajung in error-handler (Express 5 prinde erorile din async).
import { matchedData } from 'express-validator';

import { loginUtilizator, registerUtilizator } from './auth.service.js';

const HTTP_CREATED = 201;

/**
 * POST /auth/inregistrare
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function register(req, res) {
  const date = matchedData(req, { locations: ['body'] });
  res.status(HTTP_CREATED).json(await registerUtilizator(date));
}

/**
 * POST /auth/login
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function login(req, res) {
  const date = matchedData(req, { locations: ['body'] });
  res.json(await loginUtilizator(date));
}
