# Termeleon

You've already picked the theme you like for your terminal. Now make VS Code's terminal match it.

Termeleon scans the theme files and addons sitting on your local disk and applies them directly to the VS Code integrated terminal. You can quickly mirror what your emulator is currently running or pick from any of your installed themes.

| Terminal         | Linux | MacOS | Windows |
|------------------|-------|-------|---------|
| Alacritty        |✅|✅|✅|
| Ghostty          |✅|✅|-|
| kitty            |✅|✅|-|
| WezTerm          |📝|📝|-|
| Xresources       |✅|✅|-|
| iTerm2           |-|📝|-|
| MobaXTerm        |-|-|✅|
| Windows Terminal |-|-|✅|

✅ pick and mirror · 📝 pick only

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

## Configuration

Customize Termeleon through your VS Code settings:

- `termeleon.target` (`ask` | `global` | `workspace`): Where to apply the imported palette (user or workspace settings). Default is `ask`.
- `termeleon.sources`: Limit scanning to specific emulators (e.g. `["ghostty", "kitty"]`). Default is all emulators.
- `termeleon.extraDirectories`: List of additional filesystem paths to sweep for theme files (e.g. `~/dotfiles/themes`).
- `termeleon.scopeToActiveTheme` (`boolean`): Nest colors under `[Your Current Theme]` so they apply only while that workbench theme is active. Default is `false` (palette applies across all workbench themes).
- `termeleon.setMinimumContrastRatio` (`boolean`): Set `terminal.integrated.minimumContrastRatio` to 1 so colors render exactly as authored. Default is `true`.
- `termeleon.livePreview` (`boolean`): Enable or disable live previewing when navigating the theme picker. Default is `true`.
