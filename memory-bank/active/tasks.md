# Current Task: issue-2-extra-directories

**Complexity:** Level 1

## What broke

`discoverThemes` passed `extraDirs` only to `discoverIterm2`. Ghostty, kitty, Alacritty, and WezTerm files in `terminalThemeImport.extraDirectories` never appeared in the picker.

## Why

iTerm2 was the first (and only) source that accepted extra directories, because its default scan is macOS app-support plus optional extra packs of `.itermcolors`. The option's docs already described any extra theme files.

## What changed

Each walkable discoverer now receives `extraDirs`:

- Ghostty: extra dirs are additional theme directories (all files, same as bundled theme dirs)
- kitty: extra dirs are walked for `.conf`
- Alacritty: extra dirs are additional bases walked for `.toml`
- WezTerm: extra dirs are walked for `.toml`
- iTerm2: unchanged (`.itermcolors`)

Windows Terminal and Xresources stay on their fixed paths (settings.json locations, `~/.Xresources` / `~/.Xdefaults`).

## Files affected

- `src/discover.ts`
- `test/parsers.test.ts`
- `test/fixtures/extra/`

## QA - COMPLETE (PASS)

- All plan requirements, acceptance criteria, and constraints verified against commit `18633be`.
- `npm run test:parsers` (12 passed) and `npm run compile` re-verified independently.
- Two non-blocking advisories: Ghostty's pre-existing dedup-by-stem can hide an extra-dir file
  that shares a name with a bundled theme; Alacritty's filename-based active flag would
  misfire on an extra-dir file literally named `alacritty.toml`. Neither is required to change
  for this issue and neither is a regression introduced by this change.
- Full findings: `memory-bank/active/.qa-validation-status`.
