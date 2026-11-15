import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { sequelize } from '../src/config/database.js';
import { Facilitate } from '../src/modules/facilitati/facilitate.model.js';
import { createUtilizatorAutentificat } from './setup/utilizator-autentificat.js';

const app = createApp();
const TENIS = {
  denumire: 'Teren tenis',
  tip: 'Sport cu racheta',
  capacitate_maxima: 2,
  locatie: 'Baza sportiva USV',
};
// O zi de iarna din viitor: ora Romaniei este UTC+02:00.
const ZI_VIITOARE = '2030-01-15';
const CERERE = {
  data: ZI_VIITOARE,
  ora_inceput: '08:00',
  ora_sfarsit: '10:00',
  durata_minute: 60,
};

let tokenAdministrator;

beforeEach(async () => {
  ({ token: tokenAdministrator } = await createUtilizatorAutentificat({
    rol: 'Administrator',
  }));
});

/**
 * Trimite cererea de generare a sloturilor pentru o facilitate.
 * @param {number} idFacilitate
 * @param {object} corp
 * @param {string} [token]
 * @returns {Promise<import('supertest').Response>}
 */
function postSloturi(idFacilitate, corp, token = tokenAdministrator) {
  const cerere = request(app).post(
    `/api/v1/facilitati/${idFacilitate}/sloturi`,
  );
  if (token) {
    cerere.set('Authorization', `Bearer ${token}`);
  }
  return cerere.send(corp);
}

