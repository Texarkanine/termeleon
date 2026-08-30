import { Palette, normalizeColor } from '../palette';

/**
 * Ghostty theme files and configs share one syntax: `key = value`, with
 * the 16 ANSI slots spelled `palette = N=#hex`.
 *
 *   palette = 0=#000000
 *   background = #2b2b2b
 *   cursor-text = #c0bbb6
 *
 * A leading `#` marks a comment, which means we must distinguish a comment
 * line from a color value; we only ever read values after an `=`.
 */
export function parseGhostty(text: string): Palette {
  const p: Palette = { ansi: new Array(16).fill(undefined) };

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) { continue; }

    const eq = trimmed.indexOf('=');
    if (eq === -1) { continue; }
    const key = trimmed.slice(0, eq).trim().toLowerCase();
    const value = trimmed.slice(eq + 1).trim();

    if (key === 'palette') {
      const inner = /^(\d{1,3})\s*=\s*(.+)$/.exec(value);
      if (!inner) { continue; }
      const idx = parseInt(inner[1], 10);
      if (idx >= 0 && idx < 16) {
        p.ansi[idx] = normalizeColor(inner[2]);
      }
      continue;
    }

    switch (key) {
      case 'background': p.background = normalizeColor(value); break;
      case 'foreground': p.foreground = normalizeColor(value); break;
      case 'cursor-color': p.cursor = normalizeColor(value); break;
      case 'cursor-text': p.cursorText = normalizeColor(value); break;
      case 'selection-background':
        p.selectionBackground = normalizeColor(value); break;
      case 'selection-foreground':
        p.selectionForeground = normalizeColor(value); break;
    }
  }
  return p;
}

/**
 * Reads the active theme name(s) out of a Ghostty config.
 * Ghostty supports `theme = X` and the split form `theme = dark:X,light:Y`.
 */
export function activeGhosttyThemes(configText: string): { dark?: string; light?: string; single?: string } {
  const result: { dark?: string; light?: string; single?: string } = {};

  for (const line of configText.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) { continue; }
    const m = /^theme\s*=\s*(.+)$/i.exec(trimmed);
    if (!m) { continue; }

    const value = m[1].trim().replace(/^["']|["']$/g, '');
    if (/(^|,)\s*(dark|light)\s*:/i.test(value)) {
      for (const part of value.split(',')) {
        const pm = /^\s*(dark|light)\s*:\s*(.+?)\s*$/i.exec(part);
        if (pm) {
          const mode = pm[1].toLowerCase() as 'dark' | 'light';
          result[mode] = pm[2].replace(/^["']|["']$/g, '');
        }
      }
    } else {
      result.single = value;
    }
  }
  return result;
}