# Progress

Make MobaXterm's applied palette count as active for Mirror (and ask when Alacritty is also active), correct the README/STORE pick-vs-mirror matrices, and serve discovery from a warm cache with an activation-time scan instead of blocking every command on a disk walk.

**Complexity:** Level 3

## 2026-09-04 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Classified `mobaxterm-active-and-scan-cache` as Level 3
    - Wrote project brief, active context, and task stub
* Decisions made
    - Level 3 rather than Level 2: MobaXterm path-resolution and scan-cache lifecycle are separate design surfaces, not a single-component fix
    - Level 3 rather than Level 4: no system-wide architectural change; vscode-free core vs vscode-bound shell stays
* Insights
    - The original "0.6.0 from VSX finds nothing" report was a leftover 0.5.0 host; not in scope
    - Mirror already has a multi-candidate picker; the gap is MobaXterm not being marked `active`
    - Prior archive deferred Known Folder / `LastIniPath` resolution for redirected Documents — likely the active-detection miss on this machine

## 2026-09-04 - CREATIVE - COMPLETE (mobaxterm-active-root)

* Work completed
    - Explored Known Folder Documents vs `LastIniPath` vs extraDirectory active-marking
    - Wrote `memory-bank/active/creative/creative-mobaxterm-active-root.md`
* Decisions made
    - Default root is Known Folder Documents (`GetFolderPath('MyDocuments')`, User Shell Folders Personal fallback), injected as `documentsDir` in tests
    - `LastIniPath` is not the primary mechanism; portable/`-i` stay extraDirectories-only
    - Extra-directory theme packs remain inactive
* Insights
    - `%USERPROFILE%\Documents` is not My Documents; installer edition follows `%MyDocuments%\MobaXterm` on whatever volume that Known Folder uses
    - Drive-letter-specific layouts must not be encoded in the product or in SumMem

## 2026-09-04 - CREATIVE - COMPLETE (scan-cache)

* Work completed
    - Explored in-memory vs `globalState` vs per-command refresh vs worker_threads
    - Wrote `memory-bank/active/creative/creative-scan-cache.md`
* Decisions made
    - Process-lifetime `ThemeCache`; activate warms; commands serve or join in-flight; wait only when empty
    - No persistence, no per-command rescan, no worker; invalidate when sources/extraDirectories change
* Insights
    - Wrapping a sync walk in a Promise does not move it off the extension host; that hitch once per window is the accepted tradeoff

## 2026-09-04 - PLAN - COMPLETE

* Work completed
    - Wrote Level 3 implementation plan in `memory-bank/active/tasks.md` (ThemeCache, Known Folder Documents root, extension wiring, matrices, memory-bank pointers)
    - Test plan maps behaviors to `test/scanCache.test.ts` and `test/discover.test.ts`; no new host walk tests
* Decisions made
    - Implementation order: cache (fewest deps) → Documents root → extension wiring → docs → persistent memory-bank
    - `test:parsers` gains a third `tsx` process for ThemeCache
* Insights
    - Mirror multi-candidate UI is already tested; the missing production behavior is MobaXterm `active` plus serving the scan from memory

## 2026-09-04 - PLAN - COMPLETE (preflight replan)

* Work completed
    - Addressed FAIL (fixable): `onStartupFinished`; brief matches launch-only rescan; `cacheKey` does not sort `extraDirectories`; Documents lookup lazy + memoized; `src/cache.ts`; unconditional `cacheKey` tests
* Decisions made
    - Did not adopt the mtime-signature advisory; operator asked to rescan on launch, not to cheap-stat on every command
    - ActivationEvents contract test in `test/parsers.test.ts` ci is a user-visible warm-cache lock, not a heading change-detector
* Insights
    - `activationEvents: []` on 1.75+ is command-only activation; a warm cache requires `onStartupFinished`

## 2026-09-04 - PREFLIGHT - COMPLETE (FAIL (fixable))

* Work completed
    - Validated the Level 3 plan against the codebase; wrote `memory-bank/active/.preflight-status` (first line `FAIL (fixable)`)
    - TDD Plan Encoding passed: all three executable units order test steps before production steps; no change-detectors scheduled, so no in-phase edits to `tasks.md`
    - Three high findings and one medium finding, all with known fixes; six items verified as non-issues so build does not re-litigate them
* Decisions made
    - Did not modify the plan: every issue is a planner decision (activation manifest, brief-vs-creative reconciliation, cache-key semantics), not a mechanical swap or strike
    - Recorded the cache-key contradiction as "creative is right, test plan is wrong" rather than leaving the choice open
