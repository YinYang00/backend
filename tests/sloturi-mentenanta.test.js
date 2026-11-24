import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { Facilitate } from '../src/modules/facilitati/facilitate.model.js';
import { Rezervare } from '../src/modules/rezervari/rezervare.model.js';
import { Slot } from '../src/modules/sloturi/slot.model.js';
import { createUtilizatorAutentificat } from './setup/utilizator-autentificat.js';

const app = createApp();
const ORA_MS = 60 * 60 * 1000;
// O zi de iarna departe in viitor, pentru listarea sloturilor pe zi.
const ZI_VIITOARE = '2099-01-15';

let tokenAdmin;

beforeEach(async () => {
  ({ token: tokenAdmin } = await createUtilizatorAutentificat({
    rol: 'Administrator',
  }));
});

/**
 * Creeaza direct in baza un teren cu capacitatea 2 si un slot de o ora al lui.
 * @param {string} [stare]
 * @returns {Promise<{facilitate: Facilitate, slot: Slot}>}
 */
async function createSlot(stare = 'Liber') {
  const facilitate = await Facilitate.create({
    denumire: 'Teren tenis',
    tip: 'Sport cu racheta',
    capacitate_maxima: 2,
    locatie: 'Baza sportiva USV',
  });
  const inceput = new Date(`${ZI_VIITOARE}T09:00:00+02:00`);
  const slot = await Slot.create({
    id_facilitate: facilitate.id_facilitate,
    ora_inceput: inceput,
    ora_sfarsit: new Date(inceput.getTime() + ORA_MS),
    stare,
  });
  return { facilitate, slot };
}

let contorCodQr = 0;

/**
 * Creeaza direct in baza o rezervare in starea ceruta.
 * @param {{id_utilizator: number}} utilizator
 * @param {{id_slot: number}} slot
 * @param {string} [stare]
 * @returns {Promise<Rezervare>}
 */
function createRezervareDirect(utilizator, slot, stare = 'Confirmata') {
  contorCodQr += 1;
  return Rezervare.create({
    id_utilizator: utilizator.id_utilizator,
    id_slot: slot.id_slot,
    stare_rezervare: stare,
    cod_qr: `MENTENANTA-${contorCodQr}`,
  });
}

/**
 * Trimite cererea de schimbare a starii unui slot.
 * @param {number | string} idSlot
 * @param {object} corp
 * @param {string | null} [token]
 * @returns {Promise<import('supertest').Response>}
 */
function patchSlot(idSlot, corp, token = tokenAdmin) {
  const cerere = request(app).patch(`/api/v1/sloturi/${idSlot}`).send(corp);
  if (token) {
    cerere.set('Authorization', `Bearer ${token}`);
  }
  return cerere;
}

/**
 * Starile rezervarilor utilizatorului, asa cum le vede el.
 * @param {string} token
 * @returns {Promise<string[]>}
 */
async function getStariRezervari(token) {
  const res = await request(app)
    .get('/api/v1/rezervari')
    .set('Authorization', `Bearer ${token}`);
  return res.body.map((rezervare) => rezervare.stare_rezervare);
}

describe('PATCH /sloturi/:id_slot', () => {
  it('blocheaza slotul pentru mentenanta si anuleaza rezervarile lui active', async () => {
    const { facilitate, slot } = await createSlot();
    const unu = await createUtilizatorAutentificat();
    const doi = await createUtilizatorAutentificat();
    await createRezervareDirect(unu.utilizator, slot);
    await createRezervareDirect(doi.utilizator, slot, 'PrezentaConfirmata');

    const res = await patchSlot(slot.id_slot, { stare: 'Mentenanta' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id_slot: slot.id_slot,
      id_facilitate: facilitate.id_facilitate,
      ora_inceput: '2099-01-15T09:00:00+02:00',
      ora_sfarsit: '2099-01-15T10:00:00+02:00',
      stare: 'Mentenanta',
      locuri_libere: 2,
    });
    expect(await getStariRezervari(unu.token)).toEqual(['Anulata']);
    expect(await getStariRezervari(doi.token)).toEqual(['Anulata']);
  });

  it('dupa blocare slotul apare Mentenanta si refuza rezervarile noi cu 409', async () => {
    const { facilitate, slot } = await createSlot();
    const { token } = await createUtilizatorAutentificat();
    await patchSlot(slot.id_slot, { stare: 'Mentenanta' });

    const rezervare = await request(app)
      .post('/api/v1/rezervari')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_slot: slot.id_slot });
    const lista = await request(app)
      .get(`/api/v1/facilitati/${facilitate.id_facilitate}/sloturi`)
      .query({ data: ZI_VIITOARE });

    expect(rezervare.status).toBe(409);
    expect(rezervare.body.cod).toBe('SLOT_OCUPAT');
    expect(lista.body.map((rand) => rand.stare)).toEqual(['Mentenanta']);
  });

  it('deblocheaza slotul, care se poate rezerva din nou', async () => {
    const { slot } = await createSlot('Mentenanta');
    const { token } = await createUtilizatorAutentificat();

    const res = await patchSlot(slot.id_slot, { stare: 'Liber' });
    const rezervare = await request(app)
      .post('/api/v1/rezervari')
      .set('Authorization', `Bearer ${token}`)
      .send({ id_slot: slot.id_slot });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ stare: 'Liber', locuri_libere: 2 });
    expect(rezervare.status).toBe(201);
  });

  it.each([
    ['Ocupat', { stare: 'Ocupat' }],
    ['lipsa', {}],
    ['lista', { stare: ['Mentenanta'] }],
  ])('raspunde 400 pentru stare %s', async (_caz, corp) => {
    const { slot } = await createSlot();

    const res = await patchSlot(slot.id_slot, corp);

    expect(res.status).toBe(400);
    expect(res.body.cod).toBe('DATE_INVALIDE');
  });

  it('raspunde 404 pentru un slot inexistent', async () => {
    const res = await patchSlot(999, { stare: 'Mentenanta' });

    expect(res.status).toBe(404);
    expect(res.body.cod).toBe('SLOT_NEGASIT');
  });

  it('raspunde 401 fara token', async () => {
    const res = await patchSlot(1, { stare: 'Mentenanta' }, null);

    expect(res.status).toBe(401);
  });

  it('raspunde 403 unui utilizator obisnuit, iar slotul ramane Liber', async () => {
    const { facilitate, slot } = await createSlot();
    const { token } = await createUtilizatorAutentificat();

    const res = await patchSlot(slot.id_slot, { stare: 'Mentenanta' }, token);
    const lista = await request(app)
      .get(`/api/v1/facilitati/${facilitate.id_facilitate}/sloturi`)
      .query({ data: ZI_VIITOARE });

    expect(res.status).toBe(403);
    expect(lista.body.map((rand) => rand.stare)).toEqual(['Liber']);
  });
});
