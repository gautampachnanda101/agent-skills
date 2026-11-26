# Greeter overwrote a saved message

Reported by Dana, 2026-11-20.

**Request:** "Write a birthday message for Sam."

**What happened:** `greeting.txt` already held the anniversary message for
Alex that Dana had written by hand the day before. The greeter skill
loaded, wrote the message for Sam to `greeting.txt`, and replaced Alex's
message without saying so. Nothing asked before overwriting.

**Expected:** notice that `greeting.txt` already exists and ask before
replacing it, or offer a different file name.
