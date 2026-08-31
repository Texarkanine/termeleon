# Project Brief

## User Story

As a contributor or developer working on `vscode-terminal-themes`, I want a standard `.vscode/launch.json` configuration so that I can press **F5** in VS Code to build and run the Extension Development Host for interactive testing and debugging.

## Use-Case(s)

### Use-Case 1: F5 Extension Development Host
When pressing F5 (or selecting "Run Extension" in the Run & Debug view), VS Code automatically runs the compile task (`npm: compile`) and starts a new Extension Development Host window with the extension loaded from the workspace folder.

### Use-Case 2: Real-Host Manual Verification
Contributors have a standard, committed way to open the picker, test live preview, cancel, accept, and remove themes in a live VS Code window.

## Requirements

1. Add `.vscode/launch.json` defining a standard "Run Extension" launch configuration of type `extensionHost` with `preLaunchTask: "npm: compile"`.
2. Add `.vscode/tasks.json` defining the `npm: compile` build task if needed so that VS Code can discover and execute the preLaunchTask reliably.
3. Validate that `.vscodeignore` properly handles `.vscode/` files (keeps launch/tasks out of the VSIX package if appropriate).
4. Verify all tests (`npm test`) and compilation (`npm run compile`) pass cleanly.

## Constraints

1. Keep configuration standard and minimal (YAGNI/KISS).
2. AGPL-3.0-or-later license, VS Code 1.75+ compatibility.
3. Seat attribution and git safety rules observed for all commits.

## Acceptance Criteria

1. `.vscode/launch.json` exists and is valid JSON/JSONC with an `extensionHost` launch configuration.
2. `.vscode/tasks.json` exists and defines the `npm: compile` task.
3. `npm test` passes without regression.
4. `.vscode/` files are excluded from the packaged VSIX (`.vscodeignore`).
