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
  };
  process.env.HOME = home;
  process.env.XDG_CONFIG_HOME = xdg;
  process.env.XDG_DATA_DIRS = path.join(home, 'xdg-data-missing');
  delete process.env.LOCALAPPDATA;

  try {
    populate(xdg, home);
    body(xdg, home);
  } finally {
    restoreEnv('HOME', prev.HOME);
    restoreEnv('XDG_CONFIG_HOME', prev.XDG_CONFIG_HOME);
    restoreEnv('XDG_DATA_DIRS', prev.XDG_DATA_DIRS);
    restoreEnv('LOCALAPPDATA', prev.LOCALAPPDATA);
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
    const resDir = path.join(home, 'Applications', 'iTerm.app', 'Contents', 'Resources');
    fs.mkdirSync(resDir, { recursive: true });
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Pastel</key>
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
</dict>
</plist>`;
    fs.writeFileSync(path.join(resDir, 'ColorPresets.plist'), xml, 'utf8');
  }, (_xdg, home) => {
    const origin = path.join(home, 'Applications', 'iTerm.app', 'Contents', 'Resources', 'ColorPresets.plist');
    const results = discoverThemes({ sources: ['iterm2'] });
    const found = results.find((t) => t.origin === origin && t.name === 'Pastel');
    assert.ok(found, `expected bundled preset Pastel with origin ${origin}`);
    assert.strictEqual(found.source, 'iterm2');
    assert.strictEqual(found.active, false);
    assert.ok(isUsable(found.palette));
  });
});

console.log(`\n${passed} passed\n`);
