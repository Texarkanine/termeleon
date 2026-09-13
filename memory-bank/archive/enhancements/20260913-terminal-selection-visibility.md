---
task_id: terminal-selection-visibility
complexity_level: 2
date: 2026-09-13
status: completed
---

# TASK ARCHIVE: Terminal selection visibility

## SUMMARY

Import/Mirror now keep selected text visible when the source omitted a highlight, map Xresources highlight keys, and offer **Reapply Last Theme** so mapping settings rewrite the last committed apply without the picker. Mapping settings are not live. After a rework, the two selection toggles are overrides (`overrideMissingSelectionHighlight` default on; `overrideIncludedSelectionForeground` default off, honoring authored fg). Settings are three categories: Command Palette UI Behavior, Theme Discovery, Color Preferences when Applying New Themes. `scopeToActiveTheme` defaults **on**. PR: https://github.com/Texarkanine/termeleon/pull/54

## REQUIREMENTS

- Map emulator-authored selection fields into VS Code terminal keys; never invent `selectionForeground`.
- When a palette omits a highlight, optionally write a translucent overlay (`#ffffff80`/`#ffffff40` dark, `#00000080`/`#00000040` light). Authored highlights always win.
- Mapping settings take effect on the next Import, Mirror, or Reapply — not on toggle.
- Reapply remaps the last committed Import/Mirror (not live preview) per target Memento; no last-apply → explain and do nothing.
- Rework: replace `fillMissingSelection` / `includeSelectionForeground` (0.x, no aliases). Foreground override off honors theme fg; on keeps ANSI.
- README/STORE match the three groups and scope default on.

## IMPLEMENTATION

- `src/palette.ts`: `toColorCustomizations` writes authored `selectionForeground` unless `overrideIncludedSelectionForeground`; missing highlight fill only when `overrideMissingSelectionHighlight` and `fallbackSelectionColors`.
- `src/apply.ts` / `src/extension.ts`: `ApplyOptions` match mapping names; last-apply in Memento; Reapply; `setMinimumContrastRatio` false clears a previously written `1`.
- Xresources: `highlightColor` / `highlightTextColor` / `highlightBackground` → selection slots.
- `package.json`: configuration array of three `id: "termeleon"` categories. Color Preferences copy is situation + On/Off. Ghostty dark/light Mirror still ignores the scope toggle.
- Docs: README Behavior worth knowing; STORE configuration list.

## TESTING

- Parser: mapping polarities, Broadcast exact-map includes `#e6e1dc` fg, flatten helper for configuration array, three category titles, old ids absent.
- Host: apply/reapply of both overrides, Ghostty pair reapply, contrast clear-on-false, live-preview isolation of last-apply.
- Suite (2026-09-13): 85 parser + 32 discovery + 8 cache + 47 host. Host on this WSL box needs a writable `XDG_RUNTIME_DIR` (not `/run/user/1000`) plus `dbus-launch`.
- Niko QA: first cycle FAIL (duplicate README bullet) then FAIL (contrast-off Reapply); PASS after clear-on-false. Rework QA PASS first pass.

## LESSONS LEARNED

- Boolean apply-time settings need both polarities: contrast-off had to clear a written `1`.
- `terminal.selectionBackground` defaults to `editor.selectionBackground`; a new terminal background without a highlight can make selection vanish.
- `includeX` default off encoded skip-the-theme. `overrideX` default off means honor the theme unless the user opts out.
- VS Code category objects have no user-visible description; title plus per-setting copy is the signal. Line breaks in `markdownDescription` need `\n\n`; HTML `<br>` is stripped.
- Operator two-way On/Off copy for scope is the right altitude; do not explain the colorCustomizations cascade in the checkbox.

## PROCESS IMPROVEMENTS

- Rework of a just-reflected task is cheaper than a new task when product names were wrong: same hub, inverted `if`, new contract tests.
- "Takes effect on Reapply" needs a test that flips the setting from on to off, not only off to on.

## TECHNICAL IMPROVEMENTS

- Preflight advisory: settings-to-`ApplyOptions` adapter left undone on purpose.
- Contrast still needs its own clear-on-false helper because it writes a non-color setting.

## NEXT STEPS

- Land PR #54 when review is done.
