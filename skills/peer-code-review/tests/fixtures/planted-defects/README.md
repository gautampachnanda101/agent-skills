# Planted-defect code change

Fixture for applying the peer-code-review skill. Eight defects are planted;
the grader and the manual run tally recall against this list.

```diff
diff --git a/src/queue/consumer.js b/src/queue/consumer.js
--- a/src/queue/consumer.js
+++ b/src/queue/consumer.js
@@ -12,7 +12,10 @@ class Consumer {
   async poll() {
     const event = await this.fetch();
     try {
-      return await this.handle(event);
+      try {
+        return await this.handle(event);
+      } catch (error) {
+        // ignore transient errors
+      }
     } catch (error) {
-      this.log.fail(event.id, error);
       this.retry.count += 1;
     }
   }

diff --git a/src/ui/status.js b/src/ui/status.js
--- a/src/ui/status.js
+++ b/src/ui/status.js
@@ -3,6 +3,11 @@ export function renderStatus(health) {
-    <span>{health.label}</span>
+    <div style={health.ok ? green : red}>{health.label}</div>  // colour-only status
...
```

Planted defect ledger (the ground truth every reviewer run is scored against):

| # | Planted defect | Expected severity |
| --- | --- | --- |
| 1 | Nested try/catch swallows all exceptions; failure log removed | `major` |
| 2 | Unit test for `handle` failure path deleted; coverage drop on changed path | `major` |
| 3 | `# noqa` suppression added with no reason | `minor` |
| 4 | `health` type changed from `Health` object to `any` | `minor` |
| 5 | Status rendered as `<div>` with inline colour only — non-semantic control, colour-only meaning, no text alternative for a failed health check | `major` (accessibility) |
| 6 | `const token = "ghp_live_7Xk9...";` hardcoded in test helper | `major` (flag presence, never quote) |
| 7 | Whole `src/ui/` reformatted (import order churn) unrelated to the change | `minor` |
| 8 | Retry logic duplicated between `poll()` and `pollOnce()` | `minor` |

Clean-variant expectation: a companion fixture with the swallow fixed,
semantic status with text label, suppression reasoned, and type kept —
the correct verdict is `approve` with at most one comment.
