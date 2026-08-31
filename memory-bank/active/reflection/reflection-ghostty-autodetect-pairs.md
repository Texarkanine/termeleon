---
task_id: ghostty-autodetect-pairs
date: 2026-08-31
complexity_level: 2
---

# Reflection: ghostty-autodetect-pairs

## Summary

Mirror of a Ghostty `theme = dark:X,light:Y` pair now writes both palettes as `workbench.colorCustomizations` blocks scoped to the preferred dark and light workbench themes. Tests observe the written keys through vscode-free helpers. QA failed once on a real cross-mode ownership leak, then passed after stripping became symmetric.

## Requirements vs Outcome

Delivered as specified: pair apply, auto-detect scopes (preferred-theme *values*), tests at the vscode-free layer, README/productContext updated. Import picker still applies one theme. `window.autoDetectColorScheme` is not turned on. No extra scope.

## Plan Accuracy

Sequence and file list held. First preflight correctly rejected constructed-theme tests and injected scope strings as proofs of wiring; `toGhosttyDiscovered` and `preferredPairScopes(read)` were the right seams. The plan only required stripping owned keys on the pair path. That was the actual miss: a later single import reintroduced the leak.

## Build & QA Observations

Build was straightforward once the seams existed. QA (first pass) caught that theme-scoped customizations outrank unscoped keys, so leftover pair scopes would hide a later flat import and evade surgical remove. Second QA passed. Residual advisories (regex still in `removeApplied`, empty preferred-theme fallback) were left on purpose.

## Insights

### Technical

- Theme-scoped `workbench.colorCustomizations` overlay unscoped keys. Any apply path that records a new owned-key list without deleting the previous one will orphan scopes that still win at render time. Strip-before-merge belongs on every apply, not only the new one.
- Settings-key choice is testable without an extension host if the production function takes `read(key)` and tests spy on the key names.

### Process

- Preflight FAIL (fixable) on "tests that cannot fail when the wiring is wrong" was the useful one. Constructed fixtures and injected strings are not proofs of the call site.
- Specifying a cleanup only on the new path is how the QA leak happened. When adding a second writer, assume it will run after the first.

### Million-Dollar Question

One apply primitive: strip previously owned keys, then merge a list of `{ colors, scope? }` into `colorCustomizations`. Flat import is a one-item list with no scope; a Ghostty pair is two scoped items. `applyPalette` / `applyPalettePair` are that idea split into two entry points. Unifying them now would be a rename, not a redesign.
