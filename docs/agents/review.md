# Code review între colegi

Fiecare PR primește review de la **ambii** colegi care nu l-au scris. Reviewer-ul este cel care răspunde de comentarii: Claude pregătește analiza și textul comentariilor, iar colegul le citește, le înțelege și decide ce se publică sub numele lui (Laboratorul 7: „în proiect se integrează doar codul care poate fi explicat la o revizie de cod”).

| Membru | GitHub            |
| ------ | ----------------- |
| Marco  | `RomanDavidMarco` |
| Elisa  | `elisapoto`       |
| Fineas | `ilsfineas`       |

Coordonatorul de laborator (`VictorBalanWork`) poate fi adăugat la PR-urile pe care vrea să le vadă.

Repository-ul curent îl afli cu `gh repo view --json nameWithOwner`; în comenzile de mai jos apare ca `<repo>`.

## Review la PR-ul unui coleg

Pornește când colegul cere „fă review la PR-ul #N” sau „ce PR-uri am de revizuit?”. Pentru a doua întrebare: `gh pr list --search "review-requested:@me"`, apoi aceiași pași pentru PR-ul ales.

1. **Contextul PR-ului.** `gh pr view <n> --json number,title,author,headRefName,body,files,reviews` și `gh pr checks <n>`. Dacă autorul PR-ului este chiar utilizatorul sesiunii, oprește-te: un autor nu își face singur review. Citește tichetul Jira din titlu (`YT-<nr>`); el este specificația față de care judeci PR-ul.
2. **Codul, separat de munca colegului.** Lucrează într-un worktree, ca branch-ul curent al colegului să rămână neatins:
   ```bash
   git fetch origin pull/<n>/head:review/pr-<n>
   git worktree add ../review-pr-<n> review/pr-<n>
   ```
   În worktree: `npm ci`, apoi lint și testele din secțiunea „Comenzi” din `CLAUDE.md`. Notează ce pică.
3. **Review pe două axe.** Rulează skill-ul `code-review` în worktree, cu punctul fix `origin/main` și tichetul Jira ca specificație.
4. **Lista din Laboratorul 7 (2.2).** Verifică în diff, punct cu punct:
   - testele pică atunci când logica e greșită (nu repetă implementarea și nu verifică doar un mock);
   - cazurile-limită au teste: id inexistent, body gol, date invalide, utilizator neautentificat;
   - fiecare pachet npm nou există, e întreținut și are versiunea potrivită (`npm view <pachet> version time.modified`);
   - nicio validare sau verificare existentă nu a fost scoasă ca să treacă un test;
   - toate fișierele modificate țin de tichet (CONTRIBUTING.md, „Ce intră într-un branch”);
   - soluția e simplă, fără abstracții de care tichetul nu are nevoie;
   - nu apar parole, chei sau fișiere `.env`.
5. **Raportul pentru reviewer.** O listă numerotată de constatări. Fiecare are: `fișier:linie`, eticheta **trebuie schimbat** sau **sugestie**, motivul în una-două propoziții și textul propus pentru comentariu (în română, politicos, cu soluția concretă). La final, verdictul propus: `APPROVE` doar dacă nu a rămas niciun „trebuie schimbat”, altfel `REQUEST_CHANGES`. Dacă colegul întreabă de ce o constatare e o problemă, explică-i până o poate susține singur.
6. **Publicarea, după confirmarea colegului.** Colegul alege constatările și verdictul; poate rescrie textele. Publică totul ca un singur review cu comentarii pe linii:
   ```bash
   gh api repos/<repo>/pulls/<n>/reviews --input review.json
   ```
   cu `review.json` de forma `{ "event": "REQUEST_CHANGES", "body": "...", "comments": [{ "path": "src/...", "line": 42, "side": "RIGHT", "body": "..." }] }`. Fișierul `review.json` stă în directorul temporar al sesiunii, nu în repository.
7. **Curățenie.** `git worktree remove ../review-pr-<n>` și `git branch -D review/pr-<n>`.

Review-ul e gata când este publicat pe GitHub și worktree-ul a fost șters.

## Răspuns la comentariile primite

Pornește când autorul PR-ului cere „rezolvă comentariile de la PR-ul #N”.

1. **Firele de discuție deschise.** Citește-le cu GraphQL, ca să ai și starea „resolved”:
   ```bash
   gh api graphql -f query='query { repository(owner: "YinYang00", name: "<nume>") { pullRequest(number: <n>) { reviewThreads(first: 100) { nodes { id isResolved path line comments(first: 20) { nodes { databaseId author { login } body } } } } } } }'
   ```
2. **Planul, cu autorul.** Pentru fiecare fir nerezolvat propune: modificare în cod sau explicație de ce codul rămâne așa. Autorul decide pentru fiecare.
3. **Modificările.** Pe branch-ul PR-ului, cu `tdd` acolo unde se schimbă comportament. Commit-uri `YT-<nr>: <descriere>`, apoi `git push`.
4. **Răspunsurile, după confirmarea autorului.** La fiecare fir: un răspuns cu ce s-a schimbat și SHA-ul commit-ului (`gh api repos/<repo>/pulls/<n>/comments/<databaseId>/replies -f body="..."`), apoi rezolvarea firului (mutația GraphQL `resolveReviewThread` cu `id`-ul firului).
5. **Review din nou.** Un push nou anulează aprobările, deci cere din nou review de la reviewer-i: `gh pr edit <n> --add-reviewer <login>`.

Gata când fiecare fir are răspuns și este rezolvat, iar CI-ul trece.
