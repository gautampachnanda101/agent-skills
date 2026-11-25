# Generate and update MkDocs documentation

This guide covers generating or updating MkDocs sites (`mkdocs.yml` plus
Markdown sources) for modeled entities and wiring them as Backstage TechDocs,
including monorepos that contain several independently owned packages. Load it
only for documentation-generation requests; descriptor-only work follows
SKILL.md and this guide never replaces the evidence and approval rules there.

## 1. Establish the desired result

Determine before writing files:

- Which entities the documentation describes and where their descriptors live.
- Whether the request is generate-new, update-existing, or both.
- The documentation convention the repository already uses (root `docs/`
  directory, per-package sites, a dedicated documentation repository) and
  follow it rather than introducing a second convention.
- Whether TechDocs should also be wired into the modeled descriptors and, when
  explicitly requested, the running app. Builder and publisher settings are
  app-side changes that follow the approval rules in
  [plugin-integration.md](./plugin-integration.md).

Ask one focused batch for genuine gaps and reuse answers already established
in the conversation. Never fabricate features, endpoints, version numbers,
screenshots, or usage that the inspected repository does not support.

## 2. Inspect existing documentation first

Before choosing a layout or writing any page, inventory the documentation the
repository and each selected path already contain, with file-backed evidence:

- Search the tree at the inspected revision for `mkdocs.yml`/`mkdocs.yaml` at
  the root and inside every package directory; MkDocs configuration may also
  carry a nondefault `docs_dir` in any location. Find the installed generator
  set through `requirements.txt`, `pyproject.toml`, or their equivalents.
- Map every discovered site to its owning entity and descriptor. In a
  monorepo, several packages may each have their own site while a root site
  already aggregates them; record exactly which site exists where and who
  builds it (including CI workflows or scripts that run `mkdocs build`).
- Detect other documentation sources and generators — Sphinx `conf.py`,
  Docusaurus `docusaurus.config.js`, VitePress, plain README trees, ADR
  directories, diagrams, and linked external handbooks — as evidence for
  content and coverage, not as MkDocs sites.
- Capture each existing site's conventions before proposing changes:
  `site_name`, `site_description`, `nav` structure, theme, plugins, custom
  `docs_dir`, and the page inventory with its topics and ownership.

Apply the inspection result per discovered site:

- An existing MkDocs site owned by the target entity must be extended, not
  duplicated. Never create a second, parallel `mkdocs.yml` beside it; changes
  follow Section 5.
- A site whose ownership conflicts with the requested entities is a decision
  to resolve with the user before moving or re-parenting anything.
- Existing pages, README trees, ADRs, and other generated documentation are
  the primary evidence for new content (Section 4): reuse and link to them
  rather than rewriting them. Migrating from another generator to MkDocs is a
  separate, approved decision and is never done silently.
- No documentation at all still requires the inspection report; generation
  then follows the Section 3 layout choice with minimal, evidence-derived
  pages.

## 3. Choose the site layout

### Single-repository or path-limited scope

Place `mkdocs.yml` at the root of the documented unit with its sources in a
`docs/` directory beside it, and point the descriptor annotation at the
directory that contains `mkdocs.yml`:

```yaml
annotations:
  backstage.io/techdocs-ref: dir:./
```

The `dir:` value is resolved relative to the entity's descriptor file, not the
repository root, so a descriptor in a subdirectory must reference its docs
from there.

### Monorepo layout A: per-package sites (default)

Give each independently documented package its own `mkdocs.yml` and `docs/`
directory next to its descriptor, with `backstage.io/techdocs-ref: dir:./`
in that package's descriptor. Every entity then builds and publishes its own
TechDocs independently, and one package's failures do not block the others.
Prefer this layout for catalog modeling because it matches the entity
boundaries modeled in SKILL.md.

### Monorepo layout B: one aggregated site

Use only when the user wants a single unified handbook for the repository. A
root `mkdocs.yml` can aggregate package sites with the
`mkdocs-monorepo-plugin` (maintained in the Backstage repository):

