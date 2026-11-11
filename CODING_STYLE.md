# Coding style – Backend

Acest document definește convențiile de scriere a codului pentru backend-ul aplicației **Campus Sports Booking** (Node.js + Express.js + PostgreSQL + Sequelize). Regulile sunt obligatorii pentru tot codul din acest repository și sunt verificate automat (vezi [secțiunea 8](#8-cum-sunt-impuse-regulile)).

## 1. Ghidul de bază

Stilul nostru pornește de la **[Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)**, ghidul recomandat în laborator pentru JavaScript. Am păstrat regulile lui despre formatare, denumiri, declarații și JSDoc și am adăugat reguli proprii pentru Node.js și Express: structura pe module, tratarea erorilor, convențiile API și limba folosită în cod.

Unde ghidul Google și acest document diferă, are prioritate acest document. Diferențele asumate sunt:

| Subiect         | Google JS Style Guide         | La noi                                                            | Motiv                                                                                           |
| --------------- | ----------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Module          | `goog.module` sau ES modules  | Doar ES modules (`import`/`export`)                               | Node.js modern, `"type": "module"`                                                              |
| Câmpuri de date | camelCase                     | `snake_case` pentru câmpurile din baza de date și din JSON-ul API | Contractul API din Confluence și schema PostgreSQL folosesc deja `snake_case` (`id_facilitate`) |
| JSDoc           | Obligatoriu aproape peste tot | Obligatoriu pentru tot ce este exportat                           | Funcțiile interne mici rămân ușor de citit fără comentariu                                      |

## 2. Formatare

Formatarea este făcută **automat de Prettier** ([`.prettierrc.json`](.prettierrc.json)). Nimeni nu formatează de mână; editorul rulează Prettier la salvare, iar hook-ul de pre-commit îl rulează pe fișierele modificate.

| Regulă                         | Valoare                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Indentare                      | 2 spații, fără tab-uri                                                            |
| Lungimea maximă a liniei       | 80 de caractere                                                                   |
| Ghilimele                      | simple (`'text'`); template literal doar când există interpolare                  |
| Punct și virgulă               | obligatoriu la finalul fiecărei instrucțiuni                                      |
| Virgulă finală                 | da, în liste și obiecte pe mai multe rânduri                                      |
| Acolade                        | stil K&R: acolada de deschidere pe aceeași linie                                  |
| Spații                         | în jurul operatorilor, după virgulă, în interiorul acoladelor de obiect: `{ id }` |
| Parantezele funcțiilor săgeată | mereu: `(item) => item.id`                                                        |
| Sfârșit de linie               | LF; fișierul se termină cu o linie goală ([`.editorconfig`](.editorconfig))       |

```js
// Corect
const facilitate = { denumire: 'Teren tenis', capacitate_maxima: 2 };

if (facilitate.capacitate_maxima > 1) {
  console.info(`Capacitate: ${facilitate.capacitate_maxima}`);
}

// Gresit
var facilitate = { denumire: 'Teren tenis', capacitate_maxima: 2 };
if (facilitate.capacitate_maxima > 1)
  console.info('Capacitate: ' + facilitate.capacitate_maxima);
```

## 3. Reguli de cod

### 3.1 Declarații și variabile

- Se folosește `const` implicit și `let` doar când variabila se reatribuie. `var` este interzis.
- O singură variabilă per declarație (`const a = 1; const b = 2;`, nu `const a = 1, b = 2;`).
- Variabilele și importurile nefolosite sunt interzise. Un parametru nefolosit, dar cerut de semnătură, începe cu `_` (de exemplu `_next`).
- Importurile se scriu la începutul fișierului, în ordinea: module Node (`node:fs`), pachete npm, apoi fișiere locale.

### 3.2 Denumiri

| Element                                     | Convenție                           | Exemplu                                           |
| ------------------------------------------- | ----------------------------------- | ------------------------------------------------- |
| Fișiere                                     | `kebab-case`, cu rolul ca sufix     | `facilitate.service.js`, `error-handler.js`       |
| Foldere de module                           | `kebab-case`, pluralul din API      | `modules/facilitati/`, `modules/lista-asteptare/` |
| Variabile și funcții                        | `camelCase`                         | `findFacilitateById`, `capacitateNoua`            |
| Clase și modele Sequelize                   | `PascalCase`                        | `AppError`, `Facilitate`                          |
| Constante globale                           | `UPPER_SNAKE_CASE`                  | `DEFAULT_PORT`, `BRANCH_PATTERN`                  |
| Câmpuri din baza de date și din JSON-ul API | `snake_case`                        | `id_facilitate`, `capacitate_maxima`              |
| Rute REST                                   | substantive la plural, `kebab-case` | `/api/v1/facilitati`, `/api/v1/lista-asteptare`   |
| Coduri de eroare                            | `UPPER_SNAKE_CASE`                  | `FACILITATE_NEGASITA`                             |

**Limba:** termenii din domeniu (entități, câmpuri, rute, mesaje pentru utilizator) sunt în **română, fără diacritice**, la fel ca în baza de date și în documentul API (`facilitate`, `rezervare`, `denumire`). Verbele și termenii tehnici din numele funcțiilor sunt în **engleză** (`find`, `create`, `update`, `remove`, `service`, `controller`), ca să se potrivească cu API-urile Express și Sequelize. Exemplu: `createFacilitate`, nu `creeazaFacilitate` și nici `createFacility`.

- Numele descriu conținutul, nu tipul: `facilitati`, nu `arr` sau `list1`. Numele de o literă sunt permise doar pentru indecși (`i`, `j`).
- Funcțiile booleene încep cu `is`, `has` sau `can`: `isSlotLiber`, `hasRezervare`.

### 3.3 Expresii și control

- Comparații doar cu `===` și `!==`.
- Acoladele sunt obligatorii la `if`, `else`, `for` și `while`, chiar și pentru o singură instrucțiune.
- După un `return` nu se mai scrie `else`; se preferă ieșirea timpurie (_guard clause_).
- Șirurile compuse se scriu cu template literal: `` `Facilitatea ${id}` ``.
- Proprietățile se scriu prescurtat când numele coincide: `{ denumire }`.
- Callback-urile sunt funcții săgeată. Operatorii ternari nu se imbrică.
- Codul asincron se scrie cu `async`/`await`, nu cu `.then()` în lanț.

### 3.4 Gestionarea erorilor

- Se aruncă doar obiecte `Error` sau subclase ale lui, niciodată șiruri sau obiecte simple.
- Erorile prevăzute (resursă negăsită, date invalide, conflict) se aruncă din **serviciu** ca `AppError(status, cod, mesaj)`.
- Controller-ele nu tratează erorile individual. Toate erorile ajung în middleware-ul central `error-handler.js`, care răspunde în formatul din documentul API:

  ```json
  { "cod": "FACILITATE_NEGASITA", "mesaj": "Facilitatea cu id 7 nu exista." }
  ```

- Codurile HTTP folosite: `200` citire sau modificare, `201` creare, `204` ștergere, `400` date invalide, `401`/`403` autentificare și rol, `404` negăsit, `409` conflict (de exemplu denumire duplicată), `500` eroare neprevăzută.
- O eroare neprevăzută (`500`) se scrie în log cu `console.error`. Clientul primește doar un mesaj generic, fără stack trace sau detalii SQL.
- Blocurile `catch` goale sunt interzise. `console.log` este interzis în cod; pentru loguri se folosesc `console.info`, `console.warn` și `console.error`.
- Datele de intrare se validează cu `express-validator` în fișierul `*.validators.js` al modulului, înainte să ajungă în controller.

### 3.5 Dimensiunea codului

| Limită                                                | Valoare maximă                    |
| ----------------------------------------------------- | --------------------------------- |
| Linii într-un fișier                                  | 300                               |
| Linii într-o funcție (fără linii goale și comentarii) | 40                                |
| Niveluri de imbricare (`if` în `for` în `if`...)      | 3                                 |
| Parametri ai unei funcții                             | 4; peste 4 se transmite un obiect |
| Complexitate ciclomatică a unei funcții               | 10                                |

O funcție care depășește limitele se împarte în funcții mai mici cu nume sugestive.

### 3.6 Comentarii

- Tot ce este **exportat** (funcții, clase) are un comentariu **JSDoc** cu descriere, `@param` pentru fiecare parametru și `@returns` când funcția întoarce o valoare.

  ```js
  /**
   * Cauta o facilitate dupa id.
   * @param {number} id
   * @returns {Promise<Facilitate>}
   * @throws {AppError} 404 daca facilitatea nu exista.
   */
  export async function findFacilitateById(id) {
  ```

- Comentariile de linie folosesc `//`, au un spațiu după `//` și stau pe linia de deasupra codului explicat.
- Comentariile explică **de ce**, nu ce face codul. Un comentariu care repetă codul (`// incrementeaza i`) se șterge.
- Codul comentat (cod vechi lăsat „pentru orice eventualitate") nu se commite; istoricul există în Git.
- Comentariile sunt în română, fără diacritice. `TODO` se scrie cu cheia tichetului: `// TODO(YT-40): adauga paginare`.

## 4. Structura proiectului

Fiecare modul din diagrama de componente are trei straturi, fiecare cu responsabilitatea lui:

```
src/
  config/          variabile de mediu si conexiunea la baza de date
  middleware/      tratarea erorilor, validare, autentificare
  modules/
    facilitati/
      facilitate.model.js        model Sequelize (persistenta)
      facilitate.service.js      reguli de business, arunca AppError
      facilitate.controller.js   primeste cererea, apeleaza serviciul, raspunde JSON
      facilitate.validators.js   reguli express-validator
      facilitate.routes.js       leaga rutele de controller
  utils/           clase si functii comune (AppError)
  app.js           construieste aplicatia Express
  server.js        porneste serverul
tests/             teste Vitest + Supertest
```

- Controller-ul nu accesează direct modelul; trece prin serviciu.
- Serviciul nu cunoaște `req` și `res`; primește date simple și întoarce date simple.
- Configurația (port, date de conectare) vine doar din variabile de mediu (`.env`, vezi `.env.example`), niciodată scrisă direct în cod.

## 5. Convenții pentru API

- Toate rutele au prefixul `/api/v1`. Câmpurile JSON sunt în `snake_case`, exact ca în documentul OpenAPI din Confluence.
- Rutele CRUD urmează modelul: `GET /facilitati`, `GET /facilitati/:id`, `POST /facilitati`, `PUT /facilitati/:id`, `DELETE /facilitati/:id`.
- `POST` răspunde `201` cu resursa creată, `DELETE` răspunde `204` fără corp.

## 6. Teste

- Testele stau în `tests/`, cu numele `<modul>.test.js`, și folosesc Vitest și Supertest pe o bază de date de test.
- Fiecare rută nouă are cel puțin un test pentru cazul reușit și unul pentru cazul de eroare.
- Numele testelor descriu comportamentul: `it('raspunde 404 pentru o facilitate inexistenta')`.

## 7. Git și GitHub

Regulile complete sunt în [CONTRIBUTING.md](CONTRIBUTING.md). Pe scurt:

- Fiecare modificare are un tichet Jira, un branch `YT-<nr>-<titlu-tichet>` și un pull request.
- Mesajele de commit au forma `YT-<nr>: <descriere la imperativ>`.
- Branch-ul conține doar codul tichetului. Dacă apare altceva de făcut, se creează un tichet nou.
- `main` este protejat: integrarea se face doar prin PR, cu cel puțin o aprobare de la alt membru al echipei, prin Squash and Merge sau Rebase and Merge.

## 8. Cum sunt impuse regulile

Regulile de mai sus nu depind de bunăvoința fiecăruia. Sunt verificate pe trei niveluri:

| Nivel        | Mecanism                                                                          | Ce verifică                                                                                                                                                                                    |
| ------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Editor       | [`.editorconfig`](.editorconfig), Prettier, ESLint                                | Indentarea, finalul de linie și erorile afișate direct în VS Code                                                                                                                              |
| Commit local | Husky `pre-commit` → lint-staged                                                  | ESLint și Prettier pe fișierele modificate; commit-ul e oprit dacă există erori                                                                                                                |
| Commit local | Husky `commit-msg` → [`scripts/check-commit-msg.js`](scripts/check-commit-msg.js) | Formatul `YT-<nr>: <descriere>`                                                                                                                                                                |
| Push local   | Husky `pre-push` → [`scripts/check-branch-name.js`](scripts/check-branch-name.js) | Numele branch-ului, refuzul push-ului direct pe `main`, lint, format                                                                                                                           |
| GitHub       | Workflow-ul [`CI`](.github/workflows/ci.yml)                                      | `branch-name`, `pr-title`, `lint`, `test`, rulate la fiecare PR                                                                                                                                |
| GitHub       | Ruleset-ul [`protect-main.json`](.github/rulesets/protect-main.json)              | PR obligatoriu, o aprobare de la altcineva decât autorul ultimului push, conversații rezolvate, toate verificările CI trecute, doar Squash și Rebase, fără force-push și fără ștergerea `main` |
| Echipă       | [Șablonul de PR](.github/pull_request_template.md) și code review                 | Ce nu se poate verifica automat: PR-ul conține doar codul tichetului, denumirile sunt clare, comentariile sunt utile                                                                           |

Hook-urile locale se pot ocoli cu `--no-verify`. Verificările din GitHub nu se pot ocoli, iar fără ele un PR nu poate fi integrat în `main`.

Comenzi utile:

```bash
npm run lint          # ESLint, 0 avertismente permise
npm run lint:fix      # repara automat ce se poate
npm run format        # formateaza tot proiectul cu Prettier
npm run format:check  # verifica formatarea fara sa modifice
npm test              # testele Vitest
```
