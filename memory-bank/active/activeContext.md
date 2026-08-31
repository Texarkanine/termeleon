# Active Context

## Current Task: issue-6-extension-host-tests
**Phase:** BUILD - COMPLETE

## What Was Done
- Host harness scripts: `test`, `test:host`, `pretest:host`, `compile-tests`.
- Characterization tests in `test/host/apply.test.ts` (14 cases) against existing apply/remove/snapshot — all green without product changes.
- Extracted `LivePreview` in `src/apply.ts` (TDD red then green). `pickAndApply` in `src/extension.ts` uses it.
- Host suite 17 passing; parser suite 11 passing.

## Files
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-6-extension-host-tests/src/apply.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-6-extension-host-tests/src/extension.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-6-extension-host-tests/test/host/apply.test.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-6-extension-host-tests/test/host/preview.test.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-6-extension-host-tests/test/host/helpers.ts`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-6-extension-host-tests/package.json`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-6-extension-host-tests/.vscodeignore`
- `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-6-extension-host-tests/README.md`

## Key decisions
- Characterization tests for existing apply APIs; TDD only for `LivePreview`.
- Did not adopt the preflight data-table suggestion for `apply.test.ts`.

## Next Step
- Spawn QA subagent.
