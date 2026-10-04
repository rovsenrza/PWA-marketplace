/* Корзина и заказы.
   Позиции, количество, оформление, заказы по магазинам (статусы, SLA, счета).
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


        // ========== МАРКЕТПЛЕЙС: Cart → Checkout → StoreOrder → Invoice → Payment ==========
/* состояние корзины и заказов (marketplace, state.cart) и операции над ними —
   src/app/features/cart (CartStore, actions); здесь остались отрисовка и действия магазина по заказам */


function refreshCartSurfaces() {
    updateCartBadge();
    renderCart();
    renderBuyerOrders();
    renderProductGrid();
    try { if (typeof renderRecommendations === 'function') renderRecommendations(); } catch (e) {}
    try { if (typeof renderCategoryProducts === 'function') renderCategoryProducts(); } catch (e) {}
    try { if (window.currentCatalogShop) renderShopCatalogProducts(window.currentCatalogShop); } catch (e) {}
    try {
        const input = document.getElementById('catalog-search-input');
        if (typeof renderCatalogProducts === 'function') renderCatalogProducts(input ? input.value : '');
    } catch (e) {}
    try { pmRefreshCart(); } catch (e) {}
    try { if (typeof renderPmRecent === 'function') renderPmRecent(); } catch (e) {}
    try { if (state.userRole === 'shop') { updateShopStats(); renderShopOrders(); } } catch (e) {}
    /* событие для остальных доменов (src/shared/events.ts) */
    document.dispatchEvent(new CustomEvent('app:cart-changed'));
}


function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = cartQtyTotal();
    if (count > 0) { badge.innerText = count; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
}


function renderCart() {
    expireExpiredStoreOrders();
    const container = document.getElementById('cart-list');
    const clearBtn = document.getElementById('cart-clear-btn');
    const box = document.getElementById('cart-checkout-box');
    if (!container) return;
    const items = getCartItems();
    if (!items.length) {
        container.innerHTML = '<div class="cart-empty"><p class="text-sm text-sky-100/80">Корзина пуста</p><p class="text-xs text-sky-200/50 mt-1">Товары разных магазинов можно добавить в одну корзину</p></div>';
        if (clearBtn) clearBtn.classList.add('hidden');
        if (box) box.classList.add('hidden');
        renderBuyerOrders();
        return;
    }
    if (clearBtn) clearBtn.classList.remove('hidden');
    if (box) box.classList.remove('hidden');
    const nameEl = document.getElementById('chk-name');
    const phoneEl = document.getElementById('chk-phone');
    if (nameEl && !nameEl.value && buyerProfile && buyerProfile.name) nameEl.value = buyerProfile.name;
    if (phoneEl && !phoneEl.value && buyerProfile && buyerProfile.phone) phoneEl.value = buyerProfile.phone;

    let html = '';
    let grand = 0;
    items.forEach(function (i) {
        const line = (i.priceSnapshot || 0) * (i.qty || 1);
        grand += line;
        html += '<div class="cart-card" data-swipe-fn="removeFromCart" data-swipe-arg="' + i.productId + '">' +
            '<div class="cart-card-top">' +
                '<div class="min-w-0">' +
                    '<span class="cart-card-store">' + (i.storeId || '') + '</span>' +
                    '<span class="cart-card-note">Отдельный заказ при оформлении</span>' +
                '</div>' +
                '<button type="button" class="cart-card-x" onclick="removeFromCart(\'' + i.productId + '\')">×</button>' +
            '</div>' +
            '<div class="cart-card-body">' +
                '<img src="' + (i.image || '') + '" class="cart-card-photo" alt="">' +
                '<div class="min-w-0">' +
                    '<p class="cart-card-title">' + (i.titleSnapshot || '') + '</p>' +
                    (i.variant ? '<p class="cart-card-var">' + i.variant + '</p>' : '') +
                    '<p class="cart-card-price">' + formatRub(i.priceSnapshot) + '</p>' +
                    '<div class="cart-qty">' +
                        '<button type="button" onclick="setCartQty(\'' + i.productId + '\', ' + ((i.qty || 1) - 1) + ')">−</button>' +
                        '<span>' + (i.qty || 1) + '</span>' +
                        '<button type="button" onclick="setCartQty(\'' + i.productId + '\', ' + ((i.qty || 1) + 1) + ')">+</button>' +
                    '</div>' +
                '</div>' +
                '<p class="cart-card-sum">' + formatRub(line) + '</p>' +
            '</div>' +
        '</div>';
    });
    html += '<p class="cart-total">Итого: ' + formatRub(grand) + '</p>';
    container.innerHTML = html;
    renderBuyerOrders();
}


