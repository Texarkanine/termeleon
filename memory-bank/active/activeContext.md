# Active Context

## Current Task: mobaxterm-active-and-scan-cache
**Phase:** QA - COMPLETE (PASS)

## What Was Done
- ThemeCache (`src/cache.ts`): process-lifetime memo; `cacheKey` sorts `sources` only; `setTimeout(0)`; coalesced in-flight; drop on key change or scan failure.
- MobaXterm Known Folder Documents: `documentsDir` injection; win32 lookup is GetFolderPath then User Shell Folders Personal; lookup runs only inside the mobaxterm scan; extraDirs and nested INIs stay inactive.
- `collect`/`activate`: serve or join the cache; progress UI only when `peek` is empty; `onStartupFinished` warms; config changes to `sources` / `extraDirectories` start a new `load`.
- README/STORE matrices: `✅` pick-and-mirror, `📝` WezTerm (Linux/macOS) and iTerm2 (macOS), legend under each OS table; MobaXterm files row names Known Folder Documents.
- systemPatterns / techContext pointers updated.

## Files created or modified
- Created: `src/cache.ts`, `test/cache.test.ts`
- Modified: `src/discover.ts`, `test/discover.test.ts`, `src/extension.ts`, `package.json`, `test/parsers.test.ts`, `README.md`, `STORE.md`, `memory-bank/systemPatterns.md`, `memory-bank/techContext.md`

## Key implementation decisions
- Single-slot cache (one key at a time); late results from a superseded key are not stored.
- `windowsDocumentsDir()` memoizes `{ value }` including `undefined` so a failed lookup is not retried every scan.

## Deviations from Plan
None — built to plan.

## Integration test results
- `npm run test:parsers`: 74 + 32 + 8 passing (17 new: 8 cache, 8 discover, 1 activationEvents).
- `npm run compile`: clean. Host tests not run (WSL Electron hang); unchanged for CI.

## Next Step
- QA passed — proceed to `/niko-reflect`.
