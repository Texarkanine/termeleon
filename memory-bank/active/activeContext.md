# Active Context

## Current Task: terminal-selection-visibility
**Phase:** BUILD - COMPLETE

## What Was Done
- Fill missing selection in `toColorCustomizations` via `fillMissingSelection` (default on at the setting, off at the mapping-function default).
- Xresources `highlightColor` / `highlightBackground` / `highlightTextColor` map to selection slots.
- `Termeleon: Reapply Last Theme` replays the last committed Import/Mirror; live preview does not record.
- Mapping-setting descriptions and README/STORE say toggles are not live.
- Host preview tests wait `PREVIEW_DEBOUNCE_MS + 400` so VS Code 1.137 config writes finish.

## Files modified
- `/home/mobaxterm/git/termeleon/src/palette.ts`
- `/home/mobaxterm/git/termeleon/src/apply.ts`
- `/home/mobaxterm/git/termeleon/src/extension.ts`
- `/home/mobaxterm/git/termeleon/src/parsers/kitty.ts`
- `/home/mobaxterm/git/termeleon/package.json`
- `/home/mobaxterm/git/termeleon/README.md`
- `/home/mobaxterm/git/termeleon/STORE.md`
- `/home/mobaxterm/git/termeleon/test/parsers.test.ts`
- `/home/mobaxterm/git/termeleon/test/host/apply.test.ts`
- `/home/mobaxterm/git/termeleon/test/host/preview.test.ts`
- `/home/mobaxterm/git/termeleon/test/host/picker.test.ts`

## Deviations
- Lengthened live-preview host-test delays. Not a product change; VS Code 1.137 config updates were slower than the old 50–100ms slack.

## Next Step
- QA review.
