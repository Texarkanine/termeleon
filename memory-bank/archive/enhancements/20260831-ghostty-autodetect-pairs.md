---
task_id: ghostty-autodetect-pairs
complexity_level: 2
date: 2026-08-31
status: completed
---

# TASK ARCHIVE: ghostty-autodetect-pairs

## SUMMARY

Mirror of Ghostty `theme = dark:X,light:Y` now writes both palettes as `workbench.colorCustomizations` blocks named after the values of `workbench.preferredDarkColorTheme` and `workbench.preferredLightColorTheme`. Import picker stays single-theme. `window.autoDetectColorScheme` is not turned on. Issue #9; PR https://github.com/Texarkanine/vscode-terminal-themes/pull/18.

## REQUIREMENTS

- Apply a Ghostty dark/light pair as paired scoped blocks, not two independent flat writes.
- Scopes follow workbench light/dark auto-detect (preferred theme names, not `[*Dark*]` wildcards).
- Tests observe the written keys without an extension host.
- Reuse `activeGhosttyThemes`; do not re-parse `theme =` in apply.
- Surgical owned-key removal still works for the new scopes.
- README known-limit rewritten to match the new behavior.

## IMPLEMENTATION

Discovery stamps `appearance` via `toGhosttyDiscovered` (including the inline-config fallback). `mirrorCandidates` collapses a Ghostty pair into one Mirror unit. `applyPalettePair` reads preferred dark/light through `preferredPairScopes((key) => workbench.get(key))` and writes both scopes. Both apply paths strip previously owned keys before merging. Live-preview cancel snapshots and restores owned keys with colors (`snapshotApply` / `restoreApply`) so a pair Mirror plus Import Esc cannot leave scoped blocks with a flat owned-key list.

Key files: `src/palette.ts`, `src/discover.ts`, `src/apply.ts`, `src/extension.ts`, `test/parsers.test.ts`, `README.md`, `memory-bank/productContext.md`, `memory-bank/systemPatterns.md`.

## TESTING

`npm run test:parsers` 22/22; `npm run compile` clean. Preflight passed with advisory after a first FAIL (fixable) that required testable seams. QA failed once (asymmetric strip; README named setting ids instead of theme values), then passed. Cursor review `discussion_r3896723496` (preview-cancel owned-key desync) was fixed with a vscode-free `restoreApplySnapshot` test.

## LESSONS LEARNED

- Theme-scoped `workbench.colorCustomizations` overlay unscoped keys. Any apply path that records a new owned-key list without deleting the previous one orphans scopes that still win at render time. Strip-before-merge belongs on every apply path.
- Settings-key choice is testable without an extension host if the function takes `read(key)` and tests spy on the names.
- Live preview writes owned keys; restoring only `colorCustomizations` on cancel desyncs the strip list from the settings that remain.
- Constructed fixtures and injected scope strings are not proofs of the call site. Preflight was right to demand `toGhosttyDiscovered` and `preferredPairScopes(read)`.

## PROCESS IMPROVEMENTS

When adding a second writer, assume it will run after the first and specify cleanup on every apply path, not only the new one. Preflight should keep rejecting tests that cannot fail when the wiring is wrong.

## TECHNICAL IMPROVEMENTS

One apply primitive would suffice: strip previously owned keys, then merge a list of `{ colors, scope? }`. Flat import is one unscoped item; a Ghostty pair is two scoped items. `applyPalette` / `applyPalettePair` are that idea as two entry points.

## NEXT STEPS

None required for #9. Residual advisories (scoped-delete regex still duplicated in `removeApplied`; empty preferred-theme fallback) were left on purpose.
