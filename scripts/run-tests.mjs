// Runs every src/**/*.test.ts(x) with Node's test runner. Finds the files itself
// rather than passing a glob, which older Node versions (e.g. on the Amplify
// build image) don't expand — so `npm test` behaves the same everywhere.
//   npm test
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function find(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "_archive" ? [] : find(path);
    return /\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

const files = find("src").sort();
if (files.length === 0) {
  console.error("No test files found under src/");
  process.exit(1);
}
const run = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], {
  stdio: "inherit",
});
process.exit(run.status ?? 1);
