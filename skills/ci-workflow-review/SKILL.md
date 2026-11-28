---
name: ci-workflow-review
description: Review CI/CD pipeline definitions - GitHub Actions workflows first, and GitLab CI or other pipelines by the same rules - for what lets an attacker run code, steal a token, or change what ships - pull_request_target with untrusted checkouts, script injection from event data, over-broad token permissions, unpinned third-party actions, leaked secrets, and persisted credentials - plus caching and trigger mistakes. Runs the repository's configured workflow linters, then the bundled checker, rates findings by what an outsider could do, and reports a verdict without editing or triggering any workflow. Not for writing a new pipeline, or for reviewing application code; use peer-code-review or security-review for code. Use when asked to review, audit, or harden CI, GitHub Actions, workflows, or pipelines.
license: Apache-2.0
compatibility: Host assistant with file-read tools; a shell for linters. Node.js 20+ is optional, for the bundled checker. Tested with Claude Opus 5.5.
metadata:
  author: gautampachnanda101
  version: "1.0.0"
---

# CI workflow review

A CI pipeline runs code with secrets and a token that can push to the
repository, so a pipeline defect is a supply-chain defect. Review the
workflows for what someone outside the team could make them do, and report;
never edit or trigger a workflow.

## Find the pipelines and run the linters

1. Find every pipeline definition: `.github/workflows/*.yml`, composite
   actions under `.github/actions/`, `.gitlab-ci.yml`, and others. If there
   are none, say so and stop.
2. For GitHub Actions, read [references/github-actions.md](./references/github-actions.md).
   For other systems, apply the same rules to their equivalents.
3. Run the linters the repository already uses, such as `zizmor` or
   `actionlint`, from its pre-commit or CI configuration. Then, when Node.js
   is available, run `node scripts/check-workflow.mjs <workflow files>`.
   Record what ran and what could not.
4. Read every workflow in full. The checker finds patterns; you judge who
   can trigger each workflow, with what input, and what its token can do.

## Rate by what an outsider could do

- `blocker`: an outsider can run code with secrets or a write token, for
  example `pull_request_target` checking out the pull request, or event data
  expanded into a script
- `major`: a secret can leak, or a job holds far more permission than it
  uses
- `minor`: hardening, such as pinning an action or not persisting the token
- `question`: you cannot tell, for example whether a fork can reach a job

## Report

1. **Verdict:** `approve`, `approve with comments`, or `request changes`.
   Any blocker or major means `request changes`.
2. **Findings:** a table with Severity, Location (`file:line`), Evidence (a
   short quote), and Suggested direction. Say who can trigger it and what
   they gain, in a sentence.
3. **Checks:** what the linters and checker found, and what could not run.

Order findings by severity. Never quote a secret's value. Do not edit,
re-run, or dispatch a workflow: running one can deploy. When Node.js is
available, save the report and run `node scripts/check-review-report.mjs
<report.md>`, which checks its structure.
