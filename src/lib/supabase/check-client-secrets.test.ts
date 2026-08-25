import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  ADMIN_BUNDLE_SENTINEL,
  scanClientStaticForServiceRole,
} from "../../../scripts/check-client-secrets.mjs";

const tempRoots: string[] = [];

async function makeRepo() {
  const repoRoot = await mkdtemp(path.join(os.tmpdir(), "fto-secrets-"));
  tempRoots.push(repoRoot);
  return repoRoot;
}

afterEach(async () => {
  await Promise.all(
    tempRoots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("scanClientStaticForServiceRole", () => {
  it("fails when the client bundle directory is missing", async () => {
    const repoRoot = await makeRepo();
    const result = await scanClientStaticForServiceRole({ repoRoot });
    expect(result).toMatchObject({
      ok: false,
      reason: "missing-static",
      scanned: 0,
    });
  });

  it("passes a clean client bundle", async () => {
    const repoRoot = await makeRepo();
    const chunkDir = path.join(repoRoot, ".next/static/chunks");
    await mkdir(chunkDir, { recursive: true });
    await writeFile(path.join(chunkDir, "app.js"), "console.log('ok');\n");

    const result = await scanClientStaticForServiceRole({
      repoRoot,
      serviceRoleKey: "ci-service-role-canary-do-not-leak-into-client-bundle",
    });
    expect(result.ok).toBe(true);
    expect(result.hits).toEqual([]);
    expect(result.scanned).toBe(1);
  });

  it("detects the admin module sentinel in client JS", async () => {
    const repoRoot = await makeRepo();
    const chunkDir = path.join(repoRoot, ".next/static/chunks");
    await mkdir(chunkDir, { recursive: true });
    await writeFile(
      path.join(chunkDir, "leaked.js"),
      `throw new Error("${ADMIN_BUNDLE_SENTINEL} and NEXT_PUBLIC_SUPABASE_URL");\n`,
    );

    const result = await scanClientStaticForServiceRole({ repoRoot });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("leak");
    expect(result.hits).toEqual([
      {
        file: ".next/static/chunks/leaked.js",
        sentinel: ADMIN_BUNDLE_SENTINEL,
      },
    ]);
  });

  it("detects a canary service role key in nested client files", async () => {
    const repoRoot = await makeRepo();
    const nested = path.join(repoRoot, ".next/static/chunks/pages");
    await mkdir(nested, { recursive: true });
    const canary = "ci-service-role-canary-do-not-leak-into-client-bundle";
    await writeFile(path.join(nested, "page.js"), `const k="${canary}";\n`);

    const result = await scanClientStaticForServiceRole({
      repoRoot,
      serviceRoleKey: canary,
    });
    expect(result.ok).toBe(false);
    expect(result.hits.map((hit) => hit.sentinel)).toEqual([canary]);
  });

  it("ignores non-text assets even if they contain the sentinel", async () => {
    const repoRoot = await makeRepo();
    const staticDir = path.join(repoRoot, ".next/static");
    await mkdir(staticDir, { recursive: true });
    await writeFile(
      path.join(staticDir, "font.woff2"),
      ADMIN_BUNDLE_SENTINEL,
      "utf8",
    );

    const result = await scanClientStaticForServiceRole({ repoRoot });
    expect(result.ok).toBe(true);
    expect(result.scanned).toBe(1);
  });
});
