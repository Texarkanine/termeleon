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
