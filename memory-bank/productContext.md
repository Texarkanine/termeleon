# Product Context

## Target Audience

People who already chose a color scheme for a terminal emulator — Ghostty, kitty, Alacritty, WezTerm, iTerm2, Windows Terminal, or Xresources — and want the VS Code integrated terminal to use that same palette. They may want it to match the emulator they are running right now, or to pick a scheme they keep on disk independently of whichever emulator is active.

## Use Cases

- Scan the machine for theme files already installed for those emulators, pick one from a list, and apply it to the VS Code terminal — with a live look at each candidate before committing.
- Mirror whatever theme the emulator is configured to use right now, without browsing a list.
- Write the palette into user settings (everywhere) or workspace settings (this project only).
- Undo the import by removing only the colors this extension wrote, leaving other workbench color customizations alone.
- Point the scanner at extra folders (a dotfiles checkout, a downloaded theme pack) when the files are not in the emulator's default locations.

## Key Benefits

- Reuses palettes the user already maintains instead of asking them to re-author ANSI colors, cursor colors, and selection colors in VS Code's settings format.
- Reads several emulator file formats and maps their disagreeing names onto the integrated terminal's color keys.
- Applies colors so they survive switching workbench themes, unless the user asks to nest them under the current theme only.
- Removal is surgical when the extension still remembers what it wrote.

## Success Criteria

- After import, the integrated terminal's ANSI colors, background, foreground, and cursor colors match the chosen emulator theme as the author wrote them — not a contrast-adjusted approximation — unless the user opts out of disabling VS Code's contrast nudge.
- The picker lists themes found on the local machine. An empty list means none were found, not a silent failure.
- Canceling a live preview restores the previous colors.
- Removing an import does not clear terminal colors the user set by hand, unless they confirm a fallback sweep after the ownership record is gone.

## Key Constraints

- The extension must run on the local machine. Theme files live next to the user's terminal emulator; a remote window (SSH, WSL, a container, Codespaces) would scan a filesystem that has none of those files and show an empty picker.
- It is not offered in VS Code for the Web or browser-only Codespaces sessions: those have no Node runtime and no local filesystem to read.
- It does not invent or ship palettes. It only reads files that are already on disk.
- It writes terminal colors as settings customizations, not as a separate color theme in the theme picker.
- Format gaps that are in-scope to know, not accidental omissions: Alacritty YAML (pre-0.13) is not read; WezTerm built-in schemes live in the binary, so only user scheme files are found; iTerm2 entries tagged Calibrated rather than sRGB are treated as sRGB; 256-color slots beyond the base 16 are ignored; Ghostty dark/light pairs are listed separately in the picker, and Mirror writes them as paired auto-detect blocks under the preferred dark and light workbench themes without turning `window.autoDetectColorScheme` on.
- Licensed AGPL-3.0-or-later. Requires VS Code 1.75 or later.
