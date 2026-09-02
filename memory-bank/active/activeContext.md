# Active Context: Issue #33 - Mirror Live Preview

## Current Session Focus

Implementing live preview and terminal visibility for `commandMirror` when multiple active themes are found.

## Current State

- Complexity Level: Level 2
- Phase: Plan / Preflight
- Workspace: `/Users/tex/worktrees/Texarkanine/vscode-terminal-themes/vscode-terminal-themes-issue-33-mirror-live-preview`
- Branch: `issue-33-mirror-live-preview`

## Recent Decisions

1. `LivePreview` in `src/apply.ts` will provide `schedulePair(dark: Palette, light: Palette)` alongside `schedule(palette: Palette)` to support dark/light pair candidates cleanly.
2. In `src/extension.ts`, multi-candidate mirror selection will use `vscode.window.createQuickPick<MirrorItem>()` (matching the architecture of `pickAndApply`), invoking `ensureTerminalVisible()`, wiring `onDidChangeActive` to `session.schedule` or `session.schedulePair`, and handling `onDidAccept` / `onDidHide` (with `session.stop()` or `session.cancel()`).
3. Host tests under `test/host/` will test pair preview in `LivePreview` and multi-candidate mirror quickpick behavior.

## Immediate Next Steps

1. Complete Plan and Preflight.
2. Execute Build Phase with strict TDD (stub tests -> implement tests -> verify failure -> implement code -> verify pass).
3. Run full validation suite.
4. Complete QA, Reflection, Archive, and PR.
