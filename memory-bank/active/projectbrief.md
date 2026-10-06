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
