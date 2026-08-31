# Terminal Theme Import

You already picked a color scheme for your terminal emulator. This reads the theme
files sitting on your disk and applies one of them to the VS Code integrated
terminal, either mirroring what your emulator currently uses or letting you drive
the two independently.

## Requirements

None beyond VS Code itself. The extension runs in VS Code's bundled Node
runtime, so **you do not need Node.js installed** — `fs`, `os` and `path` come
from the extension host, and the only third-party dependency is bundled into a
single file at build time.

`extensionKind` is `["ui"]`, which means the extension always runs on your local
machine rather than on the remote. That is deliberate: your terminal emulator's
theme files live locally, so a Remote-SSH, WSL, devcontainer or Codespaces
extension host would scan a filesystem that has no themes on it and show you an
empty picker.

Consequence: this extension does not work in VS Code for the Web (vscode.dev,
github.dev) or in a browser-only Codespaces session, because those have no Node
runtime and no local filesystem to read. It is not offered for install there
rather than installing and silently doing nothing.

## Commands

| Command | What it does |
| --- | --- |
| `Terminal Theme: Import Terminal Theme…` | Scans the machine, shows a picker with live preview, writes the palette. |
| `Terminal Theme: Import to User Settings…` | Same, skipping the scope prompt. |
| `Terminal Theme: Import to Workspace Settings…` | Same, writing to `.vscode/settings.json`. |
| `Terminal Theme: Mirror Active Terminal Theme` | Applies whatever theme your emulator is configured to use right now. |
| `Terminal Theme: Remove Imported Terminal Theme` | Removes only the keys this extension wrote. |

## Formats read

| Emulator | Files | Active theme detected |
| --- | --- | --- |
| Ghostty | `$XDG_CONFIG_HOME/ghostty/themes/*`, bundled app themes, inline config palettes | yes, including `theme = dark:X,light:Y` |
| kitty | `~/.config/kitty/themes/*.conf`, `current-theme.conf`, `kitty.conf` | yes, via `current-theme.conf` |
| Alacritty | `~/.config/alacritty/**/*.toml` | `alacritty.toml` assumed active |
| WezTerm | `~/.config/wezterm/colors/*.toml` | no |
| iTerm2 | `*.itermcolors` under iTerm2 app support | no |
| Windows Terminal | every entry in the `schemes` array of `settings.json` | yes, via `profiles.defaults.colorScheme` or the default profile |
| Xresources | `~/.Xresources`, `~/.Xdefaults` | assumed active |

Add anything else (a dotfiles checkout, a downloaded theme pack) via
`terminalThemeImport.extraDirectories`.

## Behavior worth knowing

**Writes flat, not theme-scoped.** By default the palette goes in at the top level
of `workbench.colorCustomizations`, so it survives switching workbench themes.
Set `scopeToActiveTheme` if you'd rather it apply only under your current theme.

**Sets `terminal.integrated.minimumContrastRatio` to 1.** VS Code otherwise nudges
foreground colors toward a contrast target, and your palette won't render as the
theme author wrote it. Disable via `setMinimumContrastRatio` if you want the
accessibility adjustment back.

**Skips `terminal.selectionForeground`.** Writing that key disables the behavior
where selected text keeps its own color. Opt in with `includeSelectionForeground`.

**Removal is surgical.** The extension records exactly which keys it wrote and
removes only those. If that record is gone (new machine, cleared storage) it asks
before falling back to clearing all terminal color keys.

**Live preview writes real settings.** Arrowing through the list applies each theme
so you can see it, and the pre-picker value is restored if you cancel. If the
`settings.json` churn bothers you, set `livePreview` to false.

**Ghostty dark/light pairs follow auto-detect.** Mirror of
`theme = dark:X,light:Y` writes both palettes as theme-scoped blocks named after
your preferred dark and light workbench themes (the values of
`workbench.preferredDarkColorTheme` and `workbench.preferredLightColorTheme`,
for example `[One Dark Pro]` and `[GitHub Light]`). Those are the themes
`window.autoDetectColorScheme` switches between. The extension does not turn
auto-detect on for you. The import picker still applies one theme at a time.

## Semantic mismatches this handles

Emulators disagree about what to call the same pixel:

- Ghostty `cursor-color` / kitty `cursor` → `terminalCursor.foreground`
- Ghostty `cursor-text` / kitty `cursor_text_color` → `terminalCursor.background`
- Windows Terminal calls the magenta slot `purple`
- Alacritty writes colors as `0xrrggbb`; Xresources uses `rgb:rr/gg/bb`
- iTerm2 stores 0..1 float components in an XML plist

## Known limits

- **Alacritty YAML** (pre-0.13) is not read. The schema moved; supporting both
  doubles the parser for a deprecated format.
- **WezTerm built-in schemes** live in Lua inside the binary, not on disk, so only
  user scheme files are found.
- **iTerm2 color spaces.** Entries tagged `Calibrated` rather than `sRGB` are read
  as sRGB. Slightly wrong, and the same approximation every porting tool makes.
- **256-color slots are ignored.** kitty and others define `color16`–`color255`;
  VS Code derives those from the base 16.

## Development

```sh
npm ci
npm run test:parsers   # no VS Code needed; parsers plus discovery against a fake HOME/XDG tree
npm run compile
```

GitHub Actions runs those same commands on pull requests and on push to `initialdev` or `main`.

The parsers and discovery are plain Node with no `vscode` import, so they're
testable outside the extension host and reusable as a CLI if you ever want the
dotfiles-build-time version.
