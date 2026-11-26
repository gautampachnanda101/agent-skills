# Verify and report

Read this guide before validating descriptors or reporting results. It
expands the *Verify and report* step of [SKILL.md](./SKILL.md).

Run the passes in order and resolve failures in one pass before starting the
next: (1) YAML syntax parsing, (2) the structural checker scripts, (3)
Backstage backend validation (`validate-entity` or a location dry run) where an
authorized endpoint exists, and (4) reporting. A blocking finding invalidates
the passes that would follow it.

- Parse every changed YAML document using an available YAML parser. Check
  required fields, unique entity identities, referenced local files, and
  evidence for relationships. When Node.js is available, run the bundled
  zero-dependency checker as an additional pass:
  `node scripts/check-descriptors.mjs <changed-descriptor-files...>`
  (`--json` for machine-readable report output).
  It reports structural findings (missing required fields, duplicate
  identities or top-level keys, invalid names, missing Location targets,
  and missing `$text`/`$yaml` API placeholders). It is not a full YAML or
  schema validator, so keep using the app's parser, `validate-entity`, or
  dry-run validation where available. Do not install dependencies without
  permission.
- For entities carrying TechDocs documentation, run the bundled TechDocs
  checker as an additional pass when available:
  `node scripts/check-techdocs.mjs <descriptors-with-techdocs-annotations...>`.
  It structurally validates `backstage.io/techdocs-ref: dir:` targets,
  `site_name` matching the owning entity, the `techdocs-core` plugin, and
  nav/`!include` resolution, including monorepo package sites. `url:` values
  are recorded but not resolved; site-name mismatches are warnings unless
  `--strict` is passed.
- If an accessible Backstage instance and approved credentials are available,
  use the location dry run to validate the published descriptor. After actual
  registration, check the response and, where possible, query the catalog for
  the intended entities and processing errors. Ingestion is asynchronous: a
  successful registration alone does not prove that entities were ingested.
- Summarize changed files, entities, evidence, exclusions, validation results,
  registration status, and unresolved questions or manual steps. Explicitly
  distinguish local-only changes, registered locations, and verified ingestion.
- For multi-repository scope, report selected, inspected, changed, skipped,
  blocked, and ingested counts separately. Check identity uniqueness across the
  entire catalog, not just within each file. Report unresolved ownership and
  external relations rather than silently replacing them.
- Reconcile the expected inventory with the running catalog: every selected
  repository must be represented by its justified entity references or have an
  explicit blocker/exclusion. Compare identities, not just total counts.
  Separate repositories from Component/API/System/Resource/Group counts and
  exclude synthetic fixtures from real-repository coverage.
- When browser tools can access the instance, verify catalog listing, entity
  details, owner/system links, dependency graph, and actual API rendering for
  affected entities. Check processing errors and captured console failures.
  If UI access is blocked, do not claim UI success from HTTP status or schema
  validation alone. Separate provider discovery success from source modeling.
