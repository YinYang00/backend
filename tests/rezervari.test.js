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
 * Creeaza direct in baza un teren si un slot al lui, care incepe peste
 * `oreDeAcum` ore si dureaza o ora.
 * @param {{capacitate?: number, oreDeAcum?: number, stare?: string}} [optiuni]
 * @returns {Promise<{facilitate: Facilitate, slot: Slot}>}
 */
async function createSlot({ capacitate = 1, oreDeAcum = 24, stare } = {}) {
  const facilitate = await Facilitate.create({
    denumire: 'Teren tenis',
    tip: 'Sport cu racheta',
    capacitate_maxima: capacitate,
    locatie: 'Baza sportiva USV',
  });
  // Sloturile incep la ora fixa; rotunjirea tine si raspunsul la secunda.
  const inceput = new Date(
    Math.ceil((Date.now() + oreDeAcum * ORA_MS) / ORA_MS) * ORA_MS,
  );
  const slot = await Slot.create({
    id_facilitate: facilitate.id_facilitate,
    ora_inceput: inceput,
    ora_sfarsit: new Date(inceput.getTime() + ORA_MS),
    ...(stare && { stare }),
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
 * Trimite cererea de rezervare a unui slot.
 * @param {object} corp
 * @param {string | null} [token]
 * @returns {Promise<import('supertest').Response>}
 */
function postRezervare(corp, token = tokenStudent) {
  const cerere = request(app).post(URL);
  if (token) {
    cerere.set('Authorization', `Bearer ${token}`);
  }
  return cerere.send(corp);
}

describe('DELETE /facilitati/:id_facilitate cu rezervari', () => {
  it('raspunde 409 si pastreaza rezervarile facilitatii', async () => {
    const { facilitate, slot } = await createSlot();
    const rezervare = await createRezervareDirect(student, slot, 'Anulata');
    const { token } = await createUtilizatorAutentificat({
      rol: 'Administrator',
    });

    const res = await request(app)
      .delete(`/api/v1/facilitati/${facilitate.id_facilitate}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.cod).toBe('FACILITATE_CU_REZERVARI');
    expect(await Rezervare.findByPk(rezervare.id_rezervare)).not.toBeNull();
  });
});

describe('POST /rezervari', () => {
  it('rezerva un loc intr-un slot liber si raspunde 201 Confirmata', async () => {
    const { facilitate, slot } = await createSlot();

    const res = await postRezervare({ id_slot: slot.id_slot });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id_rezervare: expect.any(Number),
      stare_rezervare: 'Confirmata',
      slot: { id_slot: slot.id_slot },
      facilitate: {
        id_facilitate: facilitate.id_facilitate,
        denumire: 'Teren tenis',
      },
    });
    expect(res.body.cod_qr).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(Date.parse(res.body.slot.ora_inceput)).toBe(
      slot.ora_inceput.getTime(),
    );
    expect(res.body.slot.ora_inceput).toMatch(/[+-]\d{2}:\d{2}$/);
    expect(res.body.data_crearii).toMatch(/[+-]\d{2}:\d{2}$/);
    const salvata = await Rezervare.findByPk(res.body.id_rezervare);
    expect(salvata).toMatchObject({
      id_utilizator: student.id_utilizator,
      id_slot: slot.id_slot,
      stare_rezervare: 'Confirmata',
      cod_qr: res.body.cod_qr,
    });
  });

  it('raspunde 401 pentru tokenul unui cont care a fost sters', async () => {
    const { slot } = await createSlot();
    await student.destroy();

    const res = await postRezervare({ id_slot: slot.id_slot });

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
  });

  it('raspunde 409 SLOT_OCUPAT cand rezervarile active ocupa toate locurile', async () => {
    const { slot } = await createSlot({ capacitate: 2 });
    for (const stare of ['Confirmata', 'PrezentaConfirmata']) {
      const { utilizator } = await createUtilizatorAutentificat();
      await createRezervareDirect(utilizator, slot, stare);
    }

    const res = await postRezervare({ id_slot: slot.id_slot });

    expect(res.status).toBe(409);
    expect(res.body.cod).toBe('SLOT_OCUPAT');
  });

  it('nu numara rezervarile anulate sau neonorate ca locuri ocupate', async () => {
    const { slot } = await createSlot({ capacitate: 1 });
    for (const stare of ['Anulata', 'Neonorata']) {
      const { utilizator } = await createUtilizatorAutentificat();
      await createRezervareDirect(utilizator, slot, stare);
    }

    const res = await postRezervare({ id_slot: slot.id_slot });

    expect(res.status).toBe(201);
  });

  it('lasa utilizatorul sa rezerve din nou un slot dupa o anulare', async () => {
    const { slot } = await createSlot({ capacitate: 1 });
    await createRezervareDirect(student, slot, 'Anulata');

    const res = await postRezervare({ id_slot: slot.id_slot });

    expect(res.status).toBe(201);
  });

  it.each([
    ['in mentenanta', { stare: 'Mentenanta' }],
    ['inceput deja', { oreDeAcum: -1 }],
    ['din trecut', { oreDeAcum: -48 }],
  ])('raspunde 409 SLOT_OCUPAT pentru un slot %s', async (_caz, optiuni) => {
    const { slot } = await createSlot(optiuni);

    const res = await postRezervare({ id_slot: slot.id_slot });

    expect(res.status).toBe(409);
    expect(res.body.cod).toBe('SLOT_OCUPAT');
  });

  it('raspunde 409 REZERVARE_SUPRAPUSA la a doua rezervare pe acelasi slot', async () => {
    const { slot } = await createSlot({ capacitate: 5 });
    await postRezervare({ id_slot: slot.id_slot });

    const res = await postRezervare({ id_slot: slot.id_slot });

    expect(res.status).toBe(409);
    expect(res.body.cod).toBe('REZERVARE_SUPRAPUSA');
  });

  it('raspunde REZERVARE_SUPRAPUSA, nu SLOT_OCUPAT, cand locul e chiar al lui', async () => {
    const { slot } = await createSlot({ capacitate: 1 });
    await createRezervareDirect(student, slot, 'Confirmata');

    const res = await postRezervare({ id_slot: slot.id_slot });

    expect(res.status).toBe(409);
    expect(res.body.cod).toBe('REZERVARE_SUPRAPUSA');
  });

  it('raspunde 404 pentru un slot inexistent', async () => {
    const res = await postRezervare({ id_slot: 999 });

    expect(res.status).toBe(404);
    expect(res.body.cod).toBe('SLOT_NEGASIT');
  });

  it('raspunde 401 fara token', async () => {
    const { slot } = await createSlot();

    const res = await postRezervare({ id_slot: slot.id_slot }, null);

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
  });

  it.each([
    ['lipseste id_slot', {}],
    ['id_slot nu este un numar', { id_slot: 'unu' }],
    ['id_slot nu este pozitiv', { id_slot: 0 }],
  ])('raspunde 400 cand %s', async (_caz, corp) => {
    const res = await postRezervare(corp);

    expect(res.status).toBe(400);
    expect(res.body.cod).toBe('DATE_INVALIDE');
  });
});
