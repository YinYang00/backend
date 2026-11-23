import { Router } from 'express';

import { autentificare } from '../../middleware/autentificare.js';
import { doarAdministrator } from '../../middleware/doar-administrator.js';
import { validate } from '../../middleware/validate.js';
import { idParamRules } from '../facilitati/facilitate.validators.js';

import * as controller from './regula-acces.controller.js';
import { reguliBodyRules } from './regula-acces.validators.js';

// Montat sub /facilitati/:id_facilitate/reguli-acces; mergeParams lasa rutele
// sa vada id_facilitate din calea parinte. Doar administratorul vede si
// schimba regulile (YT-49).
export const reguliAccesRouter = Router({ mergeParams: true });

reguliAccesRouter.use(autentificare, doarAdministrator);

reguliAccesRouter.get('/', idParamRules, validate, controller.list);
reguliAccesRouter.put(
  '/',
  idParamRules,
  reguliBodyRules,
  validate,
  controller.replace,
);
