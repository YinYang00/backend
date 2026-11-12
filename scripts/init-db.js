// Creeaza tabela facilitate daca nu exista si adauga facilitatile de test
// din Confluence daca tabela este goala. Nu modifica o tabela existenta, deci
// poate fi rulat si peste baza creata cu scriptul campus_sports_booking.sql.
import { sequelize } from '../src/config/database.js';
import { Facilitate } from '../src/modules/facilitati/facilitate.model.js';

const FACILITATI_TEST = [
  {
    denumire: 'Teren tenis',
    tip: 'Tenis',
    capacitate_maxima: 2,
    locatie: 'Complex sportiv, terenul 1',
  },
  {
    denumire: 'Teren fotbal',
    tip: 'Fotbal',
    capacitate_maxima: 1,
    locatie: 'Complex sportiv, terenul 2',
  },
  {
    denumire: 'Teren baschet',
    tip: 'Baschet',
    capacitate_maxima: 1,
    locatie: 'Sala de sport, corp E',
  },
  {
    denumire: 'Sala fitness',
    tip: 'Fitness',
    capacitate_maxima: 20,
    locatie: 'Camin 3, demisol',
  },
  {
    denumire: 'Bazin de inot',
    tip: 'Inot',
    capacitate_maxima: 6,
    locatie: 'Bazinul universitatii',
  },
];

await Facilitate.sync();
if ((await Facilitate.count()) === 0) {
  await Facilitate.bulkCreate(FACILITATI_TEST);
  console.info(`Am adaugat ${FACILITATI_TEST.length} facilitati de test.`);
} else {
  console.info('Tabela facilitate are deja date; nu am adaugat nimic.');
}
await sequelize.close();
