import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import ts from "typescript";

const repoRoot = path.resolve(__dirname, "../../..");
const srcRoot = path.join(repoRoot, "src");
const adminModule = path.join(srcRoot, "lib/supabase/admin.ts");

const allowedDirectImporters = new Set([
  "src/lib/people/delete-auth-user.ts",
  "src/lib/people/invitations.ts",
  "src/lib/people/onboarding-actions.ts",
]);

function toRepoPath(filePath: string) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function walkSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkSourceFiles(full));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

function parseFile(filePath: string) {
  const text = readFileSync(filePath, "utf8");
  return ts.createSourceFile(filePath, text, ts.ScriptTarget.Latest, true);
}

function hasDirective(sourceFile: ts.SourceFile, directive: string) {
  for (const stmt of sourceFile.statements) {
    if (
      ts.isExpressionStatement(stmt) &&
      ts.isStringLiteralLike(stmt.expression)
    ) {
      if (stmt.expression.text === directive) return true;
      continue;
    }
    break;
  }
  return false;
}

function collectModuleSpecifiers(sourceFile: ts.SourceFile) {
  const specs: { spec: string; typeOnly: boolean }[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specs.push({
        spec: node.moduleSpecifier.text,
        typeOnly: Boolean(node.importClause?.isTypeOnly),
      });
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specs.push({
        spec: node.moduleSpecifier.text,
        typeOnly: Boolean(node.isTypeOnly),
      });
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      ts.isStringLiteral(node.moduleReference.expression)
    ) {
      specs.push({
        spec: node.moduleReference.expression.text,
        typeOnly: Boolean(node.isTypeOnly),
      });
    } else if (ts.isCallExpression(node)) {
      const expr = node.expression;
      if (
        expr.kind === ts.SyntaxKind.ImportKeyword &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      ) {
        specs.push({ spec: node.arguments[0].text, typeOnly: false });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specs;
}

function resolveExisting(base: string) {
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return path.normalize(candidate);
    }
  }
  return null;
}

function resolveImport(fromFile: string, spec: string) {
  if (spec.startsWith("@/")) {
    return resolveExisting(path.join(srcRoot, spec.slice(2)));
  }
  if (spec.startsWith(".")) {
    return resolveExisting(path.resolve(path.dirname(fromFile), spec));
  }
  return null;
}

function isAdminSpecifier(spec: string) {
  const normalized = spec
    .replaceAll("\\", "/")
    .replace(/\.(ts|tsx|js|jsx)$/, "");
  return (
    normalized === "@/lib/supabase/admin" ||
    normalized.endsWith("/lib/supabase/admin") ||
    normalized.endsWith("/supabase/admin")
  );
}

describe("service role admin client boundary", { timeout: 20_000 }, () => {
  const sourceFiles = walkSourceFiles(srcRoot);

  it("is only imported from known server modules", () => {
    const importers: string[] = [];
    for (const file of sourceFiles) {
      if (path.normalize(file) === path.normalize(adminModule)) continue;
      if (file.endsWith(".test.ts")) continue;
      const parsed = parseFile(file);
      for (const { spec, typeOnly } of collectModuleSpecifiers(parsed)) {
        if (typeOnly) continue;
        if (isAdminSpecifier(spec)) {
          importers.push(toRepoPath(file));
        }
      }
    }
    expect(new Set(importers)).toEqual(allowedDirectImporters);
  });

  it("is never reachable from a Client Component module graph", () => {
    const leaks: string[] = [];

    for (const start of sourceFiles) {
      const startAst = parseFile(start);
      if (!hasDirective(startAst, "use client")) continue;

      const queue = [start];
      const seen = new Set<string>([path.normalize(start)]);

      while (queue.length > 0) {
        const current = queue.pop()!;
        if (path.normalize(current) === path.normalize(adminModule)) {
          leaks.push(toRepoPath(start));
          break;
        }

        const ast = parseFile(current);
        // Server Actions are imported from the client as RPC stubs, not as
        // the module body that may load the admin client.
        if (current !== start && hasDirective(ast, "use server")) {
          continue;
        }

        for (const { spec, typeOnly } of collectModuleSpecifiers(ast)) {
          if (typeOnly) continue;
          const resolved = resolveImport(current, spec);
          if (!resolved) continue;
          const key = path.normalize(resolved);
          if (seen.has(key)) continue;
          seen.add(key);
          queue.push(resolved);
        }
      }
    }

    expect(leaks).toEqual([]);
  });

  it("does not expose the service role key via NEXT_PUBLIC_", () => {
    const envExample = readFileSync(
      path.join(repoRoot, ".env.example"),
      "utf8",
    );
    expect(envExample).not.toMatch(/NEXT_PUBLIC_SUPABASE_SERVICE_ROLE/);
    expect(envExample).toMatch(/^SUPABASE_SERVICE_ROLE_KEY=/m);

    const files = [
      ...["src", "scripts", ".github"].flatMap((dir) =>
        walkAllFiles(path.join(repoRoot, dir)),
      ),
      path.join(repoRoot, ".env.example"),
      path.join(repoRoot, "package.json"),
      path.join(repoRoot, "eslint.config.mjs"),
      path.join(repoRoot, "vitest.config.ts"),
    ];
    const leaks = files.filter((file) => {
      if (file.endsWith(".test.ts")) return false;
      return /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE/.test(
        readFileSync(file, "utf8"),
      );
    });
    expect(leaks.map(toRepoPath)).toEqual([]);
  });

  it('marks the admin module with import "server-only"', () => {
    const source = readFileSync(adminModule, "utf8");
    expect(source).toMatch(/^import "server-only";/m);
  });

  it("keeps the ESLint allowlist in sync with known admin importers", () => {
    const config = readFileSync(
      path.join(repoRoot, "eslint.config.mjs"),
      "utf8",
    );
    expect(config).toContain("fto/no-admin-client-import");
    for (const file of allowedDirectImporters) {
      expect(config).toContain(`"${file}"`);
    }
  });

  it("runs a client-bundle secret scan in CI after build", () => {
    const workflow = readFileSync(
      path.join(repoRoot, ".github/workflows/ci.yml"),
      "utf8",
    );
    expect(workflow).toContain("npm run check:client-secrets");
    expect(workflow).toContain(
      "ci-service-role-canary-do-not-leak-into-client-bundle",
    );
  });
});

function walkAllFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkAllFiles(full));
      continue;
    }
    if (statSync(full).isFile()) out.push(full);
  }
  return out;
}
