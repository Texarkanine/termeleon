---
task_id: f5-launch-config
complexity_level: 2
date: 2026-08-31
status: completed
---

# TASK ARCHIVE: F5 Extension Development Host Launch Configuration

## SUMMARY

Added standard `.vscode/launch.json` ("Run Extension") and `.vscode/tasks.json` (`npm: compile`) configuration files, along with TDD contract tests in `test/parsers.test.ts`. This fulfills the development tooling configuration required by [Issue #4](https://github.com/Texarkanine/vscode-terminal-themes/issues/4), complementing the completed real-host manual pass.

## REQUIREMENTS

- Add standard `.vscode/launch.json` with an `extensionHost` configuration, `request: "launch"`, and `preLaunchTask: "npm: compile"`.
- Add `.vscode/tasks.json` defining the `npm: compile` build task.
- Lock launch and task configurations with automated contract tests.
- Verify `.vscodeignore` keeps `.vscode/` files out of the published VSIX package.
- Update `memory-bank/techContext.md` with F5 debugging instructions.

## IMPLEMENTATION

- Created `.vscode/launch.json` configured with `--extensionDevelopmentPath=${workspaceFolder}` and `outFiles: ["${workspaceFolder}/dist/**/*.js"]`.
- Created `.vscode/tasks.json` defining `type: "npm"`, `script: "compile"`, `group: "build"`, `problemMatcher: "$tsc"`, `label: "npm: compile"`.
- Added contract tests in `test/parsers.test.ts` asserting `.vscode/launch.json` and `.vscode/tasks.json` structure.
- Documented F5 debug setup in `memory-bank/techContext.md`.

## TESTING

- Automated TDD: Contract tests in `test/parsers.test.ts` ran red before configuration creation and green after.
- Full suite verification: `npm test` runs 52 parser/discover tests and 22 extension-host tests cleanly.
- Quality validation: `niko-qa` review completed with PASS status.

## LESSONS LEARNED

- Contract tests in `test/parsers.test.ts` allow rapid, lightweight verification of IDE and repo configuration without requiring full extension host launches.

## PROCESS IMPROVEMENTS

- Committing standard editor launch configurations ensures new contributors can immediately debug extensions with F5 without trial and error.

## TECHNICAL IMPROVEMENTS

- None needed; standard VS Code extension host launch configuration is clean and minimal.

## NEXT STEPS

- Open pull request using `/github-open-a-pull-request-gh`.
