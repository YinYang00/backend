import { Op } from 'sequelize';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { addDateDemo } from '../scripts/date-demo.js';
import { createApp } from '../src/app.js';
import { Facilitate } from '../src/modules/facilitati/facilitate.model.js';
import { RegulaAcces } from '../src/modules/reguli-acces/regula-acces.model.js';
import { Slot } from '../src/modules/sloturi/slot.model.js';
import { Utilizator } from '../src/modules/utilizatori/utilizator.model.js';

const app = createApp();
const UNA_ZI_MS = 24 * 60 * 60 * 1000;
// Datele de logare scrise in README, sectiunea „Instalare”.
const ADMIN = { email: 'admin.demo@usv.ro', parola: 'AdminDemo2026' };
const STUDENT = {
  email: 'student.demo@student.usv.ro',
  parola: 'StudentDemo2026',
};

/**
 * Autentifica un cont de demo prin API.
 * @param {{email: string, parola: string}} cont
 * @returns {Promise<import('supertest').Response>}
 */
function login(cont) {
  return request(app).post('/api/v1/auth/login').send(cont);
}

describe('date de demo', () => {
  it('administratorul de demo se autentifica si genereaza sloturi', async () => {
    await addDateDemo();

    const autentificare = await login(ADMIN);
    expect(autentificare.status).toBe(200);
    expect(autentificare.body.utilizator.rol).toBe('Administrator');

    const facilitati = await request(app).get('/api/v1/facilitati');
    const res = await request(app)
      .post(`/api/v1/facilitati/${facilitati.body[0].id_facilitate}/sloturi`)
      .set('Authorization', `Bearer ${autentificare.body.token}`)
      .send({
        data: '2099-01-15',
        ora_inceput: '08:00',
        ora_sfarsit: '09:00',
        durata_minute: 60,
      });
    expect(res.status).toBe(201);
  });

  it('studentul de demo rezerva un slot din urmatoarele zile', async () => {
    await addDateDemo();
    const { body } = await login(STUDENT);
    // Rutele nu listeaza inca sloturile; maine sigur nu a inceput niciunul.
    const slot = await Slot.findOne({
      where: { ora_inceput: { [Op.gt]: new Date(Date.now() + UNA_ZI_MS) } },
    });

    const res = await request(app)
      .post('/api/v1/rezervari')
      .set('Authorization', `Bearer ${body.token}`)
      .send({ id_slot: slot.id_slot });

    expect(body.utilizator.categorie).toBe('Student');
    expect(res.status).toBe(201);
  });

  it('fiecare facilitate are regulile de acces din Confluence', async () => {
    await addDateDemo();
    const { body } = await login(ADMIN);
    const facilitati = await request(app).get('/api/v1/facilitati');

    const res = await request(app)
      .get(
        `/api/v1/facilitati/${facilitati.body[0].id_facilitate}/reguli-acces`,
      )
      .set('Authorization', `Bearer ${body.token}`);

    // Pagina Confluence „Implementarea bazei de date”, INSERT INTO regula_acces.
    expect(res.body).toEqual([
      {
        categorie_utilizator: 'Student',
        ore_maxim_saptamana: 6,
        prioritate: 2,
        zile_avans_maxim: 7,
      },
      {
        categorie_utilizator: 'CadruDidactic',
        ore_maxim_saptamana: 8,
        prioritate: 1,
        zile_avans_maxim: 14,
      },
      {
        categorie_utilizator: 'PersonalAdministrativ',
        ore_maxim_saptamana: 4,
        prioritate: 3,
        zile_avans_maxim: 7,
      },
    ]);
  });

  it('acopera 7 zile, iar a doua rulare nu schimba nimic', async () => {
    await addDateDemo();
    const dupaPrima = await countRanduri();

    await addDateDemo();

    expect(await countRanduri()).toEqual(dupaPrima);
    // 5 facilitati, 14 sloturi de cate o ora (08:00-22:00), 7 zile; 3 reguli
    // de acces pe facilitate.
    expect(dupaPrima).toEqual({
      facilitati: 5,
      utilizatori: 2,
      sloturi: 490,
      reguli: 15,
    });
  });
});

/**
 * Cate randuri au tabelele pe care le completeaza datele de demo.
 * @returns {Promise<{facilitati: number, utilizatori: number,
 *   sloturi: number, reguli: number}>}
 */
async function countRanduri() {
  return {
    facilitati: await Facilitate.count(),
    utilizatori: await Utilizator.count(),
    sloturi: await Slot.count(),
    reguli: await RegulaAcces.count(),
  };
}
