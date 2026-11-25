---
name: backstage-catalog-builder
description: Scan GitHub organizations, user accounts, or repositories and create or update evidence-based open-source Backstage catalog entities, catalog-info.yaml descriptors, locations, discovery providers, and app configuration, building on existing entity configuration. Also generates MkDocs TechDocs documentation. Use for Backstage onboarding, software-catalog modeling or ingestion validation, plugin wiring, or documentation generation.
license: Apache-2.0
compatibility: Host assistant with file-read, Git or Bash tools, and network access for GitHub discovery, the Backstage plugin directory, MCP or catalog APIs. Node.js 24+ is required for the bundled structural checkers; a Python mkdocs install or a running Backstage instance is optional for deeper validation.
metadata:
  author: gautampachnanda101
  version: "1.0.1"
---

# Backstage catalog builder

Produce evidence-based Backstage catalog entries for an organization, a GitHub
user account, one repository, or selected paths within a repository. Use the
open-source Backstage catalog model, not a vendor-specific extension. Creating
descriptors does not itself register them with Backstage.

## Choose supporting guides

This file holds the always-applicable rules. Load a supporting guide only when
its workflow applies, and report a conflict instead of guessing if a guide
disagrees with these rules.

Guides are plain files in this skill's directory. Load one by reading the file
relative to this SKILL.md (for example,
`backstage-catalog-builder/configuration-delivery.md`) with the host
assistant's file or resource tools; a link alone is not auto-resolved.

| Workflow | Load |
| --- | --- |
| Assembling the configuration bundle, file/URL location modes, or app-config changes | [configuration-delivery.md](./configuration-delivery.md) |
| Inspecting or registering through a Backstage MCP connection | [mcp-workflow.md](./mcp-workflow.md) |
| Evaluating, installing, or wiring any plugin or capability | [plugin-integration.md](./plugin-integration.md) |
| Organization/account scope, evidence mapping, or discovery providers | [scope-and-modeling.md](./scope-and-modeling.md) |
| Generating or updating MkDocs documentation (TechDocs), including monorepo documentation layouts | [techdocs-mkdocs.md](./techdocs-mkdocs.md) |

## End-user outcome

A request to "build the catalog/config" means producing usable configuration
for the entire approved scope, not only listing repositories, installing a
plugin, or registering descriptors that already exist. Generate missing
descriptors by inspecting source evidence, then assemble their catalog entry
points and the approved Backstage configuration.

- Reuse answers and paths already established in the conversation. Ask one
  focused batch of genuinely missing decisions; do not repeatedly ask users
  to supply information the assistant can discover safely.
- For an account/organization request, propose the full eligible repository
  list. A single demonstration repository is not completion of that scope.
  Continue through every approved repository; report individual blockers.
- "Extensive" means every justified entity, relationship, and integration is
  represented, not that every directory gets an entity or that every plugin
  is enabled. Do not add invented services or sample APIs to inflate coverage.
- Deliver a complete, persistent configuration bundle following
  [configuration-delivery.md](./configuration-delivery.md). With approval,
  wire it into the supplied app so a normal restart loads all selected repos.
  If there is no app, create the bundle in a confirmed output directory and
  provide the exact remaining integration steps.
- Validate modeling, configuration, ingestion, and UI separately. Explicitly
  mark partial results; a provider count or three sample components is not
  evidence of a fully configured account.

## Gather context

1. Ask the user for the repository path if it is not already clear. In the same
   batch, ask what existing Backstage entity configuration they can already
   point the skill at, and accept "none" for any answer. Each answer determines
   what the skill can build on:
   - Entity-configuration paths or repository: local path(s) or repo URL(s)
     that already hold entity descriptors (`catalog-info.yaml`, other entity
     YAML, aggregate `Location` descriptors) and/or the Backstage app's
     configuration file containing `catalog.locations`. These are the
     authoritative source to extend and merge into; they reveal existing
     identities, owners, and conventions, and show whether entries are
     statically configured or API-registered.
   - A running Backstage instance: the backend base URL (the catalog API
     conventionally sits at `<backend.baseUrl>/api/catalog`) plus a Backstage
     token supplied securely — an environment-variable name, a local
     credential-file path, or the host's secret mechanism — **never the token
     value** in chat, files, logs, or command arguments. Endpoint access also
     enables read-only inventory of registered locations and ingested entities,
     validation and dry-run registration, and post-ingestion verification.
     Note that an installation configured with `catalog.readonly: true`
     rejects location registration entirely.
   A token is only needed if the chosen operation requires one; do not read it
   merely because it was offered.
