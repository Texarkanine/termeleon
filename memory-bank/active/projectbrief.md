# Project Brief

## User Story

As someone who uses Ghostty with `theme = dark:X,light:Y`, I want mirroring into VS Code to write paired light/dark terminal palettes keyed to `window.autoDetectColorScheme`, so the integrated terminal follows the workbench when the OS switches appearance.

Source of truth: https://github.com/Texarkanine/vscode-terminal-themes/issues/9

## Use-Case(s)

### Use-Case 1

Ghostty config has `theme = dark:Broadcast,light:Ayu Light`. Mirror applies both palettes as scoped `workbench.colorCustomizations` blocks so VS Code's light/dark auto-detect switches terminal colors with the workbench.

### Use-Case 2

Tests observe the written keys (at whatever layer can see them) and confirm dark and light palettes land under the auto-detect scopes, not as a single flat overwrite.

## Requirements

1. A Ghostty dark/light pair can be applied as paired scoped blocks, not as two independent flat writes.
2. Scopes are keyed so they follow `window.autoDetectColorScheme` (workbench light/dark auto-detect).
3. Tests cover the written keys at a layer that can observe them.
4. Discovery already parses the pair and marks both names active; reuse that, do not re-parse Ghostty's `theme =` line in apply.

## Constraints

1. `apply.ts` remains the only module that mutates VS Code configuration.
2. Parsers and discovery stay vscode-free.
3. Surgical removal via owned-key tracking must still work for the new scoped keys.
4. Do not invent palettes; only apply themes already discovered from disk.
5. No SPDX comments in markdown. License via root LICENSE only.

## Acceptance Criteria

1. Applying a Ghostty dark/light pair writes terminal colors under both auto-detect scopes so VS Code switches them with the workbench light/dark theme.
2. Tests fail if those scoped keys are missing, wrong, or collapsed into a single unscoped write.
3. README's "No light/dark pairing yet" known limit is removed or rewritten to match the new behavior.
