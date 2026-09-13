# Task: terminal-selection-visibility

* Task ID: terminal-selection-visibility
* Complexity: Level 2
* Type: simple enhancement (rework)

Split Termeleon Settings into **Picker Behavior** and **Color Preferences when Applying New Themes**. Replace `fillMissingSelection` / `includeSelectionForeground` with override ids whose polarity matches the names: missing-highlight fill stays default-on and inert when authored; included-foreground override default-off honors the theme's selection fg, and on keeps ANSI. Clean break — no aliases.

## Test Plan (TDD)

### Behaviors to Verify

- Default map writes authored fg: Ghostty Broadcast `toColorCustomizations(p)` with no opts → `terminal.selectionForeground` is `#e6e1dc`.
- Override included fg on: same palette with `overrideIncludedSelectionForeground: true` → that key is omitted.
- Foreground override inert: palette with no `selectionForeground`, override on or off → omit `terminal.selectionForeground` (never invent).
- Highlight override on, missing, dark: no `selectionBackground`, `background` luminance ≤ 0.5, override on → `#ffffff80` / `#ffffff40`.
- Highlight override on, missing, light: luminance > 0.5 → `#00000080` / `#00000040`.
- Highlight override off, missing: omit both selection background keys.
- Authored highlight wins: palette with `selectionBackground`, override on or off → that exact background, no `terminal.inactiveSelectionBackground`.
- Highlight override on, no background: omit both selection background keys.
- Apply highlight on/off: `applyPalette` with override on writes overlay; off omits overlay (host).
- Apply fg override off writes authored `terminal.selectionForeground`; on omits it (host, `samplePalette` has both selection slots).
- Reapply flips fg override: committed apply with override off (fg written), `reapply` with override on omits that key without opening the picker.
- Reapply flips highlight override: committed apply of a no-selection palette with override off, `reapply` with override on writes the overlay.
- Configuration categories: `contributes.configuration` is an array of two objects titled `Picker Behavior` then `Color Preferences when Applying New Themes`.
- Picker properties: `target`, `sources`, `extraDirectories`, `livePreview` live only in the first category.
- Color properties: `scopeToActiveTheme`, `setMinimumContrastRatio`, `overrideMissingSelectionHighlight` (default true), `overrideIncludedSelectionForeground` (default false) live only in the second.
- Old ids gone: `fillMissingSelection` and `includeSelectionForeground` appear in neither category.
- Sources enum still lists `mobaxterm` (walk flattened properties).

### Test Infrastructure

- Framework: Node `assert` via `tsx` (`test/parsers.test.ts`); Mocha TDD in the extension host (`test/host/*.ts` via `vscode-test`)
- Test location: `test/parsers.test.ts` (mapping polarity, package.json contract); `test/host/apply.test.ts` (apply/reapply polarities); `test/host/preview.test.ts` (opts shape only)
- Conventions: `test('name', () => { ... })` in parsers; Mocha `suite`/`test` in host; `samplePalette(overrides)`; inspect `workbench.colorCustomizations` at one target
- New test files: none
- Contract helper: flatten `configuration` whether it is one object or an array, so sources-enum and identity tests do not assume `.properties` on a single object

## Implementation Plan

### 1. Mapping-hub rename and foreground polarity — executable

- Files: `src/palette.ts`, `test/parsers.test.ts`

1. Stub tests: replace `omits selectionForeground unless explicitly opted in` with empty cases for default-writes-authored-fg, override-on omits, override inert with no fg. Rename existing fill cases to `overrideMissingSelectionHighlight`. Keep authored-highlight and overlay hex cases.
2. Stub interface: rename `MappingOptions.includeSelectionForeground` → `overrideIncludedSelectionForeground` and `fillMissingSelection` → `overrideMissingSelectionHighlight`. Flip the fg `if` to write when the override is **off**.
3. Write tests and run red: `npx tsx test/parsers.test.ts`. Broadcast exact-map must now include `terminal.selectionForeground: '#e6e1dc'` (default honors authored fg). Overlay cases still use the highlight override flag.
4. Write code and run green: `toColorCustomizations` writes `p.selectionForeground` unless `overrideIncludedSelectionForeground`; missing highlight still fills only when `overrideMissingSelectionHighlight` and `fallbackSelectionColors` exist.

