# Agent instructions

This repository develops reusable skills for coding assistants, including
GitHub Copilot and Claude. Favor the open Agent Skills format and keep skills
independent of any one assistant, editor, model, or operating system.

## Authoring skills

- Place each skill in its own directory under `skills/`, with a `SKILL.md`
  entry point. The directory name must match the skill's `name` in YAML
  frontmatter. `skills/` is also the Claude plugin's default skill directory.
- Include a lowercase, hyphen-separated `name` and a non-empty `description`
  in the frontmatter. Describe both what the skill does and when to use it.
- Write clear, actionable instructions. State prerequisites, expected inputs,
  outputs, and verification steps when relevant.
- Keep the entry point focused; put optional details in linked files within the
  skill directory and load them only when needed.
- Prefer portable instructions and standard tools. Declare dependencies and
  platform limitations; do not assume an assistant-specific tool is available.
- Keep the skill list and installation guidance in [README.md](./README.md)
  current when adding or changing skills, and register a new skill
  everywhere [Contributing a skill](./docs/contributing.md) lists, including
  its `.github/CODEOWNERS` line and its row in the Levels table.
- Read the repository before asking, suggest values with their evidence, and
  write nothing the user has not confirmed.
- Ship reply evals (`evals/evals.json`) and behaviour evals
  (`evals/agent-evals.json`) with every skill, and enforce a rule that
  matters with a bundled checker or an assistant setting rather than text
  alone ([decision 0009](./docs/decisions/0009-enforce-rules-outside-the-model.md)).
- Do not require secrets in files or examples. Ask for authorization before
  external or destructive actions, and surface failures rather than hiding them.

## Changes and verification

- Keep changes scoped to the request and follow existing skill conventions.
- Check that frontmatter is valid YAML, names match their directories, and
  linked local files exist. Exercise scripts and examples relevant to the change
  when their prerequisites are available.
- Do not claim universal compatibility without testing. Report any assistant,
  platform, or validation limitations.
