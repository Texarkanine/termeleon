# Progress

Rework terminal-selection-visibility: split Settings into Picker Behavior vs Color Preferences when Applying New Themes, and rename the two selection toggles as overrides with inverted foreground polarity.

**Complexity:** Level 2

## 2026-09-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Confirmed intent: diagnose the selection-foreground setting, check dropped theme fields, and make selection pop on failing themes (MobaXterm Mirror) without regressing duskfox/light themes.
    - Classified Level 2: contained enhancement of the Palette → `workbench.colorCustomizations` mapping, plus setting semantics.
* Decisions made
    - Level 2, not Level 1: more than a one-line wiring fix; fallback when a source has no selection color is a product choice inside one subsystem.
    - Invented selection colors are in-scope only when the emulator theme did not specify them.
* Insights
    - MobaXterm parser currently maps ANSI, fg, bg, and cursor only — no selection slots.
    - `includeSelectionForeground` is off by default and only writes `terminal.selectionForeground` when the palette actually has one; toggling the setting without re-apply would look like a no-op.

## 2026-09-13 - PLAN - IN-PROGRESS

* Work completed
    - Operator confirmed toggle-without-reapply is why contrast and selection-foreground settings looked inert.
* Decisions made
    - Mapping settings stay not-live; descriptions must say so.
    - Add an explicit Reapply Last Theme command (last committed apply only).
    - Missing-selection fill is a setting, default on, so it can be turned off.

## 2026-09-13 - PLAN - COMPLETE

* Work completed
    - Wrote Level 2 plan: mapping-hub fill, Xresources highlight keys, last-apply + Reapply command, apply-time setting copy.
    - Test plan covers fill on/off, authored vs synthetic, Reapply, and live-preview not recording last-apply.
* Decisions made
    - Fill overlay: `#ffffff80`/`#ffffff40` on dark backgrounds, `#00000080`/`#00000040` on light (relative luminance of `terminal.background`).
    - Do not invent `selectionForeground` when the palette has none.
    - Persist last Palette in extension state; do not re-read the theme file on Reapply.
* Insights
    - VS Code's default `terminal.selectionBackground` is `editor.selectionBackground`, which is why MobaXterm-on-duskfox-workbench can have no visible terminal selection.

## 2026-09-13 - PREFLIGHT - COMPLETE (FAIL (fixable))

* Work completed
    - Validated the Level 2 plan against the Palette mapping hub, apply shell, command flow, and existing parser and extension-host test suites.
* Decisions made
    - Re-plan before build: make pair replay and live-preview isolation explicit, mandatory host-test coverage.
    - Record an accepted Import in `pickAndApply`, which owns the accepted palette, rather than in `commandImport`.
* Insights
    - `LastApply` must be target-scoped in the matching Memento, so Reapply cannot cross user and workspace settings.

## 2026-09-13 - PLAN - COMPLETE (re-plan after preflight)

* Work completed
    - Made Ghostty pair reapply and live-preview last-apply isolation mandatory host tests.
    - Moved Import last-apply recording to `pickAndApply` after the committed `applyPalette`.
* Decisions made
    - Last-apply stays per-target in the matching Memento (preflight advisory kept).
* Insights
    - `commandImport` never sees the accepted palette; only `pickAndApply` does.

## 2026-09-13 - PREFLIGHT - COMPLETE (PASS)

* Work completed
    - Re-validated the re-planned Level 2 plan against `src/palette.ts`, `src/apply.ts`, `src/extension.ts`, `src/parsers/*`, and both test suites.
    - Confirmed all three prior `FAIL (fixable)` findings (pair-reapply test, mandatory live-preview isolation, Import recording location) are closed in the current plan.
* Decisions made
    - No plan changes required; proceed to Build.
* Insights
    - Every emulator parser that already has native selection fields (kitty, Ghostty, iTerm2, Alacritty/WezTerm via `toml.ts`) maps them; only Xresources genuinely lacked the mapping, and Windows Terminal/MobaXterm genuinely have no selection fields in their formats — the plan's scope (Xresources mapping + generic fill) is exactly the right size, nothing missing.

## 2026-09-13 - BUILD - COMPLETE

* Work completed
    - Implemented missing-selection fill, Xresources highlight mapping, last-apply + Reapply, and apply-time setting copy.
    - Parser suite 83+32+8 passing; host tests 44 passing.
