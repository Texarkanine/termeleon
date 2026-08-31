# Progress

Scan extra directories for every walkable theme format already parsed (Ghostty, kitty, Alacritty, WezTerm, iTerm2), not only `.itermcolors`, and cover that with a fixture discovery test.

**Complexity:** Level 1

## 2026-08-31 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Confirmed persistent memory bank exists; active state was Fresh.
    - Intent taken as operator-approved issue #2 (no wait at clarification).
    - Classified Level 1: bug isolated to discovery wiring in `src/discover.ts`.
* Decisions made
    - Level 1: skip plan, creative, preflight, and reflect; go to BUILD then QA.
    - Extra-dir scanning targets walkable theme files (Ghostty, kitty, Alacritty, WezTerm, iTerm2). Windows Terminal `settings.json` and Xresources home files stay on their fixed paths unless BUILD finds a cheap fit.
* Insights
    - `DiscoverOptions.extraDirs` comment already claims "other loose theme files"; only `discoverIterm2` honors the option today.

## 2026-08-31 - BUILD - COMPLETE

* Work completed
    - Added `test/fixtures/extra/` with one file per walkable format and a discovery test that filters results by origin under that dir.
    - Passed `extraDirs` into Ghostty, kitty, Alacritty, and WezTerm discovery. iTerm2 already did this.
    - `npm run test:parsers` 12 passed; `npm run compile` passed.
* Decisions made
    - Thread extra dirs into existing discoverers rather than a second extra-dir walker that tries every parser.
    - Ghostty extra dirs use the same all-files walk as theme dirs; kitty `.conf`; Alacritty/WezTerm `.toml`; unusable cross-parses drop via `isUsable`.
    - Windows Terminal and Xresources remain on fixed paths (not walkable theme-pack files).
* Insights
    - Alacritty and WezTerm both walk extra `.toml`; each parser fails `isUsable` on the other's schema, so a mixed pack does not double-list.
    - Ghostty extra-dir names still dedupe against bundled themes (`seen` by stem): a pack file named like a bundled theme stays hidden.
