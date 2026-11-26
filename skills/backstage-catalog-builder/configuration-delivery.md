# Deliver a usable catalog configuration

The user should be able to supply a repository/account URL and an app path,
approve scope and ownership decisions once, and receive a working catalog
configuration. Do not make them write YAML, enumerate repositories by hand,
or learn provider configuration just to finish the task.

## 1. Establish the desired result

Use existing context first, from every source confirmed while gathering context:
entity-descriptor paths or repositories the user supplied, the app
configuration, and — when authorized — the running catalog endpoint. Read
supplied descriptor and `catalog.locations` files before proposing anything,
then discover the repository/account type, actual repository list, local app,
release version, catalog rules and plugins. With endpoint access, also
inventory registered locations and ingested identities through the authorized
read API (`GET /locations`, entity queries), and reconcile them with the file
sources: a running catalog reports current ingestion state, while file sources
hold the authoritative descriptors to extend. Statically configured
`catalog.locations` entries can be merged only by editing the app
configuration; the catalog API cannot remove them.
Present one concise proposal, stating which sources it builds on:

- existing entity configuration the request extends: supplied descriptor
  paths/repos and confirmed `catalog.locations`, plus — with endpoint access —
  registered locations and ingested identities to reconcile against source
  evidence;
- repositories and exclusions;
- persistent clone/output location and file or published-URL mode;
- existing ownership to preserve and missing mappings to resolve;
- justified additional entity kinds and plugins;
- permission to modify/restart the app and access external sources.

Obtain approval before broad cloning, private access, membership publication,
configuration changes, credential use, or plugin installation. If required
ownership remains unavailable, report the affected repositories as blocked;
never assign a synthetic team without agreement.

## 2. Model every selected repository

For each repository, inspect existing descriptors, manifests, runtime entry
points, APIs, deployment/IaC definitions, documentation and ownership files.
Read relevant source when those files are insufficient. Inventory all paths
with the stated exclusions, not all file contents indiscriminately.

Create/update all supported Components, APIs, Resources, Systems and Domains
that the evidence justifies. Preserve identities and lifecycle/owner metadata.
Include source links, documentation annotations and dependency relations where
supported. Do not fabricate catalog entities for external packages, content
files, third-party APIs, or nonexistent deployments.

Existing descriptors can still be incomplete, and a simple library may
correctly need just one Component; apply the inspection rules in SKILL.md.

## 3. Assemble persistent outputs

Follow existing layout when possible. A new multi-repository bundle can contain:

```text
<confirmed-output>/
  catalog-info.yaml             # aggregate Location: approved org/repo entries
  org.yaml                      # only approved, evidence-backed organization data
  repos/<repo>/catalog-info.yaml
  app-config.catalog.yaml       # locations, required rules, approved integrations
  catalog-inventory.json        # expected identities and evidence per repository
```

Omit `org.yaml` when there is no approved organizational data. Repository
descriptors can remain in persistent clones rather than be duplicated into the
bundle. Resolve each Location target relative to its actual descriptor file.
Do not emit unused files or placeholder fields.

The inventory should record, for each repository:

- source URL and inspected revision;
- selected/inspected/blocked/excluded status and explanation;
- descriptor paths and expected `(kind, namespace, name)` identities;
- entity/relationship evidence paths;
- CI/actions, organization/teams, documentation/ADRs, APIs and technical-insight
  discovery status, evidence and any resulting configuration;
- unresolved owners, external references, and integrations;
- validation and ingestion status, recorded only after actual checks.

Keep credentials and unrelated personal information out of this inventory.
Write it as part of the requested configuration deliverable, not a generic
planning document. Use it to reconcile actual catalog coverage.

## 4. Configure the confirmed Backstage app

Merge the aggregate file/URL location into the supplied app, preserving all
unrelated locations, integrations, providers, rules and authentication settings.
Permit only additional kinds actually used. A separate config overlay is useful
only when the runner is updated to load it; an unreferenced YAML file is not
integration.

For local file mode:

- All files must exist on the backend's filesystem.
- Inline the exact API schema when `$text`/`$yaml` cannot resolve there, with
  approval; retain source provenance. Test OpenAPI/JSON Schema contents as well
  as the outer entity envelope.
- Prefer one aggregate entry point over independently registering every child.
- Preserve generated runner configuration across normal restarts, including
  repo clones and optional plugin overlays. Verify a second generation/startup
  does not silently drop repositories.

For published-URL mode, ensure the backend can read the actual descriptor
revision. Publishing edits needs separate approval; as SKILL.md states,
discovery providers do not see unpublished files or create missing descriptors.

Configure approved GitHub discovery filters for the user's real scope, not a
hard-coded demonstration organization or one-repository regex. Use the correct
mechanism for a GitHub user account versus an organization.

## 5. Add capabilities only where they help

Inspect installed plugin versions and the frontend/backend systems first.
Do not reinstall plugins already present or assume an npm package alone enables
its routes, entity cards, processors or integrations.

The table below maps common evidence to configuration. It is illustrative, not
exhaustive: for any other capability, or any plugin from the backstage.io
directory, follow the discovery, compatibility-evidence, approval, wiring, and
verification process in [plugin-integration.md](./plugin-integration.md).

| Repository evidence / end-user need | Configuration to consider |
| --- | --- |
| APIs maintained in source | API entities, real schemas, API Docs rendering |
| Developer documentation and MkDocs | TechDocs annotations plus approved builder/storage and source access; generate or update the MkDocs site per [techdocs-mkdocs.md](./techdocs-mkdocs.md) |
| Architecture decisions | ADR plugin and actual ADR directory |
| GitHub pipelines | GitHub Actions plugin, repository annotation and authorized API integration |
| Kubernetes manifests / deployed workloads | Kubernetes plugin, confirmed cluster access and matching workload annotations |
| Runtime service dependencies | Catalog Graph and source-backed relations |
| Owned teams and hierarchy | Organization entities and Org UI; membership only with publication consent |
| Repositories containing published descriptors | Correct SCM catalog discovery provider and approved schedule |
| Source-backed quality/readiness facts and measured checks | Compatible Tech Insights collectors/checks, approved policies and actual execution evidence |

Missing service credentials or cluster configuration is a reported blocker,
not a reason to add guessed values. Provide exact manual steps only for
capabilities the assistant genuinely cannot configure with available tools
and authorization.

## 6. Prove the delivered configuration

1. Parse all changed YAML documents and real API definitions; validate standard
   kinds and required fields with available Backstage tooling.
2. Index identities across the complete bundle; verify aggregate targets and
   source-backed relationships. Separate legitimate external references from
   missing internal owners/entities.
3. Validate the merged app config and module registration. Check that required
   dependencies, frontend extensions and backend modules are actually active.
4. Start/restart only with approval. Wait for asynchronous processing and compare
   expected identities against the running catalog, recording processing errors
   per repository rather than relying on a provider's discovered count.
5. When browser access is available, verify UI rendering for affected entities,
   systems, graphs, API definitions and plugin pages as required by SKILL.md.
   Record UI/network/credential blockers separately.
6. Verify persistence on restart or configuration regeneration. Distinguish a
   successful isolated test from the configuration in the user's running app.

Name every selected repository missing from the running catalog and why (counts
are reported separately per SKILL.md). Never describe a partial demo, plugin
installation, or schema-only pass as the complete outcome.

## 7. Register through the catalog API

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
