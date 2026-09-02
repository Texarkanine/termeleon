import * as assert from 'assert';
import * as vscode from 'vscode';
import { DiscoveredTheme } from '../../src/palette';
import { MirrorCandidate } from '../../src/discover';
import { toItem, toMirrorItem, ensureTerminalVisible, pickMirrorCandidate } from '../../src/extension';
import { PREVIEW_DEBOUNCE_MS } from '../../src/apply';
import { fakeContext, inspectColors, resetSettings, samplePalette } from './helpers';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeTheme(overrides: Partial<DiscoveredTheme> = {}): DiscoveredTheme {
  return {
    name: 'Sample Theme',
    source: 'ghostty',
    origin: '/path/to/theme/sample',
    active: false,
    palette: samplePalette(),
    ...overrides,
  };
}

suite('picker items and terminal reveal', () => {
  test('toItem sets detail to origin path without block characters', () => {
    const theme = makeTheme({ origin: '/home/user/.config/ghostty/themes/nord' });
    const item = toItem(theme);

    assert.strictEqual(item.detail, '/home/user/.config/ghostty/themes/nord');
    assert.ok(!item.detail.includes('\u2588'), 'detail must not contain swatch block characters');
  });

  test('toMirrorItem sets detail for pair candidate without block characters', () => {
    const dark = makeTheme({ name: 'Dark', origin: '/path/to/dark' });
    const light = makeTheme({ name: 'Light', origin: '/path/to/light' });
    const candidate: MirrorCandidate = { kind: 'pair', dark, light };

    const item = toMirrorItem(candidate);
    assert.strictEqual(item.detail, '/path/to/dark  ·  /path/to/light');
    assert.ok(!item.detail.includes('\u2588'), 'detail must not contain swatch block characters');
  });

  test('toMirrorItem sets detail for single theme candidate without block characters', () => {
    const theme = makeTheme({ origin: '/path/to/single' });
    const candidate: MirrorCandidate = { kind: 'theme', theme };

    const item = toMirrorItem(candidate);
    assert.strictEqual(item.detail, '/path/to/single');
    assert.ok(!item.detail.includes('\u2588'), 'detail must not contain swatch block characters');
  });

  test('ensureTerminalVisible shows a terminal', () => {
    ensureTerminalVisible();
    assert.ok(vscode.window.terminals.length > 0, 'expected at least one terminal to exist');
  });
});

