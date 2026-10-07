# Task: Mirror the theme just picked

* Task ID: windows-terminal-inbox-schemes
* Complexity: Level 2
* Type: bug fix

Mirror applies the theme the user just picked in an emulator. It re-reads that live selection and does not walk theme directories again. The startup cache remains the catalog. Hand-edited color codes inside a theme file whose name did not change are out of scope.

## Test Plan (TDD)

### Behaviors to Verify

- [Stale Windows Terminal flag loses]: cache marks Campbell active and One Half Dark inactive; fresh `settings.json` names One Half Dark and both palettes are in the cache → Mirror's Windows Terminal theme is One Half Dark, and its palette is the cached One Half Dark palette
- [Windows Terminal name with no palette]: fresh settings name a scheme that is neither in the fresh scheme files nor in the cache → no Windows Terminal theme
- [Windows Terminal omitted name uses the fresh defaults file]: cache marks Campbell active; fresh settings omit `colorScheme`; fresh `defaults.json` names Vintage on the default profile and defines that scheme → Vintage, not Campbell
- [Unreadable Windows Terminal settings do not revive the cache]: cache marks Campbell active; the settings read is missing → no Windows Terminal theme
- [Ghostty pick joins the cache by name]: cache has themes A (active) and B (inactive) with different palettes; fresh config is `theme = B`; the theme-file paths are not read → B is active with the cached B palette, and A is not active
- [Ghostty dark/light pick restamps appearance]: cache has A and B with no appearance; fresh config is `theme = dark:A,light:B` → A is active dark, B is active light, and `activeGhosttyPair` returns that pair
- [Ghostty name missing from the cache]: fresh config is `theme = New`; cache has only Old, marked active → no Ghostty theme
- [Ghostty config with no theme line keeps a cached inline theme]: cache has one active Ghostty entry whose origin is the config path and whose name is the inline label; fresh config has palette lines and no `theme =` → that cached entry stays active with its cached palette
- [Ghostty named theme does not stay active after the config stops naming it]: cache has named theme A active; fresh config has no `theme =` → A is not active
- [Alacritty import pick joins the cache by path]: cache has the config and two imported themes, the first marked active; fresh config imports the second; theme-pack paths are not read → the second cached theme is active with its cached palette
- [Alacritty import missing from the cache]: fresh config imports a path that is not a cached origin; cache has another Alacritty theme marked active → no Alacritty theme
- [Alacritty config file that is itself a palette]: fresh config text is a usable palette; cache has that config path → that cached theme is active with its cached palette
- [kitty pick is the fresh current-theme.conf]: cached kitty palette differs from the fresh `current-theme.conf` text; `themes/` paths are not read → the result palette is the fresh parse
- [MobaXterm pick is the fresh ini]: cached `MobaXterm.ini` palette differs from the fresh ini text; `.mxtcolors` paths are not read → the result palette is the fresh parse
- [Xresources pick is the fresh dotfile]: cached `.Xresources` palette differs from the fresh file text → the result palette is the fresh parse
- [Sources that never report a live theme stay out]: cache marks a WezTerm theme and an iTerm2 theme active → neither is in the result
- [Several emulators can all be live]: fresh Windows Terminal, Alacritty, and MobaXterm selections each resolve → three active themes, one per source
- [Empty catalog and no live files]: cache is empty and every read is missing → no themes

### Test Infrastructure

- Framework: Node `assert` plus the `test()` helper in `test/discover.test.ts`, run with `tsx` via `npm run test:parsers`
- Test location: `test/discover.test.ts`
- Conventions: discovery cases build themes and file text in the test and pass them in. Assertions are on `source`, `name`, `active`, `appearance`, and palette fields. A recording `readText` proves theme-directory paths are not opened.
- New test files: none

## Implementation Plan

### 1. Live selection for Mirror — executable

- Files: `src/discover.ts`, `test/discover.test.ts`

1. Stub tests: add empty cases in `test/discover.test.ts` for the behaviors above. Each case calls `mirrorLiveThemes`.
2. Stub interface: export `MirrorLiveReaders` and `mirrorLiveThemes(cached: DiscoveredTheme[], readers: MirrorLiveReaders): DiscoveredTheme[]` from `src/discover.ts`. Document that the result is the themes Mirror should offer: live files are re-read through `readers`, named Ghostty and Alacritty picks use cached palettes, MobaXterm, kitty, Xresources, and Windows Terminal scheme files are parsed from those reads, and a cached `active` flag is not evidence. Empty body returns `[]`.
3. Write tests and run red: fill the assertions. `readers.readText` records paths. Ghostty theme-directory paths, Alacritty theme-pack paths, and MobaXterm `.mxtcolors` paths must not be recorded. Run `npx tsx test/discover.test.ts` and confirm the new cases fail.
4. Write code and run green: implement `mirrorLiveThemes` with `readers` supplying `readText`, `windowsTerminalInstalls`, `ghosttyConfigPaths`, `alacrittyConfigPaths`, `kittyCurrentThemePath`, `mobaIniPaths`, and `xresourcesPaths`. Windows Terminal uses `resolveWindowsTerminalActiveScheme` and `parseWindowsTerminal` on the install pair only. Ghostty uses `activeGhosttyThemes` on config paths only, then matches cached Ghostty names; a config with no `theme =` keeps a cached inline entry whose origin is that config and drops other Ghostty actives. Alacritty re-reads cached `alacritty.toml` origins, follows imports, and matches the active path to a cached origin. kitty, MobaXterm ini paths from the cache, and the Xresources paths are parsed fresh. WezTerm and iTerm2 are omitted. Run `npx tsx test/discover.test.ts` until the new cases pass.

