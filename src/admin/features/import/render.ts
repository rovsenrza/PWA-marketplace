/**
 * The import screens. Everything from the file (column names, values, titles) and from the catalogue
 * goes through html`…`: an export or a neighbour store's product can't inject markup.
 */
import type { Product } from '../../../shared/domain/types';
import { photoTargets } from '../../../shared/import/plan';
import type { ImportRecord } from '../../../shared/import/repository';
import { IMPORT_FIELD_LABELS, ISSUE_LABELS, type ImportField, type ImportTable } from '../../../shared/import/types';
import { html, raw, type SafeHtml } from '../../../shared/ui/html';
import { dataRows, dryRun, missingFields, reuseSet, sizeEstimate, type Wizard } from './state';

export interface RenderContext { products: Record<string, Product>; stores: string[]; history: ImportRecord[] }

const ico = (name: string, cls = '') => raw(`<svg class="ico ${cls}"><use href="#i-${name}"/></svg>`);
const n = (x: number) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
function plural(x: number, one: string, few: string, many: string): string {
  const d = x % 10;
  const h = x % 100;
  return d === 1 && h !== 11 ? one : d >= 2 && d <= 4 && (h < 12 || h > 14) ? few : many;
}
/** The admin's thumbnail (with a placeholder when the photo doesn't load). */
const thumb = (src: string | undefined) => raw((window.thumb as ((s: string) => string) | undefined)?.(src ?? '') ?? '');
const skuKey = (sku: string) => sku.trim().toLowerCase();
const clip = (s: string, max = 60) => (s.length > max ? `${s.slice(0, max)}…` : s);

const FIELD_ORDER: ImportField[] = ['skip', 'sku', 'title', 'price', 'oldPrice', 'stock', 'unit', 'category', 'brand', 'barcode', 'weight', 'desc', 'image'];
const STEP_NAMES = ['Файл', 'Колонки', 'Совпадения', 'Фото', 'Запуск'];

const errorNote = (msg: string) => (msg ? html`<div class="note warn" style="margin-top:14px" role="alert">${ico('alert')}<div>${msg}</div></div>` : '');
const busyZone = (text: string) => html`<div class="drop" aria-busy="true">${ico('clock')}<b>${text}</b><span>Не закрывайте страницу</span></div>`;
const foot = (back: boolean, next: SafeHtml | string) => html`
  <div class="wizard-foot">${back ? html`<button class="btn btn-secondary" data-action="import-back">Назад</button>` : ''}<span class="sp"></span>${next}</div>`;
const nextButton = (label: string, enabled: boolean, action = 'import-next') => html`
  <button class="btn btn-primary btn-lg" data-action="${action}"${enabled ? '' : raw(' disabled')}>${label} ${action === 'import-next' ? ico('arrow') : ''}</button>`;

function dropZone(kind: 'file' | 'photos'): SafeHtml {
  return kind === 'file'
    ? html`<label class="drop" data-import-drop="file" tabindex="0" role="button">${ico('upload')}<b>Перетащите файл или нажмите, чтобы выбрать</b><span>Выгрузка из 1С, Excel (.xlsx, .xls), .csv или CommerceML (.xml, .zip)</span>
        <input type="file" accept=".xlsx,.xls,.csv,.txt,.xml,.zip" multiple hidden data-import-input="file"></label>`
    : html`<label class="drop" data-import-drop="photos" tabindex="0" role="button">${ico('image')}<b>Фото или архив с фото (.zip)</b><span>Имя файла = артикул товара · JPG, PNG или WebP</span>
        <input type="file" accept=".zip,image/jpeg,image/png,image/webp" multiple hidden data-import-input="photos"></label>`;
}

function sourceLabel(t: ImportTable): string {
  if (t.source === 'commerceml') return 'CommerceML (обмен 1С с сайтом)';
  if (t.source === 'excel') return t.sheet ? `Excel, лист «${t.sheet}»` : 'Excel';
  return `CSV, ${t.encoding === 'windows-1251' ? 'Windows-1251' : 'UTF-8'}`;
}

function stepper(w: Wizard): SafeHtml {
  return html`<div class="steps">${STEP_NAMES.map((name, i) => {
    const s = i + 1;
    const done = s < w.step;
    return html`<button class="step${s === w.step ? ' on' : done ? ' done' : ''}"${done ? raw(` data-action="import-step" data-step="${s}"`) : ''}${s === w.step ? raw(' aria-current="step"') : ''}><i>${done ? ico('check', 'ico-sm') : s}</i>${name}</button>`;
  })}</div>`;
}

