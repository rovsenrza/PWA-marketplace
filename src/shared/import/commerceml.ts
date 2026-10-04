/**
 * CommerceML 2: 1C's standard format for «exchange with a website». import.xml holds the products and groups,
 * offers.xml the prices and stock. Either is enough (import.xml without prices gives products without prices,
 * which show up as errors in the report). The result is the same table as from Excel.
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

export function readCommerceML(importXml: string | null, offersXml: string | null): ImportTable {
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
  if (offersXml) {
    const doc = parser.parse(offersXml)['КоммерческаяИнформация'] as Node;
    const pack = doc?.['ПакетПредложений'] as Node | undefined;
    for (const o of arr((pack?.['Предложения'] as Node | undefined)?.['Предложение'] as Node | Node[] | undefined)) {
      /* Ид предложения — «ИдТовара#ИдХарактеристики» или просто ИдТовара */
      const id = text(o['Ид']).split('#')[0];
      const price = text(arr(((o['Цены'] as Node | undefined)?.['Цена']) as Node | Node[] | undefined)[0]?.['ЦенаЗаЕдиницу']);
      const stock = text(o['Количество']);
      let row = items.get(id);
      if (!row) {
        row = [text(o['Артикул']), text(o['Наименование']), '', '', '', '', text(o['ШтрихКод']), '', ''];
        items.set(id, row); order.push(id);
      }
      if (price) row[2] = price;
      if (stock) row[3] = stock;
    }
  }
  return { source: 'commerceml', columns: [...COMMERCEML_COLUMNS], rows: order.map((id) => items.get(id)!), firstRow: 1 };
}
