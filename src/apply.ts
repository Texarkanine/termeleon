import * as vscode from 'vscode';
import { Palette, ApplySnapshot, toColorCustomizations, managedKeys, mergeColors, mergePairedColors, preferredPairScopes, stripOwnedKeys, restoreApplySnapshot } from './palette';

export type Target = 'global' | 'workspace';

const SECTION = 'workbench';
const KEY = 'colorCustomizations';
const OWNED_STATE = 'terminalThemeImport.ownedKeys';

export interface ApplyOptions {
  target: Target;
  /** Nest the colors under `[Active Theme Name]` instead of writing them flat. */
  scopeToActiveTheme: boolean;
  includeSelectionForeground: boolean;
  setMinimumContrastRatio: boolean;
}

function configTarget(t: Target): vscode.ConfigurationTarget {
  return t === 'global'
    ? vscode.ConfigurationTarget.Global
    : vscode.ConfigurationTarget.Workspace;
}

/** Reads the value written at exactly one target, not the merged result. */
function readAt(target: Target): Record<string, any> {
  const inspected = vscode.workspace.getConfiguration(SECTION).inspect<Record<string, any>>(KEY);
  const raw = target === 'global' ? inspected?.globalValue : inspected?.workspaceValue;
  return raw ? JSON.parse(JSON.stringify(raw)) : {};
}

function readContrastRatioAt(target: Target): number | undefined {
  const inspected = vscode.workspace.getConfiguration('terminal.integrated')
    .inspect<number>('minimumContrastRatio');
  return target === 'global' ? inspected?.globalValue : inspected?.workspaceValue;
}

async function writeContrastRatioAt(target: Target, value: number | undefined): Promise<void> {
  await vscode.workspace.getConfiguration('terminal.integrated')
    .update('minimumContrastRatio', value, configTarget(target));
}

function activeThemeName(): string | undefined {
  return vscode.workspace.getConfiguration('workbench').get<string>('colorTheme');
}

export function ownedKeys(ctx: vscode.ExtensionContext, target: Target): string[] {
  const store = target === 'global' ? ctx.globalState : ctx.workspaceState;
  return store.get<string[]>(OWNED_STATE) ?? [];
}

async function setOwnedKeys(ctx: vscode.ExtensionContext, target: Target, keys: string[]) {
  const store = target === 'global' ? ctx.globalState : ctx.workspaceState;
  await store.update(OWNED_STATE, keys);
}

/**
 * Merges a palette into workbench.colorCustomizations at the given target.
 *
 * Only the terminal keys this palette provides are touched. Anything else the
 * user has in colorCustomizations is preserved, including terminal keys they
 * set by hand that this palette does not define.
 */
export async function applyPalette(
  ctx: vscode.ExtensionContext,
  palette: Palette,
  opts: ApplyOptions,
): Promise<void> {
  const colors = toColorCustomizations(palette, {
    includeSelectionForeground: opts.includeSelectionForeground,
  });

  const current = stripOwnedKeys(readAt(opts.target), ownedKeys(ctx, opts.target));
  const scopeKey = opts.scopeToActiveTheme ? `[${activeThemeName()}]` : undefined;
  const { next, ownedKeys: owned } = mergeColors(current, colors, scopeKey);

  const config = vscode.workspace.getConfiguration(SECTION);
  await config.update(KEY, next, configTarget(opts.target));

  await setOwnedKeys(ctx, opts.target, owned);

  if (opts.setMinimumContrastRatio) {
    // Without this, VS Code nudges foreground colors toward a contrast target
    // and the applied palette does not render as authored.
    await writeContrastRatioAt(opts.target, 1);
  }
}

/**
 * Writes a Ghostty dark/light pair under the user's preferred dark and light
 * workbench themes so `window.autoDetectColorScheme` can switch them.
 *
 * Ignores `scopeToActiveTheme`: the pair is already scoped.
 */
