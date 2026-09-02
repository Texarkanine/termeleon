# Task: investigate-mobaxterm-themes

* Task ID: investigate-mobaxterm-themes
* Complexity: Level 2
* Type: simple enhancement

MobaXterm palettes are on disk, not buried. Global and imported themes live in an INI `[Colors]` section (`Black=r,g,b` … `BoldWhite`, plus `ForegroundColour` / `BackgroundColour` / `CursorColour`) inside `MobaXterm.ini` or standalone `.mxtcolors` / `.ini` theme files. That is the same class of file Termeleon already reads for Windows Terminal and Xresources.

Built-in dropdown schemes that exist only as `DefaultColorScheme=N` with no RGB keys, and per-session colors packed into undocumented `.mxtsessions` `%` fields, are not scanned. Syntax highlighting (`SyntaxType`) is not an ANSI palette. Palettes are not in the registry (`HKCU\Software\Mobatek\MobaXterm` is credentials).

Replan after preflight FAIL (fixable): default Documents discovery must follow OneDrive Known Folder Move, not only `%USERPROFILE%\Documents`.

```mermaid
flowchart LR
  files["MobaXterm.ini and .mxtcolors [Colors]"] --> parser["parseMobaXterm"]
  parser --> palette["Palette"]
  compiled["DefaultColorScheme index only"] -.-> skip["not scanned"]
  sessions[".mxtsessions per-session blobs"] -.-> skip
```

## Test Plan (TDD)

### Behaviors to Verify

- Byte triples: `fromByteComponents(1, 2, 3)` → `#010203`; any component not an integer in 0–255 → `undefined`
- Parse `[Colors]` RGB triples: a `[Colors]` section with the 16 named slots and Colour keys → `Palette` with `#rrggbb` ansi[0..15], background, foreground, cursor
- Ignore other INI sections: keys outside `[Colors]` do not become palette slots
- Incomplete file: `[Colors]` with only `DefaultColorScheme` (no 16 RGB slots) → palette is not `isUsable`
- Malformed RGB: empty, non-numeric, or out-of-range component → that slot is undefined
- Default-path discovery: `USERPROFILE/Documents/MobaXterm/MobaXterm.ini` with a usable `[Colors]` → one theme, `source` `mobaxterm`, `active` true
- OneDrive Documents discovery: when plain `Documents` is absent, `ONEDRIVE/Documents/MobaXterm/MobaXterm.ini` is found and `active`
- AppData discovery: `APPDATA/MobaXterm/MobaXterm.ini` is found when Documents and OneDrive Documents are absent
- First default-root `MobaXterm.ini` in priority order is the only `active` one; a later default-root copy is listed but not active
- extraDirs walk: a `.mxtcolors` or `.ini` theme file under `extraDirs` → listed, `active` false, origin under that directory
- Missing sources: no MobaXterm files and no extraDirs → empty list, no throw
- Extension filter: `.mxtsessions` next to a valid theme is not parsed as a palette
- Sources enum: `discoverThemes({ sources: ['mobaxterm'] })` returns only that source; `termeleon.sources` enum includes `mobaxterm`

### Test Infrastructure

- Framework: Node `assert` harness via `tsx` (`npm run test:parsers`)
- Test location: `test/parsers.test.ts`, `test/discover.test.ts`, fixtures under `test/fixtures/`
- Conventions: `test('name', () => { ... })`; parser cases read `fix('filename')`; discovery uses `withFixtureHome` and asserts on `origin` under the fixture tree
- New test files: none
- New fixtures: `test/fixtures/mobaxterm-colors.ini` (synthetic `[Colors]` plus a decoy section), `test/fixtures/mobaxterm-index-only.ini` (DefaultColorScheme only)

## Implementation Plan

### 1. parseMobaXterm — executable

- Files: `src/palette.ts`, `src/parsers/mobaxterm.ts`, `test/parsers.test.ts`, `test/fixtures/mobaxterm-colors.ini`, `test/fixtures/mobaxterm-index-only.ini`

