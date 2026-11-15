# Rezervarea are patru stări memorate, nu cele opt din diagrama de stări

Diagrama de stări din Confluence (pagina 13860866) are opt stări, dar baza de date memorează doar patru: `Confirmata`, `PrezentaConfirmata`, `Anulata`, `Neonorata`. „Noua” și „Respinsa” nu ajung în baza de date: o cerere refuzată primește `409` sau `422` și nu creează o rezervare. „În desfășurare” și „Finalizata” se deduc din ora slotului, ca să nu existe o sarcină programată care doar mută stări după ceas.