/* ---------- 1. Файл ---------- */

const dateLabel = (at: number) => new Date(at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

function history(list: ImportRecord[]): SafeHtml {
  const rows = list.map((h) => html`
    <div class="lrow cols-imports">
      <div class="cell-main"><div class="thumb thumb-empty">${ico('file')}</div><div style="min-width:0"><b>${h.file}</b><span>${h.store} · ${dateLabel(h.at)}</span></div></div>
      <div class="num hide-m">${n(h.rows)} ${plural(h.rows, 'строка', 'строки', 'строк')}</div>
      <div class="num hide-m">${n(h.created)} новых · ${n(h.updated)} обновлено</div>
      <div>${h.withoutPhoto ? html`<span class="badge b-bad">${n(h.withoutPhoto)} без фото</span>` : html`<span class="badge b-ok">Готово</span>`}</div>
    </div>`);
  return html`<div class="list"><div class="card-head"><h3>Прошлые загрузки</h3></div>${rows.length ? rows : html`<div class="empty"><b>Загрузок ещё не было</b>Здесь появятся файл, магазин и сколько товаров добавлено и обновлено</div>`}</div>`;
}

function doneNote(r: ImportRecord): SafeHtml {
  const newPublished = r.created - r.withoutPhoto;
  const gotPhotos = r.published - newPublished; // черновики прошлых загрузок, получившие фото
  const parts = [
    `Новых товаров: ${n(r.created)}${r.created ? ` (в каталоге сразу — ${n(newPublished)}, без фото — ${n(r.withoutPhoto)})` : ''}.`,
    gotPhotos > 0 ? `Получили фото и появились в каталоге: ${n(gotPhotos)}.` : '',
    r.updated ? `Обновлены цена и остаток: ${n(r.updated)}.` : '',
    r.issues ? `Пропущено строк с ошибками: ${n(r.issues)}.` : '',
  ].filter(Boolean).join(' ');
  return html`<div class="note" style="margin-bottom:16px" role="status">${ico('check')}<div>
    <b>Импорт для «${r.store}» завершён.</b> ${parts}
    <button class="btn btn-ghost btn-sm" data-action="import-show-products">Открыть товары магазина</button></div></div>`;
}

function step1(w: Wizard, ctx: RenderContext): SafeHtml {
  const t = w.file?.table;
  const file = w.busy ? busyZone(w.busy) : w.file && t
    ? html`<div class="file-pill">${ico('file')}<div style="flex:1;min-width:0"><b>${w.file.names.join(', ')}</b><span>${n(dataRows(t))} ${plural(dataRows(t), 'строка', 'строки', 'строк')} · ${t.columns.length} ${plural(t.columns.length, 'колонка', 'колонки', 'колонок')} · ${sourceLabel(t)}</span></div><button class="btn btn-ghost" data-action="import-replace-file">Заменить</button></div>`
    : dropZone('file');
  return html`
    ${w.done ? doneNote(w.done) : ''}
    <div class="card card-pad" style="margin-bottom:16px">
      <div class="row2" style="align-items:end">
        <label class="field"><span>Для какого магазина загружаем</span>
          <select class="select" data-import-store>${ctx.stores.map((s) => html`<option${s === w.store ? raw(' selected') : ''}>${s}</option>`)}</select></label>
        <div class="field"><span class="demo-tag">${ico('info', 'ico-sm')}Файл читается в браузере и не уходит на сервер</span></div>
      </div>
      ${file}
      ${errorNote(w.error)}
      <div class="note" style="margin-top:14px">${ico('info')}<div>Как выгрузить из 1С: <b>Номенклатура → Ещё → Вывести список → Сохранить как Excel</b>. Подойдёт и «Обмен с сайтом» (CommerceML): выберите import.xml и offers.xml вместе или zip-архив выгрузки. Нужны хотя бы артикул, название и цена. Фото можно добавить на следующих шагах.</div></div>
      ${foot(false, nextButton('Дальше: колонки', !!w.file && !w.busy))}
    </div>
    ${history(ctx.history)}`;
}

/* ---------- 2. Колонки ---------- */

function step2(w: Wizard): SafeHtml {
  const t = w.file!.table;
  const missing = missingFields(w.mapping);
  const sample = (i: number) => t.rows.slice(0, 50).map((r) => (r[i] ?? '').trim()).find(Boolean) ?? '';
  const rows = t.columns.map((col, i) => {
    const f = w.mapping[i] ?? 'skip';
    const badge = f === 'skip'
      ? html`<span class="badge b-off">Пропустим</span>`
      : f === w.auto[i]
        ? html`<span class="badge ${w.remembered ? 'b-ok' : 'b-info'}">${w.remembered ? 'Как в прошлый раз' : 'Распознано'}</span>`
        : html`<span class="badge b-info">Выбрано</span>`;
    const s = sample(i);
    const name = col.trim() || `Колонка ${i + 1}`;
    return html`
      <div class="map-row">
        <div class="map-src"><b>${name}</b><span>${s ? `например: ${clip(s)}` : 'пусто в первых строках'}</span></div>
        <div class="arrow">${ico('arrow')}</div>
        <select class="select" data-import-col="${i}" aria-label="Поле для колонки «${name}»">${FIELD_ORDER.map((v) => html`<option value="${v}"${v === f ? raw(' selected') : ''}>${IMPORT_FIELD_LABELS[v]}</option>`)}</select>
        <div>${badge}</div>
      </div>`;
  });
  return html`
    <p class="lead">${w.remembered
      ? html`Колонки файла <b>${w.file!.names.join(', ')}</b> разложены как в прошлый раз для «${w.store}». Проверьте и нажмите «Дальше».`
      : html`Мы прочитали файл <b>${w.file!.names.join(', ')}</b>. Проверьте, какая колонка что означает — система запомнит это для «${w.store}», и в следующий раз загрузка пройдёт в один клик.`}</p>
    <div class="list">
      <div class="map-row head"><div>Колонка в файле</div><div></div><div>Поле в приложении</div><div></div></div>
      ${rows}
    </div>
    ${missing.length ? html`<div class="note warn" style="margin-top:14px">${ico('alert')}<div>Укажите ${missing.length > 1 ? 'колонки' : 'колонку'}: <b>${missing.map((f) => IMPORT_FIELD_LABELS[f]).join(', ')}</b>. Без артикула, названия и цены товар не загрузить и не узнать при следующей выгрузке.</div></div>` : ''}
    ${errorNote(w.error)}
    ${foot(true, nextButton('Дальше: совпадения', !missing.length))}`;
}

/* ---------- 3. Совпадения ---------- */

function step3(w: Wizard, ctx: RenderContext): SafeHtml {
  const plan = w.plan!;
  const rowWord = w.file!.table.source === 'commerceml' ? 'Товар' : 'Строка';
  const sum: SafeHtml[] = [];
  if (plan.update.length) sum.push(html`<div><b>${n(plan.update.length)}</b><span>уже есть у «${plan.store}»: обновим только цену и остаток</span></div>`);
  if (plan.unchanged.length) sum.push(html`<div><b>${n(plan.unchanged.length)}</b><span>уже есть, цена и остаток не изменились</span></div>`);
  sum.push(html`<div><b>${n(plan.create.length)}</b><span>${plural(plan.create.length, 'новый товар', 'новых товара', 'новых товаров')}</span>${plan.create.length ? html`<button class="btn btn-ghost btn-sm" data-action="import-next">К фото</button>` : ''}</div>`);
  if (plan.similar.length) sum.push(html`<div><b>${n(plan.similar.length)}</b><span>похожи на товары других магазинов (тот же штрихкод): можно взять их фото и описание — подтвердите ниже</span></div>`);
  if (w.issues.length) sum.push(html`<div class="warn"><b>${n(w.issues.length)}</b><span>${plural(w.issues.length, 'строку', 'строки', 'строк')} пропустим из-за ошибок — список ниже</span></div>`);

  const SHOW = 50;
  const similar = plan.similar.slice(0, SHOW).map((s) => {
    const twin = ctx.products[s.productId];
    const d = w.decisions.get(s.draft.row);
    const answer = (a: 'yes' | 'no', label: string, cls: string) => html`<button class="btn btn-sm ${cls}" data-action="import-similar" data-row="${s.draft.row}" data-answer="${a}">${label}</button>`;
    return html`
      <div class="match-row">
        <div class="from"><b>${s.draft.title}</b><span>в файле · арт. ${s.draft.sku}</span></div>
        <div class="to">${thumb(twin?.image)}<div><b>${twin?.title ?? ''}</b><span>${s.store}${twin?.barcode ? ` · штрихкод ${String(twin.barcode)}` : ''}</span></div></div>
        <div class="match-actions">${d
          ? html`<span class="badge ${d === 'yes' ? 'b-info' : 'b-off'}">${d === 'yes' ? 'Возьмём фото и описание' : 'Свой товар'}</span>${answer(d === 'yes' ? 'no' : 'yes', 'Изменить', 'btn-ghost')}`
          : html`${answer('no', 'Это другой', 'btn-secondary')}${answer('yes', 'Это он', 'btn-primary')}`}</div>
      </div>`;
  });
  const updates = plan.update.slice(0, 10).map((u) => html`
    <div class="imp-row"><b>${u.draft.sku}</b><span>${clip(u.draft.title)}</span><span class="num">${u.price ? `${u.price[0]} → ${u.price[1]}` : ''}${u.price && u.stock ? ' · ' : ''}${u.stock ? `остаток ${u.stock[0] ?? '—'} → ${u.stock[1]}` : ''}</span></div>`);
  const issues = w.issues.slice(0, 30).map((i) => html`
    <div class="imp-row"><b>${rowWord} ${i.row}</b><span>${ISSUE_LABELS[i.code]}${i.value ? ` · «${clip(i.value)}»` : ''}</span></div>`);
  return html`
    <div class="sumrows">${sum}</div>
    ${similar.length ? html`<div class="list" style="margin-bottom:16px">
      <div class="card-head"><h3>Подтвердите похожие</h3><span class="sp"></span><button class="btn btn-ghost" data-action="import-similar-all">Принять все</button></div>
      ${similar}
      ${plan.similar.length > SHOW ? html`<div class="empty" style="padding:18px">Показаны ${SHOW} из ${n(plan.similar.length)}; «Принять все» относится ко всем</div>` : ''}
    </div>` : ''}
    ${updates.length ? html`<div class="list" style="margin-bottom:16px"><div class="card-head"><h3>Обновятся</h3><span class="sp"></span>${plan.update.length > 10 ? html`<span class="badge b-off">ещё ${n(plan.update.length - 10)}</span>` : ''}</div>${updates}</div>` : ''}
    ${issues.length ? html`<div class="list" style="margin-bottom:16px"><div class="card-head"><h3>Пропустим</h3><span class="sp"></span>${w.issues.length > 30 ? html`<span class="badge b-off">ещё ${n(w.issues.length - 30)}</span>` : ''}</div>${issues}</div>` : ''}
    ${foot(true, nextButton('Дальше: фото', true))}`;
}

/* ---------- 4. Фото ---------- */

function step4(w: Wizard, ctx: RenderContext): SafeHtml {
  const plan = w.plan!;
  const targets = photoTargets(plan, ctx.products, reuseSet(w));
  const total = plan.create.length + plan.update.length + plan.unchanged.length;
  const without = targets.filter((t) => !w.photos?.bySku.has(skuKey(t.sku))).length;
  const withPhoto = total - without;
  if (!targets.length) {
    return html`<p class="lead">У всех товаров этой загрузки уже есть фото: из файла, у похожих товаров или с прошлых загрузок.</p>${foot(true, nextButton('Дальше', true))}`;
  }
  const ex = targets[0].sku;
  const hasRefs = targets.some((t) => t.photoRef);
  const p = w.photos;
  const pill = p && html`<div class="file-pill">${ico('image')}<div style="flex:1;min-width:0"><b>${p.label}</b><span>${n(p.matched)} ${plural(p.matched, 'товар получил', 'товара получили', 'товаров получили')} фото${p.unmatched ? ` · ${n(p.unmatched)} фото без товара с таким артикулом` : ''}</span></div><button class="btn btn-ghost" data-action="import-replace-photos">Заменить</button></div>`;
  return html`
    <p class="lead">У ${n(targets.length)} ${plural(targets.length, 'товара', 'товаров', 'товаров')} нет фото. Загрузите фото или архив .zip, где каждое фото названо артикулом — например <b>${ex}.jpg</b>, второе фото того же товара — <b>${ex}_2.jpg</b>.${hasRefs ? ' Подойдёт и папка import_files из выгрузки 1С.' : ''} Система разложит их по товарам сама.</p>
    <div class="card card-pad" style="margin-bottom:16px">
      ${w.busy ? busyZone(w.busy) : pill || dropZone('photos')}
      ${!p && !w.busy && w.file?.archive ? html`<button class="btn btn-secondary" style="margin-top:12px" data-action="import-archive-photos">${ico('image')}Взять фото из архива «${w.file.archive.name}» (${n(w.file.archive.photos)})</button>` : ''}
      ${errorNote(w.error)}
      <div style="margin-top:16px">
        <div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:8px"><span>Товаров с фото</span><b class="num">${n(withPhoto)} из ${n(total)}</b></div>
        <div class="bar"><i style="width:${total ? Math.round((withPhoto / total) * 100) : 0}%"></i></div>
      </div>
    </div>
    ${p?.noRoom ? html`<div class="note warn" style="margin-bottom:12px">${ico('alert')}<div><b>${n(p.noRoom)} фото не поместились в память браузера.</b> Пока нет сервера, браузер хранит около 5 МБ на всё приложение, поэтому фото сжимаются и загружаются, пока есть место: сначала главное фото каждого товара. Остальные можно будет загрузить, когда появится сервер.</div></div>` : ''}
    ${p?.failed ? html`<div class="note warn" style="margin-bottom:12px">${ico('alert')}<div><b>${n(p.failed)} фото не удалось прочитать.</b> Проверьте, что это JPG, PNG или WebP.</div></div>` : ''}
    ${without ? html`<div class="note warn">${ico('alert')}<div><b>${n(without)} ${plural(without, 'товар останется', 'товара останутся', 'товаров останутся')} без фото.</b> Новые сохранятся со статусом «Нет фото» и не появятся у покупателей, пока магазин не добавит фото — так в каталоге не будет пустых карточек.</div></div>` : ''}
    ${foot(true, nextButton('Дальше', !w.busy))}`;
}

/* ---------- 5. Запуск ---------- */

function step5(w: Wizard, ctx: RenderContext): SafeHtml {
  const r = dryRun(w, ctx.products);
  const size = sizeEstimate(w, ctx.products);
  const nothing = !r.created && !r.updated && !r.photosAttached;
  const mb = (x: number) => (x / 1e6).toFixed(1).replace('.', ',');
  return html`
    <div class="sumrows">
      <div><b>${n(r.published)}</b><span>появятся в каталоге сразу</span></div>
      <div><b>${n(r.withoutPhoto)}</b><span>сохранятся без фото — не видны покупателям</span>${r.withoutPhoto && !w.photos ? html`<button class="btn btn-ghost btn-sm" data-action="import-step" data-step="4">Добавить фото</button>` : ''}</div>
      <div><b>${n(r.updated)}</b><span>обновят цену и остаток${r.updated ? '' : ' — таких товаров в каталоге ещё нет'}</span></div>
      ${w.issues.length ? html`<div class="warn"><b>${n(w.issues.length)}</b><span>${plural(w.issues.length, 'строка', 'строки', 'строк')} с ошибками пропустим</span></div>` : ''}
    </div>
    <div class="card card-pad">
      <div class="file-pill">${ico('file')}<div style="flex:1;min-width:0"><b>${w.file!.names.join(', ')}</b><span>Магазин «${w.store}» · ${n(w.drafts.length)} ${plural(w.drafts.length, 'товар', 'товара', 'товаров')} из файла</span></div></div>
      <div class="note" style="margin-top:14px">${ico('info')}<div>При следующей выгрузке система узнает товары по артикулу и обновит только цену и наличие — без дублей.</div></div>
      ${size.needed > size.capacity * 0.95 ? html`<div class="note warn" style="margin-top:14px">${ico('alert')}<div><b>Скорее всего не поместится.</b> После импорта данным приложения нужно около ${mb(size.needed)} МБ, а браузер хранит около ${mb(size.capacity)} МБ. Пока нет сервера, загрузите файл частями или без фото. Если не поместится, ничего не изменится.</div></div>` : ''}
      ${nothing ? html`<div class="note" style="margin-top:14px">${ico('check')}<div>Изменений нет: все товары файла уже загружены с этими ценами и остатками.</div></div>` : ''}
      ${errorNote(w.error)}
      ${foot(true, nextButton(nothing ? 'Изменений нет' : 'Запустить импорт', !nothing, 'import-run'))}
    </div>`;
}

export function renderStep(w: Wizard, ctx: RenderContext): SafeHtml {
  const body = w.step === 1 || !w.file ? step1(w, ctx)
    : w.step === 2 ? step2(w)
      : !w.plan ? step2(w)
        : w.step === 3 ? step3(w, ctx)
          : w.step === 4 ? step4(w, ctx)
            : step5(w, ctx);
  return html`${stepper(w)}${body}`;
}
