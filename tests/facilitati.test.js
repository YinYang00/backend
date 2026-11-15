import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { Facilitate } from '../src/modules/facilitati/facilitate.model.js';
import { createUtilizatorAutentificat } from './setup/utilizator-autentificat.js';

const app = createApp();
const URL = '/api/v1/facilitati';
const TENIS = {
  denumire: 'Teren tenis',
  tip: 'Tenis',
  capacitate_maxima: 2,
  locatie: 'Complex sportiv',
};

/**
 * Antetul Authorization al unui administrator nou creat in baza de test.
 * @returns {Promise<string>}
 */
async function createAntetAdministrator() {
  const { token } = await createUtilizatorAutentificat({
    categorie: 'PersonalAdministrativ',
    rol: 'Administrator',
  });
  return `Bearer ${token}`;
}

/**
 * Antetul Authorization al unui utilizator obisnuit (rolul Utilizator).
 * @returns {Promise<string>}
 */
async function createAntetUtilizator() {
  const { token } = await createUtilizatorAutentificat();
  return `Bearer ${token}`;
}

describe('GET /facilitati', () => {
  it('raspunde cu lista facilitatilor, ordonata dupa id', async () => {
    await Facilitate.bulkCreate([TENIS, { ...TENIS, denumire: 'Teren 2' }]);

    const res = await request(app).get(URL);

    expect(res.status).toBe(200);
    expect(res.body.map((item) => item.denumire)).toEqual([
      'Teren tenis',
      'Teren 2',
    ]);
  });
});

describe('GET /facilitati/:id_facilitate', () => {
  it('raspunde cu facilitatea ceruta', async () => {
    const creata = await Facilitate.create(TENIS);

    const res = await request(app).get(`${URL}/${creata.id_facilitate}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject(TENIS);
  });

  it('raspunde 404 pentru o facilitate inexistenta', async () => {
    const res = await request(app).get(`${URL}/999`);

    expect(res.status).toBe(404);
    expect(res.body.cod).toBe('FACILITATE_NEGASITA');
  });

  it('raspunde 400 pentru un id care nu e numar', async () => {
    const res = await request(app).get(`${URL}/abc`);

    expect(res.status).toBe(400);
    expect(res.body.cod).toBe('DATE_INVALIDE');
  });
});

describe('POST /facilitati', () => {
  it('raspunde 401 fara token', async () => {
    const res = await request(app).post(URL).send(TENIS);

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
    expect(await Facilitate.count()).toBe(0);
  });

  it('raspunde 403 pentru un utilizator care nu e administrator', async () => {
    const res = await request(app)
      .post(URL)
      .set('Authorization', await createAntetUtilizator())
      .send(TENIS);

    expect(res.status).toBe(403);
    expect(res.body.cod).toBe('ACCES_INTERZIS');
    expect(await Facilitate.count()).toBe(0);
  });

  it('creeaza facilitatea si raspunde 201', async () => {
    const res = await request(app)
      .post(URL)
      .set('Authorization', await createAntetAdministrator())
      .send(TENIS);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(TENIS);
    expect(await Facilitate.count()).toBe(1);
  });

  it('raspunde 400 cand lipseste denumirea', async () => {
    const res = await request(app)
      .post(URL)
      .set('Authorization', await createAntetAdministrator())
      .send({ ...TENIS, denumire: '  ' });

    expect(res.status).toBe(400);
    expect(res.body.mesaj).toBe('Campul denumire este obligatoriu.');
  });

  it('raspunde 400 cand capacitatea nu este pozitiva', async () => {
    const res = await request(app)
      .post(URL)
      .set('Authorization', await createAntetAdministrator())
      .send({ ...TENIS, capacitate_maxima: 0 });

    expect(res.status).toBe(400);
  });

  it('raspunde 409 pentru o denumire duplicata', async () => {
    await Facilitate.create(TENIS);

    const res = await request(app)
      .post(URL)
      .set('Authorization', await createAntetAdministrator())
      .send(TENIS);

    expect(res.status).toBe(409);
    expect(res.body.cod).toBe('DENUMIRE_DUPLICATA');
  });
});

describe('PUT /facilitati/:id_facilitate', () => {
  it('raspunde 401 fara token', async () => {
    const creata = await Facilitate.create(TENIS);

    const res = await request(app)
      .put(`${URL}/${creata.id_facilitate}`)
      .send({ ...TENIS, capacitate_maxima: 4 });

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
  });

  it('raspunde 403 pentru un utilizator care nu e administrator', async () => {
    const creata = await Facilitate.create(TENIS);

    const res = await request(app)
      .put(`${URL}/${creata.id_facilitate}`)
      .set('Authorization', await createAntetUtilizator())
      .send({ ...TENIS, capacitate_maxima: 4 });

    expect(res.status).toBe(403);
    expect(res.body.cod).toBe('ACCES_INTERZIS');
    await creata.reload();
    expect(creata.capacitate_maxima).toBe(2);
  });

  it('modifica facilitatea', async () => {
    const creata = await Facilitate.create(TENIS);

    const res = await request(app)
      .put(`${URL}/${creata.id_facilitate}`)
      .set('Authorization', await createAntetAdministrator())
      .send({ ...TENIS, capacitate_maxima: 4 });

    expect(res.status).toBe(200);
    expect(res.body.capacitate_maxima).toBe(4);
  });

  it('raspunde 404 pentru o facilitate inexistenta', async () => {
    const res = await request(app)
      .put(`${URL}/999`)
      .set('Authorization', await createAntetAdministrator())
      .send(TENIS);

    expect(res.status).toBe(404);
  });
});

describe('DELETE /facilitati/:id_facilitate', () => {
  it('raspunde 401 fara token', async () => {
    const creata = await Facilitate.create(TENIS);

    const res = await request(app).delete(`${URL}/${creata.id_facilitate}`);

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
    expect(await Facilitate.count()).toBe(1);
  });

  it('raspunde 403 pentru un utilizator care nu e administrator', async () => {
    const creata = await Facilitate.create(TENIS);

    const res = await request(app)
      .delete(`${URL}/${creata.id_facilitate}`)
      .set('Authorization', await createAntetUtilizator());

    expect(res.status).toBe(403);
    expect(res.body.cod).toBe('ACCES_INTERZIS');
    expect(await Facilitate.count()).toBe(1);
  });

  it('sterge facilitatea si raspunde 204', async () => {
    const creata = await Facilitate.create(TENIS);

    const res = await request(app)
      .delete(`${URL}/${creata.id_facilitate}`)
      .set('Authorization', await createAntetAdministrator());

    expect(res.status).toBe(204);
    expect(await Facilitate.count()).toBe(0);
  });

  it('raspunde 404 pentru o facilitate inexistenta', async () => {
    const res = await request(app)
      .delete(`${URL}/999`)
      .set('Authorization', await createAntetAdministrator());

    expect(res.status).toBe(404);
  });
});

describe('erori generale', () => {
  it('raspunde 400 pentru un JSON invalid', async () => {
    const res = await request(app)
      .post(URL)
      .set('Content-Type', 'application/json')
      .send('{"denumire":');

    expect(res.status).toBe(400);
    expect(res.body.cod).toBe('JSON_INVALID');
  });

  it('raspunde 404 pentru o ruta inexistenta', async () => {
    const res = await request(app).get('/api/v1/nu-exista');

    expect(res.status).toBe(404);
    expect(res.body.cod).toBe('RUTA_NEGASITA');
  });
});
