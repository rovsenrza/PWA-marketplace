/**
 * Admin: import from 1C / Excel / CSV / CommerceML in five steps (file, columns, matches, photos, run)
 * over the import core (shared/import). The catalogue is the admin's CatalogStore. The import is saved
 * all or nothing: without a server everything has to fit in the browser, and a catalogue saved
 * without its photos would be worse than a clear refusal.
 */
import type { CatalogStore } from '../../../shared/data/catalog-store';
import type { Product } from '../../../shared/domain/types';
import { listArchive } from '../../../shared/import/archive';
import { layoutKey, suggestMapping } from '../../../shared/import/columns';
import { isPhotoPath, isZipName, matchPhotos } from '../../../shared/import/photos';
import { photoTargets, planImport, toDrafts } from '../../../shared/import/plan';
import { ImportReadError, readImportFiles } from '../../../shared/import/read';
import type { ImportRecord, ImportRepository } from '../../../shared/import/repository';
import type { ImportField } from '../../../shared/import/types';
import type { MediaStore } from '../../../shared/media/types';
import { registerActions } from '../../../shared/ui/actions';
import { embedPhotos, photoSources } from './photos';
import { renderStep } from './render';
import { dryRun, fresh, missingFields, reuseSet, roomForPhotos, type Step, type Wizard } from './state';

export interface ImportDeps { catalog: CatalogStore; media: MediaStore; repo: ImportRepository }

let deps: ImportDeps;
let w: Wizard;

const products = (): Record<string, Product> => deps.catalog.state.products;
const stores = (): string[] => Object.keys(deps.catalog.state.shops);
/** A new step: the whole page, with its entrance (and the nav). */
const rerender = () => window.renderAll?.();
/**
 * Inside a step (progress, a column, an answer): only the import block, without replaying the page's
 * entrance animation; nothing if the admin has already left the page.
 */
function refresh(): void {
  const host = document.querySelector('[data-import-page]');
  if (host) host.outerHTML = renderImportPage();
}

/* ---------- шаг 1: файл ---------- */

async function loadFiles(files: File[]): Promise<void> {
  if (!files.length || w.busy) return;
  w.busy = 'Читаем файл…'; w.error = ''; w.done = null; refresh();
  try {
    const inputs = await Promise.all(files.map(async (f) => ({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) })));
    const table = await readImportFiles(inputs);
    if (!table.columns.length || !table.rows.some((r) => r.some((c) => c.trim()))) throw new ImportReadError('В файле не нашлось таблицы с товарами');
    const zip = inputs.find((f) => isZipName(f.name));
    const archivePhotos = zip ? (await listArchive(zip.bytes)).filter(isPhotoPath).length : 0;
    w = { ...fresh(w.store), file: { names: files.map((f) => f.name), table, archive: zip && archivePhotos ? { name: zip.name, bytes: zip.bytes, photos: archivePhotos } : undefined } };
    const remembered = deps.repo.mapping(w.store, layoutKey(table.columns));
    w.auto = remembered ?? suggestMapping(table.columns, table.rows.slice(0, 50));
    w.mapping = [...w.auto];
    w.remembered = !!remembered;
  } catch (e) {
    w.error = e instanceof ImportReadError ? e.message : 'Не удалось прочитать файл: он повреждён или это не таблица. Сохраните выгрузку из 1С как Excel (.xlsx) или CSV и попробуйте снова.';
  }
  w.busy = '';
  refresh();
}

/* ---------- шаг 2 → 3: колонки → план ---------- */

