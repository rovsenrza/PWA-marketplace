/** Buttons of the cart and the order lists (data-action) → actions. */
import { registerActions } from '../../../shared/ui/actions';
import { removeFromCart, setCartQty } from './actions';
import {
  soAcceptPrice, soCancel, soConfirmAll, soConfirmLine, soContactClient, soIssueInvoice,
  soMarkPaid, soMarkUnavailable, soProposePrice, soRejectAll, soReturnToCart,
} from '../orders/actions';

const order = (el: HTMLElement) => el.dataset.order ?? '';
const product = (el: HTMLElement) => el.dataset.product ?? '';

export function registerCartActions(): void {
  registerActions({
    'cart-remove': (el) => removeFromCart(product(el)),
    'cart-qty': (el) => setCartQty(product(el), Number(el.dataset.qty)),
    /* покупатель */
    'so-accept-price': (el) => soAcceptPrice(order(el)),
    'so-cancel': (el) => soCancel(order(el)),
    'so-return': (el) => soReturnToCart(order(el)),
    /* магазин */
    'so-confirm-line': (el) => soConfirmLine(order(el), product(el)),
    'so-unavailable': (el) => soMarkUnavailable(order(el), product(el)),
    'so-propose-price': (el) => soProposePrice(order(el), product(el)),
    'so-confirm-all': (el) => soConfirmAll(order(el)),
    'so-reject-all': (el) => soRejectAll(order(el)),
    'so-invoice': (el) => soIssueInvoice(order(el)),
    'so-paid': (el) => soMarkPaid(order(el)),
    'so-contact': (el) => soContactClient(order(el), el.dataset.channel === 'telegram' ? 'telegram' : 'max'),
  });
}
