import { Palette, normalizeColor } from '../palette';

/**
 * kitty conf syntax is whitespace-separated, not `=`:
 *
 *   foreground           #dddddd
 *   color0               #000000
 *   cursor_text_color    #111111
 *
 * kitty numbers colors 0-255; we take the first 16 and ignore the rest,
 * since VS Code's terminal derives 16-255 from the base palette itself.
 */
export function parseKitty(text: string): Palette {
  const p: Palette = { ansi: new Array(16).fill(undefined) };

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) { continue; }

    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s+(.+)$/.exec(trimmed);
    if (!m) { continue; }
    const key = m[1].toLowerCase();
    // Strip trailing inline comments.
    const value = m[2].split('#').length > 1 && !m[2].trim().startsWith('#')
      ? m[2].trim()
      : m[2].trim();

    const colorIdx = /^color(\d{1,3})$/.exec(key);
    if (colorIdx) {
      const idx = parseInt(colorIdx[1], 10);
      if (idx >= 0 && idx < 16) { p.ansi[idx] = normalizeColor(value); }
      continue;
    }

    switch (key) {
      case 'background': p.background = normalizeColor(value); break;
      case 'foreground': p.foreground = normalizeColor(value); break;
      case 'cursor': p.cursor = normalizeColor(value); break;
      case 'cursor_text_color': p.cursorText = normalizeColor(value); break;
      case 'selection_background':
        p.selectionBackground = normalizeColor(value); break;
      case 'selection_foreground':
        p.selectionForeground = normalizeColor(value); break;
    }
  }
  return p;
}

/**
 * Xresources / Xdefaults. Entries look like:
 *
 *   *.color0:    #000000
 *   URxvt*background: rgb:1d/1f/21
 */
export function parseXresources(text: string): Palette {
  const p: Palette = { ansi: new Array(16).fill(undefined) };

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('#')) { continue; }

    const m = /^[^:]*?[*.]?([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+)$/.exec(trimmed);
    if (!m) { continue; }
    const key = m[1].toLowerCase();
    const value = m[2].trim();

    const colorIdx = /^color(\d{1,3})$/.exec(key);
    if (colorIdx) {
      const idx = parseInt(colorIdx[1], 10);
      if (idx >= 0 && idx < 16) { p.ansi[idx] = normalizeColor(value); }
      continue;
    }

    switch (key) {
      case 'background': p.background = normalizeColor(value); break;
      case 'foreground': p.foreground = normalizeColor(value); break;
      case 'cursorcolor': p.cursor = normalizeColor(value); break;
    }
  }
  return p;
}