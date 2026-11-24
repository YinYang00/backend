import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { Facilitate } from '../src/modules/facilitati/facilitate.model.js';
import { RegulaAcces } from '../src/modules/reguli-acces/regula-acces.model.js';
import { Rezervare } from '../src/modules/rezervari/rezervare.model.js';
import { Slot } from '../src/modules/sloturi/slot.model.js';
import { getAziRomania, toIsoRomania } from '../src/utils/ora-romania.js';
import { createUtilizatorAutentificat } from './setup/utilizator-autentificat.js';

const app = createApp();
const URL = '/api/v1/rezervari';
const ORA_MS = 60 * 60 * 1000;
const ZI_MS = 24 * ORA_MS;

// O singura data pe fisier, ca saptamana sa nu se schimbe in timpul testelor.
const AZI = new Date(`${getAziRomania()}T12:00:00Z`);
const LUNI = 0;
const MIERCURI = 2;
const JOI = 3;
const DUMINICA = 6;

let student;
let tokenStudent;
let bazin;

beforeEach(async () => {
  ({ utilizator: student, token: tokenStudent } =
    await createUtilizatorAutentificat());
  bazin = await createFacilitate('Bazin de inot');
});

/**
 * Creeaza direct in baza o facilitate.
 * @param {string} denumire
 * @returns {Promise<Facilitate>}
 */
function createFacilitate(denumire) {
  return Facilitate.create({
    denumire,
    tip: 'Inot',
    capacitate_maxima: 6,
    locatie: 'Complex sportiv USV',
  });
}

/**
 * Creeaza direct in baza o regula de acces a bazinului.
 * @param {{categorie_utilizator?: string, ore_maxim_saptamana?: number,
 *   zile_avans_maxim?: number}} [limite] Implicit, regula categoriei Student
 *   cu cele mai largi limite posibile.
 * @returns {Promise<RegulaAcces>}
 */
function createRegula(limite) {
  return RegulaAcces.create({
    id_facilitate: bazin.id_facilitate,
    categorie_utilizator: 'Student',
    ore_maxim_saptamana: 168,
    prioritate: 1,
    zile_avans_maxim: 30,
    ...limite,
  });
}

/**
 * Creeaza direct in baza un slot al unei facilitati.
 * @param {Date} inceput
 * @param {{facilitate?: Facilitate, minute?: number}} [optiuni] Implicit, un
 *   slot de o ora al bazinului.
 * @returns {Promise<Slot>}
 */
function createSlot(inceput, { facilitate = bazin, minute = 60 } = {}) {
  return Slot.create({
    id_facilitate: facilitate.id_facilitate,
    ora_inceput: inceput,
    ora_sfarsit: new Date(inceput.getTime() + minute * 60 * 1000),
  });
}

/**
 * Creeaza direct in baza un slot al bazinului, care incepe peste `zile` zile.
 * @param {number} zile
 * @returns {Promise<Slot>}
 */
function createSlotPesteZile(zile) {
  return createSlot(new Date(Date.now() + zile * ZI_MS));
}

/**
 * Momentul unei ore locale dintr-o saptamana viitoare, ora Romaniei.
 * @param {number} zi 0 pentru luni, 6 pentru duminica
 * @param {string} ora `HH:MM`
 * @param {number} [saptamani] peste cate saptamani; cel putin 2, ca momentul
 *   sa fie in viitor si cand testele prind miezul noptii
 * @returns {Date}
 */
function getMoment(zi, ora, saptamani = 2) {
  const ziCurenta = (AZI.getUTCDay() + 6) % 7;
  const tinta = new Date(
    AZI.getTime() + (saptamani * 7 + zi - ziCurenta) * ZI_MS,
  );
  // Offsetul de la pranz e bun pentru orice ora din teste: in ziua in care se
  // schimba ora (duminica, inainte de ora 04:00), testele folosesc doar seara.
  const offset = toIsoRomania(tinta).slice(-6);
  return new Date(`${tinta.toISOString().slice(0, 10)}T${ora}:00${offset}`);
}

let contorCodQr = 0;

/**
 * Creeaza direct in baza o rezervare a studentului.
 * @param {Slot} slot
 * @param {string} [stare]
 * @returns {Promise<Rezervare>}
 */
