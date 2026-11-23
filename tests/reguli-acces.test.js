import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { Facilitate } from '../src/modules/facilitati/facilitate.model.js';
import { createUtilizatorAutentificat } from './setup/utilizator-autentificat.js';

const app = createApp();
const BAZIN = {
  denumire: 'Bazin de inot',
  tip: 'Inot',
  capacitate_maxima: 6,
  locatie: 'Complex sportiv USV',
};
const REGULA_STUDENT = {
  categorie_utilizator: 'Student',
  ore_maxim_saptamana: 6,
  prioritate: 2,
  zile_avans_maxim: 7,
};
const REGULA_CADRU_DIDACTIC = {
  categorie_utilizator: 'CadruDidactic',
  ore_maxim_saptamana: 8,
  prioritate: 1,
  zile_avans_maxim: 14,
};

let tokenAdministrator;

beforeEach(async () => {
  ({ token: tokenAdministrator } = await createUtilizatorAutentificat({
    rol: 'Administrator',
  }));
});

/**
 * Inlocuieste regulile de acces ale unei facilitati prin API.
 * @param {number} idFacilitate
 * @param {unknown} reguli
 * @param {string} [token]
 * @returns {Promise<import('supertest').Response>}
 */
function putReguli(idFacilitate, reguli, token = tokenAdministrator) {
  const cerere = request(app).put(
    `/api/v1/facilitati/${idFacilitate}/reguli-acces`,
  );
  if (token) {
    cerere.set('Authorization', `Bearer ${token}`);
  }
  return cerere.send(reguli);
}

/**
 * Citeste regulile de acces ale unei facilitati prin API.
 * @param {number} idFacilitate
 * @param {string} [token]
 * @returns {Promise<import('supertest').Response>}
 */
function getReguli(idFacilitate, token = tokenAdministrator) {
  const cerere = request(app).get(
    `/api/v1/facilitati/${idFacilitate}/reguli-acces`,
  );
  if (token) {
    cerere.set('Authorization', `Bearer ${token}`);
  }
  return cerere;
}

