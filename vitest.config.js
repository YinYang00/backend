import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Testele folosesc aceeasi baza de date, deci ruleaza pe rand.
    fileParallelism: false,
    // Migrarile ruleaza o data, inainte de toate testele; tabelele se golesc
    // inaintea fiecarui test.
    globalSetup: ['tests/setup/global-setup.js'],
    setupFiles: ['tests/setup/goleste-tabele.js'],
  },
});