function buildPlan(): void {
  if (!w.file) return;
  const key = JSON.stringify([w.store, w.mapping]);
  if (w.plan && w.planKey === key) return; // ничего не менялось: план и фото остаются
  const { drafts, issues } = toDrafts(w.file.table, w.mapping);
  w.drafts = drafts;
  w.issues = issues;
  w.plan = planImport(drafts, products(), w.store);
  w.planKey = key;
  /* ответы по похожим сохраняются, если строка всё ещё похожа */
  const rows = new Set(w.plan.similar.map((s) => s.draft.row));
  w.decisions = new Map([...w.decisions].filter(([row]) => rows.has(row)));
  w.photos = null;
  deps.repo.rememberMapping(w.store, layoutKey(w.file.table.columns), w.mapping);
}

/* ---------- шаг 4: фото ---------- */

async function loadPhotos(files: File[], fromArchive = false): Promise<void> {
  if (!w.plan || w.busy) return;
  w.busy = 'Читаем фото…'; w.error = ''; refresh();
  try {
    const chosen = fromArchive && w.file?.archive
      ? [{ name: w.file.archive.name, bytes: w.file.archive.bytes }]
      : await Promise.all(files.map(async (f) => (isZipName(f.name) ? { name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) } : { name: f.name, file: f })));
    const sources = await photoSources(chosen);
    if (!sources.length) throw new ImportReadError('Фото не нашлось: нужны JPG, PNG или WebP, можно в архиве .zip');
    const match = matchPhotos(sources.map((s) => s.path), photoTargets(w.plan, products(), reuseSet(w)));
    let last = 0;
    const set = await embedPhotos(sources, match, roomForPhotos(w, products()), deps.media, (done, total) => {
      if (Date.now() - last < 150 && done < total) return;
      last = Date.now();
      w.busy = `Сжимаем фото: ${done} из ${total}`;
      refresh();
    });
    w.photos = { ...set, label: chosen.length === 1 ? chosen[0].name : `${chosen.length} файлов` };
  } catch (e) {
    w.error = e instanceof ImportReadError ? e.message : 'Не удалось прочитать фото или архив';
  }
  w.busy = '';
  refresh();
}

/* ---------- шаг 5: запуск ---------- */

function run(): void {
  if (!w.plan || !w.file || w.busy) return;
  const before = deps.catalog.state.products;
  const result = dryRun(w, before);
  deps.catalog.state.products = result.products;
  const saved = deps.catalog.save(['products'], { strict: true });
  if (saved.failed.length) {
    deps.catalog.state.products = before;
    const mb = (JSON.stringify(result.products).length / 1e6).toFixed(1).replace('.', ',');
    w.error = saved.quotaExceeded
      ? `Не поместилось в память браузера: каталог после импорта занял бы около ${mb} МБ, а браузер хранит около 5 МБ на всё приложение. Ничего не изменилось. Пока нет сервера, загрузите файл частями или без фото.`
      : 'Не удалось сохранить: хранилище браузера недоступно. Ничего не изменилось.';
    refresh();
    return;
  }
  const record: ImportRecord = {
    id: `imp-${Date.now()}`, file: w.file.names.join(', '), store: w.store, source: w.file.table.source, at: Date.now(),
    rows: w.drafts.length + w.issues.length, created: result.created, updated: result.updated,
    published: result.published, withoutPhoto: result.withoutPhoto, issues: w.issues.length,
  };
  deps.repo.record(record);
  w = { ...fresh(w.store), done: record };
  rerender();
  window.scrollTo(0, 0);
  window.toast?.(`Импорт завершён: ${result.created} новых, ${result.updated} обновлено`);
}

/* ---------- переходы ---------- */

function next(): void {
  if (w.busy) return;
  if (w.step === 1 && !w.file) return;
  if (w.step === 2) {
    if (missingFields(w.mapping).length) return;
    buildPlan();
    if (!w.drafts.length) { w.error = 'В файле не нашлось ни одного товара с артикулом, названием и ценой: проверьте колонки.'; refresh(); return; }
  }
  w.error = '';
  w.step = Math.min(5, w.step + 1) as Step;
  rerender();
  window.scrollTo(0, 0);
}

function goTo(step: Step): void {
  if (w.busy || step >= w.step || step < 1) return;
  w.error = '';
  w.step = step;
  rerender();
}

