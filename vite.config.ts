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
function legacyScripts(bundles: Record<string, string> = {}): Plugin {
  const TAG = /<script src="\/(src\/[^"]+\/legacy\/[^"]+\.js)"><\/script>/g;
  /* consecutive tags of one directory from `bundles` are joined into one file */
  const RUN = new RegExp(`(?:[ \\t]*<script src="\\/(?:${Object.keys(bundles).map((d) => d.replace(/[/.]/g, '\\$&')).join('|') || '(?!)'})[^"]+\\.js"><\\/script>\\s*)+`, 'g');
  const emitted = new Map<string, string>(); // src/... or bundle name → assets/legacy/name-hash.js
  let config: ResolvedConfig;
  const bundleOf = (rel: string) => Object.entries(bundles).find(([dir]) => rel.startsWith(dir))?.[1];
  const minify = async (code: string, rel: string) => (await transformWithEsbuild(code, rel, {
    loader: 'js', minifyWhitespace: true, minifySyntax: false, minifyIdentifiers: false,
    charset: 'utf8', legalComments: 'none', target: 'es2020',
  })).code;
  return {
    name: 'legacy-scripts',
    apply: 'build',
    configResolved(c) { config = c; },
    async buildStart() {
      const srcs: string[] = [];
      for (const file of Object.values(pages)) {
        for (const m of readFileSync(file, 'utf8').matchAll(TAG)) if (!srcs.includes(m[1])) srcs.push(m[1]);
      }
      const emit = (name: string, code: string) => {
        const hash = createHash('sha256').update(code).digest('hex').slice(0, 8);
        const fileName = `assets/legacy/${name}-${hash}.js`;
        this.emitFile({ type: 'asset', fileName, source: code });
        return fileName;
      };
      const groups = new Map<string, string[]>();
      for (const rel of srcs) {
        const b = bundleOf(rel);
        if (b) { groups.set(b, [...(groups.get(b) ?? []), rel]); continue; }
        emitted.set(rel, emit(basename(rel, '.js'), await minify(readFileSync(resolve(root, rel), 'utf8'), rel)));
      }
      /* ';' between files so the end of one file can't merge with the start of the next */
      for (const [name, rels] of groups) {
        const code = rels.map((rel) => readFileSync(resolve(root, rel), 'utf8')).join('\n;\n');
        emitted.set(name, emit(name, await minify(code, `${name}.js`)));
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        html = html.replace(RUN, (run) => {
          const first = /src="\/([^"]+)"/.exec(run)![1];
          const name = bundleOf(first)!;
          return `<script vite-ignore src="${config.base}${emitted.get(name)}"></script>\n`;
        });
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
  plugins: [legacyScripts({ 'src/app/legacy/core/': 'app-core', 'src/app/legacy/features/': 'app-features' }), serviceWorker()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: { input: pages },
  },
  server: { port: 5173 },
});
