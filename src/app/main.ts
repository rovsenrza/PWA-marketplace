/**
 * Buyer app entry point (ES module, runs after the legacy classic scripts).
 * Styles are connected in cascade order. Order matters, as in the prototype:
 * the prototype layers, then Tailwind (it used to run in the browser and inject its CSS last).
 */
import './styles/base.css';
import './styles/market.css';
import './styles/glass.css';
import './styles/motion.css';
import './styles/tailwind.css';

import './legacy-bridge';

import { initTransitions } from './features/motion/transitions';
import { initSwipeToDelete } from './features/swipe-to-delete';
import { initNotificationsSheet } from './features/notifications/sheet';
import { initTabLens } from './features/tab-lens';
import { registerServiceWorker } from './features/pwa';

const phone = document.getElementById('phone-container');
if (phone && 'animate' in Element.prototype) {
  initTransitions(phone);
  initSwipeToDelete();
  initNotificationsSheet(phone);
}
initTabLens();
registerServiceWorker();
