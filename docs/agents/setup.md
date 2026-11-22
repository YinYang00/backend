# Pregătirea mediului pentru un coleg

Claude citește acest fișier când, la începutul sesiunii, lipsește ceva din verificarea din `CLAUDE.md`. Scopul: colegul ajunge să poată lucra la un tichet fără să mai întrebe pe nimeni.

## Cum ghidezi colegul

1. Verifică fiecare punct din lista de mai jos. Punctele 1–2 le vezi în lista ta de skill-uri și unelte; punctele 3–7 le verifici rulând comanda din coloana „Verificare”.
2. Arată-i colegului rezultatul ca listă bifată (✅ / ❌), în ordinea de mai jos.
3. Pentru fiecare ❌, dă-i comanda exactă din coloana „Cum se rezolvă”. Instalarea plugin-urilor, conectarea conturilor și parolele le face colegul; tu rulezi doar comenzile locale din proiect (`npm install`, `npm run db:init`) după ce el confirmă.
4. După ce colegul spune că a terminat, reverifică doar punctele care erau ❌.

Pregătirea e gata când toate punctele sunt ✅. Abia apoi treci la sarcina cerută.

## Lista

| #   | Ce trebuie                                       | Verificare                                                                           | Cum se rezolvă                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Plugin-ul `mattpocock-skills`                    | skill-urile `tdd` și `code-review` apar în lista ta de skill-uri                     | În terminal: `claude plugin marketplace add mattpocock/skills`, apoi `claude plugin install mattpocock-skills@mattpocock`. Colegul repornește Claude Code. Se instalează dintr-o singură sursă, altfel fiecare skill apare de două ori.                               |
| 2   | Conectorul Atlassian (Jira + Confluence)         | uneltele `searchJiraIssuesUsingJql` și `getConfluenceContent` sunt disponibile       | Pe claude.ai: Settings → Connectors → Atlassian → Connect, cu contul care are acces la `yinyang.atlassian.net`. În Claude Code, colegul rulează `/mcp` și autentifică serverul Atlassian dacă apare ca neautentificat. Colegul trebuie să fie membru în proiectul YT. |
| 3   | GitHub CLI autentificat, cu acces la `YinYang00` | `gh auth status` și `gh repo view YinYang00/backend`                                 | `gh auth login`. Dacă repo-ul nu e vizibil, liderul echipei îl invită în organizație cu rolul _Write_.                                                                                                                                                                |
| 4   | Node.js 20+                                      | `node --version`                                                                     | Instalare de pe nodejs.org (versiunea LTS).                                                                                                                                                                                                                           |
| 5   | Dependențele și hook-urile git                   | există `node_modules/` și `.husky/_/`                                                | `npm install` (activează și hook-urile care verifică numele branch-ului și mesajul commit-ului).                                                                                                                                                                      |
| 6   | PostgreSQL 16, `.env` și datele de demo          | `docker compose ps` arată serviciul `db` pornit; `npm run setup` rulează fără eroare | Colegul pornește Docker Desktop; tu rulezi `docker compose up -d`, apoi `npm run setup` (creează `.env` dacă lipsește, rulează migrările și adaugă datele de demo). Conturile de demo sunt în README, secțiunea „Instalare”.                                          |
| 7   | Baza de test                                     | `DB_NAME=campus_sports_booking_test npm test` trece                                  | Baza o creează `docker compose` la prima pornire. Pe un volum creat înainte de YT-68 lipsește: colegul o creează cu `docker compose exec db createdb -U postgres campus_sports_booking_test`. Testele refuză orice bază care nu se termină în `_test`.                |

## După pregătire

Arată-i colegului tabelul „Fluxul de lucru cu skill-uri” din `CLAUDE.md` și întreabă-l la ce tichet lucrează.
