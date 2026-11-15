import { createToken } from '../../src/modules/auth/token.service.js';
import { Utilizator } from '../../src/modules/utilizatori/utilizator.model.js';

let numarUtilizatori = 0;

/**
 * Creeaza direct in baza un utilizator cu categoria si rolul cerute si ii da
 * un token valid, pentru testele rutelor care cer autentificare. Fara nume si
 * e-mail primeste unele unice, ca un test sa poata crea mai multi utilizatori.
 * @param {{categorie?: string, rol?: string, nume?: string,
 *   email?: string}} [optiuni]
 * @returns {Promise<{utilizator: Utilizator, token: string}>}
 */
export async function createUtilizatorAutentificat({
  categorie = 'Student',
  rol = 'Utilizator',
  nume,
  email,
} = {}) {
  numarUtilizatori += 1;
  const utilizator = await Utilizator.create({
    nume: nume ?? `Utilizator Test ${numarUtilizatori}`,
    email: email ?? `utilizator.test${numarUtilizatori}@usv.ro`,
    // Testele care folosesc helper-ul nu fac login, deci parola nu conteaza.
    parola_hash: 'fara-parola',
    categorie,
    rol,
  });
  return { utilizator, token: createToken(utilizator) };
}
