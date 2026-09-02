---
task_id: issue-33-mirror-live-preview
complexity_level: 2
date: 2026-09-02
status: completed
---

# TASK ARCHIVE: issue-33-mirror-live-preview

## SUMMARY

When `Termeleon: Mirror Active Terminal Theme` (`commandMirror` in `src/extension.ts`) finds multiple active themes across installed terminals, it now displays the candidate list via a `vscode.QuickPick` wired to `LivePreview` (with support for both single themes and Ghostty dark/light pairs, respecting `termeleon.livePreview`) and ensures an integrated terminal is visible via `ensureTerminalVisible()`. Issue #33.

## REQUIREMENTS

- When `candidates.length > 1` in `commandMirror`, present candidates using a QuickPick connected to `LivePreview`.
- Ensure an integrated terminal is opened/focused for previewing via `ensureTerminalVisible()`.
- Support live preview for both single themes and Ghostty dark/light pairs via `LivePreview.schedule` and `LivePreview.schedulePair`.
- Respect `termeleon.livePreview` setting (no writes on arrow navigation when false).
- Restore pre-session snapshot on cancel / hide.
- Stop pending debounce timer and apply chosen candidate on accept.
- Host tests verify preview, cancellation, and acceptance for multi-active mirror selection.

## IMPLEMENTATION

1. Extended `LivePreview` in `src/apply.ts` with `schedulePair(dark: Palette, light: Palette)`, debouncing `applyPalettePair` calls using `PREVIEW_DEBOUNCE_MS`.
2. Created `pickMirrorCandidate(ctx, candidates, target)` in `src/extension.ts` using `vscode.window.createQuickPick<MirrorItem>()`, calling `ensureTerminalVisible()`, handling `onDidChangeActive` (dispatching to `session.schedule` or `session.schedulePair`), `onDidAccept` (`session.stop()`), and `onDidHide` (canceling preview if unaccepted).
3. Updated `commandMirror` to call `pickMirrorCandidate` when multiple candidates exist.
4. Added extension host tests in `test/host/preview.test.ts` (testing `LivePreview.schedulePair`, mixed single/pair schedules, debounce override, and cancel) and `test/host/picker.test.ts` (testing `pickMirrorCandidate` preview on navigation, cancellation snapshot restoration, accept candidate selection, and `livePreview: false` behavior).

## TESTING

- `npm run compile`: Clean build and bundle.
- `npm run test:parsers`: 59 unit/parser/contract tests passing.
- `npm run test:host`: 37 extension host tests passing.
- Full test coverage verified.

## LESSONS LEARNED

- `LivePreview` should symmetrically support both flat palettes and dark/light pairs so any interactive picker (import or mirror) can share the same debounced preview lifecycle.
- Testing QuickPick event wiring in host tests by intercepting listener registrations allows verifying debounced live preview and snapshot restoration end-to-end without needing OS-level UI automation.
