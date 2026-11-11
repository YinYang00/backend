/**
 * Eroare prevazuta a aplicatiei, transformata de error-handler in raspunsul
 * JSON { cod, mesaj } din documentul API.
 */
export class AppError extends Error {
  /**
   * @param {number} status Codul HTTP al raspunsului.
   * @param {string} cod Codul erorii, in UPPER_SNAKE_CASE.
   * @param {string} mesaj Mesajul afisat utilizatorului.
   */
  constructor(status, cod, mesaj) {
    super(mesaj);
    this.name = 'AppError';
    this.status = status;
    this.cod = cod;
  }
}
