import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { Facilitate } from '../src/modules/facilitati/facilitate.model.js';
import { Rezervare } from '../src/modules/rezervari/rezervare.model.js';
import { Slot } from '../src/modules/sloturi/slot.model.js';
import { createUtilizatorAutentificat } from './setup/utilizator-autentificat.js';

const app = createApp();
const TENIS = {
  denumire: 'Teren tenis',
  tip: 'Sport cu racheta',
  capacitate_maxima: 2,
  locatie: 'Baza sportiva USV',
};
// O zi de iarna departe in viitor: ora Romaniei este UTC+02:00, deci orele
// asteptate (cu offset) se scriu de mana.
const ZI_VIITOARE = '2099-01-15';

/**
 * Creeaza direct in baza un slot de o ora al unei facilitati.
 * @param {number} idFacilitate
 * @param {string} inceput Ora de inceput, ISO 8601 cu offset.
 * @param {string} [stare]
 * @returns {Promise<Slot>}
 */
function createSlotDirect(idFacilitate, inceput, stare) {
  const oraInceput = new Date(inceput);
  return Slot.create({
    id_facilitate: idFacilitate,
    ora_inceput: oraInceput,
    ora_sfarsit: new Date(oraInceput.getTime() + 60 * 60 * 1000),
    ...(stare && { stare }),
  });
}

let contorCodQr = 0;

/**
 * Creeaza direct in baza o rezervare a unui utilizator nou, in starea ceruta.
 * @param {{id_slot: number}} slot
 * @param {string} stare
 * @returns {Promise<Rezervare>}
 */
async function createRezervareDirect(slot, stare) {
  const { utilizator } = await createUtilizatorAutentificat();
  contorCodQr += 1;
  return Rezervare.create({
    id_utilizator: utilizator.id_utilizator,
    id_slot: slot.id_slot,
    stare_rezervare: stare,
    cod_qr: `TEST-${contorCodQr}`,
  });
}

/**
 * Cere, fara token, sloturile unei facilitati dintr-o zi.
 * @param {number} idFacilitate
 * @param {object} query
 * @returns {Promise<import('supertest').Response>}
 */
function getSloturi(idFacilitate, query) {
  return request(app)
    .get(`/api/v1/facilitati/${idFacilitate}/sloturi`)
    .query(query);
}

