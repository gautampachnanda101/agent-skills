---
name: security-review
description: Review a diff, commit, or pull request for security defects - injection, missing or broken authentication and authorization, path traversal, unsafe deserialization and eval, secrets and personal data in code or logs, weakened cryptography or token checks, and risky new dependencies. Runs the repository's own configured scanners first, then reads every changed line for what scanners miss, rates each finding by exploitability and impact, and reports with file and line evidence and a verdict. Never quotes a secret's value and never edits the code. Use when asked for a security review, a threat check of a change, or whether a pull request is safe to merge.
license: Apache-2.0
compatibility: Host assistant with file-read tools and, for scanners and git history, a shell. Writes nothing; the review is the reply.
metadata:
  author: gautampachnanda101
  version: "1.0.1"
---

# Security review

Review a change for what an attacker could do with it. Scanners find known
patterns and vulnerable versions; a reviewer finds the missing check, the
trusted input that is not trustworthy, and the log line that leaks. Use
both, report only what the evidence supports, and leave fixing to the
author. This follows the OWASP Top 10 and the OWASP Code Review Guide.

## Gather the change and run the scanners

1. Get the change: the diff, the commit (`git show`), or the pull request.
   Read its description so you know what it claims to do.
2. Find and run the scanners the repository already configures: package
   scripts such as `npm run scan` or `npm audit`, linters with security
   rules, secret scanners, or CI security jobs you can run locally. Record
   what ran, and what you could not run and why. Never install a tool
   without permission.
3. Read every changed line, and the code around it that the change relies
   on, such as the route's middleware or the query helper.

## What to look for

| Area | Look for |
| --- | --- |
| Injection | SQL, shell, or template strings built from input; `eval` or `Function` on input |
| Authentication and authorization | New routes or actions without the checks their neighbours have; tokens decoded without verifying signatures |
| Input to files and URLs | Paths and URLs built from input (traversal, server-side request forgery) |
| Data exposure | Secrets, passwords, tokens, or personal data in code, logs, errors, or responses |
| Cryptography | Weakened algorithms, disabled certificate or signature checks, home-made crypto |
| Dependencies | New packages with known vulnerabilities, unpinned or insecure sources (`http:`, git without a commit), unexpected licences |
| Deserialization | Untrusted data parsed into objects or code |

## Rate and report

Rate each finding by how exploitable it is and what it would expose:

- `blocker`: exploitable by an outside attacker for data, money, or
  control: injection, missing authorization on a sensitive action,
  unverified tokens, a password in a log
- `major`: exploitable with some access or effort, or a serious exposure
- `minor`: defence in depth, or a weakness with little impact
- `question`: you cannot tell from the change, for example whether a
  middleware protects a route

Report with these headings:

1. **Verdict:** `approve`, `approve with comments`, or `request changes`.
   Any blocker or major means `request changes`.
2. **Findings:** a table with the columns Severity, Location (`file:line`),
   Evidence (a short quote of the code), and Suggested direction. Say how an
   attacker would use it, in a sentence.
3. **Scanners:** what ran, what it found, and what could not run.
4. **Unevaluated:** what the change relies on that you could not see.

Never quote a secret, password, or token value; name where it is so it can
be rotated. Do not edit the code, and do not run exploits.
