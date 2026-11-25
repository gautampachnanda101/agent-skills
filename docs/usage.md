# Using the skills

Open the repository to catalog in the assistant and ask, for example:

> Use the backstage-catalog-builder skill to create a Backstage catalog for
> this repository.

For a complete account-wide configuration, ask:

> Use backstage-catalog-builder for https://github.com/OWNER. Discover all
> eligible repositories, generate missing catalog entries from their files,
> preserve existing metadata, and configure my local Backstage app. Include
> supported APIs, infrastructure, ownership and documentation. Confirm scope
> and missing decisions once, then verify catalog coverage and persistence.

To keep an existing catalog instead of starting from scratch, point the skill
at what you already have:

> Use backstage-catalog-builder against my existing entity configuration at
> ./platform-catalog (descriptors plus the app-config catalog.locations), then
> onboard repo https://github.com/OWNER/NEW-SERVICE and register the new
> descriptors with my Backstage at https://backstage.example.com, reading the
> token from the BACKSTAGE_TOKEN environment variable.

## What a complete result looks like

The intended result is a usable configuration bundle, not just a repository
list or discovery plugin. Each approved repository is inspected and either
represented by justified entities or reported with a specific blocker. The
skill assembles locations, approved organization data, app configuration and
an expected-entity inventory, and verifies ingestion when access permits.

Inspection covers actions/CI, teams and organization metadata, documentation
and ADRs, API contracts, infrastructure and technical-insight evidence. Plugin
configuration is derived from discovered capabilities and approved policies,
not guessed annotations or scores. See the
[configuration delivery workflow](https://github.com/gautampachnanda101/agent-skills/blob/main/backstage-catalog-builder/configuration-delivery.md).

## Boundaries to expect

- The assistant should ask whether existing entity configuration can be
  supplied as paths or a repository holding descriptors, or as a catalog
  endpoint for the running instance; a token is requested only through an
  environment-variable name, credential-file path, or secret mechanism, never
  as its value.
- Creating local descriptors and registering them with Backstage are separate
  steps.
- If the skill is not found, check the destination, the active assistant or
  agent, and its skill permissions or settings.

Discovery and available capabilities depend on the assistant and its
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
