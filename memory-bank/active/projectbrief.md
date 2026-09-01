# Project Brief

## User Story

As an extension user and maintainer, I want the extension to have a committed marketplace icon properly referenced in `package.json` and packaged in the VSIX, so that the extension is visually recognizable in VS Code and Open VSX marketplaces.

## Use-Case(s)

### Use-Case 1: Visual Identity and Packaging
When packaging the extension via `npm run package` (vsce) or viewing the extension in the marketplace / extension manager, the extension displays its official Termeleon logo.

### Use-Case 2: Asset Integrity
The referenced icon file exists on disk and is included in the packaged VSIX (not excluded by `.vscodeignore`).

## Requirements

1. Process the 1024x1024 source image from `.scratch/termeleon-logo-1024.png` (preserving transparent background) and save an appropriately sized extension icon (e.g. 128x128 / 256x256 PNG) under the repository (e.g. `images/termeleon-icon.png` or `resources/icon.png`).
2. Update `package.json` to configure the `"icon"` field pointing to the committed icon path.
3. Ensure `.vscodeignore` does not exclude the icon directory/file so it is bundled into the VSIX.
4. Verify the `publisher` field in `package.json` matches `texarkanine`.
5. Add test coverage in `test/parsers.test.ts` verifying that `package.json` declares an `icon`, that the referenced file exists on disk and is a non-empty image, and that `.vscodeignore` does not ignore it — without adding fragile content-hash or pixel-specific change detectors.
6. Verify `npm run compile`, `npm run test:coverage`, and `npm run package` pass cleanly.

## Constraints

1. Do NOT write change-detector tests that assert on specific pixel contents or image hashes (if the logo image is updated, tests must still pass; if deleted or pointing to a non-existent path, tests must fail).
2. Maintain clean-break approach; no unused legacy files.
3. License: AGPL-3.0-or-later. No SPDX headers in markdown.

## Acceptance Criteria

1. Icon PNG committed in the repository.
2. `package.json` includes `"icon"` field referencing the committed icon.
3. `package.json` `publisher` is `texarkanine`.
4. `test/parsers.test.ts` asserts that `package.json` icon path points to an existing file and is not ignored by `.vscodeignore`.
5. `npm run package` successfully produces a valid VSIX including the icon.
6. All parser tests and host tests pass cleanly.
