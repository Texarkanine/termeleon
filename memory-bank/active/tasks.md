# Task: mobaxterm-active-and-scan-cache

* Task ID: mobaxterm-active-and-scan-cache
* Complexity: Level 3
* Type: feature

Make MobaXterm's applied palette count as active for Mirror (and ask when Alacritty is also active), correct the README/STORE pick-vs-mirror matrices, and serve discovery from a warm cache with an activation-time scan.

## Pinned Info

### Command vs scan

Commands must not start a new walk when this window already scanned the same `sources` + `extraDirectories`. Activate starts the first walk after command registration returns.

```mermaid
sequenceDiagram
    participant Win
    participant Store
    participant Disk
    participant UI as ImportMirror

    Win->>Store: start scan
    Store->>Disk: walk themes
    Disk-->>Store: theme list
    UI->>Store: same key
    Store-->>UI: cached list
```

## Component Analysis

### Affected Components
- **MobaXterm discovery** (`src/discover.ts` `discoverMobaXterm`): currently scans `%USERPROFILE%\Documents\MobaXterm`, OneDrive variants, and `%APPDATA%\MobaXterm`; marks only the first usable root `MobaXterm.ini` in those default roots as `active`. Extra directories are listed but never active. Needs Known Folder Documents as a default root.
- **Discovery entry** (`discoverThemes`, `DiscoverOptions`): vscode-free scan API. Gains optional `documentsDir` (tests and override). Known Folder lookup runs only on the MobaXterm path and is memoized for the process.
- **ThemeCache** (new `src/cache.ts`): vscode-free memo of `DiscoveredTheme[]` by config key. Does not import `vscode` or call `discoverThemes` internally.
- **Extension shell** (`src/extension.ts`, `package.json`): `collect()` uses the cache; `activationEvents` includes `onStartupFinished` so `activate()` warms the cache after startup (contributed commands still auto-activate on 1.75+). Configuration listener reloads on sources/extraDirectories change. Progress UI only when `peek` is empty.
- **Mirror UX** (`commandMirror`, `mirrorCandidates`, `pickMirrorCandidate`): already asks when `candidates.length > 1`. No new picker.
- **Docs** (`README.md`, `STORE.md`): OS matrices and legends; MobaXterm files column names Known Folder Documents.

### Cross-Module Dependencies
- `activate` / `collect` → `ThemeCache.load` → `discoverThemes` → `discoverMobaXterm` → `parseMobaXterm`
- `commandMirror` → `collect` → filter `active` → `mirrorCandidates` → optional `pickMirrorCandidate` → apply
- Cache key is `sources` + `extraDirectories` from settings; `documentsDir` is resolved inside discovery, not part of the user-facing key

### Boundary Changes
- `DiscoverOptions.documentsDir?: string`
- New `ThemeCache` API (`load`, `peek`, `cacheKey`)
- `collect` / `activate` lifecycle
- `package.json` `activationEvents` includes `onStartupFinished`
- README/STORE matrix symbols

### Invariants & Constraints
- Discovery must remain vscode-free (`test:parsers` stays host-free)
- `extensionKind` stays `["ui"]`
- Extra directories remain extra theme dirs: theme-pack `.ini` / `.mxtcolors` must not become active
- Nested `MobaXterm.ini` under a default root must not become active
- `.mxtsessions` and dropdown indexes stay unscanned
- Portable / `-i` stay extraDirectories-only
- Cache is process-lifetime only; a window reload is a new scan
- Local WSL gate is `test:parsers` + `compile`; host tests still ship for CI
- No drive-letter-specific paths in product code, docs, or SumMem

## Open Questions

- [x] **How to mark MobaXterm's applied INI as active when Documents is not `%USERPROFILE%\Documents`** → Resolved: Known Folder Documents as a default root; `documentsDir` injection for tests; `LastIniPath` not primary; extraDirs stay inactive. (see `memory-bank/active/creative/creative-mobaxterm-active-root.md`)
- [x] **Where the scan cache lives and when it refreshes** → Resolved: in-memory `ThemeCache`; `onStartupFinished` warms; commands serve or join; no `globalState`; no per-command rescan; invalidate on sources/extraDirectories change. Brief amended to match (preflight finding 2). (see `memory-bank/active/creative/creative-scan-cache.md`)

### Preflight amendments (2026-09-04)

Addressed `FAIL (fixable)`: `onStartupFinished`; brief no longer promises per-command background refresh; `cacheKey` sorts `sources` only; Documents lookup is lazy + memoized; `cacheKey` tests are unconditional; module is `src/cache.ts`.

## Test Plan (TDD)

### Behaviors to Verify

