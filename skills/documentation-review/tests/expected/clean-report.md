# documentation-review: clean how-to page

**Mechanical pass (recorded, per skill rules):** not configured in the fixture; link target
(`README.md`) verified by inspection at the fixture path.
**Unevaluated:** nothing on this page — all claims are self-contained.

## Classification

- `clean.md` — **how-to guide**.

## Verdict

Verdict: `approve`

## Findings

| Severity | Defect | Evidence | Why |
| --- | --- | --- | --- |
| `nit` | The closing sentence carries a half-explanation ("...this page keeps it out on purpose") that is meta-commentary about the document rather than reader guidance | `clean.md:17-18` | The linking-out is the right design per Diátaxis; the meta sentence about what the page "keeps out" can simply be dropped — the link already says it |

## What works

- Outcome in the first two sentences, verifiable command with a fenced
  block, success and failure signals both stated, requirement wording
  correct (`need`, not `must`), descriptive link text, honest note about
  repeated runs — this page is the shape `guide.md` should converge to.
