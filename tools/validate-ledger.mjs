#!/usr/bin/env node
/**
 * validate-ledger.mjs — validate an instance's audit ledger (and staged run files)
 * against the finding schema semantics, the instance config vocabularies, and the
 * Book index. Must pass after every ledger mutation.
 *
 * Usage: node validate-ledger.mjs <instance-dir>
 *   <instance-dir> must contain config.json (see audit-book README).
 *
 * Exit 1 on any violation.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { validateFinding, loadContext } from "./lib/finding-validate.mjs";

const BOOK_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const instanceDir = path.resolve(process.argv[2] ?? ".");

let ctx;
try {
  ctx = loadContext({ instanceDir, bookRoot: BOOK_ROOT, fs, path });
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const { cfg, ruleIds } = ctx;
const errors = [];

// ---- ledger ----
const ledgerPath = path.join(instanceDir, cfg.ledger);
const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
if (!Array.isArray(ledger)) {
  console.error("ledger must be a JSON array");
  process.exit(1);
}
const ids = new Set();
for (const [i, f] of ledger.entries()) {
  const where = `ledger[${i}]${f.id ? " " + f.id : ""}`;
  validateFinding(f, where, { staged: false, cfg, ruleIds, errors });
  if (f.id) {
    if (ids.has(f.id)) errors.push(`${where}: duplicate id`);
    ids.add(f.id);
  }
}
for (const [i, f] of ledger.entries()) {
  for (const rid of f.related_findings ?? []) {
    if (!ids.has(rid)) errors.push(`ledger[${i}] ${f.id}: related_findings '${rid}' does not exist`);
  }
}

// ---- staged runs ----
let stagedCount = 0;
const runsDir = path.join(instanceDir, cfg.runs);
if (fs.existsSync(runsDir)) {
  for (const run of fs.readdirSync(runsDir)) {
    const runPath = path.join(runsDir, run);
    if (!fs.statSync(runPath).isDirectory() || run === "merged") continue;
    const files = fs.readdirSync(runPath).filter((x) => x.endsWith(".json") && x !== "merge-log.json");
    for (const file of files) {
      let staged;
      try {
        staged = JSON.parse(fs.readFileSync(path.join(runPath, file), "utf8"));
      } catch (e) {
        errors.push(`runs/${run}/${file}: unparseable JSON: ${e.message}`);
        continue;
      }
      for (const f of Array.isArray(staged) ? staged : [staged]) {
        validateFinding(f, `runs/${run}/${file}`, { staged: true, cfg, ruleIds, errors });
        stagedCount++;
      }
    }
  }
}

if (errors.length) {
  console.error(`LEDGER INVALID — ${errors.length} error(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
const open = ledger.filter((f) => f.status === "open").length;
console.log(`OK: ${ledger.length} findings (${open} open), ${stagedCount} staged, book rules known: ${ruleIds.size}`);