function createRezervareDirect(slot, stare = 'Confirmata') {
  contorCodQr += 1;
  return Rezervare.create({
    id_utilizator: student.id_utilizator,
    id_slot: slot.id_slot,
    stare_rezervare: stare,
    cod_qr: `TEST-${contorCodQr}`,
  });
}

/**
 * Trimite cererea de rezervare a unui slot.
 * @param {Slot} slot
 * @param {string} [token]
 * @returns {Promise<import('supertest').Response>}
 */
function postRezervare(slot, token = tokenStudent) {
  return request(app)
    .post(URL)
    .set('Authorization', `Bearer ${token}`)
    .send({ id_slot: slot.id_slot });
}

describe('POST /rezervari si zilele maxime in avans', () => {
  it('raspunde 422 PREA_DEVREME pentru un slot dupa zilele in avans', async () => {
    await createRegula({ zile_avans_maxim: 7 });
    const slot = await createSlotPesteZile(10);

    const res = await postRezervare(slot);

    expect(res.status).toBe(422);
    expect(res.body.cod).toBe('PREA_DEVREME');
  });

  it('rezerva un slot din zilele in avans', async () => {
    await createRegula({ zile_avans_maxim: 7 });
    const slot = await createSlotPesteZile(1);

    const res = await postRezervare(slot);

    expect(res.status).toBe(201);
  });

  it('aplica fiecarei categorii regula ei', async () => {
    await createRegula({ zile_avans_maxim: 7 });
    await createRegula({
      categorie_utilizator: 'CadruDidactic',
      zile_avans_maxim: 14,
    });
    const { token: tokenCadruDidactic } = await createUtilizatorAutentificat({
      categorie: 'CadruDidactic',
    });
    const slot = await createSlotPesteZile(10);

    const resCadruDidactic = await postRezervare(slot, tokenCadruDidactic);
    const resStudent = await postRezervare(slot);

    expect(resCadruDidactic.status).toBe(201);
    expect(resStudent.status).toBe(422);
    expect(resStudent.body.cod).toBe('PREA_DEVREME');
  });

  it('nu limiteaza o categorie fara regula', async () => {
    await createRegula({
      categorie_utilizator: 'CadruDidactic',
      zile_avans_maxim: 1,
    });
    const slot = await createSlotPesteZile(100);

    const res = await postRezervare(slot);

    expect(res.status).toBe(201);
  });
});

