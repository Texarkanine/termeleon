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
