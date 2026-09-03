# Termeleon <img align="right" width="128" src="images/icon.png" alt="Termeleon logo">

[![Open VSX Version](https://img.shields.io/open-vsx/v/texarkanine/termeleon)](https://open-vsx.org/extension/texarkanine/termeleon)
[![codecov](https://codecov.io/github/Texarkanine/termeleon/graph/badge.svg)](https://codecov.io/github/Texarkanine/termeleon)

You've already picked how you want your terminal to look in your normal terminal emulator. Now make VS Code's terminal match it.

Termeleon scans the theme files and addons sitting on your local disk and applies them directly to the VS Code integrated terminal. You can quickly mirror what your emulator is currently running or pick from any of your installed themes.

| Terminal         | Linux | MacOS | Windows |
|------------------|-------|-------|---------|
| Alacritty        |✅|✅|✅|
| Ghostty          |✅|✅|-|
| kitty            |✅|✅|-|
| WezTerm          |✅|✅|-|
| Xresources       |✅|✅|-|
| iTerm2           |-|✅|-|
| MobaXTerm        |-|-|✅|
| Windows Terminal |-|-|✅|

## Requirements

None beyond VS Code itself.

`extensionKind` is `["ui"]`, which means the extension always runs on your **local machine** rather than on the remote. That is deliberate: we're guessing your terminal emulator also runs locally, so you probably want to see the themes from *that*.

Consequence: this extension does not work in VS Code for the Web (vscode.dev, github.dev) or in a browser-only Codespaces session. It is not offered for install there.

## Commands

Prefixed with `Termeleon: `

| Command | What it does |
| --- | --- |
| `Mirror Active Terminal Theme` | Applies whatever theme your emulator is configured to use right now. |
| `Remove Imported Terminal Theme` | Resets; removes only the keys this extension wrote. |
| `Import Terminal Theme…` | Scans the machine, shows a picker with live preview, writes the palette. |
| `Import to User Settings…` | Same, skipping the scope prompt. |
| `Import to Workspace Settings…` | Same, writing to `.vscode/settings.json`. |

## Formats read

| Emulator | Files | Active theme detected |
| --- | --- | --- |
| Alacritty | `~/.config/alacritty/**/*.toml`, `~/.alacritty/**/*.toml`, `%APPDATA%\alacritty\**\*.toml` | usable inline `alacritty.toml` (exact basename), else last usable `import` / `[general].import`. Relative import paths are from the config file; `%VAR%` is not expanded |
| Ghostty | `$XDG_CONFIG_HOME/ghostty/themes/*`, bundled app themes, inline config palettes | yes, including `theme = dark:X,light:Y` |
| iTerm2 | `*.itermcolors` under iTerm2 app support, bundled presets from `iTerm.app/Contents/Resources/ColorPresets.plist` | no (profile colors are saved in macOS preferences) |
| kitty | `~/.config/kitty/themes/*.conf`, `current-theme.conf`, `kitty.conf` | yes, via `current-theme.conf` |
| MobaXterm | `%USERPROFILE%\Documents\MobaXterm\MobaXterm.ini`, `%OneDrive%\Documents\MobaXterm\MobaXterm.ini`, `%APPDATA%\MobaXterm\MobaXterm.ini`; `.mxtcolors` / theme `.ini` via `extraDirectories` | yes, first default-root `MobaXterm.ini` |
| WezTerm | `~/.config/wezterm/colors/*.toml`, `~/.config/wezterm/*.toml` (user/addon files only) | no (config is dynamic Lua) |
| Windows Terminal | entries in `schemes` array of `settings.json` (custom/imported schemes only) | yes, via `profiles.defaults.colorScheme` or the default profile |
| Xresources | `~/.Xresources`, `~/.Xdefaults` | assumed active |

Add anything else (a dotfiles checkout, a downloaded theme pack) via `termeleon.extraDirectories`.

## Behavior worth knowing

**Writes flat, not theme-scoped.** By default the palette goes in at the top level of `workbench.colorCustomizations`, so it survives switching workbench themes. Set `scopeToActiveTheme` if you'd rather it apply only under your current theme.

**Sets `terminal.integrated.minimumContrastRatio` to 1.** VS Code otherwise nudges foreground colors toward a contrast target, and your palette won't render as the theme author wrote it. Disable via `setMinimumContrastRatio` if you want the accessibility adjustment back.

**Skips `terminal.selectionForeground`.** Writing that key disables the behavior where selected text keeps its own color. Opt in with `includeSelectionForeground`.

**Live preview writes real settings.** Arrowing through the list applies each theme so you can see it, and the pre-picker value is restored if you cancel. If the `settings.json` churn bothers you, set `livePreview` to false.

**Ghostty dark/light pairs follow auto-detect.** Mirror of `theme = dark:X,light:Y` writes both palettes as theme-scoped blocks named after your preferred dark and light workbench themes (the values of `workbench.preferredDarkColorTheme` and `workbench.preferredLightColorTheme`, for example `[One Dark Pro]` and `[GitHub Light]`). Those are the themes `window.autoDetectColorScheme` switches between. The extension does not turn auto-detect on for you. The import picker still applies one theme at a time.

## Semantic mismatches this handles

Emulators disagree about what to call the same pixel:

- Ghostty `cursor-color` / kitty `cursor` → `terminalCursor.foreground`
- Ghostty `cursor-text` / kitty `cursor_text_color` → `terminalCursor.background`
- Windows Terminal calls the magenta slot `purple`
- MobaXterm writes ANSI colors as `r,g,b` decimals and names fg/bg/cursor with British `Colour`
- Alacritty writes colors as `0xrrggbb`; Xresources uses `rgb:rr/gg/bb`
- iTerm2 stores 0..1 float components in an XML plist

## Known limits

- **Built-in presets vs addon files.** Termeleon scans theme files and addons on disk; it does not vendor static copies of upstream palettes or inspect binary internals.
  - **iTerm2:** Bundled presets (e.g. Pastel, Solarized, Tango) are scanned from `ColorPresets.plist` in the application bundle. Active profile colors configured dynamically in macOS preferences plist (`com.googlecode.iterm2.plist`) are not scanned.
  - **WezTerm:** Built-in schemes live compiled in Rust inside the binary and config is dynamic Lua, so only user `.toml` scheme files in `~/.config/wezterm/` are found.
  - **Windows Terminal:** Built-in preset schemes (e.g. Campbell, Vintage) are packaged in internal `defaults.json`. Only custom schemes defined in the `schemes` array of `settings.json` are discovered.
  - **MobaXterm:** Unused built-in dropdown schemes exist only as a `DefaultColorScheme` index and are not scanned. The applied `[Colors]` RGB in `MobaXterm.ini` is. Per-session colors in `.mxtsessions` are not. A portable INI next to the exe, or `MobaXterm.exe -i <path>`, is found only if you add that folder to `termeleon.extraDirectories`.
- **Alacritty YAML** (pre-0.13) is not read. The schema moved; supporting both doubles the parser for a deprecated format.
- **iTerm2 color spaces.** Entries tagged `Calibrated` rather than `sRGB` are read as sRGB. Slightly wrong, and the same approximation every porting tool makes.
- **256-color slots are ignored.** kitty and others define `color16`–`color255`; VS Code derives those from the base 16.

## Development

```sh
npm ci
npm run test:parsers   # no VS Code needed; parsers plus discovery against a fake HOME/XDG tree
npm run test:coverage  # parsers plus discovery with c8 coverage report
npm run test:host      # Extension Development Host; downloads VS Code on first run
npm run compile
npm run package        # writes termeleon-<version>.vsix (runs compile first)
```

Iterate with `test:parsers` / `compile` (and `test:host` when you touch apply or live preview). Sideload into the editor you actually use with `npm run package`, then **Install from VSIX…** (or `code --install-extension termeleon-*.vsix` / `cursor --install-extension …`). That is how you try the unpublished extension; there is no Marketplace listing yet.

`test:host` launches a throwaway VS Code (not your installed app) with a short temporary `--user-data-dir`. That isolation is required on macOS: the default path under this repo is too long for unix-domain sockets. It does not write your real user `settings.json`.

GitHub Actions runs `npm ci`, `npm run test:coverage`, `npm run compile`, and `npm run package` on pull requests and on push to `initialdev` or `main`, uploading coverage reports to Codecov. A tagged GitHub Release from release-please packages that VSIX, uploads it to the GitHub Release, and publishes it to Open VSX; it is not published to the Visual Studio Marketplace.

The parsers and discovery are plain Node with no `vscode` import, so they're testable outside the extension host and reusable as a CLI if you ever want the dotfiles-build-time version. `npm test` runs the parser suite first, then the host suite.
