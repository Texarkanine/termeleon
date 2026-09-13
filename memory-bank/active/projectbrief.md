# Project Brief

## User Story

As a Termeleon user, I want selected text in the VS Code integrated terminal to stay clearly visible after I import or Mirror a palette, so I can see what I selected regardless of which emulator theme I applied. When I change mapping settings (selection foreground, contrast, missing-selection fill), I want either an obvious way to reapply the last theme or a clear statement that those toggles are not live.

## Use-Case(s)

### Toggle mapping settings

I change `termeleon.includeSelectionForeground` or `termeleon.setMinimumContrastRatio` because selection or contrast looks wrong. Today that looks like a no-op because nothing is rewritten until the next Import or Mirror. I need the settings UI to say that, and a Reapply command so I do not have to walk the picker again.

### Theme-dependent visibility

After applying duskfox, the same selected range is readable. After Mirroring MobaXterm, that same range is effectively invisible. Light themes are usually fine; dark themes vary. I need selection to pop on the themes that currently fail, without breaking the ones that already look OK.

### Faithful mapping vs missing fields

If emulator themes carry selection colors, those should reach VS Code. If a source (MobaXterm especially) has no selection fields, Termeleon may fill a visible overlay — but that fill is optional, behind a setting, because some people will want only what the file specified.

## Requirements

1. Determine whether `termeleon.includeSelectionForeground` actually writes `terminal.selectionForeground`, and under what conditions a user would see no change (toggle without re-apply, palette has no selection foreground, etc.).
2. Ensure selection-related fields that emulator formats actually publish are mapped into VS Code terminal color keys.
3. When a palette omits selection colors (notably MobaXterm Mirror), optionally write a visible selection overlay against the imported background. Gate that fill behind a setting (default on) so it can be turned off.
4. Do not regress themes that already have usable selection (duskfox, typical light themes): authored selection colors are never replaced by the fill.
5. Keep the product rule of matching authored colors when the theme actually specifies them; invented selection is only for the missing-field case, and only when the fill setting is on.
6. Mapping settings (`includeSelectionForeground`, `setMinimumContrastRatio`, the new fill setting, `scopeToActiveTheme`) are not live. Their descriptions must say they take effect on the next Import, Mirror, or Reapply.
7. Add a Reapply Last Theme command that rewrites the last committed apply (not a live-preview) with the current mapping settings.

## Constraints

1. Do not invent contrast-adjusted ANSI/fg/bg/cursor colors. Selection fill is allowed only when the source did not specify a selection color and the fill setting is on.
2. Stay inside the existing Palette → `toColorCustomizations` hub; do not add a second mapping table.
3. vscode-free core stays vscode-free. Last-apply persistence and the Reapply command live in the vscode-bound shell.
4. Do not auto-rewrite colorCustomizations when a setting is toggled. Reapply is explicit.
5. Live preview must not overwrite the last committed apply record (cancel would then Reapply the previewed theme).

## Acceptance Criteria

1. Mapping-setting descriptions (and README/STORE) state that toggles take effect on the next Import, Mirror, or Reapply — they are not live.
2. After a committed Import or Mirror, Reapply with `includeSelectionForeground` flipped writes or omits `terminal.selectionForeground` without opening the picker. With no committed apply, Reapply explains that and does nothing.
3. A MobaXterm Mirror apply with fill on leaves a selection highlight that is visible against that palette's background (the pic-2 failure).
4. The same apply with fill off does not write a synthetic `terminal.selectionBackground`.
5. A theme that already specifies selection colors (duskfox) still uses those authored colors, not a synthesized substitute, regardless of the fill setting.
6. Light themes that already look fine do not lose selection contrast.
7. Tests cover: setting on/off for fill and selection foreground, authored selection written through, missing selection fill vs omit, Reapply of last committed palette, live preview not replacing last-apply, and omit-foreground-by-default.
