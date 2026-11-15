import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';

const app = createApp();
const URL = '/api/v1/auth/inregistrare';
const STUDENT = {
  nume: 'Andrei Popescu',
  email: 'andrei.popescu@student.usv.ro',
  parola: 'parola-sigura',
};

describe('POST /auth/inregistrare', () => {
  it('creeaza contul unui student si raspunde 201, fara parola', async () => {
    const res = await request(app).post(URL).send(STUDENT);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id_utilizator: 1,
      nume: 'Andrei Popescu',
      email: 'andrei.popescu@student.usv.ro',
      categorie: 'Student',
      rol: 'Utilizator',
    });
  });

  it('da categoria CadruDidactic unui e-mail @usv.ro', async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...STUDENT, email: 'mihai.lungu@usv.ro' });

    expect(res.status).toBe(201);
    expect(res.body.categorie).toBe('CadruDidactic');
  });

  it('raspunde 400 pentru un e-mail din afara USV', async () => {
    const res = await request(app)
      .post(URL)
      .send({ ...STUDENT, email: 'andrei.popescu@gmail.com' });

    expect(res.status).toBe(400);
    expect(res.body.cod).toBe('EMAIL_NEINSTITUTIONAL');
  });

  it('raspunde 409 pentru un e-mail deja inregistrat', async () => {
    await request(app).post(URL).send(STUDENT);

    const res = await request(app)
      .post(URL)
      .send({ ...STUDENT, nume: 'Alt nume' });

    expect(res.status).toBe(409);
    expect(res.body.cod).toBe('EMAIL_EXISTENT');
  });

  it('raspunde 409 pentru acelasi e-mail scris cu majuscule', async () => {
    await request(app).post(URL).send(STUDENT);

    const res = await request(app)
      .post(URL)
      .send({ ...STUDENT, email: 'Andrei.Popescu@Student.USV.ro' });

    expect(res.status).toBe(409);
  });

  it('ignora rolul si categoria trimise in corp', async () => {
    const res = await request(app)
      .post(URL)
      .send({
        ...STUDENT,
        rol: 'Administrator',
        categorie: 'PersonalAdministrativ',
      });

    expect(res.status).toBe(201);
    expect(res.body.rol).toBe('Utilizator');
    expect(res.body.categorie).toBe('Student');
  });

  it.each([
    ['parola are sub 8 caractere', { parola: 'scurta1' }],
    ['lipseste numele', { nume: '   ' }],
    ['e-mailul nu este valid', { email: 'andrei.student.usv.ro' }],
  ])('raspunde 400 cand %s', async (_caz, modificare) => {
    const res = await request(app)
      .post(URL)
      .send({ ...STUDENT, ...modificare });

    expect(res.status).toBe(400);
    expect(res.body.cod).toBe('DATE_INVALIDE');
  });
});
