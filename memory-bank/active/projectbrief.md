# Project Brief

As specified in https://github.com/Texarkanine/vscode-terminal-themes/issues/10

## User Story

As a Windows Terminal user, I want Mirror to treat the color scheme named by `profiles.defaults` (or the default profile) as in use, so I can apply that palette to the VS Code terminal without picking from every scheme in `settings.json`.

## Use-Case(s)

### Mirror the scheme Windows Terminal actually uses

The user runs `Terminal Theme: Mirror Active Terminal Theme`. Discovery has read `settings.json`, and the scheme named by defaults / the default profile is flagged `active: true`. Mirror can apply it.

### Browse with the in-use scheme first

The import picker lists Windows Terminal schemes as today, but the defaults-named scheme sorts with other active themes and shows as in use.

## Requirements

1. The scheme named by `profiles.defaults.colorScheme` is flagged active.
2. The equivalent `colorScheme` on the default profile (the profile whose GUID matches `defaultProfile`) is also honored.
3. A fixture test covers this behavior.
4. Per-profile schemes beyond defaults stay out of scope unless they are cheap to include.

## Constraints

1. Stay inside the vscode-free core (`src/parsers/`, `src/discover.ts`). Do not import `vscode`.
2. Follow the existing Ghostty pattern: a pure helper that reads config text, plus discovery that sets `active` from that helper.
3. Do not invent palettes or change how schemes are parsed — only which parsed scheme is marked in use.
4. Discovery still never throws.

## Acceptance Criteria

1. When `settings.json` names a scheme via defaults or the default profile, that scheme's `DiscoveredTheme.active` is `true` and others from the same file remain `false`.
2. A test in the existing parser harness fails without the helper and passes with it, using a representative settings document (fixture).
3. README's Windows Terminal "Active theme detected" cell is no longer `no`.

## Review (PR 13)

Operator accepted both cursor[bot] findings as in-scope for this PR:

1. A `{ dark, light }` `colorScheme` object is not treated as unset; both names are flagged; a present non-string does not inherit `profiles.defaults`.
2. Scheme names are compared case-insensitively when setting `active`.
