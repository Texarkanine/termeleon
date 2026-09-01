import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

import {
  applyPalette, removeApplied, restoreSnapshot, snapshot, ownedKeys, ApplyOptions,
} from '../../src/apply';
import { toColorCustomizations } from '../../src/palette';
import { fakeContext, inspectColors, resetSettings, samplePalette } from './helpers';

const workspaceOpts = (extra: Partial<ApplyOptions> = {}): ApplyOptions => ({
  target: 'workspace',
  scopeToActiveTheme: false,
  includeSelectionForeground: false,
  setMinimumContrastRatio: false,
  ...extra,
});

async function writeColors(
  target: vscode.ConfigurationTarget,
  value: Record<string, any> | undefined,
): Promise<void> {
  await vscode.workspace.getConfiguration('workbench')
    .update('colorCustomizations', value, target);
}

function activeScope(): string {
  const theme = vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
  assert.ok(theme, 'expected workbench.colorTheme');
  return `[${theme}]`;
}

function workspaceVscodeDir(): string {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  assert.ok(root, 'expected open workspace folder');
  return path.join(root, '.vscode');
}

suite('apply / remove / snapshot', () => {
  const ctx = fakeContext();

  setup(async () => {
    await resetSettings();
    await ctx.workspaceState.update('terminalThemeImport.ownedKeys', undefined);
    await ctx.globalState.update('terminalThemeImport.ownedKeys', undefined);
  });

  suiteTeardown(async () => {
    await resetSettings();
  });

  test('flat apply writes terminal keys and records owned keys', async () => {
    const palette = samplePalette();
    const expected = toColorCustomizations(palette);
    await applyPalette(ctx, palette, workspaceOpts());

    const colors = inspectColors('workspace');
    for (const [key, value] of Object.entries(expected)) {
      assert.strictEqual(colors[key], value, key);
    }
    assert.deepStrictEqual(
      [...ownedKeys(ctx, 'workspace')].sort(),
      Object.keys(expected).sort(),
    );
  });

  test('scoped apply nests colors under the active workbench theme', async () => {
    const palette = samplePalette();
    const expected = toColorCustomizations(palette);
    await applyPalette(ctx, palette, workspaceOpts({ scopeToActiveTheme: true }));

    const scope = activeScope();
    const colors = inspectColors('workspace');
    assert.deepStrictEqual(colors[scope], expected);
    for (const key of Object.keys(expected)) {
      assert.ok(!(key in colors) || key === scope, `flat key leaked: ${key}`);
    }
    assert.deepStrictEqual(
      [...ownedKeys(ctx, 'workspace')].sort(),
      Object.keys(expected).map((k) => `${scope}.${k}`).sort(),
    );
  });

  test('non-terminal keys survive apply and owned-key remove', async () => {
    await writeColors(vscode.ConfigurationTarget.Workspace, {
      'editor.foreground': '#abcdef',
    });
    const palette = samplePalette();
    await applyPalette(ctx, palette, workspaceOpts());
    assert.strictEqual(inspectColors('workspace')['editor.foreground'], '#abcdef');

    const result = await removeApplied(ctx, 'workspace', false);
    assert.strictEqual(result.usedFallback, false);
    assert.ok(result.removed > 0);
    assert.strictEqual(inspectColors('workspace')['editor.foreground'], '#abcdef');
    assert.deepStrictEqual(ownedKeys(ctx, 'workspace'), []);
  });

  test('undefined palette slots are omitted and do not clear existing keys', async () => {
    await writeColors(vscode.ConfigurationTarget.Workspace, {
      'terminalCursor.foreground': '#abcdef',
    });
    const palette = samplePalette({ cursor: undefined });
    await applyPalette(ctx, palette, workspaceOpts());

    const colors = inspectColors('workspace');
    assert.strictEqual(colors['terminalCursor.foreground'], '#abcdef');
    assert.ok(!ownedKeys(ctx, 'workspace').includes('terminalCursor.foreground'));
  });

  test('includeSelectionForeground false omits terminal.selectionForeground', async () => {
    await applyPalette(ctx, samplePalette(), workspaceOpts({ includeSelectionForeground: false }));
    const colors = inspectColors('workspace');
    assert.ok(!('terminal.selectionForeground' in colors));
  });

  test('includeSelectionForeground true writes terminal.selectionForeground', async () => {
    const palette = samplePalette();
    await applyPalette(ctx, palette, workspaceOpts({ includeSelectionForeground: true }));
    assert.strictEqual(
      inspectColors('workspace')['terminal.selectionForeground'],
      palette.selectionForeground,
    );
  });

  test('setMinimumContrastRatio true writes 1 at the same target', async () => {
    await applyPalette(ctx, samplePalette(), workspaceOpts({ setMinimumContrastRatio: true }));
    const inspected = vscode.workspace.getConfiguration('terminal.integrated')
      .inspect<number>('minimumContrastRatio');
    assert.strictEqual(inspected?.workspaceValue, 1);
    assert.strictEqual(inspected?.globalValue, undefined);
  });

  test('removeApplied clears minimumContrastRatio when set to 1 at target', async () => {
    await applyPalette(ctx, samplePalette(), workspaceOpts({ setMinimumContrastRatio: true }));
    const termConfig = vscode.workspace.getConfiguration('terminal.integrated');
    assert.strictEqual(termConfig.inspect<number>('minimumContrastRatio')?.workspaceValue, 1);

    const result = await removeApplied(ctx, 'workspace', false);
    assert.ok(result.removed > 0);
    assert.strictEqual(termConfig.inspect<number>('minimumContrastRatio')?.workspaceValue, undefined);
  });

  test('removeApplied preserves minimumContrastRatio when set to a custom value other than 1', async () => {
    const termConfig = vscode.workspace.getConfiguration('terminal.integrated');
    await termConfig.update('minimumContrastRatio', 3, vscode.ConfigurationTarget.Workspace);
    await applyPalette(ctx, samplePalette(), workspaceOpts({ setMinimumContrastRatio: false }));

    const result = await removeApplied(ctx, 'workspace', false);
    assert.ok(result.removed > 0);
    assert.strictEqual(termConfig.inspect<number>('minimumContrastRatio')?.workspaceValue, 3);
  });

  test('removeApplied cleans up empty .vscode/settings.json and empty .vscode directory on workspace target', async () => {
    const vscodeDir = workspaceVscodeDir();
    const settingsFile = path.join(vscodeDir, 'settings.json');

    await applyPalette(ctx, samplePalette(), workspaceOpts({ setMinimumContrastRatio: true }));
    assert.ok(fs.existsSync(settingsFile), 'expected settings.json to exist after apply');

    const result = await removeApplied(ctx, 'workspace', false);
    assert.ok(result.removed > 0);
    assert.ok(!fs.existsSync(settingsFile), 'expected settings.json to be deleted after remove');
    assert.ok(!fs.existsSync(vscodeDir), 'expected .vscode dir to be deleted after remove');
  });

  test('removeApplied preserves .vscode/settings.json when other workspace settings exist', async () => {
    const vscodeDir = workspaceVscodeDir();
    const settingsFile = path.join(vscodeDir, 'settings.json');

    await vscode.workspace.getConfiguration('editor').update('tabSize', 4, vscode.ConfigurationTarget.Workspace);
    await applyPalette(ctx, samplePalette(), workspaceOpts());

    const result = await removeApplied(ctx, 'workspace', false);
    assert.ok(result.removed > 0);
    assert.ok(fs.existsSync(settingsFile), 'expected settings.json to be preserved');
    assert.ok(fs.existsSync(vscodeDir), 'expected .vscode dir to be preserved');

    await vscode.workspace.getConfiguration('editor').update('tabSize', undefined, vscode.ConfigurationTarget.Workspace);
  });

  test('removeApplied preserves .vscode directory when other files exist in it', async () => {
    const vscodeDir = workspaceVscodeDir();
    const settingsFile = path.join(vscodeDir, 'settings.json');
    const launchFile = path.join(vscodeDir, 'launch.json');

    await applyPalette(ctx, samplePalette(), workspaceOpts());
    fs.writeFileSync(launchFile, '{}');

    try {
      const result = await removeApplied(ctx, 'workspace', false);
      assert.ok(result.removed > 0);
      assert.ok(!fs.existsSync(settingsFile), 'expected settings.json to be deleted');
      assert.ok(fs.existsSync(vscodeDir), 'expected .vscode dir to be preserved because launch.json exists');
      assert.ok(fs.existsSync(launchFile), 'expected launch.json to be preserved');
    } finally {
      if (fs.existsSync(launchFile)) {
        fs.unlinkSync(launchFile);
      }
      if (fs.existsSync(vscodeDir) && fs.readdirSync(vscodeDir).length === 0) {
        fs.rmdirSync(vscodeDir);
      }
    }
  });

  test('workspace apply does not copy global colorCustomizations into workspace', async () => {
    await writeColors(vscode.ConfigurationTarget.Global, {
      'editor.background': '#010101',
    });
    await applyPalette(ctx, samplePalette(), workspaceOpts());
    const workspace = inspectColors('workspace');
    const global = inspectColors('global');
    assert.strictEqual(global['editor.background'], '#010101');
    assert.ok(!('editor.background' in workspace));
  });

  test('removeApplied deletes only owned keys', async () => {
    await writeColors(vscode.ConfigurationTarget.Workspace, {
      'editor.foreground': '#abcdef',
      'terminal.background': '#000000',
    });
    await applyPalette(ctx, samplePalette(), workspaceOpts());
    const before = ownedKeys(ctx, 'workspace');
    assert.ok(before.includes('terminal.background'));

    const result = await removeApplied(ctx, 'workspace', false);
    assert.strictEqual(result.usedFallback, false);
    assert.strictEqual(result.removed, before.length);

    const colors = inspectColors('workspace');
    assert.strictEqual(colors['editor.foreground'], '#abcdef');
    assert.ok(!('terminal.background' in colors));
    assert.ok(!('terminal.foreground' in colors));
  });

  test('removeApplied with empty owned and no fallback is a no-op', async () => {
    await writeColors(vscode.ConfigurationTarget.Workspace, {
      'terminal.background': '#123456',
    });
    const result = await removeApplied(ctx, 'workspace', false);
    assert.deepStrictEqual(result, { removed: 0, usedFallback: false });
    assert.strictEqual(inspectColors('workspace')['terminal.background'], '#123456');
  });

  test('fallback remove sweeps managedKeys at top level and inside theme blocks', async () => {
    const inner: Record<string, string> = { 'terminal.background': '#111111', 'editor.foreground': '#abcdef' };
    await writeColors(vscode.ConfigurationTarget.Workspace, {
      'terminal.foreground': '#eeeeee',
      '[Dark+]': inner,
    });

    const result = await removeApplied(ctx, 'workspace', true);
    assert.strictEqual(result.usedFallback, true);
    assert.ok(result.removed >= 2);

    const colors = inspectColors('workspace');
    assert.ok(!('terminal.foreground' in colors));
    assert.ok(!('terminal.background' in (colors['[Dark+]'] ?? {})));
    assert.strictEqual(colors['[Dark+]']['editor.foreground'], '#abcdef');
  });

  test('fallback remove deletes an emptied theme-scoped object', async () => {
    await writeColors(vscode.ConfigurationTarget.Workspace, {
      '[Dark+]': { 'terminal.background': '#111111' },
    });
    const result = await removeApplied(ctx, 'workspace', true);
    assert.strictEqual(result.usedFallback, true);
    assert.ok(result.removed >= 1);
    assert.ok(!('[Dark+]' in inspectColors('workspace')));
  });

  test('fallback remove clears minimumContrastRatio when set to 1', async () => {
    const termConfig = vscode.workspace.getConfiguration('terminal.integrated');
    await termConfig.update('minimumContrastRatio', 1, vscode.ConfigurationTarget.Workspace);
    await writeColors(vscode.ConfigurationTarget.Workspace, {
      'terminal.background': '#111111',
    });

    const result = await removeApplied(ctx, 'workspace', true);
    assert.strictEqual(result.usedFallback, true);
    assert.strictEqual(termConfig.inspect<number>('minimumContrastRatio')?.workspaceValue, undefined);
  });

  test('restoreSnapshot writes the captured object back', async () => {
    await writeColors(vscode.ConfigurationTarget.Workspace, { 'editor.foreground': '#111111' });
    const captured = snapshot('workspace');
    await writeColors(vscode.ConfigurationTarget.Workspace, { 'editor.foreground': '#222222' });
    await restoreSnapshot('workspace', captured);
    assert.strictEqual(inspectColors('workspace')['editor.foreground'], '#111111');
  });

  test('restoreSnapshot of undefined or empty clears the target', async () => {
    await writeColors(vscode.ConfigurationTarget.Workspace, { 'terminal.background': '#111111' });
    await restoreSnapshot('workspace', undefined);
    assert.deepStrictEqual(inspectColors('workspace'), {});

    await writeColors(vscode.ConfigurationTarget.Workspace, { 'terminal.background': '#111111' });
    await restoreSnapshot('workspace', {});
    assert.deepStrictEqual(inspectColors('workspace'), {});
  });
});
