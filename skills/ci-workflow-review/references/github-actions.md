# GitHub Actions: what to check

Read this when reviewing GitHub Actions workflows.

| Risk | What to look for | Safer form |
| --- | --- | --- |
| Untrusted code with secrets | `pull_request_target` or `workflow_run` that checks out the pull request's head | Use `pull_request`; keep `pull_request_target` to jobs that never check out or run the pull request's code |
| Script injection | `${{ github.event.issue.title }}`, `pull_request.title`, `head_ref`, comment bodies, or commit messages inside `run:` | Pass the value through `env:` and quote the variable |
| Token scope | `permissions: write-all`, or no `permissions:` block | `permissions: contents: read` at the top, and grant more per job only where needed |
| Supply chain | `uses: owner/action@v4` or `@main` | Pin to a full commit SHA with the tag in a comment, and update through Dependabot |
| Credentials on disk | `actions/checkout` without `persist-credentials: false` | Set it to `false` unless a later step pushes |
| Secret exposure | `echo ${{ secrets.X }}`, secrets in `with:` of untrusted actions, `set -x` around secrets | Mask, pass through env, and never print |
| Self-hosted runners | Public repositories using `runs-on: self-hosted` | Use hosted runners for code from forks |
| Caches | Caches keyed on files a pull request controls, restored in privileged jobs | Separate caches for untrusted and trusted jobs |

Triggers that outsiders reach: `pull_request` from forks (with a read-only
token), `pull_request_target`, `issue_comment`, `issues`, `discussion`, and
`workflow_run` after any of them. `push`, `schedule`, and
`workflow_dispatch` are reached only by people with write access.
