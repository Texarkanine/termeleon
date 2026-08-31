# Project Brief

## User Story

As a VS Code user importing terminal themes, I want the import Quick Pick to not show misleading gray block swatches and I want an integrated terminal to be visible when the picker opens so that I have a clean item list and immediate visual feedback during live preview.

## Use-Case(s)

### Use-Case 1: Browsing themes in Quick Pick
When opening the theme import picker or mirror picker, the detail line for each theme displays its origin path cleanly without confusing uncolored `████████` blocks that look like a broken preview.

### Use-Case 2: Live preview with terminal panel closed
When opening the theme import picker while the integrated terminal is closed or hidden, a terminal is revealed so the arrow-key live preview immediately reflects on an active terminal in the window.

## Requirements

1. Remove `swatch()` and the gray `█` block characters from Quick Pick item details in `src/extension.ts` (both theme import and mirror candidates).
2. Detail line should display the theme origin path (or pair origin paths for mirror candidate pairs) cleanly.
3. When the import picker opens, reveal a terminal if none is visible so live preview has somewhere to show up.

## Constraints

1. Do not fake color swatches if the VS Code Quick Pick API does not support per-cell/per-glyph color.
2. Do not treat theme files as "supports light/dark" (that remains a Ghostty mirror concern).
3. AGPL-3.0-or-later license, VS Code 1.75+ compatibility.

## Acceptance Criteria

1. QuickPick item detail strings contain origin file paths and no swatch block characters.
2. Import command reveals an integrated terminal when executed.
3. All parser, discovery, CI contract, and extension host tests pass.
