/// <reference types="vitest/config" />
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { cacheVersion, precacheList, serviceWorkerSource, SW_FILE, type BuiltFile } from './src/pwa/serviceWorker';

/** Files in public/ (copied as they are), relative to it. */
function publicFiles(dir: string, base = ''): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? publicFiles(path.join(dir, e.name), `${base}${e.name}/`) : [`${base}${e.name}`],
  );
}

/** App und offline: writes sw.js with the list of every built file (see src/pwa/serviceWorker.ts). */
function sylareadsPwa(): Plugin {
  return {
    name: 'sylareads-pwa',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files: BuiltFile[] = Object.values(bundle).map((f) => ({
        name: f.fileName,
        firebase: f.type === 'chunk' && f.moduleIds.some((id) => /node_modules[\\/](@firebase|firebase)[\\/]/.test(id)),
      }));
      for (const name of publicFiles(fileURLToPath(new URL('./public', import.meta.url)))) files.push({ name });
      const list = precacheList(files);
      this.emitFile({ type: 'asset', fileName: SW_FILE, source: serviceWorkerSource(list, cacheVersion(list)) });
    },
  };
}

// `base: './'` keeps every asset path relative, so the build works on
// GitHub Pages under any repository name (https://user.github.io/<repo>/).
// Routing uses the URL hash, so no server-side fallback is needed.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react(), sylareadsPwa()],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    target: 'es2020',
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