describe('POST /rezervari si orele maxime pe saptamana', () => {
  it('raspunde 422 LIMITA_SAPTAMANALA peste orele saptamanii', async () => {
    await createRegula({ ore_maxim_saptamana: 2 });
    await createRezervareDirect(await createSlot(getMoment(MIERCURI, '10:00')));
    await createRezervareDirect(
      await createSlot(getMoment(MIERCURI, '11:00')),
      'PrezentaConfirmata',
    );
    const slot = await createSlot(getMoment(JOI, '10:00'));

    const res = await postRezervare(slot);

    expect(res.status).toBe(422);
    expect(res.body.cod).toBe('LIMITA_SAPTAMANALA');
  });

  it('rezerva pana la limita, inclusiv', async () => {
    await createRegula({ ore_maxim_saptamana: 2 });
    await createRezervareDirect(await createSlot(getMoment(MIERCURI, '10:00')));
    const slot = await createSlot(getMoment(JOI, '10:00'));

    const res = await postRezervare(slot);

    expect(res.status).toBe(201);
  });

  it('numara durata sloturilor, nu numarul lor', async () => {
    await createRegula({ ore_maxim_saptamana: 2 });
    await createRezervareDirect(
      await createSlot(getMoment(MIERCURI, '10:00'), { minute: 90 }),
    );
    const slotDe30 = await createSlot(getMoment(JOI, '10:00'), { minute: 30 });
    const slotDe45 = await createSlot(getMoment(JOI, '11:00'), { minute: 45 });

    const resDe45 = await postRezervare(slotDe45);
    const resDe30 = await postRezervare(slotDe30);

    expect(resDe45.status).toBe(422);
    expect(resDe45.body.cod).toBe('LIMITA_SAPTAMANALA');
    expect(resDe30.status).toBe(201);
  });

  it.each(['Anulata', 'Neonorata'])(
    'nu numara rezervarile in starea %s',
    async (stare) => {
      await createRegula({ ore_maxim_saptamana: 2 });
      for (const ora of ['10:00', '11:00']) {
        const rezervat = await createSlot(getMoment(MIERCURI, ora));
        await createRezervareDirect(rezervat, stare);
      }
      const slot = await createSlot(getMoment(JOI, '10:00'));

      const res = await postRezervare(slot);

      expect(res.status).toBe(201);
    },
  );

  it('nu numara rezervarile de la alta facilitate', async () => {
    await createRegula({ ore_maxim_saptamana: 2 });
    const sala = await createFacilitate('Sala fitness');
    for (const ora of ['10:00', '11:00']) {
      const rezervat = await createSlot(getMoment(MIERCURI, ora), {
        facilitate: sala,
      });
      await createRezervareDirect(rezervat);
    }
    const slot = await createSlot(getMoment(JOI, '10:00'));

    const res = await postRezervare(slot);

    expect(res.status).toBe(201);
  });

  it('nu numara rezervarile altui utilizator', async () => {
    await createRegula({ ore_maxim_saptamana: 1 });
    await createRezervareDirect(await createSlot(getMoment(MIERCURI, '10:00')));
    const { token } = await createUtilizatorAutentificat();
    const slot = await createSlot(getMoment(JOI, '10:00'));

    const res = await postRezervare(slot, token);

    expect(res.status).toBe(201);
  });

  // Luni la 00:00 in Romania este inca duminica in UTC, deci cazurile de la
  // marginea saptamanii arata ca saptamana e cea locala.
  it.each([
    [
      'de duminica seara, cu slotul luni',
      [DUMINICA, '23:00', 2],
      [LUNI, '00:00', 3],
    ],
    [
      'de luni, cu slotul duminica seara',
      [LUNI, '00:00', 3],
      [DUMINICA, '23:00', 2],
    ],
    ['de peste o saptamana', [MIERCURI, '10:00', 3], [MIERCURI, '10:00', 2]],
  ])('nu numara rezervarea %s', async (_caz, rezervat, cerut) => {
    await createRegula({ ore_maxim_saptamana: 1 });
    await createRezervareDirect(await createSlot(getMoment(...rezervat)));
    const slot = await createSlot(getMoment(...cerut));

    const res = await postRezervare(slot);

    expect(res.status).toBe(201);
  });

  it.each([
    ['de luni, cu slotul duminica seara', [LUNI, '00:00'], [DUMINICA, '23:00']],
    ['de duminica seara, cu slotul luni', [DUMINICA, '23:00'], [LUNI, '00:00']],
  ])(
    'numara rezervarea %s in aceeasi saptamana',
    async (_caz, rezervat, cerut) => {
      await createRegula({ ore_maxim_saptamana: 1 });
      await createRezervareDirect(await createSlot(getMoment(...rezervat)));
      const slot = await createSlot(getMoment(...cerut));

      const res = await postRezervare(slot);

      expect(res.status).toBe(422);
      expect(res.body.cod).toBe('LIMITA_SAPTAMANALA');
    },
  );

  it('nu limiteaza orele fara regula pentru categoria utilizatorului', async () => {
    await createRegula({
      categorie_utilizator: 'CadruDidactic',
      ore_maxim_saptamana: 1,
    });
    await createRezervareDirect(await createSlot(getMoment(MIERCURI, '10:00')));
    const slot = await createSlot(getMoment(JOI, '10:00'));

    const res = await postRezervare(slot);

    expect(res.status).toBe(201);
  });

  it('accepta doar cererile din limita dintre cele trimise in paralel', async () => {
    await createRegula({ ore_maxim_saptamana: 2 });
    const sloturi = [];
    for (const ora of ['10:00', '11:00', '12:00', '13:00', '14:00']) {
      sloturi.push(await createSlot(getMoment(MIERCURI, ora)));
    }

    const raspunsuri = await Promise.all(
      sloturi.map((slot) => postRezervare(slot)),
    );

    const statusuri = raspunsuri.map((res) => res.status).sort();
    expect(statusuri).toEqual([201, 201, 422, 422, 422]);
  });
});
