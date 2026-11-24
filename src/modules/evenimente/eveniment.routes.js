import { Router } from 'express';

import * as controller from './eveniment.controller.js';

export const evenimenteRouter = Router();

// Publica: calendarul se actualizeaza si pentru guest, fara cont (YT-52).
evenimenteRouter.get('/', controller.stream);
