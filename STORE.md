# Termeleon

Match your VS Code integrated terminal to the color schemes you already use in your external terminal emulator.

Termeleon scans the theme files and addons sitting on your local disk — Ghostty, kitty, Alacritty, WezTerm, iTerm2, Windows Terminal, and Xresources — and applies them directly to the VS Code integrated terminal, either mirroring what your emulator is currently running or letting you pick from your installed themes. Built-in presets compiled into terminal binaries (such as WezTerm and iTerm2) or package defaults (Windows Terminal) do not appear unless exported or installed as user theme files.

## Features

- **Live Preview:** Arrow through your installed themes in the picker to preview each palette live in your integrated terminal before applying.
- **Mirror Active Emulator Theme:** Match whatever theme your terminal emulator is running right now with a single command.
- **Ghostty Dark & Light Auto-Detect Pairs:** Automatically maps paired dark/light theme configurations to your preferred dark and light workbench themes.
- **Extra Directory Sweeping:** Point Termeleon at dotfiles repositories, custom theme directories, or downloaded theme packs.

## Commands

| Command | Description |
| --- | --- |
| `Termeleon: Import Terminal Theme…` | Browse all discovered local themes with live preview and apply your selection. |
| `Termeleon: Import Terminal Theme to User Settings…` | Import directly to user settings across all workspaces. |
| `Termeleon: Import Terminal Theme to Workspace Settings…` | Import specifically into the current `.vscode/settings.json`. |
| `Termeleon: Mirror Active Terminal Theme` | Read your emulator's current active theme and apply it immediately. |
| `Termeleon: Remove Imported Terminal Theme` | Surgically remove only the terminal color keys applied by Termeleon. |

## Supported Emulators

| Emulator | Formats and Locations | Active Theme Detection |
| --- | --- | --- |
| **Alacritty** | `~/.config/alacritty/**/*.toml` | `alacritty.toml` |
| **Ghostty** | Config files, bundled app themes, `$XDG_CONFIG_HOME/ghostty/themes/*` | Yes, including `theme = dark:X,light:Y` pairs |
| **iTerm2** | `*.itermcolors` plist files under Application Support (addon files only) | No |
| **kitty** | `current-theme.conf`, `kitty.conf`, `~/.config/kitty/themes/*.conf` | Yes, via `current-theme.conf` |
| **WezTerm** | User `*.toml` files in `~/.config/wezterm/` (addon files only) | No |
| **Windows Terminal** | Custom `schemes` in `settings.json` (user/imported schemes only) | Yes, via profile `colorScheme` |
| **Xresources** | `~/.Xresources`, `~/.Xdefaults` | Yes |

## Configuration

Customize Termeleon through your VS Code settings:

- `termeleon.target` (`ask` | `global` | `workspace`): Where to apply the imported palette (user or workspace settings). Default is `ask`.
- `termeleon.sources`: Limit scanning to specific emulators (e.g. `["ghostty", "kitty"]`). Default is all emulators.
- `termeleon.extraDirectories`: List of additional filesystem paths to sweep for theme files (e.g. `~/dotfiles/themes`).
- `termeleon.scopeToActiveTheme` (`boolean`): Nest colors under `[Your Current Theme]` so they apply only while that workbench theme is active. Default is `false` (palette applies across all workbench themes).
- `termeleon.setMinimumContrastRatio` (`boolean`): Set `terminal.integrated.minimumContrastRatio` to 1 so colors render exactly as authored. Default is `true`.
- `termeleon.livePreview` (`boolean`): Enable or disable live previewing when navigating the theme picker. Default is `true`.
