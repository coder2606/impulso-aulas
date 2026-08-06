import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Os testes vieram do Jest e usam describe/it/expect sem os importar.
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