describe('PUT si GET /facilitati/:id_facilitate/reguli-acces', () => {
  it('salveaza regulile trimise, iar GET le returneaza', async () => {
    const bazin = await Facilitate.create(BAZIN);

    const put = await putReguli(bazin.id_facilitate, [
      REGULA_STUDENT,
      REGULA_CADRU_DIDACTIC,
    ]);
    const get = await getReguli(bazin.id_facilitate);

    expect(put.status).toBe(200);
    expect(get.status).toBe(200);
    expect(get.body).toEqual([REGULA_STUDENT, REGULA_CADRU_DIDACTIC]);
  });

  it('inlocuieste regulile vechi, nu le adauga pe cele noi', async () => {
    const bazin = await Facilitate.create(BAZIN);
    await putReguli(bazin.id_facilitate, [
      REGULA_STUDENT,
      REGULA_CADRU_DIDACTIC,
    ]);

    const put = await putReguli(bazin.id_facilitate, [REGULA_CADRU_DIDACTIC]);
    const get = await getReguli(bazin.id_facilitate);

    expect(put.body).toEqual([REGULA_CADRU_DIDACTIC]);
    expect(get.body).toEqual([REGULA_CADRU_DIDACTIC]);
  });

  it.each([
    ['categoria se repeta', [REGULA_STUDENT, REGULA_STUDENT]],
    [
      'categoria nu exista',
      [{ ...REGULA_STUDENT, categorie_utilizator: 'Profesor' }],
    ],
    ['zile_avans_maxim este 0', [{ ...REGULA_STUDENT, zile_avans_maxim: 0 }]],
    ['zile_avans_maxim este 31', [{ ...REGULA_STUDENT, zile_avans_maxim: 31 }]],
    ['prioritate este 6', [{ ...REGULA_STUDENT, prioritate: 6 }]],
    ['prioritate este 0', [{ ...REGULA_STUDENT, prioritate: 0 }]],
    [
      'ore_maxim_saptamana este 0',
      [{ ...REGULA_STUDENT, ore_maxim_saptamana: 0 }],
    ],
    [
      'ore_maxim_saptamana nu este intreg',
      [{ ...REGULA_STUDENT, ore_maxim_saptamana: 1.5 }],
    ],
    ['lipseste prioritate', [{ ...REGULA_STUDENT, prioritate: undefined }]],
    ['prioritate este o lista goala', [{ ...REGULA_STUDENT, prioritate: [] }]],
    [
      'ore_maxim_saptamana este o lista',
      [{ ...REGULA_STUDENT, ore_maxim_saptamana: [6] }],
    ],
    [
      'categoria este o lista',
      [{ ...REGULA_STUDENT, categorie_utilizator: ['Student'] }],
    ],
    [
      'ore_maxim_saptamana depaseste orele unei saptamani',
      [{ ...REGULA_STUDENT, ore_maxim_saptamana: 169 }],
    ],
    ['corpul nu este o lista', REGULA_STUDENT],
    ['un element nu este obiect', ['Student']],
  ])('raspunde 400 cand %s, iar regulile vechi raman', async (_caz, reguli) => {
    const bazin = await Facilitate.create(BAZIN);
    await putReguli(bazin.id_facilitate, [REGULA_CADRU_DIDACTIC]);

    const put = await putReguli(bazin.id_facilitate, reguli);
    const get = await getReguli(bazin.id_facilitate);

    expect(put.status).toBe(400);
    expect(put.body.cod).toBe('DATE_INVALIDE');
    expect(get.body).toEqual([REGULA_CADRU_DIDACTIC]);
  });

  it('inlocuirile simultane reusesc toate, iar ramane una dintre ele', async () => {
    const bazin = await Facilitate.create(BAZIN);

    const raspunsuri = await Promise.all(
      Array.from({ length: 10 }, () =>
        putReguli(bazin.id_facilitate, [REGULA_STUDENT]),
      ),
    );
    const get = await getReguli(bazin.id_facilitate);

    expect(raspunsuri.map((res) => res.status)).toEqual(Array(10).fill(200));
    expect(get.body).toEqual([REGULA_STUDENT]);
  });

  it('lista goala sterge toate regulile facilitatii', async () => {
    const bazin = await Facilitate.create(BAZIN);
    await putReguli(bazin.id_facilitate, [REGULA_STUDENT]);

    const put = await putReguli(bazin.id_facilitate, []);
    const get = await getReguli(bazin.id_facilitate);

    expect(put.status).toBe(200);
    expect(get.body).toEqual([]);
  });

  it('nu amesteca regulile a doua facilitati', async () => {
    const bazin = await Facilitate.create(BAZIN);
    const sala = await Facilitate.create({
      ...BAZIN,
      denumire: 'Sala fitness',
    });
    await putReguli(sala.id_facilitate, [REGULA_STUDENT]);

    await putReguli(bazin.id_facilitate, [REGULA_CADRU_DIDACTIC]);

    expect((await getReguli(sala.id_facilitate)).body).toEqual([
      REGULA_STUDENT,
    ]);
  });

  it.each([
    ['GET', () => getReguli(999)],
    ['PUT', () => putReguli(999, [REGULA_STUDENT])],
  ])('%s raspunde 404 pentru o facilitate inexistenta', async (_m, cerere) => {
    const res = await cerere();

    expect(res.status).toBe(404);
    expect(res.body.cod).toBe('FACILITATE_NEGASITA');
  });

  it.each([
    ['GET', (id, token) => getReguli(id, token)],
    ['PUT', (id, token) => putReguli(id, [REGULA_STUDENT], token)],
  ])('%s raspunde 401 fara token', async (_m, cerere) => {
    const bazin = await Facilitate.create(BAZIN);

    const res = await cerere(bazin.id_facilitate, null);

    expect(res.status).toBe(401);
  });

  it.each([
    ['GET', (id, token) => getReguli(id, token)],
    ['PUT', (id, token) => putReguli(id, [REGULA_STUDENT], token)],
  ])('%s raspunde 403 pentru un utilizator obisnuit', async (_m, cerere) => {
    const bazin = await Facilitate.create(BAZIN);
    const { token } = await createUtilizatorAutentificat();

    const res = await cerere(bazin.id_facilitate, token);

    expect(res.status).toBe(403);
    expect(res.body.cod).toBe('ACCES_INTERZIS');
  });
});