* Insights
    - `activationEvents: []` with implicit `onCommand` means the extension wakes on the first command, so the planned warm cache is cold exactly when it matters; `onStartupFinished` is missing from every unit
    - The brief's "refresh in the background" (R4, UC4, AC4) is the option the scan-cache creative explicitly eliminated; the artifacts disagree and QA has no tiebreaker
    - `extraDirectories` order is load-bearing in discovery (Alacritty last-import-wins, `seen`-set first-walk-wins), so sorting it into the cache key would fuse two genuinely different result sets
    - `windowsDocumentsDir()` placed in `discoverThemes` spawns PowerShell synchronously on every scan, including scans that exclude MobaXterm

## 2026-09-04 - PREFLIGHT - COMPLETE (FAIL (fixable), re-run)

* Work completed
    - Re-validated the amended Level 3 plan against the codebase; overwrote `memory-bank/active/.preflight-status` (first line `FAIL (fixable)`)
    - Confirmed all four HIGH and both LOW findings from the prior run are resolved as claimed (`onStartupFinished`, brief no longer promises background refresh, `cacheKey` sorts `sources` only, lazy/memoized Documents lookup, `src/cache.ts`, unconditional `cacheKey` tests)
    - Found one new TDD Plan Encoding defect introduced by the fix itself: unit 3's step 2 lists the finished `activationEvents` value instead of a bare stub, so step 3 could never actually go red
* Decisions made
    - Did not modify `tasks.md`: the fix (drop one bullet from step 2) is a planner decision, not a mechanical swap or change-detector strike
    - Recorded the scan-cache creative doc's stale `src/scanCache.ts` naming as a low, non-blocking finding since `tasks.md` is internally consistent and governs the build
* Insights
    - Units 1 and 2's interface-stub steps list bare signatures/fields only and defer behavior to the write-green step; unit 3's step 2 broke that discipline for the one line that mattered most (the exact requirement the previous FAIL was about)
    - A manifest array field has no partial/stub state between empty and finished, so "stubbing" it really means leaving it untouched until the write-green step

## 2026-09-04 - PLAN - COMPLETE (unit 3 stub encoding)

* Work completed
    - Dropped `onStartupFinished` from unit 3 stub-interface; write-green still sets it
    - Updated creative scan-cache file names to `src/cache.ts` / `test/cache.test.ts`
* Decisions made
    - Leave existing empty `activationEvents` until green so the parsers ci case can go red

## 2026-09-04 - PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

* Work completed
    - Re-validated the amended Level 3 plan and overwrote `memory-bank/active/.preflight-status` with `PASS WITH ADVISORY`
    - Confirmed every executable unit follows stub tests → stub interface → red run → green implementation; unit 3 now leaves `activationEvents` untouched until its green step
    - Verified the planned cache naming, Known Folder scope, configuration touchpoints, and existing Mirror picker against the codebase
* Decisions made
    - No task-plan edits were needed; the plan is ready for Build
* Insights
    - A root-mtime freshness signature could refresh cache entries for directory additions or removals without a full per-command walk, but remains out of scope and advisory

## 2026-09-04 - HANDOFF - mermaid + baton

* Work completed
    - Sequence diagrams no longer use participant `Activate` or parenthesized messages (Cursor Mermaid lex errors)
    - `/handoff` after `/nk-save`

## 2026-09-04 - BUILD - IN-PROGRESS

* Work completed
    - Left Preflight (`PASS WITH ADVISORY`) and started Build
* Decisions made
    - Follow the plan order: ThemeCache, then Known Folder Documents, then extension wiring, then docs, then memory-bank pointers
* Insights
    - Advisory mtime-signature freshness remains out of scope

## 2026-09-04 - BUILD - COMPLETE

* Work completed
    - ThemeCache in `src/cache.ts` with `test/cache.test.ts` wired into `test:parsers`
    - Known Folder Documents as a MobaXterm default root (`documentsDir` / `windowsDocumentsDir`)
    - `collect`/`activate` serve the cache; `onStartupFinished`; config-change `load`
    - README/STORE pick-vs-mirror matrices and legends; memory-bank pointers
* Decisions made
    - None beyond the plan; lookup memo stores `undefined` so a failed win32 lookup is not retried every scan
* Insights
    - Coincidence (Known Folder == USERPROFILE Documents) was already one origin via `seen`; root `path.resolve` dedupe still matches the plan
