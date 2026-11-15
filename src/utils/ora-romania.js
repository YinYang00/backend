// Orele din API sunt ora Romaniei, scrise in ISO 8601 cu offset (de exemplu
// 2026-11-20T08:00:00+02:00), ca un client sa le afiseze corect si iarna, si
// vara.

/** Fusul orar in care se interpreteaza si se afiseaza orele. */
export const FUS_ORAR = 'Europe/Bucharest';

const FORMATTER_MOMENT = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUS_ORAR,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZoneName: 'longOffset',
});

const FORMATTER_ZI = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUS_ORAR,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Data de azi in Romania, chiar daca serverul ruleaza in alt fus orar.
 * @returns {string} Data in formatul `YYYY-MM-DD`.
 */
export function getAziRomania() {
  return FORMATTER_ZI.format(new Date());
}

/**
 * Scrie un moment in timp in ora Romaniei, ISO 8601 cu offset.
 * @param {Date} moment
 * @returns {string} De exemplu `2026-11-20T08:00:00+02:00`.
 */
export function toIsoRomania(moment) {
  const parti = Object.fromEntries(
    FORMATTER_MOMENT.formatToParts(moment).map(({ type, value }) => [
      type,
      value,
    ]),
  );
  // Intl scrie offsetul ca „GMT+02:00”, iar pentru offset zero doar „GMT”.
  const offset = parti.timeZoneName.replace('GMT', '') || '+00:00';
  const data = `${parti.year}-${parti.month}-${parti.day}`;
  return `${data}T${parti.hour}:${parti.minute}:${parti.second}${offset}`;
}
