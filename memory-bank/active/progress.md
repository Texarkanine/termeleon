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

## 2026-09-02 - PREFLIGHT - COMPLETE (FAIL (fixable))

* Work completed
    - Validated the plan against the codebase and against Mobatek's own documentation plus four real-world theme packs.
    - Confirmed format, key spellings, both default roots, `extraDirs` obligation, vscode-free boundary, absence of duplicate listing via the Ghostty null-extension walk, and test-before-code ordering in both executable units.
    - Wrote `memory-bank/active/.preflight-status` with one blocking-fixable finding, five minor findings, and one advisory.
* Decisions made
    - FAIL (fixable): the `Documents` default root must also cover OneDrive Known Folder Move before build; the fix is a second candidate path, one discovery case, and a docs line.
    - Rejected the third-party claim that installed MobaXterm keeps palettes in the registry - `HKCU\Software\Mobatek\MobaXterm` holds credentials, not `[Colors]`. Do not document a registry palette gap.
    - Left the plan otherwise unmodified: no change-detector strike and no TDD step swap were warranted.
* Insights
    - `DefaultColorScheme` coexists with explicit RGB rather than overriding it, so marking a 16-slot `[Colors]` block from a default root `active` is sound.
    - MobaXterm's palette representation is PuTTY's: same `r,g,b` decimal triples in the same INI shape, which makes a shared byte-triple helper plus a tiny INI section reader an on-ramp to the whole PuTTY family.

## 2026-09-02 - PLAN - COMPLETE

* Work completed
    - Replanned after preflight FAIL (fixable): OneDrive Documents roots, first-root-wins active flag, `fromByteComponents` in `palette.ts`.
    - Folded minor findings: British `Colour` only, package.json/`SOURCE_LABELS` move to write-code, document `-i` override. Left the shared INI-reader/PuTTY advisory out (YAGNI for this task).
* Decisions made
    - Probe `%OneDrive%\Documents\MobaXterm` and `%USERPROFILE%\OneDrive\Documents\MobaXterm` as well as plain Documents.
    - First usable default-root `MobaXterm.ini` is the only active global so Mirror does not see two copies.
    - Convert byte triples in `palette.ts` next to `fromFloatComponents`; still do not teach `normalizeColor` raw triples.
* Insights
    - `%MyDocuments%` is not `%USERPROFILE%\Documents` on OneDrive-signed-in Windows profiles, which is the default for this task's audience.
