---
task_id: issue-6-extension-host-tests
date: 2026-08-31
complexity_level: 2
---

# Reflection: issue-6-extension-host-tests

## Summary

Host tests now cover apply, surgical remove, and live-preview cancel/debounce in an Extension Development Host. Issue 6 is done: `npm test` runs parsers (11) then host (17).

## Requirements vs Outcome

All four acceptance criteria landed. `Fixes #6` is already in commit `5e24efc` (QA missed it). Added `LivePreview` so cancel/debounce could be asserted without driving QuickPick. Did not add CI (issue 3).

## Plan Accuracy

Sequence held: harness, characterization of existing apply APIs (green on first run), then TDD for `LivePreview`. The surprise was plan-time: default vscode-test user-data dir exceeds the macOS unix-socket path limit in this worktree. Short `--user-data-dir` under `os.tmpdir()` fixed it before build.

## Build & QA Observations

Characterization tests and the LivePreview red-green cycle were uneventful. QA PASSed with advisories. The accept-path no longer clears a pending debounce timer (old picker did); leftover apply is the accepted palette, so it is idempotent. Persistent docs were stale until this reflect. QA's "Fixes #6 unmet" finding is incorrect.

## Insights

### Technical
- vscode-test's default `.vscode-test/user-data` is unusable in a long worktree path on macOS (~103-char socket cap). Configure a short `--user-data-dir` in `.vscode-test.mjs`.
- Extracting a timer into a class drops "clear without restore" unless the class exposes it. Accept still works because the pending write matches the committed palette.

### Process
- Existing vscode-bound APIs should be characterization-tested (expect green), not forced through a fake red. TDD applies to the new `LivePreview` unit.

### Million-Dollar Question

If host tests had been assumed from day one, `apply.ts` would have shipped `LivePreview` instead of an inline picker timer, and the vscode-bound shell would never have been untested. That is what we built. No wider redesign.
