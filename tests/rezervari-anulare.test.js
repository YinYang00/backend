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
// O zi de iarna departe in viitor, pentru listarea sloturilor pe zi.
const ZI_VIITOARE = '2099-01-15';

let student;
let tokenStudent;

beforeEach(async () => {
  ({ utilizator: student, token: tokenStudent } =
    await createUtilizatorAutentificat());
});

/**
 * Creeaza direct in baza un teren cu capacitatea 2 si un slot de o ora al lui.
 * @param {Date} [inceput] ora de inceput a slotului
 * @returns {Promise<{facilitate: Facilitate, slot: Slot}>}
 */
async function createSlot(inceput = new Date(`${ZI_VIITOARE}T09:00:00+02:00`)) {
  const facilitate = await Facilitate.create({
    denumire: 'Teren tenis',
    tip: 'Sport cu racheta',
    capacitate_maxima: 2,
    locatie: 'Baza sportiva USV',
  });
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
 * @param {string} [stare]
 * @returns {Promise<Rezervare>}
 */
function createRezervareDirect(utilizator, slot, stare = 'Confirmata') {
  contorCodQr += 1;
  return Rezervare.create({
    id_utilizator: utilizator.id_utilizator,
    id_slot: slot.id_slot,
    stare_rezervare: stare,
    cod_qr: `TEST-${contorCodQr}`,
  });
}

/**
 * Trimite cererea de anulare a unei rezervari.
 * @param {number | string} idRezervare
 * @param {string | null} [token]
 * @returns {Promise<import('supertest').Response>}
 */
function postAnulare(idRezervare, token = tokenStudent) {
  const cerere = request(app).post(`${URL}/${idRezervare}/anulare`);
  if (token) {
    cerere.set('Authorization', `Bearer ${token}`);
  }
  return cerere;
}

/**
 * Locurile libere ale slotului, asa cum le vede un guest in lista zilei.
 * @param {Facilitate} facilitate
 * @param {Slot} slot
 * @returns {Promise<number>}
 */
async function getLocuriLibere(facilitate, slot) {
  const res = await request(app)
    .get(`/api/v1/facilitati/${facilitate.id_facilitate}/sloturi`)
    .query({ data: ZI_VIITOARE });
  return res.body.find((rand) => rand.id_slot === slot.id_slot).locuri_libere;
}

describe('POST /rezervari/:id_rezervare/anulare', () => {
  it('raspunde 200 cu rezervarea Anulata, iar slotul are un loc liber in plus', async () => {
    const { facilitate, slot } = await createSlot();
    const rezervare = await createRezervareDirect(student, slot);
    expect(await getLocuriLibere(facilitate, slot)).toBe(1);

    const res = await postAnulare(rezervare.id_rezervare);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id_rezervare: rezervare.id_rezervare,
      stare_rezervare: 'Anulata',
      cod_qr: rezervare.cod_qr,
      data_crearii: expect.any(String),
      slot: {
        id_slot: slot.id_slot,
        ora_inceput: '2099-01-15T09:00:00+02:00',
        ora_sfarsit: '2099-01-15T10:00:00+02:00',
      },
      facilitate: {
        id_facilitate: facilitate.id_facilitate,
        denumire: 'Teren tenis',
      },
    });
    expect(await getLocuriLibere(facilitate, slot)).toBe(2);
  });

  it('permite aceluiasi utilizator sa rezerve din nou slotul dupa anulare', async () => {
    const { slot } = await createSlot();
    const rezervare = await createRezervareDirect(student, slot);
    await postAnulare(rezervare.id_rezervare);

    const res = await request(app)
      .post(URL)
      .set('Authorization', `Bearer ${tokenStudent}`)
      .send({ id_slot: slot.id_slot });

    expect(res.status).toBe(201);
    expect(res.body.stare_rezervare).toBe('Confirmata');
  });

  it('raspunde 404 pentru rezervarea altui utilizator, care ramane Confirmata', async () => {
    const { slot } = await createSlot();
    const { utilizator: altStudent, token: tokenAltStudent } =
      await createUtilizatorAutentificat();
    const rezervare = await createRezervareDirect(altStudent, slot);

    const res = await postAnulare(rezervare.id_rezervare);

    expect(res.status).toBe(404);
    expect(res.body.cod).toBe('REZERVARE_NEGASITA');
    const detalii = await request(app)
      .get(`${URL}/${rezervare.id_rezervare}`)
      .set('Authorization', `Bearer ${tokenAltStudent}`);
    expect(detalii.body.stare_rezervare).toBe('Confirmata');
  });

  it('raspunde 200 administratorului care anuleaza rezervarea altui utilizator', async () => {
    const { slot } = await createSlot();
    const rezervare = await createRezervareDirect(student, slot);
    const { token } = await createUtilizatorAutentificat({
      rol: 'Administrator',
    });

    const res = await postAnulare(rezervare.id_rezervare, token);

    expect(res.status).toBe(200);
    expect(res.body.stare_rezervare).toBe('Anulata');
  });

  it('raspunde 409 ANULARE_TARZIE dupa inceputul slotului', async () => {
    const { slot } = await createSlot(new Date(Date.now() - ORA_MS / 2));
    const rezervare = await createRezervareDirect(
      student,
      slot,
      'PrezentaConfirmata',
    );

    const res = await postAnulare(rezervare.id_rezervare);

    expect(res.status).toBe(409);
    expect(res.body.cod).toBe('ANULARE_TARZIE');
  });

  it.each(['Anulata', 'Neonorata'])(
    'raspunde 409 REZERVARE_INACTIVA pentru o rezervare %s',
    async (stare) => {
      const { slot } = await createSlot();
      const rezervare = await createRezervareDirect(student, slot, stare);

      const res = await postAnulare(rezervare.id_rezervare);

      expect(res.status).toBe(409);
      expect(res.body.cod).toBe('REZERVARE_INACTIVA');
    },
  );

  it('raspunde 404 pentru o rezervare inexistenta', async () => {
    const res = await postAnulare(999);

    expect(res.status).toBe(404);
    expect(res.body.cod).toBe('REZERVARE_NEGASITA');
  });

  it('raspunde 401 fara token', async () => {
    const res = await postAnulare(1, null);

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
  });

  it.each([
    ['nu este un numar', 'unu'],
    ['depaseste un INTEGER din PostgreSQL', '2147483648'],
  ])('raspunde 400 cand id-ul %s', async (_caz, idRezervare) => {
    const res = await postAnulare(idRezervare);

    expect(res.status).toBe(400);
    expect(res.body.cod).toBe('DATE_INVALIDE');
  });
});
