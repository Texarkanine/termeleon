---
task_id: issue-5-discover-fixture-tests
complexity_level: 2
date: 2026-08-31
status: completed
---

# TASK ARCHIVE: discover-fixture-tests

## SUMMARY

Issue #5: `discoverThemes` is covered by Node/`tsx` tests against a throwaway `$HOME` / `$XDG_CONFIG_HOME` tree. Discovery reads those env vars at scan time instead of at import. Shipped on `issue-5-discover-fixture-tests` as [PR #16](https://github.com/Texarkanine/vscode-terminal-themes/pull/16) (`Fixes #5` in `15308da`).

## REQUIREMENTS

- Committed tests import and call `discoverThemes` (parsers suite never did).
- Fake `$HOME` / `$XDG_CONFIG_HOME`, not the developer's real config.
- Cover find, Ghostty/kitty active-from-config, skip unusable palettes, missing source dir does not throw.
- Stay Node/`tsx` like `test/parsers.test.ts`. No extension host.

## IMPLEMENTATION

`test/discover.test.ts` uses the same `assert` + `test()` helper as the parser suite. Each case builds a tmp HOME, sets `XDG_CONFIG_HOME` to a directory that is not `~/.config`, points `XDG_DATA_DIRS` at a missing path, and deletes `LOCALAPPDATA`. Assertions match planted `origin` paths so Darwin `/Applications/Ghostty.app` cannot satisfy or break them.

`src/discover.ts` replaced module-scope `home` / `xdgConfig` / `xdgDataDirs` with `homeDir()`, `xdgConfigDir()`, and `xdgDataDirectories()`. Public `discoverThemes` / `DiscoverOptions` unchanged.

`package.json` `test:parsers` is `tsx test/parsers.test.ts && tsx test/discover.test.ts` (two processes). README, `memory-bank/techContext.md`, and `memory-bank/systemPatterns.md` describe that.

PR #16 review (`discussion_r3896632267`): Ghostty now has an inactive control like kitty. The no-config find case asserts `active === false`. The config case plants Broadcast (named) and Other (same palette, not named) and asserts true vs false.

## TESTING

TDD: empty path helpers made find/active/skip red; missing-dir already passed; scan-time reads went green. `npm run test:parsers` — 11 parser + 5 discover. `npm run compile` succeeded. Preflight PASS WITH ADVISORY (filesystem injector out of scope). QA PASS. After the review fix, the same 16 tests still passed.

## LESSONS LEARNED

- `os.homedir()` / XDG captured at module load makes `$HOME` injection a lie after the first import. Scan-time helpers are the testability fix; a public roots API is not required.
- Ghostty on Darwin always walks `/Applications/Ghostty.app` (outside `$HOME`). Discovery tests must assert fixture `origin`s, never list length or a bare theme name.
- Empty interface stubs that return no paths are a useful red: "does not throw on missing dir" can pass while "finds a theme" is still red.
- Kitty already paired `active` true vs false. Ghostty needed the same shape or always-on `active` would stay green.

## PROCESS IMPROVEMENTS

Empty path stubs plus origin-keyed assertions made the planned red/green split hold. Next discovery-test work should copy kitty's true/false pair on day one.

## TECHNICAL IMPROVEMENTS

A filesystem/environment injector would only pay off if these tests needed to run in parallel in one process. Not warranted for this issue.

## NEXT STEPS

None. Merge [PR #16](https://github.com/Texarkanine/vscode-terminal-themes/pull/16) when ready.
