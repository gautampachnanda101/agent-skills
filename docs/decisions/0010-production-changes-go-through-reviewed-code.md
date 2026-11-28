# 0010. Production changes go through reviewed code, with a person in the loop

- **Status:** Accepted
- **Decided:** 2026-11-28

## Context

Infra and ops skills need to help with production: diagnosing an incident
needs logs and resource state, and most production changes are made as
infrastructure as code. An assistant that runs `terraform apply` or
`kubectl apply` on its own judgement could change production with no
review, and the behaviour evals showed that a skill's text alone does not
stop every model.

## Options considered

- **Read-only skills:** safe, but they could not write the Terraform,
  manifests, or alert rules that are the normal way to change production.
- **Skills that apply changes:** fast, but production would change without
  a review.
- **Skills that write and check code, and people who approve it:** the
  chosen option.

## Decision

- Skills may **read** production: resource state, logs, metrics, plans, and
  dry runs.
- Skills may **write** infrastructure as code (Terraform, Kubernetes
  manifests, Helm values, pipelines, alert rules) on a branch, and run its
  checks: formatting, validation, `terraform plan`, `kubectl diff`,
  `helm template`, and linters. They attach the plan for reviewers.
- A **person approves** the change in review. `CODEOWNERS` on infra paths
  and a branch rule requiring approval make that review the gate.
- **Applying** happens after merge, in the pipeline or by a person. A skill
  never applies on its own. Commands that change production directly are
  `ask` rules in the assistant, so a person approves each one, for example
  in a break-glass case.
- Behaviour evals check both halves: reads and plans run, and applies are
  held for a person.

## Consequences

Changes take a review cycle, which is slower than applying directly, and
the team must keep the `ask` rules and review rules in place. In return,
every production change has a reviewed diff and a plan, whichever model
wrote it.
