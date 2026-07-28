import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Playwright fixtures use a `use` param name (the fixture's teardown
  // callback). That trips react-hooks/rules-of-hooks, which is a false
  // positive here — e2e code is not React.
  {
    files: ["e2e/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
    },
  },
]);

export default eslintConfig;