const filesOf = (list: FileList | null | undefined): File[] => Array.from(list ?? []);

/** The page for the admin's PAGES.import. */
export function renderImportPage(): string {
  return `<div data-import-page>${renderStep(w, { products: products(), stores: stores(), history: deps.repo.history() }).value}</div>`;
}

/** Open the import for a store (from the overview: «товары ждут фото»). */
export function startImport(store: string): void {
  if (w.busy) return;
  w = fresh(stores().includes(store) ? store : w.store);
}

function onChange(e: Event): void {
  const el = e.target as HTMLElement;
  if (el.matches('select[data-import-store]')) {
    w.store = (el as HTMLSelectElement).value;
    if (w.file) {
      const remembered = deps.repo.mapping(w.store, layoutKey(w.file.table.columns));
      if (remembered) { w.auto = remembered; w.mapping = [...remembered]; w.remembered = true; }
    }
    refresh();
  } else if (el.matches('select[data-import-col]')) {
    const i = Number(el.dataset.importCol);
    const f = (el as HTMLSelectElement).value as ImportField;
    /* одно поле — одна колонка: прежняя колонка с этим полем пропускается */
    w.mapping = w.mapping.map((m, j) => (j === i ? f : m === f && f !== 'skip' ? 'skip' : m));
    w.error = '';
    refresh();
    document.querySelector<HTMLElement>(`select[data-import-col="${i}"]`)?.focus();
  } else if (el.matches('input[data-import-input]')) {
    const input = el as HTMLInputElement;
    const files = filesOf(input.files);
    input.value = '';
    if (input.dataset.importInput === 'photos') void loadPhotos(files); else void loadFiles(files);
  }
}

export function initImport(d: ImportDeps): void {
  deps = d;
  w = fresh(stores()[0] ?? '');
  registerActions({
    'import-next': () => next(),
    'import-back': () => goTo((w.step - 1) as Step),
    'import-step': (el) => goTo(Number(el.dataset.step) as Step),
    'import-replace-file': () => { if (!w.busy) { w = fresh(w.store); refresh(); } },
    'import-replace-photos': () => { if (!w.busy) { w.photos = null; refresh(); } },
    'import-archive-photos': () => void loadPhotos([], true),
    'import-similar': (el) => { w.decisions.set(Number(el.dataset.row), el.dataset.answer === 'yes' ? 'yes' : 'no'); refresh(); },
    'import-similar-all': () => { w.plan?.similar.forEach((s) => w.decisions.set(s.draft.row, 'yes')); refresh(); },
    'import-run': () => run(),
    'import-show-products': () => window.showStoreProducts?.(w.done?.store ?? w.store, w.done?.withoutPhoto ? 'nophoto' : 'all'),
  });
  document.addEventListener('change', onChange);
  /* перетаскивание на зону загрузки */
  const zone = (e: Event) => (e.target as Element | null)?.closest?.<HTMLElement>('[data-import-drop]') ?? null;
  document.addEventListener('dragover', (e) => { const z = zone(e); if (z) { e.preventDefault(); z.classList.add('over'); } });
  document.addEventListener('dragleave', (e) => zone(e)?.classList.remove('over'));
  document.addEventListener('drop', (e) => {
    const z = zone(e);
    if (!z) return;
    e.preventDefault();
    z.classList.remove('over');
    const files = filesOf(e.dataTransfer?.files);
    if (z.dataset.importDrop === 'photos') void loadPhotos(files); else void loadFiles(files);
  });
  /* зона загрузки с клавиатуры: Enter или пробел открывают выбор файла */
  document.addEventListener('keydown', (e) => {
    const z = (e.target as Element | null)?.closest?.<HTMLElement>('[data-import-drop]');
    if (!z || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    z.querySelector<HTMLInputElement>('input[type=file]')?.click();
  });
}