### 2. Apply shell option names — executable

- Files: `src/apply.ts`, `src/extension.ts`, `test/host/apply.test.ts`, `test/host/preview.test.ts`, `test/host/helpers.ts` (opts type only if needed)

1. Stub tests: rename host cases; invert fg assertions (override off writes, on omits). Reapply: start with override off (fg present), reapply with override on → key gone. Add reapply of a no-selection palette flipping highlight override off → on.
2. Stub interface: `ApplyOptions` field names match `MappingOptions`; `applyPalette` / `applyPalettePair` pass the new names; `settings()` in `extension.ts` reads the new config keys with defaults `overrideMissingSelectionHighlight: true`, `overrideIncludedSelectionForeground: false`.
3. Write tests and run red: `npm run test:host`.
4. Write code and run green: thread the renamed options; `workspaceOpts` defaults both overrides to false so existing isolation tests stay explicit. Preview isolation test only needs the new field names on `ApplyOptions`.

### 3. Settings categories and contract — executable

- Files: `package.json`, `test/parsers.test.ts`

1. Stub tests: empty cases for two category titles in order, property membership per category, defaults on the two overrides, old ids absent. Change the identity/sources contract tests to flatten an array.
2. Stub interface: `contributes.configuration` becomes an array of two objects. Each has `id: "termeleon"`, `title` exactly as specified, `order` 1 then 2, and the property split in the Test Plan.
3. Write tests and run red: `npx tsx test/parsers.test.ts`.
4. Write code and run green: move properties into the two categories; markdownDescription for the two overrides states on / off / inert in plain language, plus "Takes effect the next time you Import, Mirror, or Reapply — this toggle is not live." Same not-live sentence stays on `scopeToActiveTheme` and `setMinimumContrastRatio`. Picker settings do not claim apply-time.

### 4. README and STORE copy — prose/policy

- Files: `README.md` (Behavior worth knowing), `STORE.md` (configuration list)
- No tests: prose/policy artifact

1. Document the two Settings groups and that Color Preferences apply on next Import, Mirror, or Reapply.
2. Replace skip-fg / fill-missing copy with the override polarities and new defaults (honor authored selection fg unless overridden; invent highlight only when missing).
3. Drop every mention of the old setting ids.

## Technology Validation

No new technology - validation not required

## Dependencies

- VS Code `contributes.configuration` as an array of `{ id, title, order, properties }` ([contribution points](https://code.visualstudio.com/api/references/contribution-points#contributes.configuration)). Category objects have no user-visible description.
- Existing overlay hexes and `fallbackSelectionColors` in `src/palette.ts`.
- No new npm packages. No aliases for removed setting ids (0.x clean break).

## Challenges & Mitigations

- **Polarity inversion vs rename-only:** a mechanical find-replace of `includeSelectionForeground` would keep skip-fg when the new override is off. Mitigation: invert the `if` in `toColorCustomizations`; rewrite Broadcast exact-map and host fg tests as part of unit 1–2, not as a later docs pass.
- **Contract tests assume a single configuration object:** `pkg.contributes.configuration.properties` and `.title === 'Termeleon'` will fail. Mitigation: flatten helper in `test/parsers.test.ts` used by identity, sources-enum, and the new category cases.
- **Host `workspaceOpts` defaulted include-fg to false (omit):** after the invert, override-off writes `samplePalette`'s `#ffffff`. Isolation tests that snapshot exact keys must expect that key unless they set the override on.
- **Long Color Preferences title:** operator asked for that exact string; do not shorten.

## Pre-Mortem

- **Plan failed because we treated "override" as a synonym for the old include flag:** already covered by the polarity-inversion challenge; Broadcast exact-map including fg is the tripwire.
- **Plan failed because category `description` was planned as if VS Code would render it:** it will not. Title plus per-setting not-live copy is the plan; do not add a dummy info setting.
- **Plan failed because we kept aliases "just in case":** clean break is a brief constraint; do not add `fillMissingSelection` as a deprecated key.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight (PASS WITH ADVISORY)
- [ ] Build
- [ ] QA
