# Project Brief

## User Story

As an extension user and maintainer, I want the extension to have a committed marketplace icon and a dedicated store-facing sales pitch document (`STORE.md`) packaged as the marketplace readme, so that the extension is visually recognizable and clearly presented to marketplace users while keeping contributor and development documentation in the GitHub `README.md`.

## Use-Case(s)

### Use-Case 1: Visual Identity and Packaging
When packaging the extension via `npm run package` (vsce) or viewing the extension in the marketplace / extension manager, the extension displays its official Termeleon logo.

### Use-Case 2: Dedicated Store Presentation
When viewing the extension on Open VSX or the VS Code Marketplace, users see a concise, user-focused sales pitch explaining capabilities, commands, supported emulators, and key settings (`STORE.md`), while developers browsing GitHub see developer-oriented documentation and test instructions (`README.md`).

### Use-Case 3: Asset & Packaging Integrity
The referenced icon file and store README exist on disk, are included in the packaged VSIX without file-name collisions, and are protected by packaging contract tests.

## Requirements

1. Process the source image from `.scratch/termeleon-logo-1024.png` and save an appropriately sized extension icon at `images/icon.png`.
2. Update `package.json` to configure the `"icon"` field pointing to `images/icon.png` and verify `"publisher": "texarkanine"`.
3. Create `STORE.md` containing a polished, user-focused extension overview and sales pitch (features, commands, supported formats, configuration) without developer/build internals.
4. Update `package.json`'s `"package"` script to pass `--readme-path STORE.md` to `vsce package`.
5. Update `.vscodeignore` to exclude `README.md` and local `.scratch/**` files while ensuring `images/icon.png` and `STORE.md` are included.
6. Add packaging contract tests in `test/parsers.test.ts` verifying `STORE.md` exists, `package` script invokes `vsce package` with `--readme-path STORE.md`, `.vscodeignore` ignores `README.md` and does not ignore `STORE.md` or `images/icon.png`, and `icon` points to a valid PNG asset.
7. Verify `npm run compile`, `npm run test:coverage`, and `npm run package` pass cleanly.

## Constraints

1. Do NOT write change-detector tests that assert on specific pixel contents or image hashes.
2. Maintain clean-break approach; no unused legacy files.
3. License: AGPL-3.0-or-later. No SPDX headers in markdown.

## Acceptance Criteria

1. Icon PNG committed at `images/icon.png` and referenced in `package.json`.
2. `STORE.md` created with store sales pitch.
3. `package.json` `package` script uses `--readme-path STORE.md`.
4. `.vscodeignore` excludes `README.md` and includes `STORE.md` / `images/icon.png`.
5. `test/parsers.test.ts` validates packaging contracts.
6. `npm run package` successfully produces a valid VSIX with the store README and icon bundled.
7. Full test suite passes.
