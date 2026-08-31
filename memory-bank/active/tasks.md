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
    - Extracted `writeContrastRatioAt` helper for unified configuration updates.
  - Documented `minimumContrastRatio` cleanup behavior in `README.md`.
  - Added test coverage in `test/host/apply.test.ts`, `test/host/preview.test.ts`, and `test/parsers.test.ts`.
- **Files affected:**
  - `README.md`
  - `src/palette.ts`
  - `src/apply.ts`
  - `test/parsers.test.ts`
  - `test/host/apply.test.ts`
  - `test/host/preview.test.ts`

## QA Result: ✅ PASS

All acceptance criteria are met and the full suite passes (45 parser + 5 discovery + 26 host). No blocking findings.

- **KISS/DRY:** The `writeContrastRatioAt` extraction removed the duplicated `update('minimumContrastRatio', 1, …)` call in `applyPalette` and `applyPalettePair`. `readContrastRatioAt` repeats the target-selection ternary from `readAt`, but at two instances extracting a helper is not yet worth it.
- **YAGNI:** No speculative surface. `minimumContrastRatio` is optional on `ApplySnapshot`, which is correct since "unset" is a real state that must round-trip.
- **Completeness:** Requirement 1 covered for both tracked and fallback paths, requirement 2 covered by the `LivePreview.cancel` test, and constraint 3 covered by the non-1 preservation test. `snapshotApply` is the only production construction site of `ApplySnapshot`, so nothing silently drops the new field.
- **Regression:** The vscode-free core boundary holds - `palette.ts` gained only a plain optional field. All pre-existing tests still pass, and `resetSettings` already cleared `minimumContrastRatio` at both targets, so the new tests leak no config state.
- **Integrity:** No debug artifacts, hardcoded shortcuts, or placeholders. The `1` sentinel is the pre-existing documented value from `applyPalette`, not a new magic number.
- **Documentation:** `README.md` describes the new removal behavior, and the `restoreApplySnapshot` doc comment was updated to name the third restored field.

### Advisories (non-blocking)

1. Removal identifies the setting to clear by value (`=== 1`) rather than by ownership, so a hand-set `1` is cleared by Remove. This is what requirement 1 specifies; ownership tracking would be exact.
2. The `keys.length === 0 && !allowFallback` early return skips the contrast-ratio cleanup, so declining the fallback prompt leaves `minimumContrastRatio: 1` in place.
3. VS Code's configuration API removes the key but leaves `.vscode/settings.json` as `{}`; it cannot delete the file. Pre-existing for `colorCustomizations` removal, so not a regression.
4. New host tests hold one `getConfiguration('terminal.integrated')` object across later `update()` calls, unlike `helpers.inspectColors`, which re-fetches. Style drift only - staleness would fail loud.
5. `systemPatterns.md` says `removeApplied` deletes only tracked keys. That section is about color keys, so it is not wrong, but a one-line clarification would help.
