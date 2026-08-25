import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const staticRoot = path.join(repoRoot, ".next", "static");

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

const SENTINELS = ["SERVER-ONLY: SUPABASE_SERVICE_ROLE_KEY"];

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (serviceRoleKey) {
  SENTINELS.push(serviceRoleKey);
}

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

if (!(await pathExists(staticRoot))) {
  console.error(
    "check-client-secrets: missing .next/static. Run `npm run build` first.",
  );
  process.exit(1);
}

const files = await walkFiles(staticRoot);
const hits = [];

for (const file of files) {
  if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
  const content = await readFile(file, "utf8");
  for (const sentinel of SENTINELS) {
    if (sentinel && content.includes(sentinel)) {
      hits.push({ file: path.relative(repoRoot, file), sentinel });
    }
  }
}

if (hits.length > 0) {
  console.error(
    "check-client-secrets: service-role material found in the client bundle:",
  );
  for (const hit of hits) {
    console.error(`  ${hit.file} contains ${JSON.stringify(hit.sentinel)}`);
  }
  process.exit(1);
}

console.log(
  `check-client-secrets: scanned ${files.length} files under .next/static — no service role key leak.`,
);
