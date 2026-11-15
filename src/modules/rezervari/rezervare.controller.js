// Controller-ul primeste cererea, apeleaza serviciul si raspunde JSON.
// Erorile ajung in error-handler (Express 5 prinde erorile din async).
import { matchedData } from 'express-validator';

import { createRezervare } from './rezervare.service.js';

const HTTP_CREATED = 201;

/**
 * POST /rezervari
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function create(req, res) {
  const { id_slot: idSlot } = matchedData(req, { locations: ['body'] });
  res
    .status(HTTP_CREATED)
    .json(await createRezervare(req.utilizator.id_utilizator, idSlot));
}
