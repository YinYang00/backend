# Campus Sports Booking - Backend

Serverul REST al aplicației Campus Sports Booking (Node.js + Express.js + PostgreSQL + Sequelize).

## Instalare

Cerințe: Node.js 20+ și [Docker Desktop](https://www.docker.com/products/docker-desktop/) pornit. Nu se instalează PostgreSQL și nu se scrie SQL de mână.

```bash
git clone https://github.com/YinYang00/backend.git
cd backend
docker compose up -d   # PostgreSQL 16 pe portul 5432, cu baza de dezvoltare si cea de test
npm install            # dependentele si hook-urile git
npm run setup          # .env (daca lipseste), migrarile si datele de demo
npm run dev            # serverul pe http://localhost:3000/api/v1
```

`npm run setup` se poate rula de oricâte ori: un `.env` existent nu se modifică, iar datele care există deja nu se adaugă din nou. Datele de demo sunt cele cinci facilități și regulile lor de acces din pagina Confluence „Implementarea bazei de date”, sloturi de o oră (08:00–22:00) pentru azi și următoarele 6 zile, și două conturi:

| Cont          | E-mail                        | Parolă            | Ce poate face                               |
| ------------- | ----------------------------- | ----------------- | ------------------------------------------- |
| Administrator | `admin.demo@usv.ro`           | `AdminDemo2026`   | gestionează facilitățile, generează sloturi |
| Student       | `student.demo@student.usv.ro` | `StudentDemo2026` | rezervă sloturi                             |

Conturile sunt doar pentru demo, pe baza locală. Sloturile pentru zilele următoare se adaugă rulând din nou `npm run setup`.

Testele rulează pe baza `campus_sports_booking_test`, creată de `docker compose` la prima pornire:

```bash
DB_NAME=campus_sports_booking_test npm test          # bash
$env:DB_NAME="campus_sports_booking_test"; npm test  # PowerShell
```

Containerul se oprește cu `docker compose stop`; datele rămân în volumul `date-postgres`. Sloturile de azi care au trecut deja nu se mai pot rezerva; pentru demo se folosesc cele din zilele următoare.

Dacă portul 5432 e ocupat (de exemplu de un PostgreSQL instalat local), alege alt port în terminal înainte de primele două comenzi; `npm run setup` îl scrie și în `.env`:

```bash
export DB_PORT=5433     # bash
$env:DB_PORT="5433"     # PowerShell
```

Cine folosește un PostgreSQL instalat local în loc de Docker creează cele două baze goale, completează `DB_PASSWORD` în `.env` și rulează tot `npm run setup`.

## Baza de date și migrările

Schema se construiește doar din migrări, rulate cu [Umzug](https://github.com/sequelize/umzug) ([ADR 0001](docs/adr/0001-migrari-umzug.md)); codul nu apelează `sequelize.sync()`. Migrările stau în `src/migrations/` și rulează în ordinea numelui fișierului. Cele deja rulate sunt notate în tabela `SequelizeMeta`, deci fiecare rulează o singură dată.

```bash
npm run db:migrate   # ruleaza doar migrarile noi
npm run db:init      # migrarile, apoi datele de demo care lipsesc (scripts/date-demo.js)
```

Ambele comenzi se pot rula de oricâte ori; a doua rulare nu schimbă nimic. `npm run setup` face același lucru ca `db:init`, după ce creează `.env` și așteaptă pornirea bazei.

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
| `GET`  | `/api/v1/facilitati/:id_facilitate/sloturi` | public        | `200` sloturile zilei / `400` / `404`                  |
| `POST` | `/api/v1/facilitati/:id_facilitate/sloturi` | administrator | `201` sloturile create / `400` / `401` / `403` / `404` |

`GET` primește ziua în query, `?data=2026-11-20` (ora României), și întoarce sloturile care încep în ziua aceea, ordonate după `ora_inceput`, și în zilele în care se schimbă ora. `locuri_libere` este capacitatea facilității minus rezervările active, niciodată sub 0; `stare` este `Mentenanta` dacă slotul e blocat, altfel `Ocupat` dacă nu mai are locuri, altfel `Liber`. Data lipsă sau invalidă primește `400 DATE_INVALIDE`, iar o facilitate inexistentă `404 FACILITATE_NEGASITA`.

`POST` generează sloturile consecutive ale unei zile. Fiecare slot durează exact `durata_minute`, și în zilele în care se schimbă ora. Data și orele sunt în ora României (`Europe/Bucharest`); ultimul slot nu depășește `ora_sfarsit`, iar sloturile care există deja se sar (o cerere repetată primește `201` cu lista goală). Ziua din trecut, sfârșitul înaintea începutului și durata nepozitivă sau mai mare decât programul zilei primesc `400 DATE_INVALIDE`.

```json
{
  "data": "2026-11-20",
  "ora_inceput": "08:00",
  "ora_sfarsit": "22:00",
  "durata_minute": 60
}
```

Fiecare slot din răspuns are orele în ISO 8601 cu offset, de exemplu `"ora_inceput": "2026-11-20T08:00:00+02:00"`, plus `stare` și `locuri_libere`. Un slot nou are `stare: "Liber"` și toate locurile libere (`locuri_libere` este capacitatea facilității); la listarea sloturilor, ocuparea se calculează din rezervări (ADR 0003).

## API – Rezervări

| Metodă | Rută                                      | Acces        | Răspuns                                                  |
| ------ | ----------------------------------------- | ------------ | -------------------------------------------------------- |
| `GET`  | `/api/v1/rezervari`                       | autentificat | `200` rezervările proprii / `401`                        |
| `GET`  | `/api/v1/rezervari/:id_rezervare`         | autentificat | `200` rezervarea / `400` / `401` / `404`                 |
| `POST` | `/api/v1/rezervari`                       | autentificat | `201` rezervarea creată / `400` / `401` / `404` / `409`  |
| `POST` | `/api/v1/rezervari/:id_rezervare/anulare` | autentificat | `200` rezervarea anulată / `400` / `401` / `404` / `409` |

`GET /rezervari` întoarce rezervările utilizatorului curent, în toate stările (și cele anulate), ordonate după `ora_inceput` a slotului, fără `cod_qr`. `GET /rezervari/:id_rezervare` întoarce o rezervare cu `cod_qr`; rezervarea altui utilizator primește `404 REZERVARE_NEGASITA`, la fel ca una inexistentă, ca să nu se afle că există. Administratorul vede orice rezervare. Un id care nu e număr pozitiv primește `400 DATE_INVALIDE`.

Corpul este `{ "id_slot": 15 }`. Rezervarea se face într-o tranzacție, cu rândul slotului blocat (`SELECT ... FOR UPDATE`, ADR 0003), deci un slot nu trece niciodată peste capacitatea facilității. Doar rezervările active (`Confirmata`, `PrezentaConfirmata`) ocupă locuri.

- `409 SLOT_OCUPAT`: slotul este în mentenanță, a început deja sau nu mai are locuri libere.
- `409 REZERVARE_SUPRAPUSA`: utilizatorul are deja o rezervare activă suprapusă în timp, pe acest slot sau la altă facilitate. O garantează constrângerea `EXCLUDE USING gist` `ex_rezervare_suprapusa` (migrarea 0005), chiar și pentru cereri trimise în paralel; o rezervare anulată nu blochează.
- `404 SLOT_NEGASIT`: slotul nu există.

Răspunsul conține `id_rezervare`, `stare_rezervare` (`Confirmata`), `cod_qr` (un UUID aleator), `data_crearii`, slotul (`id_slot`, `ora_inceput`, `ora_sfarsit`) și facilitatea (`id_facilitate`, `denumire`), cu orele în ISO 8601 cu offset.

`POST /rezervari/:id_rezervare/anulare` trece rezervarea în starea `Anulata` și răspunde cu rezervarea actualizată (cu `cod_qr`). Rândul rămâne în baza de date, dar nu mai ocupă loc, deci slotul se poate rezerva din nou. Anulează proprietarul sau un administrator; rezervarea altui utilizator primește `404 REZERVARE_NEGASITA`. Rândul rezervării e blocat pe durata anulării, deci două anulări simultane nu trec amândouă.

- `409 REZERVARE_INACTIVA`: rezervarea este deja `Anulata` sau `Neonorata` (se verifică prima).
- `409 ANULARE_TARZIE`: slotul a început deja.

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
