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
