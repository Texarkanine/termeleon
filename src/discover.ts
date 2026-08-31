import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { DiscoveredTheme, Palette, isUsable } from './palette';
import { parseGhostty, activeGhosttyThemes } from './parsers/ghostty';
import { parseKitty, parseXresources } from './parsers/kitty';
import { parseAlacritty, parseWezterm, weztermSchemeName } from './parsers/toml';
import { parseItermColors, parseWindowsTerminal, activeWindowsTerminalScheme } from './parsers/iterm2';

/** Hard ceilings so a pathological directory can't stall the picker. */
const MAX_DEPTH = 3;
const MAX_FILES_PER_SOURCE = 800;

const home = os.homedir();
const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
const xdgDataDirs = (process.env.XDG_DATA_DIRS || '/usr/local/share:/usr/share')
  .split(':').filter(Boolean);

function exists(p: string): boolean {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function readText(p: string): string | undefined {
  try { return fs.readFileSync(p, 'utf8'); } catch { return undefined; }
}

/** Recursively lists files under `dir`, filtered by extension and capped. */
function walk(dir: string, exts: string[] | null, budget = { n: MAX_FILES_PER_SOURCE }, depth = 0): string[] {
  if (depth > MAX_DEPTH || budget.n <= 0 || !exists(dir)) { return []; }
  let entries: fs.Dirent[];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return []; }

  const found: string[] = [];
  for (const e of entries) {
    if (budget.n <= 0) { break; }
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      found.push(...walk(full, exts, budget, depth + 1));
    } else if (e.isFile()) {
      if (exts === null || exts.some((x) => e.name.toLowerCase().endsWith(x))) {
        found.push(full);
        budget.n--;
      }
    }
  }
  return found;
}

function stem(p: string): string {
  return path.basename(p).replace(/\.(conf|toml|itermcolors|json|yml|yaml)$/i, '');
}

// --------------------------------------------------------------------------
// Per-emulator discovery
// --------------------------------------------------------------------------

function ghosttyDirs(): { themes: string[]; configs: string[] } {
  const themes: string[] = [path.join(xdgConfig, 'ghostty', 'themes')];
  const configs: string[] = [path.join(xdgConfig, 'ghostty', 'config')];

  if (process.platform === 'darwin') {
    const appSupport = path.join(home, 'Library', 'Application Support', 'com.mitchellh.ghostty');
    themes.push(path.join(appSupport, 'themes'));
    configs.push(path.join(appSupport, 'config'));
    themes.push('/Applications/Ghostty.app/Contents/Resources/ghostty/themes');
    themes.push(path.join(home, 'Applications/Ghostty.app/Contents/Resources/ghostty/themes'));
  } else {
    for (const d of xdgDataDirs) { themes.push(path.join(d, 'ghostty', 'themes')); }
  }
  return { themes, configs };
}

function discoverGhostty(): DiscoveredTheme[] {
  const { themes, configs } = ghosttyDirs();

  let active: ReturnType<typeof activeGhosttyThemes> = {};
  for (const c of configs) {
    const text = readText(c);
    if (text) { active = { ...active, ...activeGhosttyThemes(text) }; }
  }
  const activeNames = new Set(
    [active.single, active.dark, active.light].filter(Boolean) as string[],
  );

  const out: DiscoveredTheme[] = [];
  const seen = new Set<string>();

  for (const dir of themes) {
    for (const file of walk(dir, null)) {
      const name = stem(file);
      if (seen.has(name)) { continue; }
      const text = readText(file);
      if (!text) { continue; }
      const palette = parseGhostty(text);
      if (!isUsable(palette)) { continue; }
      seen.add(name);
      out.push({ name, source: 'ghostty', origin: file, active: activeNames.has(name), palette });
    }
  }

  // A config with inline palette lines and no `theme =` is itself a theme.
  if (activeNames.size === 0) {
    for (const c of configs) {
      const text = readText(c);
      if (!text) { continue; }
      const palette = parseGhostty(text);
      if (isUsable(palette)) {
        out.push({ name: 'Ghostty config (inline)', source: 'ghostty', origin: c, active: true, palette });
      }
    }
  }
  return out;
}

function discoverKitty(): DiscoveredTheme[] {
  const base = path.join(xdgConfig, 'kitty');
  const out: DiscoveredTheme[] = [];
  const currentTheme = path.join(base, 'current-theme.conf');

  const files = [
    ...walk(path.join(base, 'themes'), ['.conf']),
    ...(exists(currentTheme) ? [currentTheme] : []),
    ...(exists(path.join(base, 'kitty.conf')) ? [path.join(base, 'kitty.conf')] : []),
  ];

  for (const file of files) {
    const text = readText(file);
    if (!text) { continue; }
    const palette = parseKitty(text);
    if (!isUsable(palette)) { continue; }
    out.push({
      name: file === currentTheme ? 'kitty current theme' : stem(file),
      source: 'kitty',
      origin: file,
      active: file === currentTheme,
      palette,
    });
  }
  return out;
}

