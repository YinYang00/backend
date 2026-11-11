import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Testele folosesc aceeasi baza de date, deci ruleaza pe rand.
    fileParallelism: false,
  },
});
