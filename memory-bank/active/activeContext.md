# Active Context

## Current Task: discover-fixture-tests
**Phase:** PREFLIGHT - COMPLETE (PASS WITH ADVISORY)

## What Was Done
- Level 2 plan for issue #5: new `test/discover.test.ts` (same Node/`tsx` harness as parsers), per-test tmp HOME + non-default `$XDG_CONFIG_HOME`, origin-prefix assertions, scan-time path helpers in `src/discover.ts`, `test:parsers` runs both files in separate processes.
- Production API unchanged (`discoverThemes` / `DiscoverOptions`). No new dependencies.

## Next Step
- Build the approved fixture-home discovery tests and scan-time path resolution.
