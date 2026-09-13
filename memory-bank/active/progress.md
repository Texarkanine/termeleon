# Progress

Upgrade the Termeleon compiler to TypeScript 6.0 to match VS Code upstream, and pin `@types/vscode` so it cannot drift above `engines.vscode` `^1.75.0`.

**Complexity:** Level 2

## 2026-09-13 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Classified the TypeScript 6.0 plus engine-pin work as Level 2.
* Decisions made
    - Level 2, not Level 1: tsconfig migration and Dependabot/contract updates are more than a one-line pin.
    - Level 2, not Level 3: one toolchain subsystem; no user-facing feature and no architecture change.
    - `engines.vscode` stays `^1.75.0`; TypeScript 6.0 does not raise the published VS Code floor.
* Insights
    - Dependabot #52 and #53 failed for independent reasons (vsce engines check vs TS5107). Combining them would not green CI.

## 2026-09-13 - PLAN - COMPLETE

* Work completed
    - Wrote Level 2 plan: types/engine lockstep contract, TypeScript 6.0 plus `moduleResolution: bundler`, techContext update.
* Decisions made
    - `@types/vscode` becomes `~1.75.0` (not caret). Dependabot ignores `>=1.76.0` because this package's minor is the VS Code version.
    - TypeScript 6 tsconfig: `moduleResolution: bundler` with existing `module: commonjs`. No `ignoreDeprecations`. No `nodenext` (would require `.js` import extensions).
    - `engines.vscode` stays `^1.75.0`. If 1.75 types reject a call site, change the source, not the engine floor.
* Insights
    - TypeScript 6.0 documents `bundler` + `commonjs` as the upgrade off deprecated `node10`.
    - Current lockfile `@types/vscode` 1.134 already drifted above the claimed floor; vsce only failed once Dependabot rewrote the declared range to `^1.136.0`.
