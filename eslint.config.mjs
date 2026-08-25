import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const ADMIN_IMPORT_MESSAGE =
  "SERVER-ONLY: do not import `@/lib/supabase/admin` from Client Components or browser modules. The service role key bypasses RLS.";

function isSupabaseAdminImport(specifier) {
  const normalized = String(specifier)
    .replaceAll("\\", "/")
    .replace(/\.(ts|tsx|js|jsx)$/, "");
  return (
    normalized === "@/lib/supabase/admin" ||
    normalized.endsWith("/lib/supabase/admin") ||
    normalized.endsWith("/supabase/admin")
  );
}

function hasUseClientDirective(context) {
  const body = context.sourceCode.ast.body;
  for (const node of body) {
    if (node.type === "ExpressionStatement") {
      const expr = node.expression;
      if (expr?.type === "Literal" && expr.value === "use client") {
        return true;
      }
      if (
        expr?.type === "Literal" &&
        typeof expr.value === "string" &&
        expr.value.startsWith("use ")
      ) {
        continue;
      }
    }
    break;
  }
  return false;
}

function reportIfAdminImport(context, node, specifier) {
  if (typeof specifier === "string" && isSupabaseAdminImport(specifier)) {
    context.report({ node, message: ADMIN_IMPORT_MESSAGE });
  }
}

const ftoPlugin = {
  meta: { name: "fto", version: "1.0.0" },
  rules: {
    "no-admin-client-import": {
      meta: {
        type: "problem",
        docs: {
          description:
            "Block Client Component and browser-client imports of the Supabase admin module.",
        },
        schema: [],
      },
      create(context) {
        const filename = context.filename.replaceAll("\\", "/");
        const isBrowserClientModule =
          filename.endsWith("/src/lib/supabase/client.ts") ||
          filename.endsWith("/lib/supabase/client.ts");

        function check() {
          return hasUseClientDirective(context) || isBrowserClientModule;
        }

        function checkSource(node) {
          if (!check()) return;
          reportIfAdminImport(context, node, node.source?.value);
        }

        function checkRequire(node) {
          if (!check()) return;
          const arg = node.arguments?.[0];
          reportIfAdminImport(context, node, arg?.value);
        }

        return {
          ImportDeclaration: checkSource,
          ExportAllDeclaration: checkSource,
          ExportNamedDeclaration: checkSource,
          ImportExpression: checkSource,
          CallExpression(node) {
            if (node.callee?.name === "require") {
              checkRequire(node);
            }
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: { fto: ftoPlugin },
    rules: {
      "fto/no-admin-client-import": "error",
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/supabase/admin",
              message: ADMIN_IMPORT_MESSAGE,
            },
          ],
          patterns: [
            {
              group: [
                "**/lib/supabase/admin",
                "**/lib/supabase/admin.*",
                "**/supabase/admin",
                "**/supabase/admin.*",
              ],
              allowTypeImports: true,
              message: ADMIN_IMPORT_MESSAGE,
            },
          ],
        },
      ],
    },
  },
  {
    // Server modules that are allowed to use the service role client.
    files: [
      "src/lib/supabase/admin.ts",
      "src/lib/people/invitations.ts",
      "src/lib/people/onboarding-actions.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  eslintConfigPrettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
