# Progress

Attach a packaged `.vsix` to GitHub Releases cut by release-please, add a local package command, and document the typical sideload/development loop. Feature branch off `initialdev`. No Marketplace publish.

**Complexity:** Level 2

## 2026-08-31 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Validated intent: VSIX on GitHub Releases, local package command, document the development loop, branch off `initialdev`
    - Classified as Level 2 (self-contained release/packaging enhancement)
* Decisions made
    - Level 2: not a bug fix; not Marketplace or a new release architecture
    - Feature branch `feat/vsix-github-releases`
* Insights
    - release-please-action does not attach files; a follow-on job gated on `release_created` is the usual shape
    - `vsce package` needs a `publisher` field even when not publishing to Marketplace
