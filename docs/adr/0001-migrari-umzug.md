# Schema bazei de date se construiește din migrări Umzug

Schema are nevoie de lucruri pe care `sequelize.sync()` nu le poate crea: tipuri enumerate, extensia `btree_gist`, constrângerea `EXCLUDE USING gist` împotriva rezervărilor suprapuse și indecși parțiali (ambele aplicate doar rezervărilor active). De aceea schema se construiește doar din migrări versionate în repository, rulate cu Umzug. Fiecare tichet care schimbă schema își aduce propria migrare. Dezvoltarea, testele și CI-ul rulează aceleași migrări, testele pe o bază al cărei nume se termină în `_test`.

## Considered Options

- **`sequelize.sync()`** (cum face acum `scripts/init-db.js`, înlocuit de migrări în YT-40): nu creează constrângerile de mai sus și nu poate modifica o tabelă existentă fără să piardă date.
- **Scriptul `campus_sports_booking.sql` din Confluence**: are tot ce trebuie, dar începe cu `DROP DATABASE` și nu se poate aplica pas cu pas pe o bază existentă.
- **`sequelize-cli`**: lucrează în CommonJS, iar proiectul folosește ES modules. Umzug este biblioteca pe care se bazează și `sequelize-cli`, dar se apelează direct din cod.

## Consequences

Scriptul SQL din Confluence rămâne documentație, nu sursa schemei. Când o migrare schimbă o tabelă, se actualizează și pagina „Implementarea bazei de date”.
