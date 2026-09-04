# Task: mobaxterm-active-and-scan-cache

* Task ID: mobaxterm-active-and-scan-cache
* Complexity: Level 3
* Type: feature

Make MobaXterm's applied palette count as active for Mirror (and ask when Alacritty is also active), correct the README/STORE pick-vs-mirror matrices, and serve discovery from a warm cache with an activation-time scan.

## Component Analysis

### Affected Components
- **MobaXterm discovery** (`src/discover.ts` `discoverMobaXterm`): currently scans `%USERPROFILE%\Documents\MobaXterm`, OneDrive variants, and `%APPDATA%\MobaXterm`; marks only the first usable root `MobaXterm.ini` in those default roots as `active`. Extra directories are listed but never active. Needs to find the applied INI when Windows Documents is not `%USERPROFILE%\Documents`.
- **Discovery entry** (`discoverThemes`, `DiscoverOptions`): vscode-free scan API used by the extension and by `test/discover.test.ts`. May need an injectable documents/root path so tests stay env-driven and the shell can pass a resolved Known Folder.
- **Extension shell** (`src/extension.ts`): `collect()` always calls `discoverThemes` under a progress window; `activate()` only registers commands. Needs a cache, an activation-time scan, and command paths that serve cache / wait on empty / refresh in background.
- **Mirror UX** (`commandMirror`, `mirrorCandidates`, `pickMirrorCandidate`): already asks when `candidates.length > 1`. No new picker — once MobaXterm is `active`, this path works. Host tests in `test/host/picker.test.ts` already cover multi-candidate QuickPick.
- **Docs** (`README.md`, `STORE.md`): OS matrices currently use `✅` for any support. Need pick-and-mirror vs pick-only (and a legend). Formats tables' "Active theme detected" column must stay consistent with the implementation.

### Cross-Module Dependencies
- `extension.collect` → `discoverThemes` → `discoverMobaXterm` / other discoverers → parsers → `Palette`
- `commandMirror` → `collect` → filter `active` → `mirrorCandidates` → optional `pickMirrorCandidate` → `applyPalette` / `applyPalettePair`
- Cache lives in the vscode-bound shell and must not leak `vscode` into `discover.ts`
- Config (`termeleon.sources`, `termeleon.extraDirectories`) is an input to both the cache key and `discoverThemes`

### Boundary Changes
- `DiscoverOptions` may gain an optional Windows Documents (or extra default-root) injection — public to tests, not a marketplace API
- Extension gains scan-cache state (in-memory and/or `globalState`) and `activate()` starts a scan
- User-facing command behavior: Import/Mirror no longer always wait on a full walk when cache is warm

### Invariants & Constraints
- Discovery must remain vscode-free (`test:parsers` stays host-free)
- `extensionKind` stays `["ui"]`
- Extra directories remain extra *theme* dirs: theme-pack `.ini` / `.mxtcolors` must not become active (existing tests and PR #47 review)
- Nested `MobaXterm.ini` under a default root must not become active
- `.mxtsessions` and dropdown indexes stay unscanned
- Cache must not apply a stale palette as if it were a fresh disk read without a defined refresh path
- Local WSL gate is `test:parsers` + `compile`; host tests still ship for CI

## Open Questions

- [x] **How to mark MobaXterm's applied INI as active when Documents is not `%USERPROFILE%\Documents`**
  - Problem: Mirror already asks when multiple themes are `active`. MobaXterm shows in the picker but is not `active`, so Mirror takes Alacritty. Default roots miss Known Folder Documents.
  - Why ambiguous: Known Folder Documents, MobaXterm `LastIniPath` (registry), and loosening extraDirectory active-marking are all viable and were explicitly deferred in the last archive.
  - Constraints: vscode-free core; no native addons; do not mark extraDir theme packs or nested INIs active; first-default-root-wins stays the active rule among real config roots.
  - → Resolved: add Known Folder Documents (`GetFolderPath('MyDocuments')`, registry Personal fallback) as a default root; inject `DiscoverOptions.documentsDir` for tests. Do not use `LastIniPath` as the primary mechanism; extraDirs stay inactive. (see `memory-bank/active/creative/creative-mobaxterm-active-root.md`)

- [ ] **Where the scan cache lives and when it refreshes**
  - Problem: Commands currently block on a full `discoverThemes` walk every time. Need serve-cache-immediately, wait only when empty, start a scan on activate.
  - Why ambiguous: in-memory (warm after activate) vs persist in `globalState` (instant after restart, stale risk) vs both; whether a command also kicks a background refresh or only activate does.
  - Constraints: vscode-bound only; cache key must include `sources` + `extraDirectories`; empty cache still waits; do not import `vscode` into discover.
