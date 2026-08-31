---
task_id: issue-10
date: 2026-08-31
complexity_level: 2
---

# Reflection: Detect Windows Terminal's active colorScheme

## Summary

Windows Terminal schemes named by `profiles.defaults.colorScheme` or the default profile are now flagged `active`, with a JSONC fixture and parser tests. QA passed; Mirror can treat that scheme as in use.

## Requirements vs Outcome

Delivered as specified in issue #10. Default-profile `colorScheme` wins over defaults when both are set (WT inheritance). Legacy `profiles` array and case-insensitive GUID match were included because they were cheap. Per-profile schemes beyond the default profile stayed out. Preflight's shared JSONC parse helper was added; that was not in the original plan.

## Plan Accuracy

File list, TDD sequence, and Ghostty-style helper were right. Discover filesystem tests stayed out (issue #5). The only plan change was taking the preflight advisory to share `parseWindowsTerminalSettings`.

## Build & QA Observations

Build was clean: six positive-path tests went red on the stub, then 19/19 green; compile succeeded. QA found no defects.

## Insights

### Technical

- A stub that returns `undefined` makes "absent / unparseable" tests green before any real code exists. Red on this task was only the positive paths.

### Process

- Nothing notable

### Million-Dollar Question

If active detection had been assumed from day one, `parseWindowsTerminal` would still emit palettes, and a sibling helper would still name the in-use scheme, both sharing one JSONC parse — which is what shipped. Returning `{ schemes, activeName }` from a single function would collapse two exports without matching Ghostty. The split is the house style; keep it.
