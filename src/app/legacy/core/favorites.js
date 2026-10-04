/* Избранное.
   Сердечки, группы по магазинам, отправка менеджеру.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


        // Свернуть/развернуть группу товаров в избранном
function toggleFavGroup(id) {
    const body = document.getElementById(id);
    const arrow = document.getElementById(id + '-arrow');
    if (!body) return;
    body.classList.toggle('hidden');
    if (arrow) arrow.style.transform = body.classList.contains('hidden') ? 'rotate(-90deg)' : 'rotate(0deg)';
}



// Добавить/убрать товар из избранного
function toggleFavorite(prodId) {
    if (!state.favorites) state.favorites = [];
    const idx = state.favorites.indexOf(prodId);
    if (idx === -1) {
        state.favorites.push(prodId);
        showSmsToast("Добавлено в избранное ");
    } else {
        state.favorites.splice(idx, 1);
        showSmsToast("Удалено из избранного");
    }
    saveFavorites();
    renderProductGrid();       // перекрасить сердечки
    renderFavorites();         // обновить список
    updateBuyerFavCount();     // обновить счётчик в карточке
}


function saveFavorites() {
    try { localStorage.setItem('meb_favorites', JSON.stringify(state.favorites)); } catch (e) {}
}


function loadFavorites() {
    try {
        const saved = localStorage.getItem('meb_favorites');
        if (saved) state.favorites = JSON.parse(saved);
    } catch (e) { state.favorites = []; }
}


function clearAllFavorites() {
    state.favorites = [];
    saveFavorites();
    renderProductGrid();
    renderFavorites();
    updateBuyerFavCount();
    showSmsToast("Избранное очищено ");
}


// Рендер избранного с группировкой по магазинам
function renderFavorites() {
    const container = document.getElementById('favorites-list');
    const clearBtn = document.getElementById('fav-clear-btn');
    if (!container) return;

    if (!state.favorites || state.favorites.length === 0) {
        container.innerHTML = `
            <div class="fav-empty">
                <p class="text-sm">В избранном пока пусто</p>
                <p class="text-xs mt-1" style="color:#8AA0B8">Добавляйте товары кнопкой в каталоге</p>
            </div>`;
        if (clearBtn) clearBtn.classList.add('hidden');
        return;
    }

    if (clearBtn) clearBtn.classList.remove('hidden');

    const groups = {};
    state.favorites.forEach(id => {
        const p = productsDb[id];
        if (!p) return;
        if (!groups[p.store]) groups[p.store] = [];
        groups[p.store].push(p);
    });

    let html = '';
    let groupIndex = 0;

    for (const store in groups) {
        groupIndex++;
        const items = groups[store];
        let storeTotal = 0;
        let itemsHtml = '';
        items.forEach(id_or_p => {
            const p = productsDb[id_or_p.id] || id_or_p;
            storeTotal += parsePrice(p.price);
            const badge = getBadgeHtml(p);
            itemsHtml += `
                <div onclick="openProductModal('${p.id}')" class="fav-item" data-swipe-fn="toggleFavorite" data-swipe-arg="${p.id}">
                    <div class="flex-1 min-w-0">
                        ${badge ? `<div class="fav-badge-wrap">${badge}</div>` : ''}
                        <div class="fav-item-price">${getPriceHtml(p, 'fav-price')}</div>
                        <h5 class="fav-item-title">${p.title}</h5>
                    </div>
                    <svg class="fav-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </div>`;
        });

        const shopData = shopsProfileDb[store] || {};
        const shopImage = shopData.banner || shopData.logo || 'https://via.placeholder.com/600x200';
        const storeAttr = String(store).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        html += `
            <div class="fav-card">
                <div class="fav-banner">
                    <img src="${shopImage}" alt="">
                    <div class="fav-banner-veil"></div>
                    <button type="button" class="fav-heart" onclick="event.stopPropagation(); unfavoriteStore('${storeAttr}')">
                        <svg class="fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                    <div class="fav-banner-copy">
                        <span class="fav-shop">${store}</span>
                        <span class="fav-count">${items.length} тов.</span>
                    </div>
                </div>
                <div>
                    ${itemsHtml}
                    <div class="fav-foot">
                        <div class="fav-sum">
                            <span>Итого по магазину:</span>
                            <b>${formatPrice(storeTotal)}</b>
                        </div>
                        <div class="fav-actions">
                            <button type="button" class="fav-chat" onclick="event.stopPropagation(); openAssistant()">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.22-.9L3 20l1.16-3.48C3.43 15.4 3 13.76 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                            </button>
                            <button type="button" class="fav-send" onclick="sendOrderToManager('${storeAttr}')">
                                <svg class="fill-current" viewBox="0 0 24 24"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
                                Отправить заказ менеджеру
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    container.innerHTML = html;
}


function unfavoriteStore(store) {
    if (!state.favorites) return;
    state.favorites = state.favorites.filter(function (id) {
        const p = productsDb[id];
        return p && p.store !== store;
    });
    saveFavorites();
    renderProductGrid();
    renderFavorites();
    updateBuyerFavCount();
}


// Отправить заказ менеджеру магазина в Telegram
function sendOrderToManager(store) {
    const items = state.favorites.map(id => productsDb[id]).filter(p => p && p.store === store);
    if (items.length === 0) return;

    let total = 0;
    let message = `Здравствуйте! Хочу оформить заказ в магазине "${store}":%0A%0A`;
    items.forEach((p, i) => {
        total += parsePrice(p.price);
        message += `${i + 1}. ${p.title} — ${p.price}%0A`;
    });
    message += `%0AИтого: ${formatPrice(total)}%0A%0A`;

    // Добавляем контакты покупателя, если заполнены
    if (buyerProfile && buyerProfile.name) {
        message += `Мои данные:%0AИмя: ${buyerProfile.name}`;
        if (buyerProfile.phone) message += `%0AТелефон: ${buyerProfile.phone}`;
    }

    const shopInfo = shopsProfileDb[store];
    let tgLink = shopInfo && shopInfo.telegram ? shopInfo.telegram : '';

    if (tgLink && tgLink !== '#') {
        // Превращаем ссылку в username и добавляем текст сообщения
        const username = tgLink.replace('https://t.me/', '').replace('http://t.me/', '').replace('@', '');
        const url = `https://t.me/${username}?text=${message}`;
        window.open(url, '_blank');
        showSmsToast(`Заказ отправлен в ${store}`);
    } else {
        showSmsToast(`У магазина "${store}" не указан Telegram `);
    }
}
