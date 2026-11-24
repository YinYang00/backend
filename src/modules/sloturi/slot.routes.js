import { Router } from 'express';

import { autentificare } from '../../middleware/autentificare.js';
import { doarAdministrator } from '../../middleware/doar-administrator.js';
import { validate } from '../../middleware/validate.js';
import { idParamRules } from '../facilitati/facilitate.validators.js';

import * as controller from './slot.controller.js';
import {
  generareBodyRules,
  idSlotParamRules,
  listareQueryRules,
  stareBodyRules,
} from './slot.validators.js';

// Montat sub /facilitati/:id_facilitate/sloturi; mergeParams lasa rutele sa
// vada id_facilitate din calea parinte.
export const sloturiRouter = Router({ mergeParams: true });

// Publica: oricine vede sloturile zilei, chiar fara cont (YT-46).
sloturiRouter.get(
  '/',
  idParamRules,
  listareQueryRules,
  validate,
  controller.list,
);

sloturiRouter.post(
  '/',
  autentificare,
  doarAdministrator,
  idParamRules,
  generareBodyRules,
  validate,
  controller.create,
);

// Montat sub /sloturi: un slot se adreseaza direct prin id (YT-51).
export const slotRouter = Router();

slotRouter.patch(
  '/:id_slot',
  autentificare,
  doarAdministrator,
  idSlotParamRules,
  stareBodyRules,
  validate,
  controller.update,
);
