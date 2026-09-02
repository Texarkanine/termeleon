---
task_id: issue-32-wezterm-duplicates
complexity_level: 1
date: 2026-09-02
status: completed
---

# TASK ARCHIVE: issue-32-wezterm-duplicates

## SUMMARY

Issue #32: Fixed duplicate WezTerm theme discovery caused by nested directory traversal when scanning `~/.config/wezterm/colors` and its parent `~/.config/wezterm`. `discoverWezterm` now tracks visited file paths in a `Set<string>` to ensure each theme file is processed and returned exactly once.

## REQUIREMENTS

- `discoverWezterm` does not return duplicate themes when scanning `~/.config/wezterm` and `colors/`.
- A discovery test in `test/discover.test.ts` asserts that WezTerm themes in `~/.config/wezterm/colors` are returned exactly once.
- All test suites (`npm run test:parsers`, `npm test`, `npm run compile`) pass.

## IMPLEMENTATION

In `src/discover.ts`, updated `discoverWezterm` to maintain a `seen` set (`Set<string>`) of visited file paths. Before parsing and adding each discovered `.toml` file, `discoverWezterm` checks `seen.has(file)` and skips files that have already been visited during the recursive directory walk of `dirs` (`[path.join(base, 'colors'), base, ...extraDirs]`).

Added a reproduction and regression test in `test/discover.test.ts` (`discovers WezTerm themes in ~/.config/wezterm/colors exactly once without duplicates`) using a temporary fixture home with WezTerm themes in `xdg-config/wezterm/colors/`.

## TESTING

Followed TDD:
1. Added failing reproduction test in `test/discover.test.ts` which failed with `expected theme at ... to be discovered exactly once, but found 2` (`2 !== 1`).
2. Implemented visited file path deduplication in `src/discover.ts`.
3. Verified all tests passed:
   - `npm run test:parsers`: 54 parser tests + 6 discovery tests passed.
   - `npm run compile`: typecheck and bundle succeeded with 0 errors.
   - `npm test`: all parser and host extension tests (30 passing) succeeded.
   - `npm run test:coverage`: full coverage maintained.

## LESSONS LEARNED

When directory search paths contain both a subdirectory and its parent directory (such as `~/.config/wezterm/colors` and `~/.config/wezterm`), recursive directory walkers will naturally visit nested files multiple times unless visited file paths are explicitly tracked and deduplicated.

## NEXT STEPS

Open pull request for Issue #32 and merge into main.
