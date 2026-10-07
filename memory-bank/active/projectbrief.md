# Project Brief

## User Story

As someone who set up colors in Windows Terminal, I want Termeleon to list those schemes and mirror the one my default profile is using, so the VS Code terminal matches Windows Terminal even when I never wrote a custom scheme into `settings.json`.

## Use-Case(s)

### Use-Case 1

A Windows install has only the inbox schemes. The Color schemes page shows them, and `settings.json` has an empty `schemes` array. Import lists those inbox schemes.

### Use-Case 2

The default profile has no `colorScheme`, and `profiles.defaults` has none either. Mirror still applies the scheme Windows Terminal is using for that profile.

### Use-Case 3

`settings.json` names a scheme explicitly on the default profile or in `profiles.defaults`. Mirror applies that scheme.

## Requirements

1. On Windows, discovery includes the color schemes Windows Terminal offers: the inbox schemes in `defaults.json`, and any custom schemes in `settings.json`.
2. Mirror applies the scheme the default profile is using.
3. When `settings.json` has no explicit `colorScheme`, Mirror still applies a scheme. Most people never set one.
4. The assumed default for that omitted case lives in one place in the code, so it can be changed if Windows Terminal's default changes.
5. Prefer reading that default out of `defaults.json`, so the name comes from Windows Terminal rather than a scheme name Termeleon bakes in and ships. The palette for the mirrored scheme comes from Windows Terminal's file.

## Constraints

1. An omitted `colorScheme` is an assumption. The code must make that assumption visible and configurable, and must not pretend it read an explicit user setting.
2. Existing explicit `colorScheme` behavior stays: the default profile's value wins over `profiles.defaults`, including a `{ dark, light }` pair.

## Acceptance Criteria

1. A Windows Terminal install whose `settings.json` `schemes` array is empty still contributes its inbox schemes to the picker.
2. Mirror applies the resolved scheme when both the default profile and `profiles.defaults` omit `colorScheme`.
3. The assumed scheme name is defined in one place in the code.
4. When `defaults.json` states the default, that file is the source of the name and of the palette. A baked-in name is only the configurable stand-in for when the file does not state one.

## Rework

### Smoke test

On 2026-10-07, Windows Terminal **Set as default** switched the live scheme to One Half Dark. `settings.json` had `profiles.defaults.colorScheme` set to that name, and a fresh resolve of the file returned it. A second Mirror in the same window still offered Campbell, the scheme from the scan at startup.

### Locked behavior

The user already runs Termeleon. They open their terminal emulator, look through its themes, and pick one. The emulator changes. They come back to VS Code and run Mirror. The integrated terminal matches the theme they just picked.

They are choosing a theme the emulator already offered. They are not typing color codes. A person who hand-edits color codes can hand-edit VS Code settings. That is not this fix.

### Requirements

1. Mirror applies the theme the emulator is using now, after a pick made since this window started.
2. Mirror does not walk theme directories again. The catalog from the startup scan stays the catalog.
3. A theme file that was not in that catalog can stay invisible until the window is reloaded.
4. Import keeps using the cached catalog, including its checkmarks from scan time.

### What a pick looks like

- Windows Terminal stores the pick as a scheme name in `settings.json`. Mirror re-reads `settings.json` and `defaults.json` and uses the palette in those files. Those two files are the scheme catalog.
- Ghostty stores the pick as a theme name. Mirror reads that name from the live config and uses the cached palette for the name.
- Alacritty stores the pick as the config file or the last usable import. Mirror reads that path and uses the cached palette for the file.
- MobaXterm and kitty store the pick by writing the chosen theme into one known file (`MobaXterm.ini`, `current-theme.conf`). That write is the emulator recording the pick. Mirror re-reads that file. The cached copy of the file is the previous pick.
- Xresources is the two known dotfiles. Mirror re-reads them.
- WezTerm and iTerm2 do not report a live theme. Mirror does not start reporting one.

Editing the color codes inside a theme file while the emulator's selection still names that same theme is out of scope. A Ghostty theme file keeps the palette from the startup scan until reload. Windows Terminal is the exception: the scheme colors live in the two files Mirror re-reads, so a fresh parse of those files is the palette.
