# Project Brief

## User Story

As a maintainer, I want extension-host tests for apply, surgical remove, and live-preview cancel restore so those vscode-bound behaviors are proven without relying on a manual F5 session.

## Use-Case(s)

### Use-Case 1

A contributor changes `apply.ts` (flat vs scoped writes, owned-key recording, fallback remove). Host tests fail if settings or ownership records are wrong.

### Use-Case 2

A contributor changes preview debounce or cancel restore. Host tests fail if cancel leaves a previewed palette in place or if restore does not return the pre-preview snapshot.

## Requirements

1. Host tests cover apply (including scoped vs flat writes).
2. Host tests cover remove: owned keys vs fallback.
3. Host tests cover preview-cancel restore (the path that restores the pre-picker snapshot).
4. Use `@vscode/test-electron` or the current recommended equivalent (`@vscode/test-cli` wrapping it).
5. Parser-suite tests remain; they do not import `vscode`.
6. Manual F5 is not a substitute for the host suite.

Authoritative description: https://github.com/Texarkanine/vscode-terminal-themes/issues/6

## Constraints

1. Do not import `vscode` into the vscode-free core (`discover.ts`, `palette.ts`, `src/parsers/`).
2. Host tests must not pollute the developer's real user `settings.json`; isolate via workspace target and/or a dedicated user-data dir.
3. CI for the new suite is out of scope (tracked separately as issue 3) unless a tiny script hook is needed to run tests locally.
4. Markdown files must not gain SPDX comments.

## Acceptance Criteria

1. `npm` has a script that launches an Extension Development Host and runs the new tests.
2. Those tests cover apply, remove (owned keys vs fallback), and preview-cancel restore.
3. `npm run test:parsers` still passes without an extension host.
4. A commit message includes `Fixes #6`.
