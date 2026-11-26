# Root causes of skill mistakes

Read this guide when classifying why a skill went wrong. Each cause below
has the signs that identify it, the fix that belongs to it, and a real
example from this repository's behaviour evals.

## Selection: the skill never loaded

**Signs:** the transcript shows no skill load (no skill tool call, no read
of `SKILL.md`), yet the task matches what the skill does. The assistant
answered from general knowledge or improvised with the skill's own scripts.

**Fix:** the `description`, because it is the only part of a skill an
assistant sees before choosing. Add the words a user would use for this
task. Keep it within the spec's 1,024 characters.

**Example:** asked to "check this catalog-info.yaml for problems", Claude
Opus 5.5 skipped `backstage-catalog-builder` in two of three runs. Its
description covered creating and updating descriptors but not checking
them. Adding "checking or validating an existing catalog-info.yaml" raised
loading to three of three.

## Missing instruction

**Signs:** the skill loaded, and nothing in it covers the situation.

**Fix:** one instruction, in the step where the situation arises. Say what
to do and why, in a sentence.

**Example:** asked to rewrite a page whose onward link had no known target,
`documentation-author` left `<!-- TODO: restore the onward link -->` in
three of six finished pages. Nothing in the skill said where unknowns go. A
sentence in its final step ("Unknowns belong in this report, not in the
page") took the case from two of six passes to three of three.

## Buried instruction

**Signs:** the rule exists, but in a different section, a guide that was not
read, or far down a long list. The transcript shows the assistant read the
skill and still missed it.

**Fix:** move the rule into the step where it applies, or repeat it there
briefly and link to the detail. Do not add a third copy.

## Ambiguity

**Signs:** the assistant did something the wording allows but the author did
not mean. A careful model is the most likely to take the strict reading.

**Fix:** reword so only one reading is possible. Search the skill and its
guides for the same phrase.

**Example:** the same `documentation-author` correction had a second cause.
Its boundary "surface rather than remove content you could not verify"
reads as "leave a note in the page". It now says to report unverified
content rather than silently remove it.

**Example:** a permission note said "run only these commands: `node
check-descriptors.mjs`". Opus read it as allowing the command with no
arguments, so it applied the checker's rules by hand. The note now says
"commands that start with ..., with any arguments". This was the harness's
wording, which leads to the next cause.

## Harness

**Signs:** the mistake comes from the environment, not the skill: a denied
tool, a missing permission, a tool the assistant was never given, or setup
that differs from real use.

**Fix:** the harness. Changing the skill to work around a harness problem
makes it worse for real users.

**Examples:**

- An assistant chained `npm test | tail; node -e ...`, and the whole chain
  was denied because one part was not permitted. Prompts now state what
  each session may run.
- A built-in agent listed skills only in its system prompt, and a local
  model never loaded one. Adding a `use_skill` tool, as hosts with a skill
  tool have, let it load the right skill in four of eight cases.
- A review was failed for missing duplicated retry logic that it had
  reported, as "the backoff logic now exists in both `pollOnce` and
  `retry()`". The answer key's pattern knew "duplicate" and "copy" but not
  "exists in both". Read the failing reply before blaming the skill.
- Telling the assistant "write no files" hides whether a skill waits for
  confirmation, because the assistant stops for the wrong reason. A case
  about a confirmation gate should allow the write and check that nothing
  changed.

## Model capability

**Signs:** a capable model passes the same case with the same skill, and a
smaller model does not, even with the harness fixed.

**Fix:** none in the skill. Record the result, with the model, so the skill
is not bent to suit one model.

**Examples:**

- Qwen3 8B on llama.cpp loaded the right skill but stopped after one or two
  tool calls instead of following its steps. Claude Opus 5.5 passed the
  same cases.
- Claude Haiku 5.5 wrote `catalog-info.yaml` before asking in three of three
  runs, two of them after loading `backstage-catalog-builder`, while Opus
  asked first in three of three. Repeating the confirmation rule in the step
  that writes changed nothing for Haiku, so the change was reverted.
