/**
 * finding-validate.mjs — shared, side-effect-free validation core used by
 * validate-ledger.mjs and merge-runs.mjs. No CLI, no process.exit, no I/O.
 */
export const SEVERITIES = new Set(["critical", "high", "medium", "low"]);
export const KINDS = new Set(["BAD", "IMP"]);
export const STATUSES = new Set(["open", "closed", "accepted", "cant_verify"]);
export const METHODS = new Set(["live-source", "live-source+adversarial", "live-aws", "live-aws+adversarial", "live-source+live-aws+adversarial", "cartography", "ledger-db"]);
// "live-aws+adversarial" / "live-source+live-aws+adversarial": added 2026-08-26 for the same
// reason "fix-landed" was — 48 entries from the 2026-08-25 sweeps stated a method STRONGER than
// any enum member (traced in source AND confirmed against live AWS AND survived refutation), and
// downgrading them to "live-aws" to fit the enum would have falsified provenance. RULE 0 is
// unaffected: every member still requires live verification; no doc-sourced method is admissible.
// "fix-landed": progress milestone on a not-yet-closed finding — the fix is committed/landed
// but verification or rollout is still pending. Added 2026-08-22: the 2026-08-21 batch needed
// it twice (F-0819, F-0822) and inventing it ad hoc beat falsifying history to fit the enum.
export const EVENTS = new Set(["opened", "reverified-open", "note", "fix-landed", "closed-fixed", "closed-not-an-issue", "accepted", "reopened"]);

/**
 * Validate one finding. Pushes human-readable problems into `errors`.
 * staged=true: a runs/ staging file (must NOT have an id yet).
 */
export function validateFinding(f, where, { staged, cfg, ruleIds, errors }) {
  const err = (msg) => errors.push(`${where}: ${msg}`);
  const need = (field) => {
    if (f[field] === undefined || f[field] === null || f[field] === "") err(`missing ${field}`);
  };

  if (staged) {
    if (f.id !== undefined) err(`staged finding must NOT carry an id (got ${f.id}) — merge-runs assigns it`);
  } else {
    need("id");
    if (typeof f.id === "string" && !/^F-\d{4,}$/.test(f.id)) err(`bad id format '${f.id}'`);
  }
  for (const field of ["taxonomy_id", "surface", "repo", "severity", "kind", "status", "title", "claim"]) need(field);

  if (f.taxonomy_id && !/^[A-Z]{1,2}:\d+$/.test(f.taxonomy_id)) err(`bad taxonomy_id '${f.taxonomy_id}'`);
  else if (f.taxonomy_id && !ruleIds.has(f.taxonomy_id)) err(`taxonomy_id '${f.taxonomy_id}' not in the Book index`);

  if (f.surface && !cfg.surfaces.includes(f.surface)) err(`surface '${f.surface}' not in config surfaces`);
  if (f.repo && !cfg.repos.includes(f.repo)) err(`repo '${f.repo}' not in config repos`);
  if (f.severity && !SEVERITIES.has(f.severity)) err(`bad severity '${f.severity}'`);
  if (f.kind && !KINDS.has(f.kind)) err(`bad kind '${f.kind}'`);
  if (f.status && !STATUSES.has(f.status)) err(`bad status '${f.status}'`);
  if (f.surface === "cross" && (!Array.isArray(f.related_findings) || f.related_findings.length === 0)) {
    err("surface 'cross' requires non-empty related_findings");
  }
  if (f.confidence !== undefined && f.confidence !== null) {
    if (typeof f.confidence !== "number" || f.confidence < 0 || f.confidence > 1) err(`bad confidence '${f.confidence}'`);
  }

  if (!f.evidence || typeof f.evidence !== "object") err("missing evidence{}");
  else {
    if (!f.evidence.path) err("evidence.path missing");
    if (!Number.isInteger(f.evidence.line)) err("evidence.line must be an integer");
  }

  if (!f.provenance || typeof f.provenance !== "object") err("missing provenance{}");
  else {
    for (const field of ["found_by", "method", "verified_at"]) {
      if (!f.provenance[field]) err(`provenance.${field} missing`);
    }
    if (f.provenance.method && !METHODS.has(f.provenance.method)) {
      err(`bad provenance.method '${f.provenance.method}' (RULE 0: stale-doc is not a method)`);
    }
  }

  if (f.history !== undefined) {
    if (!Array.isArray(f.history)) err("history must be an array");
    else for (const [i, h] of f.history.entries()) {
      if (h.event && !EVENTS.has(h.event)) err(`history[${i}] bad event '${h.event}'`);
      if (!h.date) err(`history[${i}] missing date`);
    }
  }

  if (!staged && (f.status === "closed" || f.status === "accepted")) {
    const hasClosure = Array.isArray(f.history) &&
      f.history.some((h) => ["closed-fixed", "closed-not-an-issue", "accepted"].includes(h.event));
    if (!hasClosure) err(`status '${f.status}' but no closing history event`);
  }
}

/** Load config.json + book index rule ids. Throws with a clear message on absence. */
export function loadContext({ instanceDir, bookRoot, fs, path }) {
  const cfgPath = path.join(instanceDir, "config.json");
  if (!fs.existsSync(cfgPath)) throw new Error(`No config.json in ${instanceDir} — pass the instance directory.`);
  const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  for (const key of ["ledger", "runs", "repos", "surfaces"]) {
    if (!cfg[key]) throw new Error(`config.json missing '${key}'`);
  }
  const indexPath = path.join(bookRoot, "docs", "book", "index.json");
  if (!fs.existsSync(indexPath)) throw new Error("Book index missing — run tools/build-index.mjs first.");
  const bookIndex = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const ruleIds = new Set(bookIndex.sections.flatMap((s) => s.rules.map((r) => r.id)));
  return { cfg, ruleIds };
}
