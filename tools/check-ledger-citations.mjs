#!/usr/bin/env node
// Resolve every commit citation in a ledger against the repositories the instance
// config names. Born from OO:3: five entries cited a hash that `pipeline land` had
// rebased out of existence, so they read as proven while proving nothing.
//
//   node tools/check-ledger-citations.mjs <instance-dir> [--workspace <dir>]
//
// Exit 0 when every citation resolves, 1 when any does not, 2 on a usage or
// environment problem. A run that resolves ZERO citations exits 2, not 0 — a
// detector that matches nothing is not a passing detector (NN, vacuous gates).

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const instanceDir = args.find((a) => !a.startsWith('--'));
if (!instanceDir) {
  console.error('usage: check-ledger-citations.mjs <instance-dir> [--workspace <dir>]');
  process.exit(2);
}
const wsFlag = args.indexOf('--workspace');
const workspace = wsFlag >= 0 ? args[wsFlag + 1] : path.resolve(instanceDir, '..');

const config = JSON.parse(readFileSync(path.join(instanceDir, 'config.json'), 'utf8'));
const ledgerPath = path.join(instanceDir, config.ledger ?? 'audit/ledger.json');
const raw = JSON.parse(readFileSync(ledgerPath, 'utf8'));
const findings = Array.isArray(raw) ? raw : raw.findings;

// Repositories a citation may resolve in: the instance's declared repos, plus the
// instance and book directories, since entries cite their own history and the Book's.
const repos = [];
const bookDir = path.resolve(instanceDir, config.book ?? '../audit-book');
const add = (name, dir) => {
  if (existsSync(path.join(dir, '.git')) && !repos.some((r) => r.dir === dir)) {
    repos.push({ name, dir });
  }
};
for (const name of [...(config.repos ?? []), path.basename(instanceDir), path.basename(bookDir)]) {
  add(name, path.join(workspace, name));
}
// The governance repo IS the workspace directory, whatever it happens to be called
// on this machine, so it never appears as a child of itself. Add it by location.
add(path.basename(workspace), workspace);
if (repos.length === 0) {
  console.error('no repositories with a .git directory found under ' + workspace);
  process.exit(2);
}

// A citation is a hex run that something in the same breath CALLS a commit. The
// proximity requirement is the whole check: a ledger is full of hex that is not a
// commit — key ids, log-stream names, artifact source hashes, request ids — and a
// detector that flags those is a detector someone disables (NN:48). Only a token
// introduced by a commit word counts, and only immediately.
// "hash" alone is deliberately NOT a lead-in: a ledger says "source-hash <hex>"
// and "stream <hex>" far more often than it says "commit hash <hex>", and the
// latter is already covered by "commit".
const CITED = /(?:commits?|landed(?:\s+(?:as|on|in))?|implemented\s+(?:in|as)|fixed\s+(?:in|on)|closed\s+on|adopted\s+on|shipped\s+in|reverted\s+in|cherry-picked\s+from)\s+(?:\w+\s+)?([0-9a-f]{7,40})(?![-_0-9a-zA-Z])/gi;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g;
const ALL_DIGITS = /^[0-9]+$/;
// A field may quote a hash precisely BECAUSE it does not resolve — the record of a
// dangling citation is itself a citation the checker would flag forever. One marker,
// naming the token, exempts that token in that field and nowhere else.
const MARKER = (tok) => new RegExp('citation-not-resolvable:\\s*' + tok + '\\b');

function candidates(text) {
  // Mask UUIDs first so their leading 8-hex block cannot be read as a short hash.
  const masked = text.replace(UUID, (m) => 'x'.repeat(m.length));
  const out = new Set();
  for (const m of masked.matchAll(CITED)) {
    const tok = m[1];
    if (!ALL_DIGITS.test(tok)) out.add(tok);
  }
  return out;
}

const resolved = new Map();
function resolves(tok) {
  if (resolved.has(tok)) return resolved.get(tok);
  let hit = null;
  for (const { name, dir } of repos) {
    try {
      const type = execFileSync('git', ['-C', dir, 'cat-file', '-t', tok], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
      if (type === 'commit') { hit = name; break; }
    } catch { /* not in this repository */ }
  }
  resolved.set(tok, hit);
  return hit;
}

const dangling = [];
let checked = 0;
for (const f of findings) {
  const fields = [
    ['claim', f.claim],
    ['fix', f.fix],
    ['evidence.snippet', f.evidence?.snippet],
    ['provenance.verifier_evidence', f.provenance?.verifier_evidence],
    ...(f.history ?? []).map((h, i) => [`history[${i}].note`, h.note]),
  ];
  for (const [field, text] of fields) {
    if (typeof text !== 'string') continue;
    for (const tok of candidates(text)) {
      if (MARKER(tok).test(text)) continue;
      checked++;
      if (!resolves(tok)) dangling.push({ id: f.id, field, token: tok });
    }
  }
}

if (checked === 0) {
  console.error('VACUOUS: matched no commit citations at all across ' + findings.length +
    ' findings. The ledger cites commits constantly, so this is the detector failing, not the ledger passing.');
  process.exit(2);
}
if (dangling.length === 0) {
  console.log(`OK: ${checked} commit citation(s) across ${findings.length} findings all resolve in ` +
    repos.map((r) => r.name).join(', '));
  process.exit(0);
}
console.error(`DANGLING CITATIONS — ${dangling.length} of ${checked} do not resolve in any repository:`);
for (const d of dangling) console.error(`  - ${d.id} ${d.field}: ${d.token}`);
console.error('\nA citation that resolves to nothing reads as proof and carries none (OO:3).');
console.error('Cite the hash read back from the trunk AFTER the land rebases it, not the slot-side one.');
process.exit(1);
