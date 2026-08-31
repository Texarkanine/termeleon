# Project Brief

## User Story

As a user who keeps theme files outside the emulator default paths, I want `terminalThemeImport.extraDirectories` to find Ghostty, kitty, Alacritty, and WezTerm files (not only iTerm2 `.itermcolors`) so a dotfiles checkout or downloaded pack shows up in the picker.

## Use-Case(s)

### Extra directory with mixed formats

The user points `extraDirectories` at a folder that contains Ghostty themes (no extension), kitty `.conf`, Alacritty/WezTerm `.toml`, and iTerm2 `.itermcolors`. Discovery lists each file under the matching source.

## Requirements

1. Extra directories are scanned for the formats already parsed, not only iTerm2.
2. A discovery test covers a fixture extra directory.

## Constraints

1. vscode-free core: discovery stays in `src/discover.ts` with no `vscode` import.
2. Discovery never throws; unreadable or unusable files stay off the list.
3. Do not invent new parsers. Route extra-dir files through the existing per-format parsers.

## Acceptance Criteria

1. As described in https://github.com/Texarkanine/vscode-terminal-themes/issues/2
2. Ghostty, kitty, Alacritty, and WezTerm files in an extra directory appear in `discoverThemes` results with the correct `source`.
3. iTerm2 `.itermcolors` in extra directories continue to be found.
4. A test uses a fixture extra dir and asserts those discoveries.
