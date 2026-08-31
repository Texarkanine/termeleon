# Project Brief

## User Story

As a maintainer, I want a built `.vsix` attached to each GitHub Release that release-please cuts, and a local command that builds that same artifact, so I can sideload the extension before Marketplace publish exists.

## Use-Case(s)

### Use-Case 1

Release-please creates a tagged GitHub Release on `main`. CI packages the extension and uploads the `.vsix` to that release.

### Use-Case 2

A developer on a checkout runs a documented npm command, gets a `.vsix`, and installs it into their editor (Install from VSIX / `code --install-extension`).

### Use-Case 3

A developer looking at the README can follow the typical loop: iterate, package, sideload — without guessing at unpublished Marketplace steps.

## Requirements

1. When release-please reports a release was created, a follow-on job builds a `.vsix` and attaches it to that GitHub Release.
2. `package.json` has a `publisher` field sufficient for `vsce package` (GitHub-only; not Marketplace credentials).
3. `@vscode/vsce` is pinned as a devDependency and there is a local npm command that produces the same kind of `.vsix`.
4. README documents that local command and the typical development loop if it is not already documented.
5. Work lands on feature branch `feat/vsix-github-releases` off `initialdev`.

## Constraints

1. Do not publish to the VS Marketplace.
2. Do not treat helper-app GitHub credentials as Marketplace publisher credentials.
3. Release-please remains the source of version/tags; packaging is a follow-on, not a replacement.

## Acceptance Criteria

1. A GitHub Release created by release-please includes a built `terminal-theme-import-<version>.vsix` (or equivalent naming `vsce` produces).
2. `npm run` exposes a command that builds that VSIX locally after a compile.
3. README tells a developer how to iterate and how to install a local VSIX.
4. Marketplace publish jobs and secrets are not added.