### 2. Mirror command uses the live selection — executable

- Files: `src/extension.ts`, `src/discover.ts`, `test/discover.test.ts`

1. Stub tests: add one empty case, `defaultMirrorLiveReaders` reports the live paths and not a theme directory. The case passes a fake home and asserts the Ghostty path is the config file, the kitty path is `current-theme.conf`, and the Xresources paths are the two dotfiles.
2. Stub interface: export `defaultMirrorLiveReaders(): MirrorLiveReaders` from `src/discover.ts` with an empty body.
3. Write tests and run red: fill the path assertions. Run `npx tsx test/discover.test.ts` and confirm the case fails.
4. Write code and run green: `defaultMirrorLiveReaders` uses the existing config locations (`ghosttyDirs` configs, `windowsTerminalInstalls`, cached `alacritty.toml` and `MobaXterm.ini` origins, kitty `current-theme.conf`, and the two Xresources files) and `readText`. `commandMirror` in `src/extension.ts` takes the cached list from `collect()` and passes `mirrorLiveThemes(cached, defaultMirrorLiveReaders())` to `mirrorCandidates`. It does not filter on the cached `active` flag. Run `npx tsx test/discover.test.ts`.

### 3. Document the Mirror read — prose/policy

- Files: `README.md`, `memory-bank/systemPatterns.md`
- No tests: prose/policy artifact

1. In `README.md` Known limits, add that Mirror re-reads the emulator's current theme selection and does not rescan theme directories. A theme file added after the window started can stay hidden until the window is reloaded. Hand-editing color codes inside a theme file whose selection name did not change is not picked up.
2. In `memory-bank/systemPatterns.md`, state that `commandMirror` calls `mirrorLiveThemes` on the cached catalog. `ThemeCache` remains process-lifetime for Import and for named palettes. A window reload is still a new catalog scan.

## Technology Validation

No new technology - validation not required.

## Dependencies

- The existing parsers and `ThemeCache`. No new packages. No additional PowerShell spawn: `windowsTerminalDefaultsFiles` and `windowsDocumentsDir` stay memoized, and Mirror does not need a new Documents lookup when the ini path is already on a cached theme.

## Challenges & Mitigations

- [A failed live read falls back to the cached `active` flag]: every behavior above expects the stale flag to lose, including a missing settings file. `mirrorLiveThemes` never copies `cached.active` onto the result except the Ghostty inline-config case, which is matched by origin rather than by the flag alone.
- [Alacritty or MobaXterm config discovery walks `extraDirectories`]: config paths come from cached origins whose basenames are `alacritty.toml` and `mobaxterm.ini`. The recording `readText` tests fail if a theme-pack path is opened.
- [Ghostty dark/light pair breaks because appearance is left as scanned]: the dark/light behavior sets `appearance` from the fresh config, and the test calls `activeGhosttyPair`.
- [Several Windows Terminal installs]: `windowsTerminalInstalls` returns each settings/defaults pair, and each pair is resolved on its own, matching discovery.
- [kitty or MobaXterm theme pick only changes the one live file]: those two behaviors compare a cached palette against a fresh parse and expect the fresh palette.

## Pre-Mortem

- [Mirror still filters `collect()` on `active` and the new function is unused]: step 2 names `commandMirror` as the call site. The discover tests cannot see that call, so the step is not done until `commandMirror` passes `mirrorLiveThemes` into `mirrorCandidates`.
- [The live read grows into `discoverThemes` and Mirror becomes a full scan]: `mirrorLiveThemes` takes explicit path readers and has no `walk`. The recording-reader tests fail if a theme directory is opened.
- [MobaXterm and kitty keep the cached palette, so a real theme pick in those apps stays stale]: their behaviors require the fresh parse. That is the emulator writing the chosen theme into the one live file, not a hand-edit of color codes in a theme pack.

## Status

- [x] Initialization complete
- [x] Test planning complete (TDD)
- [x] Implementation plan complete
- [x] Technology validation complete
- [x] Pre-Mortem complete
- [ ] Preflight
- [ ] Build
- [ ] QA
