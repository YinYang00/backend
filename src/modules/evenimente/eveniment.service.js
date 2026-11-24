// Conexiunile deschise la GET /evenimente si trimiterea evenimentelor catre
// ele. Serviciul nu cunoaste res: fiecare conexiune e o functie care scrie.
// shortcut: lista e in memorie, deci merge cu un singur proces de server; cu
// mai multe instante evenimentele trebuie trimise printr-un canal comun.
import { findSlotPublic } from '../sloturi/slot.service.js';

/** @type {Set<(text: string) => void>} */
const conexiuni = new Set();

/**
 * Adauga o conexiune la lista celor care primesc evenimente.
 * @param {(text: string) => void} write scrie textul pe conexiune
 * @returns {() => void} scoate conexiunea din lista, cand se inchide
 */
export function addConexiune(write) {
  conexiuni.add(write);
  return () => conexiuni.delete(write);
}

/**
 * Trimite tuturor conexiunilor starea slotului, citita dupa ce tranzactia
 * care l-a schimbat s-a incheiat. Nu arunca: schimbarea e deja salvata, deci
 * o eroare aici doar se scrie in log.
 * @param {number} idSlot
 * @returns {Promise<void>}
 */
export async function publishSlotActualizat(idSlot) {
  try {
    const slot = await findSlotPublic(idSlot);
    if (!slot) {
      return;
    }
    const dateEveniment = JSON.stringify({
      id_slot: slot.id_slot,
      id_facilitate: slot.id_facilitate,
      stare: slot.stare,
      locuri_libere: slot.locuri_libere,
    });
    for (const write of conexiuni) {
      write(`event: slot-actualizat\ndata: ${dateEveniment}\n\n`);
    }
  } catch (err) {
    console.error('Evenimentul slot-actualizat nu a putut fi trimis:', err);
  }
}