function soFind(id) { return (marketplace.storeOrders || []).find(o => o.id === id); }


function soLine(order, productId) { return (order.lines || []).find(l => l.productId === productId); }


function soSetLine(orderId, productId, status, extra) {
    const order = soFind(orderId);
    if (!order) return;
    if (['paid', 'cancelled', 'expired', 'rejected'].includes(order.status) && status !== 'pending') {
        if (order.status === 'expired' || order.status === 'cancelled') return;
    }
    const line = soLine(order, productId);
    if (!line) return;
    line.lineStatus = status;
    if (extra && extra.proposedPrice != null) line.proposedPrice = extra.proposedPrice;
    soRecalc(order);
    saveMarketplace();
    refreshCartSurfaces();
}


function soConfirmLine(orderId, productId) { soSetLine(orderId, productId, 'confirmed'); showSmsToast('Позиция подтверждена'); }

function soMarkUnavailable(orderId, productId) { soSetLine(orderId, productId, 'unavailable'); showSmsToast('Нет в наличии'); }

function soProposePrice(orderId, productId) {
    const order = soFind(orderId);
    const line = order && soLine(order, productId);
    if (!line) return;
    const val = prompt('Новая цена, ₽', String(line.quotedPrice));
    if (val == null) return;
    const n = parseInt(String(val).replace(/\D/g, ''), 10);
    if (!n) return showSmsToast('Некорректная цена');
    soSetLine(orderId, productId, 'price_changed', { proposedPrice: n });
    showSmsToast('Цена отправлена клиенту');
}

function soConfirmAll(orderId) {
    const order = soFind(orderId);
    if (!order) return;
    order.lines.forEach(l => { if (l.lineStatus === 'pending' || l.lineStatus === 'price_changed') { l.lineStatus = 'confirmed'; if (l.proposedPrice) l.quotedPrice = l.proposedPrice; } });
    soRecalc(order);
    saveMarketplace();
    refreshCartSurfaces();
}

function soRejectAll(orderId) {
    const order = soFind(orderId);
    if (!order) return;
    order.lines.forEach(l => { l.lineStatus = 'unavailable'; });
    order.status = 'rejected';
    saveMarketplace();
    refreshCartSurfaces();
}

function soCancel(orderId) {
    const order = soFind(orderId);
    if (!order || order.status === 'paid') return;
    order.status = 'cancelled';
    saveMarketplace();
    refreshCartSurfaces();
    showSmsToast('Заказ отменён');
}

function soAcceptPrice(orderId) {
    const order = soFind(orderId);
    if (!order) return;
    order.lines.forEach(l => {
        if (l.lineStatus === 'price_changed' && l.proposedPrice) {
            l.quotedPrice = l.proposedPrice;
            l.lineStatus = 'confirmed';
        }
    });
    soRecalc(order);
    saveMarketplace();
    refreshCartSurfaces();
    showSmsToast('Новая цена принята');
}

function soReturnToCart(orderId) {
    const order = soFind(orderId);
    if (!order) return;
    (order.lines || []).forEach(l => {
        if (l.lineStatus === 'unavailable' || order.status === 'expired' || order.status === 'cancelled' || order.status === 'rejected') {
            const p = productsDb[l.productId];
            if (!p) return;
            const items = getCartItems();
            const ex = items.find(i => i.productId === l.productId);
            if (ex) ex.qty += l.qty || 1;
            else items.push({ productId: p.id, storeId: p.store, qty: l.qty || 1, priceSnapshot: parsePrice(p.price), titleSnapshot: p.title, image: p.image });
            state.cart = items;
        }
    });
    saveCart();
    saveMarketplace();
    refreshCartSurfaces();
    showSmsToast('Позиции возвращены в корзину');
}

