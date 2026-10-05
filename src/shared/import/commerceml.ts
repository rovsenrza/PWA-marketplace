/**
 * CommerceML 2: 1C's standard format for «exchange with a website». import.xml holds the products and groups,
 * offers.xml the prices and stock (since 2.08 they may come as separate prices.xml and rests.xml).
 * Either is enough (import.xml without prices gives products without prices, which show up as errors
 * in the report). The result is the same table as from Excel.
 */
import { XMLParser } from 'fast-xml-parser';
import type { ImportTable } from './types';

const arr = <T>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const text = (v: unknown): string => (v == null ? '' : typeof v === 'object' ? String((v as Record<string, unknown>)['#text'] ?? '') : String(v)).trim();

type Node = Record<string, unknown>;
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@', parseTagValue: false, trimValues: true });

export const COMMERCEML_COLUMNS = ['Артикул', 'Наименование', 'Цена', 'Остаток', 'Ед. изм.', 'Группа', 'Штрихкод', 'Описание', 'Картинка'];

export function isCommerceML(xml: string): boolean {
  return /<КоммерческаяИнформация[\s>]/.test(xml.slice(0, 2000));
}

/** Groups of the classifier, recursively: Ид → Наименование. */
function collectGroups(groups: unknown, out: Map<string, string>): void {
  for (const g of arr((groups as Node | undefined)?.['Группа'] as Node | Node[] | undefined)) {
    out.set(text(g['Ид']), text(g['Наименование']));
    collectGroups(g['Группы'], out);
  }
}

/** Price type: the retail one if the package names it, otherwise the first. */
function retailPriceType(pack: Node | undefined): string {
  const types = arr((pack?.['ТипыЦен'] as Node | undefined)?.['ТипЦены'] as Node | Node[] | undefined);
  const retail = types.find((t) => /розн/i.test(text(t['Наименование']))) ?? types[0];
  return retail ? text(retail['Ид']) : '';
}

/** Stock: «Количество» of the offer, or the sum over «Остатки» (2.08: by warehouse). */
function stockOf(o: Node): string {
  const own = text(o['Количество']);
  if (own) return own;
  let total = 0;
  let found = false;
  for (const r of arr((o['Остатки'] as Node | undefined)?.['Остаток'] as Node | Node[] | undefined)) {
    const places = r['Склад'] ? arr(r['Склад'] as Node | Node[]) : [r];
    for (const w of places) {
      const q = Number(text(w['Количество']).replace(',', '.'));
      if (Number.isFinite(q) && text(w['Количество'])) { total += q; found = true; }
    }
  }
  return found ? String(total) : '';
}

export function readCommerceML(importXml: string | null, offersXml: string | string[] | null): ImportTable {
  const groups = new Map<string, string>();
  const items = new Map<string, string[]>(); // Ид товара → строка таблицы
  const order: string[] = [];
  if (importXml) {
    const doc = parser.parse(importXml)['КоммерческаяИнформация'] as Node;
    const cls = doc?.['Классификатор'] as Node | undefined;
    collectGroups(cls?.['Группы'], groups);
    const cat = doc?.['Каталог'] as Node | undefined;
    for (const t of arr((cat?.['Товары'] as Node | undefined)?.['Товар'] as Node | Node[] | undefined)) {
      const id = text(t['Ид']);
      const groupId = text(arr((t['Группы'] as Node | undefined)?.['Ид'] as unknown)[0]);
      const unit = t['БазоваяЕдиница'];
      const unitName = typeof unit === 'object' && unit ? text((unit as Node)['@НаименованиеПолное'] ?? unit) : text(unit);
      items.set(id, [text(t['Артикул']), text(t['Наименование']), '', '', unitName, groups.get(groupId) ?? '', text(t['ШтрихКод']), text(t['Описание']), text(arr(t['Картинка'] as unknown)[0])]);
      order.push(id);
    }
  }
  for (const xml of arr(offersXml ?? undefined)) {
    const doc = parser.parse(xml)['КоммерческаяИнформация'] as Node;
    const pack = doc?.['ПакетПредложений'] as Node | undefined;
    const priceType = retailPriceType(pack);
    for (const o of arr((pack?.['Предложения'] as Node | undefined)?.['Предложение'] as Node | Node[] | undefined)) {
      /* Ид предложения — «ИдТовара#ИдХарактеристики» или просто ИдТовара */
      const id = text(o['Ид']).split('#')[0];
      const prices = arr(((o['Цены'] as Node | undefined)?.['Цена']) as Node | Node[] | undefined);
      const priceNode = prices.find((c) => priceType && text(c['ИдТипаЦены']) === priceType) ?? prices[0];
      const price = text(priceNode?.['ЦенаЗаЕдиницу']);
      const stock = stockOf(o);
      let row = items.get(id);
      if (!row) {
        row = ['', '', '', '', '', '', '', '', ''];
        items.set(id, row); order.push(id);
      }
      /* без import.xml название и артикул — из предложения (в prices.xml и rests.xml их может не быть) */
      row[0] ||= text(o['Артикул']);
      row[1] ||= text(o['Наименование']);
      row[6] ||= text(o['ШтрихКод']);
      if (price) row[2] = price;
      if (stock) row[3] = stock;
    }
  }
  return { source: 'commerceml', columns: [...COMMERCEML_COLUMNS], rows: order.map((id) => items.get(id)!), firstRow: 1 };
}
