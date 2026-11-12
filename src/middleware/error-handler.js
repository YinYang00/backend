import { AppError } from '../utils/app-error.js';

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_ERROR = 500;

/**
 * Raspunde 404 pentru orice ruta care nu exista.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function notFoundHandler(req, res) {
  res.status(HTTP_NOT_FOUND).json({
    cod: 'RUTA_NEGASITA',
    mesaj: `Ruta ${req.method} ${req.originalUrl} nu exista.`,
  });
}

/**
 * Middleware-ul central de erori. Erorile prevazute (AppError) ajung la client
 * cu codul si mesajul lor; restul se scriu in log si primesc un mesaj generic.
 * @param {Error} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    res.status(err.status).json({ cod: err.cod, mesaj: err.message });
    return;
  }

  // Corp JSON care nu poate fi parsat (trimis gresit de client).
  if (err.type === 'entity.parse.failed') {
    res.status(HTTP_BAD_REQUEST).json({
      cod: 'JSON_INVALID',
      mesaj: 'Corpul cererii nu este un JSON valid.',
    });
    return;
  }

  console.error(err);
  res.status(HTTP_INTERNAL_ERROR).json({
    cod: 'EROARE_SERVER',
    mesaj: 'A aparut o eroare neasteptata. Incearca din nou.',
  });
}
