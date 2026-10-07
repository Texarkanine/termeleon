# Active Context

## Current Task: Retry a failed Windows Terminal lookup and use the discovery home
**Phase:** BUILD - COMPLETE

## What Was Done
- A failed Appx lookup is no longer stored as "no installs". A successful lookup that finds no package still is.
- Mirror home paths use `homeDir` (`os.homedir()`), the same directory discovery uses.
- Discovery tests went red on the new cases, then green. The full suite passed and `npm run compile` succeeded.

## Files
- `src/discover.ts`
- `test/discover.test.ts`

## Next Step
- Run QA.
