# ci-workflow-review

**Version 1.0.0 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/ci-workflow-review/SKILL.md) · plugin name `agent-skills:ci-workflow-review`**

Reviews CI/CD pipelines for what someone outside the team could make them
do. GitHub Actions comes first, and other systems get the same rules. It
runs the repository's own workflow linters, then a bundled checker, reads
every workflow for who can trigger it and what its token can do, and reports
a verdict. It never edits, re-runs, or dispatches a workflow, because
running one can deploy.

## What it checks

| Risk | Example |
| --- | --- |
| Untrusted code with secrets | `pull_request_target` checking out the pull request's head |
| Script injection | `${{ github.event.pull_request.title }}` inside `run:` |
| Token scope | `permissions: write-all`, or no `permissions:` block |
| Supply chain | Actions pinned to a tag instead of a commit |
| Secrets | A secret printed to the log; credentials left in `.git/config` |

## What ships

| File | Purpose |
| --- | --- |
| [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/ci-workflow-review/SKILL.md) | Find pipelines, run linters, rate by outsider impact, report |
| [`references/github-actions.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/ci-workflow-review/references/github-actions.md) | What to check in GitHub Actions, and the safer form |
| [`scripts/check-workflow.mjs`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/ci-workflow-review/scripts/check-workflow.mjs) | Finds the six patterns above, with line numbers; zero dependencies |
| [`scripts/check-review-report.mjs`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/ci-workflow-review/scripts/check-review-report.mjs) | Checks the report's verdict and findings table |

## Use it

> Review our GitHub Actions workflows for problems before we enable them on
> forks.

For the application code a workflow runs, use
[security-review](security-review.md) or [peer-code-review](peer-code-review.md).
