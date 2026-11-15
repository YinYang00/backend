# Ocuparea slotului se calculează, nu se memorează

În baza de date, `slot.stare` reține doar decizia administratorului (`Liber` sau `Mentenanta`). `Ocupat` și `locuri_libere` se calculează din rezervările active în momentul răspunsului. Cele două triggere din scriptul Confluence (`trg_verifica_capacitate`, `trg_actualizeaza_stare_slot`) nu se preiau: verificarea capacității se face în serviciul de rezervare, într-o tranzacție cu `SELECT ... FOR UPDATE` pe rândul slotului. Așa numărul de rezervări rămâne singura sursă a ocupării și nu se poate desincroniza de o coloană, iar conflictele ajung la client ca `409` cu un `cod` clar, nu ca excepție PostgreSQL.

## Consequences

Contractul API nu se schimbă: răspunsul pentru un slot conține în continuare `stare` (inclusiv `Ocupat`) și `locuri_libere`. Constrângerile unice de pe `rezervare` se aplică doar rezervărilor active, ca un utilizator să poată rezerva din nou un slot după o anulare.
