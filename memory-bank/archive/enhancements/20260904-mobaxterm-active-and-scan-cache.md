---
task_id: mobaxterm-active-and-scan-cache
complexity_level: 3
date: 2026-09-04
status: completed
---

# TASK ARCHIVE: MobaXterm Active Root and Scan Cache

## SUMMARY

MobaXterm's applied `[Colors]` is now marked `active` when the installer-edition INI lives under Known Folder Documents, even when that folder is not `%USERPROFILE%\Documents`. Mirror already had a multi-candidate picker; that flag is what made it ask Alacritty vs MobaXterm. Import/Mirror serve a process-lifetime `ThemeCache` warmed on `onStartupFinished`. README/STORE OS matrices use `✅` for pick-and-mirror and `📝` for pick-only. Operator confirmed on a packaged VSIX: Mirror asked, and the picker no longer sat loading. PR: https://github.com/Texarkanine/termeleon/pull/50

## REQUIREMENTS

- Mark MobaXterm's applied palette `active` when it is discoverable, so Mirror includes it among candidates.
- When more than one emulator is active, use the existing multi-candidate picker rather than silently choosing one.
- OS matrices in README and STORE: `✅` only where pick and mirror both work; `📝` for pick-but-not-mirror; legend for symbols actually used.
- Cache discovered themes in process memory. Commands serve the cache; wait only when empty; do not walk the disk on every command. Rescan when the window loads and when `sources` or `extraDirectories` change.
- Start the first scan when the extension/window loads (`onStartupFinished`).
- Discovery stays vscode-free. `extensionKind` stays `["ui"]`. Extra-directory theme packs and nested INIs stay inactive. Portable / `-i` stay extraDirectories-only. Local WSL gate is `test:parsers` + `compile`.

## IMPLEMENTATION

### ThemeCache (`src/cache.ts`, `test/cache.test.ts`)

Process-lifetime memo of `DiscoveredTheme[]`. `cacheKey` sorts `sources` only and serializes `extraDirectories` as configured (walk order is load-bearing). `load(key, scan)` defers `scan` with `setTimeout(0)` so the promise returns before the walk; same key coalesces in-flight; a new key drops the old result; a thrown scan clears so a later `load` retries. `peek` is undefined until the first load for that key completes. `test:parsers` runs `tsx test/cache.test.ts` as a third process.

### Known Folder Documents (`src/discover.ts`, `test/discover.test.ts`)

`DiscoverOptions.documentsDir` is injected by tests. Production fills it inside the `run('mobaxterm', …)` closure via `opts.documentsDir ?? windowsDocumentsDir()`, so Ghostty-only scans do not spawn. On win32, `windowsDocumentsDir()` tries PowerShell `GetFolderPath('MyDocuments')`, then `reg query` User Shell Folders `Personal` with `%VAR%` expansion, then undefined (existing USERPROFILE Documents still runs). Result is memoized for the process, including `undefined`. `discoverMobaXterm` prepends `join(documentsDir, 'MobaXterm')` and `path.resolve`-dedupes default roots. Active rule unchanged: first usable root `MobaXterm.ini` in a default root.

Stdout parsers (`parseGetFolderPathOutput`, `parseUserShellFoldersPersonal`, `expandWindowsEnv`) are the Linux-CI contract. Parser fixtures use a generic profile name, not a machine-local one.

### Extension shell (`src/extension.ts`, `package.json`)

Module-level `ThemeCache`. `collect` uses `cacheKey` + `peek`/`load`; `withProgress` only when `peek` is empty. `activate` registers commands, then kicks `load`, then listens for `termeleon.sources` / `termeleon.extraDirectories`. `activationEvents` includes `onStartupFinished` (implicit `onCommand` remains on 1.75+).

### Docs

README and STORE OS tables: `✅` pick-and-mirror, `📝` WezTerm (Linux/macOS) and iTerm2 (macOS), legend under each table. After operator review, STORE dropped its duplicate formats table; README **Formats read** is the catalog (MobaXterm cell names applied `[Colors]` in `MobaXterm.ini` under Known Folder Documents). Persistent `systemPatterns.md` / `techContext.md` updated in Build.

## Creative decisions (inlined)

### MobaXterm active root

Options: (A) Known Folder Documents as a default root; (B) `LastIniPath` registry; (C) mark extraDirectory `MobaXterm.ini` active; (D) hardcode a `C:\Users` layout. Selected A. B would quietly close the documented `-i` gap and hangs on an undocumented key. C reverses the extraDirs-are-theme-packs invariant. D fails when Documents is on another volume. Tradeoff: portable / `-i` still need `extraDirectories`.

### Scan cache

Options: (A) process-lifetime memory, warm on activate; (B) persist in `globalState`; (C) rescan on every command in the background; (D) `worker_threads`. Selected A. B can Mirror a deleted file. C keeps walking for as long as the user opens the picker. D is a second bundle for "don't walk twice." Wrapping a sync walk in a Promise does not move it off the extension host; one same-thread walk per window is the accepted hitch. Preflight advisory (root-mtime freshness signature) stayed out of scope. Operator later asked start vs first-use vs a setting: keep start, no setting — first-use is the old picker wait; a setting only chooses which hitch.

## TESTING

- TDD: `test/cache.test.ts` (8), new `test/discover.test.ts` cases (redirected `documentsDir`, coincidence, extraDirs inactive, nested inactive, stdout parsers, non-win32 no-op), `activationEvents` contract in `test/parsers.test.ts` ci.
- `npm run test:parsers`: 74 + 32 + 8 = 114. `npm run compile` clean. Host tests not run on WSL (Electron hang); unchanged for CI.
- Niko QA: PASS (first run). Re-ran parsers and compile before judging.
- Operator proof on Windows: packaged VSIX; Mirror asked Alacritty vs MobaXterm; picker no longer sat loading.

## LESSONS LEARNED

- Empty `activationEvents` on VS Code 1.75+ is command-only activation. A warm cache needs `onStartupFinished`.
- `extraDirectories` order is load-bearing (Alacritty last-import-wins, `seen` first-walk-wins). Do not sort it into a cache key.
- `%USERPROFILE%\Documents` is not Known Folder Documents. Installer edition follows My Documents on whatever volume that folder uses.
- A coincidence/dedup test that still passes against the old USERPROFILE-only roots is not a red. Redirected Documents is the gate that `documentsDir` is wired.
- Parser fixtures that copy a real profile name are PII in git history. Use a generic placeholder from the first commit.

## PROCESS IMPROVEMENTS

- Re-run preflight after amending a `FAIL (fixable)`. The first fix here put `onStartupFinished` in the stub step so the contract test could never go red; a second preflight caught that.
- The first `FAIL (fixable)` also caught a brief-vs-creative contradiction (per-command background refresh) and lookup-before-dispatch. Those would have shipped a cold cache, fused distinct extraDir walks, and spawned PowerShell on Ghostty-only scans.

## TECHNICAL IMPROVEMENTS

- A cheap root-mtime freshness signature could refresh cache entries for directory add/remove without a per-command walk. Out of scope; the brief is launch/config rescan.
- The scan is still a sync UI-thread walk. A setting for warm-on-start vs first-use would only move the hitch. Do not add it unless someone reports a startup freeze.

## NEXT STEPS

- Merge PR #50.
- None for Known Folder / `LastIniPath`: portable and `-i` stay extraDirectories-only on purpose.
