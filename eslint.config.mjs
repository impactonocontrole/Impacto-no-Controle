import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),

  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      // MVP em produção: manter TypeScript/build como barreira principal.
      // Evita que regras muito rígidas bloqueiem deploy por pontos que não quebram o funcionamento.
      "@typescript-eslint/no-explicit-any": "off",

      // Regras novas do React Compiler/ESLint 9 que são muito rígidas para o MVP atual.
      // Podem ser reativadas depois, em uma rodada de refatoração técnica.
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",

      // O projeto usa imagens públicas simples; otimização com next/image pode entrar depois.
      "@next/next/no-img-element": "off",
    },
  },
]);
