# Security

Find what an attacker could do with a change, before it merges.

## Skills

| Skill | Reads | Produces |
| --- | --- | --- |
| [security-review](../skills/security-review.md) | A diff, commit, or pull request, and the repository's scanners | Findings rated by exploitability, and a verdict |
| [ci-workflow-review](../skills/ci-workflow-review.md) | CI workflow files, and the repository's workflow linters | Findings rated by what an outsider could do, and a verdict |

## What you approve

Risk on security findings, and the settings in [Make a skill's rules hard](../hard-rules.md).

## Where the skills connect

`security-review` and `peer-code-review` share a report shape, so both reviews of one change sit side by side.
