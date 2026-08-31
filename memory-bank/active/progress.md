# Progress

Add Node/`tsx` tests that drive `discoverThemes` against a fixture `$HOME` / `$XDG_CONFIG_HOME` tree, covering find, Ghostty/kitty active flags, unusable palettes, and missing source dirs ([issue #5](https://github.com/Texarkanine/vscode-terminal-themes/issues/5)).

**Complexity:** Level 2

## 2026-08-31 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Ingested issue #5 and confirmed `test/parsers.test.ts` does not import `discover.ts`.
    - Classified as Level 2: self-contained test enhancement of one subsystem.
* Decisions made
    - Intent clarification wait skipped: operator already approved the issue as this worktree's task.
    - Not Level 1: this is new coverage, not a bug fix. Not Level 3: no multi-component feature or architecture work.
* Insights
    - `src/discover.ts` currently captures `home` / `xdgConfig` / `xdgDataDirs` at module load; fixture-home tests must set env before first import or discovery must read those values at scan time.

## 2026-08-31 - PLAN - COMPLETE

* Work completed
    - Wrote Level 2 TDD plan: five issue behaviors plus origin-prefix and env-restore edges; `test/discover.test.ts`; scan-time path helpers; docs touch-up.
* Decisions made
    - Fake XDG dir is not `~/.config`, so tests fail if `$XDG_CONFIG_HOME` is ignored.
    - `test:parsers` stays the Node/`tsx` entry and runs parsers then discover in two processes.
    - Do not add extraDirs / Windows Terminal / iTerm2 cases; issue #5 does not ask for them.
* Insights
    - `/Applications/Ghostty.app` theme files are outside `$HOME` on Darwin; length assertions on `discoverThemes({ sources: ['ghostty'] })` would be machine-dependent.
