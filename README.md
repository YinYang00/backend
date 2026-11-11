# Campus Sports Booking - Backend

Serverul REST al aplicației Campus Sports Booking (Node.js + Express.js + PostgreSQL + Sequelize).

## Pornire locală

Cerințe: Node.js 20+ și PostgreSQL 16 pornit local (portul 5432), cu baza de date `campus_sports_booking` creată (vezi pagina „Implementarea bazei de date" din Confluence).

```bash
npm install          # instaleaza dependentele si activeaza hook-urile git
cp .env.example .env # apoi completeaza DB_PASSWORD
npm run db:init      # creeaza tabela facilitate (daca lipseste) si datele de test
npm run dev          # porneste serverul pe http://localhost:3000/api/v1
```

## API – Facilități

| Metodă   | Rută                                | Răspuns                                              |
| -------- | ----------------------------------- | ---------------------------------------------------- |
| `GET`    | `/api/v1/facilitati`                | `200` lista facilităților                            |
| `GET`    | `/api/v1/facilitati/:id_facilitate` | `200` facilitatea / `404`                            |
| `POST`   | `/api/v1/facilitati`                | `201` facilitatea creată / `400` / `409`             |
| `PUT`    | `/api/v1/facilitati/:id_facilitate` | `200` facilitatea modificată / `400` / `404` / `409` |
| `DELETE` | `/api/v1/facilitati/:id_facilitate` | `204` / `404`                                        |

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

## Teste

Testele rulează pe o bază de date separată, al cărei nume trebuie să se termine în `_test`:

```bash
DB_NAME=campus_sports_booking_test npm test
```

## Convenții

- [CODING_STYLE.md](CODING_STYLE.md) – coding style-ul backend-ului și cum este impus.
- [CONTRIBUTING.md](CONTRIBUTING.md) – branch-uri, commit-uri, pull request-uri.
