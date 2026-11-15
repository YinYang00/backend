import { Router } from 'express';

import { autentificare } from '../../middleware/autentificare.js';
import { doarAdministrator } from '../../middleware/doar-administrator.js';
import { validate } from '../../middleware/validate.js';
import { idParamRules } from '../facilitati/facilitate.validators.js';

import * as controller from './slot.controller.js';
import { generareBodyRules } from './slot.validators.js';

// Montat sub /facilitati/:id_facilitate/sloturi; mergeParams lasa rutele sa
// vada id_facilitate din calea parinte.
export const sloturiRouter = Router({ mergeParams: true });

sloturiRouter.post(
  '/',
  autentificare,
  doarAdministrator,
  idParamRules,
  generareBodyRules,
  validate,
  controller.create,
);
