/**
 * What modules publish for legacy code. The list shrinks as domains are ported;
 * once it's empty, the bridge is no longer needed.
 */
import { exposeToLegacy } from '../shared/legacy/expose';
import { parsePrice, formatPrice } from '../shared/format/price';
import { getBadgeHtml, getPriceHtml } from './ui/product-badges';

exposeToLegacy({ parsePrice, formatPrice, getBadgeHtml, getPriceHtml });