function discoverAlacritty(): DiscoveredTheme[] {
  const bases = [
    path.join(xdgConfig, 'alacritty'),
    path.join(home, '.alacritty'),
  ];
  const out: DiscoveredTheme[] = [];

  for (const base of bases) {
    for (const file of walk(base, ['.toml'])) {
      const text = readText(file);
      if (!text) { continue; }
      let palette: Palette;
      try { palette = parseAlacritty(text); } catch { continue; }
      if (!isUsable(palette)) { continue; }
      out.push({
        name: stem(file),
        source: 'alacritty',
        origin: file,
        active: /alacritty\.toml$/i.test(file),
        palette,
      });
    }
  }
  return out;
}

function discoverWezterm(): DiscoveredTheme[] {
  const base = path.join(xdgConfig, 'wezterm');
  const out: DiscoveredTheme[] = [];

  for (const file of [...walk(path.join(base, 'colors'), ['.toml']), ...walk(base, ['.toml'])]) {
    const text = readText(file);
    if (!text) { continue; }
    let palette: Palette;
    try { palette = parseWezterm(text); } catch { continue; }
    if (!isUsable(palette)) { continue; }
    out.push({
      name: weztermSchemeName(text) ?? stem(file),
      source: 'wezterm',
      origin: file,
      active: false,
      palette,
    });
  }
  return out;
}

function discoverIterm2(extraDirs: string[]): DiscoveredTheme[] {
  if (process.platform !== 'darwin' && extraDirs.length === 0) { return []; }
  const dirs = [
    path.join(home, 'Library', 'Application Support', 'iTerm2'),
    ...extraDirs,
  ];
  const out: DiscoveredTheme[] = [];

  for (const dir of dirs) {
    for (const file of walk(dir, ['.itermcolors'])) {
      const text = readText(file);
      if (!text) { continue; }
      const palette = parseItermColors(text);
      if (!isUsable(palette)) { continue; }
      out.push({ name: stem(file), source: 'iterm2', origin: file, active: false, palette });
    }
  }
  return out;
}

function discoverWindowsTerminal(): DiscoveredTheme[] {
  const local = process.env.LOCALAPPDATA;
  if (!local) { return []; }
  const candidates = [
    path.join(local, 'Packages', 'Microsoft.WindowsTerminal_8wekyb3d8bbwe', 'LocalState', 'settings.json'),
    path.join(local, 'Packages', 'Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe', 'LocalState', 'settings.json'),
    path.join(local, 'Microsoft', 'Windows Terminal', 'settings.json'),
  ];
  const out: DiscoveredTheme[] = [];

  for (const file of candidates) {
    const text = readText(file);
    if (!text) { continue; }
    const activeName = activeWindowsTerminalScheme(text);
    for (const { name, palette } of parseWindowsTerminal(text)) {
      if (!isUsable(palette)) { continue; }
      out.push({ name, source: 'windows-terminal', origin: file, active: name === activeName, palette });
    }
  }
  return out;
}

function discoverXresources(): DiscoveredTheme[] {
  const out: DiscoveredTheme[] = [];
  for (const file of [path.join(home, '.Xresources'), path.join(home, '.Xdefaults')]) {
    const text = readText(file);
    if (!text) { continue; }
    const palette = parseXresources(text);
    if (!isUsable(palette)) { continue; }
    out.push({ name: path.basename(file), source: 'xresources', origin: file, active: true, palette });
  }
  return out;
}

export interface DiscoverOptions {
  /** Emulators to scan. Omit to scan all. */
  sources?: string[];
  /** Extra directories to sweep for .itermcolors and other loose theme files. */
  extraDirs?: string[];
}

/**
 * Scans the machine for readable terminal color schemes.
 * Never throws: a source that fails to read is simply absent from the result.
 */
export function discoverThemes(opts: DiscoverOptions = {}): DiscoveredTheme[] {
  const wanted = opts.sources && opts.sources.length
    ? new Set(opts.sources)
    : null;
  const want = (s: string) => !wanted || wanted.has(s);

  const results: DiscoveredTheme[] = [];
  const run = (name: string, fn: () => DiscoveredTheme[]) => {
    if (!want(name)) { return; }
    try { results.push(...fn()); } catch { /* a broken source is not fatal */ }
  };

  run('ghostty', discoverGhostty);
  run('kitty', discoverKitty);
  run('alacritty', discoverAlacritty);
  run('wezterm', discoverWezterm);
  run('iterm2', () => discoverIterm2(opts.extraDirs ?? []));
  run('windows-terminal', discoverWindowsTerminal);
  run('xresources', discoverXresources);

  // Active themes first, then alphabetical within source.
  return results.sort((a, b) =>
    Number(b.active) - Number(a.active) ||
    a.source.localeCompare(b.source) ||
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}