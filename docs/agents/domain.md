# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## Documentația din Confluence

Arhitectura și cerințele proiectului stau în Confluence (`yinyang.atlassian.net`, spațiul YINYANG). Când lucrul atinge domeniul, citește pagina relevantă cu `getConfluenceContent` înainte să inventezi reguli:

| Subiect                                                      | Pagina Confluence                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------- |
| Cerințe, roluri, reguli de rezervare                         | `4849695` – Product Requirements Document (PRD)                     |
| Contractul API (rute, coduri de răspuns, formatul erorilor)  | `17760270` – Lab 5, REST API (OpenAPI: `18219019` .yaml)            |
| Schema bazei de date                                         | `18087937` – Diagrama ERD; `18120705` – Implementarea bazei de date |
| Module și componente                                         | `13565959` – Diagrame UML Lab 4                                     |
| Stările rezervării                                           | `13860866` – Diagrama de stări                                      |
| Cazuri de utilizare (rezervare, listă de așteptare, anulare) | `7110657`, `9830402`, `11272193`                                    |
| Tehnologiile backend și motivele alegerii                    | `18350090` – Tehnologii backend                                     |

Dacă codul contrazice Confluence, semnalează diferența; nu alege tăcut una dintre variante.

## File structure

Single-context repo:

```
/
├── GLOSSARY.md
├── docs/adr/
│   ├── 0001-sequelize-orm.md
│   └── 0002-...
└── src/
```

## Use the glossary's vocabulary

Domeniul se numește în română, la fel ca în cod și în API: `facilitate`, `slot`, `rezervare`, `lista de asteptare`, `utilizator`, `notificare`. When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids, and don't translate domain terms into English.

If the concept you need isn't in the glossary yet, that's a signal: either you're inventing language the project doesn't use (reconsider) or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
