// Controller-ul primeste cererea, apeleaza serviciul si raspunde JSON.
import { findProfil } from './utilizator.service.js';

/**
 * GET /utilizatori/me
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export async function getMe(req, res) {
  res.json(await findProfil(req.utilizator.id_utilizator));
}
