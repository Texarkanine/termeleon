# Active Context

## Current Task: Detect Windows Terminal's active colorScheme
**Phase:** PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

## What Was Done
- Classified Level 2.
- Planned a Ghostty-style `activeWindowsTerminalScheme` helper, fixture + parser tests, discover wiring, README and `systemPatterns.md` updates.
- Default profile `colorScheme` wins over `profiles.defaults` when both are set (WT inheritance). Legacy `profiles` array included because it is cheap.

## Next Step
- Build the approved test-first implementation plan.
