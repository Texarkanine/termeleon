# Current Task: clean-up-minimum-contrast-ratio

**Complexity:** Level 1

## Fix Summary
- **What broke:** Theme removal (`removeApplied`) and live-preview cancellation (`LivePreview.cancel`) left `terminal.integrated.minimumContrastRatio: 1` in configuration (e.g. `.vscode/settings.json`), leaving behind unwanted setting files in workspaces that had none previously.
- **Why:** `applyPalette` set `terminal.integrated.minimumContrastRatio` to 1 on apply, but `removeApplied` only cleared `workbench.colorCustomizations`, and `LivePreview` only snapshotted and restored `colorCustomizations` and `ownedKeys`.
- **What changed:**
  - Extended `ApplySnapshot` and `restoreApplySnapshot` in `src/palette.ts` to capture and restore `minimumContrastRatio`.
  - Updated `src/apply.ts`:
    - `snapshotApply` captures current target's `minimumContrastRatio`.
    - `restoreApply` restores the captured `minimumContrastRatio` to the target.
    - `removeApplied` checks if `minimumContrastRatio` is 1 at target and resets it to `undefined` (in both tracked and fallback modes).
  - Added test coverage in `test/host/apply.test.ts`, `test/host/preview.test.ts`, and `test/parsers.test.ts`.
- **Files affected:**
  - `src/palette.ts`
  - `src/apply.ts`
  - `test/parsers.test.ts`
  - `test/host/apply.test.ts`
  - `test/host/preview.test.ts`
