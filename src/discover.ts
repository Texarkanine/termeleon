import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawnSync } from 'child_process';

import { DiscoveredTheme, Palette, isUsable } from './palette';
import { parseGhostty, activeGhosttyThemes } from './parsers/ghostty';
import { parseKitty, parseXresources } from './parsers/kitty';
import { parseAlacritty, alacrittyImports, resolveAlacrittyImport, parseWezterm, weztermSchemeName } from './parsers/toml';
import { parseItermColors, parseItermColorPresets, parseWindowsTerminal, resolveWindowsTerminalActiveScheme, isWindowsTerminalSchemeActive } from './parsers/iterm2';
import { parseMobaXterm } from './parsers/mobaxterm';

/** Hard ceilings so a pathological directory can't stall the picker. */
const MAX_DEPTH = 3;
const MAX_FILES_PER_SOURCE = 800;

/** Process home used for config paths. Read at scan time so tests can point `$HOME` at a fixture tree. */
function homeDir(): string {
  return os.homedir();
}

/** `$XDG_CONFIG_HOME`, or `~/.config` when that env var is unset. */
function xdgConfigDir(): string {
  return process.env.XDG_CONFIG_HOME || path.join(homeDir(), '.config');
}

/** `$XDG_DATA_DIRS` split on `:`, with the usual FHS fallback. */
function xdgDataDirectories(): string[] {
  return (process.env.XDG_DATA_DIRS || '/usr/local/share:/usr/share')
    .split(':').filter(Boolean);
}

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
  return path.basename(p).replace(/\.(conf|toml|itermcolors|json|yml|yaml|ini|mxtcolors)$/i, '');
}

// --------------------------------------------------------------------------
// Per-emulator discovery
// --------------------------------------------------------------------------

function ghosttyDirs(): { themes: string[]; configs: string[] } {
  const themes: string[] = [path.join(xdgConfigDir(), 'ghostty', 'themes')];
  const configs: string[] = [path.join(xdgConfigDir(), 'ghostty', 'config')];

  if (process.platform === 'darwin') {
    const appSupport = path.join(homeDir(), 'Library', 'Application Support', 'com.mitchellh.ghostty');
    themes.push(path.join(appSupport, 'themes'));
    configs.push(path.join(appSupport, 'config'));
    themes.push('/Applications/Ghostty.app/Contents/Resources/ghostty/themes');
    themes.push(path.join(homeDir(), 'Applications/Ghostty.app/Contents/Resources/ghostty/themes'));
  } else {
    for (const d of xdgDataDirectories()) { themes.push(path.join(d, 'ghostty', 'themes')); }
  }
  return { themes, configs };
}

function discoverGhostty(extraDirs: string[]): DiscoveredTheme[] {
  const { themes, configs } = ghosttyDirs();
  themes.push(...extraDirs);

  let active: ReturnType<typeof activeGhosttyThemes> = {};
  for (const c of configs) {
    const text = readText(c);
    if (text) { active = { ...active, ...activeGhosttyThemes(text) }; }
  }
  const hasThemeLine = !!(active.single || active.dark || active.light);

  const entries: { name: string; origin: string; palette: Palette }[] = [];
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
      entries.push({ name, origin: file, palette });
    }
  }

  // A config with inline palette lines and no `theme =` is itself a theme.
  if (!hasThemeLine) {
    let hasInline = false;
    for (const c of configs) {
      const text = readText(c);
      if (!text) { continue; }
      const palette = parseGhostty(text);
      if (isUsable(palette)) {
        entries.push({ name: 'Ghostty config (inline)', origin: c, palette });
        hasInline = true;
      }
    }
    return toGhosttyDiscovered(entries, hasInline ? { single: 'Ghostty config (inline)' } : {});
  }

  return toGhosttyDiscovered(entries, active);
}

