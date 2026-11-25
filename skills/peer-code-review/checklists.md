# Review checklists

Four checklists for the passes described in [SKILL.md](./SKILL.md). Ask each
item as a question; record `pass`, `fail`, or `n/a` with evidence. Skip a
checklist only when the change provably cannot touch it. Sources: Google's
[review guide](https://google.github.io/eng-practices/review/) (G), Steve
McConnell's *Code Complete* (CC), Karl Wiegers' peer-review work (W), and the
OWASP top-risks framing (O).

## Correctness and design

- Can I demonstrate why this change is correct, or does a test do it for me?
- Does the change do what its description and ticket claim, and only that?
- Is the code as simple as the job allows; would a new maintainer understand
  it next quarter? (G: complexity; CC)
- Does the design fit the surrounding system, or does it introduce a second
  way to do something that already has one? (G: design)
- Are edge cases handled where the evidence implies they matter: empty,
  large, concurrent, malformed, and offline inputs?
- Is failure handling intentional: errors surfaced, not swallowed, with
  messages that say what failed and what to do? (CC)
- Are names precise and consistent with the codebase's vocabulary, so the
  reader predicts types and behavior from them? (G: naming; W)
- For behavior changes, is the old path removed or clearly deprecated with a
  migration note? (W: reviews catch obsolete assumptions)
- Is security part of each finding's evidence base where relevant: input
  validation, authorization decisions, secrets, dependency supply chain? (O)
- For performance-sensitive paths, does the change measure before it
  optimizes? (CC)

## Tests

- Do new or changed behaviors ship with tests in the same change? (G:
  related test code stays in the CL)
- Do tests assert behavior, not implementation details that a legitimate
  refactor would break?
- Are the tests deterministic (no sleep-and-pray, no order dependence)?
- Do negative cases exist: failure handling, empty inputs, boundary values?
- Would the tests catch the defects this change risks introducing, or do
  they mostly exercise what already worked?
- Are fixture and helper changes minimal; shared fixtures updated rather
  than copied? (W: small regular reviews keep test debt visible)

## Maintainability, comments, and churn

- Do comments explain why, not narrate what the code already says? (G:
  comments)
- Is there dead code, commented-out code, or speculative generality that
  this change introduces or fails to remove? (CC)
- Are refactorings kept out of feature changes, or if mixed, explicitly
  justified? Separating them keeps review understandable (G: separate
  refactorings).
- Does the change duplicate logic that already exists elsewhere in the
  codebase? (CC)
- Is the diff free of unrelated churn (reformatting, import reordering) that
  buries the real change? (W: review small amounts regularly)

## User-interface accessibility (WCAG 2.2 AA as GOV.UK applies it)

Applies only when the change touches user-facing interface or generated
documents and pages; skip the section otherwise and record `n/a`. Sources:
UK Government Digital Service's accessibility guidance and the WCAG 2.2 AA
standard, the level public-sector content must meet.

- Does every interactive control work by keyboard alone, with visible focus?
- Is HTML semantic (buttons as `button`, links as `link`), with ARIA only
  where native semantics do not exist?
- Do images carry alt text, and do complex visuals have text equivalents?
- Does meaning ever ride on colour alone (`red means failure`)? (WCAG:
  perceivable)
- Do label/placeholder associations name every input; does text meet 4.5:1
  contrast (3:1 for large text and UI)?
- Do user-facing messages and generated documents read as plain English —
  GOV.UK's rationale is comprehension, not style?
- Are headings hierarchical and unique in generated pages (screen-reader
  navigation)?

## Linting and code-quality signals

Run what is available; record what is not.

- Which linters/formatters/type-checkers ran (ESLint, Ruff, mypy,
  golangci-lint, cargo clippy)? Anything configured yet unavailable is
  recorded as unevaluated, not assumed clean.
- Do machine findings focus the human pass (flagged lines, hot files) rather
  than get re-reported verbatim?
- Were lint suppressions added (`noqa`, `eslint-disable`, `#[allow]`)? Each
  needs a reason in the change; blanket suppressions are a `major`. (G:
  mechanical checks live outside review)
- Did test coverage drop on changed paths, or did coverage tooling stay
  silent? Silent coverage on behavior-changing paths is a `major` to justify.
- Did type discipline loosen (new `any`/`Any` escapes, widened exception
  types, unchecked casts)? `minor` unless it crosses a security or API
  boundary.
- Would the linter catch this class of defect elsewhere — and is that worth
  a tooling ticket rather than line-by-line nitpicks? (W: mechanical checks
  belong in tooling)

## Documentation, communication, and release

- Does the change update relevant documentation, README, and help text in
  the same change? (G: documentation)
- Do user-facing strings, error messages, and logs read well to the person
  who will see them?
- Is the release impact stated: breaking change, migration steps, changelog,
  versioning?
- Do configuration or environment changes document their new keys and
  defaults?
- Does the commit history tell the change's story, or does it hide a
  rewrite inside an unrelated commit message? (W: reviewability supports
  future maintainers)

## When to stop

Exit criteria for the review: every checklist item recorded with evidence,
every `fail` turned into a finding with severity, checks re-run after fixes,
and the author unblocked. A review that ends before the exit criteria are
evaluable is incomplete; say which items are unevaluable and why rather than
approving blind.
