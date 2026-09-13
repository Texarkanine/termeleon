# Active Context

## Current Task: terminal-selection-visibility
**Phase:** PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

## What Was Done
- Planned rework: Settings categories (Picker Behavior / Color Preferences when Applying New Themes), override ids, inverted foreground default.
- Highlight override remains selectionBackground + inactiveSelectionBackground; foreground override is a separate key.
- Preflight confirmed the plan preserves the vscode-free core boundary, covers all affected consumers, and encodes TDD for every executable unit.

## Next Step
- Build the approved rework plan. Advisory: consider a future settings-to-ApplyOptions adapter to localize default-value mapping.
