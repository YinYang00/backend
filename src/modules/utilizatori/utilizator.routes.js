import { Router } from 'express';

import { autentificare } from '../../middleware/autentificare.js';

import * as controller from './utilizator.controller.js';

export const utilizatoriRouter = Router();

utilizatoriRouter.get('/me', autentificare, controller.getMe);
