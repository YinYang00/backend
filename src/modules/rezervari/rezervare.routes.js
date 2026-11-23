import { Router } from 'express';

import { autentificare } from '../../middleware/autentificare.js';
import { validate } from '../../middleware/validate.js';

import * as controller from './rezervare.controller.js';
import {
  idRezervareParamRules,
  rezervareBodyRules,
} from './rezervare.validators.js';

export const rezervariRouter = Router();

rezervariRouter.get('/', autentificare, controller.list);
rezervariRouter.get(
  '/:id_rezervare',
  autentificare,
  idRezervareParamRules,
  validate,
  controller.getById,
);

rezervariRouter.post(
  '/',
  autentificare,
  rezervareBodyRules,
  validate,
  controller.create,
);
