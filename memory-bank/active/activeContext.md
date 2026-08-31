# Active Context

## Current Task: issue-2-extra-directories
**Phase:** QA - COMPLETE (PASS)

## What Was Done
- Failing discovery test against `test/fixtures/extra/` (Ghostty, kitty, Alacritty, WezTerm, iTerm2).
- Threaded `extraDirs` into `discoverGhostty`, `discoverKitty`, `discoverAlacritty`, and `discoverWezterm`. iTerm2 already accepted extra dirs.
- `npm run test:parsers`: 12 passed. `npm run compile`: passed.
- QA reviewed commit `18633be` against the plan: PASS, two non-blocking advisories. See `memory-bank/active/.qa-validation-status`.

## Next Step
- Level 1 complete after QA PASS. No Reflect phase. Do not archive until the operator asks.
