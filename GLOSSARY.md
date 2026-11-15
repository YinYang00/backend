# Campus Sports Booking

Rezervarea facilităților sportive ale USV de către studenți și angajați, cu disponibilitate în timp real și reguli de acces pe categorii de utilizatori.

## Facilități și sloturi

**Facilitate**:
Un spațiu sportiv care se rezervă ca întreg (bazin, sală de fitness, teren de fotbal, baschet sau tenis).
_Avoid_: teren (ca termen general), resursă, spațiu

**Slot**:
Un interval orar al unei facilități, în care facilitatea poate fi rezervată.
_Avoid_: interval, oră, programare

**Capacitate**:
Numărul de locuri al fiecărui slot al unei facilități. Contează rezervări, nu persoane: la un teren cu capacitatea 1, o singură rezervare ocupă tot terenul.
_Avoid_: număr de persoane

**Loc**:
O unitate din capacitatea unui slot; o rezervare ocupă exact un loc.
_Avoid_: poziție, persoană

**Slot ocupat**:
Un slot fără locuri libere.
_Avoid_: slot plin, complet

**Mentenanță**:
Starea unui slot blocat de administrator, în care nu se pot face rezervări.
_Avoid_: închis, indisponibil

## Rezervări

**Rezervare**:
Dreptul unui utilizator asupra unui loc dintr-un slot. Există doar după ce a fost acceptată; o cerere refuzată nu devine rezervare.
_Avoid_: programare, booking

**Stare a rezervării**:
Una dintre `Confirmata`, `PrezentaConfirmata`, `Anulata`, `Neonorata`. „În desfășurare” și „finalizată” se deduc din ora slotului și nu sunt stări.
_Avoid_: Noua, Respinsa, Finalizata (ca stări)

**Rezervare activă**:
O rezervare în starea `Confirmata` sau `PrezentaConfirmata`; doar acestea ocupă locuri și contează la regulile de acces.
_Avoid_: rezervare validă, rezervare curentă

**Anulare**:
Trecerea unei rezervări în starea `Anulata`, care eliberează locul ei.
_Avoid_: ștergere, renunțare

**Neonorată**:
Starea unei rezervări la care utilizatorul nu și-a confirmat prezența până la termen.
_Avoid_: no-show (în cod și în API)

## Utilizatori

**Utilizator**:
O persoană cu cont în aplicație, identificată prin e-mailul instituțional USV.
_Avoid_: user, cont, client

**Categorie**:
Statutul utilizatorului în universitate (`Student`, `CadruDidactic`, `PersonalAdministrativ`), dedus din domeniul e-mailului, care decide ce reguli de acces i se aplică.
_Avoid_: tip de utilizator, rol (pentru acest sens)

**Rol**:
Drepturile utilizatorului în aplicație: `Utilizator` sau `Administrator`.
_Avoid_: categorie (pentru acest sens), permisiune

**Guest**:
O persoană neautentificată, care poate doar vedea facilitățile și sloturile.
_Avoid_: anonim, vizitator

**Regulă de acces**:
Limitele unei categorii de utilizatori la o facilitate: orele maxime pe săptămână, zilele maxime în avans și prioritatea. O facilitate fără regulă pentru o categorie nu are limite pentru acea categorie.
_Avoid_: politică, restricție

**Săptămână**:
Săptămâna calendaristică, de luni până duminică, ora României, în care cade un slot; orele maxime pe săptămână se socotesc pe ea.
_Avoid_: ultimele 7 zile
