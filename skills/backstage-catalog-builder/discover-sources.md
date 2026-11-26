# Discover tools and repositories

Read this guide before inspecting a catalog or enumerating repositories. It
expands the *Discover tools and repositories* step of
[SKILL.md](./SKILL.md): which connection to use, how to read a running
catalog, and how to enumerate repositories on each source-control host.

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
