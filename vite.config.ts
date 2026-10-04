import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformWithEsbuild } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));
const pages = { index: resolve(root, 'index.html'), admin: resolve(root, 'admin.html') };

/**
 * Legacy classic scripts (src/** /legacy/*.js). They aren't ES modules: their top-level functions
 * must stay global, because the markup's inline handlers call them. Vite only bundles type="module",
 * so this plugin:
 *  - in dev changes nothing (the server serves the files as they are);
 *  - in the build collapses whitespace (without renaming identifiers), hashes the name,
 *    writes the result to assets/legacy/ and rewrites src in the HTML.
 * Order and placement of the tags are kept, and with them the execution semantics.
 */
function legacyScripts(): Plugin {
  const TAG = /<script src="\/(src\/[^"]+\/legacy\/[^"]+\.js)"><\/script>/g;
  const emitted = new Map<string, string>(); // src/... → assets/legacy/name-hash.js
  let config: ResolvedConfig;
  return {
    name: 'legacy-scripts',
    apply: 'build',
    configResolved(c) { config = c; },
    async buildStart() {
      const srcs = new Set<string>();
      for (const file of Object.values(pages)) {
        for (const m of readFileSync(file, 'utf8').matchAll(TAG)) srcs.add(m[1]);
      }
      for (const rel of srcs) {
        const code = readFileSync(resolve(root, rel), 'utf8');
        const out = await transformWithEsbuild(code, rel, {
          loader: 'js', minifyWhitespace: true, minifySyntax: false, minifyIdentifiers: false,
          charset: 'utf8', legalComments: 'none', target: 'es2020',
        });
        const hash = createHash('sha256').update(out.code).digest('hex').slice(0, 8);
        const fileName = `assets/legacy/${basename(rel, '.js')}-${hash}.js`;
        this.emitFile({ type: 'asset', fileName, source: out.code });
        emitted.set(rel, fileName);
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(TAG, (_, rel: string) => {
          const fileName = emitted.get(rel);
          if (!fileName) throw new Error(`legacy-scripts: ${rel} was not built`);
          return `<script vite-ignore src="${config.base}${fileName}"></script>`;
        });
      },
    },
  };
}

/** Service worker: fills the src/sw/sw.js template with the build id and the list of hashed files. */
function serviceWorker(): Plugin {
  return {
    name: 'service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter((f) => /\.(js|css)$/.test(f) && !f.endsWith('.map'));
      const precache = ['./', './index.html', './manifest.json', './icons/icon-192.png', ...files.map((f) => `./${f}`)];
      const buildId = createHash('sha256').update(files.sort().join('|')).digest('hex').slice(0, 10);
      const source = readFileSync(resolve(root, 'src/sw/sw.js'), 'utf8')
        .replaceAll('__BUILD_ID__', buildId)
        .replaceAll('__PRECACHE__', JSON.stringify(precache, null, 2));
      if (/__[A-Z_]+__/.test(source)) this.error('service-worker: the template has unfilled placeholders');
      this.emitFile({ type: 'asset', fileName: 'sw.js', source });
    },
  };
}

export default defineConfig({
  /* относительные пути: сборку можно положить в любую папку любого статического хостинга */
  base: './',
  plugins: [legacyScripts(), serviceWorker()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: { input: pages },
  },
  server: { port: 5173 },
});
