---
task_id: vsix-github-releases
complexity_level: 2
date: 2026-08-31
status: completed
---

# TASK ARCHIVE: vsix-github-releases

## SUMMARY

Pinned `@vscode/vsce`, added `npm run package`, and wired release-please to upload a `.vsix` when a GitHub Release is created. README documents iterate vs sideload. No Marketplace publish. PR: https://github.com/Texarkanine/vscode-terminal-themes/pull/19

## REQUIREMENTS

- Attach a built VSIX to tagged GitHub Releases cut by release-please.
- Local command that builds the same artifact for Install from VSIX.
- Document the development loop. Feature branch off `initialdev`. No Marketplace jobs or secrets.

## IMPLEMENTATION

Publisher `texarkanine`; `prepackage` compiles then `vsce package --no-dependencies`. CI runs `npm run package`. release-please step `id: release`; gated checkout, `npm ci`, package, `gh release upload` with the helper-app token. First pack shipped `.cursor/`, `.summem/`, and `memory-bank/`; `.vscodeignore` now excludes those so the VSIX is LICENSE, changelog, package.json, README, and `dist/extension.js`.

## TESTING

Contract tests in `test/parsers.test.ts` `ci` section. `npm test`: parsers 45, discover 5, host 18. Live `npm run package` confirmed the slim file tree. Preflight PASS WITH ADVISORY. QA PASS.

## LESSONS LEARNED

- `vsce package` includes everything not in `.vscodeignore`. Name agent/memory trees there.
- Read vsce’s included-files tree during build; ignore-list string tests miss what actually packs.
- The word “Marketplace” in a denial comment is not `vsce publish`; assert on `vsce publish` / `VSCE_PAT`.

## PROCESS IMPROVEMENTS

Treat `.vscodeignore` as part of the packaging contract from the first plan, not a cleanup after the first tree dump.

## TECHNICAL IMPROVEMENTS

Preflight advisories left unapplied: upload the CI VSIX as a PR artifact; CI compiles twice (`compile` then `prepackage`). Harmless.

## NEXT STEPS

None. Merge [PR #19](https://github.com/Texarkanine/vscode-terminal-themes/pull/19) when ready. Marketplace publisher id remains issue #8.