- Redirected Documents: `discoverThemes({ sources: ['mobaxterm'], documentsDir })` with USERPROFILE Documents absent → the INI under `documentsDir/MobaXterm/MobaXterm.ini` is present and `active`.
- Coincidence: `documentsDir` resolves to the same directory as USERPROFILE Documents → one origin (dedup), still `active`.
- Fallback: no `documentsDir` on a fixture that only has USERPROFILE Documents → existing active behavior unchanged.
- Extra dirs: `.mxtcolors` / extra `.ini` stay `active: false` when `documentsDir` is also set.
- Nested `MobaXterm.ini` under `documentsDir/MobaXterm/backup` is not active.
- `parseGetFolderPathOutput`: trimmed single path accepted; empty/whitespace rejected.
- `parseUserShellFoldersPersonal`: reads `Personal` REG_SZ / REG_EXPAND_SZ from `reg query` stdout; `expandWindowsEnv` expands `%USERPROFILE%`.
- `ThemeCache.load`: first call invokes `scan` once and returns its list.
- `ThemeCache.load`: second call with the same key does not invoke `scan`.
- Concurrent `load` with the same key coalesces to one `scan`.
- `load` with a different key invokes `scan` again and `peek` of the old key is empty.
- `peek` is undefined until the first `load` completes.
- Failed `scan` rejects; a later `load` with the same key retries.
- `windowsDocumentsDir` on non-win32 returns `undefined` without spawning.
- `cacheKey`: equal `sources` in different order share a key (sources sorted); equal `extraDirectories` in different order do **not** share a key.
- `package.json` `activationEvents` includes `onStartupFinished` (user-visible warm-cache contract; implicit `onCommand` remains on 1.75+).

### Edge Cases

- OneDrive / APPDATA roots still work and still lose active to an earlier usable Documents root (Known Folder Documents, when present, is earlier than those).
- `collect` with warm cache must not wrap work in a progress notification that implies a scan (assert via `peek` + `load` contract; host automation of QuickPick is out of scope).

### Test Infrastructure

- Framework: Node `assert` + `tsx` (`test:parsers`); Mocha TDD host tests under `test/host/`
- Test location: `test/discover.test.ts`, new `test/cache.test.ts`; stdout parsers in `test/discover.test.ts`; activationEvents contract in the existing `ci` section of `test/parsers.test.ts`
- Conventions: `test('name', fn)` with `withFixtureHome`; no mocha in parser suite
- New test files: `test/cache.test.ts`
- `package.json` `test:parsers` gains `&& tsx test/cache.test.ts` (ci contract checks `test:coverage` runs `test:parsers`, not the file list)

### Integration Tests

- Discovery + documentsDir + extraDirs in one `discoverThemes` call (existing mobaxterm extraDirs tests plus redirected Documents).
- Mirror multi-candidate picker already covered in `test/host/picker.test.ts`; no new host test required for "asks when both active" once MobaXterm is `active`.
- Extension wiring (`activate` → `load`, `collect` → `load`) is thin; do not add a change-detector host test that only asserts `activate` was called.

## Implementation Plan

### 1. ThemeCache — executable

- Files: `src/cache.ts`, `test/cache.test.ts`, `package.json` (`test:parsers`)
- Creative ref: `memory-bank/active/creative/creative-scan-cache.md`

1. [x] Stub tests: `test/cache.test.ts` cases for first load, second load, coalescing, key change, peek, retry after throw, `cacheKey` sources-order vs extraDirectories-order.
2. [x] Stub interface: `cacheKey(sources, extraDirs)`; `ThemeCache` with `peek(key)` and `load(key, scan)`.
3. [x] Write tests and run red: `npx tsx test/cache.test.ts`
4. [x] Write code and run green: implement `cacheKey` (sort `sources` only; serialize `extraDirectories` as configured); in-memory memo; `setTimeout(0)` so `load` returns a promise before `scan` runs; share in-flight; clear on key change and on failure.

### 2. Known Folder Documents root — executable

- Files: `src/discover.ts`, `test/discover.test.ts`
- Creative ref: `memory-bank/active/creative/creative-mobaxterm-active-root.md`

1. [x] Stub tests: redirected `documentsDir` active; coincidence dedup; extraDirs still inactive; nested still inactive; stdout parsers; non-win32 lookup is a no-op.
2. [x] Stub interface: `DiscoverOptions.documentsDir`; `parseGetFolderPathOutput`; `parseUserShellFoldersPersonal`; `expandWindowsEnv`; `windowsDocumentsDir`.
3. [x] Write tests and run red: `npx tsx test/discover.test.ts` (new cases only while iterating; full file before moving on).
4. [x] Write code and run green: call `opts.documentsDir ?? windowsDocumentsDir()` **inside** the `run('mobaxterm', …)` closure, not before source dispatch; memoize `windowsDocumentsDir()` for the process; `discoverMobaXterm` prepends `join(documentsDir, 'MobaXterm')` to default roots and `path.resolve`-dedupes; win32 lookup is PowerShell GetFolderPath then `reg query` User Shell Folders Personal then undefined.

