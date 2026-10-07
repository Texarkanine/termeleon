---
task_id: windows-terminal-inbox-schemes
complexity_level: 2
date: 2026-10-07
status: completed
---

# TASK ARCHIVE: Windows Terminal inbox schemes and the theme just picked

## SUMMARY

Windows Terminal discovery lists inbox schemes from the install's `defaults.json` and mirrors the default profile's scheme when `settings.json` omits `colorScheme`. Mirror then re-reads the theme the emulator is using now, instead of the checkmark from the startup scan. A later pass retries a failed install lookup and points Mirror's home paths at the same directory discovery uses. The README notes for both were cut back to the length of the neighboring bullets.

## REQUIREMENTS

- Import lists inbox schemes when `settings.json` has an empty `schemes` array. A custom scheme of the same name replaces the inbox palette.
- An explicit `colorScheme` wins, including a value that does not name a scheme. When the key is omitted, the name comes from `defaults.json`, then `WINDOWS_TERMINAL_ASSUMED_COLOR_SCHEME`.
- After a theme pick in the emulator, Mirror applies that pick without walking theme directories again. The startup catalog stays the catalog. `termeleon.sources` still limits which emulators are read.
- A failed PowerShell lookup of the Windows Terminal install location is tried again on the next scan. A successful lookup that finds no package stays remembered.
- Mirror resolves `~/.alacritty`, Alacritty `~/` imports, and the Xresources dotfiles with `os.homedir()`, the same directory discovery uses.

## IMPLEMENTATION

`resolveWindowsTerminalActiveScheme` in `src/parsers/iterm2.ts` is the only place that knows the inbox file and the assumed name. `activeWindowsTerminalScheme` still reads one document and returns no names when the key is absent. Discovery pairs each `settings.json` with that install's `defaults.json`.

`commandMirror` calls `mirrorSelection`. Windows Terminal, kitty, MobaXterm, and Xresources are parsed from the live file. Ghostty and Alacritty picks use cached palettes. WezTerm and iTerm2 stay out. Cached theme objects are copied when Ghostty appearance is restamped.

`resolveWindowsTerminalDefaultsLookup` leaves the memo unset when PowerShell fails. `liveHome` calls `homeDir`.

Key files: `src/parsers/iterm2.ts`, `src/discover.ts`, `src/extension.ts`, `test/parsers.test.ts`, `test/discover.test.ts`, `README.md`.

## TESTING

Parser, discovery, cache, and host suites passed, and `npm run compile` succeeded. On this machine the host suite needs a writable `XDG_RUNTIME_DIR`. QA passed for the inbox-scheme work, the live-pick rework, and the lookup/home follow-up. The operator smoke-tested a Windows Terminal theme change and Mirror followed it. The formal red run for the live-pick tests was skipped once: a second `wtScheme` helper failed the suite before the new assertions could fail on their own.

## LESSONS LEARNED

On Windows Terminal 1.24, `defaults.json` is a legacy `profiles` array whose default profile already sets `colorScheme`. The assumed name is not the path a normal install takes. A test whose inbox file names a scheme other than Campbell is what keeps the file, rather than the constant, as the source of the name.

A cached `active` flag is the selection at scan time. A command that means "what is selected right now" has to re-read the file the emulator writes when the user picks a theme. Name-addressed picks still need the catalog. File-addressed picks have to be parsed again.

A failed external lookup must not be stored as "nothing installed." A successful empty result should be stored.

The first two preflights of the live-pick plan each restored a requirement the draft had dropped: `termeleon.sources`, and Alacritty configs that only import a theme and are not themselves cached themes.

## PROCESS IMPROVEMENTS

Nothing beyond those preflight catches. The merge-layer alternative for partial Windows Terminal schemes was recorded and not adopted. A missing test for stable-versus-Preview `defaults.json` pairing was left as optional hardening.

## TECHNICAL IMPROVEMENTS

Catalog at startup, selection at Mirror. Folding the live read back into `discoverThemes` would rescan theme directories on every Mirror. Merging the two Windows Terminal JSON documents into one effective settings file would copy a profile-list merge this project does not own.

The reflection's note that Mirror should prefer `HOME` over `os.homedir()` was wrong on Windows, where those directories can differ. The follow-up points both at `os.homedir()`.

## NEXT STEPS

None. The work is on branch `windows-terminal-color` for pull request 65.
