# Using the skills

Open the repository in your assistant and ask for a skill by name. Start with
the prompts for each skill, then see the longer catalog examples.

In this page:

- [A prompt for each skill](#a-prompt-for-each-skill)
- [Catalog a single repository](#catalog-a-single-repository)
- [Account-wide configuration](#account-wide-configuration)
- [Extend an existing catalog](#extend-an-existing-catalog)
- [Fast path: one prompt, every decision](#fast-path-one-prompt-every-decision)
- [What a complete result looks like](#what-a-complete-result-looks-like)
- [Boundaries to expect](#boundaries-to-expect)
- [Assistant skill documentation](#assistant-skill-documentation)

## A prompt for each skill

| Skill | Ask |
| --- | --- |
| [backstage-catalog-builder](skills/backstage-catalog-builder.md) | "Use the backstage-catalog-builder skill to create a Backstage catalog for this repository." |
| [peer-code-review](skills/peer-code-review.md) | "Review this pull request using the peer-code-review skill." |
| [documentation-review](skills/documentation-review.md) | "Review this README with the documentation-review skill." |
| [documentation-author](skills/documentation-author.md) | "Write the getting-started guide for this repository using the documentation-author skill." |
| [skill-correction](skills/skill-correction.md) | "The peer-code-review skill approved a change with failing tests; here is the transcript. Fix the skill with skill-correction." |
| [decision-record-author](skills/decision-record-author.md) | "Write a decision record for moving payment updates from polling to webhooks; the discussion is in notes/webhooks.md." |
| [specification-author](skills/specification-author.md) | "Write a spec for adding CSV export to the reports page." |
| [specification-review](skills/specification-review.md) | "Review the spec in docs/specs/csv-export.md before we build it." |
| [test-plan-author](skills/test-plan-author.md) | "Write a test plan for the account-merge spec in docs/specs/merge-accounts.md." |
| [security-review](skills/security-review.md) | "Do a security review of the latest commit before I merge it." |
| [change-plan-author](skills/change-plan-author.md) | "Plan the work for the CSV export spec as a sequence of reviewable changes." |
| [release-notes-author](skills/release-notes-author.md) | "Draft the release notes for orders-api 1.5.0." |
| [ci-workflow-review](skills/ci-workflow-review.md) | "Review our GitHub Actions workflows for problems before we enable them on forks." |

The four review skills (`peer-code-review`, `security-review`,
`documentation-review`, and `specification-review`) report findings and
change nothing. The other skills read the repository, suggest what to do,
and write only after you confirm. The rest of this page covers
`backstage-catalog-builder`.

## Catalog a single repository

The smallest useful request:

> Use the backstage-catalog-builder skill to create a Backstage catalog for
> this repository.

## Account-wide configuration

For an organization or user account, ask for the full scope up front:

> Use backstage-catalog-builder for `https://github.com/OWNER`. Discover all
> eligible repositories, generate missing catalog entries from their files,
> preserve existing metadata, and configure my local Backstage app. Include
> supported APIs, infrastructure, ownership and documentation. Confirm scope
> and missing decisions once, then verify catalog coverage and persistence.

## Extend an existing catalog

To build on configuration that already exists, point the skill at it:

> Use backstage-catalog-builder against my existing entity configuration at
> ./platform-catalog (descriptors plus the app-config catalog.locations), then
> onboard repo `https://github.com/OWNER/NEW-SERVICE` and register the new
> descriptors with my Backstage at `https://backstage.example.com`, reading the
> token from the BACKSTAGE_TOKEN environment variable.

## Fast path: one prompt, every decision

Each decision the skill would otherwise ask about can be supplied up front.
A fully specified prompt skips the interactive round of questions:

> Use backstage-catalog-builder. Sources: this repository plus
> `https://github.com/OWNER/ORG-CATALOG`, which holds our existing descriptors
> and the app-config with catalog.locations. Extend that configuration:
> onboard any missing repos from `https://github.com/OWNER`, add justified APIs
> and ownership, and generate TechDocs for new services. Write the bundle to
> ./platform-catalog and merge the locations into its app-config. My Backstage
> runs at `https://backstage.example.com` (token in the BACKSTAGE_TOKEN
> environment variable): dry-run the new locations, then register them.
> Confirm the proposal once, then carry it through every selected repository.

The token is referenced by name, never pasted. The skill asks for an
environment-variable name, a credential-file path, or the host's secret
mechanism, never a token value. Follow the same rule in a fast-path prompt.

## What a complete result looks like

The intended result is a usable configuration bundle, not just a repository
list or discovery plugin:

- each approved repository inspected and either represented by justified
  entities or reported with a specific blocker;
- locations, approved organization data, app configuration, and an
  expected-entity inventory assembled together;
- ingestion verified when access permits.

Inspection covers actions/CI, teams and organization metadata, documentation
and ADRs, API contracts, infrastructure, and technical-insight evidence.
Plugin configuration is derived from discovered capabilities and approved
policies, not guessed annotations or scores. The detailed workflow lives in
[configuration-delivery.md](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/backstage-catalog-builder/configuration-delivery.md).

## Boundaries to expect

- Supplying existing entity configuration (paths, a repository, or a catalog
  endpoint) is the starting question; the token value itself is never
  requested.
- Creating local descriptors and registering them with Backstage are separate
  steps.
- If the skill is not found, check the destination, the active assistant or
  agent, and its skill permissions or settings.
- Discovery and available capabilities depend on the assistant and its
  configuration; compatibility has not been verified in every client.

## Assistant skill documentation

- [VS Code Agent Skills](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [GitHub Copilot CLI Agent Skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills)
- [Kiro Agent Skills](https://kiro.dev/docs/skills/)
- [OpenCode Skills](https://opencode.ai/docs/skills/)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [OpenAI Codex Skills](https://developers.openai.com/codex/skills/)
- [Gemini CLI Agent Skills](https://geminicli.com/docs/cli/skills/)
- [Cursor Agent Skills](https://cursor.com/docs/skills)
- [Windsurf Cascade Skills](https://docs.windsurf.com/windsurf/cascade/skills)
- [Cline Skills](https://docs.cline.bot/customization/skills)