### 3. Extension collect / activate — executable

- Files: `src/extension.ts`, `package.json`, `test/parsers.test.ts` (ci contract)
- Creative ref: `memory-bank/active/creative/creative-scan-cache.md`

1. [x] Stub tests: `test/parsers.test.ts` ci case that `activationEvents` includes `onStartupFinished` (warm-cache contract; engines are `^1.75.0`, so implicit `onCommand` for contributed commands still applies).
2. [x] Stub interface: `package.json` keeps its existing `activationEvents` key (do not put `onStartupFinished` here); module-level `ThemeCache`; `collect` uses `cacheKey` + `peek`/`load`; `activate` kicks `load` and registers `onDidChangeConfiguration`.
3. [x] Write tests and run red: `npx tsx test/parsers.test.ts` (the new activationEvents case).
4. [x] Write code and run green: set `activationEvents`; `collect` awaits `cache.load`; `withProgress` only when `peek` is empty; activate schedules warm scan; config changes for `termeleon.sources` and `termeleon.extraDirectories` call `load` with the new key.

### 4. Compatibility matrices and format rows — prose/policy

- Files: `README.md`, `STORE.md`
- No tests: prose/policy artifact
- Creative ref: none (operator symbol rules)

1. [x] OS tables: `✅` only where pick and mirror both work; `📝` for WezTerm (Linux/macOS) and iTerm2 (macOS); MobaXterm Windows `✅` after step 2; omit `🪞` unless a cell needs it.
2. [x] Legend under each OS table for symbols actually used (`✅`, `📝`, and `-` if we keep the empty mark).
3. [x] Formats / supported-emulators rows: MobaXterm default location is Known Folder Documents (`My Documents`) plus USERPROFILE fallback, OneDrive, AppData; active = first default-root `MobaXterm.ini`.

### 5. Persistent memory-bank pointers — prose/policy

- Files: `memory-bank/systemPatterns.md`, `memory-bank/techContext.md`
- No tests: prose/policy artifact

1. [x] systemPatterns: MobaXterm default roots include Known Folder Documents; extraDirs still inactive; ThemeCache is vscode-free and process-lifetime, wired from `activate`/`collect`.
2. [x] techContext: `test:parsers` also runs `tsx test/cache.test.ts`.

## Technology Validation

No new technology - validation not required. `child_process.spawnSync` is Node stdlib, win32-only, behind `windowsDocumentsDir`.

## Challenges & Mitigations

- **Electron/ui-kind host blocks PowerShell:** fall back to `reg query` Personal, then existing USERPROFILE Documents. extraDirectories remains the documented escape hatch for portable/`-i`.
- **Linux CI never executes the spawn path:** stdout parsers and `documentsDir` injection are the testable contract; `windowsDocumentsDir` is `undefined` on non-win32.
- **Activate walk still hits the UI thread:** accepted in the cache creative; `setTimeout(0)` only defers past `activate` return. Documents lookup is not on the Ghostty-only path.
- **Empty `activationEvents` would keep the first command cold:** `onStartupFinished` is in unit 3; contributed commands still activate implicitly on 1.75+.
- **WSL `test:host` hangs:** do not run it here; ship host tests unchanged for CI.
- **Cache key mismatch after settings edit:** listen to `termeleon.sources` and `termeleon.extraDirectories` and `load` the new key.

## Pre-Mortem

- **Lookup never runs (documentsDir only set in tests, production forgets `windowsDocumentsDir`):** fill inside the `run('mobaxterm', …)` closure (`opts.documentsDir ?? windowsDocumentsDir()`), not before dispatch and not only in tests — already a step-2 substep.
- **First command of a window still cold-walks because activation is `onCommand` only:** `onStartupFinished` in `package.json`, locked by the parsers ci contract — unit 3.
- **QA grades a per-command background refresh that the creative rejected:** brief Use-Case 4 / Requirement 4 / AC4 amended to launch + config-change rescan only (preflight finding 2).
- **We claim Mirror asks Alacritty vs MobaXterm but only Documents was wrong, and their INI is extraDirectories-only:** already covered by Challenge (portable/`-i` stay extraDirs) and by extraDirs-inactive invariant; do not loosen extraDir active.
- **We persist accidentally "to be nice" and Mirror applies a deleted theme:** already covered by cache creative (no `globalState`).
- **Matrix `✅` on MobaXterm while lookup fails on some PCs:** legend describes implemented capability; Known Folder is the installer contract. Not a reason to keep `✅` if we ship without the lookup wired.

## Status

- [x] Component analysis complete
- [x] Open questions resolved
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [ ] QA
