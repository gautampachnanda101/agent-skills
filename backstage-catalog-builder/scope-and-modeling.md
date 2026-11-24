# Organization, repository, and file scope

## Required discovery checklist

Inspect every applicable area below for each approved repository. Combine local
file inspection with authorized provider metadata when available. Record found,
absent, blocked or not-applicable status; do not equate lack of API permission
with absence.

### Organization and teams

- Resolve organization versus user-account type; fetch approved organization
  display name, description, URL and public repository metadata.
- Discover teams, parent teams and repository/team access through authorized
  APIs. Repository admin/write permissions indicate access, not necessarily
  service ownership.
- Inspect CODEOWNERS at supported repository locations, existing catalog owners
  and organization conventions. Map these to confirmed Backstage Group/User
  identities, preserving namespaces and existing references.
- Model approved organization/team hierarchy centrally. Membership and user
  profiles require publication consent; never expose private membership,
  invitations, email addresses or administrative security settings by default.
- For a user account, do not invent an organization or teams. Use existing
  ownership or obtain an explicit mapping/test owner.

### Actions, CI and releases

- Inspect all `.github/workflows/*.yml` and `*.yaml`, reusable workflows, trigger
  filters, job/build/test/deploy steps, artifact publishing and release targets.
  Use other CI configuration when present; GitHub Actions is not assumed.
- With authorized API access, discover actual workflow identifiers and execution
  status for the inspected revision. Distinguish a workflow definition from a
  passing run, deployment, or published release.
- Produce supported repository/plugin annotations and links to actual workflows,
  build evidence and releases. Install and wire the matching CI plugin only
  when approved and compatible; do not manufacture custom annotations.
- Never read action secrets, print secret references as values, execute workflows,
  or trigger deployment while cataloging.

### Documentation and ADRs

- Discover README/documentation trees, MkDocs/Docusaurus/Sphinx or other doc
  configuration, ADR directories, diagrams and documented external sources.
- Determine which component owns each documentation site and whether TechDocs
  supports its build configuration. Presence of Markdown is not proof that a
  TechDocs build works.
- Configure source/TechDocs/ADR references supported by installed plugins.
  Confirm builder prerequisites, storage and source resolution; check actual
  rendering when authorized. Report unavailable builders instead of claiming
  published docs.

### APIs and contracts

- Find OpenAPI/Swagger, AsyncAPI, GraphQL schemas, protobufs, JSON Schemas and
  maintained interface docs. Inspect runtime routes, clients and event bindings
  to identify provided/consumed APIs and coverage gaps.
- Preserve and validate exact maintained contracts, including local references
  and resolver compatibility. Associate contracts with their actual component
  and system; add source-backed providesApis/consumesApis relations.
- Routes without a maintained contract are an explicit gap. Generate a contract
  only when schemas, methods, parameters and responses can be established from
  source and the user approves; label unverified behavior. Never fill missing
  API definitions with fictitious endpoints or an upstream API subset.

### Technical insights

- Gather revision-specific facts: language/build manifests, test commands,
  workflow definitions and observed runs, coverage reports, lint configuration,
  documentation/ADR presence, ownership completeness, API-contract presence and
  existing quality/security report artifacts.
- Keep facts separate from assessments: tests existing does not mean tests pass,
  a security workflow does not mean no vulnerabilities, and a coverage file's
  presence is not a coverage percentage. Record provenance and unavailable data.
- Inspect any installed Tech Insights plugin, fact retrievers, fact schemas,
  checks, schedules and entity filters. Propose compatible fact collection and
  check configuration based on measured facts and approved policies.
- Do not invent thresholds, fact IDs, scorecard schemas or collector endpoints.
  Resolve required policy choices with the user. Plugin APIs differ by version;
  verify their actual configuration before wiring frontend/backend modules.
- When no compatible plugin is present, offer installation with its prerequisites
  and permission, and retain a source-backed insights inventory regardless.
  Do not report that checks ran until collection and check execution are observed.

## Evidence mapping

Inventory each selected repository at a known revision. Reuse existing
descriptors before proposing changes; compare project documentation against
runtime/build evidence when they disagree.

| Evidence | Candidate modeling |
| --- | --- |
| Deployable binary, server, frontend, package manifest and release pipeline | Component; distinguish service, website, library, or CLI using the installation's conventions |
| OpenAPI, AsyncAPI, GraphQL schema, protobuf or maintained interface schema | API with the actual definition and a supported type |
| Confirmed application boundaries and shared ownership | System; Domain only when the business grouping is established |
| Database, bucket, queue or other provisioned dependency in IaC/deployment configuration | Resource; distinguish definitions from actual deployed instances |
| CODEOWNERS plus approved team mapping, existing owner references | Ownership; GitHub usernames/teams are not automatically Backstage entity references |
| Runtime calls, declared service dependencies, API bindings | dependsOn, providesApis, consumesApis; not every build dependency is a catalog component |
| Documentation build configuration and ADR files | TechDocs/ADR annotations only when the installed plugin and source resolver support them |
| GitHub Actions, Kubernetes or CI configuration | Relevant plugin annotations only after checking the plugin's documented schema |
| Observed build/test/coverage results and source-backed readiness facts | Tech Insights facts/checks with approved policy; not guessed scores |
| Scripts, tests, content packs, static assets | Evidence for their owning component; not automatically independent entities |

Keep annotations and links source-backed. Do not invent monitoring URLs,
Kubernetes cluster IDs, cloud resources, or external API definitions. A
third-party dependency can remain an unresolved external relation rather than
becoming an invented local API or Resource.

## Catalog layout and merging

- Preserve `(kind, namespace, name)` and existing owner/lifecycle values.
- Prefer descriptors near independently deployed or owned components, with one
  aggregate Location per repository when needed.
- Build a cross-repository identity index before writing an organization
  aggregate. Resolve collisions with the user; never silently rename existing
  entities. Avoid registering both an aggregate and its children.
- Put organization groups in one approved organizational descriptor rather than
  duplicating them in every repository. Record unresolved external owners.
- Merge YAML without dropping comments, extensions, documents or unrelated
  configuration. For file mode, exact inline API definitions avoid unsupported
  placeholders; do not weaken or replace schemas with illustrative examples.
- A published repository URL is not a path to local edits. Keep test clones
  persistent while Backstage references them, and report publication separately.

## GitHub discovery plugin

The official `@backstage/plugin-catalog-backend-module-github` module registers
GitHub catalog processors/providers in the new Backstage backend. Check its
version against the running Backstage release and inspect its actual config
schema before modifying an installation.

A narrowly scoped public-organization example is:

```yaml
catalog:
  providers:
    github:
      public-org-test:
        organization: backstage
        catalogPath: /catalog-info.yaml
        validateLocationsExist: true
        filters:
          repository: '^backstage$'
          allowForks: false
          allowArchived: false
          visibility: [public]
        schedule:
          frequency: { minutes: 30 }
          timeout: { minutes: 3 }
```

This provider uses GitHub GraphQL, which requires authentication even for public
repositories. GitHub integration credentials must be configured separately
through approved environment references or secret management. This is not a
Backstage catalog API token. Repository branch filters are optional; without
one, verify that the provider uses each repository's default branch.

This provider looks for existing published descriptors. It does not generate
missing descriptors, infer owners, or perform semantic source inventory.
For a GitHub user account, enumerate user repositories with the supported API,
inspect approved clones, then use file locations or published URL locations.
Do not pass a username to an organization-only provider.

Validate the provider's discovered count, expected entity references, origin
locations and processing errors. No permission to list teams/private repos
means incomplete coverage, not a passing full-organization assessment.