function soIssueInvoice(orderId) {
    const order = soFind(orderId);
    if (!order) return;
    const amount = soConfirmedAmount(order);
    if (!amount) return showSmsToast('Нет подтверждённых позиций');
    const inv = { id: cartUid('inv-'), storeOrderId: order.id, amount, currency: 'RUB', channel: 'in_app', status: 'issued', createdAt: Date.now() };
    marketplace.invoices.push(inv);
    order.status = 'awaiting_payment';
    order.invoiceId = inv.id;
    saveMarketplace();
    refreshCartSurfaces();
    showSmsToast('Счёт ' + formatRub(amount) + ' выставлен');
}

function soMarkPaid(orderId) {
    const order = soFind(orderId);
    if (!order || !order.invoiceId) return showSmsToast('Сначала выставьте счёт');
    const inv = marketplace.invoices.find(i => i.id === order.invoiceId);
    const pay = { id: cartUid('pay-'), invoiceId: order.invoiceId, provider: 'manual', status: 'succeeded', amount: inv ? inv.amount : soConfirmedAmount(order), paidAt: Date.now() };
    marketplace.payments.push(pay);
    if (inv) inv.status = 'paid';
    order.status = 'paid';
    saveMarketplace();
    refreshCartSurfaces();
    showSmsToast('Оплата отмечена');
}

function soContactClient(orderId, channel) {
    const order = soFind(orderId);
    if (!order) return;
    const amount = soConfirmedAmount(order);
    const msg = encodeURIComponent('Заказ ' + order.id + ' из «' + order.storeId + '». К оплате: ' + formatRub(amount));
    if (channel === 'telegram') {
        let handle = (order.contact && order.contact.telegram) || '';
        handle = handle.replace(/^@/, '');
        if (handle.indexOf('t.me') >= 0) window.open(handle, '_blank');
        else if (handle) window.open('https://t.me/' + handle + '?text=' + msg, '_blank');
        else showSmsToast('Клиент не указал Telegram');
    } else {
        const m = (order.contact && order.contact.max) || '';
        if (m.indexOf('http') === 0) window.open(m, '_blank');
        else showSmsToast('MAX: ' + (m || 'не указан') + '. Счёт: ' + formatRub(amount));
    }
}


function renderBuyerOrders() {
    const el = document.getElementById('buyer-orders-list');
    if (!el) return;
    expireExpiredStoreOrders();
    const uid = state.userEmail;
    const phone = (buyerProfile && buyerProfile.phone) || '';
    const mine = (marketplace.storeOrders || []).filter(o => {
        const chk = marketplace.checkouts.find(c => c.id === o.checkoutId);
        return (chk && (chk.userId === uid || chk.userId === phone)) || (o.contact && o.contact.phone === phone && phone);
    }).sort((a, b) => b.createdAt - a.createdAt);
    if (!mine.length) { el.innerHTML = '<p class="cart-orders-empty">Заказов пока нет</p>'; return; }
    el.innerHTML = mine.map(o => {
        const lines = (o.lines || []).map(l => {
            const price = l.proposedPrice && l.lineStatus === 'price_changed' ? l.proposedPrice : l.quotedPrice;
            return `<div class="flex justify-between gap-2 text-[11px] py-1"><span class="truncate">${l.title} ×${l.qty}</span><span>${soLineBadge(l.lineStatus)} ${formatRub(price)}</span></div>`;
        }).join('');
        let actions = '';
        if (o.status === 'awaiting_buyer') actions += `<button onclick="soAcceptPrice('${o.id}')" class="flex-1 bg-[#1e6091] text-white text-[10px] font-bold py-2 rounded-lg">Принять цену</button>`;
        if (['pending_review','awaiting_buyer','partial','confirmed'].includes(o.status)) actions += `<button onclick="soCancel('${o.id}')" class="flex-1 bg-slate-100 text-slate-600 text-[10px] font-bold py-2 rounded-lg">Отменить</button>`;
        if (['expired','rejected','cancelled'].includes(o.status)) actions += `<button onclick="soReturnToCart('${o.id}')" class="flex-1 bg-slate-800 text-white text-[10px] font-bold py-2 rounded-lg">Вернуть в корзину</button>`;
        return `<div class="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
            <div class="flex justify-between gap-2"><span class="text-xs font-bold">${o.storeId}</span><span class="text-[10px] text-slate-500">${soStatusLabel(o.status)}</span></div>
            ${lines}
            <p class="text-xs font-bold text-right">${formatRub(soConfirmedAmount(o) || (o.lines||[]).reduce((s,l)=>s+l.quotedPrice*(l.qty||1),0))}</p>
            ${actions ? `<div class="flex gap-2">${actions}</div>` : ''}
        </div>`;
    }).join('');
}


