---
name: peer-code-review
description: Run an evidence-based peer code review of a diff, commit series, or pull request using the documented practices of Google's eng-practices review guide, Fagan inspections, Karl Wiegers' peer-review research, and McConnell's checklists, with pacing rules from the peer-review literature. Reviews in small passes with a fixed checklist, reports prioritized findings with file:line evidence and severity, explains why instead of what, and for user-interface changes checks accessibility against WCAG 2.2 AA as GOV.UK applies it. Use when asked to review code, a pull request, a diff, a commit, or to define or improve a team's review process.
license: Apache-2.0
compatibility: Host assistant with file-read and Git or Bash tools. Checklists are Markdown; commands such as tests and linters run only where authorized and available. No network access is required beyond fetching the change under review.
metadata:
  author: gautampachnanda101
  version: "1.2.0"
---

# Peer code review

Review changes the way the evidence says software review works best: focused
passes against a checklist, defects kept technical rather than personal, and
a verdict the author can act on immediately. Grounded in Google's
[eng-practices code review guide](https://google.github.io/eng-practices/review/),
Fagan's inspection method, Karl Wiegers' [*Peer Reviews in Software*](https://processimpact.com/),
Gerald Weinberg's egoless review principles, Steve McConnell's *Code
Complete*, the peer-review research of Cohen (SmartBear) and Bacchelli &
Bird, and the UK Government Digital Service's accessibility standard —
[WCAG 2.2 AA as GOV.UK](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/understand-accessibility/)
applies it to content, for user-interface changes.

## Gather context first

- Establish what the change claims to do: read its description, linked issue
  or ticket, and base branch before judging code. A finding without intent
  context is speculation.
- Fetch the diff with the host assistant's Git or Bash tools. If the scope is
  unclear, ask one batched question set: which diff or pull request, which
  base branch, and whether the review should block or advise.
- Prepare like a Fagan inspection: when tests, linters, or builds are
  available and authorized, run them before reading line by line. Mechanical
  failures explain most findings for free; do not spend review attention on
  what a compiler already reports.

## Pace the review in passes

- Review in sessions of roughly 200-400 changed lines and cap continuous
  attention near an hour: defect-finding rates fall sharply beyond that in
  the peer-review literature (Cohen, *Best Kept Secrets of Peer Code*).
  A 1,000-line change deserves follow-up passes, split by concern.
- Plan each pass with one question: which dimension is this pass checking?
  Suggested order: correctness and tests first, then design and
  maintainability, then documentation and release impact. Re-reading the same
  lines for different concerns wastes attention; one pass per concern does
  not.
- Respond within one business day (Google's rule) and keep the author
  unblocked: if a full review is not possible now, send the broad design
  comments immediately and the rest later.

## Run the mechanical passes before reading lines

Linters, formatters, and type-checkers are the deterministic first pass —
Wiegers' and Google's shared principle is that review attention belongs to
judgment questions machines cannot answer. When the project declares a
linter (ESLint, Ruff, mypy, golangci-lint, cargo clippy, or equivalent),
run it via the host's Git or Bash tools before reading line by line, and
run it again after fixes; re-review only files that changed since the last
check.

- Record what ran and what could not run: an unavailable linter is reported
  as unevaluated, never assumed clean.
- Machine findings are context, not findings: do not re-report linter
  output; use it to focus attention on the code around flagged lines.
- Quality signals deserve findings even when the linter is green:
  newly added lint suppressions (`noqa`, `eslint-disable`, `#[allow]`) need
  a reason in the change; a coverage drop on changed paths is a `major`;
  new `any` escapes or widened exceptions in typed code are `minor`;
  duplicated logic the linter cannot see goes through the checklists.

## Apply the checklist

Load [checklists.md](./checklists.md) and walk the four checklists that fit
the change. The dimensions come from Google's review guide: design,
functionality, complexity, tests, naming, comments, style, and
documentation. Style rules a formatter or linter can enforce are not reviewer
material; mention tooling gaps once, not per line (Bacchelli & Bird found
reviewer attention is better spent on maintainability and evolution, which is
where human review adds value machines do not).

## Findings a reviewer reports

- Severity: `blocker` (merge must wait), `major` (fix before merge unless
  explicitly deferred), `minor`, `nit`, `question`, `defer`.
- Every finding cites evidence: `file:line` plus a short quote of the code.
  A finding without location or quote is an opinion, not a finding.
- Explain why: "This retry swallows all exceptions, so a bad state reaches
  the queue silently" beats "Handle exceptions properly". Say what you would
  do differently only as direction or an optional suggested fix, never as a
  demand (Google's comments guidance).
- Questions are questions: label them `question` and do not let them block.
- Approval semantics: `approve` when no blockers or majors remain (Google's
  LGTM-with-comments covers minors the author may defer);
  `request changes` for blockers/majors; if a change is too large to review
  thoroughly, the finding is procedural: ask for a split.

## Tone rules

- The code is the artifact under review, never the author (Weinberg's egoless
  framing). Write "this function re-reads the file per call", never
  "you should have cached".
- Gratitude and praise are welcome but not owed (Google's explicit guidance).
  Record what genuinely works: a clean test seed strategy or a good API
  boundary goes in the report. Empty filler praise corrupts the signal.
- Never speculate about intent without reading the ticket, and never quote a
  secret that appears in a diff; flag its presence and let the author rotate
  it.

## The report

End with a structured verdict the author can act on:

1. Verdict: `approve`, `approve with comments`, `request changes`, or
   `split before review`.
2. Findings table: severity, location, evidence, suggested direction.
3. Strengths worth keeping (genuine ones only).
4. Deferred items and follow-ups: what should become a ticket rather than
   block this change.

## Follow up and close

Fagan's last phase is follow-up: after the author pushes fixes, re-run the
failed checks and confirm each finding is either resolved or moved to the
deferred list. A review closes only when the exit criteria are met: checks
pass, blockers and majors resolved or deferred, and the verdict updated.

## Boundaries

- Never push, merge, or modify the author's branch; reviews comment, the
  author commits.
- Never approve unverified claims: if a check could not run, say so and mark
  it rather than assuming.
- Do not request secrets, and do not paste token values into reviews if the
  diff contains them.
