// Controller-ul primeste cererea, apeleaza serviciul si raspunde JSON.
// Erorile ajung in error-handler (Express 5 prinde erorile din async).
import { matchedData } from 'express-validator';

import { publishSlotActualizat } from '../evenimente/eveniment.service.js';

import {
  cancelRezervare,
  createRezervare,
  findRezervareById,
  findRezervariUtilizator,
} from './rezervare.service.js';

const HTTP_CREATED = 201;

/**
 * GET /rezervari
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function list(req, res) {
  res.json(await findRezervariUtilizator(req.utilizator.id_utilizator));
}

/**
 * GET /rezervari/:id_rezervare
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getById(req, res) {
  const { id_rezervare: idRezervare } = matchedData(req, {
    locations: ['params'],
  });
  res.json(await findRezervareById(idRezervare, req.utilizator));
}

/**
 * POST /rezervari
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function create(req, res) {
  const { id_slot: idSlot } = matchedData(req, { locations: ['body'] });
  const rezervare = await createRezervare(req.utilizator.id_utilizator, idSlot);
  await publishSlotActualizat(idSlot);
  res.status(HTTP_CREATED).json(rezervare);
}

/**
 * POST /rezervari/:id_rezervare/anulare
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function cancel(req, res) {
  const { id_rezervare: idRezervare } = matchedData(req, {
    locations: ['params'],
  });
  const rezervare = await cancelRezervare(idRezervare, req.utilizator);
  await publishSlotActualizat(rezervare.slot.id_slot);
  res.json(rezervare);
}
