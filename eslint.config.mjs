import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    ".next-privacy/**",
    "out/**",
    "build/**",
    "coverage/**",
    "privacy-results/**",
    "test-results/**",
    "next-env.d.ts",
    "tsconfig.tsbuildinfo",
  ]),
]);

export default eslintConfig;
