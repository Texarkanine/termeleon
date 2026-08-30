import { parse as parseToml } from 'smol-toml';
import { Palette, normalizeColor } from '../palette';

type Table = Record<string, any>;

function pick(obj: any, ...path: string[]): any {
  let cur = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== 'object') { return undefined; }
    cur = cur[key];
  }
  return cur;
}

/**
 * Alacritty TOML. Colors live under `[colors.*]` tables and are commonly
 * written as '0x1d1f21' rather than '#1d1f21'.
 *
 *   [colors.normal]
 *   black = "#1d1f21"
 *
 * Alacritty's pre-0.13 YAML configs are not handled; the schema moved and
 * supporting both doubles the parser for a deprecated format.
 */
export function parseAlacritty(text: string): Palette {
  const doc = parseToml(text) as Table;
  const p: Palette = { ansi: new Array(16).fill(undefined) };

  const order = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  const normal = pick(doc, 'colors', 'normal') ?? {};
  const bright = pick(doc, 'colors', 'bright') ?? {};
  order.forEach((name, i) => {
    p.ansi[i] = normalizeColor(normal[name]);
    p.ansi[i + 8] = normalizeColor(bright[name]);
  });

  p.background = normalizeColor(pick(doc, 'colors', 'primary', 'background'));
  p.foreground = normalizeColor(pick(doc, 'colors', 'primary', 'foreground'));
  p.cursor = normalizeColor(pick(doc, 'colors', 'cursor', 'cursor'));
  p.cursorText = normalizeColor(pick(doc, 'colors', 'cursor', 'text'));
  p.selectionBackground = normalizeColor(pick(doc, 'colors', 'selection', 'background'));
  p.selectionForeground = normalizeColor(pick(doc, 'colors', 'selection', 'text'));

  return p;
}

/**
 * WezTerm TOML color schemes. Uses arrays rather than named keys:
 *
 *   [colors]
 *   ansi    = ["#000", ...8]
 *   brights = ["#666", ...8]
 *
 * WezTerm's several hundred built-in schemes are defined in Lua inside the
 * binary and are not readable from disk, so only user scheme files are found.
 */
export function parseWezterm(text: string): Palette {
  const doc = parseToml(text) as Table;
  const p: Palette = { ansi: new Array(16).fill(undefined) };

  const colors = pick(doc, 'colors') ?? {};
  const ansi: string[] = Array.isArray(colors.ansi) ? colors.ansi : [];
  const brights: string[] = Array.isArray(colors.brights) ? colors.brights : [];
  for (let i = 0; i < 8; i++) {
    p.ansi[i] = normalizeColor(ansi[i]);
    p.ansi[i + 8] = normalizeColor(brights[i]);
  }

  p.background = normalizeColor(colors.background);
  p.foreground = normalizeColor(colors.foreground);
  p.cursor = normalizeColor(colors.cursor_bg);
  p.cursorText = normalizeColor(colors.cursor_fg);
  p.selectionBackground = normalizeColor(colors.selection_bg);
  p.selectionForeground = normalizeColor(colors.selection_fg);

  // A wezterm .toml may name itself under [metadata].
  return p;
}

export function weztermSchemeName(text: string): string | undefined {
  try {
    const doc = parseToml(text) as Table;
    const name = pick(doc, 'metadata', 'name');
    return typeof name === 'string' ? name : undefined;
  } catch {
    return undefined;
  }
}