# Progress

Make VS Code integrated-terminal selection visible after Termeleon apply/Mirror, including palettes that omit selection colors, and clarify whether `includeSelectionForeground` actually takes effect.

**Complexity:** Level 2

## 2026-09-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Confirmed intent: diagnose the selection-foreground setting, check dropped theme fields, and make selection pop on failing themes (MobaXterm Mirror) without regressing duskfox/light themes.
    - Classified Level 2: contained enhancement of the Palette → `workbench.colorCustomizations` mapping, plus setting semantics.
* Decisions made
    - Level 2, not Level 1: more than a one-line wiring fix; fallback when a source has no selection color is a product choice inside one subsystem.
    - Invented selection colors are in-scope only when the emulator theme did not specify them.
* Insights
    - MobaXterm parser currently maps ANSI, fg, bg, and cursor only — no selection slots.
    - `includeSelectionForeground` is off by default and only writes `terminal.selectionForeground` when the palette actually has one; toggling the setting without re-apply would look like a no-op.

## 2026-09-13 - PLAN - IN-PROGRESS

* Work completed
    - Operator confirmed toggle-without-reapply is why contrast and selection-foreground settings looked inert.
* Decisions made
    - Mapping settings stay not-live; descriptions must say so.
    - Add an explicit Reapply Last Theme command (last committed apply only).
    - Missing-selection fill is a setting, default on, so it can be turned off.

## 2026-09-13 - PLAN - COMPLETE

* Work completed
    - Wrote Level 2 plan: mapping-hub fill, Xresources highlight keys, last-apply + Reapply command, apply-time setting copy.
    - Test plan covers fill on/off, authored vs synthetic, Reapply, and live-preview not recording last-apply.
* Decisions made
    - Fill overlay: `#ffffff80`/`#ffffff40` on dark backgrounds, `#00000080`/`#00000040` on light (relative luminance of `terminal.background`).
    - Do not invent `selectionForeground` when the palette has none.
    - Persist last Palette in extension state; do not re-read the theme file on Reapply.
* Insights
    - VS Code's default `terminal.selectionBackground` is `editor.selectionBackground`, which is why MobaXterm-on-duskfox-workbench can have no visible terminal selection.

## 2026-09-13 - PREFLIGHT - COMPLETE (FAIL (fixable))

* Work completed
    - Validated the Level 2 plan against the Palette mapping hub, apply shell, command flow, and existing parser and extension-host test suites.
* Decisions made
    - Re-plan before build: make pair replay and live-preview isolation explicit, mandatory host-test coverage.
    - Record an accepted Import in `pickAndApply`, which owns the accepted palette, rather than in `commandImport`.
* Insights
    - `LastApply` must be target-scoped in the matching Memento, so Reapply cannot cross user and workspace settings.

## 2026-09-13 - PLAN - COMPLETE (re-plan after preflight)

* Work completed
    - Made Ghostty pair reapply and live-preview last-apply isolation mandatory host tests.
    - Moved Import last-apply recording to `pickAndApply` after the committed `applyPalette`.
* Decisions made
    - Last-apply stays per-target in the matching Memento (preflight advisory kept).
* Insights
    - `commandImport` never sees the accepted palette; only `pickAndApply` does.

