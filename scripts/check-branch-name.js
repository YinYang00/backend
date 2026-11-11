// Verifica faptul ca numele branch-ului contine cheia si titlul tichetului
// Jira, de exemplu: YT-32-crud-facilitati-backend.
// Rulat din hook-ul pre-push si din workflow-ul GitHub Actions.
import { execSync } from 'node:child_process';

const BRANCH_PATTERN = /^YT-\d+(-[a-z0-9]+)+$/;
const PROTECTED_BRANCHES = ['main', 'master'];

const branch =
  process.argv[2] ||
  process.env.GITHUB_HEAD_REF ||
  execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

if (PROTECTED_BRANCHES.includes(branch)) {
  console.error(
    `Nu se lucreaza direct pe "${branch}". ` +
      'Creeaza un branch pentru tichet: git checkout -b YT-<nr>-<titlu>',
  );
  process.exit(1);
}

if (!BRANCH_PATTERN.test(branch)) {
  console.error(
    `Numele branch-ului "${branch}" nu respecta conventia.\n` +
      'Format: YT-<numar tichet>-<titlu-tichet-cu-cratime>, litere mici, ' +
      'fara diacritice. Exemplu: YT-32-crud-facilitati-backend',
  );
  process.exit(1);
}

console.info(`Branch valid: ${branch}`);
