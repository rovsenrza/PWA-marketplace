/** Consumption calculator for dry mixes: area × layer × the mix's rate → kilograms → bags. */
import { productValue, toNumber } from './filters';
import type { ProductLike } from './types';

/** Attribute names a dry mix carries in `attrs`. The bag size is also the packaging filter of the mixtures preset. */
export const ATTR_RATE = 'Расход, кг/м²·мм';
export const ATTR_BAG = 'Фасовка, кг';

export interface MixSpec {
  /** kilograms per square metre per millimetre of layer */
  rate: number;
  /** kilograms in one bag */
  bagKg: number;
}

/** The product's consumption data, only when both the rate and the bag size are positive numbers. */
export function mixSpecOf(p: ProductLike): MixSpec | null {
  const rate = toNumber(productValue(p, ATTR_RATE));
  const bagKg = toNumber(productValue(p, ATTR_BAG));
  return rate !== null && rate > 0 && bagKg !== null && bagKg > 0 ? { rate, bagKg } : null;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Kilograms to buy (to 0.1 kg, reserve included) and the whole bags that holds. Nonsense, such as no area,
 * a negative layer or a missing number, gives zeros rather than NaN. A blank or negative reserve counts as none.
 */
export function calcBags(areaM2: number, layerMm: number, spec: MixSpec, reservePct = 10): { kg: number; bags: number } {
  const none = { kg: 0, bags: 0 };
  if (![areaM2, layerMm, spec.rate, spec.bagKg].every((n) => Number.isFinite(n) && n > 0)) return none;
  const reserve = Number.isFinite(reservePct) ? Math.max(0, reservePct) : 0;
  const kg = round1(areaM2 * layerMm * spec.rate * (1 + reserve / 100));
  return Number.isFinite(kg) ? { kg, bags: Math.ceil(kg / spec.bagKg) } : none;
}
