---
task_id: marketplace-store-readme
complexity_level: 2
date: 2026-09-01
status: completed
---

# TASK ARCHIVE: Marketplace Packaging Icon & Store Readme

## SUMMARY

Added official square transparent PNG icon at `images/icon.png`, set `package.json` publisher to `texarkanine` and icon to `images/icon.png`, authored dedicated store-facing sales pitch in `STORE.md` packaged via `vsce package --no-dependencies --readme-path STORE.md`, excluded repository `README.md` from `.vscodeignore` to avoid packaging collisions, added float-right logo to GitHub `README.md`, and locked all packaging contracts via `test/parsers.test.ts`.

## REQUIREMENTS

- Resolve GitHub Issue #8: Set `publisher: "texarkanine"` and bundle extension icon in `package.json`.
- Create a 256x256 transparent PNG icon at `images/icon.png` from `.scratch/termeleon-logo-1024.png`.
- Author a user-facing store sales pitch in `STORE.md` (features, commands, supported formats, configuration) without developer/build instructions.
- Package `STORE.md` into `extension/readme.md` during `npm run package` using `--readme-path STORE.md`.
- Exclude repository `README.md` and `.scratch/**` in `.vscodeignore` while ensuring `images/icon.png` and `STORE.md` are bundled.
- Guard the packaging setup with non-brittle automated contract tests in `test/parsers.test.ts`.
- Add a clean float-right logo `<img>` above H1 in `README.md` for GitHub presentation.

## IMPLEMENTATION

- **Icon Generation**: Created `images/icon.png` (256x256 square transparent PNG) from source logo asset.
- **Manifest Updates**: Configured `"icon": "images/icon.png"` and `"publisher": "texarkanine"` in `package.json`. Updated `"package"` script to `"vsce package --no-dependencies --readme-path STORE.md"`.
- **Packaging Ignore Rules**: Updated `.vscodeignore` to include `README.md` and `.scratch/**` so that `vsce` only packages `STORE.md` into `extension/readme.md` without case-insensitive filename collisions in the VSIX.
- **Documentation**: Created `STORE.md` focused on product value, terminal emulator support matrix, commands, and key settings. Updated GitHub `README.md` to float the icon at the top right. Updated `memory-bank/techContext.md`.
- **Contract Tests**: Added assertions in `test/parsers.test.ts` verifying publisher format, icon path existence, PNG magic signature (`89 50 4E 47 0D 0A 1A 0A`), `STORE.md` existence and non-emptiness, package script flags, and `.vscodeignore` inclusions/exclusions.

## TESTING

- Unit & Parser Suite: Ran `npm run test:parsers` and `npm run test:coverage` (59 tests passed, 100% contract coverage).
- Extension Host Suite: Ran `npm run test:host` (30 host integration tests passed).
- VSIX Packaging Validation: Packaged with `npm run package` and inspected archive structure via `unzip -l termeleon-*.vsix` and `unzip -p termeleon-*.vsix extension/readme.md` to confirm `STORE.md` was packaged as `extension/readme.md` and `images/icon.png` was bundled.
- Niko Preflight and QA subagents run and passed.

## LESSONS LEARNED

- Passing `--readme-path <file>` to `vsce package` maps the custom markdown file to `extension/readme.md` in the VSIX. Because `vsce` automatically attempts to include `README.md` from the root, `README.md` must be explicitly excluded in `.vscodeignore` to prevent duplicate files and case-insensitive filename collisions.
- Checking the 8-byte PNG magic header (`\x89PNG\r\n\x1a\n`) provides a robust contract test that verifies valid image asset packaging without creating brittle tests against image contents or hashes.

## PROCESS IMPROVEMENTS

- Keep persistent memory bank files (like `techContext.md`) aligned during the build phase when build or packaging scripts are changed to prevent documentation discrepancies caught by QA.

## TECHNICAL IMPROVEMENTS

- None. The separation of store copy and developer documentation via `vsce --readme-path` is standard and clean.

## NEXT STEPS

- None. Ready for pull request.