1. Stub tests: empty cases in `test/parsers.test.ts` for `fromByteComponents`, RGB parse, other-section ignore, index-only unusable, malformed RGB
2. Stub interface: `export function fromByteComponents(r: number, g: number, b: number): string | undefined` in `src/palette.ts` returning `undefined`; `export function parseMobaXterm(text: string): Palette` in `src/parsers/mobaxterm.ts` returning `{ ansi: new Array(16).fill(undefined) }`
3. Write tests and run red: `fromByteComponents(1, 2, 3)` is `#010203`, `256` / non-integer / negative is `undefined`. Fixture with distinctive `r,g,b` (including spaced triples and `;` comments) asserts `#010203`-style slots using British `Colour` keys only; full INI with `[Misc]` decoy; index-only `isUsable` false; `not-a-color` / `256,0,0` slots undefined. `npx tsx test/parsers.test.ts` fails because the stubs return empty/undefined
4. Write code and run green: implement `fromByteComponents` beside `fromFloatComponents` (no clamping; reject anything not an integer 0–255). `parseMobaXterm` reads only the `[Colors]` section (INI section headers, `;` / `#` comments, CRLF). Map `Black`/`BoldBlack`/… and `ForegroundColour`/`BackgroundColour`/`CursorColour` (British spelling only). Split `r,g,b`, feed integers to `fromByteComponents`. Do not extend `normalizeColor` to raw triples. Do not accept `ForegroundColor` aliases. Re-run until green

### 2. discoverMobaXterm — executable

- Files: `src/discover.ts`, `src/extension.ts`, `package.json`, `test/discover.test.ts`, `test/parsers.test.ts`

1. Stub tests: empty cases in `test/discover.test.ts` for Documents path, OneDrive Documents path, AppData fallback, first-root-wins active, extraDirs `.mxtcolors`/`.ini`, missing files, skipped `.mxtsessions`; empty case in `test/parsers.test.ts` that `termeleon.sources` items.enum includes `mobaxterm`
2. Stub interface: `function discoverMobaXterm(extraDirs: string[]): DiscoveredTheme[]` returning `[]`; wire `run('mobaxterm', () => discoverMobaXterm(extraDirs))` in `discoverThemes`. Extend `stem()` to strip `.ini` and `.mxtcolors`. Extend `withFixtureHome` to save/delete `USERPROFILE`, `APPDATA`, and `ONEDRIVE`. Do not edit `package.json` or `SOURCE_LABELS` in this step
3. Write tests and run red: set `USERPROFILE` to the temp home and write `Documents/MobaXterm/MobaXterm.ini` from the colors fixture → origin match, `active` true, name `MobaXterm`. OneDrive case: no plain Documents file, `ONEDRIVE` points at a temp OneDrive root with `Documents/MobaXterm/MobaXterm.ini` → found, `active` true. AppData-only case. Two default-root copies: only the earlier priority path is `active`. extraDirs origin under the extra dir, `active` false. `.mxtsessions` sibling ignored. Missing dirs do not throw. Enum includes `mobaxterm` fails until step 4. Discovery tests fail because the stub returns `[]`
4. Write code and run green: build default roots in this order, skipping any whose env is unset/empty: `path.join(USERPROFILE or homedir, 'Documents', 'MobaXterm')`, `path.join(ONEDRIVE, 'Documents', 'MobaXterm')`, `path.join(USERPROFILE or homedir, 'OneDrive', 'Documents', 'MobaXterm')`, `path.join(APPDATA, 'MobaXterm')`. Walk those plus `extraDirs` for `.ini` and `.mxtcolors` only. Deduplicate by resolved path. First usable `MobaXterm.ini` from a default root (priority order) is `active`; later default-root copies and every extraDirs file are not. Do not search Program Files or parse `.mxtsessions`. Add `mobaxterm` to `package.json` `termeleon.sources` enum and keywords, and to `SOURCE_LABELS` in `src/extension.ts`. Re-run `test:parsers` until green

