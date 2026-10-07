---
task_id: windows-terminal-inbox-schemes
date: 2026-10-07
complexity_level: 2
---

# Reflection: Windows Terminal inbox schemes and mirror

## Summary

Windows Terminal discovery now reads inbox schemes from the install's `defaults.json` and marks the default profile's scheme active when `settings.json` omits `colorScheme`. The build matches the brief, and QA passed.

## Requirements vs Outcome

Every requirement landed. Custom schemes still replace an inbox palette of the same name. An explicit `colorScheme`, including a present value that does not name a scheme, still wins. The assumed name is the exported constant `WINDOWS_TERMINAL_ASSUMED_COLOR_SCHEME`, used only after `defaults.json` itself omits one. Nothing was descoped. The case-different name test (`Campbell` vs `campbell`) was a tighter lock on the case-insensitive replace the plan already required.

## Plan Accuracy

The sequence held: resolver, then discovery, then docs. The challenges that mattered showed up as tests rather than surprises: a present-but-unusable `colorScheme` must not fall through, and an assumed name with no loaded palette must not be marked active. Preflight's note to pin `source: 'explicit'` on unparseable user settings was the one plan gap, and it was a one-line test change.

## Build & QA Observations

The red runs failed on the new cases and left the old Windows Terminal reader green. QA passed with no findings. Host tests needed a writable `XDG_RUNTIME_DIR` on this WSL machine, which was already known.

## Insights

### Technical

- On Windows Terminal 1.24, `defaults.json` is a legacy `profiles` array whose default profile already sets `colorScheme`. The constant is not the path a normal install takes. A test whose inbox file names a scheme other than Campbell is what keeps the file, rather than the constant, as the source of the name.

### Process

- Nothing notable

### Million-Dollar Question

The shape we built is the one to keep. `activeWindowsTerminalScheme` stays a reader of one document and still returns no names when the key is absent. `resolveWindowsTerminalActiveScheme` is the only place that knows the inbox file and the constant. Merging the two JSON documents into one effective settings file would copy Windows Terminal's profile-list merge, which we do not own.

# Reflection: Mirror the theme just picked

Rework of the same task, after a smoke test of the inbox-scheme work. Date 2026-10-07.

## Summary

Mirror re-reads the theme the emulator just applied and does not walk theme directories again. The startup catalog still supplies named palettes. QA passed.

## Requirements vs Outcome

The locked behavior landed. A pick in the emulator, then Mirror, uses that pick. Hand-edited color codes inside a Ghostty or Alacritty theme file whose name did not change stayed out of scope. Windows Terminal scheme colors are read from the fresh `settings.json` and `defaults.json`, because those files are where the pick and the palette both live. Two requirements were missing from the first rework plan and were put back after preflight: honor `termeleon.sources`, and find an import-only `alacritty.toml` from known config bases rather than from cached origins.

## Plan Accuracy

The final plan's file list and sequence held. The surprises were in the first two drafts. An import-only Alacritty config is never a cached theme, so joining the config by cached origin drops Alacritty. A live parse of Windows Terminal, kitty, MobaXterm, or Xresources bypasses the catalog, so filtering cached themes afterward cannot enforce `termeleon.sources`. The formal red run was skipped once: a second `wtScheme` helper in the test file failed the suite before the new assertions could fail on their own.

## Build & QA Observations

Discovery, parser, cache, and host suites passed, and `npm run compile` succeeded. QA passed with no findings. Cached theme objects are copied when Ghostty appearance is restamped, so Import's checkmarks stay as scanned.

## Insights

### Technical

- A cached `active` flag is the selection at scan time. A command that means "what is selected right now" has to re-read the file the emulator writes when the user picks a theme. Name-addressed picks still need the catalog. File-addressed picks have to be parsed again.
- `os.homedir()` is fixed for the process. Mirror's live paths prefer `HOME` or `USERPROFILE` when set, which is what the discovery tests already arrange.

### Process

- The first two preflights each found a requirement the plan had dropped. Both would have shipped a Mirror that missed a real emulator pick.

### Million-Dollar Question

Catalog at startup, selection at Mirror. Folding the live read back into `discoverThemes` would rescan theme directories on every Mirror, which is the slow path this rework refused. `activeWindowsTerminalScheme` and the catalog scan stay as they are. `mirrorSelection` is the only place that knows the pick is newer than the cache.
