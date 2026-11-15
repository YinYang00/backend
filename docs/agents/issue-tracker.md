# Issue tracker: Jira (proiectul YT)

Tichetele și specificațiile pentru acest repository stau în Jira, pe site-ul `yinyang.atlassian.net`, în proiectul **YT**. Același proiect conține și tichetele repository-ului `frontend`, așa că fiecare tichet spune în titlu ce repository atinge. Toate operațiile se fac prin conectorul Atlassian (MCP), cu `cloudId` = `yinyang.atlassian.net`.

Dacă sesiunea nu are conectorul Atlassian, nu inventa altă variantă (GitHub Issues, fișiere locale): spune-i utilizatorului că trebuie conectat Atlassian și oprește-te.

## Conventions

- **Tipuri de tichete**: `Epic` grupează munca (de exemplu `YT-25 MVP`); sub el stau `Task` (muncă tehnică) și `Story` (funcționalitate văzută de utilizator). Nu se folosesc sub-task-uri.
- **Titlul**: în română, fără diacritice, terminat cu `backend` sau `frontend`, după repository. Exemplu: `CRUD facilitati backend`. Din titlu se formează numele branch-ului (`YT-32-crud-facilitati-backend`), deci titlul trebuie să fie scurt.
- **Descrierea**: în română, în markdown. Textul complet stă în pagina Confluence a tichetului (vezi **Documentația în Confluence**); descrierea din Jira are pe primul rând link-ul spre pagină, apoi `Responsabil: <nume>` și un rezumat cu secțiunile `Ce include` și `Criterii de acceptare`.
- **Create an issue**: `createJiraIssue` cu `projectKey: "YT"`, `issueType`, `summary`, `description`, `parent` = cheia epic-ului și `assignee` = responsabilul (vezi **Responsabili**). Dacă nu e clar sub ce epic intră, întreabă utilizatorul; implicit, munca de implementare intră sub `YT-25` (MVP). Apoi creează pagina Confluence a tichetului și pune link-ul ei în descriere cu `editJiraIssue`.
- **Read an issue**: `getJiraIssue` cu cheia (`YT-32`), apoi pagina Confluence din link-ul de pe primul rând al descrierii (`getConfluenceContent`), unde e textul complet; plus `listJiraIssueComments` pentru comentarii. Pentru legăturile cu alte tichete, `view: "evidence"`.
- **List issues**: `searchJiraIssuesUsingJql`, de exemplu `project = YT AND statusCategory != Done AND summary ~ "backend" ORDER BY key ASC`. Adaugă `AND labels = "<eticheta>"` pentru filtrare după etichetă.
- **Make an issue a child of a parent**: câmpul `parent` la creare (`createJiraIssue`) sau `editJiraIssue` cu `parent` după aceea. Părintele este întotdeauna un `Epic`.
- **Blocking**: legătura Jira de tip `Blocks` („YT-40 blocks YT-41”). Operația de creare a legăturii se găsește cu `discover` („create issue link”). Dacă legătura nu se poate crea, pune pe primul rând din descrierea tichetului blocat: `Blocat de: YT-40, YT-41`. Un tichet este deblocat când toate tichetele care îl blochează sunt în `Done`.
- **Comment on an issue**: `addOrEditJiraIssueComment`.
- **Apply / remove labels**: `editJiraIssue` pe câmpul `labels`. Etichetele Jira se creează automat la prima folosire.
- **Statusuri**: workflow-ul Jira are `To Do` → `In Progress` → `Done`, cu `transitionJiraIssue`. Treci tichetul în `In Progress` când începe lucrul. Când PR-ul este deschis, adaugă link-ul PR-ului într-un comentariu; tichetul rămâne în `In Progress` (statusul `In Review` din CONTRIBUTING.md nu există încă în Jira, deci nu încerca tranziția). Treci tichetul în `Done` doar după ce PR-ul a fost integrat în `main`.
- **Close**: scrie explicația cu `addOrEditJiraIssueComment`, apoi `transitionJiraIssue` către `Done`. Un tichet abandonat primește și eticheta `wontfix`.

## Documentația în Confluence

Fiecare laborator are un folder în Confluence, ca profesorul să vadă documentele și tichetele în același loc cu Jira. Spațiul este `YINYANG` (`spaceId` `131203`), iar folderele de laborator stau sub folderul **Implementare** (`22183937`).

Structura fiecărui laborator:

