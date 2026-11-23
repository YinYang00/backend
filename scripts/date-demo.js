// Datele de demo pentru instalarea locala (`npm run setup` / `npm run db:init`):
// facilitatile si regulile de acces din pagina Confluence „Implementarea bazei
// de date”, un administrator, un student si sloturi pentru urmatoarele 7 zile.
// Rulat din nou in aceeasi zi, nu modifica nimic.
import bcrypt from 'bcrypt';

import { Facilitate } from '../src/modules/facilitati/facilitate.model.js';
import { RegulaAcces } from '../src/modules/reguli-acces/regula-acces.model.js';
import { createSloturi } from '../src/modules/sloturi/slot.service.js';
import { Utilizator } from '../src/modules/utilizatori/utilizator.model.js';
import { getAziRomania } from '../src/utils/ora-romania.js';

const BCRYPT_ROUNDS = 10;
const ZILE_CU_SLOTURI = 7;
const PROGRAM_ZI = {
  ora_inceput: '08:00',
  ora_sfarsit: '22:00',
  durata_minute: 60,
};

const FACILITATI_DEMO = [
  {
    denumire: 'Bazin de inot',
    tip: 'Inot',
    capacitate_maxima: 6,
    locatie: 'Complex sportiv USV',
  },
  {
    denumire: 'Sala fitness',
    tip: 'Fitness',
    capacitate_maxima: 20,
    locatie: 'Complex sportiv USV',
  },
  {
    denumire: 'Teren fotbal',
    tip: 'Sport de echipa',
    capacitate_maxima: 1,
    locatie: 'Baza sportiva USV',
  },
  {
    denumire: 'Teren baschet',
    tip: 'Sport de echipa',
    capacitate_maxima: 1,
    locatie: 'Baza sportiva USV',
  },
  {
    denumire: 'Teren tenis',
    tip: 'Sport cu racheta',
    capacitate_maxima: 1,
    locatie: 'Baza sportiva USV',
  },
];

// Aceleasi reguli pentru fiecare facilitate, ca in INSERT INTO regula_acces.
const REGULI_ACCES_DEMO = [
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
];

// Conturi doar pentru demo, pe calculatorul fiecaruia; parolele sunt in
// README, sectiunea „Instalare”.
const CONTURI_DEMO = [
  {
    nume: 'Administrator Demo',
    email: 'admin.demo@usv.ro',
    parola: 'AdminDemo2026',
    categorie: 'CadruDidactic',
    rol: 'Administrator',
  },
  {
    nume: 'Student Demo',
    email: 'student.demo@student.usv.ro',
    parola: 'StudentDemo2026',
    categorie: 'Student',
    rol: 'Utilizator',
  },
];

/**
 * Adauga facilitatile de demo, doar daca tabela facilitate este goala.
 * @returns {Promise<void>}
 */
async function addFacilitati() {
  if ((await Facilitate.count()) > 0) {
    console.info('Tabela facilitate are deja date; nu am adaugat facilitati.');
    return;
  }
  await Facilitate.bulkCreate(FACILITATI_DEMO);
  console.info(`Am adaugat ${FACILITATI_DEMO.length} facilitati de demo.`);
}

/**
 * Adauga regulile de acces de demo pentru fiecare facilitate, doar daca
 * tabela regula_acces este goala: regulile schimbate sau sterse de
 * administrator raman asa.
 * @returns {Promise<void>}
 */
async function addReguliAcces() {
  if ((await RegulaAcces.count()) > 0) {
    console.info(
      'Tabela regula_acces are deja date; nu am adaugat reguli de acces.',
    );
    return;
  }
  const facilitati = await Facilitate.findAll();
  const reguli = facilitati.flatMap(({ id_facilitate: idFacilitate }) =>
    REGULI_ACCES_DEMO.map((regula) => ({
      ...regula,
      id_facilitate: idFacilitate,
    })),
  );
  await RegulaAcces.bulkCreate(reguli);
  console.info(`Am adaugat ${reguli.length} reguli de acces de demo.`);
}

/**
 * Creeaza conturile de demo care lipsesc; un cont existent nu se modifica.
 * @returns {Promise<void>}
 */
async function addConturi() {
  for (const { parola, ...cont } of CONTURI_DEMO) {
    if (await Utilizator.findOne({ where: { email: cont.email } })) {
      continue;
    }
    await Utilizator.create({
      ...cont,
      parola_hash: await bcrypt.hash(parola, BCRYPT_ROUNDS),
    });
    console.info(`Am creat contul de demo ${cont.email}.`);
  }
}

/**
 * Data `YYYY-MM-DD` aflata la `zile` zile dupa `data`.
 * @param {string} data
 * @param {number} zile
 * @returns {string}
 */
function addZile(data, zile) {
  const zi = new Date(`${data}T00:00:00Z`);
  zi.setUTCDate(zi.getUTCDate() + zile);
  return zi.toISOString().slice(0, 10);
}

/**
 * Genereaza sloturile de azi si din urmatoarele zile pentru fiecare
 * facilitate. Sloturile care exista deja se sar.
 * @returns {Promise<void>}
 */
async function addSloturi() {
  const azi = getAziRomania();
  const facilitati = await Facilitate.findAll();
  let sloturiNoi = 0;
  for (const { id_facilitate: idFacilitate } of facilitati) {
    for (let zi = 0; zi < ZILE_CU_SLOTURI; zi += 1) {
      const sloturiCreate = await createSloturi(idFacilitate, {
        ...PROGRAM_ZI,
        data: addZile(azi, zi),
      });
      sloturiNoi += sloturiCreate.length;
    }
  }
  console.info(`Am adaugat ${sloturiNoi} sloturi de demo.`);
}

/**
 * Adauga datele de demo care lipsesc: facilitatile, regulile de acces,
 * conturile si sloturile.
 * @returns {Promise<void>}
 */
export async function addDateDemo() {
  await addFacilitati();
  await addReguliAcces();
  await addConturi();
  await addSloturi();
}
