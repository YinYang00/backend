import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { Facilitate } from '../src/modules/facilitati/facilitate.model.js';
import { RegulaAcces } from '../src/modules/reguli-acces/regula-acces.model.js';
import { Slot } from '../src/modules/sloturi/slot.model.js';
import { createUtilizatorAutentificat } from './setup/utilizator-autentificat.js';

const ORA_MS = 60 * 60 * 1000;

let server;
let baseUrl;
let conexiune;

beforeAll(async () => {
  // Fluxul SSE ramane deschis, deci testele folosesc un server real, pe un
  // port liber, nu Supertest.
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${server.address().port}/api/v1`;
});

afterEach(async () => {
  await conexiune?.close();
  conexiune = undefined;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

/**
 * Deschide GET /evenimente si citeste evenimentele pe rand, in ordinea in
 * care sosesc. Comentariile (`: ...`) se sar.
 * @returns {Promise<{res: Response,
 *   nextEveniment: () => Promise<{event: string, data: object}>,
 *   close: () => Promise<void>}>}
 */
async function openEvenimente() {
  const res = await fetch(`${baseUrl}/evenimente`);
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  /**
   * Urmatorul bloc separat de o linie goala, fara comentarii.
   * @returns {Promise<string>}
   */
  async function nextBloc() {
    for (;;) {
      const sfarsit = buffer.indexOf('\n\n');
      if (sfarsit >= 0) {
        const bloc = buffer.slice(0, sfarsit);
        buffer = buffer.slice(sfarsit + 2);
        if (!bloc.startsWith(':')) {
          return bloc;
        }
      } else {
        const { value, done } = await reader.read();
        if (done) {
          throw new Error('Fluxul de evenimente s-a inchis.');
        }
        buffer += value;
      }
    }
  }

  return {
    res,
    async nextEveniment() {
      const campuri = Object.fromEntries(
        (await nextBloc()).split('\n').map((linie) => {
          const separator = linie.indexOf(': ');
          return [linie.slice(0, separator), linie.slice(separator + 2)];
        }),
      );
      return { event: campuri.event, data: JSON.parse(campuri.data) };
    },
    close: () => reader.cancel(),
  };
}

/**
 * Creeaza direct in baza un teren cu capacitatea 2 si un slot viitor al lui.
 * @returns {Promise<{facilitate: Facilitate, slot: Slot}>}
 */
async function createSlot() {
  const facilitate = await Facilitate.create({
    denumire: 'Teren tenis',
    tip: 'Sport cu racheta',
    capacitate_maxima: 2,
    locatie: 'Baza sportiva USV',
  });
  const inceput = new Date('2099-01-15T09:00:00+02:00');
  const slot = await Slot.create({
    id_facilitate: facilitate.id_facilitate,
    ora_inceput: inceput,
    ora_sfarsit: new Date(inceput.getTime() + ORA_MS),
  });
  return { facilitate, slot };
}

/**
 * Trimite o cerere JSON cu token.
 * @param {string} metoda
 * @param {string} cale
 * @param {string} token
 * @param {object} [corp]
 * @returns {Promise<Response>}
 */
function sendCerere(metoda, cale, token, corp) {
  return fetch(`${baseUrl}${cale}`, {
    method: metoda,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: corp && JSON.stringify(corp),
  });
}

describe('GET /evenimente', () => {
  it('raspunde 200 cu text/event-stream, fara token', async () => {
    conexiune = await openEvenimente();

    expect(conexiune.res.status).toBe(200);
    expect(conexiune.res.headers.get('content-type')).toMatch(
      /^text\/event-stream/,
    );
  });

  it('trimite slot-actualizat cu un loc liber mai putin dupa o rezervare', async () => {
    const { facilitate, slot } = await createSlot();
    const { token } = await createUtilizatorAutentificat();
    conexiune = await openEvenimente();

    const res = await sendCerere('POST', '/rezervari', token, {
      id_slot: slot.id_slot,
    });

    expect(res.status).toBe(201);
    expect(await conexiune.nextEveniment()).toEqual({
      event: 'slot-actualizat',
      data: {
        id_slot: slot.id_slot,
        id_facilitate: facilitate.id_facilitate,
        stare: 'Liber',
        locuri_libere: 1,
      },
    });
  });

  it('trimite slot-actualizat cu locul eliberat dupa o anulare', async () => {
    const { slot } = await createSlot();
    const { token } = await createUtilizatorAutentificat();
    conexiune = await openEvenimente();
    const rezervare = await sendCerere('POST', '/rezervari', token, {
      id_slot: slot.id_slot,
    });
    const { id_rezervare: idRezervare } = await rezervare.json();
    await conexiune.nextEveniment();

    const res = await sendCerere(
      'POST',
      `/rezervari/${idRezervare}/anulare`,
      token,
    );

    expect(res.status).toBe(200);
    expect((await conexiune.nextEveniment()).data).toMatchObject({
      id_slot: slot.id_slot,
      stare: 'Liber',
      locuri_libere: 2,
    });
  });

  it('trimite slot-actualizat la blocarea si deblocarea slotului', async () => {
    const { slot } = await createSlot();
    const admin = await createUtilizatorAutentificat({ rol: 'Administrator' });
    conexiune = await openEvenimente();

    const blocare = await sendCerere(
      'PATCH',
      `/sloturi/${slot.id_slot}`,
      admin.token,
      { stare: 'Mentenanta' },
    );
    const evenimentBlocare = await conexiune.nextEveniment();
    await sendCerere('PATCH', `/sloturi/${slot.id_slot}`, admin.token, {
      stare: 'Liber',
    });
    const evenimentDeblocare = await conexiune.nextEveniment();

    expect(blocare.status).toBe(200);
    expect(evenimentBlocare.data).toMatchObject({
      id_slot: slot.id_slot,
      stare: 'Mentenanta',
    });
    expect(evenimentDeblocare.data).toMatchObject({
      id_slot: slot.id_slot,
      stare: 'Liber',
    });
  });

  it('nu trimite nimic pentru o rezervare refuzata cu 409 sau 422', async () => {
    const { facilitate, slot } = await createSlot();
    const altSlot = await Slot.create({
      id_facilitate: facilitate.id_facilitate,
      ora_inceput: new Date('2099-01-15T11:00:00+02:00'),
      ora_sfarsit: new Date('2099-01-15T12:00:00+02:00'),
    });
    const student = await createUtilizatorAutentificat();
    const admin = await createUtilizatorAutentificat({ rol: 'Administrator' });
    await RegulaAcces.create({
      id_facilitate: facilitate.id_facilitate,
      categorie_utilizator: 'Student',
      ore_maxim_saptamana: 168,
      prioritate: 1,
      zile_avans_maxim: 1,
    });
    await sendCerere('PATCH', `/sloturi/${slot.id_slot}`, admin.token, {
      stare: 'Mentenanta',
    });
    conexiune = await openEvenimente();

    const ocupat = await sendCerere('POST', '/rezervari', student.token, {
      id_slot: slot.id_slot,
    });
    const preaDevreme = await sendCerere('POST', '/rezervari', student.token, {
      id_slot: altSlot.id_slot,
    });
    // Urmatorul eveniment primit trebuie sa fie al acestei blocari, nu al
    // cererilor refuzate.
    await sendCerere('PATCH', `/sloturi/${altSlot.id_slot}`, admin.token, {
      stare: 'Mentenanta',
    });

    expect(ocupat.status).toBe(409);
    expect(preaDevreme.status).toBe(422);
    expect((await conexiune.nextEveniment()).data.id_slot).toBe(
      altSlot.id_slot,
    );
  });
});
