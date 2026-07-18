#!/usr/bin/env node
/**
 * merge-runs.mjs — fold staged per-finding files from runs/<run>/ into the instance ledger.
 *
 * Usage: node merge-runs.mjs <instance-dir> [<run-name>]
 *   Without <run-name>, merges every non-merged run directory.
 *
 * Behavior:
 *   - validates EVERY staged finding before touching the ledger; any invalid file aborts the merge
 *   - assigns the next global F-#### ids (monotonic across the whole ledger — no per-category math)
 *   - dedupes: a staged finding matching an existing OPEN finding on (taxonomy_id, repo,
 *     evidence.path) is skipped and reported — re-verifying an open finding is a history event
 *     on the existing entry, not a new entry
 *   - appends an 'opened' history event, writes the ledger, moves staged files to runs/<run>/merged/
 *   - never rewrites or renumbers existing entries
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { validateFinding, loadContext } from "./lib/finding-validate.mjs";

const BOOK_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const instanceDir = path.resolve(process.argv[2] ?? ".");
const onlyRun = process.argv[3];

let ctx;
try {
  ctx = loadContext({ instanceDir, bookRoot: BOOK_ROOT, fs, path });
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
const { cfg, ruleIds } = ctx;

const ledgerPath = path.join(instanceDir, cfg.ledger);
const ledger = JSON.parse(fs.readFileSync(ledgerPath, "utf8"));
const runsDir = path.join(instanceDir, cfg.runs);

const runs = fs.existsSync(runsDir)
  ? fs.readdirSync(runsDir).filter((r) => {
      const p = path.join(runsDir, r);
      return fs.statSync(p).isDirectory() && r !== "merged" && (!onlyRun || r === onlyRun);
    })
  : [];
if (runs.length === 0) {
  console.log("Nothing to merge.");
  process.exit(0);
}

// ---- pass 1: validate everything staged; abort whole merge on any problem ----
const errors = [];
const stagedByRun = new Map();
for (const run of runs) {
  const runPath = path.join(runsDir, run);
  const files = fs.readdirSync(runPath).filter((x) => x.endsWith(".json") && x !== "merge-log.json");
  const staged = [];
  for (const file of files) {
    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(runPath, file), "utf8"));
    } catch (e) {
      errors.push(`runs/${run}/${file}: unparseable JSON: ${e.message}`);
      continue;
    }
    for (const f of Array.isArray(raw) ? raw : [raw]) {
      validateFinding(f, `runs/${run}/${file}`, { staged: true, cfg, ruleIds, errors });
      staged.push({ file, f });
    }
  }
  stagedByRun.set(run, staged);
}
if (errors.length) {
  console.error(`MERGE ABORTED — invalid staged findings (${errors.length} error(s)):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}

// ---- pass 2: assign ids, append, move to merged/ ----
const maxId = ledger.reduce((m, f) => Math.max(m, Number((f.id ?? "F-0000").slice(2))), 0);
let nextNum = maxId + 1;
const today = new Date().toISOString().slice(0, 10);
const openKey = (f) => `${f.taxonomy_id}|${f.repo}|${f.evidence?.path}`;
const openIndex = new Map(ledger.filter((f) => f.status === "open").map((f) => [openKey(f), f.id]));

let merged = 0, skipped = 0;
for (const run of runs) {
  const runPath = path.join(runsDir, run);
  const logPath = path.join(runPath, "merge-log.json");
  const log = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, "utf8")) : [];
  const mergedDir = path.join(runPath, "merged");
  const touchedFiles = new Set();

  for (const { file, f } of stagedByRun.get(run)) {
    touchedFiles.add(file);
    const dupOf = openIndex.get(openKey(f));
    if (dupOf) {
      skipped++;
      log.push({ file, action: "skipped-duplicate-of", id: dupOf, taxonomy_id: f.taxonomy_id, path: f.evidence?.path });
      continue;
    }
    const id = `F-${String(nextNum++).padStart(4, "0")}`;
    const entry = {
      id,
      ...f,
      status: f.status ?? "open",
      history: [...(f.history ?? []), { date: today, event: "opened", run }],
    };
    ledger.push(entry);
    openIndex.set(openKey(entry), id);
    merged++;
    log.push({ file, action: "merged", id, taxonomy_id: f.taxonomy_id });
  }

  if (touchedFiles.size) fs.mkdirSync(mergedDir, { recursive: true });
  for (const file of touchedFiles) {
    fs.renameSync(path.join(runPath, file), path.join(mergedDir, file));
  }
  fs.writeFileSync(logPath, JSON.stringify(log, null, 1) + "\n");
}

fs.writeFileSync(ledgerPath, JSON.stringify(ledger, null, 1) + "\n");
console.log(`Merged ${merged} finding(s), skipped ${skipped} duplicate(s). Ledger now ${ledger.length} entries (next id F-${String(nextNum).padStart(4, "0")}).`);
console.log(`Now run: node tools/validate-ledger.mjs "${instanceDir}"  (must pass)`);
