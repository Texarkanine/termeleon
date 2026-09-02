# Progress

Investigate whether MobaXterm palettes can be discovered and parsed from on-disk files the way Termeleon already does for other emulators. If they can, add that source. If they cannot, document the gap.

**Complexity:** Level 2

## 2026-09-02 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Confirmed operator intent: investigate MobaXterm colorization, add support if palettes are on disk, otherwise document the gap.
    - Classified as Level 2 (self-contained emulator-source enhancement or docs-only gap).
    - Wrote ephemeral memory-bank files for this task.
* Decisions made
    - Level 2: not a bug; not a multi-component feature; does not change the `Palette` hub or apply path.
* Insights
    - Closest prior work is the 2026-09-02 built-in themes investigation: implement where files exist, document where they do not.

## 2026-09-02 - PLAN - COMPLETE

* Work completed
    - Confirmed MobaXterm `[Colors]` INI is parseable (`r,g,b` named slots; `.mxtcolors` import files; `MobaXterm.ini` at Documents and AppData).
    - Wrote TDD plan: parser, discovery (default Windows roots + extraDirs), docs for remaining gaps.
* Decisions made
    - Implement support; do not vendor compiled dropdown schemes; do not parse `.mxtsessions`.
    - Convert RGB triples in the MobaXterm parser; do not teach `normalizeColor` a new spelling.
    - Walkable format: extraDirs required. Default roots stay the two Windows config directories.
* Insights
    - Theme packs already ship the format (Catppuccin `.mxtcolors`, iTerm2-Color-Schemes `mobaxterm/*.ini`).
    - `DefaultColorScheme=N` without RGB is the same class of gap as Windows Terminal packaged `defaults.json`.
