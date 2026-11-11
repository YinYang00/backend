# Fluxul de lucru Git și GitHub

Reguli comune pentru repository-urile [`backend`](https://github.com/YinYang00/backend) și [`frontend`](https://github.com/YinYang00/frontend) din organizația [YinYang00](https://github.com/YinYang00).

## 1. Pornirea unui tichet

1. Alegi tichetul din Jira (proiectul **YT**) împreună cu echipa și îl treci în **In Progress**.
2. Actualizezi `main` și creezi branch-ul tichetului:

   ```bash
   git checkout main
   git pull
   git checkout -b YT-32-crud-facilitati-backend
   ```

**Numele branch-ului** = cheia tichetului + titlul tichetului, cu litere mici, cratime și fără diacritice: `YT-<nr>-<titlu-tichet>`. Formatul este verificat de hook-ul `pre-push` și de job-ul `branch-name` din CI.

## 2. Commit-uri

- Format: `YT-<nr>: <descriere la imperativ>`, cu maximum 72 de caractere pe prima linie. Exemplu: `YT-32: Adauga ruta DELETE /facilitati/:id`.
- Formatul este verificat de hook-ul `commit-msg`.
- Un commit face un singur lucru și lasă proiectul funcțional.

## 3. Ce intră într-un branch

Branch-ul conține **doar** codul necesar tichetului. Dacă în timpul lucrului descoperi altceva de reparat sau de adăugat, **nu** extinzi tichetul curent: creezi un tichet nou în Jira și îl rezolvi pe un branch separat. Reviewer-ul respinge PR-urile care conțin modificări în afara tichetului.

## 4. Pull request

1. `git push -u origin YT-32-crud-facilitati-backend`
2. Deschizi PR-ul către `main`, cu titlul `YT-32: CRUD facilitati backend` (verificat de job-ul `pr-title`).
3. Completezi șablonul de PR și adaugi ca reviewer un coleg (și coordonatorul de laborator).
4. Treci tichetul în Jira în **In Review** și adaugi link-ul PR-ului în tichet.

## 5. Review și integrare

- Este nevoie de **cel puțin o aprobare** de la alt membru al echipei. Autorul nu își poate aproba singur PR-ul, iar un push nou anulează aprobările anterioare.
- Toate conversațiile din review trebuie rezolvate, iar verificările `branch-name`, `pr-title`, `lint` și `test` trebuie să treacă.
- Integrarea se face doar prin **Squash and merge** sau **Rebase and merge**. Merge commit-ul este dezactivat.
- După integrare, branch-ul se șterge, iar tichetul trece în **Done**. Apoi actualizezi local `main` și verifici că aplicația funcționează.

### Branch-uri dependente

Dacă un tichet are nevoie de codul unui tichet încă neintegrat (de exemplu YT-32 depinde de YT-31), branch-ul lui pornește din branch-ul acelui tichet. PR-ul lui se deschide după ce primul PR a fost integrat. Înainte de deschidere, branch-ul se mută peste `main`:

```bash
git fetch origin
git rebase --onto origin/main YT-31-configurare-coding-style-backend YT-32-crud-facilitati-backend
git push --force-with-lease
```

## 6. Setările repository-ului (o singură dată, de către liderul echipei)

1. **Settings → General → Pull Requests:** se debifează _Allow merge commits_ și se lasă bifate _Allow squash merging_ și _Allow rebase merging_. Se bifează _Automatically delete head branches_.
2. **Settings → Rules → Rulesets → New ruleset → Import a ruleset:** se încarcă [`.github/rulesets/protect-main.json`](.github/rulesets/protect-main.json). Ruleset-ul se aplică pe `main` și impune PR, o aprobare, conversații rezolvate, verificările CI, istoric liniar, fără force-push și fără ștergere.
3. **Settings → Collaborators and teams:** echipa primește rolul _Write_, iar coordonatorul este invitat în organizație.

> Rulesets și protecția branch-urilor sunt gratuite pentru repository-urile **publice**. Pentru repository-uri private, organizația are nevoie de planul GitHub Team (gratuit pentru studenți prin GitHub Education).
