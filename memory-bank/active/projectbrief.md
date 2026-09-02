# Project Brief - Investigate Built-in Theme Support

## Overview
Investigate built-in theme detection and active theme color detection in terminal emulators (such as WezTerm, iTerm2, and others) for Termeleon (GitHub Issue #36).

## Requirements
- Investigate whether built-in theme palettes and/or active theme colors can be reliably detected for terminal emulators without brittle reflection or vendoring static upstream sources.
- For emulators where reliable, non-brittle detection is possible without vendoring or fragile reflection, integrate built-in themes into discovery/picker and active theme colors into mirror.
- For emulators where detection is brittle, impossible, or requires vendoring, do not add bespoke reflection; instead, clearly document in `README.md`, `STORE.md`, and `memory-bank/productContext.md` that built-in emulator themes do not appear in Termeleon—only user-installed addons and theme files on disk are scanned.
- Update tests, documentation, and relevant discovery/parsing code accordingly following TDD.
