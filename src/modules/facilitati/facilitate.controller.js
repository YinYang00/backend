// Controller-ul primeste cererea, apeleaza serviciul si raspunde JSON.
// Erorile ajung in error-handler (Express 5 prinde erorile din async).
import { matchedData } from 'express-validator';

import {
  createFacilitate,
  findAllFacilitati,
  findFacilitateById,
  removeFacilitate,
  updateFacilitate,
} from './facilitate.service.js';

const HTTP_CREATED = 201;
const HTTP_NO_CONTENT = 204;

/**
 * GET /facilitati
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
export async function list(_req, res) {
  res.json(await findAllFacilitati());
}

/**
 * GET /facilitati/:id_facilitate
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getById(req, res) {
  const { id_facilitate: id } = matchedData(req, { locations: ['params'] });
  res.json(await findFacilitateById(id));
}

/**
 * POST /facilitati
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function create(req, res) {
  const date = matchedData(req, { locations: ['body'] });
  res.status(HTTP_CREATED).json(await createFacilitate(date));
}

/**
 * PUT /facilitati/:id_facilitate
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function update(req, res) {
  const { id_facilitate: id } = matchedData(req, { locations: ['params'] });
  const date = matchedData(req, { locations: ['body'] });
  res.json(await updateFacilitate(id, date));
}

/**
 * DELETE /facilitati/:id_facilitate
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function remove(req, res) {
  const { id_facilitate: id } = matchedData(req, { locations: ['params'] });
  await removeFacilitate(id);
  res.status(HTTP_NO_CONTENT).end();
}
