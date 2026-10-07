import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { discoverThemes, parseGetFolderPathOutput, parseUserShellFoldersPersonal, expandWindowsEnv, windowsDocumentsDir, parseAppxInstallLocations, windowsTerminalDefaultsFiles, resolveWindowsTerminalDefaultsLookup, mirrorLiveThemes, mirrorSelection, defaultMirrorLiveReaders, activeGhosttyPair, MirrorLiveReaders } from '../src/discover';
import { DiscoveredTheme, Palette, isUsable } from '../src/palette';

const fixtures = path.join(__dirname, 'fixtures');

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}\n      ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

/**
 * Points discovery at a throwaway HOME / XDG tree, then restores the previous
 * env so later cases in this file are not coupled.
 */
function withFixtureHome(
  populate: (xdg: string, home: string) => void,
  body: (xdg: string, home: string) => void,
): void {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'vtt-discover-'));
  const xdg = path.join(home, 'xdg-config');
  fs.mkdirSync(xdg, { recursive: true });

  const prev = {
    HOME: process.env.HOME,
    XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME,
    XDG_DATA_DIRS: process.env.XDG_DATA_DIRS,
    LOCALAPPDATA: process.env.LOCALAPPDATA,
    USERPROFILE: process.env.USERPROFILE,
    APPDATA: process.env.APPDATA,
    ONEDRIVE: process.env.ONEDRIVE,
  };
  process.env.HOME = home;
  process.env.XDG_CONFIG_HOME = xdg;
  process.env.XDG_DATA_DIRS = path.join(home, 'xdg-data-missing');
  delete process.env.LOCALAPPDATA;
  delete process.env.USERPROFILE;
  delete process.env.APPDATA;
  delete process.env.ONEDRIVE;

  try {
    populate(xdg, home);
    body(xdg, home);
  } finally {
    restoreEnv('HOME', prev.HOME);
    restoreEnv('XDG_CONFIG_HOME', prev.XDG_CONFIG_HOME);
    restoreEnv('XDG_DATA_DIRS', prev.XDG_DATA_DIRS);
    restoreEnv('LOCALAPPDATA', prev.LOCALAPPDATA);
    restoreEnv('USERPROFILE', prev.USERPROFILE);
    restoreEnv('APPDATA', prev.APPDATA);
    restoreEnv('ONEDRIVE', prev.ONEDRIVE);
    fs.rmSync(home, { recursive: true, force: true });
  }
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function writeGhosttyTheme(xdg: string, name: string, fromFixture?: string): string {
  const dir = path.join(xdg, 'ghostty', 'themes');
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, name);
  if (fromFixture) {
    fs.copyFileSync(path.join(fixtures, fromFixture), dest);
  }
  return dest;
}

function writeWeztermTheme(xdg: string, name: string, fromFixture?: string): string {
  const dir = path.join(xdg, 'wezterm', 'colors');
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, name);
  if (fromFixture) {
    fs.copyFileSync(path.join(fixtures, fromFixture), dest);
  }
  return dest;
}

console.log('\ndiscover');
test('finds a usable Ghostty theme under XDG', () => {
  withFixtureHome((xdg) => {
    writeGhosttyTheme(xdg, 'Broadcast', 'Broadcast');
  }, (xdg) => {
    const origin = path.join(xdg, 'ghostty', 'themes', 'Broadcast');
    const found = discoverThemes({ sources: ['ghostty'] }).find((t) => t.origin === origin);
    assert.ok(found, `expected a ghostty theme at ${origin}`);
    assert.strictEqual(found.source, 'ghostty');
    assert.ok(isUsable(found.palette), 'palette should have all 16 ANSI slots');
    assert.strictEqual(found.active, false);
  });
});

test('marks a Ghostty theme active from config', () => {
  withFixtureHome((xdg) => {
    writeGhosttyTheme(xdg, 'Broadcast', 'Broadcast');
    writeGhosttyTheme(xdg, 'Other', 'Broadcast');
    fs.mkdirSync(path.join(xdg, 'ghostty'), { recursive: true });
    fs.writeFileSync(path.join(xdg, 'ghostty', 'config'), 'theme = Broadcast\n');
  }, (xdg) => {
    const named = path.join(xdg, 'ghostty', 'themes', 'Broadcast');
    const other = path.join(xdg, 'ghostty', 'themes', 'Other');
    const results = discoverThemes({ sources: ['ghostty'] });
    const active = results.find((t) => t.origin === named);
    const listed = results.find((t) => t.origin === other);
    assert.ok(active, `expected a ghostty theme at ${named}`);
    assert.ok(listed, `expected a ghostty theme at ${other}`);
    assert.strictEqual(active.active, true);
    assert.strictEqual(listed.active, false);
  });
});

test('marks kitty current-theme.conf active', () => {
  withFixtureHome((xdg) => {
    const themesDir = path.join(xdg, 'kitty', 'themes');
    fs.mkdirSync(themesDir, { recursive: true });
    fs.copyFileSync(
      path.join(fixtures, 'tomorrow-night.conf'),
      path.join(themesDir, 'tomorrow-night.conf'),
    );
    fs.copyFileSync(
      path.join(fixtures, 'tomorrow-night.conf'),
      path.join(xdg, 'kitty', 'current-theme.conf'),
    );
  }, (xdg) => {
    const current = path.join(xdg, 'kitty', 'current-theme.conf');
    const themed = path.join(xdg, 'kitty', 'themes', 'tomorrow-night.conf');
    const results = discoverThemes({ sources: ['kitty'] });
    const active = results.find((t) => t.origin === current);
    const listed = results.find((t) => t.origin === themed);
    assert.ok(active, `expected kitty current theme at ${current}`);
    assert.ok(listed, `expected kitty theme at ${themed}`);
    assert.strictEqual(active.active, true);
    assert.strictEqual(listed.active, false);
  });
});

test('skips a Ghostty theme with fewer than 16 ANSI slots', () => {
  withFixtureHome((xdg) => {
    writeGhosttyTheme(xdg, 'Broadcast', 'Broadcast');
    const incomplete = writeGhosttyTheme(xdg, 'Incomplete');
    fs.writeFileSync(
      incomplete,
      'palette = 0=#000000\npalette = 1=#ff0000\nbackground = #111111\n',
    );
  }, (xdg) => {
    const bad = path.join(xdg, 'ghostty', 'themes', 'Incomplete');
    const good = path.join(xdg, 'ghostty', 'themes', 'Broadcast');
    const results = discoverThemes({ sources: ['ghostty'] });
    assert.ok(!results.some((t) => t.origin === bad), 'incomplete palette must be omitted');
    assert.ok(results.some((t) => t.origin === good), 'usable sibling theme must still appear');
  });
});

test('discovers WezTerm themes in ~/.config/wezterm/colors exactly once without duplicates', () => {
  withFixtureHome((xdg) => {
    writeWeztermTheme(xdg, 'extra-wezterm.toml', 'extra/extra-wezterm.toml');
  }, (xdg) => {
    const origin = path.join(xdg, 'wezterm', 'colors', 'extra-wezterm.toml');
    const results = discoverThemes({ sources: ['wezterm'] });
    const matching = results.filter((t) => t.origin === origin);
    assert.strictEqual(
      matching.length,
      1,
      `expected theme at ${origin} to be discovered exactly once, but found ${matching.length}`,
    );
    assert.strictEqual(matching[0].source, 'wezterm');
    assert.strictEqual(matching[0].name, 'extra-wezterm');
    assert.ok(isUsable(matching[0].palette), 'palette should be usable');
  });
});

test('does not throw when a source directory is missing', () => {
  withFixtureHome(() => {
    // no wezterm directory
  }, () => {
    assert.doesNotThrow(() => {
      const results = discoverThemes({ sources: ['wezterm'] });
      assert.deepStrictEqual(results, []);
    });
  });
});

