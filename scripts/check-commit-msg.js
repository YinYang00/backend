// Verifica mesajul unui commit: prima linie trebuie sa inceapa cu cheia
// tichetului Jira, urmata de o descriere scurta la imperativ.
// Exemplu: "YT-32: Adauga ruta GET /facilitati"
import { readFileSync } from 'node:fs';

const MESSAGE_PATTERN = /^YT-\d+: \S.{4,71}$/;
const ALLOWED_PREFIXES = ['Merge ', 'Revert ', 'fixup! ', 'squash! '];

const file = process.argv[2];
const firstLine = readFileSync(file, 'utf8').split('\n')[0].trim();

const isAllowed = ALLOWED_PREFIXES.some((prefix) =>
  firstLine.startsWith(prefix),
);

if (!isAllowed && !MESSAGE_PATTERN.test(firstLine)) {
  console.error(
    `Mesaj de commit invalid: "${firstLine}"\n` +
      'Format: YT-<numar tichet>: <descriere la imperativ, 5-72 caractere>\n' +
      'Exemplu: YT-32: Adauga ruta GET /facilitati',
  );
  process.exit(1);
}
