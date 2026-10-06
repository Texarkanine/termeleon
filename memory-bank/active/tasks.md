# Task: Windows Terminal inbox schemes and mirror

* Task ID: windows-terminal-inbox-schemes
* Complexity: Level 2
* Type: simple enhancement

On Windows, discovery lists the schemes Windows Terminal offers: inbox schemes from the installation's `defaults.json`, plus custom schemes from `settings.json` (a custom scheme of the same name replaces the inbox palette). Mirror keeps using whatever discovery marks `active`. When `settings.json` names a `colorScheme` on the default profile or in `profiles.defaults`, that name stays the active one, including a `{ dark, light }` pair, and including a present value that does not resolve to a name. When `settings.json` omits `colorScheme`, the active name is read by running that same resolution on `defaults.json`. Only when `defaults.json` also omits it does discovery use `WINDOWS_TERMINAL_ASSUMED_COLOR_SCHEME`, one exported constant. A name is marked active only when a usable discovered scheme matches it. Discovery does not invent a palette.

## Test Plan (TDD)

### Behaviors to Verify

- [Explicit wins]: user default profile `colorScheme` is `Campbell`, inbox default profile `colorScheme` is `Vintage` → names `['Campbell']`, source `explicit`
- [Defaults inheritance stays explicit]: user default profile omits `colorScheme`, user `profiles.defaults.colorScheme` is `One Half Dark`, inbox file names `Vintage` → names `['One Half Dark']`, source `explicit`
- [Inbox file supplies the omitted default]: user settings omit `colorScheme`, `defaults.json` is a legacy `profiles` array whose `defaultProfile` has `colorScheme` `Vintage` → names `['Vintage']`, source `inbox` (not the constant)
- [No user file]: user settings argument is omitted, `defaults.json` names `Campbell` on its default profile → names `['Campbell']`, source `inbox`
- [Constant is the last resort]: both files omit `colorScheme` and the call uses the default argument → names `['Campbell']`, source `assumed`, and that string is `WINDOWS_TERMINAL_ASSUMED_COLOR_SCHEME`
- [Constant is the only knob]: both files omit `colorScheme`, call passes `assumedName` `Vintage` → names `['Vintage']`, source `assumed`
- [Present but unusable does not fall through]: user default profile `colorScheme` is `{}`, inbox file names `Campbell` → names `[]`, source `explicit`
- [Unparseable user settings do not assume]: user text is `{`, inbox file names `Campbell` → names `[]`
- [Dark/light pair still does not inherit]: user default profile `colorScheme` is `{ dark, light }` → those two names, source `explicit`
- [Existing explicit reader unchanged]: `activeWindowsTerminalScheme` on a document with no `colorScheme` key → `[]`
- [Inbox schemes are listed]: injected install whose `defaults.json` has one usable scheme and whose `settings.json` has `"schemes": []` → one `windows-terminal` theme, that name, origin the defaults file
- [Custom palette replaces inbox]: both files define `Campbell` with different ANSI green → the theme's green is the settings value, origin the settings file
- [Active palette can live only in defaults]: settings omit `colorScheme` and have no schemes, defaults name `Vintage` and define that scheme → `Vintage` is active
- [Explicit name, inbox palette]: settings `colorScheme` is `Campbell`, `schemes` is empty, only defaults defines `Campbell` → `Campbell` is active, origin the defaults file
- [Assumption needs a loaded scheme]: both files omit `colorScheme`, the assumed name is not among the schemes → no `windows-terminal` theme is active
- [Broken inbox file]: `defaults.json` is `{`, settings define one usable scheme and name it → that scheme is present and active; no throw
- [Short palette dropped]: a defaults scheme with fewer than 16 ANSI colors → absent
- [No files injected, `LOCALAPPDATA` unset]: `discoverThemes({ sources: ['windows-terminal'] })` → no `windows-terminal` themes
- [Appx stdout]: `parseAppxInstallLocations` on two `InstallLocation` lines → those two paths; empty or whitespace stdout → `[]`
- [Off win32]: `windowsTerminalDefaultsFiles()` → `[]`

### Test Infrastructure

- Framework: Node `assert` plus the `test()` helper in `test/parsers.test.ts` and `test/discover.test.ts`, run with `tsx` via `npm run test:parsers`
- Test location: `test/parsers.test.ts` for the resolver; `test/discover.test.ts` for discovery and the Appx stdout parser
- Conventions: inline JSON for parser cases; discovery cases that touch the filesystem use `withFixtureHome` or temp files and pass paths in `DiscoverOptions`. Assertions are on names, `active`, `origin`, and palette fields. `withFixtureHome` already deletes `LOCALAPPDATA`.
- New test files: none

## Implementation Plan

### 1. Active-scheme resolution — executable ✅

- Files: `src/parsers/iterm2.ts`, `test/parsers.test.ts`

