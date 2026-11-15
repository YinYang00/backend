import { Router } from 'express';

import { validate } from '../../middleware/validate.js';

import * as controller from './auth.controller.js';
import { inregistrareBodyRules } from './auth.validators.js';

export const authRouter = Router();

authRouter.post(
  '/inregistrare',
  inregistrareBodyRules,
  validate,
  controller.register,
);
