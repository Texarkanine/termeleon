# Progress

Apply Ghostty `theme = dark:X,light:Y` pairs as `window.autoDetectColorScheme` scoped `workbench.colorCustomizations` so mirror mode can follow a split Ghostty config, with tests that observe the written keys.

**Complexity:** Level 2

## 2026-08-31 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Restated issue #9 into `projectbrief.md`
    - Classified as Level 2
* Decisions made
    - Level 2, not Level 3: one enhancement to apply/mirror; discovery already has the pair parse
    - Operator pre-approved the issue as the task; no intent-clarification wait
* Insights
    - Mirror currently treats two active Ghostty names as "several terminals" and applies only one palette
    - `applyPalette` writes either flat keys or a single `[active workbench theme]` block; neither follows auto-detect

## 2026-08-31 - PLAN - COMPLETE

* Work completed
    - Wrote Level 2 plan in `tasks.md`: pair identity, paired merge/apply, docs
    - Mapped tests onto existing `test/parsers.test.ts` harness (no vscode import)
* Decisions made
    - Scope to `preferredDarkColorTheme` / `preferredLightColorTheme`, not `[*Dark*]` wildcards
    - Do not set `window.autoDetectColorScheme`
    - Import picker stays single-theme; Mirror collapses a Ghostty pair into one candidate
    - Extract vscode-free `mergeColors` / `mergePairedColors` so tests can observe written keys
* Insights
    - Existing `removeApplied` scoped-key regex already supports `[Theme].terminal.*` owned keys
    - VS Code theme-specific colorCustomizations overlay the active workbench theme, which auto-detect sets from the preferred light/dark names

## 2026-08-31 - PREFLIGHT - COMPLETE

* Result: `FAIL (fixable)`
* Findings
    - The TDD plan does not make Ghostty appearance stamping observable: constructed-theme tests cannot exercise `discoverGhostty`.
    - The scope merge tests inject names and therefore do not prove `applyPalettePair` reads the preferred dark/light workbench settings rather than the active theme or a wildcard.
* Next step
    - Return to planning to add testable seams and red tests for both wiring behaviors before Build.

## 2026-08-31 - PLAN - COMPLETE

* Work completed
    - Replanned after preflight FAIL (fixable)
    - Added `toGhosttyDiscovered` and `preferredPairScopes` as the testable seams preflight required
* Decisions made
    - `discoverGhostty` must stamp appearance only by calling `toGhosttyDiscovered`
    - `applyPalettePair` must obtain scopes only via `preferredPairScopes((key) => workbench.get(key))`
    - Adopted preflight advisory `pairScopes` as the single bracket helper
* Insights
    - Injected scope strings in merge tests cannot prove which VS Code settings apply reads; a `read(key)` spy can
