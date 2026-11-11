import { Router } from 'express';

import { validate } from '../../middleware/validate.js';

import * as controller from './facilitate.controller.js';
import { facilitateBodyRules, idParamRules } from './facilitate.validators.js';

export const facilitatiRouter = Router();

facilitatiRouter.get('/', controller.list);
facilitatiRouter.get(
  '/:id_facilitate',
  idParamRules,
  validate,
  controller.getById,
);
facilitatiRouter.post('/', facilitateBodyRules, validate, controller.create);
facilitatiRouter.put(
  '/:id_facilitate',
  idParamRules,
  facilitateBodyRules,
  validate,
  controller.update,
);
facilitatiRouter.delete(
  '/:id_facilitate',
  idParamRules,
  validate,
  controller.remove,
);
