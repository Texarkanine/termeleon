import * as assert from 'assert';

import { cacheKey, ThemeCache } from '../src/cache';
import { DiscoveredTheme } from '../src/palette';

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`FAIL  ${name}\n      ${(err as Error).message}`);
    process.exitCode = 1;
  }
}

function theme(name: string): DiscoveredTheme {
  return {
    name,
    source: 'ghostty',
    origin: `/tmp/${name}`,
    active: false,
    palette: { ansi: [] },
  };
}

console.log('\ntheme cache');

async function run() {
  await test('first load invokes scan once and returns its list', async () => {
    const list = [theme('one')];
    let calls = 0;
    const cache = new ThemeCache();
    const key = cacheKey(['ghostty'], []);
    const got = await cache.load(key, () => {
      calls += 1;
      return list;
    });
    assert.strictEqual(calls, 1);
    assert.deepStrictEqual(got, list);
  });

  await test('second load with the same key does not invoke scan', async () => {
    const list = [theme('one')];
    let calls = 0;
    const cache = new ThemeCache();
    const key = cacheKey(['ghostty'], []);
    const scan = () => {
      calls += 1;
      return list;
    };
    await cache.load(key, scan);
    const got = await cache.load(key, scan);
    assert.strictEqual(calls, 1);
    assert.deepStrictEqual(got, list);
  });

  await test('concurrent load with the same key coalesces to one scan', async () => {
    const list = [theme('one')];
    let calls = 0;
    const cache = new ThemeCache();
    const key = cacheKey(['ghostty'], []);
    const scan = () => {
      calls += 1;
      return list;
    };
    const first = cache.load(key, scan);
    const second = cache.load(key, scan);
    const [a, b] = await Promise.all([first, second]);
    assert.strictEqual(calls, 1);
    assert.deepStrictEqual(a, list);
    assert.deepStrictEqual(b, list);
  });

  await test('load with a different key invokes scan again and peek of the old key is empty', async () => {
    const firstList = [theme('one')];
    const secondList = [theme('two')];
    let calls = 0;
    const cache = new ThemeCache();
    const oldKey = cacheKey(['ghostty'], []);
    const newKey = cacheKey(['kitty'], []);
    await cache.load(oldKey, () => {
      calls += 1;
      return firstList;
    });
    const got = await cache.load(newKey, () => {
      calls += 1;
      return secondList;
    });
    assert.strictEqual(calls, 2);
    assert.deepStrictEqual(got, secondList);
    assert.strictEqual(cache.peek(oldKey), undefined);
    assert.deepStrictEqual(cache.peek(newKey), secondList);
  });

  await test('peek is undefined until the first load completes', async () => {
    const list = [theme('one')];
    const cache = new ThemeCache();
    const key = cacheKey(['ghostty'], []);
    const pending = cache.load(key, () => list);
    assert.strictEqual(cache.peek(key), undefined);
    const got = await pending;
    assert.deepStrictEqual(got, list);
    assert.deepStrictEqual(cache.peek(key), list);
  });

  await test('failed scan rejects; a later load with the same key retries', async () => {
    const list = [theme('one')];
    let calls = 0;
    const cache = new ThemeCache();
    const key = cacheKey(['ghostty'], []);
    const scan = () => {
      calls += 1;
      if (calls === 1) {
        throw new Error('scan failed');
      }
      return list;
    };
    await assert.rejects(() => cache.load(key, scan), /scan failed/);
    const got = await cache.load(key, scan);
    assert.strictEqual(calls, 2);
    assert.deepStrictEqual(got, list);
  });

  await test('cacheKey: equal sources in different order share a key', () => {
    assert.strictEqual(
      cacheKey(['kitty', 'ghostty'], ['/themes']),
      cacheKey(['ghostty', 'kitty'], ['/themes']),
    );
  });

  await test('cacheKey: equal extraDirectories in different order do not share a key', () => {
    assert.notStrictEqual(
      cacheKey(['ghostty'], ['/a', '/b']),
      cacheKey(['ghostty'], ['/b', '/a']),
    );
  });

  console.log(`\n${passed} passed\n`);
}

run();
