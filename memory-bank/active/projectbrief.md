# Project Brief

## User Story

As a developer using VS Code and terminal emulators, I want this project and extension to be named **Termeleon** (`termeleon`) across the repository, package manifests, command IDs, configuration settings, and state storage, so that the extension has a distinct, cohesive identity and can be found via relevant keywords on Open VSX and the extension marketplace.

## Use-Case(s)

### Use-Case 1: Discovery & Publishing
The extension is packaged and published as `termeleon` with searchable keywords (emulator names, terminal colors, palette import/mirroring) and clean GitHub repo URLs.

### Use-Case 2: Command & Configuration Namespace
Users interact with commands under `Termeleon: ...` / `termeleon.*` (e.g. `termeleon.import`, `termeleon.mirror`, `termeleon.remove`) and configure settings under the `termeleon.*` namespace.

### Use-Case 3: Clean State Storage
Internal state tracking for owned color customizations is keyed under `termeleon.ownedKeys`.

## Requirements

1. Update `package.json`:
   - Set `"name": "termeleon"`
   - Set `"displayName": "Termeleon"`
   - Set `"repository"` URL to `https://github.com/Texarkanine/termeleon.git`
   - Expand `"keywords"` to include emulator names and discovery terms
   - Rename commands from `terminalThemeImport.*` to `termeleon.*` with category `"Termeleon"`
   - Rename configuration settings from `terminalThemeImport.*` to `termeleon.*` with title `"Termeleon"`
2. Update source code:
   - `src/extension.ts`: Update `CONFIG` constant to `'termeleon'`, update openSettings target to `${CONFIG}.extraDirectories`, update command registrations.
   - `src/apply.ts`: Update `OWNED_STATE` constant to `'termeleon.ownedKeys'`.
3. Update tests:
   - `test/host/apply.test.ts` and `test/host/preview.test.ts`: Update state key `termeleon.ownedKeys` in test setups.
   - `test/parsers.test.ts`: Ensure all contract tests pass.
4. Update documentation and context:
   - `README.md`: Update title, command names, settings names, vsix filename references.
   - `memory-bank/` persistent files: Update extension name and storage keys in `techContext.md` and `systemPatterns.md`.
5. Execute on a dedicated feature branch and create a PR to merge into `main`.

## Constraints

- Licensed AGPL-3.0-or-later.
- vscode-free core architecture (`src/palette.ts`, `src/discover.ts`, `src/parsers/`) remains intact.
- Follow TDD and test execution rules.
- Git safety and seat attribution rules apply.

## Acceptance Criteria

1. `package.json` reflects `name: termeleon`, `displayName: Termeleon`, `termeleon.*` commands and settings.
2. `src/extension.ts` and `src/apply.ts` use the `termeleon` namespace and `termeleon.ownedKeys`.
3. `npm run compile`, `npm run test:parsers`, `npm run test:host`, and `npm run package` all pass.
4. A pull request is created on GitHub off the feature branch.
