# Active Context

## Current Task: issue-6-extension-host-tests
**Phase:** PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

## What Was Done
- Classified Level 2 and planned host tests for apply, remove, and preview-cancel.
- Validated `@vscode/test-cli` + `@vscode/test-electron`: smoke test passed after shortening `--user-data-dir` (macOS unix-socket path limit).
- Decided to extract `LivePreview` from the picker so debounce and cancel restore are testable without driving QuickPick.
- Apply/remove tests are characterization of existing APIs (expected green). `LivePreview` is new (red then green).

## Next Step
- Preflight validation of the plan.
