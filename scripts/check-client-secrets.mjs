import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const TEXT_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".css",
  ".html",
  ".json",
  ".map",
  ".txt",
  ".svg",
]);

export const ADMIN_BUNDLE_SENTINEL = "SERVER-ONLY: SUPABASE_SERVICE_ROLE_KEY";

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

export async function scanClientStaticForServiceRole({
  repoRoot,
  serviceRoleKey,
} = {}) {
  const root = repoRoot ?? defaultRepoRoot;
  const staticRoot = path.join(root, ".next", "static");
  const sentinels = [ADMIN_BUNDLE_SENTINEL];
  if (serviceRoleKey) {
    sentinels.push(serviceRoleKey);
  }

  if (!(await pathExists(staticRoot))) {
    return { ok: false, reason: "missing-static", hits: [], scanned: 0 };
  }

  const files = await walkFiles(staticRoot);
  const hits = [];

  for (const file of files) {
    if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
    const content = await readFile(file, "utf8");
    for (const sentinel of sentinels) {
      if (sentinel && content.includes(sentinel)) {
        hits.push({ file: path.relative(root, file), sentinel });
      }
    }
  }

  return {
    ok: hits.length === 0,
    reason: hits.length === 0 ? null : "leak",
    hits,
    scanned: files.length,
  };
}

async function main() {
  const result = await scanClientStaticForServiceRole({
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (result.reason === "missing-static") {
    console.error(
      "check-client-secrets: missing .next/static. Run `npm run build` first.",
    );
    process.exit(1);
  }

  if (!result.ok) {
    console.error(
      "check-client-secrets: service-role material found in the client bundle:",
    );
    for (const hit of result.hits) {
      console.error(`  ${hit.file} contains ${JSON.stringify(hit.sentinel)}`);
    }
    process.exit(1);
  }

  console.log(
    `check-client-secrets: scanned ${result.scanned} files under .next/static — no service role key leak.`,
  );
}

const invokedAsCli =
  Boolean(process.argv[1]) &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedAsCli) {
  await main();
}
