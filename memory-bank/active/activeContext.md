# Active Context

## Current Task: ci-openvsx-codecov
**Phase:** BUILD - COMPLETE

## What Was Done
- Executed Units 1, 2, and 3 per the TDD implementation plan.
- Unit 1: Added `c8` devDependency, added `test:coverage` script in `package.json`, ignored `coverage/` in `.gitignore` and `coverage/**` in `.vscodeignore`, updated `package-lock.json` preserving optional esbuild targets, and added unit tests in `test/parsers.test.ts`.
- Unit 2: Updated `.github/workflows/ci.yaml` to run parser tests with coverage and upload coverage to Codecov using `codecov/codecov-action@v7` and `CODECOV_TOKEN`; updated `.github/workflows/release-please.yaml` to publish to Open VSX using `OPENVSX_TOKEN` after VSIX upload.
- Unit 3: Added Codecov badge to `README.md` and updated development documentation; updated `memory-bank/techContext.md` with CI coverage, Open VSX releases, and fixed secret name pointers.
- Verified all 87 tests passing across parser/discovery suites and extension host Mocha suite, and verified clean VSIX packaging.

## Modified Files
- `/Users/tex/git/vscode-terminal-themes/package.json`
- `/Users/tex/git/vscode-terminal-themes/package-lock.json`
- `/Users/tex/git/vscode-terminal-themes/.gitignore`
- `/Users/tex/git/vscode-terminal-themes/.vscodeignore`
- `/Users/tex/git/vscode-terminal-themes/.github/workflows/ci.yaml`
- `/Users/tex/git/vscode-terminal-themes/.github/workflows/release-please.yaml`
- `/Users/tex/git/vscode-terminal-themes/README.md`
- `/Users/tex/git/vscode-terminal-themes/memory-bank/techContext.md`
- `/Users/tex/git/vscode-terminal-themes/test/parsers.test.ts`

## Next Step
- Run QA validation subagent (`/niko-qa`).
