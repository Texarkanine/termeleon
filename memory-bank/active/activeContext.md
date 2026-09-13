# Active Context

## Current Task: terminal-selection-visibility
**Phase:** QA - COMPLETE (PASS)

## What Was Done
- Split Settings into Picker Behavior and Color Preferences when Applying New Themes.
- Replaced `fillMissingSelection` / `includeSelectionForeground` with `overrideMissingSelectionHighlight` (default on) and `overrideIncludedSelectionForeground` (default off, inverted: off honors authored fg).
- Highlight override still writes selectionBackground + inactiveSelectionBackground only.

## Next Step
- QA passed. Proceed to `/niko-reflect`.

## Files modified
- `/home/mobaxterm/git/termeleon/src/palette.ts`
- `/home/mobaxterm/git/termeleon/src/apply.ts`
- `/home/mobaxterm/git/termeleon/src/extension.ts`
- `/home/mobaxterm/git/termeleon/package.json`
- `/home/mobaxterm/git/termeleon/test/parsers.test.ts`
- `/home/mobaxterm/git/termeleon/test/host/apply.test.ts`
- `/home/mobaxterm/git/termeleon/test/host/preview.test.ts`
- `/home/mobaxterm/git/termeleon/README.md`
- `/home/mobaxterm/git/termeleon/STORE.md`

## Decisions
- Mapping-layer default writes authored selectionForeground unless the fg override is on.
- Host `workspaceOpts` still defaults both overrides to false so isolation tests stay explicit.
- Preview isolation reapply with fg override on asserts the committed background and omitted fg (not the previewed palette).

## Deviations
- None — built to plan. Host tests needed a writable `XDG_RUNTIME_DIR` plus `dbus-launch` on this WSL box (same as the first build).
