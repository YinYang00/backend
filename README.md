# Campus Sports Booking - Backend

Serverul REST al aplicației Campus Sports Booking (Node.js + Express.js + PostgreSQL + Sequelize).

## Pornire locală

Cerințe: Node.js 20+ și PostgreSQL 16 pornit local (portul 5432), cu o bază de date goală `campus_sports_booking` (`CREATE DATABASE campus_sports_booking;`).

```bash
npm install          # instaleaza dependentele si activeaza hook-urile git
cp .env.example .env # apoi completeaza DB_PASSWORD
npm run db:init      # ruleaza migrarile si adauga datele de test
npm run dev          # porneste serverul pe http://localhost:3000/api/v1
```

## Baza de date și migrările

Schema se construiește doar din migrări, rulate cu [Umzug](https://github.com/sequelize/umzug) ([ADR 0001](docs/adr/0001-migrari-umzug.md)); codul nu apelează `sequelize.sync()`. Migrările stau în `src/migrations/` și rulează în ordinea numelui fișierului. Cele deja rulate sunt notate în tabela `SequelizeMeta`, deci fiecare rulează o singură dată.

```bash
npm run db:migrate   # ruleaza doar migrarile noi
npm run db:init      # migrarile, apoi datele de test (doar daca tabela facilitate e goala)
```

Ambele comenzi se pot rula de oricâte ori; a doua rulare nu schimbă nimic. Datele de test sunt cele din pagina „Implementarea bazei de date” din Confluence.

Un tichet care schimbă schema adaugă un fișier nou `src/migrations/<NNNN>-<descriere>.js`, care exportă `up` și `down`; ambele primesc conexiunea Sequelize în `context`. O migrare cu mai multe instrucțiuni le rulează într-o tranzacție (`context.transaction(...)`), ca o eroare să nu lase schema aplicată pe jumătate. O migrare deja integrată în `main` nu se mai modifică. Odată cu migrarea se actualizează și modelul Sequelize al tabelei (`src/modules/<modul>/<entitate>.model.js`: tipuri, lungimi, `unique`, validări), ca să corespundă cu baza de date, și pagina „Implementarea bazei de date” din Confluence.

O bază creată înainte de migrări (cu vechiul `db:init`, cu vechile teste care foloseau `sync()` sau cu scriptul `campus_sports_booking.sql`) nu are tabela `SequelizeMeta`, iar prima migrare dă eroarea `relation "facilitate" already exists`. O astfel de bază se șterge și se creează din nou goală; pentru baza de dezvoltare se rulează apoi `npm run db:init`. Același lucru este valabil pentru baza de test `campus_sports_booking_test`.

## API – Facilități

| Metodă   | Rută                                | Acces         | Răspuns                                                              |
| -------- | ----------------------------------- | ------------- | -------------------------------------------------------------------- |
| `GET`    | `/api/v1/facilitati`                | public        | `200` lista facilităților                                            |
| `GET`    | `/api/v1/facilitati/:id_facilitate` | public        | `200` facilitatea / `404`                                            |
| `POST`   | `/api/v1/facilitati`                | administrator | `201` facilitatea creată / `400` / `401` / `403` / `409`             |
| `PUT`    | `/api/v1/facilitati/:id_facilitate` | administrator | `200` facilitatea modificată / `400` / `401` / `403` / `404` / `409` |
| `DELETE` | `/api/v1/facilitati/:id_facilitate` | administrator | `204` / `401` / `403` / `404`                                        |

Rutele de administrator cer antetul `Authorization: Bearer <token>`: fără token valid răspund `401 NEAUTENTIFICAT`, iar pentru un utilizator fără rolul `Administrator` răspund `403 ACCES_INTERZIS`.

Corpul pentru `POST` și `PUT`:

```json
{
  "denumire": "Teren tenis",
  "tip": "Tenis",
  "capacitate_maxima": 2,
  "locatie": "Complex sportiv, terenul 1"
}
```

Erorile au formatul `{ "cod": "FACILITATE_NEGASITA", "mesaj": "..." }`.

## API – Sloturi

| Metodă | Rută                                        | Acces         | Răspuns                                                |
| ------ | ------------------------------------------- | ------------- | ------------------------------------------------------ |
| `POST` | `/api/v1/facilitati/:id_facilitate/sloturi` | administrator | `201` sloturile create / `400` / `401` / `403` / `404` |

Generează sloturile consecutive ale unei zile. Fiecare slot durează exact `durata_minute`, și în zilele în care se schimbă ora. Data și orele sunt în ora României (`Europe/Bucharest`); ultimul slot nu depășește `ora_sfarsit`, iar sloturile care există deja se sar (o cerere repetată primește `201` cu lista goală). Ziua din trecut, sfârșitul înaintea începutului și durata nepozitivă sau mai mare decât programul zilei primesc `400 DATE_INVALIDE`.

```json
{
  "data": "2026-11-20",
  "ora_inceput": "08:00",
  "ora_sfarsit": "22:00",
  "durata_minute": 60
}
```

Fiecare slot din răspuns are orele în ISO 8601 cu offset, de exemplu `"ora_inceput": "2026-11-20T08:00:00+02:00"`, plus `stare` și `locuri_libere`. Un slot nou are `stare: "Liber"` și toate locurile libere (`locuri_libere` este capacitatea facilității); la listarea sloturilor, ocuparea se calculează din rezervări (ADR 0003).

## Teste

Testele rulează pe o bază de date separată, al cărei nume trebuie să se termine în `_test`:

```bash
DB_NAME=campus_sports_booking_test npm test
```

Înainte de teste se rulează migrările pe baza de test, iar înaintea fiecărui test se golesc toate tabelele (`TRUNCATE ... RESTART IDENTITY CASCADE`, în `tests/setup/`). Baza de test trebuie doar să existe (goală, sau creată deja de migrări); nu are nevoie de `db:init`.

## Convenții

- [CODING_STYLE.md](CODING_STYLE.md) – coding style-ul backend-ului și cum este impus.
- [CONTRIBUTING.md](CONTRIBUTING.md) – branch-uri, commit-uri, pull request-uri.
- [CLAUDE.md](CLAUDE.md) și [docs/agents/setup.md](docs/agents/setup.md) – lucrul cu Claude Code: plugin-ul `mattpocock-skills`, conectorul Atlassian și ce skill se folosește la fiecare pas. La prima sesiune, Claude verifică singur ce lipsește.
