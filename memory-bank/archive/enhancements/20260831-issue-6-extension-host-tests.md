---
task_id: issue-6-extension-host-tests
complexity_level: 2
date: 2026-08-31
status: completed
---

# TASK ARCHIVE: issue-6-extension-host-tests

## SUMMARY

Added an Extension Development Host suite so apply, surgical remove, and live-preview cancel/debounce are proven without a manual F5 session. Parser tests stay vscode-free. PR: https://github.com/Texarkanine/vscode-terminal-themes/pull/17 (`Fixes #6` in `5e24efc`).

## REQUIREMENTS

- Host tests for apply (flat vs scoped), remove (owned keys vs fallback), and preview-cancel restore
- `@vscode/test-cli` + `@vscode/test-electron` (current recommended pair)
- Isolated settings so tests do not write the operator's real `settings.json`
- CI left to issue 3

## IMPLEMENTATION

Mocha TDD under `test/host/`, compiled by `tsconfig.test.json`, launched by `.vscode-test.mjs`. Default vscode-test user-data dir exceeds the macOS ~103-char unix-socket limit in this worktree; the config passes `--user-data-dir` under `os.tmpdir()`.

`LivePreview` in `src/apply.ts` is the testable preview unit: `schedule` debounces `applyPalette`, `cancel` restores the snapshot, `stop` drops a pending timer without restore (accept path). The picker uses it instead of an inline timer. Apply/remove tests characterize existing APIs.

Key files: `src/apply.ts`, `src/extension.ts`, `test/host/{apply,preview,smoke,helpers}.ts`, `package.json`, `package-lock.json`, `.vscode-test.mjs`.

## TESTING

- `npm test`: parsers 11 passed, host 18 passed (smoke, 3 LivePreview, 14 apply/remove/snapshot)
- Preflight: PASS WITH ADVISORY. QA: PASS with advisories
- PR review: `stop()` on accept plus a tighter debounce oracle (first-only `cursor` key must be absent after the wait); host test covers accept-then-remove in the debounce window

## LESSONS LEARNED

- vscode-test's default `.vscode-test/user-data` is unusable in a long worktree path on macOS. Short `--user-data-dir` in `.vscode-test.mjs`.
- Extracting a timer into a class drops "clear without restore" unless the class exposes it (`stop()`).
- Existing vscode-bound APIs should be characterization-tested (expect green). TDD applies to new units like `LivePreview`.
- A debounce test that only asserts last-write-wins stays green if both palettes apply; omit a slot on the second palette.

## PROCESS IMPROVEMENTS

Characterize already-shipped vscode-bound APIs instead of forcing a fake red. If host tests had been assumed from day one, `apply.ts` would have shipped `LivePreview` instead of an inline picker timer.

## TECHNICAL IMPROVEMENTS

Issue 3 should run `test:host` and inherit the short user-data-dir. `package-lock.json` is owned by this issue and may collide with other worktrees.

## NEXT STEPS

None for this task. CI for the host suite is issue 3.
