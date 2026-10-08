import { describe, expect, it } from 'vitest';
import { installWay } from './pwaStore';
import { cacheVersion, precacheList, serviceWorkerSource, SW_FILE } from './serviceWorker';

describe('app und offline', () => {
  const files = [
    { name: 'assets/index-abc.js' },
    { name: 'assets/index-abc.css' },
    { name: 'assets/index.esm-xyz.js', firebase: true },
    { name: 'assets/noto-sans-bengali-400.woff' },
    { name: 'assets/noto-sans-bengali-400.woff2' },
    { name: 'assets/index-abc.js.map' },
    { name: SW_FILE },
    { name: 'manifest.webmanifest' },
    { name: 'icons/icon-192.png' },
    { name: 'assets/index-abc.js' },
  ];

  it('precaches every built file except Firebase, old .woff fonts, maps and the worker itself', () => {
    expect(precacheList(files)).toEqual([
      'assets/index-abc.css',
      'assets/index-abc.js',
      'assets/noto-sans-bengali-400.woff2',
      'icons/icon-192.png',
      'index.html',
      'manifest.webmanifest',
    ]);
  });

  it('the version changes with the file names and only then', () => {
    const list = precacheList(files);
    expect(cacheVersion(list)).toBe(cacheVersion([...list]));
    expect(cacheVersion(list)).not.toBe(cacheVersion(list.map((f) => f.replace('abc', 'abd'))));
  });

  it('the worker source carries the list and the version and is valid JavaScript', () => {
    const list = precacheList(files);
    const src = serviceWorkerSource(list, 'v1');
    expect(src).toContain(JSON.stringify(list));
    expect(src).toContain('"v1"');
    expect(() => new Function(src)).not.toThrow();
  });

  it('install: installed app, browser prompt, iPhone instructions or the browser menu', () => {
    expect(installWay({ standalone: true, promptEvent: null }, true)).toBe('installed');
    expect(installWay({ standalone: false, promptEvent: {} as never }, false)).toBe('prompt');
    expect(installWay({ standalone: false, promptEvent: null }, true)).toBe('ios');
    expect(installWay({ standalone: false, promptEvent: null }, false)).toBe('menu');
  });
});