* Decisions made
    - Mapping-function default for fill is off; `ApplyOptions` / the user setting default on.
    - Last-apply stores the Palette object per target; Remove clears it.
    - Host preview delays bumped to `PREVIEW_DEBOUNCE_MS + 400` after 1.137 config.update races.
* Insights
    - Host tests hang without `XDG_RUNTIME_DIR` and a dbus session on this WSL box.

## 2026-09-13 - BUILD - COMPLETE (QA rework)

* Work completed
    - Removed the duplicate iTerm2 semantic-mismatch bullet in README.md.
* Decisions made
    - One-line docs fix; no code change.

## 2026-09-13 - BUILD - COMPLETE (QA rework 2)

* Work completed
    - Reapply / apply with `setMinimumContrastRatio` false now clears a previously written `1`, leaving custom values other than 1 alone.
* Decisions made
    - Same heuristic as Remove: only a `1` at that target is cleared, not a user-set 3 or 4.5.



## 2026-09-13 - QA - COMPLETE (FAIL (fixable))

* Work completed
    - Semantic review of the build against the Level 2 plan: mapping-hub fill, Xresources highlight keys, last-apply + Reapply, and apply-time setting copy.
    - Re-ran the parser suite at review time: 83 passed.
* Decisions made
    - FAIL (fixable): `README.md` gained a duplicate "iTerm2 stores 0..1 float components in an XML plist" bullet (lines 85-86) — edit debris that must be deleted before acceptance. Build must rerun for the one-line docs fix.
    - All implementation code judged clean: fill semantics, authored-selection precedence, no invented foreground, per-target last-apply with live-preview isolation, pair reapply, remove-clears-record, and not-live setting copy all match the plan.
* Insights
    - The only defect in the change is documentation debris; the executable behavior and tests are complete and pattern-conformant.

## 2026-09-13 - QA - COMPLETE (FAIL (fixable), re-review)

* Work completed
    - Confirmed the prior documentation-debris finding was corrected.
    - Re-reviewed the feature and ran the complete suite: 83 parser, 32 discovery, 8 cache, and 44 extension-host tests passed.
* Decisions made
    - Build must rerun: Reapply must make `setMinimumContrastRatio: false` effective by clearing the extension-written value and add regression coverage.
* Insights
    - `applyPalette` and `applyPalettePair` set the ratio to 1 when enabled but make no corresponding update when disabled, so a true-to-false Reapply leaves the old override intact despite the setting's documented apply-time semantics.

## 2026-09-13 - QA - COMPLETE (PASS)

* Work completed
    - Re-reviewed the build's contrast-ratio fix against the plan and re-ran the complete suite: 83 parser, 32 discovery, 8 cache, and 46 extension-host tests (44 prior + 2 new regression tests) all passed.
* Decisions made
    - PASS: the fix closes the last blocking finding, and the rest of the implementation (fill, Xresources mapping, last-apply/Reapply, remove, docs) remains correct on re-check. One non-blocking advisory noted for `systemPatterns.md` completeness.
* Insights
    - `applyContrastRatio` now mirrors `removeApplied`'s existing "clear a 1 we wrote, leave a user's custom value" heuristic, so apply, reapply, and remove all agree on when the extension owns that setting.

## 2026-09-13 - REFLECT - COMPLETE

* Work completed
    - Wrote `memory-bank/active/reflection/reflection-terminal-selection-visibility.md`.
    - Updated Surgical Settings Ownership and Live Preview sections in `systemPatterns.md`.
* Decisions made
    - productContext and techContext: skip.
* Insights
    - Boolean mapping settings need tests for both polarities; contrast-off was the gap.

## 2026-09-13 - POST-REFLECT - operator decision

* Decisions made
    - No selection-mode dropdown. VS Code has no per-cell selection invert; a fake default-fg/bg swap would flatten ANSI. `fillMissingSelection` checkbox is the two-option setting.

## 2026-09-13 - REWORK INITIATED

* Work completed
    - Operator chose rework over archive: split Settings into Picker Behavior vs Color Preferences when Applying New Themes; rename the two selection toggles as overrides with obvious descriptions.
* Decisions made
    - Highlight override is selectionBackground + inactiveSelectionBackground (not a fg/bg combo). Ids: `overrideMissingSelectionHighlight` (default on), `overrideIncludedSelectionForeground` (default off).
    - Foreground override polarity is inverted vs the old `includeSelectionForeground`: override off means honor the theme's selection fg; on means keep ANSI. That changes the previous skip-fg-by-default.
    - Clean break: drop `fillMissingSelection` and `includeSelectionForeground`; 0.x, no alias.
