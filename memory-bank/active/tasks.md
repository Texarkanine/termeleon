# Task: terminal-selection-visibility

* Task ID: terminal-selection-visibility
* Complexity: Level 2
* Type: simple enhancement (bug-adjacent)

VS Code terminal selection is often invisible after Termeleon apply because many palettes (MobaXterm especially) have no selection color, so we write `terminal.background` but leave `terminal.selectionBackground` to the workbench theme (`editor.selectionBackground` by default). Mapping settings already work on apply, but they are not live — toggling them after apply is a no-op. This task fills missing selection behind a setting, maps remaining emulator selection keys, documents the apply-time settings, and adds Reapply Last Theme.

## Test Plan (TDD)

### Behaviors to Verify

- Authored selection: palette with `selectionBackground` → `toColorCustomizations` writes that exact `terminal.selectionBackground` and does not write `terminal.inactiveSelectionBackground`, whether fill is on or off.
- Fill on, missing selection, dark background: palette with `background` luminance ≤ 0.5 and no `selectionBackground` → writes a light translucent `terminal.selectionBackground` (`#ffffff80`) and a more transparent `terminal.inactiveSelectionBackground` (`#ffffff40`).
- Fill on, missing selection, light background: same with luminance > 0.5 → `#00000080` / `#00000040`.
- Fill off, missing selection: does not write `terminal.selectionBackground` or `terminal.inactiveSelectionBackground`.
- Fill on, no background and no selection: omit both selection keys (nothing to contrast against).
- Selection foreground default: `includeSelectionForeground` false → omit `terminal.selectionForeground` even when fill writes a background.
- Selection foreground opt-in: true and palette has `selectionForeground` → write it. True and palette has none → still omit (do not invent a foreground).
- Xresources: `highlightColor` / `highlightTextColor` (last identifier, case-insensitive) → `selectionBackground` / `selectionForeground`.
- MobaXterm parse: still no selection slots on the Palette (format has none); fill happens at map time.
- Reapply: after `recordLastApply` of a committed single palette, `reapply` with flipped `includeSelectionForeground` writes or omits that key using current options.
- Reapply with no record: returns a no-op result (no settings write).
- Live preview must not call `recordLastApply` (preview then cancel leaves the previous last-apply, or none).
- `removeApplied` clears the last-apply record for that target.
- `managedKeys()` includes `terminal.inactiveSelectionBackground`.

### Test Infrastructure

- Framework: Node `assert` via `tsx` (`test/parsers.test.ts`); Mocha TDD in the extension host (`test/host/*.ts` via `vscode-test`)
- Test location: `test/parsers.test.ts` (palette mapping, Xresources, MobaXterm parse); `test/host/apply.test.ts` (apply/reapply/remove); `test/host/preview.test.ts` only if a LivePreview test is needed to prove it does not record last-apply
- Conventions: `test('name', () => { ... })` in parsers; Mocha `suite`/`test` in host; `samplePalette(overrides)` for palettes; inspect `workbench.colorCustomizations` at one target
- New test files: none

## Implementation Plan

### 1. Missing-selection fill in the mapping hub — executable

- Files: `src/palette.ts`, `test/parsers.test.ts`

1. Stub tests: in `test/parsers.test.ts` next to the existing `omits selectionForeground` case, add empty cases for authored-vs-fill, dark/light overlays, fill off, no-background omit, and `managedKeys` containing `terminal.inactiveSelectionBackground`.
2. Stub interface: add `fillMissingSelection?: boolean` to `MappingOptions`; add `fallbackSelectionColors(background?: string): { background: string; inactive: string } | undefined` (empty body returning undefined); extend `managedKeys()`.
3. Write tests and run red: `npx tsx test/parsers.test.ts` — new cases fail. Keep the Broadcast exact-map test unchanged (authored selection, fill default must not add inactive or change `#5a647e`).
4. Write code and run green: implement luminance (relative luminance of `#rrggbb`) and the overlay hexes above; `toColorCustomizations` writes authored `selectionBackground` when present; else if `fillMissingSelection` and fallback exists, write both selection keys; never invent `selectionForeground`.

### 2. Xresources highlight keys — executable

- Files: `src/parsers/kitty.ts`, `test/parsers.test.ts`