```
Implementare/
  Lab <N>/
    Backend/
      Specificatie MVP backend      (pagina spec-ului)
      Tichete MVP backend           (pagina de ansamblu)
      Tichete/                      (câte o pagină pe tichet)
    Frontend/                       (la fel, pentru repository-ul frontend)
```

- **Folderele laboratorului**: `Lab <N>`, cu subfolderele `Backend` și `Frontend`, iar în fiecare dintre ele subfolderul `Tichete`. Ce lipsește se creează cu `createConfluenceContent`, `contentType: "folder"`; o pagină pusă greșit se mută cu operația `moveConfluenceContent` (găsită cu `discover`). Dacă nu știi numărul laboratorului, întreabă utilizatorul. Pentru Lab 7: `Lab 7` `24117250`, `Backend` `24215620`, `Backend/Tichete` `24248368`, `Frontend` `23920769`.
- **Specificația** (`/to-spec`): pagină direct în folderul `Backend` al laboratorului, cu același titlu ca tichetul Jira, care conține tot spec-ul. Tichetul Jira primește link-ul, responsabilul și un rezumat.
- **Tichetele** (`/to-tickets` și orice tichet nou): fiecare tichet are pagina lui în `Backend/Tichete`, în ordinea de lucru, cu titlul `YT-<nr>: <titlu tichet>`. Pagina începe cu un tabel: tichetul Jira (link), responsabilul, `Blocat de`, repository-ul. Urmează secțiunile `Ce include` și `Criterii de acceptare`, complete. Tichetele care se lucrează pe rând se leagă cu `Blocks`, fiecare de cel dinaintea lui.
- **Pagina de ansamblu** (la finalul `/to-tickets`): o pagină `Tichete <spec>` direct în folderul `Backend` al laboratorului, lângă spec (de exemplu `Tichete MVP backend`), cu tabelul tuturor tichetelor în ordinea de lucru (nr., tichet Jira, pagina tichetului, responsabil, `Blocat de`), apoi câte o secțiune pe coleg cu un macro `jira` live (`assignee = <accountId> AND parent = <epic> AND summary ~ "backend" ORDER BY key ASC`). Tichetul spec-ului primește link-ul ei, lângă link-ul spec-ului. Fiecare coleg își vede lista în secțiunea lui, iar munca se asignează direct pe tichetele care au branch și PR.
- **Responsabili**: fiecare tichet are un responsabil, scris în pagina Confluence și pus ca `assignee` în Jira. La `editJiraIssue`, câmpul se trimite ca obiect, `{ "accountId": "<id>" }`; un `accountId` simplu este ignorat fără eroare. Așa fiecare coleg își găsește tichetele cu `assignee = currentUser()`. `accountId`-ul unui coleg (membrii echipei sunt în `docs/agents/review.md`) se află cu operația `listJiraIssueAssignableUsers` (găsită cu `discover`), după nume; repository-ul este public, deci id-urile nu se scriu aici.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

PR-urile din GitHub (`YinYang00/backend`) sunt doar livrarea unui tichet Jira; nu sunt cereri noi.

## When a skill says "publish to the issue tracker"

Creează un tichet Jira în proiectul YT, ca la **Create an issue**, și pagina lui în folderul laboratorului, ca la **Documentația în Confluence**.

## When a skill says "fetch the relevant ticket"

Citește-l ca la **Read an issue**. Cheia tichetului se poate lua și din numele branch-ului curent (`YT-<nr>-...`).

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single Jira `Epic` with **child** issues as tickets.

- **Map**: un `Epic` cu eticheta `wayfinder:map`, a cărui descriere conține secțiunile Notes / Decisions-so-far / Fog.
- **Child ticket**: un `Task` cu `parent` = epic-ul hartă și eticheta `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Odată preluat, tichetul este asignat developer-ului care îl conduce.
- **Blocking**: vezi **Blocking** la Conventions.
- **Frontier query**: `searchJiraIssuesUsingJql` cu `parent = <epic> AND statusCategory != Done AND assignee is EMPTY ORDER BY rank ASC`; elimină tichetele care au un blocant încă deschis; primul rămas câștigă.
- **Claim**: asignează tichetul utilizatorului curent (`accountId` din `atlassianUserInfo`) și treci-l în `In Progress`; aceasta este prima scriere a sesiunii.
- **Resolve**: comentariu cu răspunsul (`addOrEditJiraIssueComment`), apoi `transitionJiraIssue` către `Done`, apoi adaugă un rezumat cu link în secțiunea Decisions-so-far din descrierea epic-ului (`editJiraIssue`).
