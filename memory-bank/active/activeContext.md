# Active Context

## Current Task: mobaxterm-active-and-scan-cache
**Phase:** PLAN - IN-PROGRESS

## What Was Done
- Component analysis: MobaXterm default-root active marking, vscode-free `discoverThemes`, extension `collect`/`activate`, existing multi-candidate Mirror picker, README/STORE matrices.
- Open questions flagged: (1) how to find/mark the applied MobaXterm.ini when Documents is redirected; (2) scan-cache storage and refresh policy.
- Creative OQ1 resolved: Known Folder Documents as a MobaXterm default root; `documentsDir` injection for tests; `LastIniPath` not primary; extraDirs stay inactive.
- Creative OQ2 resolved: in-memory `ThemeCache`, warm on activate, wait if empty, no persistence, no per-command rescan.

## Next Step
- Finish Level 3 plan (test plan, implementation steps, pre-mortem) now that both open questions are resolved.
