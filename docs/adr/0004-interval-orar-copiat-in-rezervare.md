# Intervalul orar al slotului se copiază în rezervare, pentru constrângerea EXCLUDE

Garanția că un utilizator nu are două rezervări active suprapuse stă în PostgreSQL, ca o constrângere `EXCLUDE USING gist` (`ex_rezervare_suprapusa`, migrarea 0005). O constrângere de excludere poate folosi doar coloanele propriei tabele, de aceea `rezervare` are coloana `interval_orar`, copia intervalului `[ora_inceput, ora_sfarsit)` al slotului. O completează triggerul `trg_interval_rezervare`, nu serviciul, ca nicio cale de `INSERT` să nu o poată greși. Spre deosebire de triggerele de capacitate respinse în ADR 0003, acesta nu decide nimic: doar copiază o valoare.

## Consequences

`interval_orar` nu urmează o schimbare ulterioară a orelor slotului. Azi nicio rută nu schimbă orele unui slot; tichetul care introduce o astfel de rută actualizează și rezervările slotului. Constrângerea acoperă și cazul „același slot de două ori”, deci indexul unic `uq_rezervare_activa` din migrarea 0004 a fost șters.
