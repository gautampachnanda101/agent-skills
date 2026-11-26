# Suggest decisions from repository evidence

Load this guide before asking the user for an owner, lifecycle, system, or
any other value the repository may already answer. Read first, then present
each answer as a suggestion with its evidence. The user confirms or corrects
the whole batch once.

## Make each suggestion

For every open decision, record:

| Field | Content |
| --- | --- |
| Decision | What needs a value, such as `spec.owner` for `ledger-sync` |
| Suggestion | The proposed value, in its final form, such as `group:default/payments-platform` |
| Evidence | The file and line, or the command and its output |
| Confidence | `strong`, `weak`, or `none` |

Write nothing until the user confirms. If the user cannot answer, report
the decision as a blocker instead of inventing a value.

## Owner signals, strongest first

| Signal | Where to look | Confidence |
| --- | --- | --- |
| An owner already in a descriptor | `spec.owner` in existing entity files | Strong, unless it is a test owner or placeholder |
| A team that owns the paths | `CODEOWNERS`, `.github/CODEOWNERS`, `docs/CODEOWNERS` | Strong when it maps to a known Backstage group |
| A group that already exists in the catalog | Group entities in descriptors, or the catalog API | Strong when its name matches a code owner |
| A maintainer the project names | `MAINTAINERS`, `OWNERS`, the README support section, package `author` or `maintainers` | Weak |
| The repository's account | The GitHub owner and whether it is a user or an organization | Weak: an account is not a team |
| Frequent committers | `git shortlog -sn` | Weak, and never publish their emails |

Treat `group:default/catalog-test`, `guest`, `user:guest`, `unknown`, and
`example` owners as placeholders. Suggest replacing them, and say why.

A personal repository with one maintainer usually suits a User owner, such
as `user:default/<login>`. Say that the User entity must exist in the
catalog for the reference to resolve.

## Other decisions

| Decision | Evidence to read |
| --- | --- |
| `spec.lifecycle` | Release tags, deployment files, a changelog, a README status line, or an archived repository |
| `spec.type` | Entry points, a server framework, a published package, a site generator |
| `spec.system` | Existing System entities, shared deployment files, a monorepo layout |
| API definitions | OpenAPI, AsyncAPI, GraphQL, or protobuf files, or framework annotations |
| TechDocs | `mkdocs.yml`, a `docs/` directory, `backstage.io/techdocs-ref` |

## Send one batch

Lead with the suggestions as a table the user can accept with one reply,
then list the questions that have no evidence. For example:

> Suggested from the repository. Reply "accept" or correct any row.
>
> | Decision | Suggestion | Evidence | Confidence |
> | --- | --- | --- | --- |
> | `spec.owner` | `group:default/payments-platform` | `CODEOWNERS:1` assigns `*` to `@acme/payments-platform`, and that group exists in `org.yaml:12` | strong |
> | `spec.lifecycle` | `production` | `README.md:3` says "in production since 2024" | strong |
>
> No evidence found: which Backstage app configuration should load the
> descriptor?