* Insights
    - VS Code category objects have title/order/properties only; the Color Preferences title is the section-level "not live" signal.

## 2026-09-13 - COMPLEXITY-ANALYSIS - COMPLETE (rework)

* Work completed
    - Classified the settings-category + override-rename rework as Level 2.
* Decisions made
    - Level 2, not Level 1: polarity inversion, key rename, configuration array, and docs/tests across the mapping hub and apply shell.
    - Level 2, not Level 3: still one subsystem (Palette → toColorCustomizations + package.json contribution).
* Insights
    - Default-off for `overrideIncludedSelectionForeground` means authored selection fg is now written unless the user opts out — opposite of the first build's skip-by-default.

## 2026-09-13 - PLAN - COMPLETE (rework)

* Work completed
    - Wrote Level 2 rework plan: mapping polarity, apply option rename, configuration array, README/STORE copy.
* Decisions made
    - Mapping-layer default writes authored selectionForeground unless `overrideIncludedSelectionForeground` is true (invert the old include flag).
    - Broadcast exact-map test must include `#e6e1dc` selection fg.
    - Contract tests flatten `configuration` whether object or array.
* Insights
    - Host `workspaceOpts` currently defaults include-fg false to omit; after invert, override-off will write `samplePalette`'s `#ffffff` unless tests set the override on.

## 2026-09-13 - PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

* Work completed
    - Validated the Level 2 rework plan against the palette mapping hub, apply shell, extension settings flow, parser contract tests, and host apply/preview suites.
    - Confirmed all executable units encode test stubs and red runs before implementation, and the manifest-array contract test is a public extension contract rather than a change-detector.
* Decisions made
    - PASS WITH ADVISORY: no plan changes are required before Build.
* Insights
    - Both current manifest consumers are in `test/parsers.test.ts`; its planned flattening helper covers the configuration-array migration.

## 2026-09-13 - BUILD - COMPLETE (rework)

* Work completed
    - Renamed mapping options, inverted selection-fg default, split `contributes.configuration` into the two category titles, updated README/STORE.
    - Parser suite 85+32+8 passing; host tests 47 passing (46 prior + 1 highlight-override reapply).
* Decisions made
    - `toColorCustomizations` writes `p.selectionForeground` unless `overrideIncludedSelectionForeground`.
    - Contract tests flatten configuration whether object or array; old setting ids asserted absent.
* Insights
    - Host tests on this WSL box still need a writable `XDG_RUNTIME_DIR` (not `/run/user/1000`) plus `dbus-launch`, or Electron dies on `EACCES` for the vscode socket.

## 2026-09-13 - QA - COMPLETE (rework, PASS)

* Work completed
    - Semantic review of the rework build against the Level 2 rework plan: mapping polarity inversion, apply/extension option rename, package.json configuration-array split, README/STORE copy.
    - Re-ran the complete suite: 85 parser, 32 discovery, 8 cache, and 47 extension-host tests, all passing.
* Decisions made
    - PASS: every plan unit matches the diff, every Test Plan behavior has a corresponding test, no stray references to the removed setting ids, no debris.
    - Preflight's non-blocking settings-adapter advisory correctly left undone.
* Insights
    - The rework's clean-break constraint held throughout: the only remaining occurrences of `includeSelectionForeground` / `fillMissingSelection` are the negative assertions proving they are gone.

## 2026-09-13 - REFLECT - COMPLETE (rework)

* Work completed
    - Rewrote `memory-bank/active/reflection/reflection-terminal-selection-visibility.md` to cover original delivery plus rework.
* Decisions made
    - productContext, systemPatterns, techContext: skip.
* Insights
    - Override-off-means-honor-the-theme is the mapping default we would have wanted from the start; the first build's skip-fg-by-default was the include-flag polarity.

## 2026-09-13 - OPERATOR COPY (post-reflect)

* Work completed
    - Operator rewrote Color Preferences `markdownDescription`s as situation + On/Off paragraphs.
    - Split `contributes.configuration` into three categories: Command Palette UI Behavior, Theme Discovery, Color Preferences when Applying New Themes.
* Decisions made
    - `scopeToActiveTheme` default is **on** (was off): imported colors attach to the Color Theme active at apply unless the user turns this off.
    - Checkbox copy stays at the two-way choice; do not explain VS Code's colorCustomizations cascade in the setting text.
* Insights
    - README/STORE still describe two groups named Picker Behavior and `scopeToActiveTheme` default off — they lag `package.json`.