2. Ask whether to create/update descriptors only, also update a supplied
   Backstage app configuration, or register a location through a Backstage
   catalog API. For API registration, obtain a reachable source-control URL
   for the descriptor and permission to send the request; the base URL is only
   asked for if endpoint access was not already confirmed in the previous step.
   For app configuration, confirm the file to modify and the location target
   and type. Do not assume the Backstage app is in the scanned repository.
3. Ask for the owning Backstage entity and lifecycle if they cannot be established
   from existing descriptors or other reliable project evidence. Confirm other
   ambiguous component boundaries, names, namespaces, or relationships before
   writing them. Batch questions when practical; if the user cannot provide a
   required value, report the blocker instead of inventing one.
4. For organization/account scope, confirm the host and owner, selected
   repositories, inclusion of forks, archived/private repositories, default
   branch or pinned revisions, and clone/output directory. Default the proposal
   to public, non-archived, non-fork repositories; obtain approval before cloning
   a large collection, accessing private repositories, or publishing changes.
   Organization membership is not proof of service ownership.
5. For a complete configuration request, confirm the persistent output directory
   and whether the app may be modified/restarted. Discover current app version,
   configuration, installed plugins and catalog entries before proposing changes.
   Ask only for unavailable ownership mappings, secrets references, and material
   policy choices. Once approved, carry out the work rather than returning a
   generic example or making the user manually configure each repository.

The Backstage token is distinct from a Git provider token. Never print, quote,
commit, or place tokens in generated files, command arguments, or logs. Use a
secret-aware mechanism supported by the host environment for any authorized
request; if none is available, explain the limitation and leave registration
for the user. Never send credentials to an unconfirmed endpoint. Supplied file
paths and a supplied endpoint describe different things: descriptor files state
the intended configuration, while the endpoint reports only what the running
catalog has currently ingested; reconcile them rather than treating either as
the complete truth.

## Discover tools and repositories

- Prefer an available Backstage MCP connection for catalog inspection and
  verification. Discover the server and list its actual tools through the host
  assistant, then inspect their input schemas. Do not assume tool names or that
  every catalog REST operation is exposed. Backstage's MCP Actions Backend uses
  `/api/mcp-actions/v1` under the confirmed backend URL; configure authentication
  through the host's secret input or an approved environment reference.
- Use discovered read tools to inspect existing entities, supported capabilities
  and catalog state. Mutating tools require the same approval as REST
  registration or configuration changes. If MCP lacks a required operation,
  use approved local-file/REST tooling and report the gap. An MCP connection
  does not replace source inspection or missing-descriptor generation.
- Confirm MCP initialization and tool listing before claiming connectivity.
  Distinguish connection configuration, connected server, successful tool call,
  and verified ingestion. Never bypass network policy to reach the endpoint.
   Follow [mcp-workflow.md](./mcp-workflow.md) for capability mapping, per-document
   validation, safe registration, pagination and expected-entity reconciliation.
- When no MCP connection exists but a confirmed endpoint and securely held
  token are available, use the catalog REST API directly for the same
  read-first purpose: inventory registered locations with `GET /locations`,
  query ingested identities with `GET /entities/by-query` (or
  `POST /entities/by-query` when filters exceed URL length), validate a draft
  entity with `POST /validate-entity`, and analyze a proposed location with
  `POST /analyze-location`. Send requests only to the confirmed backend URL and
  authenticate with the approved secret mechanism only if the installation
  requires it. Statically configured `catalog.locations` entries never appear
  in this API's deletable locations; they change only through app
  configuration.
- Discover the host assistant's available Git/source-control, repository search,
  file/tree reading, YAML validation, shell, and browser tools before using them.
  Follow the host's tool discovery mechanism; do not assume MCP server names or
  assistant-specific APIs exist. Check authentication and permissions without
  exposing tokens. Prefer local files for local scope, then authenticated
  source-control tools. `gh`, Git, or an approved HTTP client are fallbacks when
  available. Report network-policy blocks rather than bypassing them.
- Identify the source-control host first and treat repository enumeration as
  host-specific adapter work: GitHub, GitLab, Bitbucket, Azure DevOps, and
  plain local checkouts each have their own enumeration APIs and catalog
  discovery providers. On GitHub, resolve owner type using `/users/{owner}`;
  for organizations enumerate `/orgs/{org}/repos`, for user accounts enumerate
  `/users/{user}/repos`, not the organization endpoint. On any host, follow
   pagination to completion. Search results may be capped or omit unindexed
   files; they are not a complete inventory. The detailed guidance in this
   skill covers GitHub and its discovery provider in depth; for other hosts,
   apply the same sequence with that host's APIs and report the reduced
   confidence rather than inventing host-specific behavior.
