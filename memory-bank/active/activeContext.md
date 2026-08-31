# Active Context

## Current Task: issue-2-extra-directories
**Phase:** BUILD - COMPLETE

## What Was Done
- Failing discovery test against `test/fixtures/extra/` (Ghostty, kitty, Alacritty, WezTerm, iTerm2).
- Threaded `extraDirs` into `discoverGhostty`, `discoverKitty`, `discoverAlacritty`, and `discoverWezterm`. iTerm2 already accepted extra dirs.
- `npm run test:parsers`: 12 passed. `npm run compile`: passed.

## Next Step
- Level 1 QA subagent (`/niko-qa`).
