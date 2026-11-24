// Controller-ul primeste cererea, apeleaza serviciul si raspunde JSON.
// Erorile ajung in error-handler (Express 5 prinde erorile din async).
import { matchedData } from 'express-validator';

import { publishSlotActualizat } from '../evenimente/eveniment.service.js';

import {
  createSloturi,
  findSloturiZi,
  updateStareSlot,
} from './slot.service.js';

const HTTP_CREATED = 201;

/**
 * POST /facilitati/:id_facilitate/sloturi
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function create(req, res) {
  const { id_facilitate: id } = matchedData(req, { locations: ['params'] });
  const programZi = matchedData(req, { locations: ['body'] });
  res.status(HTTP_CREATED).json(await createSloturi(id, programZi));
}

/**
 * GET /facilitati/:id_facilitate/sloturi?data=YYYY-MM-DD
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function list(req, res) {
  const { id_facilitate: id } = matchedData(req, { locations: ['params'] });
  const { data } = matchedData(req, { locations: ['query'] });
  res.json(await findSloturiZi(id, data));
}

/**
 * PATCH /sloturi/:id_slot
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function update(req, res) {
  const { id_slot: id } = matchedData(req, { locations: ['params'] });
  const { stare } = matchedData(req, { locations: ['body'] });
  const slot = await updateStareSlot(id, stare);
  await publishSlotActualizat(id);
  res.json(slot);
}
