# Active Context

## Current Task: ghostty-autodetect-pairs
**Phase:** QA - COMPLETE (PASS)

## What Was Done
- QA FAIL (fixable) rebuild: `applyPalette` now strips previously owned keys the same way `applyPalettePair` does (`stripOwnedKeys` lives in vscode-free `palette.ts` and is tested).
- README now says scopes are the *values* of the preferred dark/light theme settings (e.g. `[One Dark Pro]`), not the setting ids.
- Advisory: inline Ghostty fallback uses a `hasInline` boolean instead of re-scanning entries.
- Tests: 21 passing.

## Next Step
- Re-run QA.