```yaml
plugins:
  - techdocs-core
  - monorepo
nav:
  - Home: index.md
  - Package A: !include packages/a/mkdocs.yml
  - Package B: !include packages/b/mkdocs.yml
```

The plugin is an additional dependency that must be accepted for the build
environment before use. Each included `mkdocs.yml` keeps its own `nav` and
`docs_dir` relative to its own file. The annotation pointing at the root site
belongs to one hosting entity (typically the repository-level Component),
whose `site_name` must match that entity's name; package entities do not get
independent TechDocs from this layout.

Compare the layouts with the user against the evidence. MkDocs natively
supports a single `docs_dir`; do not invent a multi-directory configuration
without a plugin or an approved equivalent.

## 4. Generate a new site

Produce a minimal, valid TechDocs configuration:

```yaml
site_name: <entity metadata.name>
site_description: <entity description, when present>
repo_url: <source repository URL>
plugins:
  - techdocs-core
nav:
  - Home: index.md
  # entries derived from generated pages only
```

- Keep `site_name` equal to the entity's `metadata.name`; TechDocs associates
  the rendered site with the entity on this identity, and a mismatch breaks
  rendering.
- Include an `index.md` home page. Derive every page's content from real
  evidence: README/documentation text, manifests, source code, API contracts,
  and deployment files already inspected for modeling. When the repository has
  no useful content for a topic, omit that topic instead of inventing it.
- Keep pages concise, factual, and specific to the inspected revision. Label
  anything derived by inference (for example, a suggested local development
  command read from a Makefile) so users can verify it.
- Every `nav` entry and link must resolve to an existing page; do not emit
  entries for pages that were not written.

## 5. Update an existing site

- Start from the inventory gathered in Section 2 and parse the existing
  `mkdocs.yml` before editing. Preserve unrelated settings,
  theme configuration, custom plugins, extras, macros, and comments; merge
  rather than overwrite.
- Extend the `nav` and page set for the requested change; do not delete or
  rename existing pages that the repository maintains, and do not rewrite
  hand-written content. Reconcile a divergent `nav` with the user rather than
  silently pruning it.
- If `site_name` differs from the entity's `metadata.name`, report the
  mismatch and agree on the resolution; renaming a live documentation site is
  a visible change, not a silent fix.
- When the descriptor lacks a TechDocs annotation while an `mkdocs.yml`
  exists, propose the correct `dir:` reference according to the layout rules
  above and update descriptors with the same preservation rules as SKILL.md.

## 6. Validate and report

- Parse every changed YAML file with an available YAML parser and, when Node.js
  is available, run the bundled structural checker from SKILL.md over the
  changed descriptors:
  `node scripts/check-descriptors.mjs <files>`, then the TechDocs checker:
  `node scripts/check-techdocs.mjs <descriptors-with-techdocs-annotations...>`
  (`--json` for machine-readable report output; `--strict` to treat site-name
  mismatches as findings). It validates
  `dir:` targets against real files, the `techdocs-core` plugin, and every nav
  page and `!include`, including monorepo package sites.
- Verify each `nav` entry, cross-page link, and image path resolves inside the
  referenced site; verify `site_name` equals the entity name and that each
  `dir:` value resolves relative to its descriptor.
- Build when tooling is available: `mkdocs build --strict` with
  `mkdocs` and `mkdocs-techdocs-core` installed, or
  `npx @backstage/techdocs-cli generate` where Node.js tooling exists. Treat
  strict-build warnings as findings, not noise. Do not install Python or npm
  dependencies without permission; report the missing builder as a blocker
  and note that presence of `mkdocs.yml` is not proof of a working build,
  consistent with [scope-and-modeling.md](./scope-and-modeling.md).
- Do not publish to an external storage backend (for example GCS or S3) or
  register a builder/publisher configuration without explicit approval.
- Summarize, per entity: generated/updated files, the page inventory and its
  evidence sources, validation and build results, the annotation changes,
  the local preview command (`mkdocs serve` in the site directory), and any
  blocked or skipped topics with reasons. Distinguish local-only changes from
  anything rendered through a running Backstage instance.
