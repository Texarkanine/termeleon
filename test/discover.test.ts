import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { discoverThemes } from '../src/discover';
import { isUsable } from '../src/palette';

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

console.log(`\n${passed} passed\n`);
