---
task_id: typescript-6-and-engine-pin
complexity_level: 2
date: 2026-09-13
status: completed
---

# TASK ARCHIVE: TypeScript 6.0 and engine-floor types pin

## SUMMARY

The compiler is TypeScript 6.0.3 with `moduleResolution: bundler` and `types: ["node"]`. `@types/vscode` is tilde-pinned to the `engines.vscode` 1.75 floor (`~1.75.0` / 1.75.1). Dependabot ignores `@types/vscode` `>=1.76.0`. The published VS Code floor did not move. PR: https://github.com/Texarkanine/termeleon/pull/56

## REQUIREMENTS

- Compile on TypeScript 6.0 (tsconfig that 6.0 accepts; no `ignoreDeprecations`).
- Keep `engines.vscode` at `^1.75.0`.
- Pin `@types/vscode` so it cannot caret-float or be Dependabot-rewritten above that floor.
- Keep TypeScript `>=7.0.0` and `@types/node` `>=23.0.0` Dependabot ignores.
- Verify with `compile`, existing parser suite, and `package` (vsce). Do not add package.json/yaml change-detectors.

## IMPLEMENTATION

- `package.json`: `typescript` `^6.0.0`, `@types/vscode` `~1.75.0`. Lockfile regenerated from a clean tree (6.0.3 / 1.75.1).
- `tsconfig.json`: `moduleResolution: bundler` (keep `module: commonjs`); `types: ["node"]`. `tsconfig.test.json` still extends and lists `node` + `mocha`.
- `.github/dependabot.yaml`: ignore `@types/vscode` `>=1.76.0` (this package's minor is the VS Code version).
- `test/host/picker.test.ts`: pin `scopeToActiveTheme` false in the mirror-preview suite so unscoped assertions do not depend on the #54 contributed default (on). Product default unchanged.
- `memory-bank/techContext.md`: TS 6 / bundler; pin stated as package policy, not as a parser `ci` test.

## TESTING

- `npm run compile` green (Dependabot #53 had failed TS5107 on `moduleResolution: node`).
- Parser suite 85 + discovery 32 + cache 8.
- `npm run package` green (Dependabot #52 had failed vsce after rewriting types to `^1.136.0`).
- Host 47. This WSL box needs a writable `XDG_RUNTIME_DIR` (not `/run/user/1000`) plus `dbus-launch`. CI does not run `test:host`.
- Niko QA: FAIL once (`techContext.md` claimed the `ci` tests lock the vscode ignore); PASS after moving that note to the Package bullet.

## LESSONS LEARNED

- `@types/vscode` minors are VS Code versions. Dependabot's development-deps minor group will propose 1.75 → 1.136.
- vsce compares declared range strings, not the lockfile. A caret can drift (we were already on 1.134) until Dependabot rewrites `package.json`.
- Do not document a Dependabot ignore as if a parser contract test covers it.
- CI does not run `test:host`; a settings-default change can leave the local host suite red while CI stays green.

## PROCESS IMPROVEMENTS

- Preflight correctly struck configuration change-detectors; the pin is policy (tilde + ignore + vsce), not a new `ci` assertion.
- Do not merge Dependabot #52 and #53; they fail for independent reasons and this task supersedes them.

## TECHNICAL IMPROVEMENTS

- Preflight advisory: a `scripts/check-vscode-types-floor.js` duplicating vsce was not added. vsce already gates declared ranges at `npm run package`.

## NEXT STEPS

- Land PR #56. Close Dependabot #52 and #53 when this is merged.
