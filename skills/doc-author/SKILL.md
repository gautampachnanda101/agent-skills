---
name: doc-author
description: Author new documentation or rewrite existing pages following the practices of leading documentation engineers — identify the user need first, choose the Diátaxis page type, then apply GOV.UK content design (plain English, deliberate requirement wording, accessible link text) and the Google Developers and Microsoft Writing style guides. Structures pages with one canonical home per topic, contents lists on long pages, and fenced, tested code samples; verifies commands, links, and lint checks before finishing. Use when asked to write, create, draft, expand, restructure, or rewrite documentation such as README files, tutorials, how-to guides, reference pages, or explanations.
license: Apache-2.0
compatibility: Host assistant with file-read and file-write tools; Bash or Node are optional for running commands, link checks, and Markdown linters. Network access requires permission.
metadata:
  author: gautampachnanda101
  version: "1.1.1"
---

# Documentation author

Write and rewrite documentation with the same discipline a reviewer will
later demand: one reader need per page, the right Diátaxis form, plain
English, and commands that actually run. Grounded in Daniele Procida's
[Diátaxis framework](https://diataxis.fr/), the UK Government Digital
Service's [GOV.UK content design guidance](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/),
the [Google Developers Style Guide](https://developers.google.com/style) and
the [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/),
docs-as-code practice from Anne Gentle and Karl Wiegers, and the
information-foraging research of Pirolli & Card as applied to technical
documentation by Tom Johnson — readers follow "information scent" toward
their goal, so structure and terminology must make the scent strong.

## Start from the user need

GOV.UK's rule comes first: identify the user need in one sentence — `As a
<reader>, I need <information or action> so that <outcome>` — and publish
only what meets it. If a page cannot state its need, the writing task is
scoping, not drafting; ask one batched question set for the missing need,
audience, and placement before writing.

## Choose the form before the words

Diátaxis sorts every page into one of four jobs, and each has its own
rules:

| Form | Serves | Writing rule |
| --- | --- | --- |
| Tutorial | A first success while learning | One repeatable path, no alternatives, every step verifiable |
| How-to guide | A task in progress | Goal in the title, steps only, no theory |
| Reference | Correct, complete lookup | Facts, no narrative, consistent terms |
| Explanation | Understanding | Concept, context, and why — not steps |

State the chosen form in the first draft message and keep the page inside
it. Mixing forms is the defect the [documentation-review](../documentation-review/SKILL.md)
skill flags first.

## Structure and placement decide readability

- One canonical home per topic: a landing page links outward, a long page
  opens with a contents list, and neighboring pages link back.
- Duplicate nothing: place each fact once and link to it — duplicated
  guidance drifts apart.
- One `H1` that names the content; heading levels step down without skips;
  headings are unique so every anchor deep-links unambiguously.
- Navigation and cross-links must resolve; relative targets are checked
  against the filesystem before delivery.

## Front-load the outcome, then follow the scent

Readers of task-oriented docs mostly scan (Nielsen's classic finding: 79%
of test users scan rather than read), and information-foraging research
says they follow the strongest scent toward their goal — so the first two
sentences must state the immediate outcome or purpose. No history, no
preamble: what this is for, then the path. Depth, trade-offs, and edge
cases come last.

- Guide headings carry a verb phrase with the outcome (`Configure OAuth 2.0
  Provider`, not `OAuth Settings`); reference headings name the facts.
  On troubleshooting and reference pages, the errors and synonyms users
  search may headline their own sections.
- Keep the page in that order: summary, then the steps, specifications, or
  parameters adjacent to the summary — deep context, trade-offs, and edge
  cases close the page. An edge case placed before the quick start is a
  deferral of the reader's goal.
- Use ordered lists only for strict sequences; bullets for unordered sets;
  bold UI labels, commands, and key terms where the eye should land.
- Each procedural step ends with its expected outcome or verification
  command, so the reader confirms progress instead of hoping.
- Put minimal working examples directly beside the parameter or
  configuration they illustrate, especially on reference pages — a reader
  scanning a definition should never hunt for its sample.
- Findability is a writing problem: use the words and error strings the
  audience actually searches (GOV.UK calls this using users' own
  vocabulary — say `permission denied` as well as the code `403`). When a
  page needs synonyms the prose cannot carry, close it with a
  grep-able alias block:

  ```markdown
  <!-- search aliases: token expired, IAM role binding, auth failure -->
  ```

  Honest framing: this is visible to repository search and most in-site
  search, and invisible to external engines — search-critical terms belong
  in visible prose wherever possible.

## Write to the style rules that reviewers enforce

- Second person, active voice, present tense; steps in imperative mood.
- Plain English: prefer the short word (`buy` over `purchase`, `help` over
  `assist`), split sentences over 25 words, keep paragraphs to five
  sentences. Explain specialist terms at first use.
- Requirement wording is deliberate: `must` for requirements the reader
  cannot skip with safety, `need` for process requirements, `can` for
  optional. Avoid `simply`, `just`, `obviously`, and `easy`.
- Link text is descriptive and one phrase leads to one destination — no
  `click here`, no bare URLs, and documents state format and size.
- See [style-rules.md](./style-rules.md) for the full authoring checklist.

## Code and commands are evidence, not decoration

- Fence every code block with its language; make shell blocks
  copy-pasteable; keep one command per line and show where it runs.
- Run new commands and samples before publishing when authorized; record
  the output you based claims on. Untested copy-paste paths are the most
  expensive defect a draft can contain.
- Prompts for secrets never carry a token value; reference environment
  variables or secret mechanisms by name.

## Validate before you finish

1. Run the mechanical pass: any available Markdown linter (`markdownlint`,
   `vale`), link checker, or the repository's bundled site checker (for
   MkDocs/TechDocs sites, the zero-dependency
   `check-techdocs.mjs`) — fix findings before human review.
2. Self-check against [style-rules.md](./style-rules.md) as the validator:
   type fit, structure, voice, accuracy, links, accessibility.
3. Report what changed, the evidence for every runnable claim, and anything
   left unevaluated — never silently assumed.

## Boundaries

- Write only where the user asked: no repo-wide rewrites without a request,
  and no content invented beyond the need agreed at the start.
- Preserve explicitly maintained metadata (owners, annotations, versions);
  surface rather than remove content you could not verify.
- Do not paste secrets or token values into examples.
