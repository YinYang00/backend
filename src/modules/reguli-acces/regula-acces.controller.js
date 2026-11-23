// Controller-ul primeste cererea, apeleaza serviciul si raspunde JSON.
// Erorile ajung in error-handler (Express 5 prinde erorile din async).
import { matchedData } from 'express-validator';

import { CAMPURI_REGULA } from './regula-acces.model.js';
import { findReguliAcces, replaceReguliAcces } from './regula-acces.service.js';

/**
 * GET /facilitati/:id_facilitate/reguli-acces
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function list(req, res) {
  const { id_facilitate: id } = matchedData(req, { locations: ['params'] });
  res.json(await findReguliAcces(id));
}

/**
 * PUT /facilitati/:id_facilitate/reguli-acces
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function replace(req, res) {
  const { id_facilitate: id } = matchedData(req, { locations: ['params'] });
  // Validatorii au verificat si convertit fiecare regula din req.body;
  // campurile in plus se ignora.
  const reguli = req.body.map((regula) =>
    Object.fromEntries(CAMPURI_REGULA.map((camp) => [camp, regula[camp]])),
  );
  res.json(await replaceReguliAcces(id, reguli));
}