### 3. User and architecture docs — prose/policy

- Files: `README.md`, `STORE.md`, `memory-bank/productContext.md`, `memory-bank/systemPatterns.md`
- No tests: prose/policy artifact

1. Add MobaXterm to the supported-emulator lists: default files (`%USERPROFILE%\Documents\MobaXterm\MobaXterm.ini`, OneDrive-redirected Documents via `%OneDrive%\Documents\MobaXterm`, `%APPDATA%\MobaXterm\MobaXterm.ini`), extraDirs for `.mxtcolors` / theme `.ini`, active = first default-root `MobaXterm.ini` `[Colors]`
2. Known limits: unused built-in schemes that exist only as `DefaultColorScheme` indexes are not scanned (same class as Windows Terminal `defaults.json`); per-session `.mxtsessions` colors are not scanned; portable INI next to the exe, and `MobaXterm.exe -i <path>` overrides, are extraDirs-only; syntax highlighting is not a palette. Do not claim palettes live in the registry
3. Semantic mismatches: MobaXterm `r,g,b` decimals and British `Colour` keys
4. systemPatterns: MobaXterm is a walkable format and must take `extraDirs`; default roots are the Windows config directories including OneDrive-redirected Documents

## Technology Validation

No new technology - validation not required

## Dependencies

- Existing `Palette` / `normalizeColor` / `isUsable` / `fromFloatComponents`
- Existing `walk` / `readText` / `discoverThemes` / `extraDirs`
- Published INI `[Colors]` layout (Catppuccin `.mxtcolors`, iTerm2-Color-Schemes `mobaxterm/*.ini`, Dracula `MobaXterm.ini`)
- Windows `USERPROFILE`, `APPDATA`, and `ONEDRIVE` at scan time (ui-kind host). Linux CI uses extraDirs and mocked env, same as Windows Terminal `LOCALAPPDATA`

## Challenges & Mitigations

- Built-in scheme is only an index: if `[Colors]` lacks 16 RGB keys, `isUsable` drops it. Document as a known gap; do not vendor compiled presets
- extraDirs `.ini` false positives: only `.ini` and `.mxtcolors`, and only palettes that survive `isUsable` after `[Colors]` parse
- `.mxtsessions` encoding is version-dependent and undocumented: do not parse; document
- UTF-16 `MobaXterm.ini`: community theme files are UTF-8; `readText` is utf8 like every other source. If a real file is UTF-16, discovery misses it — same failure mode as a missing file, not a crash. Do not add a second decoder unless a fixture proves it
- Portable edition INI beside the exe, and `-i` override: no reliable path; extraDirs is the escape hatch
- Default-path tests on Linux CI: mock `USERPROFILE` / `APPDATA` / `ONEDRIVE` inside `withFixtureHome`; keep an extraDirs case so discovery is exercised without Windows env
- OneDrive Known Folder Move: probe `%OneDrive%\Documents` and `%USERPROFILE%\OneDrive\Documents` as well as plain Documents; first existing default-root `MobaXterm.ini` is the active one so Mirror does not get two globals

## Pre-Mortem

- We documented a gap and skipped the parser even though `[Colors]` is public and already used by theme packs: plan response — implement parser + discovery (steps 1–2); docs only for the index and session leftovers
- We treated `.mxtsessions` as in-scope and spent the build on a brittle `%`-field decoder: already covered by Challenge (sessions out of scope)
- We extended `normalizeColor` to `r,g,b` and broke unrelated parsers: already covered by Step 1 (`fromByteComponents` beside `fromFloatComponents`)
- Default-path discovery is untested on CI because `USERPROFILE` is unset: already covered by Challenge (mock env + extraDirs)
- Default Documents path misses OneDrive-signed-in profiles: already covered by Challenge (OneDrive roots + first-root-wins)

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
