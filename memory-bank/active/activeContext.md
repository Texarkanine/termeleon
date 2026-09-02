# Active Context

## Current Task: marketplace-store-readme
**Phase:** BUILD - COMPLETE

## What Was Done
- Created dedicated store-facing sales pitch in `STORE.md`.
- Updated `package.json` package script to `"vsce package --no-dependencies --readme-path STORE.md"`.
- Added `README.md` to `.vscodeignore` to avoid packaging collisions.
- Added contract tests in `test/parsers.test.ts` to enforce `STORE.md` presence, package script flag, and ignore configuration.
- Executed full test suites (`test:parsers`, `test:coverage`, `test:host`) and verified VSIX archive packaging.

## Next Step
- Run QA semantic review subagent (`/niko-qa`).
