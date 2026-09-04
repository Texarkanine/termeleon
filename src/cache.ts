import { DiscoveredTheme } from './palette';

/**
 * Stable cache identity for a discovery scan: `sources` order does not
 * matter; `extraDirectories` order does (walk order is load-bearing).
 */
export function cacheKey(sources: string[], extraDirs: string[]): string {
  return JSON.stringify({ sources: [...sources].sort(), extraDirs });
}

/**
 * Process-lifetime memo of discovered themes. One completed list (or
 * in-flight scan) at a time; a new key drops the previous result.
 */
export class ThemeCache {
  private currentKey: string | undefined;
  private completed: DiscoveredTheme[] | undefined;
  private inflight: Promise<DiscoveredTheme[]> | undefined;

  peek(key: string): DiscoveredTheme[] | undefined {
    if (this.currentKey !== key) {
      return undefined;
    }
    return this.completed;
  }

  load(key: string, scan: () => DiscoveredTheme[]): Promise<DiscoveredTheme[]> {
    if (this.currentKey === key && this.completed !== undefined) {
      return Promise.resolve(this.completed);
    }
    if (this.currentKey === key && this.inflight) {
      return this.inflight;
    }

    this.currentKey = key;
    this.completed = undefined;

    const pending = new Promise<DiscoveredTheme[]>((resolve, reject) => {
      setTimeout(() => {
        try {
          const list = scan();
          if (this.currentKey === key) {
            this.completed = list;
            this.inflight = undefined;
          }
          resolve(list);
        } catch (err) {
          if (this.currentKey === key) {
            this.completed = undefined;
            this.inflight = undefined;
          }
          reject(err);
        }
      }, 0);
    });

    this.inflight = pending;
    return pending;
  }
}