- Record repository name, URL, default branch, visibility, archived/fork status,
  and inspected commit. Apply the approved filters and show selected/skipped
  counts before generating catalog files. Never interpret API failure, missing
  permissions, rate limits, or a truncated tree as an empty organization.
- For approved organization modeling, inspect teams and parent-team relationships
  with authorized access. Generate Group/User entities only from confirmed data
  and with consent to publish membership. Otherwise leave ownership unresolved
  or use an explicitly approved synthetic test owner. Do not infer personal
  data or assign all services to the account owner automatically.
- Read [scope-and-modeling.md](./scope-and-modeling.md) for full-scope evidence
  mapping, cross-repository relationships, and discovery-plugin configuration.
- Explicitly discover CI/actions, organization metadata and teams, documentation,
  API contracts, and technical-insight evidence using the checklist in that
  guide. Repository enumeration alone is not sufficient inspection. Track each
  area as found, absent, blocked, or not applicable, with evidence.

## Inspect and model the repository

1. Inventory files recursively, including hidden files and existing catalog
   descriptors, to understand repository structure. Avoid following symlinks
   outside the repository. Do not inspect Git internals, dependency/vendor
   directories, generated build outputs, or secret file contents; note these
   exclusions. Do not read unrelated files just because they are present.
2. When scope is limited to selected paths within the repository, confirm the
   path list, verify each path exists in the tree at the inspected revision
   (report missing ones), and apply the same evidence rules inside that
   boundary. A selected path may contain one entity, several, or none. When
   completing a model needs something outside the confirmed paths (a shared
   owner, deployment config, or API contract), propose expanding scope rather
   than silently reaching beyond it.
3. Inspect relevant manifests, documentation, ownership information, API
   specifications, deployment configuration, and existing `catalog-info.yaml`
   or other Backstage entity files. Identify actual deployable services,
   websites, libraries, APIs, and other supported entities from evidence, not
   from every file. Distinguish source evidence from assumptions. When a missing
   OpenAPI contract can be derived from framework annotations in source, propose
   that generation as an option instead of leaving the gap unmentioned; see the
   contract rules in [scope-and-modeling.md](./scope-and-modeling.md).
4. Reuse existing entity identities and descriptor locations. In a monorepo,
   model independently owned or deployed units separately when supported by
   evidence; do not create an entity per directory or file. Create API,
   System, Resource, or relationship entries only where evidence supports them.
   Do not invent infrastructure, API definitions, owners, or dependencies.
   Check for duplicate `(kind, namespace, name)` identities and name collisions.
5. Present a concise proposed entity list with evidence and unresolved choices.
   Resolve material ambiguities before changing files. Preserve unrelated
   existing entities, fields, comments, custom extensions, and registration
   settings. Report empty or malformed existing descriptors and ask before
   replacing or repairing them. If a safe merge is not possible, ask rather
   than overwrite.
6. Inventory every in-scope path, including hidden files, with exclusions and
   unreadable/truncated paths reported. Read only relevant evidence. File
   coverage is not an entity-per-file requirement: content packs, modules,
   tests, scripts, and deployment manifests may belong to one deployable unit.
   Record file-backed evidence for each proposed entity and relationship.
7. For each approved repository, handle missing, partial, and already-complete
   descriptors explicitly. Missing descriptors require source modeling, not
   skipping the repository. Existing descriptors require coverage inspection,
   not blind registration. Reconcile documentation, APIs, infrastructure and
   independently deployed modules before considering its configuration complete.

## Create or update descriptors

- Default to `catalog-info.yaml` at the repository root for a single component;
  for multiple components, prefer descriptors near their source and follow
  existing repository conventions. YAML files may contain multiple documents
  separated by `---`.
- Use `apiVersion: backstage.io/v1alpha1` and the appropriate standard `kind`.
  A Component needs `metadata.name` and `spec.type`, `spec.lifecycle`, and
  `spec.owner`. An API also needs `spec.type`, `spec.lifecycle`, `spec.owner`,
  and `spec.definition`. Choose values supported by the evidence and the
  user's Backstage conventions; do not add placeholders as if they were facts.
  A minimal, well-formed Component descriptor:

  ```yaml
  apiVersion: backstage.io/v1alpha1
  kind: Component
  metadata:
    name: order-service
    annotations:
      github.com/project-slug: acme/order-service
  spec:
    type: service
    lifecycle: production
    owner: group:payments-team
  ```
