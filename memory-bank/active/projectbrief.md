# Project Brief

## User Story

As a user who keeps kitty theme files with trailing `# comments` on color lines, I want `parseKitty` to take the hex and ignore the comment so those themes import with every slot filled.

## Use-Case(s)

### Use-Case 1

A kitty line `color1 #cc6666  # red` yields ANSI slot 1 as `#cc6666`, not a missing slot.

### Use-Case 2

A kitty line whose value is the color itself (`background #1d1f21`) still parses; stripping comments must not eat the leading `#` of the hex.

## Requirements

1. Strip trailing inline comments on kitty color lines.
2. Keep hex values that start with `#`.
3. Cover both cases with a regression test.

## Constraints

1. Isolated to `parseKitty` (and its tests). Do not change other parsers or `normalizeColor` unless a shared helper is the minimum fix.
2. The committed fixture `test/fixtures/tomorrow-night.conf` has no inline comments; do not rely on it alone for this behavior.

## Acceptance Criteria

1. A kitty color line with a trailing `# comment` yields the hex.
2. A regression test covers that case and a line whose value is the color itself, starting with `#`.
3. Existing parser tests still pass.

Source: https://github.com/Texarkanine/vscode-terminal-themes/issues/1
