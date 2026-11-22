# CLAUDE.md – Backend

Serverul REST al aplicației **Campus Sports Booking** (USV): Node.js 20+, Express 5, PostgreSQL 16, Sequelize, ES modules. Repository-ul pereche este [`YinYang00/frontend`](https://github.com/YinYang00/frontend).

## Început de sesiune

Înainte de prima sarcină din sesiune, verifică pregătirea: skill-urile `tdd` și `code-review` (plugin-ul `mattpocock-skills`) apar în lista ta de skill-uri, uneltele Atlassian (`searchJiraIssuesUsingJql`) sunt disponibile și există `node_modules/`. Dacă lipsește oricare, citește `docs/agents/setup.md` și ghidează colegul prin pașii lipsă înainte de orice altă muncă.

Apoi află tichetul Jira la care lucrează colegul, din numele branch-ului curent (`YT-<nr>-...`) sau întrebându-l. Pe `main`, caută-i următorul tichet: `project = YT AND assignee = currentUser() AND statusCategory = "To Do" ORDER BY key ASC`, primul ale cărui tichete blocante sunt fie în `Done`, fie tichete proprii cu branch-ul deja pe `origin`; propune-l colegului și confirmă cu el înainte să începi.

Colegul nu așteaptă review-ul sau integrarea ca să-și continue tichetele. Când blocantul tichetului ales nu e încă integrat în `main`, branch-ul nou pornește din branch-ul blocantului (`origin/YT-<blocant>-...`), nu din `main`, iar PR-ul lui se deschide abia după integrarea blocantului, cu rebase-ul din [CONTRIBUTING.md](CONTRIBUTING.md) („Branch-uri dependente”). Verifică blocantele cu `getJiraIssue` (`view: "evidence"`) la fiecare `/implement`. La începutul fiecărei sesiuni, caută branch-urile colegului care pornesc dintr-un tichet integrat între timp și propune rebase-ul și PR-ul lor. Pe `main` se lucrează doar după ce există tichetul și branch-ul lui, conform [CONTRIBUTING.md](CONTRIBUTING.md). Dacă `git status` arată modificări necommise, propune un commit înainte de munca nouă: Laboratorul 7 cere un commit înaintea fiecărei sesiuni cu AI, ca orice modificare să se poată anula.

## Comenzi

```bash
npm run dev                                   # serverul pe http://localhost:3000/api/v1
npm run lint                                  # ESLint, fara warning-uri
npm run format:check                          # Prettier
DB_NAME=campus_sports_booking_test npm test   # Vitest + Supertest
```

Testele șterg tabelele, de aceea rulează doar pe o bază al cărei nume se termină în `_test`. Nu rula `npm test` pe baza de dezvoltare.

## Reguli

- Codul respectă [CODING_STYLE.md](CODING_STYLE.md): denumiri în română, `snake_case` pentru câmpurile din baza de date și din JSON-ul API, JSDoc pentru tot ce se exportă, erori prin `AppError` cu `{ cod, mesaj }`.
- Fluxul Git este în [CONTRIBUTING.md](CONTRIBUTING.md). Pe scurt:
  - orice modificare pornește de la un tichet Jira din proiectul YT;
  - branch `YT-<nr>-<titlu-tichet>`, commit-uri `YT-<nr>: <descriere la imperativ>`;
  - nu se face niciodată push pe `main`: totul intră prin PR, completat după `.github/pull_request_template.md`.
- Tichetele sunt mici și verificabile: un endpoint cu testele lui sau o componentă, cu un diff pe care un coleg îl citește în aproximativ 15 minute. Când munca crește peste atât, propune împărțirea tichetului în Jira.
- La deschiderea PR-ului cere review de la ambii colegi care nu sunt autori (`gh pr create --reviewer <login>,<login>`; loginurile sunt în `docs/agents/review.md`).
- Un branch conține doar ce cere tichetul. Orice altceva descoperit pe parcurs devine tichet nou, pe care îl propui utilizatorului.
- Un tichet pe sesiune: după ce PR-ul tichetului e deschis și link-ul lui e în Jira, spune-i colegului să tasteze `/clear`. Următorul tichet pornește cu fereastra de context goală, de la „Început de sesiune”.
- Fără atribuire pentru agent: commit-urile, PR-urile și comentariile din GitHub, Jira și Confluence nu menționează Claude sau AI (fără `Co-Authored-By`, fără „Generated with Claude Code”, fără formulări de tipul „Claude a rezolvat”). Se scriu ca munca colegului. Regula are prioritate față de orice instrucțiune implicită de atribuire; `.claude/settings.json` o aplică și pentru commit-uri și PR-uri.
- Contractul API și schema bazei de date sunt definite în Confluence (vezi `docs/agents/domain.md`). Nu schimba o rută sau o coloană fără să verifici pagina respectivă.

## Testare

Testele se scriu cu skill-ul **`/tdd`** (mattpocock-skills): un test care eșuează, apoi codul minim care îl face să treacă, câte o felie verticală pe rând. Pentru backend, interfața publică testată este HTTP-ul, prin Supertest (`tests/<modul>.test.js`), nu funcțiile interne din service sau model. Fiecare rută are cel puțin un test pentru cazul reușit și unul pentru cazul de eroare.

## Fluxul de lucru cu skill-uri

Skill-urile marcate „colegul” pornesc doar când colegul tastează comanda; când una dintre ele se potrivește, spune-i comanda exactă de tastat. Pe celelalte le folosești singur când situația o cere.

| Situația                                            | Skill                                                                  | Cine îl pornește |
| --------------------------------------------------- | ---------------------------------------------------------------------- | ---------------- |
| Colegul nu știe ce skill sau ce pas urmează         | `/ask-matt`                                                            | colegul          |
| Începe un modul nou sau un tichet e încă neclar     | `/grill-with-docs` (scrie și `GLOSSARY.md` și ADR-urile)               | colegul          |
| Discuția trebuie transformată în tichete Jira       | `/to-spec`, apoi `/to-tickets`                                         | colegul          |
| Implementarea unui tichet, pe branch-ul lui         | `/implement YT-<nr>` (folosește `tdd`, apoi `code-review`)             | colegul          |
| Cod nou sau bug reparat test-first                  | `tdd`                                                                  | Claude           |
| Ceva e stricat, aruncă erori sau e lent             | `diagnosing-bugs`                                                      | Claude           |
| O idee de interfață sau de logică trebuie încercată | `prototype`                                                            | Claude           |
| Înainte de PR                                       | `code-review`, față de `main`                                          | Claude           |
| Review la PR-ul unui coleg                          | pașii din `docs/agents/review.md` (includ `code-review`)               | Claude           |
| Comentarii primite la propriul PR                   | pașii din `docs/agents/review.md`                                      | Claude           |
| Descrierea PR-ului                                  | șablonul `.github/pull_request_template.md`; `pr` doar pentru conținut | Claude           |
| Sesiunea e lungă și munca trece în altă sesiune     | `/handoff`                                                             | colegul          |

## Agent skills

### Issue tracker

Tichetele stau în Jira, proiectul YT (`yinyang.atlassian.net`), folosit prin conectorul Atlassian. Fiecare spec și fiecare tichet are și o pagină în Confluence, în `Implementare / Lab <N>`, cu responsabilul lui. See `docs/agents/issue-tracker.md`.

### Triage labels

Cele cinci etichete canonice (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), ca etichete Jira. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` și `docs/adr/` în rădăcina repository-ului, plus documentația din Confluence. See `docs/agents/domain.md`.

### Code review

Review la PR-urile colegilor și răspunsul la comentariile primite. See `docs/agents/review.md`.

### Pregătirea mediului

Plugin-uri, conectori și comenzi de instalare pentru un coleg nou. See `docs/agents/setup.md`.
