# Project Brief

## User Story

As a Termeleon user, I want selected text in the VS Code integrated terminal to stay clearly visible after I import or Mirror a palette, so I can see what I selected regardless of which emulator theme I applied.

## Use-Case(s)

### Toggle include selection foreground

I change `termeleon.includeSelectionForeground` because selection is hard to see. I expect that setting to have a visible effect (or a documented reason it does not).

### Theme-dependent visibility

After applying duskfox, the same selected range is readable. After Mirroring MobaXterm, that same range is effectively invisible. Light themes are usually fine; dark themes vary. I need selection to pop on the themes that currently fail, without breaking the ones that already look OK.

### Faithful mapping vs missing fields

If emulator themes carry selection colors, those should reach VS Code. If a source (MobaXterm especially) has no selection fields, Termeleon still needs a selection that is visible against the imported background.

## Requirements

1. Determine whether `termeleon.includeSelectionForeground` actually writes `terminal.selectionForeground`, and under what conditions a user would see no change (toggle without re-apply, palette has no selection foreground, etc.).
2. Ensure selection-related fields that emulator formats actually publish are mapped into VS Code terminal color keys.
3. Make selection visible for palettes that omit selection colors (notably MobaXterm Mirror), so the highlight pops against the imported background.
4. Do not regress themes that already have usable selection (duskfox, typical light themes).
5. Keep the product rule of matching authored colors when the theme actually specifies them; invented selection is only for the missing-field case.

## Constraints

1. Do not invent contrast-adjusted ANSI/fg/bg/cursor colors. Selection fallback is allowed only when the source did not specify a selection color.
2. Stay inside the existing Palette → `toColorCustomizations` hub; do not add a second mapping table.
3. vscode-free core stays vscode-free.
4. Changing the setting must not silently rewrite colors the user did not re-import unless the plan explicitly chooses live re-apply.

## Acceptance Criteria

1. `includeSelectionForeground` is either observably effective after a documented apply path, or the UI/docs make the real requirement (re-import, and a palette that has a selection foreground) obvious.
2. A MobaXterm Mirror apply leaves a selection highlight that is visible against that palette's background (the pic-2 failure).
3. A theme that already specifies selection colors (duskfox) still uses those authored colors, not a synthesized substitute.
4. Light themes that already look fine do not lose selection contrast.
5. Tests cover: setting on/off, authored selection colors written through, missing selection colors getting a visible fallback, and no regression of the omit-foreground-by-default behavior.
