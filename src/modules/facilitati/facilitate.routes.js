import { Router } from 'express';

import { autentificare } from '../../middleware/autentificare.js';
import { doarAdministrator } from '../../middleware/doar-administrator.js';
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
facilitatiRouter.post(
  '/',
  autentificare,
  doarAdministrator,
  facilitateBodyRules,
  validate,
  controller.create,
);
facilitatiRouter.put(
  '/:id_facilitate',
  autentificare,
  doarAdministrator,
  idParamRules,
  facilitateBodyRules,
  validate,
  controller.update,
);
facilitatiRouter.delete(
  '/:id_facilitate',
  autentificare,
  doarAdministrator,
  idParamRules,
  validate,
  controller.remove,
);