test('discovers iTerm2 presets from ColorPresets.plist via extraDirs', () => {
  withFixtureHome((_xdg, home) => {
    const customDir = path.join(home, 'custom-presets');
    fs.mkdirSync(customDir, { recursive: true });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>ExtraPreset</key>
  <dict>
    ${Array.from({ length: 16 }, (_, i) => `
    <key>Ansi ${i} Color</key>
    <dict>
      <key>Red Component</key><real>0.4</real>
      <key>Green Component</key><real>0.4</real>
      <key>Blue Component</key><real>0.4</real>
    </dict>`).join('')}
    <key>Background Color</key>
    <dict><key>Red Component</key><real>0.1</real><key>Green Component</key><real>0.1</real><key>Blue Component</key><real>0.1</real></dict>
    <key>Foreground Color</key>
    <dict><key>Red Component</key><real>0.9</real><key>Green Component</key><real>0.9</real><key>Blue Component</key><real>0.9</real></dict>
  </dict>
</dict>
</plist>`;
    fs.writeFileSync(path.join(customDir, 'ColorPresets.plist'), xml, 'utf8');
  }, (_xdg, home) => {
    const customDir = path.join(home, 'custom-presets');
    const origin = path.join(customDir, 'ColorPresets.plist');
    const results = discoverThemes({ sources: ['iterm2'], extraDirs: [customDir] });
    const found = results.find((t) => t.origin === origin && t.name === 'ExtraPreset');
    assert.ok(found, `expected preset ExtraPreset with origin ${origin}`);
    assert.strictEqual(found.source, 'iterm2');
    assert.strictEqual(found.active, false);
    assert.ok(isUsable(found.palette));
  });
});

test('discovers bundled iTerm2 presets from ColorPresets.plist under ~/Applications on macOS', () => {
  if (process.platform !== 'darwin') { return; }
  withFixtureHome((_xdg, home) => {
    const itermDir = path.join(home, 'Library', 'Application Support', 'iTerm2');
    const resDir = path.join(home, 'Applications', 'iTerm.app', 'Contents', 'Resources');
    fs.mkdirSync(itermDir, { recursive: true });
    fs.mkdirSync(resDir, { recursive: true });

    // User custom theme TestBundledPreset.itermcolors
    const userXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  ${Array.from({ length: 16 }, (_, i) => `
  <key>Ansi ${i} Color</key>
  <dict>
    <key>Red Component</key><real>0.2</real>
    <key>Green Component</key><real>0.2</real>
    <key>Blue Component</key><real>0.2</real>
  </dict>`).join('')}
  <key>Background Color</key>
  <dict><key>Red Component</key><real>0</real><key>Green Component</key><real>0</real><key>Blue Component</key><real>0</real></dict>
  <key>Foreground Color</key>
  <dict><key>Red Component</key><real>1</real><key>Green Component</key><real>1</real><key>Blue Component</key><real>1</real></dict>
</dict>
</plist>`;
    fs.writeFileSync(path.join(itermDir, 'TestBundledPreset.itermcolors'), userXml, 'utf8');

    // Bundled ColorPresets.plist with TestBundledPreset (duplicate of user theme) and UniqueBundledPreset
    const bundledXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>TestBundledPreset</key>
  <dict>
    ${Array.from({ length: 16 }, (_, i) => `
    <key>Ansi ${i} Color</key>
    <dict>
      <key>Red Component</key><real>0.3</real>
      <key>Green Component</key><real>0.3</real>
      <key>Blue Component</key><real>0.3</real>
    </dict>`).join('')}
    <key>Background Color</key>
    <dict><key>Red Component</key><real>0</real><key>Green Component</key><real>0</real><key>Blue Component</key><real>0</real></dict>
    <key>Foreground Color</key>
    <dict><key>Red Component</key><real>1</real><key>Green Component</key><real>1</real><key>Blue Component</key><real>1</real></dict>
  </dict>
  <key>UniqueBundledPreset</key>
  <dict>
    ${Array.from({ length: 16 }, (_, i) => `
    <key>Ansi ${i} Color</key>
    <dict>
      <key>Red Component</key><real>0.5</real>
      <key>Green Component</key><real>0.5</real>
      <key>Blue Component</key><real>0.5</real>
    </dict>`).join('')}
    <key>Background Color</key>
    <dict><key>Red Component</key><real>0</real><key>Green Component</key><real>0</real><key>Blue Component</key><real>0</real></dict>
    <key>Foreground Color</key>
    <dict><key>Red Component</key><real>1</real><key>Green Component</key><real>1</real><key>Blue Component</key><real>1</real></dict>
  </dict>
</dict>
</plist>`;
    fs.writeFileSync(path.join(resDir, 'ColorPresets.plist'), bundledXml, 'utf8');
  }, (_xdg, home) => {
    const userOrigin = path.join(home, 'Library', 'Application Support', 'iTerm2', 'TestBundledPreset.itermcolors');
    const bundledOrigin = path.join(home, 'Applications', 'iTerm.app', 'Contents', 'Resources', 'ColorPresets.plist');
    const results = discoverThemes({ sources: ['iterm2'] });

    // TestBundledPreset was found via user origin first; bundled duplicate is ignored
    const duplicate = results.filter((t) => t.name === 'TestBundledPreset');
    assert.strictEqual(duplicate.length, 1);
    assert.strictEqual(duplicate[0].origin, userOrigin);

    // UniqueBundledPreset is found via bundled origin
    const unique = results.find((t) => t.name === 'UniqueBundledPreset');
    assert.ok(unique, `expected bundled preset UniqueBundledPreset with origin ${bundledOrigin}`);
    assert.strictEqual(unique.origin, bundledOrigin);
    assert.strictEqual(unique.source, 'iterm2');
    assert.strictEqual(unique.active, false);
    assert.ok(isUsable(unique.palette));
  });
});

console.log('\nalacritty discovery');

function writeExtraAlacritty(dest: string): string {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(fixtures, 'extra', 'extra-alacritty.toml'), dest);
  return dest;
}

function writeAlacrittyConfig(file: string, imports: string[]): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const quoted = imports.map((p) => JSON.stringify(p)).join(', ');
  fs.writeFileSync(file, `[general]\nimport = [${quoted}]\n`, 'utf8');
}

test('APPDATA import-only config marks the imported theme active', () => {
  withFixtureHome((_xdg, home) => {
    const appdata = path.join(home, 'appdata');
    process.env.APPDATA = appdata;
    const theme = path.join(home, 'git', 'alacritty-theme', 'themes', 'msx.toml');
    writeExtraAlacritty(theme);
    writeAlacrittyConfig(
      path.join(appdata, 'alacritty', 'alacritty.toml'),
      [theme],
    );
  }, (_xdg, home) => {
    const theme = path.join(home, 'git', 'alacritty-theme', 'themes', 'msx.toml');
    const config = path.join(home, 'appdata', 'alacritty', 'alacritty.toml');
    const results = discoverThemes({ sources: ['alacritty'] });
    const imported = results.find((t) => t.origin === theme);
    const cfg = results.find((t) => t.origin === config);
    assert.ok(imported, `expected imported origin ${theme}`);
    assert.strictEqual(imported.source, 'alacritty');
    assert.strictEqual(imported.active, true);
    assert.ok(isUsable(imported.palette));
    assert.ok(!cfg, 'import-only alacritty.toml is not itself a usable theme');
  });
});

test('inline-color alacritty.toml remains active', () => {
  withFixtureHome((xdg) => {
    writeExtraAlacritty(path.join(xdg, 'alacritty', 'alacritty.toml'));
  }, (xdg) => {
    const origin = path.join(xdg, 'alacritty', 'alacritty.toml');
    const results = discoverThemes({ sources: ['alacritty'] });
    const found = results.find((t) => t.origin === origin);
    assert.ok(found, `expected origin ${origin}`);
    assert.strictEqual(found.active, true);
    assert.strictEqual(found.name, 'alacritty');
  });
});

test('last usable import is active when several define palettes', () => {
  withFixtureHome((xdg) => {
    const first = path.join(xdg, 'alacritty', 'themes', 'first.toml');
    const second = path.join(xdg, 'alacritty', 'themes', 'second.toml');
    writeExtraAlacritty(first);
    fs.mkdirSync(path.dirname(second), { recursive: true });
    fs.writeFileSync(
      second,
      fs.readFileSync(path.join(fixtures, 'extra', 'extra-alacritty.toml'), 'utf8')
        .replace('0x300000', '0x010101'),
      'utf8',
    );
    writeAlacrittyConfig(path.join(xdg, 'alacritty', 'alacritty.toml'), [
      path.join('themes', 'first.toml'),
      path.join('themes', 'second.toml'),
    ]);
  }, (xdg) => {
    const first = path.join(xdg, 'alacritty', 'themes', 'first.toml');
    const second = path.join(xdg, 'alacritty', 'themes', 'second.toml');
    const results = discoverThemes({ sources: ['alacritty'] });
    const a = results.find((t) => t.origin === first);
    const b = results.find((t) => t.origin === second);
    assert.ok(a && b);
    assert.strictEqual(a.active, false);
    assert.strictEqual(b.active, true);
    assert.strictEqual(b.palette.background, '#010101');
  });
});

test('missing import is skipped and a later usable import can still be active', () => {
  withFixtureHome((xdg) => {
    const theme = path.join(xdg, 'alacritty', 'themes', 'msx.toml');
    writeExtraAlacritty(theme);
    writeAlacrittyConfig(path.join(xdg, 'alacritty', 'alacritty.toml'), [
      path.join('themes', 'missing.toml'),
      path.join('themes', 'msx.toml'),
    ]);
  }, (xdg) => {
    const theme = path.join(xdg, 'alacritty', 'themes', 'msx.toml');
    const results = discoverThemes({ sources: ['alacritty'] });
    const found = results.find((t) => t.origin === theme);
    assert.ok(found);
    assert.strictEqual(found.active, true);
  });
});

test('malformed import is skipped and a later usable import can still be active', () => {
  withFixtureHome((xdg) => {
    const bad = path.join(xdg, 'alacritty', 'themes', 'bad.toml');
    const theme = path.join(xdg, 'alacritty', 'themes', 'msx.toml');
    fs.mkdirSync(path.dirname(bad), { recursive: true });
    fs.writeFileSync(bad, '[[[', 'utf8');
    writeExtraAlacritty(theme);
    writeAlacrittyConfig(path.join(xdg, 'alacritty', 'alacritty.toml'), [
      path.join('themes', 'bad.toml'),
      path.join('themes', 'msx.toml'),
    ]);
  }, (xdg) => {
    const theme = path.join(xdg, 'alacritty', 'themes', 'msx.toml');
    const results = discoverThemes({ sources: ['alacritty'] });
    const found = results.find((t) => t.origin === theme);
    assert.ok(found);
    assert.strictEqual(found.active, true);
    assert.ok(results.every((t) => t.origin !== path.join(xdg, 'alacritty', 'themes', 'bad.toml')));
  });
});

test('extraDirs overlapping the imported file lists it once and active', () => {
  withFixtureHome((xdg) => {
    const theme = path.join(xdg, 'alacritty', 'themes', 'msx.toml');
    writeExtraAlacritty(theme);
    writeAlacrittyConfig(path.join(xdg, 'alacritty', 'alacritty.toml'), [
      path.join('themes', 'msx.toml'),
    ]);
  }, (xdg) => {
    const theme = path.join(xdg, 'alacritty', 'themes', 'msx.toml');
    const extra = path.join(xdg, 'alacritty', 'themes');
    const results = discoverThemes({ sources: ['alacritty'], extraDirs: [extra] });
    const matches = results.filter((t) => t.origin === theme);
    assert.strictEqual(matches.length, 1);
    assert.strictEqual(matches[0].active, true);
  });
});

test('extra-alacritty.toml is not treated as a config', () => {
  withFixtureHome((_xdg, home) => {
    writeExtraAlacritty(path.join(home, 'pack', 'extra-alacritty.toml'));
  }, (_xdg, home) => {
    const origin = path.join(home, 'pack', 'extra-alacritty.toml');
    const results = discoverThemes({
      sources: ['alacritty'],
      extraDirs: [path.join(home, 'pack')],
    });
    const found = results.find((t) => t.origin === origin);
    assert.ok(found);
    assert.strictEqual(found.active, false);
  });
});

test('does not throw when Alacritty directories are missing', () => {
  withFixtureHome(() => {
    // no alacritty directories, APPDATA unset by withFixtureHome
  }, () => {
    assert.doesNotThrow(() => {
      const results = discoverThemes({ sources: ['alacritty'] });
      assert.deepStrictEqual(results, []);
    });
  });
});

console.log('\nmobaxterm discovery');

function writeMobaIni(dir: string, name: string, fromFixture = 'mobaxterm-colors.ini'): string {
  fs.mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, name);
  fs.copyFileSync(path.join(fixtures, fromFixture), dest);
  return dest;
}

test('discovers USERPROFILE Documents MobaXterm.ini as active', () => {
  withFixtureHome((_xdg, home) => {
    process.env.USERPROFILE = home;
    writeMobaIni(path.join(home, 'Documents', 'MobaXterm'), 'MobaXterm.ini');
  }, (_xdg, home) => {
    const origin = path.join(home, 'Documents', 'MobaXterm', 'MobaXterm.ini');
    const results = discoverThemes({ sources: ['mobaxterm'] });
    const found = results.filter((t) => t.origin === origin);
    assert.strictEqual(found.length, 1);
    assert.strictEqual(found[0].source, 'mobaxterm');
    assert.strictEqual(found[0].name, 'MobaXterm');
    assert.strictEqual(found[0].active, true);
    assert.ok(isUsable(found[0].palette));
  });
});

test('discovers ONEDRIVE Documents MobaXterm.ini when plain Documents is absent', () => {
  withFixtureHome((_xdg, home) => {
    const od = path.join(home, 'od');
    process.env.ONEDRIVE = od;
    writeMobaIni(path.join(od, 'Documents', 'MobaXterm'), 'MobaXterm.ini');
  }, (_xdg, home) => {
    const origin = path.join(home, 'od', 'Documents', 'MobaXterm', 'MobaXterm.ini');
    const results = discoverThemes({ sources: ['mobaxterm'] });
    const found = results.find((t) => t.origin === origin);
    assert.ok(found, `expected origin ${origin}`);
    assert.strictEqual(found.source, 'mobaxterm');
    assert.strictEqual(found.active, true);
  });
});

test('discovers APPDATA MobaXterm.ini when Documents and OneDrive are absent', () => {
  withFixtureHome((_xdg, home) => {
    const appdata = path.join(home, 'appdata');
    process.env.APPDATA = appdata;
    writeMobaIni(path.join(appdata, 'MobaXterm'), 'MobaXterm.ini');
  }, (_xdg, home) => {
    const origin = path.join(home, 'appdata', 'MobaXterm', 'MobaXterm.ini');
    const results = discoverThemes({ sources: ['mobaxterm'] });
    const found = results.find((t) => t.origin === origin);
    assert.ok(found, `expected origin ${origin}`);
    assert.strictEqual(found.active, true);
  });
});

test('only the first default-root MobaXterm.ini is active', () => {
  withFixtureHome((_xdg, home) => {
    process.env.USERPROFILE = home;
    process.env.APPDATA = path.join(home, 'appdata');
    writeMobaIni(path.join(home, 'Documents', 'MobaXterm'), 'MobaXterm.ini');
    writeMobaIni(path.join(home, 'appdata', 'MobaXterm'), 'MobaXterm.ini');
  }, (_xdg, home) => {
    const docs = path.join(home, 'Documents', 'MobaXterm', 'MobaXterm.ini');
    const app = path.join(home, 'appdata', 'MobaXterm', 'MobaXterm.ini');
    const results = discoverThemes({ sources: ['mobaxterm'] });
    const a = results.find((t) => t.origin === docs);
    const b = results.find((t) => t.origin === app);
    assert.ok(a && b);
    assert.strictEqual(a.active, true);
    assert.strictEqual(b.active, false);
  });
});

test('discovers extraDirs .mxtcolors and .ini as inactive', () => {
  withFixtureHome((_xdg, home) => {
    const extra = path.join(home, 'themes');
    writeMobaIni(extra, 'mocha.mxtcolors');
    writeMobaIni(extra, 'pack.ini');
  }, (_xdg, home) => {
    const extra = path.join(home, 'themes');
    const results = discoverThemes({ sources: ['mobaxterm'], extraDirs: [extra] });
    const mocha = results.find((t) => t.origin === path.join(extra, 'mocha.mxtcolors'));
    const pack = results.find((t) => t.origin === path.join(extra, 'pack.ini'));
    assert.ok(mocha && pack);
    assert.strictEqual(mocha.active, false);
    assert.strictEqual(pack.active, false);
    assert.strictEqual(mocha.name, 'mocha');
    assert.strictEqual(pack.name, 'pack');
    assert.ok(results.every((t) => t.origin.startsWith(extra + path.sep)));
  });
});

test('does not parse .mxtsessions beside a valid theme', () => {
  withFixtureHome((_xdg, home) => {
    const extra = path.join(home, 'themes');
    writeMobaIni(extra, 'ok.ini');
    fs.writeFileSync(
      path.join(extra, 'sessions.mxtsessions'),
      fs.readFileSync(path.join(fixtures, 'mobaxterm-colors.ini'), 'utf8'),
    );
  }, (_xdg, home) => {
    const extra = path.join(home, 'themes');
    const results = discoverThemes({ sources: ['mobaxterm'], extraDirs: [extra] });
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].origin, path.join(extra, 'ok.ini'));
  });
});

test('nested MobaXterm.ini within default root is not marked active', () => {
  withFixtureHome((_xdg, home) => {
    process.env.USERPROFILE = home;
    const mobaDir = path.join(home, 'Documents', 'MobaXterm');
    writeMobaIni(path.join(mobaDir, 'backup'), 'MobaXterm.ini');
  }, (_xdg, home) => {
    const nestedIni = path.join(home, 'Documents', 'MobaXterm', 'backup', 'MobaXterm.ini');
    const results = discoverThemes({ sources: ['mobaxterm'] });
    const nested = results.find((t) => t.origin === nestedIni);
    assert.ok(nested);
    assert.strictEqual(nested.active, false, 'nested MobaXterm.ini must not be active');
  });
});

test('does not throw when MobaXterm directories are missing', () => {
  withFixtureHome(() => {
    // no MobaXterm directories
  }, () => {
    assert.doesNotThrow(() => {
      const results = discoverThemes({ sources: ['mobaxterm'] });
      assert.deepStrictEqual(results, []);
    });
  });
});

test('redirected documentsDir MobaXterm.ini is present and active', () => {
  withFixtureHome((_xdg, home) => {
    process.env.USERPROFILE = home;
    const redirected = path.join(home, 'Redirected', 'Documents');
    writeMobaIni(path.join(redirected, 'MobaXterm'), 'MobaXterm.ini');
  }, (_xdg, home) => {
    const redirected = path.join(home, 'Redirected', 'Documents');
    const origin = path.join(redirected, 'MobaXterm', 'MobaXterm.ini');
    const results = discoverThemes({ sources: ['mobaxterm'], documentsDir: redirected });
    const found = results.filter((t) => t.origin === origin);
    assert.strictEqual(found.length, 1);
    assert.strictEqual(found[0].active, true);
    assert.ok(isUsable(found[0].palette));
  });
});

test('documentsDir coinciding with USERPROFILE Documents is one active origin', () => {
  withFixtureHome((_xdg, home) => {
    process.env.USERPROFILE = home;
    writeMobaIni(path.join(home, 'Documents', 'MobaXterm'), 'MobaXterm.ini');
  }, (_xdg, home) => {
    const origin = path.join(home, 'Documents', 'MobaXterm', 'MobaXterm.ini');
    const docs = path.join(home, 'Documents');
    const results = discoverThemes({ sources: ['mobaxterm'], documentsDir: docs });
    const found = results.filter((t) => t.origin === origin);
    assert.strictEqual(found.length, 1);
    assert.strictEqual(found[0].active, true);
  });
});

test('extraDirs stay inactive when documentsDir is also set', () => {
  withFixtureHome((_xdg, home) => {
    process.env.USERPROFILE = home;
    const redirected = path.join(home, 'Redirected', 'Documents');
    writeMobaIni(path.join(redirected, 'MobaXterm'), 'MobaXterm.ini');
    const extra = path.join(home, 'themes');
    writeMobaIni(extra, 'mocha.mxtcolors');
    writeMobaIni(extra, 'pack.ini');
  }, (_xdg, home) => {
    const redirected = path.join(home, 'Redirected', 'Documents');
    const extra = path.join(home, 'themes');
    const results = discoverThemes({
      sources: ['mobaxterm'],
      documentsDir: redirected,
      extraDirs: [extra],
    });
    const applied = results.find((t) => t.origin === path.join(redirected, 'MobaXterm', 'MobaXterm.ini'));
    const mocha = results.find((t) => t.origin === path.join(extra, 'mocha.mxtcolors'));
    const pack = results.find((t) => t.origin === path.join(extra, 'pack.ini'));
    assert.ok(applied && mocha && pack);
    assert.strictEqual(applied.active, true);
    assert.strictEqual(mocha.active, false);
    assert.strictEqual(pack.active, false);
  });
});

test('nested MobaXterm.ini under documentsDir is not active', () => {
  withFixtureHome((_xdg, home) => {
    const redirected = path.join(home, 'Redirected', 'Documents');
    writeMobaIni(path.join(redirected, 'MobaXterm', 'backup'), 'MobaXterm.ini');
  }, (_xdg, home) => {
    const nestedIni = path.join(home, 'Redirected', 'Documents', 'MobaXterm', 'backup', 'MobaXterm.ini');
    const results = discoverThemes({
      sources: ['mobaxterm'],
      documentsDir: path.join(home, 'Redirected', 'Documents'),
    });
    const nested = results.find((t) => t.origin === nestedIni);
    assert.ok(nested);
    assert.strictEqual(nested.active, false, 'nested MobaXterm.ini must not be active');
  });
});

test('parseGetFolderPathOutput accepts a trimmed single path', () => {
  assert.strictEqual(parseGetFolderPathOutput('  D:\\Users\\Sam\\Documents  \r\n'), 'D:\\Users\\Sam\\Documents');
  assert.strictEqual(parseGetFolderPathOutput(''), undefined);
  assert.strictEqual(parseGetFolderPathOutput('   \n\t  '), undefined);
});

test('parseUserShellFoldersPersonal reads Personal REG_SZ and REG_EXPAND_SZ', () => {
  const expandSz = [
    '',
    'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders',
    '    Personal    REG_EXPAND_SZ    %USERPROFILE%\\Documents',
    '',
  ].join('\r\n');
  assert.strictEqual(parseUserShellFoldersPersonal(expandSz), '%USERPROFILE%\\Documents');

  const sz = [
    '',
    'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders',
    '    Personal    REG_SZ    D:\\Users\\Sam\\Documents',
    '',
  ].join('\r\n');
  assert.strictEqual(parseUserShellFoldersPersonal(sz), 'D:\\Users\\Sam\\Documents');
});

test('expandWindowsEnv expands %USERPROFILE%', () => {
  const prev = process.env.USERPROFILE;
  process.env.USERPROFILE = 'D:\\Users\\Sam';
  try {
    assert.strictEqual(expandWindowsEnv('%USERPROFILE%\\Documents'), 'D:\\Users\\Sam\\Documents');
  } finally {
    if (prev === undefined) {
      delete process.env.USERPROFILE;
    } else {
      process.env.USERPROFILE = prev;
    }
  }
});

test('windowsDocumentsDir on non-win32 returns undefined without spawning', () => {
  if (process.platform === 'win32') {
    return;
  }
  assert.strictEqual(windowsDocumentsDir(), undefined);
});

function wtScheme(name: string, green = '#13A10E') {
  return {
    name,
    background: '#0C0C0C',
    foreground: '#CCCCCC',
    black: '#0C0C0C',
    red: '#C50F1F',
    green,
    yellow: '#C19C00',
    blue: '#0037DA',
    purple: '#881798',
    cyan: '#3A96DD',
    white: '#CCCCCC',
    brightBlack: '#767676',
    brightRed: '#E74856',
    brightGreen: '#16C60C',
    brightYellow: '#F9F1A5',
    brightBlue: '#3B78FF',
    brightPurple: '#B4009E',
    brightCyan: '#61D6D6',
    brightWhite: '#F2F2F2',
  };
}

function writeWtJson(dir: string, name: string, doc: unknown): string {
  const file = path.join(dir, name);
  fs.writeFileSync(file, typeof doc === 'string' ? doc : JSON.stringify(doc));
  return file;
}

function withWtInstall(
  build: (dir: string) => { settings?: string; defaults?: string }[],
  body: (found: ReturnType<typeof discoverThemes>) => void,
): void {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vtt-wt-'));
  try {
    const found = discoverThemes({
      sources: ['windows-terminal'],
      windowsTerminalFiles: build(dir),
    });
    body(found);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('inbox schemes are listed when settings schemes are empty', () => {
  withWtInstall((dir) => {
    const defaults = writeWtJson(dir, 'defaults.json', {
      defaultProfile: '{aaaa}',
      profiles: [{ guid: '{aaaa}', colorScheme: 'Vintage' }],
      schemes: [wtScheme('Vintage')],
    });
    const settings = writeWtJson(dir, 'settings.json', {
      defaultProfile: '{bbbb}',
      profiles: { defaults: {}, list: [{ guid: '{bbbb}', name: 'Ubuntu' }] },
      schemes: [],
    });
    return [{ settings, defaults }];
  }, (found) => {
    assert.strictEqual(found.length, 1);
    assert.strictEqual(found[0].name, 'Vintage');
    assert.ok(found[0].origin.endsWith(`${path.sep}defaults.json`));
  });
});

test('a settings scheme replaces the inbox palette of the same name', () => {
  withWtInstall((dir) => {
    const defaults = writeWtJson(dir, 'defaults.json', {
      schemes: [wtScheme('Campbell', '#111111')],
    });
    const settings = writeWtJson(dir, 'settings.json', {
      schemes: [wtScheme('campbell', '#222222')],
    });
    return [{ settings, defaults }];
  }, (found) => {
    assert.strictEqual(found.length, 1);
    assert.strictEqual(found[0].name, 'campbell');
    assert.strictEqual(found[0].palette.ansi[2], '#222222');
    assert.ok(found[0].origin.endsWith(`${path.sep}settings.json`));
  });
});

test('omitted settings colorScheme marks the inbox default scheme active', () => {
  withWtInstall((dir) => {
    const defaults = writeWtJson(dir, 'defaults.json', {
      defaultProfile: '{aaaa}',
      profiles: [{ guid: '{aaaa}', colorScheme: 'Vintage' }],
      schemes: [wtScheme('Vintage'), wtScheme('Campbell')],
    });
    const settings = writeWtJson(dir, 'settings.json', {
      defaultProfile: '{bbbb}',
      profiles: { defaults: {}, list: [{ guid: '{bbbb}' }] },
      schemes: [],
    });
    return [{ settings, defaults }];
  }, (found) => {
    const vintage = found.find((t) => t.name === 'Vintage');
    const campbell = found.find((t) => t.name === 'Campbell');
    assert.ok(vintage);
    assert.strictEqual(vintage.active, true);
    assert.ok(campbell);
    assert.strictEqual(campbell.active, false);
  });
});

test('an explicit settings colorScheme uses the inbox palette', () => {
  withWtInstall((dir) => {
    const defaults = writeWtJson(dir, 'defaults.json', {
      defaultProfile: '{aaaa}',
      profiles: [{ guid: '{aaaa}', colorScheme: 'Vintage' }],
      schemes: [wtScheme('Campbell'), wtScheme('Vintage')],
    });
    const settings = writeWtJson(dir, 'settings.json', {
      defaultProfile: '{bbbb}',
      profiles: { list: [{ guid: '{bbbb}', colorScheme: 'Campbell' }] },
      schemes: [],
    });
    return [{ settings, defaults }];
  }, (found) => {
    const campbell = found.find((t) => t.name === 'Campbell');
    assert.ok(campbell);
    assert.strictEqual(campbell.active, true);
    assert.ok(campbell.origin.endsWith(`${path.sep}defaults.json`));
    assert.strictEqual(found.find((t) => t.name === 'Vintage')?.active, false);
  });
});

test('an assumed scheme name that was not loaded is not active', () => {
  withWtInstall((dir) => {
    const defaults = writeWtJson(dir, 'defaults.json', {
      defaultProfile: '{aaaa}',
      profiles: [{ guid: '{aaaa}', name: 'PowerShell' }],
      schemes: [wtScheme('Vintage')],
    });
    const settings = writeWtJson(dir, 'settings.json', {
      defaultProfile: '{bbbb}',
      profiles: { defaults: {}, list: [{ guid: '{bbbb}' }] },
      schemes: [],
    });
    return [{ settings, defaults }];
  }, (found) => {
    assert.ok(found.some((t) => t.name === 'Vintage'));
    assert.ok(found.every((t) => t.active === false));
  });
});

test('a broken defaults file still yields a named settings scheme', () => {
  withWtInstall((dir) => {
    const defaults = writeWtJson(dir, 'defaults.json', '{');
    const settings = writeWtJson(dir, 'settings.json', {
      defaultProfile: '{bbbb}',
      profiles: { list: [{ guid: '{bbbb}', colorScheme: 'Solarized Dark' }] },
      schemes: [wtScheme('Solarized Dark')],
    });
    return [{ settings, defaults }];
  }, (found) => {
    assert.strictEqual(found.length, 1);
    assert.strictEqual(found[0].name, 'Solarized Dark');
    assert.strictEqual(found[0].active, true);
  });
});

test('a defaults scheme with fewer than 16 ANSI colors is dropped', () => {
  withWtInstall((dir) => {
    const defaults = writeWtJson(dir, 'defaults.json', {
      defaultProfile: '{aaaa}',
      profiles: [{ guid: '{aaaa}', colorScheme: 'Campbell' }],
      schemes: [{ name: 'Campbell', black: '#000000', red: '#ff0000' }],
    });
    const settings = writeWtJson(dir, 'settings.json', {
      defaultProfile: '{bbbb}',
      profiles: { defaults: {}, list: [{ guid: '{bbbb}' }] },
      schemes: [],
    });
    return [{ settings, defaults }];
  }, (found) => {
    assert.deepStrictEqual(found, []);
  });
});

test('windows terminal discovery without injected files or LOCALAPPDATA finds nothing off win32', () => {
  if (process.platform === 'win32') { return; }
  withFixtureHome(() => {}, () => {
    assert.deepStrictEqual(discoverThemes({ sources: ['windows-terminal'] }), []);
  });
});

test('parseAppxInstallLocations reads install paths and rejects blank output', () => {
  const stdout = [
    'C:\\Program Files\\WindowsApps\\Microsoft.WindowsTerminal_1.0_x64__8wekyb3d8bbwe',
    '',
    'C:\\Program Files\\WindowsApps\\Microsoft.WindowsTerminalPreview_1.0_x64__8wekyb3d8bbwe',
    '   ',
  ].join('\r\n');
  assert.deepStrictEqual(parseAppxInstallLocations(stdout), [
    'C:\\Program Files\\WindowsApps\\Microsoft.WindowsTerminal_1.0_x64__8wekyb3d8bbwe',
    'C:\\Program Files\\WindowsApps\\Microsoft.WindowsTerminalPreview_1.0_x64__8wekyb3d8bbwe',
  ]);
  assert.deepStrictEqual(parseAppxInstallLocations(''), []);
  assert.deepStrictEqual(parseAppxInstallLocations('  \n\t  '), []);
});

test('windowsTerminalDefaultsFiles on non-win32 returns no paths', () => {
  if (process.platform === 'win32') { return; }
  assert.deepStrictEqual(windowsTerminalDefaultsFiles(), []);
});

test('a failed Windows Terminal install lookup is not memoized', () => {
  let calls = 0;
  const lookup = () => {
    calls += 1;
    if (calls === 1) { return { status: 1, stdout: '' }; }
    return { status: 0, stdout: 'C:\\WindowsTerminal\n' };
  };
  const failed = resolveWindowsTerminalDefaultsLookup(undefined, lookup);
  assert.deepStrictEqual(failed.paths, []);
  assert.strictEqual(failed.memo, undefined);
  const retried = resolveWindowsTerminalDefaultsLookup(failed.memo, lookup);
  assert.strictEqual(calls, 2);
  assert.deepStrictEqual(retried.paths, [path.join('C:\\WindowsTerminal', 'defaults.json')]);
  const held = resolveWindowsTerminalDefaultsLookup(retried.memo, () => {
    throw new Error('lookup ran after a successful memo');
  });
  assert.deepStrictEqual(held.paths, retried.paths);
});

test('a Windows Terminal lookup that succeeds with no package is memoized empty', () => {
  let calls = 0;
  const lookup = () => {
    calls += 1;
    return { status: 0, stdout: '' };
  };
  const first = resolveWindowsTerminalDefaultsLookup(undefined, lookup);
  assert.deepStrictEqual(first.paths, []);
  assert.ok(first.memo);
  const second = resolveWindowsTerminalDefaultsLookup(first.memo, lookup);
  assert.strictEqual(calls, 1);
  assert.deepStrictEqual(second.paths, []);
});

test('a Windows Terminal lookup that fails to spawn is not memoized', () => {
  const failed = resolveWindowsTerminalDefaultsLookup(undefined, () => ({
    status: null,
    error: new Error('spawn powershell ENOENT'),
    stdout: '',
  }));
  assert.strictEqual(failed.memo, undefined);
  assert.deepStrictEqual(failed.paths, []);
});

function paint(green: string): Palette {
  const ansi = new Array(16).fill('#000000');
  ansi[2] = green;
  return { ansi, background: '#111111', foreground: '#eeeeee' };
}

function theme(
  source: string,
  name: string,
  origin: string,
  palette: Palette,
  active = false,
): DiscoveredTheme {
  return { source, name, origin, palette, active };
}

function filesReader(
  files: Record<string, string>,
  over: Partial<MirrorLiveReaders> = {},
): { readers: MirrorLiveReaders; seen: string[] } {
  const seen: string[] = [];
  const readers: MirrorLiveReaders = {
    readText(file) {
      seen.push(file);
      return files[file];
    },
    windowsTerminalInstalls: over.windowsTerminalInstalls ?? (() => []),
    ghosttyConfigPaths: over.ghosttyConfigPaths ?? (() => []),
    alacrittyConfigPaths: over.alacrittyConfigPaths ?? (() => []),
    kittyCurrentThemePath: over.kittyCurrentThemePath ?? (() => ''),
    mobaIniPaths: over.mobaIniPaths ?? (() => []),
    xresourcesPaths: over.xresourcesPaths ?? (() => []),
  };
  return { readers, seen };
}

function wtFile(colorScheme: string | undefined, scheme?: ReturnType<typeof wtScheme>): string {
  return JSON.stringify({
    defaultProfile: '{aaaa}',
    profiles: {
      defaults: colorScheme ? { colorScheme } : {},
      list: [{ guid: '{aaaa}' }],
    },
    schemes: scheme ? [scheme] : [],
  });
}

function ansiColors(green: string): string {
  const line = (i: number) => `color${i} ${i === 2 ? green : '#000000'}`;
  return Array.from({ length: 16 }, (_, i) => line(i)).join('\n');
}

function xColors(green: string): string {
  return Array.from({ length: 16 }, (_, i) => `*.color${i}: ${i === 2 ? green : '#000000'}`).join('\n');
}

function mobaColors(greenByte: number): string {
  const keys = [
    'Black', 'Red', 'Green', 'Yellow', 'Blue', 'Magenta', 'Cyan', 'White',
    'BoldBlack', 'BoldRed', 'BoldGreen', 'BoldYellow',
    'BoldBlue', 'BoldMagenta', 'BoldCyan', 'BoldWhite',
  ];
  const rows = keys.map((key, i) => `${key}=${i === 2 ? `0,${greenByte},0` : '0,0,0'}`);
  return `[Colors]\n${rows.join('\n')}\n`;
}

function alacrittyPalette(green: string): string {
  const names = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
  const row = (list: string) => names
    .map((name) => `${name} = "${name === 'green' ? green : '#000000'}"`)
    .join('\n');
  return [
    '[colors.primary]',
    'background = "#111111"',
    'foreground = "#eeeeee"',
    '[colors.normal]',
    row('normal'),
    '[colors.bright]',
    row('bright'),
  ].join('\n');
}

test('stale Windows Terminal flag loses to the fresh scheme files', () => {
  const cached = [
    theme('windows-terminal', 'Campbell', '/old/defaults.json', paint('#111111'), true),
    theme('windows-terminal', 'One Half Dark', '/old/defaults.json', paint('#222222')),
  ];
  const { readers } = filesReader({
    S: wtFile('One Half Dark'),
    D: wtFile(undefined, wtScheme('One Half Dark', '#00ff00')),
  }, { windowsTerminalInstalls: () => [{ settings: 'S', defaults: 'D' }] });
  const got = mirrorLiveThemes(cached, readers);
  assert.strictEqual(got.length, 1);
  assert.strictEqual(got[0].name, 'One Half Dark');
  assert.strictEqual(got[0].palette.ansi[2], '#00ff00');
  assert.strictEqual(cached[1].palette.ansi[2], '#222222');
});

test('Windows Terminal name with no palette is dropped even if the cache has that name', () => {
  const cached = [theme('windows-terminal', 'Mystery', '/old/settings.json', paint('#00ff00'), true)];
  const { readers } = filesReader({
    S: wtFile('Mystery'),
    D: wtFile(undefined),
  }, { windowsTerminalInstalls: () => [{ settings: 'S', defaults: 'D' }] });
  assert.deepStrictEqual(mirrorLiveThemes(cached, readers), []);
});

test('omitted Windows Terminal colorScheme uses the fresh defaults file', () => {
  const cached = [theme('windows-terminal', 'Campbell', '/old/defaults.json', paint('#111111'), true)];
  const { readers } = filesReader({
    S: wtFile(undefined),
    D: JSON.stringify({
      defaultProfile: '{bbbb}',
      profiles: [{ guid: '{bbbb}', colorScheme: 'Vintage' }],
      schemes: [wtScheme('Vintage', '#00ff00')],
    }),
  }, { windowsTerminalInstalls: () => [{ settings: 'S', defaults: 'D' }] });
  const got = mirrorLiveThemes(cached, readers);
  assert.strictEqual(got.length, 1);
  assert.strictEqual(got[0].name, 'Vintage');
  assert.strictEqual(got[0].origin, 'D');
});

test('missing Windows Terminal settings and defaults do not revive the cache', () => {
  const cached = [theme('windows-terminal', 'Campbell', '/old/defaults.json', paint('#111111'), true)];
  const { readers } = filesReader({}, {
    windowsTerminalInstalls: () => [{ settings: 'S', defaults: 'D' }],
  });
  assert.deepStrictEqual(mirrorLiveThemes(cached, readers), []);
});

test('Ghostty pick joins the cache by name and does not read theme files', () => {
  const a = theme('ghostty', 'A', '/themes/A', paint('#111111'), true);
  const b = theme('ghostty', 'B', '/themes/B', paint('#00ff00'));
  const { readers, seen } = filesReader(
    { '/ghostty/config': 'theme = B\n' },
    { ghosttyConfigPaths: () => ['/ghostty/config'] },
  );
  const got = mirrorLiveThemes([a, b], readers);
  assert.strictEqual(got.length, 1);
  assert.strictEqual(got[0].name, 'B');
  assert.strictEqual(got[0].active, true);
  assert.strictEqual(got[0].palette, b.palette);
  assert.strictEqual(a.active, true);
  assert.deepStrictEqual(seen, ['/ghostty/config']);
});

test('Ghostty dark/light pick restamps appearance without editing the cache', () => {
  const a = theme('ghostty', 'A', '/themes/A', paint('#111111'));
  const b = theme('ghostty', 'B', '/themes/B', paint('#00ff00'));
  const { readers } = filesReader(
    { '/ghostty/config': 'theme = dark:A,light:B\n' },
    { ghosttyConfigPaths: () => ['/ghostty/config'] },
  );
  const got = mirrorLiveThemes([a, b], readers);
  const pair = activeGhosttyPair(got);
  assert.ok(pair);
  assert.strictEqual(pair?.dark.name, 'A');
  assert.strictEqual(pair?.light.name, 'B');
  assert.strictEqual(a.appearance, undefined);
  assert.strictEqual(b.appearance, undefined);
});

test('Ghostty name missing from the cache drops the stale active theme', () => {
  const old = theme('ghostty', 'Old', '/themes/Old', paint('#111111'), true);
  const { readers } = filesReader(
    { '/ghostty/config': 'theme = New\n' },
    { ghosttyConfigPaths: () => ['/ghostty/config'] },
  );
  assert.deepStrictEqual(mirrorLiveThemes([old], readers), []);
  assert.strictEqual(old.active, true);
});

test('Ghostty config with no theme line keeps a cached inline theme', () => {
  const inline = theme('ghostty', 'Ghostty config (inline)', '/ghostty/config', paint('#00ff00'), true);
  const { readers } = filesReader(
    { '/ghostty/config': 'background = #111111\nforeground = #eeeeee\n' },
    { ghosttyConfigPaths: () => ['/ghostty/config'] },
  );
  const got = mirrorLiveThemes([inline], readers);
  assert.strictEqual(got.length, 1);
  assert.strictEqual(got[0].palette, inline.palette);
  assert.strictEqual(got[0].active, true);
});

test('Ghostty named theme does not stay active after the config stops naming it', () => {
  const named = theme('ghostty', 'A', '/themes/A', paint('#111111'), true);
  const { readers } = filesReader(
    { '/ghostty/config': 'background = #111111\n' },
    { ghosttyConfigPaths: () => ['/ghostty/config'] },
  );
  assert.deepStrictEqual(mirrorLiveThemes([named], readers), []);
});

test('Alacritty import pick joins the cache by path', () => {
  const first = theme('alacritty', 'one', '/themes/one.toml', paint('#111111'), true);
  const second = theme('alacritty', 'two', '/themes/two.toml', paint('#00ff00'));
  const { readers, seen } = filesReader(
    { '/cfg/alacritty.toml': 'import = ["/themes/two.toml"]\n' },
    { alacrittyConfigPaths: () => ['/cfg/alacritty.toml'] },
  );
  const got = mirrorLiveThemes([first, second], readers);
  assert.strictEqual(got.length, 1);
  assert.strictEqual(got[0].name, 'two');
  assert.strictEqual(got[0].palette, second.palette);
  assert.deepStrictEqual(seen, ['/cfg/alacritty.toml']);
});

test('Alacritty skips an import that is not cached', () => {
  const a = theme('alacritty', 'A', '/themes/a.toml', paint('#00ff00'));
  const stale = theme('alacritty', 'stale', '/themes/stale.toml', paint('#111111'), true);
  const { readers, seen } = filesReader({
    '/cfg/alacritty.toml': 'import = ["/themes/a.toml", "/themes/new.toml"]\n',
  }, { alacrittyConfigPaths: () => ['/cfg/alacritty.toml'] });
  const got = mirrorLiveThemes([a, stale], readers);
  assert.strictEqual(got.length, 1);
  assert.strictEqual(got[0].name, 'A');
  assert.deepStrictEqual(seen, ['/cfg/alacritty.toml']);
});

test('Alacritty import missing from the cache drops the stale theme', () => {
  const stale = theme('alacritty', 'old', '/themes/old.toml', paint('#111111'), true);
  const { readers } = filesReader({
    '/cfg/alacritty.toml': 'import = ["/themes/missing.toml"]\n',
  }, { alacrittyConfigPaths: () => ['/cfg/alacritty.toml'] });
  assert.deepStrictEqual(mirrorLiveThemes([stale], readers), []);
});

test('Alacritty config file that is itself a palette uses the cached palette', () => {
  const config = theme('alacritty', 'alacritty', '/cfg/alacritty.toml', paint('#00ff00'));
  const { readers } = filesReader({
    '/cfg/alacritty.toml': alacrittyPalette('#ff0000'),
  }, { alacrittyConfigPaths: () => ['/cfg/alacritty.toml'] });
  const got = mirrorLiveThemes([config], readers);
  assert.strictEqual(got.length, 1);
  assert.strictEqual(got[0].palette, config.palette);
  assert.strictEqual(got[0].palette.ansi[2], '#00ff00');
});

test('kitty pick is the fresh current-theme.conf', () => {
  const cached = theme('kitty', 'kitty current theme', '/kitty/current-theme.conf', paint('#111111'), true);
  const { readers, seen } = filesReader({
    '/kitty/current-theme.conf': ansiColors('#00ff00'),
    '/kitty/themes/other.conf': ansiColors('#ff0000'),
  }, { kittyCurrentThemePath: () => '/kitty/current-theme.conf' });
  const got = mirrorLiveThemes([cached], readers);
  assert.strictEqual(got.length, 1);
  assert.strictEqual(got[0].palette.ansi[2], '#00ff00');
  assert.deepStrictEqual(seen, ['/kitty/current-theme.conf']);
});

test('MobaXterm pick is the fresh ini and does not read mxtcolors', () => {
  const cached = theme('mobaxterm', 'MobaXterm', '/docs/MobaXterm/MobaXterm.ini', paint('#111111'), true);
  const { readers, seen } = filesReader({
    '/docs/MobaXterm/MobaXterm.ini': mobaColors(255),
    '/docs/MobaXterm/pack.mxtcolors': mobaColors(1),
  }, { mobaIniPaths: () => ['/docs/MobaXterm/MobaXterm.ini'] });
  const got = mirrorLiveThemes([cached], readers);
  assert.strictEqual(got.length, 1);
  assert.strictEqual(got[0].palette.ansi[2], '#00ff00');
  assert.deepStrictEqual(seen, ['/docs/MobaXterm/MobaXterm.ini']);
});

test('Xresources pick is the fresh dotfile', () => {
  const cached = theme('xresources', '.Xresources', '/home/.Xresources', paint('#111111'), true);
  const { readers } = filesReader({
    '/home/.Xresources': xColors('#00ff00'),
  }, { xresourcesPaths: () => ['/home/.Xresources'] });
  const got = mirrorLiveThemes([cached], readers);
  assert.strictEqual(got.length, 1);
  assert.strictEqual(got[0].palette.ansi[2], '#00ff00');
});

test('WezTerm and iTerm2 stay out of Mirror even when the cache marks them active', () => {
  const cached = [
    theme('wezterm', 'Builtin', '/wez/colors/builtin.toml', paint('#00ff00'), true),
    theme('iterm2', 'Pastel', '/iterm/Pastel.itermcolors', paint('#00ff00'), true),
  ];
  assert.deepStrictEqual(mirrorLiveThemes(cached, filesReader({}).readers), []);
});

test('several emulators can all be live', () => {
  const imported = theme('alacritty', 'two', '/themes/two.toml', paint('#00aa00'));
  const { readers } = filesReader({
    S: wtFile('One Half Dark'),
    D: wtFile(undefined, wtScheme('One Half Dark', '#00ff00')),
    '/cfg/alacritty.toml': 'import = ["/themes/two.toml"]\n',
    '/docs/MobaXterm.ini': mobaColors(255),
  }, {
    windowsTerminalInstalls: () => [{ settings: 'S', defaults: 'D' }],
    alacrittyConfigPaths: () => ['/cfg/alacritty.toml'],
    mobaIniPaths: () => ['/docs/MobaXterm.ini'],
  });
  const got = mirrorLiveThemes([imported], readers);
  assert.deepStrictEqual(got.map((t) => t.source).sort(), ['alacritty', 'mobaxterm', 'windows-terminal']);
});

test('empty catalog and no live files yield no themes', () => {
  assert.deepStrictEqual(mirrorLiveThemes([], filesReader({}).readers), []);
});

test('sources limits the live read to Ghostty', () => {
  const b = theme('ghostty', 'B', '/themes/B', paint('#00ff00'));
  const readers: MirrorLiveReaders = {
    readText: () => 'theme = B\n',
    windowsTerminalInstalls: () => { throw new Error('windows terminal was read'); },
    ghosttyConfigPaths: () => ['/ghostty/config'],
    alacrittyConfigPaths: () => { throw new Error('alacritty was read'); },
    kittyCurrentThemePath: () => { throw new Error('kitty was read'); },
    mobaIniPaths: () => { throw new Error('mobaxterm was read'); },
    xresourcesPaths: () => { throw new Error('xresources was read'); },
  };
  const got = mirrorLiveThemes([b], readers, ['ghostty']);
  assert.strictEqual(got.length, 1);
  assert.strictEqual(got[0].name, 'B');
});

test('mirrorSelection of an empty live read is empty', () => {
  assert.deepStrictEqual(mirrorSelection([], filesReader({}).readers), []);
});

test('Mirror home paths follow os.homedir when HOME is unset and USERPROFILE differs', () => {
  const prevHome = process.env.HOME;
  const prevProfile = process.env.USERPROFILE;
  const decoy = fs.mkdtempSync(path.join(os.tmpdir(), 'vtt-decoy-'));
  delete process.env.HOME;
  process.env.USERPROFILE = decoy;
  try {
    const scanned = os.homedir();
    assert.notStrictEqual(path.resolve(scanned), path.resolve(decoy));
    const readers = defaultMirrorLiveReaders([]);
    assert.deepStrictEqual(readers.xresourcesPaths(), [
      path.join(scanned, '.Xresources'),
      path.join(scanned, '.Xdefaults'),
    ]);
    const imported = path.join(scanned, 'picked-theme.toml');
    const config = path.join(scanned, 'alacritty.toml');
    const got = mirrorLiveThemes(
      [theme('alacritty', 'Picked', imported, paint('#00ff00'))],
      {
        readText: (file) => (file === config ? 'import = ["~/picked-theme.toml"]\n' : undefined),
        windowsTerminalInstalls: () => [],
        ghosttyConfigPaths: () => [],
        alacrittyConfigPaths: () => [config],
        kittyCurrentThemePath: () => '',
        mobaIniPaths: () => [],
        xresourcesPaths: () => [],
      },
    );
    assert.strictEqual(got.length, 1);
    assert.strictEqual(got[0].name, 'Picked');
  } finally {
    restoreEnv('HOME', prevHome);
    restoreEnv('USERPROFILE', prevProfile);
    fs.rmSync(decoy, { recursive: true, force: true });
  }
});

test('defaultMirrorLiveReaders reports live paths and honors sources', () => {
  withFixtureHome((_xdg, home) => {
    const xdg = process.env.XDG_CONFIG_HOME as string;
    fs.mkdirSync(path.join(xdg, 'alacritty'), { recursive: true });
    fs.writeFileSync(path.join(xdg, 'alacritty', 'alacritty.toml'), '');
    fs.mkdirSync(path.join(home, '.alacritty'), { recursive: true });
    fs.writeFileSync(path.join(home, '.alacritty', 'alacritty.toml'), '');
    const appdata = path.join(home, 'AppData');
    fs.mkdirSync(path.join(appdata, 'alacritty'), { recursive: true });
    fs.writeFileSync(path.join(appdata, 'alacritty', 'alacritty.toml'), '');
    process.env.APPDATA = appdata;
    process.env.USERPROFILE = home;
    fs.mkdirSync(path.join(home, 'Documents', 'MobaXterm'), { recursive: true });
    fs.writeFileSync(path.join(home, 'Documents', 'MobaXterm', 'MobaXterm.ini'), '[Colors]\n');
  }, (xdg, home) => {
    const readers = defaultMirrorLiveReaders([]);
    assert.deepStrictEqual(readers.ghosttyConfigPaths(), [path.join(xdg, 'ghostty', 'config')]);
    assert.strictEqual(readers.kittyCurrentThemePath(), path.join(xdg, 'kitty', 'current-theme.conf'));
    assert.deepStrictEqual(readers.xresourcesPaths(), [
      path.join(home, '.Xresources'),
      path.join(home, '.Xdefaults'),
    ]);
    const configs = readers.alacrittyConfigPaths();
    assert.ok(configs.includes(path.join(xdg, 'alacritty', 'alacritty.toml')));
    assert.ok(configs.includes(path.join(home, '.alacritty', 'alacritty.toml')));
    assert.ok(configs.includes(path.join(home, 'AppData', 'alacritty', 'alacritty.toml')));
    assert.ok(readers.mobaIniPaths().includes(path.join(home, 'Documents', 'MobaXterm', 'MobaXterm.ini')));

    const ghosttyOnly = defaultMirrorLiveReaders([], ['ghostty']);
    assert.deepStrictEqual(ghosttyOnly.mobaIniPaths(), []);
    assert.deepStrictEqual(ghosttyOnly.windowsTerminalInstalls(), []);
    assert.strictEqual(ghosttyOnly.kittyCurrentThemePath(), '');
  });
});

console.log(`\n${passed} passed\n`);
