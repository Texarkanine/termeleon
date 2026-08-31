# Task: discover-fixture-tests

* Task ID: issue-5-discover-fixture-tests
* Complexity: Level 2
* Type: simple enhancement

Committed Node/`tsx` tests drive `discoverThemes` against a fake `$HOME` / `$XDG_CONFIG_HOME` tree. Cover finding a theme, Ghostty/kitty active flags, skipping unusable palettes, and not throwing when a source directory is missing ([issue #5](https://github.com/Texarkanine/vscode-terminal-themes/issues/5)).

## Test Plan (TDD)

### Behaviors to Verify

- **Find a theme**: given `$XDG_CONFIG_HOME/ghostty/themes/` containing a usable Ghostty theme file (copy of `test/fixtures/Broadcast`) → `discoverThemes({ sources: ['ghostty'] })` returns an entry whose `origin` is under the fixture tree, `source` is `ghostty`, and `isUsable(palette)` is true.
- **Ghostty active from config**: given that theme plus `$XDG_CONFIG_HOME/ghostty/config` containing `theme = Broadcast` → the fixture-tree Broadcast entry has `active: true`.
- **Kitty active from config**: given `$XDG_CONFIG_HOME/kitty/themes/tomorrow-night.conf` (copy of `test/fixtures/tomorrow-night.conf`) and `$XDG_CONFIG_HOME/kitty/current-theme.conf` (same usable palette) → the `current-theme.conf` entry has `active: true` and the themes-dir entry has `active: false`.
- **Skip unusable palettes**: given a Ghostty theme file under the fixture themes dir with fewer than 16 ANSI slots → no returned entry has that file as `origin`.
- **Missing source dir does not throw**: given a fixture tree with no `wezterm` directory → `discoverThemes({ sources: ['wezterm'] })` returns `[]` and does not throw.
- **Edge — env isolation**: assertions on Ghostty results filter to `origin` under the fixture `$HOME` (or `$XDG_CONFIG_HOME`), so a real `/Applications/Ghostty.app` theme pack on the developer machine cannot satisfy or break the cases above.
- **Edge — restore env**: after each test, `HOME`, `XDG_CONFIG_HOME`, `XDG_DATA_DIRS`, and `LOCALAPPDATA` are restored so later cases in the same file see a known env.

### Test Infrastructure

- Framework: Node `assert` plus the small `test()` helper already used in `test/parsers.test.ts`; runner is `tsx` (no extension host).
- Test location: `test/`
- Conventions: `test('<behavior>', () => { ... })`; fixtures under `test/fixtures/`; `console.log` section headers; `process.exitCode = 1` on failure; no extra test library.
- New test files: `test/discover.test.ts`

## Implementation Plan

### 1. Fixture-home discover tests — executable ✅

- Files: `test/discover.test.ts`, `package.json`, `src/discover.ts`

1. Stub tests: create `test/discover.test.ts` with the same `test()` helper as `test/parsers.test.ts` and empty cases named for the five issue behaviors (find; Ghostty active; kitty active; skip unusable; missing dir does not throw). Do not assert yet.
2. Stub interface: in `src/discover.ts`, replace the module-scope `home` / `xdgConfig` / `xdgDataDirs` constants with functions of the same meaning (`homeDir()`, `xdgConfigDir()`, `xdgDataDirectories()`) whose bodies are empty (`return ''` / `return []`) so existing call sites compile but scans see no real machine paths. Do not yet implement scan-time `os.homedir()` / env reads.
3. Write tests and run red: implement the cases in `test/discover.test.ts`:
    - Each case builds a unique tmp root (`fs.mkdtempSync`), sets `process.env.HOME` to that root, `process.env.XDG_CONFIG_HOME` to a directory *under* that root that is not `.config` (so the test actually exercises `$XDG_CONFIG_HOME` rather than the default `~/.config` join), `process.env.XDG_DATA_DIRS` to a non-existent path under the tmp root (so default `/usr/share` ghostty themes cannot leak in), and deletes `LOCALAPPDATA`.
    - Populate only the files that case needs by copying `test/fixtures/Broadcast` and/or `test/fixtures/tomorrow-night.conf`, or by writing a short incomplete Ghostty theme (a few `palette = N=` lines, not 16).
    - Call `discoverThemes` with a tight `sources` list. Assert with `origin` prefixed by the fixture XDG or HOME path, not by result list length.
    - `try/finally`: restore previous env values and `fs.rmSync` the tmp root.
    - Run `tsx test/discover.test.ts`. Expect red: empty path helpers yield no themes (find/active cases fail); unusable/missing-dir cases may already pass. Do not write real path resolution yet.
4. Write code and run green:
    - Implement `homeDir()` as `os.homedir()`, `xdgConfigDir()` as `process.env.XDG_CONFIG_HOME || path.join(homeDir(), '.config')`, `xdgDataDirectories()` as today's `XDG_DATA_DIRS` split. Keep every discoverer using those functions; do not reintroduce module-scope snapshots. Public `discoverThemes` / `DiscoverOptions` stay unchanged.
    - Set `package.json` `scripts.test:parsers` to `tsx test/parsers.test.ts && tsx test/discover.test.ts` so the documented Node/`tsx` command runs both files in **separate** processes.
    - Run `tsx test/discover.test.ts` then `npm run test:parsers`. All new cases and the existing parser suite must pass.

### 2. Testing docs — prose/policy ✅

- Files: `memory-bank/techContext.md`, `memory-bank/systemPatterns.md`, `README.md`
- No tests: prose/policy artifact

1. `techContext.md`: the Node/`tsx` suite now includes `test/discover.test.ts` against a fixture HOME/XDG tree; still no `vscode`, still no coverage of `apply.ts` / `extension.ts`.
2. `systemPatterns.md`: vscode-free core tests include discovery, not only parsers.
3. `README.md` Development section: one clause that `test:parsers` also runs discovery tests against a fake HOME/XDG tree.

## Technology Validation

No new technology - validation not required. Same `assert` + `tsx` stack. `fs.mkdtempSync` is Node stdlib.

## Dependencies

- Existing `test/fixtures/Broadcast` and `test/fixtures/tomorrow-night.conf` as the usable palettes planted in the fake tree.
- `os.homedir()` honors `$HOME` on POSIX (this worktree's host and typical CI). Windows `USERPROFILE` is out of scope unless a runner is added later.
- `discoverThemes({ sources })` to keep each case on one emulator.

## Challenges & Mitigations

- **Module-load path snapshot**: `src/discover.ts` currently assigns `home` / `xdgConfig` / `xdgDataDirs` at import. Mitigation: unit 1 steps 2–4 move those reads to call time so per-test env mutation works with a top-level `import`.
- **Real Ghostty app-bundle themes on Darwin**: `ghosttyDirs()` always appends `/Applications/Ghostty.app/Contents/Resources/ghostty/themes`, which does not live under `$HOME`. Mitigation: never assert on the full result list; match `origin` under the fixture XDG/HOME. Set `XDG_DATA_DIRS` to a missing fixture path so Linux `/usr/share/ghostty` cannot leak in.
- **False green before path helpers are implemented**: find/active tests must require a fixture-path `origin`, not merely `some(t => t.name === 'Broadcast')` which a developer Ghostty install could satisfy.
- **Env leak across cases**: `try/finally` restore; `test:parsers` runs the two files as separate `tsx` processes so parser tests never inherit discover env.
- **Worktree `node_modules`**: this git worktree may not have dependencies installed. Mitigation: `npm install` in this worktree before the red/green runs.

## Pre-Mortem

- **Tests keyed off theme name and passed because the laptop already has Ghostty Broadcast**: already covered by the origin-prefix assertions and the false-green challenge.
- **Path helpers implemented but Darwin `Library/Application Support` or `~/Applications/Ghostty.app` still close over a module-scope `home`**: unit 1 step 4 says every discoverer uses the functions; grep `src/discover.ts` for leftover `const home` / `xdgConfig` / `xdgDataDirs` before calling green.
- **One `tsx` invocation loading both test files** so a static import of `discover.ts` captures the real home before discover tests set env: already covered — two process invocations in `test:parsers`.
- **Scope creep into extraDirs / Windows Terminal / iTerm2**: issue #5 lists four behaviors only; do not add those cases in this task.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [x] QA (PASS)