- Use valid Backstage names and entity references, including namespaces when
  needed. Add `providesApis`, `dependsOn`, `system`, annotations, and links only
  when supported by evidence and applicable to the entity. Preserve explicitly
  maintained metadata.
- Derive `metadata.name` from manifests rather than copying them. The default
  Backstage ruleset accepts names of at most 63 characters: sequences of
  alphanumerics separated by single `-`, `_`, or `.` characters, with no
  leading or trailing separator — so `@org/Billing-Service.v2` becomes
  `org-billing-service-v2`; keep the original spelling as `metadata.title`.
  Uppercase letters are valid (`CircleciBuildsDumpV2_avro_gcs`); names are
  unique per kind and namespace case-insensitively, an installation may
  configure its own ruleset, and namespaces accept only alphanumerics
  separated by `-`.
- For an API definition, use a real definition or a valid Backstage placeholder
  referencing one; verify that the chosen location type and integrations support
  the reference. Do not fabricate an API definition.
- When a single entry point is useful for multiple descriptor files, consider a
  `Location` entity with relative `spec.targets` pointing to those files.
  Preserve any existing location hierarchy and ensure targets resolve relative
  to the Location descriptor. Avoid registering both the aggregate and its
  children independently without a reason.

## Optional configuration and registration

- Only modify the confirmed Backstage app configuration when requested. Merge
  into the existing `catalog.locations` list without duplicates, preserving
  unrelated configuration. A `url` target must be accessible to the Backstage
  backend through its configured integrations; a `file` target is resolved in
  the Backstage deployment's filesystem, not necessarily this repository.
  Account for the config file location and deployment environment; never assume
  a local workspace path exists on the server.
- Check the installation's catalog rules for the kinds being added. Backstage
  defaults to allowing Component, API, and Location; other kinds may need
  explicit rules. Do not broaden rules or alter integrations without explaining
  the impact and obtaining approval.
- Only perform API registration with explicit approval. The open-source catalog
  API uses `POST /locations` under the supplied catalog API base URL, with JSON
  fields `type` and `target`; `?dryRun=true` validates without registering.
  Authenticate with a Backstage bearer token if the installation requires it.
  Run the dry run first, inspect errors, and register only after it succeeds.
  By default the API accepts only `url` locations; a `file` target is rejected
  with a 400 unless the backend allows it in code. For local files, use a
  `type: file` entry in `catalog.locations` instead.
  Treat a conflict as success only after verifying that the existing location
  matches the intended target and type. Never delete or replace registrations
  automatically.
- A remote URL must point to a published descriptor revision that Backstage can
  read. Local edits are not visible at that URL until published. If publication,
  permissions, authentication, or backend access are unavailable, leave the
  local changes ready and report the remaining steps; do not claim registration.
- For an organization-wide automatic refresh, verify the installed version and
  configuration schema of an open-source discovery provider before proposing
  it. Obtain approval to install/register plugins, add GitHub integrations,
  schedules, filters, and credentials. Discovery ingests existing published
  descriptors; it does not analyze every source file or create missing ones.
  Do not configure an organization-only provider for a user account.
- Integrate requested or evidence-justified plugins through the repeatable
  process in [plugin-integration.md](./plugin-integration.md): verified
  compatibility evidence, explicit approval, complete wiring, and capability
  verification. The backstage.io plugin directory is a discovery index, not
  proof of compatibility; track each candidate's lifecycle state and report
  blocked plugins with their blocking evidence.
- For app-configuration assembly and local file mode, including Location
  hierarchy validation, API-definition inlining, persistence across restarts,
  and bundle layout, follow [configuration-delivery.md](./configuration-delivery.md).
- When the request includes generating or updating documentation, follow
  [techdocs-mkdocs.md](./techdocs-mkdocs.md) to build evidence-based MkDocs
  sites, wire TechDocs annotations, and choose a layout for monorepos.

## Verify and report

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

## References

- [Entity descriptor format](https://backstage.io/docs/features/software-catalog/descriptor-format/)
- [Entity references](https://backstage.io/docs/features/software-catalog/references/)
- [Catalog configuration](https://backstage.io/docs/features/software-catalog/configuration/)
- [Catalog API](https://backstage.io/docs/features/software-catalog/software-catalog-api/)
