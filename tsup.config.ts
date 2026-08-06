import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  // Com "type": "module" no package.json, o ficheiro CommonJS tem de ter
  // extensao .cjs para o Node o ler como tal.
  outExtension: ({ format }) => ({ js: format === "esm" ? ".js" : ".cjs" }),
});