function soLineBadge(st) {
    const map = { pending: 'ожидание', confirmed: 'ок', unavailable: 'нет', price_changed: 'новая цена', removed: 'снято' };
    return '<span class="text-slate-400">' + (map[st] || st) + '</span>';
}


function renderShopOrders() {
    expireExpiredStoreOrders();
    const el = document.getElementById('shop-orders-list');
    if (!el) return;
    const shop = state.currentShop;
    const list = (marketplace.storeOrders || []).filter(o => o.storeId === shop).sort((a, b) => b.createdAt - a.createdAt);
    if (!list.length) { el.innerHTML = '<p class="text-xs text-slate-400 p-4 text-center border border-dashed rounded-xl">Заказов нет</p>'; return; }
    el.innerHTML = list.map(o => {
        const c = o.contact || {};
        const lines = (o.lines || []).map(l => {
            const canAct = ['pending_review','partial','confirmed','awaiting_buyer'].includes(o.status);
            const acts = canAct && (l.lineStatus === 'pending' || l.lineStatus === 'price_changed')
                ? `<div class="flex gap-1 mt-1">
                    <button onclick="soConfirmLine('${o.id}','${l.productId}')" class="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">Есть</button>
                    <button onclick="soMarkUnavailable('${o.id}','${l.productId}')" class="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-md">Нет</button>
                    <button onclick="soProposePrice('${o.id}','${l.productId}')" class="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-md">Цена</button>
                   </div>` : '';
            return `<div class="py-2 border-b border-slate-50 last:border-0">
                <div class="flex justify-between text-[11px]"><span class="font-medium truncate pr-2">${l.title} ×${l.qty}</span><span>${formatRub(l.proposedPrice || l.quotedPrice)}</span></div>
                <p class="text-[10px] text-slate-400">${soLineBadge(l.lineStatus)}</p>${acts}
            </div>`;
        }).join('');
        let foot = '';
        if (['confirmed','partial'].includes(o.status)) foot += `<button onclick="soIssueInvoice('${o.id}')" class="w-full bg-[#1c3a34] text-white text-[11px] font-bold py-2 rounded-xl">Выставить счёт</button>`;
        if (o.status === 'awaiting_payment' || o.status === 'invoiced') {
            foot += `<div class="grid grid-cols-2 gap-2">
                <button onclick="soContactClient('${o.id}','telegram')" class="bg-[#2AABEE] text-white text-[10px] font-bold py-2 rounded-xl">Telegram</button>
                <button onclick="soContactClient('${o.id}','max')" class="bg-slate-800 text-white text-[10px] font-bold py-2 rounded-xl">MAX</button>
            </div>
            <button onclick="soMarkPaid('${o.id}')" class="w-full bg-emerald-600 text-white text-[11px] font-bold py-2 rounded-xl">Отметить оплату</button>`;
        }
        if (o.status === 'pending_review') foot += `<button onclick="soConfirmAll('${o.id}')" class="w-full bg-[#1e6091] text-white text-[11px] font-bold py-2 rounded-xl mb-1">Подтвердить все</button><button onclick="soRejectAll('${o.id}')" class="w-full bg-slate-100 text-slate-600 text-[11px] font-bold py-2 rounded-xl">Отклонить заказ</button>`;
        return `<div class="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
            <div class="flex justify-between"><span class="text-[10px] font-bold text-slate-500">${soStatusLabel(o.status)}</span><span class="text-[10px] text-slate-400">SLA до ${new Date(o.slaDeadline||0).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</span></div>
            <p class="text-[11px] text-slate-600">${c.name || ''} · ${c.phone || ''}</p>
            ${lines}
            <p class="text-xs font-bold">К счёту: ${formatRub(soConfirmedAmount(o))}</p>
            <div class="space-y-1">${foot}</div>
        </div>`;
    }).join('');
}
