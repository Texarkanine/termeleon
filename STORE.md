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
| `Termeleon: Reapply Last Theme` | Rewrite the last imported or mirrored palette using your current Termeleon settings. |
| `Termeleon: Remove Imported Terminal Theme` | Surgically remove only the terminal color keys applied by Termeleon. |

## Configuration

Customize Termeleon through your VS Code settings. They appear in three groups.

**Command Palette UI Behavior** (takes effect on the next pick or scan):

- `termeleon.target` (`ask` | `global` | `workspace`): Which settings file to use for the imported palette. `ask` prompts each time; with no folder open it always uses user settings. Default is `ask`.
- `termeleon.livePreview` (`boolean`): Apply each theme as you navigate through the list. Turn off if the settings.json churn is disruptive. Default is `true`.

**Theme Discovery** (takes effect on the next pick or scan):

- `termeleon.sources`: Emulators to scan. Empty means all of them.
- `termeleon.extraDirectories`: Additional directories to sweep for theme files, e.g. a dotfiles checkout.

**Color Preferences when Applying New Themes** (takes effect on the next Import, Mirror, or Reapply):

- `termeleon.scopeToActiveTheme` (`boolean`): On: imported colors are attached to the Color Theme that was active at import; switching Color Theme uses that theme's terminal colors. Off: Termeleon's colors stay when you switch Color Themes. Default is `true`.
- `termeleon.setMinimumContrastRatio` (`boolean`): On: set `terminal.integrated.minimumContrastRatio` to 1 to preserve source themes exactly. Off: allow VS Code to adjust display colors. Default is `true`.
- `termeleon.overrideMissingSelectionHighlight` (`boolean`): On: invent a highlight when the theme omitted one. Off: do not invent one. Default is `true`.
- `termeleon.overrideIncludedSelectionForeground` (`boolean`): On: ignore the theme's selection foreground and keep each cell's ANSI color. Off: use the theme's selection foreground. Default is `false`.
