# Current Task: issue-1-kitty-inline-comments

**Complexity:** Level 1

## Fix

- **What broke:** `parseKitty` comments claimed trailing inline comments were stripped. The ternary was dead — both branches returned `m[2].trim()`. A line like `color1 #cc6666  # red` was passed to `normalizeColor` as `#cc6666  # red` and the slot was dropped.
- **Why:** `split('#').length > 1 && !startsWith('#')` was meant to choose a strip vs keep path, but neither path stripped.
- **What changed:** Replace the ternary with `.replace(/\s+#.*$/, '').trim()` so a whitespace-then-`#` comment is removed and a leading hex `#` is kept.
- **Files:** `src/parsers/kitty.ts`, `test/parsers.test.ts`