1. Stub tests: empty Xresources case for `*.highlightColor` / `*.highlightTextColor`.
2. Stub interface: add `highlightcolor` / `highlighttextcolor` (and `highlightbackground` as an alias for background) to the `parseXresources` switch; no new exports.
3. Write tests and run red: `npx tsx test/parsers.test.ts`.
4. Write code and run green: map those keys through `normalizeColor` onto `selectionBackground` / `selectionForeground`.

### 3. Apply options, last-apply, Reapply — executable

- Files: `src/apply.ts`, `src/extension.ts`, `package.json`, `test/host/apply.test.ts`, `test/host/helpers.ts` if apply-option helpers need the new flag, `test/host/preview.test.ts` only if last-apply leak must be asserted there

1. Stub tests: host cases for fill on/off through `applyPalette`; `recordLastApply` + `reapply` flipping `includeSelectionForeground`; `reapply` with no record; `removeApplied` clears last-apply.
2. Stub interface: `ApplyOptions.fillMissingSelection`; `LastApply` type; `recordLastApply` / `lastApply` / `clearLastApply` / `reapply` in `src/apply.ts`; `termeleon.reapply` command and `termeleon.fillMissingSelection` config in `package.json`; `settings()` reads the new flag.
3. Write tests and run red: `npm run test:host` (or the single apply suite).
4. Write code and run green: pass `fillMissingSelection` into `toColorCustomizations`; persist last apply on committed Import/Mirror only (`commandImport` after accept, `commandMirror` after apply — **not** `LivePreview.schedule` / `schedulePair`); `reapply` reads current `applyOptions` and calls `applyPalette` / `applyPalettePair`; `removeApplied` clears last-apply; Reapply uses `resolveTarget` and shows a warning when empty.

### 4. Apply-time setting copy — prose/policy

- Files: `package.json` (`markdownDescription` for `includeSelectionForeground`, `setMinimumContrastRatio`, `scopeToActiveTheme`, `fillMissingSelection`), `README.md` (Behavior worth knowing), `STORE.md` (configuration + command table)
- No tests: prose/policy artifact

1. State that mapping settings take effect on the next Import, Mirror, or Reapply — they are not live.
2. Document fill: only when the theme omitted selection colors; authored values win; default on.
3. Document Reapply Last Theme.
4. Document that `includeSelectionForeground` still requires a theme that actually has a selection foreground (MobaXterm will not grow one).

## Technology Validation

No new technology - validation not required

## Dependencies

- VS Code theme colors: `terminal.selectionBackground`, `terminal.selectionForeground`, `terminal.inactiveSelectionBackground` ([theme color reference](https://code.visualstudio.com/api/references/theme-color)). Default `terminal.selectionBackground` is `editor.selectionBackground`; inactive is 50% of that. Hex may include alpha (`#rrggbbaa`).
- Last-apply state keyed like `termeleon.ownedKeys` (global vs workspace Memento).
- No new npm packages.

## Challenges & Mitigations

- **Toggle looks broken:** already confirmed. Mitigation: descriptions + Reapply; no `onDidChangeConfiguration` rewrite.
- **Live preview vs last-apply:** recording inside `applyPalette` would make cancel+Reapply restore the previewed theme. Mitigation: record only from committed command paths; preview tests if we add a leak assertion.
- **Invented colors surprise:** fill is a setting, default on for the MobaXterm bug, off restores "only authored keys".
- **Alpha stripped by `normalizeColor`:** fallback overlay strings are built directly as `#rrggbbaa`, not run through `normalizeColor` (that helper drops alpha on 8-digit emulator colors on purpose).
- **Xresources name variants:** map the common `highlightColor` / `highlightTextColor` / `highlightBackground` identifiers the existing last-token parser already extracts; do not chase every URxvt prefix.

## Pre-Mortem

- **Plan failed because the screenshot was unfocused selection and we only wrote `terminal.selectionBackground`:** already covered — fill writes `terminal.inactiveSelectionBackground` too.
- **Plan failed because we auto-reapplied on toggle and stomped a hand-edited palette:** we will not listen for setting changes.
- **Plan failed because fill default-on made a "sparse" theme look unlike the emulator:** the setting exists so they can turn it off; authored selection is never replaced.
- **Plan failed because Reapply re-read a moved theme file:** we persist the last Palette object, not the file path, so Reapply remaps the same colors with new options.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
