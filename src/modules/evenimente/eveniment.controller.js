// Fluxul Server-Sent Events, scris direct pe raspuns, fara biblioteca.
import { addConexiune } from './eveniment.service.js';

// Un comentariu periodic tine conexiunea deschisa prin proxy-uri, care inchid
// conexiunile fara trafic.
const INTERVAL_PING_MS = 25_000;

/**
 * GET /evenimente
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 */
export function stream(_req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(': conectat\n\n');
  const ping = setInterval(() => res.write(': ping\n\n'), INTERVAL_PING_MS);
  const removeConexiune = addConexiune((text) => res.write(text));
  res.on('close', () => {
    clearInterval(ping);
    removeConexiune();
  });
}
