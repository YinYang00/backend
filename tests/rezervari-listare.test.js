import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { Facilitate } from '../src/modules/facilitati/facilitate.model.js';
import { Rezervare } from '../src/modules/rezervari/rezervare.model.js';
import { Slot } from '../src/modules/sloturi/slot.model.js';
import { createUtilizatorAutentificat } from './setup/utilizator-autentificat.js';

const app = createApp();
const URL = '/api/v1/rezervari';
const ORA_MS = 60 * 60 * 1000;

let student;
let tokenStudent;

beforeEach(async () => {
  ({ utilizator: student, token: tokenStudent } =
    await createUtilizatorAutentificat());
});

/**
 * Creeaza direct in baza o facilitate si un slot al ei, care incepe peste
 * `oreDeAcum` ore si dureaza o ora. Denumirea facilitatii este unica.
 * @param {{oreDeAcum?: number, denumire?: string}} [optiuni]
 * @returns {Promise<{facilitate: Facilitate, slot: Slot}>}
 */
async function createSlot({ oreDeAcum = 24, denumire = 'Teren tenis' } = {}) {
  const facilitate = await Facilitate.create({
    denumire,
    tip: 'Sport cu racheta',
    capacitate_maxima: 2,
    locatie: 'Baza sportiva USV',
  });
  const inceput = new Date(
    Math.ceil((Date.now() + oreDeAcum * ORA_MS) / ORA_MS) * ORA_MS,
  );
  const slot = await Slot.create({
    id_facilitate: facilitate.id_facilitate,
    ora_inceput: inceput,
    ora_sfarsit: new Date(inceput.getTime() + ORA_MS),
  });
  return { facilitate, slot };
}

let contorCodQr = 0;

/**
 * Creeaza direct in baza o rezervare in starea ceruta.
 * @param {{id_utilizator: number}} utilizator
 * @param {{id_slot: number}} slot
 * @param {string} stare
 * @returns {Promise<Rezervare>}
 */
function createRezervareDirect(utilizator, slot, stare) {
  contorCodQr += 1;
  return Rezervare.create({
    id_utilizator: utilizator.id_utilizator,
    id_slot: slot.id_slot,
    stare_rezervare: stare,
    cod_qr: `TEST-${contorCodQr}`,
  });
}

/**
 * Trimite o cerere GET la rutele de rezervari.
 * @param {string} [cale] partea de dupa /rezervari, de exemplu `/3`
 * @param {string | null} [token]
 * @returns {Promise<import('supertest').Response>}
 */
function getRezervari(cale = '', token = tokenStudent) {
  const cerere = request(app).get(`${URL}${cale}`);
  if (token) {
    cerere.set('Authorization', `Bearer ${token}`);
  }
  return cerere;
}

describe('GET /rezervari', () => {
  it('raspunde doar cu rezervarile utilizatorului, in toate starile, ordonate dupa ora slotului', async () => {
    const { slot: slotPoimaine } = await createSlot({ oreDeAcum: 48 });
    const { facilitate, slot: slotMaine } = await createSlot({
      oreDeAcum: 24,
      denumire: 'Teren baschet',
    });
    const { utilizator: altStudent } = await createUtilizatorAutentificat();
    const rezervarePoimaine = await createRezervareDirect(
      student,
      slotPoimaine,
      'Confirmata',
    );
    const rezervareMaine = await createRezervareDirect(
      student,
      slotMaine,
      'Anulata',
    );
    await createRezervareDirect(altStudent, slotMaine, 'Confirmata');

    const res = await getRezervari();

    expect(res.status).toBe(200);
    expect(res.body.map((rezervare) => rezervare.id_rezervare)).toEqual([
      rezervareMaine.id_rezervare,
      rezervarePoimaine.id_rezervare,
    ]);
    expect(res.body[0]).toEqual({
      id_rezervare: rezervareMaine.id_rezervare,
      stare_rezervare: 'Anulata',
      data_crearii: expect.any(String),
      slot: {
        id_slot: slotMaine.id_slot,
        ora_inceput: expect.any(String),
        ora_sfarsit: expect.any(String),
      },
      facilitate: {
        id_facilitate: facilitate.id_facilitate,
        denumire: 'Teren baschet',
      },
    });
  });

  it('raspunde 401 fara token', async () => {
    const res = await getRezervari('', null);

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
  });
});

describe('GET /rezervari/:id_rezervare', () => {
  it('raspunde 200 cu codul QR pentru o rezervare proprie', async () => {
    const { facilitate, slot } = await createSlot();
    const rezervare = await createRezervareDirect(student, slot, 'Confirmata');

    const res = await getRezervari(`/${rezervare.id_rezervare}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id_rezervare: rezervare.id_rezervare,
      stare_rezervare: 'Confirmata',
      cod_qr: rezervare.cod_qr,
      data_crearii: expect.any(String),
      slot: {
        id_slot: slot.id_slot,
        ora_inceput: expect.any(String),
        ora_sfarsit: expect.any(String),
      },
      facilitate: {
        id_facilitate: facilitate.id_facilitate,
        denumire: 'Teren tenis',
      },
    });
  });

  it('raspunde 404 pentru rezervarea altui utilizator', async () => {
    const { slot } = await createSlot();
    const { utilizator: altStudent } = await createUtilizatorAutentificat();
    const rezervare = await createRezervareDirect(
      altStudent,
      slot,
      'Confirmata',
    );

    const res = await getRezervari(`/${rezervare.id_rezervare}`);

    expect(res.status).toBe(404);
    expect(res.body.cod).toBe('REZERVARE_NEGASITA');
  });

  it('raspunde 200 administratorului pentru rezervarea altui utilizator', async () => {
    const { slot } = await createSlot();
    const rezervare = await createRezervareDirect(student, slot, 'Confirmata');
    const { token } = await createUtilizatorAutentificat({
      rol: 'Administrator',
    });

    const res = await getRezervari(`/${rezervare.id_rezervare}`, token);

    expect(res.status).toBe(200);
    expect(res.body.cod_qr).toBe(rezervare.cod_qr);
  });

  it('raspunde 404 pentru o rezervare inexistenta', async () => {
    const res = await getRezervari('/999');

    expect(res.status).toBe(404);
    expect(res.body.cod).toBe('REZERVARE_NEGASITA');
  });

  it('raspunde 401 fara token', async () => {
    const res = await getRezervari('/1', null);

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
  });

  it.each([
    ['nu este un numar', '/unu'],
    ['nu este pozitiv', '/0'],
  ])('raspunde 400 cand id-ul %s', async (_caz, cale) => {
    const res = await getRezervari(cale);

    expect(res.status).toBe(400);
    expect(res.body.cod).toBe('DATE_INVALIDE');
  });
});
