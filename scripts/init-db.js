// Aduce schema la zi prin migrari (ADR 0001), apoi adauga facilitatile de test
// din pagina Confluence „Implementarea bazei de date”, doar daca tabela este
// goala. Rulat din nou, nu modifica nimic.
import { sequelize } from '../src/config/database.js';
import { migrator } from '../src/config/migrator.js';
import { Facilitate } from '../src/modules/facilitati/facilitate.model.js';

const FACILITATI_TEST = [
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

const aplicate = await migrator.up();
console.info(`Migrari aplicate: ${aplicate.length}.`);

if ((await Facilitate.count()) === 0) {
  await Facilitate.bulkCreate(FACILITATI_TEST);
  console.info(`Am adaugat ${FACILITATI_TEST.length} facilitati de test.`);
} else {
  console.info('Tabela facilitate are deja date; nu am adaugat nimic.');
}
await sequelize.close();
