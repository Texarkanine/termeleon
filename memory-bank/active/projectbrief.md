# Project Brief: Issue #33 - Mirror Command Live Preview for Multiple Active Themes

## Objective

When `Termeleon: Mirror Active Terminal Theme` (`commandMirror`) finds multiple active themes across installed terminals, wire the candidate selection QuickPick to `LivePreview` (with support for both single themes and Ghostty dark/light pairs, respecting `termeleon.livePreview` setting) and ensure the terminal is visible via `ensureTerminalVisible()`.

## Requirements

1. In `src/extension.ts` (`commandMirror`):
   - When multiple active candidates exist (`candidates.length > 1`), display the candidate list using a `vscode.window.createQuickPick<MirrorItem>()` rather than `vscode.window.showQuickPick`.
   - Call `ensureTerminalVisible()` when opening the mirror picker.
   - Wire `onDidChangeActive` to `LivePreview` session (debounced apply) when `termeleon.livePreview` is enabled.
   - Handle both single theme candidates (`candidate.kind === 'theme'`) and Ghostty dark/light pairs (`candidate.kind === 'pair'`).
   - On cancel (hide without accept), call `session.cancel()` to restore the pre-picker snapshot.
   - On accept, call `session.stop()`, apply the chosen candidate, and display the confirmation message.
2. In `src/apply.ts`:
   - Enhance `LivePreview` to support scheduling pairs via `schedulePair(dark: Palette, light: Palette)`.
3. In tests (`test/host/`):
   - Add host tests covering live preview and cancel behavior for multi-active mirror selection and paired candidate preview.
   - Verify all tests pass (`npm run test:parsers`, `npm run compile`, `npm run test:host`).
