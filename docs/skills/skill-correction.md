# skill-correction

**Version 1.0.0 · [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/skill-correction/SKILL.md) · plugin name `agent-skills:skill-correction`**

Turns a correction to a skill's behaviour into a failing eval case and the
smallest fix to the skill, the way a regression is fixed in code. It reads
the skill, its existing evals, and the evidence of the mistake, finds the
root cause, and proposes a case and a fix for you to confirm. Once
confirmed, it writes them and re-runs the skill's cases.

## Root causes it tells apart

| Cause | Sign | Where the fix goes |
| --- | --- | --- |
| Selection | The skill never loaded | The skill's `description` |
| Missing instruction | The skill loaded but says nothing about this | One instruction, in the step where it applies |
| Buried instruction | The rule exists but sits far from the step | Move it into that step |
| Ambiguity | The rule can be read two ways | Reword it |
| Harness | Permissions, tools, or setup caused it | The eval harness, not the skill |
| Model capability | A capable model follows the skill; this model does not | Nothing; record the result |

The [root-causes guide](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/skill-correction/root-causes.md)
gives the signs of each cause, with real examples from this repository's
behaviour evals.

## What ships

| File | Purpose |
| --- | --- |
| [`SKILL.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/skill-correction/SKILL.md) | Gather, classify, write the failing case, fix, re-run, report |
| [`root-causes.md`](https://github.com/gautampachnanda101/agent-skills/blob/main/skills/skill-correction/root-causes.md) | Signs and fixes for each cause, with examples |
| [`evals/`](https://github.com/gautampachnanda101/agent-skills/tree/main/skills/skill-correction/evals) | Reply and behaviour eval cases |

## Use it

> The peer-code-review skill approved a change with failing tests; here is
> the transcript. Fix the skill with skill-correction.

It works with any eval format the repository already uses, and needs a model
only to re-run the cases. Without one, it grades the recorded transcript of
the mistake against the new case and says that the cases were not run.
