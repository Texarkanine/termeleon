# Project Brief

## User Story

As a VS Code user importing terminal themes, I want "remove applied theme" and live preview cancellation to clean up or restore `terminal.integrated.minimumContrastRatio` so that it doesn't leave stray workspace settings or empty `.vscode/settings.json` behind in repositories that previously had none.

## Use-Case(s)

### Use-Case 1: Cleaning up on Theme Removal
When a theme was imported with `setMinimumContrastRatio` enabled (setting `terminal.integrated.minimumContrastRatio: 1`), running "Remove Imported Terminal Theme" removes both the colorCustomizations and resets/removes `terminal.integrated.minimumContrastRatio` if it was set to 1 at that target, leaving no orphaned settings.

### Use-Case 2: Live Preview Snapshot & Cancel
When browsing themes in the QuickPick with live preview enabled, canceling preview restores the pre-preview state of both `colorCustomizations` and `terminal.integrated.minimumContrastRatio`.

## Requirements

1. When removing applied themes via `removeApplied` (both tracked and fallback mode), if `terminal.integrated.minimumContrastRatio` is set to `1` at the given target, clear/remove it (update to `undefined`) from that target's configuration.
2. In `LivePreview`, snapshot `terminal.integrated.minimumContrastRatio` along with `colorCustomizations` so that `cancel()` restores the original value.
3. If settings become completely empty at the target (e.g. `.vscode/settings.json`), VS Code's configuration update with `undefined` cleans it up properly.

## Constraints

1. Keep the vscode-free core boundary intact (parsers, discovery, palette do not import vscode; apply/extension handles vscode configuration).
2. Existing behavior for color customization removal must be preserved.
3. Do not clobber a user's custom `minimumContrastRatio` if it wasn't set to 1 or was set prior to live preview.

## Acceptance Criteria

1. Host tests verify that applying a theme and then removing it removes `terminal.integrated.minimumContrastRatio` from the targeted config.
2. Host tests verify that canceling a `LivePreview` restores the previous `minimumContrastRatio` value.
3. All parser and host test suites pass.