export async function applyPalettePair(
  ctx: vscode.ExtensionContext,
  dark: Palette,
  light: Palette,
  opts: ApplyOptions,
): Promise<void> {
  const mapping = { includeSelectionForeground: opts.includeSelectionForeground };
  const darkColors = toColorCustomizations(dark, mapping);
  const lightColors = toColorCustomizations(light, mapping);

  const workbench = vscode.workspace.getConfiguration('workbench');
  const { darkScope, lightScope } = preferredPairScopes(
    (key) => workbench.get<string>(key),
  );

  const stripped = stripOwnedKeys(readAt(opts.target), ownedKeys(ctx, opts.target));
  const { next, ownedKeys: owned } = mergePairedColors(
    stripped, darkColors, lightColors, darkScope, lightScope,
  );

  const config = vscode.workspace.getConfiguration(SECTION);
  await config.update(KEY, next, configTarget(opts.target));
  await setOwnedKeys(ctx, opts.target, owned);

  if (opts.setMinimumContrastRatio) {
    await writeContrastRatioAt(opts.target, 1);
  }
}

/** Restores a previously captured raw colorCustomizations value verbatim. */
export async function restoreSnapshot(
  target: Target,
  snapshot: Record<string, any> | undefined,
): Promise<void> {
  const config = vscode.workspace.getConfiguration(SECTION);
  const value = snapshot && Object.keys(snapshot).length ? snapshot : undefined;
  await config.update(KEY, value, configTarget(target));
}

export function snapshot(target: Target): Record<string, any> {
  return readAt(target);
}

export function snapshotApply(ctx: vscode.ExtensionContext, target: Target): ApplySnapshot {
  return {
    colors: snapshot(target),
    ownedKeys: ownedKeys(ctx, target),
    minimumContrastRatio: readContrastRatioAt(target),
  };
}

export async function restoreApply(
  ctx: vscode.ExtensionContext,
  target: Target,
  captured: ApplySnapshot,
): Promise<void> {
  const restored = restoreApplySnapshot(captured);
  await restoreSnapshot(target, restored.colors);
  await setOwnedKeys(ctx, target, restored.ownedKeys);
  await writeContrastRatioAt(target, restored.minimumContrastRatio);
}

export interface RemoveResult {
  removed: number;
  usedFallback: boolean;
}

/**
 * Removes what this extension wrote, and nothing else.
 *
 * The tracked key list is the good path. If state was lost (new machine,
 * cleared storage) we fall back to the full set of terminal keys, which the
 * caller is expected to confirm first since it may catch manual edits.
 */
export async function removeApplied(
  ctx: vscode.ExtensionContext,
  target: Target,
  allowFallback: boolean,
): Promise<RemoveResult> {
  let keys = ownedKeys(ctx, target);
  let usedFallback = false;

  if (keys.length === 0) {
    if (!allowFallback) { return { removed: 0, usedFallback: false }; }
    keys = managedKeys();
    usedFallback = true;
  }

  const current = readAt(target);
  let removed = 0;

  for (const key of keys) {
    const scoped = /^(\[[^\]]+\])\.(.+)$/.exec(key);
    if (scoped) {
      const [, scope, inner] = scoped;
      if (current[scope] && inner in current[scope]) {
        delete current[scope][inner];
        removed++;
        if (Object.keys(current[scope]).length === 0) { delete current[scope]; }
      }
    } else if (key in current) {
      delete current[key];
      removed++;
    } else if (usedFallback) {
      // In fallback mode also sweep inside every theme-scoped block.
      for (const k of Object.keys(current)) {
        if (k.startsWith('[') && current[k] && key in current[k]) {
          delete current[k][key];
          removed++;
          if (Object.keys(current[k]).length === 0) { delete current[k]; }
        }
      }
    }
  }

  await restoreSnapshot(target, current);
  await setOwnedKeys(ctx, target, []);

  if (readContrastRatioAt(target) === 1) {
    await writeContrastRatioAt(target, undefined);
  }

  return { removed, usedFallback };
}

/** Delay before a live-preview apply, matching the picker's arrow-key debounce. */
export const PREVIEW_DEBOUNCE_MS = 120;

/**
 * Snapshot-and-restore session used by the theme picker while live preview is on.
 * `schedule` debounces real writes; `cancel` restores the pre-session snapshot.
 */
export class LivePreview {
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly original: ApplySnapshot;

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly opts: ApplyOptions,
  ) {
    this.original = snapshotApply(ctx, opts.target);
  }

  schedule(palette: Palette): void {
    if (this.timer) { clearTimeout(this.timer); }
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void applyPalette(this.ctx, palette, this.opts);
    }, PREVIEW_DEBOUNCE_MS);
  }

  /** Drops a pending preview write without restoring the snapshot (accept path). */
  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  async cancel(): Promise<void> {
    this.stop();
    await restoreApply(this.ctx, this.opts.target, this.original);
  }
}
