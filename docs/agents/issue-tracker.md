# Issue tracker: Jira (proiectul YT)

Tichetele și specificațiile pentru acest repository stau în Jira, pe site-ul `yinyang.atlassian.net`, în proiectul **YT**. Același proiect conține și tichetele repository-ului `frontend`, așa că fiecare tichet spune în titlu ce repository atinge. Toate operațiile se fac prin conectorul Atlassian (MCP), cu `cloudId` = `yinyang.atlassian.net`.

Dacă sesiunea nu are conectorul Atlassian, nu inventa altă variantă (GitHub Issues, fișiere locale): spune-i utilizatorului că trebuie conectat Atlassian și oprește-te.

## Conventions

- **Tipuri de tichete**: `Epic` grupează munca (de exemplu `YT-25 MVP`); sub el stau `Task` (muncă tehnică) și `Story` (funcționalitate văzută de utilizator). Nu se folosesc sub-task-uri.
- **Titlul**: în română, fără diacritice, terminat cu `backend` sau `frontend`, după repository. Exemplu: `CRUD facilitati backend`. Din titlu se formează numele branch-ului (`YT-32-crud-facilitati-backend`), deci titlul trebuie să fie scurt.
- **Descrierea**: în română, în markdown, cu secțiunile `Ce include` și `Criterii de acceptare`.
- **Create an issue**: `createJiraIssue` cu `projectKey: "YT"`, `issueType`, `summary`, `description` și `parent` = cheia epic-ului. Dacă nu e clar sub ce epic intră, întreabă utilizatorul; implicit, munca de implementare intră sub `YT-25` (MVP).
- **Read an issue**: `getJiraIssue` cu cheia (`YT-32`), plus `listJiraIssueComments` pentru comentarii. Pentru legăturile cu alte tichete, `view: "evidence"`.
- **List issues**: `searchJiraIssuesUsingJql`, de exemplu `project = YT AND statusCategory != Done AND summary ~ "backend" ORDER BY key ASC`. Adaugă `AND labels = "<eticheta>"` pentru filtrare după etichetă.
- **Make an issue a child of a parent**: câmpul `parent` la creare (`createJiraIssue`) sau `editJiraIssue` cu `parent` după aceea. Părintele este întotdeauna un `Epic`.
- **Blocking**: legătura Jira de tip `Blocks` („YT-40 blocks YT-41”). Operația de creare a legăturii se găsește cu `discover` („create issue link”). Dacă legătura nu se poate crea, pune pe primul rând din descrierea tichetului blocat: `Blocat de: YT-40, YT-41`. Un tichet este deblocat când toate tichetele care îl blochează sunt în `Done`.
- **Comment on an issue**: `addOrEditJiraIssueComment`.
- **Apply / remove labels**: `editJiraIssue` pe câmpul `labels`. Etichetele Jira se creează automat la prima folosire.
- **Statusuri**: `To Do` → `In Progress` → `In Review` → `Done`, cu `transitionJiraIssue`. Treci tichetul în `In Progress` când începe lucrul, în `In Review` când PR-ul este deschis (cu link-ul PR-ului într-un comentariu) și în `Done` doar după ce PR-ul a fost integrat în `main`.
- **Close**: scrie explicația cu `addOrEditJiraIssueComment`, apoi `transitionJiraIssue` către `Done`. Un tichet abandonat primește și eticheta `wontfix`.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

PR-urile din GitHub (`YinYang00/backend`) sunt doar livrarea unui tichet Jira; nu sunt cereri noi.

## When a skill says "publish to the issue tracker"

Creează un tichet Jira în proiectul YT, ca la **Create an issue**.

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
