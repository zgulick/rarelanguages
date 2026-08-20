import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    // API payloads from the database are loosely shaped, and flagging every
    // `any` as a build-breaking error is stricter than this codebase needs.
    // These stay visible as warnings in `npm run lint`; TypeScript's own type
    // checking remains a hard gate in `next build`.
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  {
    // The content-generation pipeline and the database layer are CommonJS
    // modules executed directly by node, not bundled by Next.
    files: ["scripts/**/*.js", "lib/**/*.js", "src/app/api/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

export default eslintConfig;
