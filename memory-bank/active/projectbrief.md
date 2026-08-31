# Project Brief

## User Story

As a contributor, I want `discover.ts` covered by Node/`tsx` tests against a fake `$HOME` / `$XDG_CONFIG_HOME` tree so that discovery regressions are caught without an extension host.

## Use-Case(s)

### Use-Case 1

A developer runs the existing parser-style test command and also exercises `discoverThemes` against a fixture filesystem, not their real home directory.

### Use-Case 2

The suite documents the discovery contract: a usable theme is listed, Ghostty/kitty "in use" flags come from config, unusable palettes are omitted, and a missing source directory is a no-op rather than a throw.

## Requirements

1. Implement [issue #5](https://github.com/Texarkanine/vscode-terminal-themes/issues/5): committed tests for `discover.ts` pointed at a fixture HOME / XDG tree.
2. Cover at least: finding a theme; marking Ghostty and kitty active from config; skipping unusable palettes; not throwing when a source dir is missing.
3. Keep the runner Node/`tsx` like `test/parsers.test.ts` unless the whole test runner is switched (it is not).

## Constraints

1. Do not introduce an extension-host harness for this issue.
2. Discovery stays vscode-free (`fs` / `os` / `path`).
3. Do not wait on further intent clarification; the operator approved this issue as the task.
4. A commit must include `Fixes #5`. Stop at REFLECT COMPLETE: no PR, no archive.

## Acceptance Criteria

1. Tests import and call `discoverThemes` (today `test/parsers.test.ts` never imports `discover.ts`).
2. Tests construct or use a fake `$HOME` / `$XDG_CONFIG_HOME` tree rather than scanning the developer's real config.
3. The four behaviors in the issue body are asserted and committed.
4. `npm run test:parsers` (or the same-family script that remains the Node/`tsx` entry) runs those tests.