function discoverKitty(extraDirs: string[]): DiscoveredTheme[] {
  const base = path.join(xdgConfigDir(), 'kitty');
  const out: DiscoveredTheme[] = [];
  const currentTheme = path.join(base, 'current-theme.conf');

  const files = [
    ...walk(path.join(base, 'themes'), ['.conf']),
    ...(exists(currentTheme) ? [currentTheme] : []),
    ...(exists(path.join(base, 'kitty.conf')) ? [path.join(base, 'kitty.conf')] : []),
    ...extraDirs.flatMap((dir) => walk(dir, ['.conf'])),
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

function discoverAlacritty(extraDirs: string[]): DiscoveredTheme[] {
  const bases = [
    path.join(xdgConfigDir(), 'alacritty'),
    path.join(homeDir(), '.alacritty'),
  ];
  if (process.env.APPDATA) {
    bases.push(path.join(process.env.APPDATA, 'alacritty'));
  }
  bases.push(...extraDirs);

  const seen = new Set<string>();
  const out: DiscoveredTheme[] = [];
  const configs: string[] = [];

  const resolvedKey = (file: string): string => {
    try { return fs.realpathSync(file); } catch { return path.resolve(file); }
  };

  for (const base of bases) {
    for (const file of walk(base, ['.toml'])) {
      const key = resolvedKey(file);
      if (seen.has(key)) { continue; }
      seen.add(key);
      if (path.basename(file).toLowerCase() === 'alacritty.toml') {
        configs.push(file);
      }
      const text = readText(file);
      if (!text) { continue; }
      let palette: Palette;
      try { palette = parseAlacritty(text); } catch { continue; }
      if (!isUsable(palette)) { continue; }
      out.push({
        name: stem(file),
        source: 'alacritty',
        origin: file,
        active: false,
        palette,
      });
    }
  }

  const home = process.env.USERPROFILE || homeDir();
  const activeKeys = new Set<string>();

  for (const config of configs) {
    const text = readText(config);
    if (!text) { continue; }
    let configPalette: Palette | undefined;
    try {
      configPalette = parseAlacritty(text);
    } catch {
      configPalette = undefined;
    }
    if (configPalette && isUsable(configPalette)) {
      activeKeys.add(resolvedKey(config));
      continue;
    }
    let lastUsable: string | undefined;
    for (const spec of alacrittyImports(text)) {
      const resolved = resolveAlacrittyImport(spec, config, home);
      const importText = readText(resolved);
      if (!importText) { continue; }
      let palette: Palette;
      try { palette = parseAlacritty(importText); } catch { continue; }
      if (!isUsable(palette)) { continue; }
      lastUsable = resolved;
      const key = resolvedKey(resolved);
      if (!seen.has(key)) {
        seen.add(key);
        out.push({
          name: stem(resolved),
          source: 'alacritty',
          origin: resolved,
          active: false,
          palette,
        });
      }
    }
    if (lastUsable) { activeKeys.add(resolvedKey(lastUsable)); }
  }

  for (const t of out) {
    t.active = activeKeys.has(resolvedKey(t.origin));
  }
  return out;
}

function discoverWezterm(extraDirs: string[]): DiscoveredTheme[] {
  const base = path.join(xdgConfigDir(), 'wezterm');
  const out: DiscoveredTheme[] = [];
  const dirs = [path.join(base, 'colors'), base, ...extraDirs];
  const seen = new Set<string>();

  for (const file of dirs.flatMap((dir) => walk(dir, ['.toml']))) {
    if (seen.has(file)) { continue; }
    seen.add(file);
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
    path.join(homeDir(), 'Library', 'Application Support', 'iTerm2'),
    ...extraDirs,
  ];
  const out: DiscoveredTheme[] = [];
  const seen = new Set<string>();

  for (const dir of dirs) {
    for (const file of walk(dir, ['.itermcolors'])) {
      const text = readText(file);
      if (!text) { continue; }
      const palette = parseItermColors(text);
      if (!isUsable(palette)) { continue; }
      const name = stem(file);
      seen.add(name);
      out.push({ name, source: 'iterm2', origin: file, active: false, palette });
    }
  }

  const presetFiles: string[] = [];
  if (process.platform === 'darwin') {
    presetFiles.push(
      '/Applications/iTerm.app/Contents/Resources/ColorPresets.plist',
      path.join(homeDir(), 'Applications', 'iTerm.app', 'Contents', 'Resources', 'ColorPresets.plist'),
      '/Applications/iTerm2.app/Contents/Resources/ColorPresets.plist',
      path.join(homeDir(), 'Applications', 'iTerm2.app', 'Contents', 'Resources', 'ColorPresets.plist'),
    );
  }
  for (const dir of extraDirs) {
    for (const file of walk(dir, ['.plist'])) {
      if (path.basename(file).toLowerCase() === 'colorpresets.plist') {
        presetFiles.push(file);
      }
    }
  }

  for (const file of presetFiles) {
    if (!exists(file)) { continue; }
    const text = readText(file);
    if (!text) { continue; }
    for (const { name, palette } of parseItermColorPresets(text)) {
      if (seen.has(name) || !isUsable(palette)) { continue; }
      seen.add(name);
      out.push({ name, source: 'iterm2', origin: file, active: false, palette });
    }
  }

  return out;
}

interface WindowsTerminalInstallFiles {
  settings?: string;
  defaults?: string;
}

function windowsTerminalSchemes(install: WindowsTerminalInstallFiles): DiscoveredTheme[] {
  const settingsText = install.settings ? readText(install.settings) : undefined;
  const defaultsText = install.defaults ? readText(install.defaults) : undefined;
  const activeNames = resolveWindowsTerminalActiveScheme(settingsText, defaultsText).names;
  const byName = new Map<string, DiscoveredTheme>();

  const add = (file: string | undefined, text: string | undefined) => {
    if (!file || !text) { return; }
    for (const { name, palette } of parseWindowsTerminal(text)) {
      if (!isUsable(palette)) { continue; }
      byName.set(name.toLowerCase(), {
        name,
        source: 'windows-terminal',
        origin: file,
        active: false,
        palette,
      });
    }
  };

  add(install.defaults, defaultsText);
  add(install.settings, settingsText);

  const themes = [...byName.values()];
  for (const theme of themes) {
    theme.active = isWindowsTerminalSchemeActive(theme.name, activeNames);
  }
  return themes;
}

function windowsTerminalInstalls(): WindowsTerminalInstallFiles[] {
  const local = process.env.LOCALAPPDATA;
  const defaultsFiles = windowsTerminalDefaultsFiles();
  const previewDefaults = defaultsFiles.find((file) => file.includes('WindowsTerminalPreview'));
  const stableDefaults = defaultsFiles.find((file) => !file.includes('WindowsTerminalPreview'));
  const installs: WindowsTerminalInstallFiles[] = [];

  if (local) {
    installs.push({
      settings: path.join(local, 'Packages', 'Microsoft.WindowsTerminal_8wekyb3d8bbwe', 'LocalState', 'settings.json'),
      defaults: stableDefaults,
    });
    installs.push({
      settings: path.join(local, 'Packages', 'Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe', 'LocalState', 'settings.json'),
      defaults: previewDefaults,
    });
    installs.push({
      settings: path.join(local, 'Microsoft', 'Windows Terminal', 'settings.json'),
    });
  } else {
    if (stableDefaults) { installs.push({ defaults: stableDefaults }); }
    if (previewDefaults) { installs.push({ defaults: previewDefaults }); }
  }
  return installs;
}

function discoverWindowsTerminal(files: WindowsTerminalInstallFiles[] | undefined): DiscoveredTheme[] {
  const installs = files ?? windowsTerminalInstalls();
  const out: DiscoveredTheme[] = [];
  for (const install of installs) {
    out.push(...windowsTerminalSchemes(install));
  }
  return out;
}

function discoverMobaXterm(extraDirs: string[], documentsDir?: string): DiscoveredTheme[] {
  const user = process.env.USERPROFILE || homeDir();
  const defaultRoots: string[] = [];
  if (documentsDir) {
    defaultRoots.push(path.join(documentsDir, 'MobaXterm'));
  }
  defaultRoots.push(path.join(user, 'Documents', 'MobaXterm'));
  if (process.env.ONEDRIVE) {
    defaultRoots.push(path.join(process.env.ONEDRIVE, 'Documents', 'MobaXterm'));
  }
  defaultRoots.push(path.join(user, 'OneDrive', 'Documents', 'MobaXterm'));
  if (process.env.APPDATA) {
    defaultRoots.push(path.join(process.env.APPDATA, 'MobaXterm'));
  }

  const uniqueDefaults: string[] = [];
  const seenRoot = new Set<string>();
  for (const dir of defaultRoots) {
    const resolved = path.resolve(dir);
    if (seenRoot.has(resolved)) { continue; }
    seenRoot.add(resolved);
    uniqueDefaults.push(dir);
  }

  const defaultSet = new Set(uniqueDefaults.map((d) => path.resolve(d)));
  const seen = new Set<string>();
  const out: DiscoveredTheme[] = [];
  let haveActive = false;

  for (const dir of [...uniqueDefaults, ...extraDirs]) {
    const fromDefault = defaultSet.has(path.resolve(dir));
    for (const file of walk(dir, ['.ini', '.mxtcolors'])) {
      let key = file;
      try { key = fs.realpathSync(file); } catch { /* keep walk path */ }
      if (seen.has(key)) { continue; }
      seen.add(key);
      const text = readText(file);
      if (!text) { continue; }
      const palette = parseMobaXterm(text);
      if (!isUsable(palette)) { continue; }
      const active = !haveActive && fromDefault
        && path.resolve(path.dirname(file)) === path.resolve(dir)
        && path.basename(file).toLowerCase() === 'mobaxterm.ini';
      if (active) { haveActive = true; }
      out.push({
        name: stem(file),
        source: 'mobaxterm',
        origin: file,
        active,
        palette,
      });
    }
  }
  return out;
}

function discoverXresources(): DiscoveredTheme[] {
  const out: DiscoveredTheme[] = [];
  for (const file of [path.join(homeDir(), '.Xresources'), path.join(homeDir(), '.Xdefaults')]) {
    const text = readText(file);
    if (!text) { continue; }
    const palette = parseXresources(text);
    if (!isUsable(palette)) { continue; }
    out.push({ name: path.basename(file), source: 'xresources', origin: file, active: true, palette });
  }
  return out;
}

export type MirrorCandidate =
  | { kind: 'pair'; dark: DiscoveredTheme; light: DiscoveredTheme }
  | { kind: 'theme'; theme: DiscoveredTheme };

/**
 * Stamps `active` and `appearance` onto parsed Ghostty theme files using the
 * names from `activeGhosttyThemes`. `discoverGhostty` must call this rather
 * than setting those fields inline.
 */
export function toGhosttyDiscovered(
  entries: { name: string; origin: string; palette: Palette }[],
  active: { dark?: string; light?: string; single?: string },
): DiscoveredTheme[] {
  const activeNames = new Set(
    [active.single, active.dark, active.light].filter(Boolean) as string[],
  );
  return entries.map((e) => ({
    name: e.name,
    source: 'ghostty',
    origin: e.origin,
    active: activeNames.has(e.name),
    appearance: e.name === active.dark ? 'dark' : e.name === active.light ? 'light' : undefined,
    palette: e.palette,
  }));
}

/** Both halves of a Ghostty split theme, or undefined if this is not a pair. */
export function activeGhosttyPair(
  themes: DiscoveredTheme[],
): { dark: DiscoveredTheme; light: DiscoveredTheme } | undefined {
  const dark = themes.find((t) => t.source === 'ghostty' && t.active && t.appearance === 'dark');
  const light = themes.find((t) => t.source === 'ghostty' && t.active && t.appearance === 'light');
  if (!dark || !light) { return undefined; }
  return { dark, light };
}

/**
 * Mirror choices: a Ghostty dark/light pair is one candidate, never two.
 * Other emulators' active themes stay as individual candidates.
 */
function resolvedKey(file: string): string {
  try { return fs.realpathSync(file); } catch { return path.resolve(file); }
}

function liveHome(): string {
  return homeDir();
}

function sourceWanted(sources: string[] | undefined, name: string): boolean {
  return !sources || sources.length === 0 || sources.includes(name);
}

/**
 * File readers Mirror uses to learn which theme is selected now.
 * Path functions return the live files only. They do not walk theme directories.
 */
export interface MirrorLiveReaders {
  readText(file: string): string | undefined;
  windowsTerminalInstalls(): { settings?: string; defaults?: string }[];
  ghosttyConfigPaths(): string[];
  alacrittyConfigPaths(): string[];
  kittyCurrentThemePath(): string;
  mobaIniPaths(): string[];
  xresourcesPaths(): string[];
}

function stampTheme(
  theme: DiscoveredTheme,
  active: boolean,
  appearance?: 'dark' | 'light',
): DiscoveredTheme {
  const copy: DiscoveredTheme = { ...theme, active };
  if (appearance) { copy.appearance = appearance; }
  else { delete copy.appearance; }
  return copy;
}

function liveWindowsTerminal(readers: MirrorLiveReaders): DiscoveredTheme[] {
  const out: DiscoveredTheme[] = [];
  for (const install of readers.windowsTerminalInstalls()) {
    const settingsText = install.settings ? readers.readText(install.settings) : undefined;
    const defaultsText = install.defaults ? readers.readText(install.defaults) : undefined;
    const activeNames = resolveWindowsTerminalActiveScheme(settingsText, defaultsText).names;
    const byName = new Map<string, DiscoveredTheme>();
    const add = (file: string | undefined, text: string | undefined) => {
      if (!file || text === undefined) { return; }
      for (const { name, palette } of parseWindowsTerminal(text)) {
        if (!isUsable(palette)) { continue; }
        byName.set(name.toLowerCase(), {
          name, source: 'windows-terminal', origin: file, active: false, palette,
        });
      }
    };
    add(install.defaults, defaultsText);
    add(install.settings, settingsText);
    for (const theme of byName.values()) {
      if (isWindowsTerminalSchemeActive(theme.name, activeNames)) {
        out.push(stampTheme(theme, true));
      }
    }
  }
  return out;
}

function liveGhostty(cached: DiscoveredTheme[], readers: MirrorLiveReaders): DiscoveredTheme[] {
  let names: ReturnType<typeof activeGhosttyThemes> = {};
  const inlineOrigins = new Set<string>();
  let sawThemeLine = false;
  let sawConfig = false;
  for (const config of readers.ghosttyConfigPaths()) {
    const text = readers.readText(config);
    if (text === undefined) { continue; }
    sawConfig = true;
    const parsed = activeGhosttyThemes(text);
    if (parsed.single || parsed.dark || parsed.light) {
      sawThemeLine = true;
      names = { ...names, ...parsed };
    } else {
      inlineOrigins.add(resolvedKey(config));
    }
  }
  if (!sawConfig) { return []; }
  if (sawThemeLine) {
    const wanted = new Set(
      [names.single, names.dark, names.light].filter((n): n is string => !!n),
    );
    return cached
      .filter((t) => t.source === 'ghostty' && wanted.has(t.name))
      .map((t) => stampTheme(
        t,
        true,
        t.name === names.dark ? 'dark' : t.name === names.light ? 'light' : undefined,
      ));
  }
  return cached
    .filter((t) => t.source === 'ghostty' && inlineOrigins.has(resolvedKey(t.origin)))
    .map((t) => stampTheme(t, true));
}

function liveAlacritty(cached: DiscoveredTheme[], readers: MirrorLiveReaders): DiscoveredTheme[] {
  const byKey = new Map<string, DiscoveredTheme>();
  for (const theme of cached) {
    if (theme.source === 'alacritty') { byKey.set(resolvedKey(theme.origin), theme); }
  }
  const chosen: DiscoveredTheme[] = [];
  const seen = new Set<string>();
  for (const config of readers.alacrittyConfigPaths()) {
    const text = readers.readText(config);
    if (text === undefined) { continue; }
    let configPalette: Palette | undefined;
    try { configPalette = parseAlacritty(text); } catch { configPalette = undefined; }
    let key: string | undefined;
    if (configPalette && isUsable(configPalette)) {
      key = resolvedKey(config);
    } else {
      for (const spec of alacrittyImports(text)) {
        const resolved = resolveAlacrittyImport(spec, config, liveHome());
        const importKey = resolvedKey(resolved);
        if (byKey.has(importKey)) { key = importKey; }
      }
    }
    if (!key || seen.has(key)) { continue; }
    const theme = byKey.get(key);
    if (!theme) { continue; }
    seen.add(key);
    chosen.push(stampTheme(theme, true));
  }
  return chosen;
}

function liveKitty(readers: MirrorLiveReaders): DiscoveredTheme[] {
  const file = readers.kittyCurrentThemePath();
  if (!file) { return []; }
  const text = readers.readText(file);
  if (text === undefined) { return []; }
  const palette = parseKitty(text);
  if (!isUsable(palette)) { return []; }
  return [{
    name: 'kitty current theme', source: 'kitty', origin: file, active: true, palette,
  }];
}

function liveMoba(readers: MirrorLiveReaders): DiscoveredTheme[] {
  for (const file of readers.mobaIniPaths()) {
    const text = readers.readText(file);
    if (text === undefined) { continue; }
    const palette = parseMobaXterm(text);
    if (!isUsable(palette)) { continue; }
    return [{
      name: stem(file), source: 'mobaxterm', origin: file, active: true, palette,
    }];
  }
  return [];
}

function liveXresources(readers: MirrorLiveReaders): DiscoveredTheme[] {
  const out: DiscoveredTheme[] = [];
  for (const file of readers.xresourcesPaths()) {
    const text = readers.readText(file);
    if (text === undefined) { continue; }
    const palette = parseXresources(text);
    if (!isUsable(palette)) { continue; }
    out.push({
      name: path.basename(file), source: 'xresources', origin: file, active: true, palette,
    });
  }
  return out;
}

/**
 * Themes Mirror should offer for the selection the emulator is using now.
 *
 * A non-empty `sources` list limits which emulators are read. Live files are
 * re-read through `readers.readText` only. Alacritty config paths come from
 * `alacrittyConfigPaths`, and the active import is the last import whose path
 * is a cached origin. Named Ghostty and Alacritty picks use cached palettes.
 * MobaXterm, kitty, Xresources, and Windows Terminal scheme files are parsed
 * from those reads. A cached `active` flag is not evidence. The cached array
 * is not modified.
 */
export function mirrorLiveThemes(
  cached: DiscoveredTheme[],
  readers: MirrorLiveReaders,
  sources?: string[],
): DiscoveredTheme[] {
  const out: DiscoveredTheme[] = [];
  const take = (name: string, fn: () => DiscoveredTheme[]) => {
    if (!sourceWanted(sources, name)) { return; }
    out.push(...fn());
  };
  take('ghostty', () => liveGhostty(cached, readers));
  take('kitty', () => liveKitty(readers));
  take('alacritty', () => liveAlacritty(cached, readers));
  take('windows-terminal', () => liveWindowsTerminal(readers));
  take('xresources', () => liveXresources(readers));
  take('mobaxterm', () => liveMoba(readers));
  return out;
}

/** `mirrorLiveThemes` followed by `mirrorCandidates`. An empty list is no live theme. */
export function mirrorSelection(
  cached: DiscoveredTheme[],
  readers: MirrorLiveReaders,
  sources?: string[],
): MirrorCandidate[] {
  return mirrorCandidates(mirrorLiveThemes(cached, readers, sources));
}

function alacrittyConfigCandidates(extraDirs: string[]): string[] {
  const bases = [
    path.join(xdgConfigDir(), 'alacritty'),
    path.join(liveHome(), '.alacritty'),
  ];
  if (process.env.APPDATA) { bases.push(path.join(process.env.APPDATA, 'alacritty')); }
  bases.push(...extraDirs);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const base of bases) {
    const file = path.join(base, 'alacritty.toml');
    if (!exists(file)) { continue; }
    const key = resolvedKey(file);
    if (seen.has(key)) { continue; }
    seen.add(key);
    out.push(file);
  }
  return out;
}

function mobaIniCandidates(): string[] {
  const user = process.env.USERPROFILE || liveHome();
  const roots: string[] = [];
  const documents = windowsDocumentsDir();
  if (documents) { roots.push(path.join(documents, 'MobaXterm')); }
  roots.push(path.join(user, 'Documents', 'MobaXterm'));
  if (process.env.ONEDRIVE) {
    roots.push(path.join(process.env.ONEDRIVE, 'Documents', 'MobaXterm'));
  }
  roots.push(path.join(user, 'OneDrive', 'Documents', 'MobaXterm'));
  if (process.env.APPDATA) { roots.push(path.join(process.env.APPDATA, 'MobaXterm')); }
  const out: string[] = [];
  const seen = new Set<string>();
  for (const root of roots) {
    const file = path.join(root, 'MobaXterm.ini');
    const key = resolvedKey(file);
    if (seen.has(key)) { continue; }
    seen.add(key);
    if (!exists(file)) { continue; }
    out.push(file);
  }
  return out;
}

/**
 * Live-file locations for Mirror. Directories are not walked. A non-empty
 * `sources` list makes excluded emulators report no paths, and does not call
 * `windowsDocumentsDir` when MobaXterm is excluded.
 */
export function defaultMirrorLiveReaders(extraDirs: string[], sources?: string[]): MirrorLiveReaders {
  const want = (name: string) => sourceWanted(sources, name);
  return {
    readText,
    windowsTerminalInstalls: () => (want('windows-terminal') ? windowsTerminalInstalls() : []),
    ghosttyConfigPaths: () => (want('ghostty') ? ghosttyDirs().configs : []),
    alacrittyConfigPaths: () => (want('alacritty') ? alacrittyConfigCandidates(extraDirs) : []),
    kittyCurrentThemePath: () => (
      want('kitty') ? path.join(xdgConfigDir(), 'kitty', 'current-theme.conf') : ''
    ),
    mobaIniPaths: () => (want('mobaxterm') ? mobaIniCandidates() : []),
    xresourcesPaths: () => (want('xresources')
      ? [path.join(liveHome(), '.Xresources'), path.join(liveHome(), '.Xdefaults')]
      : []),
  };
}

export function mirrorCandidates(themes: DiscoveredTheme[]): MirrorCandidate[] {
  const pair = activeGhosttyPair(themes);
  const out: MirrorCandidate[] = [];
  if (pair) {
    out.push({ kind: 'pair', dark: pair.dark, light: pair.light });
  }
  const skip = pair ? new Set([pair.dark.name, pair.light.name]) : new Set<string>();
  for (const t of themes) {
    if (!t.active) { continue; }
    if (pair && t.source === 'ghostty' && skip.has(t.name)) { continue; }
    out.push({ kind: 'theme', theme: t });
  }
  return out;
}

/**
 * Reads a single Documents path from `GetFolderPath('MyDocuments')` stdout.
 * Empty or whitespace-only output is rejected.
 */
export function parseGetFolderPathOutput(stdout: string): string | undefined {
  const line = stdout.trim().split(/\r?\n/, 1)[0]?.trim();
  return line || undefined;
}

/**
 * Reads the `Personal` value from `reg query` User Shell Folders stdout.
 */
export function parseUserShellFoldersPersonal(stdout: string): string | undefined {
  for (const line of stdout.split(/\r?\n/)) {
    const m = line.match(/^\s*Personal\s+(REG_SZ|REG_EXPAND_SZ)\s+(.+?)\s*$/i);
    if (m) {
      const value = m[2].trim();
      return value || undefined;
    }
  }
  return undefined;
}

/**
 * Expands `%VAR%` tokens using `process.env` (Windows REG_EXPAND_SZ).
 */
export function expandWindowsEnv(value: string): string {
  return value.replace(/%([^%]+)%/g, (whole, name: string) => {
    const v = process.env[name];
    return v !== undefined ? v : whole;
  });
}

/** Reads `Get-AppxPackage` install-location lines. Blank lines are ignored. */
export function parseAppxInstallLocations(stdout: string): string[] {
  const out: string[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    const value = line.trim();
    if (value) { out.push(value); }
  }
  return out;
}

let windowsTerminalDefaultsMemo: { value: string[] } | undefined;

interface WindowsTerminalLookup {
  status: number | null;
  error?: Error;
  stdout?: string | null;
}

/**
 * Install `defaults.json` paths from one Appx lookup.
 * A failed lookup leaves `memo` unset so the next call tries again.
 * A successful lookup that finds no package is memoized as an empty list.
 */
export function resolveWindowsTerminalDefaultsLookup(
  memo: { value: string[] } | undefined,
  lookup: () => WindowsTerminalLookup,
): { memo: { value: string[] } | undefined; paths: string[] } {
  if (memo) { return { memo, paths: memo.value }; }
  const result = lookup();
  if (result.error || result.status !== 0) {
    return { memo: undefined, paths: [] };
  }
  const paths = parseAppxInstallLocations(result.stdout ?? '')
    .map((dir) => path.join(dir, 'defaults.json'));
  return { memo: { value: paths }, paths };
}

/**
 * `defaults.json` paths for installed Windows Terminal packages.
 * Empty off win32. Tests inject `windowsTerminalFiles` instead of calling this.
 */
export function windowsTerminalDefaultsFiles(): string[] {
  if (process.platform !== 'win32') { return []; }
  const next = resolveWindowsTerminalDefaultsLookup(windowsTerminalDefaultsMemo, () => {
    const fromPs = spawnSync('powershell', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      'Get-AppxPackage -Name Microsoft.WindowsTerminal | Select-Object -ExpandProperty InstallLocation; Get-AppxPackage -Name Microsoft.WindowsTerminalPreview | Select-Object -ExpandProperty InstallLocation',
    ], { encoding: 'utf8', windowsHide: true });
    return { status: fromPs.status, error: fromPs.error, stdout: fromPs.stdout };
  });
  windowsTerminalDefaultsMemo = next.memo;
  return next.paths;
}

