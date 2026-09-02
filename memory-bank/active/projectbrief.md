# Project Brief

## User Story

As a Windows user who looks at WSL through MobaXterm, I want Termeleon to either import MobaXterm palettes the same way it imports other emulator themes, or tell me plainly that those colors cannot be read, so I am not left wondering why MobaXterm is missing from the supported list.

## Use-Case(s)

### Import MobaXterm palettes if they live on disk

If MobaXterm stores ANSI palettes (user-chosen and/or built-in colorization options) in files Termeleon can parse, those palettes appear in the import picker and can be applied to the VS Code integrated terminal.

### Document an unreadable store

If those palettes live only inside the app — compiled defaults, a proprietary or binary store, registry blobs we cannot map, or similar — Termeleon does not ship a parser that cannot find them. The gap is recorded in the same places other in-scope format limits already live.

## Requirements

1. Investigate where MobaXterm keeps terminal palettes, including built-in colorization options, on a Windows install.
2. If palettes can be discovered and parsed from on-disk files without vendoring upstream colors or inspecting binary internals, add MobaXterm as a source following the existing parser-plus-discovery pattern.
3. If they cannot, document that as a known gap in user-facing docs and persistent architecture context, in the same style as Windows Terminal packaged defaults and WezTerm compiled schemes.
4. Do not change the `Palette` contract, apply path, or `extensionKind`.

## Constraints

1. Termeleon only reads theme files and addons already on disk (plus custom schemes already in a settings file). It does not invent or ship palettes.
2. Known-limit policy already excludes compiled-in presets and fragile binary reflection.
3. MobaXterm is a Windows application. Discovery, if any, runs on the local Windows filesystem (`extensionKind: ["ui"]`), which is the machine where MobaXterm actually lives even when the VS Code window is a WSL remote.
4. A new walkable format must take `extraDirs` the same way as Ghostty, kitty, Alacritty, WezTerm, and iTerm2. Fixed-path formats (Windows Terminal, Xresources) stay on fixed files.

## Acceptance Criteria

1. The investigation concludes with one of two shipped outcomes: MobaXterm palettes are discoverable in the picker from on-disk files, or the unreadable-store gap is documented in `README.md`, `STORE.md`, and persistent memory-bank context.
2. If a parser ships, it emits `Palette` from vscode-free core, is covered by parser and discovery tests, and does not grow a second VS Code mapping table.
3. If a parser does not ship, no MobaXterm origin appears in the picker, and the documented reason matches what the investigation found.
