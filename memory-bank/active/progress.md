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

## 2026-09-13 - PREFLIGHT - COMPLETE

* Work completed
    - Validated the Level 2 plan against the repository, TypeScript 6.0.2, dependency touchpoints, and project conventions.
    - Removed scheduled configuration change-detector test steps from the implementation plan as required by the project TDD rule.
* Decisions made
    - Preflight result is `FAIL (fixable)`: the plan must reconcile its requirement for CI-contract tests with the prohibition on configuration change-detectors before Build.
* Insights
    - TypeScript 6.0.2 accepts the planned `module: commonjs`, `moduleResolution: bundler`, `types: ["node"]`, and `skipLibCheck` combination.

## 2026-09-13 - PLAN - COMPLETE (re-plan after preflight)

* Work completed
    - Removed requirement/AC for new parser CI-contract tests. Test Plan is now "no new executable behavior."
    - Rewrote units 1–2 as prose/policy toolchain steps; vsce `npm run package` remains the engines gate.
* Decisions made
    - Do not add package.json or Dependabot yaml change-detectors. Do not add a second vsce as a package-validation command.
    - Existing typescript-7 / `@types/node` contract tests stay; they are not extended.
* Insights
    - `@types/vscode` minors are VS Code versions; caret float and Dependabot grouping both treat 1.75 → 1.136 as a minor. Tilde plus `>=1.76.0` ignore is the pin.

## 2026-09-13 - PREFLIGHT - COMPLETE

* Work completed
    - Validated the re-planned Level 2 plan against the repository. First line of `.preflight-status`: `PASS WITH ADVISORY`.
    - Empirically compiled `src/**/*.ts` and `test/host/**/*.ts` under TypeScript 6.0.2 with the planned `tsconfig` options against `@types/vscode@1.75.1` — zero errors, confirming the plan's fallback call-site-fix branch will not trigger.
    - Confirmed via `vscode-vsce` source (`validateVSCodeTypesCompatibility`) that vsce's engines/types check compares only the declared range strings, not the resolved lockfile version — validating the plan's root-cause diagnosis.
* Decisions made
    - No plan edits needed this run; the prior preflight's fixable finding was already resolved in the re-plan.
* Insights
    - vsce never inspects the lockfile-resolved `@types/vscode` version, only the string in `package.json` `devDependencies`. That is why caret float alone (already resolved to 1.134.0) never tripped `npm run package` — only a Dependabot-rewritten *declared* range would.
