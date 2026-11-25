# Documentation authoring checklist

Use as the self-validator described in [SKILL.md](./SKILL.md): check each
item before delivery and record anything unevaluated. Sources: Diátaxis (D),
GOV.UK content design and accessibility (GV), Google Developers Style Guide
(G), Microsoft Writing Style Guide (M), Wiegers docs-as-code practice (W).

## Need and form

- The page states one user need; every paragraph serves it. (GV)
- One Diátaxis form chosen and held to the end — no genre mixing. (D)
- The draft names its audience, and entry point (which page links here).
- New content is not duplicating an existing page; links replace repeats. (W)

## Structure

- One `H1`, no skipped heading levels, headings that describe content.
- Headings are unique page-wide so anchors deep-link unambiguously.
- Long pages open with a contents list; sections order follows the reader's
  work.
- The first two sentences state the outcome or purpose — no preamble.
  (inverted pyramid; Nielsen: 79% of users scan)
- Page order: summary, then steps/specifications adjacent to it; deep
  context, trade-offs, and edge cases last.
- Guide headings use verb phrases with the outcome; reference headings name
  the facts; troubleshooting/reference sections may headline the errors
  users search.
- Ordered lists carry strict sequences only; bullets for unordered sets; key
  UI labels, commands, and terms are bolded where the eye should land.
- Each procedural step ends with its expected outcome or a verification
  command.
- Minimal working examples sit directly beside the definitions or parameters
  they illustrate.
- Every internal link and image resolves from the file's own location.
- Synonyms and error strings the audience searches appear in visible prose,
  or in a terminal `<!-- search aliases: ... -->` block for repo grep.
- Related pages link back; no orphan pages. (D)

## Voice and wording

- Second person, active voice, present tense; imperative steps. (G, M)
- Sentences 25 words or fewer; paragraphs at most 5 sentences. (GV)
- One term per concept; acronyms expanded at first use. (GV)
- `must`/`need`/`can` word requirement strength deliberately; negative
  contractions avoided where misreadable. (GV)
- No `simply`, `just`, `obviously`, `easy`. (M)

## Code, commands, and accuracy

- Every code block fenced with a language tag; shell blocks run as pasted
  from a clean checkout.
- New commands and samples executed with output recorded — or marked
  unevaluated with the reason. (W)
- Version, port, and prerequisite claims match the actual environment.
- Warnings precede the risky step.

## Links and accessibility-aware writing

- Link text describes the destination; none is `click here`, `here`, `more`,
  or a bare URL; one phrase maps to one destination. (GV)
- Documents state format and size; walled content flagged. (GV)
- Meaning never rides on colour or sensory wording; plain English doubles as
  cognitive accessibility. (GV)

## Delivery

- Mechanical pass run and findings fixed or reported: Markdown linter,
  link checker, or the repository's TechDocs checker for MkDocs sites.
- Report lists changed files, evidence for runnable claims, unevaluated
  items, and preserved metadata (owners, versions, annotations).