let documentsDirMemo: { value: string | undefined } | undefined;

/**
 * Windows Known Folder Documents, or undefined off win32 / when lookup fails.
 * Memoized for the process. Tests inject `documentsDir` instead of calling this.
 */
export function windowsDocumentsDir(): string | undefined {
  if (process.platform !== 'win32') {
    return undefined;
  }
  if (documentsDirMemo) {
    return documentsDirMemo.value;
  }
  const fromPs = spawnSync('powershell', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    "[Environment]::GetFolderPath('MyDocuments')",
  ], { encoding: 'utf8', windowsHide: true });
  let value = parseGetFolderPathOutput(fromPs.stdout ?? '');
  if (!value) {
    const fromReg = spawnSync('reg', [
      'query',
      'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders',
      '/v',
      'Personal',
    ], { encoding: 'utf8', windowsHide: true });
    const raw = parseUserShellFoldersPersonal(fromReg.stdout ?? '');
    value = raw ? expandWindowsEnv(raw) : undefined;
  }
  documentsDirMemo = { value };
  return value;
}

export interface DiscoverOptions {
  /** Emulators to scan. Omit to scan all. */
  sources?: string[];
  /** Extra directories to sweep for walkable theme files (not only .itermcolors). */
  extraDirs?: string[];
  /** Known Folder Documents directory. Tests inject this to skip the win32 lookup. */
  documentsDir?: string;
  /**
   * Windows Terminal settings/defaults pairs. When set, discovery scans these
   * files and does not consult LOCALAPPDATA or the Appx install location.
   */
  windowsTerminalFiles?: { settings?: string; defaults?: string }[];
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

  const extraDirs = opts.extraDirs ?? [];
  run('ghostty', () => discoverGhostty(extraDirs));
  run('kitty', () => discoverKitty(extraDirs));
  run('alacritty', () => discoverAlacritty(extraDirs));
  run('wezterm', () => discoverWezterm(extraDirs));
  run('iterm2', () => discoverIterm2(extraDirs));
  run('windows-terminal', () => discoverWindowsTerminal(opts.windowsTerminalFiles));
  run('xresources', discoverXresources);
  run('mobaxterm', () => discoverMobaXterm(extraDirs, opts.documentsDir ?? windowsDocumentsDir()));

  // Active themes first, then alphabetical within source.
  return results.sort((a, b) =>
    Number(b.active) - Number(a.active) ||
    a.source.localeCompare(b.source) ||
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}