1. Stub tests: add empty cases in `test/parsers.test.ts` for the behaviors listed above that call the resolver and `WINDOWS_TERMINAL_ASSUMED_COLOR_SCHEME`. Leave the existing `activeWindowsTerminalScheme` cases as they are.
2. Stub interface: export `WINDOWS_TERMINAL_ASSUMED_COLOR_SCHEME` and `resolveWindowsTerminalActiveScheme(userSettings: string | undefined, defaultsText: string | undefined, assumedName?: string): { names: string[]; source: 'explicit' | 'inbox' | 'assumed' }` from `src/parsers/iterm2.ts`, with a doc comment that `explicit` means the user file contained a `colorScheme` key, `inbox` means that key was absent and `defaults.json` contained one, and `assumed` means neither file contained one. Empty bodies.
3. Write tests and run red: fill the assertions. `activeWindowsTerminalScheme` stays the explicit reader and still returns `[]` when the key is absent. Run `npx tsx test/parsers.test.ts` and confirm the new cases fail.
4. Write code and run green: implement the resolver with the existing profile walk (`undefined` from the colorScheme reader means the key is absent; an array means it is present). Order: user file, then defaults file, then `[assumedName]` when `assumedName` is non-empty. Unparseable user text yields `names: []` and does not consult the defaults file. Run `npx tsx test/parsers.test.ts` until the new cases and the existing Windows Terminal cases pass.

### 2. Discovery of inbox schemes — executable ✅

- Files: `src/discover.ts`, `test/discover.test.ts`

1. Stub tests: add empty cases in `test/discover.test.ts` for the discovery, Appx-stdout, and off-win32 behaviors above.
2. Stub interface: export `parseAppxInstallLocations(stdout: string): string[]` and `windowsTerminalDefaultsFiles(): string[]`. Add optional `windowsTerminalFiles?: { settings?: string; defaults?: string }[]` to `DiscoverOptions`. `discoverWindowsTerminal` reads that option. Empty bodies, and `windowsTerminalDefaultsFiles` returns `[]` until step 4.
3. Write tests and run red: write temp `settings.json` / `defaults.json` files and pass them in `windowsTerminalFiles`. Palettes in those files include all 16 ANSI colors so `isUsable` keeps them. Run `npx tsx test/discover.test.ts` and confirm the new cases fail. The off-win32 case is skipped when `process.platform === 'win32'`, matching `windowsDocumentsDir`.
4. Write code and run green: when `windowsTerminalFiles` is passed, scan only those pairs and do not read `LOCALAPPDATA` or spawn. Otherwise keep today's three `settings.json` candidates, and pair the Store and Preview candidates with `windowsTerminalDefaultsFiles()` (powershell `Get-AppxPackage` for `Microsoft.WindowsTerminal` and `Microsoft.WindowsTerminalPreview`, `InstallLocation` + `defaults.json`, memoized, no spawn unless `process.platform === 'win32'`). For each pair, parse schemes from defaults then settings; a settings scheme with the same name (case-insensitive) replaces the inbox palette and origin. Active names come from `resolveWindowsTerminalActiveScheme` for that pair. Mark `active` only through `isWindowsTerminalSchemeActive` against usable schemes. A missing or unreadable file is skipped. Run `npx tsx test/discover.test.ts`, then `npm run test:parsers`.

### 3. Docs for the retired limit — prose/policy ✅

- Files: `README.md`, `memory-bank/productContext.md`, `memory-bank/systemPatterns.md`
- No tests: prose/policy artifact

1. In `README.md`, change the Windows Terminal row and the Known limits bullet so inbox schemes are read from `defaults.json`, custom `settings.json` schemes still apply and replace an inbox scheme of the same name, and an omitted `colorScheme` uses the inbox file's own resolved scheme, then `WINDOWS_TERMINAL_ASSUMED_COLOR_SCHEME`.
2. In `memory-bank/productContext.md` and `memory-bank/systemPatterns.md`, replace the sentence that says Windows Terminal built-ins are not scanned with the same contract.

## Technology Validation

No new technology - validation not required. Package lookup reuses `spawnSync('powershell', ...)`, which `windowsDocumentsDir` already uses.

## Dependencies

- `powershell.exe` on win32 for `Get-AppxPackage`, the same host `windowsDocumentsDir` already requires. Linux CI never calls it.
- No new npm packages.

## Challenges & Mitigations

- [Store `defaults.json` may be unreadable]: discovery already swallows a failed read. Custom `settings.json` schemes still appear. Tests inject paths and never open `WindowsApps`.
- [This install's `defaults.json` has no `profiles.defaults.colorScheme`]: it is a legacy `profiles` array whose `defaultProfile` (Windows PowerShell) sets `colorScheme` to Campbell. `activeWindowsTerminalScheme` already reads that shape, so the inbox step returns Campbell from the file. The constant is not on that path.
- [A present but empty `colorScheme` must not become Campbell]: the resolver treats "key present" and "key absent" differently. A test locks the `{}` case.
- [Stable and Preview both installed]: each pair is resolved on its own. Two active schemes become two Mirror candidates, which is the current multi-active behavior.
- [Unpackaged install has no Appx `defaults.json`]: that pair contributes `settings.json` schemes only. Implicit inbox mirroring happens when a defaults file was found.
- [Linux CI]: `windowsTerminalDefaultsFiles()` returns `[]` off win32. Discovery tests pass `windowsTerminalFiles` and unset `LOCALAPPDATA`.

## Pre-Mortem

- [The constant becomes the source of Campbell even when `defaults.json` names a scheme]: the resolver checks the inbox file before the constant. The Vintage-from-defaults test fails if that order flips.
- [The explicit reader grows the assumption and the old "no colorScheme → []" test is rewritten to match]: that test stays. The new behavior is `resolveWindowsTerminalActiveScheme` only.
- [Mirror lights up a name that has no palette]: `active` is set only when a usable scheme matched. The "assumed name not loaded" test fails if a theme is marked active anyway.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [x] Preflight
- [x] Build
- [ ] QA
