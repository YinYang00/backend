import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { createUtilizatorAutentificat } from './setup/utilizator-autentificat.js';

const app = createApp();
const URL = '/api/v1/utilizatori/me';

describe('GET /utilizatori/me', () => {
  it('accepta tokenul primit la login', async () => {
    const cont = {
      nume: 'Andrei Popescu',
      email: 'andrei.popescu@student.usv.ro',
      parola: 'parola-sigura',
    };
    await request(app).post('/api/v1/auth/inregistrare').send(cont);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: cont.email, parola: cont.parola });

    const res = await request(app)
      .get(URL)
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('andrei.popescu@student.usv.ro');
  });

  it('raspunde 200 cu profilul utilizatorului curent, fara parola', async () => {
    const { token } = await createUtilizatorAutentificat({
      nume: 'Elena Ionescu',
      email: 'elena.ionescu@usv.ro',
      categorie: 'PersonalAdministrativ',
      rol: 'Administrator',
    });

    const res = await request(app)
      .get(URL)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id_utilizator: 1,
      nume: 'Elena Ionescu',
      email: 'elena.ionescu@usv.ro',
      categorie: 'PersonalAdministrativ',
      rol: 'Administrator',
    });
  });

  it('raspunde 401 fara token', async () => {
    const res = await request(app).get(URL);

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
  });

  it.each([
    ['un token care nu este JWT', 'Bearer nu-e-un-token'],
    ['un antet fara Bearer', 'Basic dXRpbGl6YXRvcjpwYXJvbGE='],
  ])('raspunde 401 pentru %s', async (_caz, antet) => {
    const res = await request(app).get(URL).set('Authorization', antet);

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
  });

  it('raspunde 401 pentru un token semnat cu alt secret', async () => {
    const token = jwt.sign({ id_utilizator: 1, rol: 'Administrator' }, 'fals');

    const res = await request(app)
      .get(URL)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
  });

  it('raspunde 401 pentru un token expirat', async () => {
    const { utilizator } = await createUtilizatorAutentificat();
    const token = jwt.sign(
      { id_utilizator: utilizator.id_utilizator, rol: utilizator.rol },
      env.jwtSecret,
      { expiresIn: '-1s' },
    );

    const res = await request(app)
      .get(URL)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
    expect(res.body.cod).toBe('NEAUTENTIFICAT');
  });
});