suite('mirror multi-candidate preview and quickpick', () => {
  const ctx = fakeContext();

  setup(async () => {
    await resetSettings();
    await ctx.workspaceState.update('termeleon.ownedKeys', undefined);
  });

  suiteTeardown(async () => {
    await resetSettings();
  });

  test('pickMirrorCandidate previews single and paired candidates and restores on cancel', async () => {
    const theme1 = makeTheme({ name: 'Theme 1', origin: '/path/1', palette: samplePalette({ background: '#111111' }) });
    const dark = makeTheme({ name: 'Dark Theme', origin: '/path/dark', palette: samplePalette({ background: '#222222' }) });
    const light = makeTheme({ name: 'Light Theme', origin: '/path/light', palette: samplePalette({ background: '#ffffff' }) });
    const candidateSingle: MirrorCandidate = { kind: 'theme', theme: theme1 };
    const candidatePair: MirrorCandidate = { kind: 'pair', dark, light };
    const candidates = [candidateSingle, candidatePair];

    const origCreateQP = vscode.window.createQuickPick;
    let interceptedQP: vscode.QuickPick<any> | undefined;
    const activeChangeListeners: ((active: readonly any[]) => any)[] = [];
    const hideListeners: (() => any)[] = [];

    (vscode.window as any).createQuickPick = function <T extends vscode.QuickPickItem>() {
      const qp = origCreateQP.call(vscode.window);
      interceptedQP = qp;

      const origOnDidChangeActive = qp.onDidChangeActive.bind(qp);
      (qp as any).onDidChangeActive = (listener: any, thisArgs?: any, disposables?: any) => {
        activeChangeListeners.push(listener);
        return origOnDidChangeActive(listener, thisArgs, disposables);
      };

      const origOnDidHide = qp.onDidHide.bind(qp);
      (qp as any).onDidHide = (listener: any, thisArgs?: any, disposables?: any) => {
        hideListeners.push(listener);
        return origOnDidHide(listener, thisArgs, disposables);
      };

      return qp;
    };

    try {
      const pickPromise = pickMirrorCandidate(ctx, candidates, 'workspace');
      assert.ok(interceptedQP, 'expected quickpick to be created');
      const qp = interceptedQP!;
      assert.strictEqual(qp.items.length, 2);

      // Arrow to first candidate (single theme)
      activeChangeListeners.forEach((fn) => fn([qp.items[0]]));
      await delay(PREVIEW_DEBOUNCE_MS + 50);

      let colors = inspectColors('workspace');
      assert.strictEqual(colors['terminal.background'], '#111111');

      // Arrow to second candidate (pair)
      activeChangeListeners.forEach((fn) => fn([qp.items[1]]));
      await delay(PREVIEW_DEBOUNCE_MS + 50);

      colors = inspectColors('workspace');
      const workbench = vscode.workspace.getConfiguration('workbench');
      const darkScope = `[${workbench.get<string>('preferredDarkColorTheme') ?? ''}]`;
      const lightScope = `[${workbench.get<string>('preferredLightColorTheme') ?? ''}]`;
      assert.ok(darkScope in colors, `expected ${darkScope} in colors`);
      assert.strictEqual(colors[darkScope]['terminal.background'], '#222222');
      assert.ok(lightScope in colors, `expected ${lightScope} in colors`);
      assert.strictEqual(colors[lightScope]['terminal.background'], '#ffffff');

      // Cancel / hide without accept
      hideListeners.forEach((fn) => fn());
      const result = await pickPromise;

      assert.strictEqual(result, undefined);
      assert.deepStrictEqual(inspectColors('workspace'), {});
    } finally {
      vscode.window.createQuickPick = origCreateQP;
    }
  });

  test('pickMirrorCandidate returns chosen candidate and stops preview on accept', async () => {
    const theme1 = makeTheme({ name: 'Theme 1', origin: '/path/1', palette: samplePalette({ background: '#111111' }) });
    const dark = makeTheme({ name: 'Dark Theme', origin: '/path/dark', palette: samplePalette({ background: '#222222' }) });
    const light = makeTheme({ name: 'Light Theme', origin: '/path/light', palette: samplePalette({ background: '#ffffff' }) });
    const candidateSingle: MirrorCandidate = { kind: 'theme', theme: theme1 };
    const candidatePair: MirrorCandidate = { kind: 'pair', dark, light };
    const candidates = [candidateSingle, candidatePair];

    const origCreateQP = vscode.window.createQuickPick;
    let interceptedQP: vscode.QuickPick<any> | undefined;
    const activeChangeListeners: ((active: readonly any[]) => any)[] = [];
    const acceptListeners: (() => any)[] = [];
    const hideListeners: (() => any)[] = [];

    (vscode.window as any).createQuickPick = function <T extends vscode.QuickPickItem>() {
      const qp = origCreateQP.call(vscode.window);
      interceptedQP = qp;

      const origOnDidChangeActive = qp.onDidChangeActive.bind(qp);
      (qp as any).onDidChangeActive = (listener: any, thisArgs?: any, disposables?: any) => {
        activeChangeListeners.push(listener);
        return origOnDidChangeActive(listener, thisArgs, disposables);
      };

      const origOnDidAccept = qp.onDidAccept.bind(qp);
      (qp as any).onDidAccept = (listener: any, thisArgs?: any, disposables?: any) => {
        acceptListeners.push(listener);
        return origOnDidAccept(listener, thisArgs, disposables);
      };

      const origOnDidHide = qp.onDidHide.bind(qp);
      (qp as any).onDidHide = (listener: any, thisArgs?: any, disposables?: any) => {
        hideListeners.push(listener);
        return origOnDidHide(listener, thisArgs, disposables);
      };

      return qp;
    };

    try {
      const pickPromise = pickMirrorCandidate(ctx, candidates, 'workspace');
      assert.ok(interceptedQP, 'expected quickpick to be created');
      const qp = interceptedQP!;

      // Arrow to first candidate
      activeChangeListeners.forEach((fn) => fn([qp.items[0]]));
      qp.selectedItems = [qp.items[0]];

      // Accept
      acceptListeners.forEach((fn) => fn());
      hideListeners.forEach((fn) => fn());

      const result = await pickPromise;
      assert.deepStrictEqual(result, candidateSingle);
    } finally {
      vscode.window.createQuickPick = origCreateQP;
    }
  });

  test('pickMirrorCandidate respects termeleon.livePreview false setting', async () => {
    const config = vscode.workspace.getConfiguration('termeleon');
    await config.update('livePreview', false, vscode.ConfigurationTarget.Global);

    const theme1 = makeTheme({ name: 'Theme 1', origin: '/path/1', palette: samplePalette({ background: '#111111' }) });
    const candidateSingle: MirrorCandidate = { kind: 'theme', theme: theme1 };
    const candidates = [candidateSingle, candidateSingle];

    const origCreateQP = vscode.window.createQuickPick;
    let interceptedQP: vscode.QuickPick<any> | undefined;
    const activeChangeListeners: ((active: readonly any[]) => any)[] = [];
    const hideListeners: (() => any)[] = [];

    (vscode.window as any).createQuickPick = function <T extends vscode.QuickPickItem>() {
      const qp = origCreateQP.call(vscode.window);
      interceptedQP = qp;

      const origOnDidChangeActive = qp.onDidChangeActive.bind(qp);
      (qp as any).onDidChangeActive = (listener: any, thisArgs?: any, disposables?: any) => {
        activeChangeListeners.push(listener);
        return origOnDidChangeActive(listener, thisArgs, disposables);
      };

      const origOnDidHide = qp.onDidHide.bind(qp);
      (qp as any).onDidHide = (listener: any, thisArgs?: any, disposables?: any) => {
        hideListeners.push(listener);
        return origOnDidHide(listener, thisArgs, disposables);
      };

      return qp;
    };

    try {
      const pickPromise = pickMirrorCandidate(ctx, candidates, 'workspace');
      assert.ok(interceptedQP, 'expected quickpick to be created');
      const qp = interceptedQP!;

      activeChangeListeners.forEach((fn) => fn([qp.items[0]]));
      await delay(PREVIEW_DEBOUNCE_MS + 50);

      assert.deepStrictEqual(inspectColors('workspace'), {});

      hideListeners.forEach((fn) => fn());
      await pickPromise;
    } finally {
      vscode.window.createQuickPick = origCreateQP;
      await config.update('livePreview', undefined, vscode.ConfigurationTarget.Global);
    }
  });
});