describe('GET /facilitati/:id_facilitate/sloturi', () => {
  it('listeaza fara token sloturile zilei din ora Romaniei, ordonate dupa ora', async () => {
    const tenis = await Facilitate.create(TENIS);
    const fotbal = await Facilitate.create({ ...TENIS, denumire: 'Fotbal' });
    const slotOra9 = await createSlotDirect(
      tenis.id_facilitate,
      '2099-01-15T09:00:00+02:00',
    );
    // 00:30 in Romania este inca 14 ianuarie in UTC, dar apartine zilei cerute.
    const miezulNoptii = await createSlotDirect(
      tenis.id_facilitate,
      '2099-01-15T00:30:00+02:00',
    );
    await createSlotDirect(tenis.id_facilitate, '2099-01-14T23:30:00+02:00');
    await createSlotDirect(tenis.id_facilitate, '2099-01-16T00:30:00+02:00');
    await createSlotDirect(fotbal.id_facilitate, '2099-01-15T10:00:00+02:00');

    const res = await getSloturi(tenis.id_facilitate, { data: ZI_VIITOARE });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id_slot: miezulNoptii.id_slot,
        id_facilitate: tenis.id_facilitate,
        ora_inceput: '2099-01-15T00:30:00+02:00',
        ora_sfarsit: '2099-01-15T01:30:00+02:00',
        stare: 'Liber',
        locuri_libere: 2,
      },
      {
        id_slot: slotOra9.id_slot,
        id_facilitate: tenis.id_facilitate,
        ora_inceput: '2099-01-15T09:00:00+02:00',
        ora_sfarsit: '2099-01-15T10:00:00+02:00',
        stare: 'Liber',
        locuri_libere: 2,
      },
    ]);
  });

  it('scade din locuri_libere doar rezervarile active', async () => {
    const tenis = await Facilitate.create(TENIS);
    const slot = await createSlotDirect(
      tenis.id_facilitate,
      '2099-01-15T08:00:00+02:00',
    );
    await createRezervareDirect(slot, 'Confirmata');
    await createRezervareDirect(slot, 'Anulata');

    const res = await getSloturi(tenis.id_facilitate, { data: ZI_VIITOARE });

    expect(res.body).toMatchObject([{ stare: 'Liber', locuri_libere: 1 }]);
  });

  it('arata Ocupat cu 0 locuri libere un slot fara locuri', async () => {
    const tenis = await Facilitate.create(TENIS);
    const slot = await createSlotDirect(
      tenis.id_facilitate,
      '2099-01-15T08:00:00+02:00',
    );
    await createRezervareDirect(slot, 'Confirmata');
    await createRezervareDirect(slot, 'PrezentaConfirmata');

    const res = await getSloturi(tenis.id_facilitate, { data: ZI_VIITOARE });

    expect(res.body).toMatchObject([{ stare: 'Ocupat', locuri_libere: 0 }]);
  });

  it('nu arata locuri libere negative dupa scaderea capacitatii', async () => {
    const tenis = await Facilitate.create(TENIS);
    const slot = await createSlotDirect(
      tenis.id_facilitate,
      '2099-01-15T08:00:00+02:00',
    );
    await createRezervareDirect(slot, 'Confirmata');
    await createRezervareDirect(slot, 'Confirmata');
    await tenis.update({ capacitate_maxima: 1 });

    const res = await getSloturi(tenis.id_facilitate, { data: ZI_VIITOARE });

    expect(res.body).toMatchObject([{ stare: 'Ocupat', locuri_libere: 0 }]);
  });

  it('arata Mentenanta un slot blocat, chiar daca e si plin', async () => {
    const tenis = await Facilitate.create({ ...TENIS, capacitate_maxima: 1 });
    const blocat = await createSlotDirect(
      tenis.id_facilitate,
      '2099-01-15T08:00:00+02:00',
      'Mentenanta',
    );
    await createRezervareDirect(blocat, 'Confirmata');

    const res = await getSloturi(tenis.id_facilitate, { data: ZI_VIITOARE });

    expect(res.body).toMatchObject([{ stare: 'Mentenanta', locuri_libere: 0 }]);
  });

  it.each([
    ['lipseste data', {}],
    ['data nu exista in calendar', { data: '2099-02-30' }],
    ['data nu are formatul YYYY-MM-DD', { data: '15.01.2099' }],
    ['data este trimisa de doua ori', { data: [ZI_VIITOARE, ZI_VIITOARE] }],
  ])('raspunde 400 cand %s', async (_caz, query) => {
    const tenis = await Facilitate.create(TENIS);

    const res = await getSloturi(tenis.id_facilitate, query);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      cod: 'DATE_INVALIDE',
      mesaj: 'Campul data trebuie sa fie o data YYYY-MM-DD.',
    });
  });

  it('raspunde 404 pentru o facilitate inexistenta', async () => {
    const res = await getSloturi(999, { data: ZI_VIITOARE });

    expect(res.status).toBe(404);
    expect(res.body.cod).toBe('FACILITATE_NEGASITA');
  });

  it('cuprinde toate cele 25 de ore ale zilei trecerii la ora de iarna', async () => {
    const tenis = await Facilitate.create(TENIS);
    await createSlotDirect(tenis.id_facilitate, '2099-10-25T00:00:00+03:00');
    await createSlotDirect(tenis.id_facilitate, '2099-10-25T23:00:00+02:00');
    await createSlotDirect(tenis.id_facilitate, '2099-10-26T00:00:00+02:00');

    const res = await getSloturi(tenis.id_facilitate, { data: '2099-10-25' });

    expect(res.body.map((slot) => slot.ora_inceput)).toEqual([
      '2099-10-25T00:00:00+03:00',
      '2099-10-25T23:00:00+02:00',
    ]);
  });
});
