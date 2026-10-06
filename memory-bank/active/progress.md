# Progress

Discover the color schemes Windows Terminal offers, including inbox schemes in `defaults.json`, and make Mirror apply the default profile's scheme when `settings.json` never names one. The assumed name for that omitted case lives in one place in the code, and comes from `defaults.json` when that file states it.

**Complexity:** Level 2

## 2026-10-06 - COMPLEXITY-ANALYSIS - COMPLETE

* Work completed
    - Confirmed intent: list inbox schemes plus custom `settings.json` schemes, and mirror the default profile's scheme even when `colorScheme` is omitted
    - Classified the task as Level 2
* Decisions made
    - Level 2, because the change stays inside Windows Terminal discovery and the existing Mirror path already applies whatever discovery marks active
* Insights
    - On Windows Terminal 1.24.12741.0, `defaults.json` holds 14 inbox schemes and the user `settings.json` `schemes` array can be empty while the Color schemes page still shows those inbox schemes
    - An omitted `colorScheme` resolves to Campbell in Windows Terminal's own documentation; this install's `defaults.json` sets Campbell on the inbox PowerShell and Command Prompt profiles and does not set `profiles.defaults.colorScheme`

## 2026-10-06 - PLAN - COMPLETE

* Work completed
    - Wrote the Level 2 plan for `windows-terminal-inbox-schemes` in `memory-bank/active/tasks.md`
    - Mapped behaviors to `test/parsers.test.ts` and `test/discover.test.ts`
* Decisions made
    - Resolve active names as explicit user `colorScheme`, then the same resolution on `defaults.json`, then the exported constant `WINDOWS_TERMINAL_ASSUMED_COLOR_SCHEME`
    - Leave `activeWindowsTerminalScheme` as the explicit reader so an omitted key still returns no names from that function
    - Pair each `settings.json` with its install's `defaults.json`; a custom scheme of the same name replaces the inbox palette
    - Mark a scheme active only when a usable discovered palette matches the resolved name
* Insights
    - This install's inbox default is already a `colorScheme` on the legacy default profile inside `defaults.json`, so the constant is the stand-in for when that read comes back empty
