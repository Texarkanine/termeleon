# Active Context

## Current Task: ghostty-autodetect-pairs
**Phase:** PREFLIGHT - COMPLETE (FAIL (fixable))

## What Was Done
- Classified Level 2.
- Planned Ghostty dark/light pair apply: stamp `appearance` at discovery, vscode-free `mergePairedColors`, `applyPalettePair` scoped to `preferredDarkColorTheme` / `preferredLightColorTheme`, Mirror treats the pair as one unit.
- Tests stay in `test/parsers.test.ts` (no `vscode` import). Import picker stays single-theme. Do not flip `window.autoDetectColorScheme`.

## Next Step
- Return to planning to make Ghostty role-stamping and preferred-theme scope selection directly testable before Build.
