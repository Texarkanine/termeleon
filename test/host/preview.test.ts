import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import {
  applyPalette, applyPalettePair, LivePreview, PREVIEW_DEBOUNCE_MS, ApplyOptions, removeApplied,
} from '../../src/apply';
import { toColorCustomizations } from '../../src/palette';
import { fakeContext, inspectColors, resetSettings, samplePalette } from './helpers';

const opts: ApplyOptions = {
  target: 'workspace',
  scopeToActiveTheme: false,
  includeSelectionForeground: false,
  setMinimumContrastRatio: false,
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ansi(slot: number): string {
  return `#${slot.toString(16).padStart(2, '0')}aaaaaa`.slice(0, 7);
}

suite('LivePreview', () => {
  const ctx = fakeContext();

  setup(async () => {
    await resetSettings();
    await ctx.workspaceState.update('termeleon.ownedKeys', undefined);
  });

  suiteTeardown(async () => {
    await resetSettings();
  });

  test('cancel restores the pre-session snapshot, including empty', async () => {
    const preview = new LivePreview(ctx, opts);
    await applyPalette(ctx, samplePalette(), opts);
    assert.ok('terminal.background' in inspectColors('workspace'));

    await preview.cancel();
    assert.deepStrictEqual(inspectColors('workspace'), {});
  });

  test('cancel restores pre-session minimumContrastRatio', async () => {
    const termConfig = vscode.workspace.getConfiguration('terminal.integrated');
    await termConfig.update('minimumContrastRatio', 4.5, vscode.ConfigurationTarget.Workspace);

    const previewOpts: ApplyOptions = { ...opts, setMinimumContrastRatio: true };
    const preview = new LivePreview(ctx, previewOpts);

    preview.schedule(samplePalette());
    await delay(PREVIEW_DEBOUNCE_MS + 100);
    assert.strictEqual(termConfig.inspect<number>('minimumContrastRatio')?.workspaceValue, 1);

    await preview.cancel();
    assert.strictEqual(termConfig.inspect<number>('minimumContrastRatio')?.workspaceValue, 4.5);
  });

  test('cancel in empty workspace cleans up .vscode/settings.json and empty .vscode directory', async () => {
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    assert.ok(root, 'expected workspace folder');
    const vscodeDir = path.join(root, '.vscode');
    const settingsFile = path.join(vscodeDir, 'settings.json');

    const preview = new LivePreview(ctx, opts);
    preview.schedule(samplePalette());
    await delay(PREVIEW_DEBOUNCE_MS + 100);
    assert.ok(fs.existsSync(settingsFile), 'expected settings.json to exist during preview');

    await preview.cancel();
    assert.ok(!fs.existsSync(settingsFile), 'expected settings.json to be deleted after preview cancel');
    assert.ok(!fs.existsSync(vscodeDir), 'expected .vscode dir to be deleted after preview cancel');
  });

  test('two schedules inside the debounce window apply only the second palette', async () => {
    await vscode.workspace.getConfiguration('workbench').update(
      'colorCustomizations',
      { 'editor.foreground': '#abcdef' },
      vscode.ConfigurationTarget.Workspace,
    );

    const first = samplePalette({
      background: '#111111',
      cursor: '#ff0000',
      ansi: Array.from({ length: 16 }, (_, i) => ansi(i)),
    });
    const second = samplePalette({
      background: '#222222',
      cursor: undefined,
      ansi: Array.from({ length: 16 }, (_, i) => ansi(i + 1)),
    });

    const preview = new LivePreview(ctx, opts);
    preview.schedule(first);
    preview.schedule(second);
    await delay(PREVIEW_DEBOUNCE_MS + 50);

    const colors = inspectColors('workspace');
    assert.strictEqual(colors['terminal.background'], '#222222');
    assert.ok(
      !('terminalCursor.foreground' in colors),
      'first palette cursor must not remain — that would mean both applies merged',
    );
    assert.strictEqual(colors['editor.foreground'], '#abcdef');
    assert.strictEqual(
      colors['terminal.foreground'],
      toColorCustomizations(second)['terminal.foreground'],
    );

    await preview.cancel();
    assert.strictEqual(inspectColors('workspace')['editor.foreground'], '#abcdef');
    assert.ok(!('terminal.background' in inspectColors('workspace')));
  });

  test('stop() on accept prevents leftover apply after remove', async () => {
    const palette = samplePalette();
    const preview = new LivePreview(ctx, opts);
    preview.schedule(palette);
    preview.stop();
    await applyPalette(ctx, palette, opts);
    const result = await removeApplied(ctx, 'workspace', false);
    assert.ok(result.removed > 0);
    await delay(PREVIEW_DEBOUNCE_MS + 50);
    assert.ok(
      !('terminal.background' in inspectColors('workspace')),
      'pending preview must not re-apply after accept-then-remove',
    );
  });

  test('schedulePair debounces applyPalettePair and cancel restores snapshot', async () => {
    const darkPalette = samplePalette({ background: '#0a0a0a', foreground: '#ffffff' });
    const lightPalette = samplePalette({ background: '#f0f0f0', foreground: '#000000' });

    const preview = new LivePreview(ctx, opts);
    preview.schedulePair(darkPalette, lightPalette);
    await delay(PREVIEW_DEBOUNCE_MS + 100);

    const colors = inspectColors('workspace');
    const workbench = vscode.workspace.getConfiguration('workbench');
    const darkScope = `[${workbench.get<string>('preferredDarkColorTheme') ?? ''}]`;
    const lightScope = `[${workbench.get<string>('preferredLightColorTheme') ?? ''}]`;

    assert.ok(darkScope in colors, `expected ${darkScope} in colors`);
    assert.ok(lightScope in colors, `expected ${lightScope} in colors`);
    assert.strictEqual(colors[darkScope]['terminal.background'], '#0a0a0a');
    assert.strictEqual(colors[lightScope]['terminal.background'], '#f0f0f0');

    await preview.cancel();
    assert.deepStrictEqual(inspectColors('workspace'), {});
  });

  test('schedule followed by schedulePair within debounce window applies only the pair', async () => {
    const single = samplePalette({ background: '#111111' });
    const dark = samplePalette({ background: '#222222' });
    const light = samplePalette({ background: '#eeeeee' });

    const preview = new LivePreview(ctx, opts);
    preview.schedule(single);
    preview.schedulePair(dark, light);
    await delay(PREVIEW_DEBOUNCE_MS + 50);

    const colors = inspectColors('workspace');
    assert.ok(!('terminal.background' in colors), 'flat single palette must not be applied');
    const workbench = vscode.workspace.getConfiguration('workbench');
    const darkScope = `[${workbench.get<string>('preferredDarkColorTheme') ?? ''}]`;
    assert.ok(darkScope in colors);
    assert.strictEqual(colors[darkScope]['terminal.background'], '#222222');

    await preview.cancel();
    assert.deepStrictEqual(inspectColors('workspace'), {});
  });

  test('schedulePair followed by schedule within debounce window applies only the single palette', async () => {
    const dark = samplePalette({ background: '#222222' });
    const light = samplePalette({ background: '#eeeeee' });
    const single = samplePalette({ background: '#111111' });

    const preview = new LivePreview(ctx, opts);
    preview.schedulePair(dark, light);
    preview.schedule(single);
    await delay(PREVIEW_DEBOUNCE_MS + 50);

    const colors = inspectColors('workspace');
    assert.strictEqual(colors['terminal.background'], '#111111');
    const workbench = vscode.workspace.getConfiguration('workbench');
    const darkScope = `[${workbench.get<string>('preferredDarkColorTheme') ?? ''}]`;
    assert.ok(!(darkScope in colors), 'paired scope must not be applied');

    await preview.cancel();
    assert.deepStrictEqual(inspectColors('workspace'), {});
  });

  test('stop() on accept after schedulePair prevents leftover apply after remove', async () => {
    const dark = samplePalette({ background: '#222222' });
    const light = samplePalette({ background: '#eeeeee' });
    const preview = new LivePreview(ctx, opts);
    preview.schedulePair(dark, light);
    preview.stop();
    await applyPalettePair(ctx, dark, light, opts);
    const result = await removeApplied(ctx, 'workspace', false);
    assert.ok(result.removed > 0);
    await delay(PREVIEW_DEBOUNCE_MS + 50);
    assert.deepStrictEqual(inspectColors('workspace'), {});
  });
});
