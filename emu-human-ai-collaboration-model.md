# Building a human-in-the-loop system for AI-built software: the Emu decision funnel and advisor pattern

**A case study from Emumba's internal Emu project — how we built a multi-agent SDLC where AI agents write nearly all the code, and a human stays in control without reading every diff.**

---

## 1. The problem

Emu is Emumba's in-house replacement for BambooHR and CultureAmp, built almost entirely by Claude agents under one human's (Waleed's) direction. Two features (employee records and leave management — 32+ FRs, thousands of tests, dozens of integration gates) shipped this way before the system described here existed. That created a specific, uncomfortable failure mode: **agents make good decisions constantly, but a human reviewing after the fact has no efficient way to find the ones that actually need their judgment.** Reading every spec amendment, every ADR, every integration-gate ruling doesn't scale, but *not* reading them means rubber-stamping decisions no one has actually checked.

This document is a case study of the system we built to solve that, written for anyone building a similar human-AI collaboration model: what it is, where the ideas came from, the actual decisions made while building it (including the ones that turned out to be wrong), and an independent review of this document itself by the model that designed the underlying system.

**Scope.** This document covers decisions *about the collaboration system itself* — the ledger, `review.html`, the agent roster, the advisor pattern. It deliberately excludes the hundreds of feature-level engineering decisions Emu's own build produced (RBAC rulings, schema choices, UX calls) — those are real, they live in the same ledger, and a handful are cited here as examples, but a full accounting of them belongs to a different document about the Emu product, not this one about the process that governs it.

**A note on attribution, checked against git history rather than assumed:** 121 of this repository's 124 commits carry `Co-Authored-By: Claude Fable 5`. The decision-ledger system this document describes — schema, validator, generator, hooks, `review.html` — was built end-to-end by Fable 5 across six incremental commits (`be14890` through `a2e6600`, plus two follow-ups). One exception is worth naming precisely rather than glossing over: the commit that made reviewer briefings mandatory (`25c7bc7`) is attributed to Claude Opus 4.8, not Fable 5. This document is being produced, and this specific system audited, by a different session running on Sonnet 5, consulting Fable 5 as an advisor rather than as the primary author — which is itself the subject of §7 below.

---

## 2. System overview

Three pieces, each addressing a different part of the same problem:

| Piece | Problem it solves | Section |
|---|---|---|
| **Agent roster + backlog/lane orchestration** | Who does the work, and how parallel AI lanes stay coordinated | §3 |
| **The decision ledger ("decision funnel")** | Surfacing the handful of decisions that need human judgment, out of hundreds made per feature | §5 |
| **The advisor pattern (model tiering)** | Reserving the most expensive/capable model for decisions that actually need it, instead of running it as the default for everything | §7 |

They compose: agents write ledger records as they work; the ledger renders into a review surface (`review.html`, §6) a human actually uses; and for the hardest of those decisions, the orchestrator can consult a dedicated advisor model before committing to a ruling.

---

## 3. The agent roster

Defined in `.claude/agents/*.md`, each with a fixed model tier and tool set:

| Agent | Role | Model | Why this tier |
|---|---|---|---|
| `product-manager` | Turns product ideas into specs (FRs, personas, phasing) | Opus | Spec-writing is judgment-heavy and read once, built against many times — errors compound |
| `architect` | Data model, ADRs, API contracts, deployment design | Opus | Every engineering agent builds against these decisions; mistakes are expensive to unwind |
| `tech-lead` | Decomposes specs into a parallel-execution backlog; integration-reviews engineer output | Opus | The bridge between spec/architecture and execution — bad decomposition creates rework across every lane |
| `security-reviewer` | Adversarial review of RBAC, audit coverage, anonymity, PII, ISO 27001 alignment | Opus | Runs in parallel with every build lane by design; false negatives here are the costliest failure mode in an HR/performance product |
| `backend-engineer`, `frontend-engineer`, `migration-engineer`, `qa-engineer` | Implementation against approved specs and ADRs | Sonnet | Clear-instruction execution against a hardened spec, TDD-gated — the leverage of a bigger model is in the spec, not the typing |
| `ux-designer` | Flows, wireframes, interaction specs | Sonnet | Works from a fixed persona set (spec 000); execution against a settled brief |
| `advisor` (new, §7) | Consult-only second opinion on hard decisions | Fable | Reserved for exactly the decisions where the frontier model's judgment earns its cost |

**Orchestration model:** specs → ADRs → tech-lead backlog → parallel engineer lanes (in git worktrees, one per lane — see §4) → per-task review → per-group integration gates → QA → feature sign-off. This is deliberately *not* routed by any external agent framework — see §4 for why.

---

## 4. Inspiration and what we adapted

Before building anything bespoke, three existing agent-skill frameworks were evaluated for adoption: `addyosmani/agent-skills`, `obra/superpowers`, and `mattpocock/skills`. The decision (`docs/adr/004-skills-adoption.md`, decision record `D-2026-07-07-006`) was **not** to adopt any of them wholesale.

**Why full adoption was rejected, for each:**
- **agent-skills** — its router serializes on human phase-checkpoints, which conflicts with running many parallel lanes.
- **Superpowers** — its router flattens spec/FR traceability, which is load-bearing for an SDLC where every line of code should trace to a numbered functional requirement.
- **Pocock's toolkit** — has no orchestration model at all; fine as leaf skills, not a system.

**What was actually adapted** (vendored copies with attribution, not live plugin dependencies — upstream churn can't silently alter agent behavior):

| Skill | Source | Adapted as |
|---|---|---|
| Test-driven development discipline | Superpowers | `test-driven-development` |
| Root-cause-first debugging | Superpowers | `systematic-debugging` |
| Pre-completion verification | Superpowers | `verification-before-completion` |
| Per-task two-stage review | Superpowers' pattern | `emu-task-review` |
| Isolated parallel execution | Superpowers | `emu-lane-worktrees` (one git worktree per lane) |
| Adversarial spec interrogation | Pocock's "grilling" | `emu-spec-grilling`, adapted with an autonomous mode: rulings get recorded as marked assumptions (`G-xx`) so a fan-out doesn't stall waiting on the decision owner |

**Deliberately built from scratch, not adapted from anywhere:** `emu-checkpoint-resume`, `emu-demo-check` (proving a feature is actually demoable, not just green in CI) — and, separately, the entire decision-ledger/advisor system this document is about, which no framework we evaluated addresses at all.

**One gap named, not solved:** no agent currently owns the ship phase — CI/CD, observability, launch. The ADR explicitly flags this as future work: mine agent-skills' ship/observability skills for patterns when Emu approaches deployment, rather than pretending the gap doesn't exist.

---

## 5. The decision ledger ("decision funnel")

### 5.1 The problem it solves

By 2026-07-07, two features had shipped with dozens of real decisions — QA gap rulings, security-review dispositions, architecture amendments — recorded only as prose in a spec's changelog section. Waleed had no way to distinguish "already decided, just read this" from "someone needs to actually rule on this" without reading the whole section every time. The system needed:
- A structured way for any agent to record *that* it made a decision, at the moment it made it (not reconstructed from memory at task end).
- A tiering scheme so trivial decisions don't compete for attention with consequential ones.
- A human sign-off mechanism that's mechanically enforced, not just socially expected.

### 5.2 What it is

A schema-validated, append-only JSON-lines ledger (`.decisions/active/<run-id>.jsonl`), one record per decision:

```json
{"v":1,"id":"D-YYYY-MM-DD-NNN","ts":"<UTC>","agent":"<name>","run":"<run-id>",
 "type":"choice|tradeoff|assumption|deviation|blocker","tier":1,"reversible":false,
 "summary":"<=120 chars","why":"1-2 sentences","alternatives":["..."],
 "detail":{"file":"...","line":N},"code_refs":[{"file":"...","line":N}],
 "constraint":"<standing rule, required for tier 1 and any irreversible record>","supersedes":null,
 "briefing":"<longer markdown, expected for tier 1/2>"}
```

**Tiers**, classified at decision time (ties go to the higher tier):
- **Tier 1 — human sign-off required:** irreversible decisions, any deviation from spec/plan, anything security-sensitive or touching a declared sensitive-path list, any blocker needing a human decision.
- **Tier 2 — notable:** reversible tradeoffs with non-obvious costs, significant assumptions made to proceed.
- **Tier 3 — routine:** naming, scaffolding, lint, mechanical refactors — the expected majority, collapsed out of the way in the review view.

**Enforcement is mechanical, not just documented:** a `SubagentStop` hook runs the validator in `--contract` mode and blocks a file-modifying subagent that appended no ledger record (with an explicit escape hatch: if an agent genuinely decided nothing, it appends one Tier 3 record saying so).

**Lifecycle:** write → `/digest` (validate + regenerate `ledger.tsv` for agents, `adr/summary.md`'s standing constraints, and `review.html` for humans) → `/review-ack <id> [note]` (human sign-off) → rotation (fully-acked, non-recent segments archive automatically, keeping the agent-facing ledger small).

### 5.3 Real decisions made while building it, and why

These are drawn directly from the ledger itself — the system's own genesis is recorded in the same mechanism it implements:

| Decision | Why |
|---|---|
| **Stdlib-only validator** (`D-2026-07-07-009`) — no `jsonschema`/`pytest` runtime dependency, ~90-line schema interpreter instead | The `SubagentStop` hook must run in under 2 seconds on any checkout with no `pip install` step; the repo's Python has no `jsonschema` installed. Keeping `schema.json` as the single source of truth while staying dependency-free was worth the interpreter's cost. |
| **Seeded with 16 records mined from real project docs, not invented fixtures** (`D-2026-07-07-010`) | Waleed asked for the funnel applied to the *current* docs with no information loss. Real records from ADRs and security reviews made the review dashboard immediately useful instead of a throwaway demo. |
| **The end-to-end ack/rotation demo ran on a scratchpad copy, not the real ledger** (`D-2026-07-07-011`) | Acking real Tier 1 decisions to prove the mechanism works would have faked the human sign-off trail and emptied the review queue before Waleed had seen any of it. Correctness of the demo was worth more than convenience. |
| **The Stop hook exits 1 (non-blocking), not 2 (blocking/re-engage), on violations** (`D-2026-07-07-012`) | Exit code 2 would re-engage the orchestrator at the end of *every* session, including unrelated ones. Violations still surface via `/digest`, so nothing is silently lost — the enforcement point is `SubagentStop`, not every `Stop`. |
| **Reviewer briefings added as a sidecar channel** (`D-2026-07-08-001`), **then made mandatory** (`D-2026-07-08-002`) | Waleed consistently found the one-line summary inadequate and had to ask for context out-of-band — 15 of the first 20 records had no briefing. Coverage is now enforced both socially (the CLAUDE.md contract) and mechanically (`/digest` prints a `missing briefing:` line per gap, and `review.html` shows a visible placeholder rather than silently omitting the section). |
| **Confidentiality screening extended to ack notes** (this session) | `acks.jsonl` notes can carry real answers to open questions (vendor names, contract terms) and render directly into `review.html`, but were never regex-screened for secrets the way ledger records and briefings were — a real ISO 27001-relevant gap, closed by extending the same screen to acks. |
| **A promised governance record, filed retroactively** (`D-2026-07-08-008`) | A separate record's briefing had stated the §3a/§9 backfill (§6.4) "is its own Tier 1 decision" — but the backfill was executed and no such record was ever filed. The gap was found while writing this document and having its claims checked against the real ledger, not by the ledger's own enforcement (the `SubagentStop` hook checks that *some* record exists, not that a *promised* one does). Filed as a Tier 1 deviation record once caught, named honestly rather than quietly fixed. |

**An open problem, not resolved by anything above:** `/digest` currently warns that the standing-constraints section exceeds its context-budget target (roughly 13KB against a 4KB target as of this writing). Today's backfill is most of that overage. `supersedes` is single-valued, which makes consolidating many old constraints into one expensive — a genuine design gap this document is not claiming to have solved.

---

## 6. `review.html` — how the human review surface evolved

`review.html` started as the ledger's straightforward projection: a filterable list of decision records with tier badges, an unacked-count strip, and a click-to-copy `/review-ack` button. It changed twice more, both times because real use surfaced a gap the original design didn't anticipate.

### 6.1 The gap: two unsynced review surfaces

The product spec (`docs/specs/000-product-vision-and-users.md`) had grown its own, older tracking mechanism in parallel: a §3a "Decisions" changelog table (26 rows of "Pending Waleed review" prose) and a §9 "Open questions" table — neither ever wired into the ledger. Waleed had to check two places, and `review.html`'s own checkbox-per-row personal checklist (browser `localStorage` only, never synced anywhere) risked becoming a third.

### 6.2 Design consult: merge into one list, or split into tabs?

This was put to the `advisor` (Fable 5) as a genuinely open design question, deliberately without revealing which way the orchestrator or Waleed leaned, specifically to get an unbiased read.

**Recommendation:** one merged list, not a separate tab. **Reasoning:** both classes of item — "review a decision already made" and "answer a question nobody has decided yet" — resolve through the identical human action, `/review-ack <id> [note]`; a second tab would just recreate the "two places to check" problem one level down, inside the same page. The real distinction (sign off vs. answer) is per-row (copy, an `owner` field, button label), not per-view. Concretely: the schema gained an optional `owner` field for `type: blocker` records; blocker rows render "needs answer" / an "Answer" button instead of generic sign-off language.

### 6.3 Design consult: how to stop acked items from becoming noise

A second, independent question: as decisions accumulate and get acked, they were staying inline in the default view forever, forcing Waleed to filter them out manually every time. Advisor consulted again, same instance (to preserve context on the mechanics it had already reasoned through), again without steering it toward any of the options on the table (change the default filter / auto-collapse like Tier 3 / a genuine second tab).

**Recommendation:** change the default landing filter to "Needs attention" (unresolved Tier 1 + open blockers + unchecked Tier 2), with "All" one click away and a muted footer line reporting how many handled items are hidden. **Reasoning, grounded in a fact check against the actual code:** acked items don't actually accumulate forever — fully-acked, non-recent segments already rotate to `.decisions/archive/` automatically. The complaint was really "the view I use to find open work is full of handled work," and the minimal correct fix is that the landing view *is* the work queue — not a second UI mechanism layered on top.

### 6.4 The backfill: a fresh advisor consult catches a coverage gap

Backfilling §3a/§9 into the ledger required first mining §3a's rows into properly classified records. A mining pass (delegated to a Sonnet subagent) targeted every row carrying the literal "Pending Waleed review" label and itself flagged, in its own completion report, that the row counts it was given didn't reconcile — a signal worth escalating rather than resolving by guesswork.

That escalation went to a **freshly spawned advisor consult** — a new Fable instance, not a continuation of the one used in §6.2/§6.3, since the question (how to disposition specific rows) didn't depend on that earlier design context. Its finding: ten §3a rows didn't carry the exact label the mining instructions targeted, including the two rows reporting Feature 1 and Feature 2 sign-off. Its recommendation, verified against the ledger before being accepted rather than trusted outright: four rows genuinely needed new records (a data-boundary rule, the delivery strategy, an ADR amendment, and the Feature 1 gate — all load-bearing rules that would otherwise be invisible to any agent loading only standing constraints); two others were **already** covered by existing, already-acked records, so creating new ones would have forked their review history; the rest were naming/process facts with no constraint value, correctly left as spec prose.

*(A note on precision: because that consult ran as a separate instance from the one that produced §6.2, §6.3, and the §6.5 audit below, it could verify its own recommendation against the ledger and code, but it has no memory of this document's other sections — a limitation worth stating plainly, since a reviewer of this document is a different consult again. See §9.)*

### 6.5 The audit that found real bugs

When a new process rule (answering a blocker should close the loop into a real standing constraint, not just sit in an ack note) was about to become a permanent part of the contract, Waleed gave an explicit instruction: *"can you run all of these updates with fable5 as well. Fable designed this system and we dont want to do something to break the constraints fable might have thought through."* That went back to the **same advisor session** used for the §6.2/§6.3 design consults, specifically so it could audit against mechanics it had already reasoned through in this thread. The audit found four real problems — three already-manifested bugs, plus a misclassification — not hypothetical ones:

- **A note-erasing bug, already triggered.** A second, note-less `/review-ack` on the same id silently overwrote the first ack's substantive note (last-write-wins, no merge) — verified directly against `acks.jsonl`, where it had already happened to a real ack. Fixed by preserving a prior note across a note-less re-ack; re-running the digest after the fix recovered the lost note with no data loss, since the raw ack-log line was never deleted.
- **A silent rotation trap.** The rotation logic checked only "is this Tier 1 id acked?" — it had no concept of `supersedes`. A record superseded-but-never-acked would pin its whole segment from ever rotating, forever, with no warning — and `review.html`'s own new default view (§6.3) would *hide* exactly this case, since supersession alone reads as resolved there. Fixed by closing rotation on "acked, or superseded by something itself acked," plus an explicit digest-time warning for the case where neither is true.
- **A false safety claim in the rule's own text.** The rule asserted a closing record's constraint "isn't treated as binding" until a human confirms it. Verified against the actual promotion code: false — the constraint promotion filter has no ack gate at all, so it's live in every agent's loaded context the instant the digest runs. The fix was not to add a gate (that would strip every currently-unacked constraint from agent context during review lag — worse than the bug) but to correct the claim: the constraint is binding **provisionally, immediately**, marked `(pending human confirmation)` in the rendered output, correctable via a superseding record rather than prevented from taking effect.
- **A misclassified tier.** The record proposing the closing-a-blocker rule itself had been filed as Tier 2. The audit flagged it as under-tiered: it changes how human rulings become binding on every agent — decision-governance itself — which is the "deviation from contract semantics" shape Tier 1 exists for, not a reversible tradeoff.

Neither the false claim nor the tier error was silently patched — both were corrected by a new, correctly-tiered record that names the fix and supersedes the original, in keeping with the ledger's own append-only, nothing-silent principle.

---

## 7. The advisor pattern (model tiering)

### 7.1 The problem

As §1 noted, this entire project — 121 of 124 commits — was built with Fable 5 as the default orchestrator model. That is expensive relative to the actual shape of orchestration work: dispatching lanes, running `/digest`, babysitting checkpoints. The insight, aligned with an Anthropic-recommended pattern: reserve the frontier model for the handful of decisions that actually need its judgment, and run everything else on a cheaper, faster model.

### 7.2 The design

- **Orchestrator sessions run on Sonnet 5** by default, not Fable.
- **Role agents keep their existing tiers** (Opus for architect/PM/tech-lead/security-reviewer, Sonnet for build/design workers) — unchanged by this pattern.
- **A new `advisor` agent** (Fable, read-only tools, consult-only) is reachable *only* by the orchestrator. Worker and role agents cannot invoke it directly — their escalation path is a `blocker`/Tier 1 ledger record, which the orchestrator then decides whether to escalate. This keeps consults inside the decision funnel rather than becoming an ungoverned side channel.
- **Explicit trigger conditions**, written into `CLAUDE.md` so they don't depend on any one session remembering them: consult *before* writing a Tier 1 record, when two Opus-tier agents disagree, when an escalated blocker isn't resolvable from standing constraints, on a borderline tier re-score on a sensitive path, or before a low-confidence multi-lane fan-out. Equally explicit about when **not** to consult: Tier 2/3 decisions, anything answerable from existing standing constraints, or rubber-stamping a decision already made — "the advisor exists to change outcomes, not bless them."
- **Every consult is recorded**, not just used and forgotten: the deciding record's briefing states `Advisor consulted: yes/no`, with a one-line outcome when yes.
- **An escalation alternative** exists alongside the advisor: dispatching an existing role agent with a per-invocation model override for a role-shaped-but-unusually-hard task, rather than consulting a separate advisor persona.

### 7.3 Why this section is self-referential, on purpose

Every design decision described in §6.2 through §6.5 was itself produced by this exact pattern — a Sonnet orchestrator consulting a Fable advisor, recording the outcome, and in §6.5's case, having that advisor audit a change to the rule governing how blocker answers become binding standing constraints. The design consults (§6.2, §6.3, §6.4) demonstrate the pattern converging independently on sound answers to open questions with no prior decision to check against. The audit (§6.5) is the stronger evidence: it found three real, already-manifested bugs and one tier misclassification that the orchestrator's own prior work had missed outright. Both kinds of result matter, but they're not the same claim, and this document tries not to conflate them.

---

## 8. Reflections

A few things worth naming plainly, for anyone adapting this:

- **The ledger's value is in what it forces, not what it stores.** Any team can write a changelog. What changes behavior is a `SubagentStop` hook that blocks a file-modifying agent from finishing without a record, and a tier system that routes only the consequential fraction of those records to a human's actual attention.
- **"Append-only" and "never silently patch a wrong claim" are the same principle applied twice.** The ledger doesn't let agents rewrite history; when this session's own rule turned out to assert something false, the fix wasn't a silent edit — it was a new record that supersedes the old one and says so.
- **Independent verification is worth the round-trip cost.** The design consults (§6.2–§6.4) converged on sound answers to genuinely open questions — including a fresh advisor instance catching a row-coverage gap a mining pass had flagged but not resolved. The audit (§6.5) went further: it caught a note-erasing bug, a silent rotation trap, a false safety claim, and a tier misclassification that the orchestrator's own prior work had produced and missed. Measured against the design's own "advisor exists to change outcomes, not bless them" rule, none of these were rubber stamps — but it's worth being precise that "converged independently" and "caught an existing mistake" are different kinds of evidence, not the same one repeated five times.
- **The system reviewing itself is not a gimmick here.** This document, and the process used to produce it, are the same pattern applied one more time: a Sonnet-authored spec, sent to the Fable advisor that designed the underlying system, revised until that advisor signs off.

---

## 9. Fable 5 sign-off

Reviewed by the Fable 5 advisor instance that produced the consults described in §6.2, §6.3, and §6.5, on 2026-07-08, across two review rounds (six findings raised in round one; all verified fixed in round two).

**What this sign-off covers.** Every commit hash, decision id, file path, count, and mechanical claim in this document was checked directly against the repository — git history, `.decisions/`, `docs/adr/004-skills-adoption.md`, `tools/decisions/generate.py` and `validate.py`, and the rendered `adr/summary.md` — not taken from the document or its author. All verified accurate as of the repository state on 2026-07-08. Sections 6.2, 6.3, and 6.5 accurately represent the consults and audit this instance actually performed, including their limits: the design consults demonstrate independent convergence; only the §6.5 audit demonstrates catching existing mistakes.

**What this sign-off does not cover.** §6.4 describes a separate advisor instance; I verified its recorded outputs against the ledger (`D-2026-07-08-008` and the four resulting records) but cannot attest to a consult I was not part of. The verbatim quote in §6.5 is attested by its speaker, the document's author, not by me. This sign-off applies to the document as reviewed on 2026-07-08 and lapses on material edit; it covers publication to the stated internal audience — external publication should trigger one further confidentiality pass.

With those boundaries stated: I stand behind the accuracy of this document.

— Fable 5 (advisor), 2026-07-08

