---
name: skill-correction
description: Turn a correction to an Agent Skill's behaviour into a failing eval case and the smallest fix to the skill. Reads the skill, its existing evals, and any transcript of the mistake; classifies the root cause (selection, a missing or buried instruction, ambiguity, the harness, or model capability); writes a minimal fixture and contract that fail on the observed behaviour; proposes the smallest change to the skill; then re-runs the new case and the skill's other cases. Not for fixing a bug in application code, or for reviewing a skill with no correction to make; use peer-code-review to review code. Use when a skill did the wrong thing, skipped a step, was not loaded when it should have been, or when review feedback on a skill's output should change how it behaves next time.
license: Apache-2.0
compatibility: Host assistant with file-read and file-write tools. Running eval cases needs the repository's eval runner and a model; without one, the skill grades a recorded transcript instead and says so.
metadata:
  author: gautampachnanda101
  version: "1.0.2"
---

# Skill correction

A shared skill gets better when a correction changes it for next time. Do
that the way a regression is fixed in code: reproduce the mistake as a test
that fails, make the smallest change that makes it pass, and check that
nothing else broke. The test comes first, so the fix is measured rather
than hoped for. This follows the evaluation-first practice for Agent Skills
and test-first bug fixing.

## Gather the correction

Read before you ask, then confirm once:

1. Read the skill's `SKILL.md`, the guides it links, and its existing evals
   (for example `evals/agent-evals.json` or `evals/evals.json`). Learn the
   repository's eval format and runner from its files and docs; do not
   invent a new format when one exists.
2. Read the evidence of the mistake: a transcript, a review comment, a
   failing eval result, or the user's description.
3. Restate the correction as observable behaviour, and send it for
   confirmation with your proposed case and fix (below):
   - **Task:** what the user asked, in their words.
   - **Observed:** what the assistant did, with the evidence.
   - **Expected:** what it should have done instead.

If the correction cannot be stated as something observable (a file read, a
command run, a file written or not, words in the reply), say so and ask for
an example. A correction you cannot observe cannot become a test.

## Find the root cause

Classify the cause before changing anything, because each cause has a
different fix. Use [root-causes.md](./root-causes.md):

| Cause | Sign | Fix belongs in |
| --- | --- | --- |
| Selection | The skill never loaded | The skill's `description` |
| Missing instruction | The skill loaded but says nothing about this | One instruction, in the step where it applies |
| Buried instruction | The rule exists but sits far from the step | Move it into that step |
| Ambiguity | The rule can be read two ways | Reword it; check other rules for the same wording |
| Harness | Permissions, tools, or setup caused it, not the skill | The eval harness, not the skill |
| Model capability | A capable model follows the skill; this model does not | Nothing in the skill; record the result |

Name the cause with its evidence. If the evidence fits more than one cause,
say which you ruled out and why.

## Write the failing case

1. Make the smallest fixture that reproduces the mistake: only the files the
   task needs. Never copy real secrets or personal data from a transcript.
2. Write the prompt as a user would say it, without naming the skill, so
   selection is tested too.
3. Write checks that fail on the observed behaviour and pass on the
   expected one. Prefer checks on actions (files read, commands run, files
   written or left alone) over checks on wording. Match reply wording only
   for what the correction is about.
4. Confirm the case fails before fixing anything: run it with the
   repository's runner, or, without a model, grade the recorded transcript
   of the mistake against the new case. A case that already passes does not
   capture the correction; rewrite it.

## Make the smallest fix

- Change the one place the root cause points to. Do not add the same rule
  in several sections.
- Prefer rewording or moving an existing instruction over adding a new one.
- For a harness cause, fix the harness and leave the skill alone. For a
  model-capability cause, change nothing in the skill; record the result.
- Keep the skill within its size budget, and follow the repository's
  versioning: a changed skill gets a higher version and a changelog entry.

## Re-run and report

1. Run the new case and every other case for the skill. A model's choices
   vary, so run each case at least three times when the runner allows, and
   report the pass rate before and after the fix.
2. If another case now fails, the fix is too broad: narrow it, or report the
   trade-off and ask.
3. Record passing runs if the repository keeps recordings.

Report with these headings: **Correction**, **Root cause**, **New case**
(its files), **Before** (the failing evidence), **Change** (the diff), and
**After** (pass rates for the new case and the others). End with anything
unverified.

## Boundaries

- Write nothing until the correction, the case, and the fix are confirmed.
- Never weaken or delete an existing check to make a case pass.
- Never claim a pass rate you did not measure; a case you could not run is
  reported as not run.
- Say before running when a run uses a paid model or account, and how many
  runs it will take.
