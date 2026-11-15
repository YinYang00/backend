import { Router } from 'express';

import { autentificare } from '../../middleware/autentificare.js';
import { validate } from '../../middleware/validate.js';

import * as controller from './rezervare.controller.js';
import { rezervareBodyRules } from './rezervare.validators.js';

export const rezervariRouter = Router();

rezervariRouter.post(
  '/',
  autentificare,
  rezervareBodyRules,
  validate,
  controller.create,
);