describe('POST /facilitati/:id_facilitate/sloturi', () => {
  it('genereaza sloturile consecutive ale intervalului, in ora Romaniei', async () => {
    const tenis = await Facilitate.create(TENIS);

    const res = await postSloturi(tenis.id_facilitate, CERERE);

    expect(res.status).toBe(201);
    expect(res.body).toEqual([
      {
        id_slot: 1,
        id_facilitate: tenis.id_facilitate,
        ora_inceput: '2030-01-15T08:00:00+02:00',
        ora_sfarsit: '2030-01-15T09:00:00+02:00',
        stare: 'Liber',
        locuri_libere: 2,
      },
      {
        id_slot: 2,
        id_facilitate: tenis.id_facilitate,
        ora_inceput: '2030-01-15T09:00:00+02:00',
        ora_sfarsit: '2030-01-15T10:00:00+02:00',
        stare: 'Liber',
        locuri_libere: 2,
      },
    ]);
  });

  it('nu creeaza din nou sloturile care exista deja', async () => {
    const tenis = await Facilitate.create(TENIS);
    await postSloturi(tenis.id_facilitate, CERERE);

    const repetata = await postSloturi(tenis.id_facilitate, CERERE);
    const extinsa = await postSloturi(tenis.id_facilitate, {
      ...CERERE,
      ora_sfarsit: '11:00',
    });

    expect(repetata.status).toBe(201);
    expect(repetata.body).toEqual([]);
    // Criteriul din YT-44 cere explicit „fara duplicate in baza de date”.
    const [[{ numar }]] = await sequelize.query(
      'SELECT COUNT(*)::int AS numar FROM slot',
    );
    expect(numar).toBe(3);
    expect(extinsa.body.map((slot) => slot.ora_inceput)).toEqual([
      '2030-01-15T10:00:00+02:00',
    ]);
  });

  it('nu creeaza sloturi care se suprapun cu cele existente', async () => {
    const tenis = await Facilitate.create(TENIS);
    await postSloturi(tenis.id_facilitate, CERERE);

    const res = await postSloturi(tenis.id_facilitate, {
      ...CERERE,
      ora_sfarsit: '12:00',
      durata_minute: 90,
    });

    // 08:00 exista deja, iar 09:30-11:00 s-ar suprapune cu 09:00-10:00;
    // doar 11:00-12:30 ar depasi programul, deci nu se creeaza nimic.
    expect(res.status).toBe(201);
    expect(res.body).toEqual([]);
  });

  it('nu depaseste ora de sfarsit cu ultimul slot', async () => {
    const tenis = await Facilitate.create(TENIS);

    const res = await postSloturi(tenis.id_facilitate, {
      ...CERERE,
      ora_sfarsit: '10:30',
    });

    expect(res.body.map((slot) => slot.ora_sfarsit)).toEqual([
      '2030-01-15T09:00:00+02:00',
      '2030-01-15T10:00:00+02:00',
    ]);
  });

  it('foloseste ora de vara a Romaniei (UTC+03:00) vara', async () => {
    const tenis = await Facilitate.create(TENIS);

    const res = await postSloturi(tenis.id_facilitate, {
      ...CERERE,
      data: '2030-07-15',
      ora_sfarsit: '09:00',
    });

    expect(res.body.map((slot) => slot.ora_inceput)).toEqual([
      '2030-07-15T08:00:00+03:00',
    ]);
  });

  it.each([
    ['ziua este in trecut', { data: '2020-01-15' }],
    ['lipseste data', { data: undefined }],
    ['data nu exista in calendar', { data: '2030-02-30' }],
    ['data nu are formatul YYYY-MM-DD', { data: '15.01.2030' }],
    ['ora de inceput nu are formatul HH:MM', { ora_inceput: '8' }],
    ['lipseste ora de sfarsit', { ora_sfarsit: undefined }],
    ['sfarsitul este inaintea inceputului', { ora_sfarsit: '07:00' }],
    ['sfarsitul este egal cu inceputul', { ora_sfarsit: '08:00' }],
    ['durata este zero', { durata_minute: 0 }],
    ['durata este negativa', { durata_minute: -60 }],
    ['durata nu este un numar intreg', { durata_minute: 'o ora' }],
    ['durata este mai mare decat intervalul', { durata_minute: 180 }],
  ])('raspunde 400 cand %s', async (_caz, modificare) => {
    const tenis = await Facilitate.create(TENIS);

    const res = await postSloturi(tenis.id_facilitate, {
      ...CERERE,
      ...modificare,
    });

    expect(res.status).toBe(400);
    expect(res.body.cod).toBe('DATE_INVALIDE');
  });

  it('raspunde 400 pentru un corp gol', async () => {
    const tenis = await Facilitate.create(TENIS);

    const res = await postSloturi(tenis.id_facilitate, {});

    expect(res.status).toBe(400);
    expect(res.body.cod).toBe('DATE_INVALIDE');
  });

  it('face sloturi de o ora reala in ziua trecerii la ora de vara', async () => {
    const tenis = await Facilitate.create(TENIS);

    const res = await postSloturi(tenis.id_facilitate, {
      ...CERERE,
      data: '2030-03-31',
      ora_inceput: '02:00',
      ora_sfarsit: '05:00',
    });

    // Ora 03:00 nu exista in aceasta zi: dupa 02:59 urmeaza 04:00.
    expect(res.status).toBe(201);
    expect(
      res.body.map(({ ora_inceput: inceput, ora_sfarsit: sfarsit }) => [
        inceput,
        sfarsit,
      ]),
    ).toEqual([
      ['2030-03-31T02:00:00+02:00', '2030-03-31T04:00:00+03:00'],
      ['2030-03-31T04:00:00+03:00', '2030-03-31T05:00:00+03:00'],
    ]);
  });

  it('face sloturi de o ora reala in ziua trecerii la ora de iarna', async () => {
    const tenis = await Facilitate.create(TENIS);

    const res = await postSloturi(tenis.id_facilitate, {
      ...CERERE,
      data: '2030-10-27',
      ora_inceput: '02:00',
      ora_sfarsit: '05:00',
    });

    // Ora 03:00 apare de doua ori: intai cu +03:00, apoi cu +02:00.
    expect(res.status).toBe(201);
    expect(res.body.map((slot) => slot.ora_inceput)).toEqual([
      '2030-10-27T02:00:00+03:00',
      '2030-10-27T03:00:00+03:00',
      '2030-10-27T03:00:00+02:00',
      '2030-10-27T04:00:00+02:00',
    ]);
  });

  it('raspunde 404 pentru o facilitate inexistenta', async () => {
    const res = await postSloturi(999, CERERE);

    expect(res.status).toBe(404);
    expect(res.body.cod).toBe('FACILITATE_NEGASITA');
  });

  it('raspunde 401 fara token', async () => {
    const tenis = await Facilitate.create(TENIS);

    const res = await postSloturi(tenis.id_facilitate, CERERE, null);

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
  });

  it('raspunde 403 pentru un utilizator obisnuit', async () => {
    const tenis = await Facilitate.create(TENIS);
    const { token } = await createUtilizatorAutentificat();

    const res = await postSloturi(tenis.id_facilitate, CERERE, token);

    expect(res.status).toBe(403);
    expect(res.body.cod).toBe('ACCES_INTERZIS');
  });
});
