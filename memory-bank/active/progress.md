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

## 2026-09-13 - BUILD - COMPLETE

* Work completed
    - Bumped TypeScript to 6.0.3; `moduleResolution: bundler`; `types: ["node"]`.
    - Pinned `@types/vscode` to `~1.75.0` (1.75.1); Dependabot ignore `>=1.76.0`.
    - Regenerated `package-lock.json` from a clean tree. `compile`, parser suite, `package`, and 47 host tests green.
* Decisions made
    - Did not add a package-validation command (vsce already gates declared ranges).
    - Pinned `scopeToActiveTheme` false in the mirror-preview host suite so those tests keep asserting unscoped keys; product default stays on.
* Insights
    - CI does not run `test:host`. The picker preview test has been failing locally since the #54 default flip; it was not a TypeScript 6 regression.

## 2026-09-13 - QA - COMPLETE (FAIL)

* Work completed
    - Semantic review of build commit `4703c51` against the Level 2 plan and project brief. Independently re-ran `npm run compile`, `npx tsx test/parsers.test.ts` (85/85), and `npm run package` — all green; vsce engines gate passes with `~1.75.0` against `engines.vscode` `^1.75.0`.
    - Verified every plan unit as implemented: TS 6.0.3, `bundler` + `commonjs` + `types: ["node"]`, no `ignoreDeprecations`, `@types/vscode` `~1.75.0` (1.75.1), Dependabot ignore `>=1.76.0` with rationale comment, TS7/`@types/node` ignores retained, no change-detector tests, no src changes.
* Decisions made
    - FAIL on one documentation finding: `techContext.md` states the `ci` test section locks the `@types/vscode` `>=1.76.0` ignore; the test asserts only the TypeScript 7 and `@types/node` ignores. Plan unit 3 step 3 explicitly prohibited describing new parser contract tests for this pin. Build must rerun to correct the sentence.
    - Advisory only: the `picker.test.ts` `scopeToActiveTheme` pin was outside the written plan units but required by the plan's own `test:host` verification step; accepted as minimal and documented.
* Insights
    - The pin's enforcement is policy (tilde range + Dependabot ignore + vsce declared-range check), not tests — the memory bank must not describe it as test-locked, or future work will trust a safety net that does not exist.

## 2026-09-13 - BUILD - COMPLETE (QA rework)

* Work completed
    - Moved the `@types/vscode` tilde-pin / Dependabot ignore note to the Package bullet in `techContext.md`. The parser `ci` section again lists only the TypeScript 7 and `@types/node` ignores it actually asserts.
* Decisions made
    - One-line docs fix; no code change.

## 2026-09-13 - QA - COMPLETE (PASS)

* Work completed
    - Re-reviewed commit `b559fa7` against the Level 2 plan and project brief, using the correct merge-base `d8e8a20` (an earlier local diff against a divergent, unpushed `release 0.8.0` commit had falsely suggested CHANGELOG/manifest regressions — a branch-history artifact, not a real finding).
    - Independently re-ran all four plan verification commands: `compile` (clean), parser suite (85/85, `ci` section confirmed to assert only the TS7/`@types/node` ignores), `package` (vsce engines gate green), `test:host` (47/47, after a sandbox-only `XDG_RUNTIME_DIR` fix — the default `/run/user/1000` doesn't exist in this environment; unrelated to the code and to CI, which doesn't run `test:host`).
* Decisions made
    - PASS. The round-1 documentation finding is corrected and verified consistent with what the test source actually asserts. The `picker.test.ts` `scopeToActiveTheme` advisory is carried forward as non-blocking (test-only, minimal, required by the plan's own verification gate).
* Insights
    - Divergent local branch history (a branch cut before an unpushed release-please commit landed on a sibling branch) can make a naive `git diff <old-tag>..HEAD` show phantom regressions; always confirm the actual merge-base with `git log --oneline --parents` before trusting a diff stat.

