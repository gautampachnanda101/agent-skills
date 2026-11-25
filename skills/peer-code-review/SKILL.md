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

Review a change so the author gets two things: a verdict they can act on
today, and findings that point at real defects, not opinions. The rules in
this skill come from people who studied review in practice — Google's
[eng-practices review guide](https://google.github.io/eng-practices/review/),
Michael Fagan's IBM inspections, Karl Wiegers' [*Peer Reviews in Software*](https://processimpact.com/),
Gerald Weinberg's "egoless" review culture from *The Psychology of Computer
Programming*, Steve McConnell's *Code Complete*, and the research of Jason
Cohen (SmartBear) and Bacchelli & Bird. For user-interface changes it also
applies the UK Government Digital Service's
[WCAG 2.2 AA](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/plan-manage-content/understand-accessibility/)
accessibility standard.

Three findings from that research shape everything below:

1. Attention decays: Cohen's review data shows defect-finding rates fall
   sharply after roughly 400 reviewed lines in a sitting. So review in
   small passes.
2. Reviewers add the most value on design, maintainability, and
   evolution — Bacchelli & Bird's study of real reviews found most
   comments there, even though reviewers expect functional defects. So
   spend human attention where machines cannot.
3. Reviews work when the author is not attacked — Weinberg's "egoless"
   teams. So talk about the code, never the person.

## Gather context first

- Read what the change claims to do first: the description, the linked
  ticket, the base branch. A finding made without this context is
  speculation about intent.
- Fetch the diff with the host's Git or Bash tools. If the scope is
  unclear, ask once, in a single batch: which diff or pull request, which
  base branch, and whether this review should block or only advise.
- Fagan's inspections call this "preparation": run whatever is available
  and authorized — tests, linters, builds — before reading line by line.
  The compiler and the test suite find the mechanical failures for free.

## Pace the review in passes

- Keep each sitting to roughly 200-400 changed lines and about an hour of
  attention. Defect-finding rates fall sharply past that in Cohen's
  review data. A 1,000-line change is a follow-up-passes change: split it.
- Give each pass one question to answer — this pass checks correctness
  and tests, the next design and maintainability, the last documentation
  and release impact. Reading the same lines repeatedly for different
  concerns wastes attention; one pass per concern does not.
- Reply within one business day (Google's rule), even if the full review
  is not done: send the broad comments now, the rest later. The author
  must stay unblocked.

## Run the mechanical passes before reading lines

Machines should check what machines are good at: formatting, types,
declared lint rules. Both Google's guide and Wiegers' book agree — review
attention belongs with the judgment questions no linter can answer. When
the project declares a linter (ESLint, Ruff, mypy, golangci-lint, cargo
clippy, or an equivalent), run it before reading, and again after fixes;
re-review only what changed since the last run.

- Record what ran, and what could not: a configured linter you could not
  run is reported as unevaluated, never silently skipped.
- Do not re-report linter output as review findings. Use it as a map:
  flagged lines and hot files tell you where the human pass matters most.
- Some signals deserve findings even when the linter is green:
  - new suppressions (`noqa`, `eslint-disable`, `#[allow]`) without a
    reason in the change — at least `minor`, blanket ones `major`;
  - test coverage dropped on changed paths, or coverage never ran on them —
    `major` until justified;
  - type discipline loosened (new `any`/`Any` escapes, widened exceptions) —
    `minor` unless it crosses a security boundary;
  - duplicated logic a linter cannot see — walk the checklists.

## Apply the checklist

Load [checklists.md](./checklists.md) and walk the checklists that fit this
change. They follow Google's eight review dimensions — design,
functionality, complexity, tests, naming, comments, style, documentation —
plus accessibility and linting sections. Style rules a formatter can
enforce are not reviewer material: mention a missing tool once, not a
missing semicolon per line.

## Findings a reviewer reports

- Severity ladder: `blocker` (merge must wait), `major` (fix before merge
  unless explicitly deferred), `minor`, `nit`, `question`, `defer`.
- Every finding shows its evidence: `file:line` plus a short code quote.
  Without a location it is an opinion, not a finding.
- Explain the why: "This retry swallows all exceptions, so a bad state
  reaches the queue silently" teaches something; "handle exceptions
  properly" does not. A suggestion is welcome as direction or an optional
  fix — not a demand (Google's comment guidance).
- A `question` stays a question: ask it, do not block on it.
- Approvals follow Google's rules: `approve` once no blockers or majors
  remain; minors may ride along as comments; `request changes` when a
  blocker or major is open. A change too large to review is itself a
  finding — ask for a split.

## Tone rules

- The code is on trial, the author is not. Weinberg's "egoless" teams made
  this their culture; every reviewer must too. Say "this function re-reads
  the file on every call" — never "you should have cached this".
- Praise is welcome but never owed (Google says so explicitly). Record what
  genuinely works — a clean test-seed strategy, a good API boundary. Filler
  praise destroys the signal for real praise.
- Never guess at intent you did not read, and never quote a secret that
  appears in a diff: name its presence so the author can rotate it.

## The report

End with a verdict the author can act on in one read:

1. Verdict: `approve`, `approve with comments`, `request changes`, or
   `split before review`.
2. Findings table: severity, location, evidence, suggested direction.
3. Strengths worth keeping — genuine ones only.
4. Deferred items: what should become a ticket instead of blocking this
   change.

## Follow up and close

Fagan's final phase is follow-up, and a review is not over until it has
happened. After the author pushes fixes: re-run the checks that failed,
confirm every finding is resolved or moved to the deferred list, and update
the verdict. The exit criteria are the same as the entry rules: checks
pass, blockers and majors are resolved or deferred, and the author knows
exactly where they stand.

## Boundaries

- Never push, merge, or modify the author's branch; the review comments,
  the author commits.
- Never approve what you could not verify — say the check did not run.
- Never request secrets, and never paste a token value into a review.
