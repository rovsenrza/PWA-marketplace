/* Модерация.
   Очередь витрин и карточек на проверку, одобрение и отклонение.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


        // ========== ОЧЕРЕДЬ МОДЕРАЦИИ ВИТРИН ==========
// Здесь хранятся заявки магазинов на изменение витрины
/* showcaseModerationDb: данные в CatalogStore (src/shared/data/catalog-store.ts); здесь — аксессор на window */


// Админка
        function renderAdminModerationList() {
    const type = document.getElementById('mod-category-filter').value;
    const container = document.getElementById('admin-pending-products-list');
    let html = '', count = 0;

    if (type === 'products') {
        Object.values(productsDb).filter(p => p.status === 'pending').forEach(p => { count++; html += buildModCard('products', p.id, p.title, p.store, p.image); });
    } else if (type === 'showcases') {
        showcaseModerationDb.filter(p => p.status === 'pending').forEach(p => {
            count++;
            html += buildShowcaseModCard(p);
        });
    } else if (type === 'directory') {
        directoryDb.specialists.filter(p => p.status === 'pending').forEach(p => { count++; html += buildModCard('directory', p.id, p.name, 'Мастер', p.avatarPhoto); });
    } else if (type === 'vacancies') {
        vacanciesDb.filter(p => p.status === 'pending').forEach(p => { count++; html += buildModCard('vacancies', p.id, p.title, 'Вакансия', p.companyPhoto); });
    } else if (type === 'stories') {
        storiesData.filter(p => p.status === 'pending').forEach(p => { count++; html += buildModCard('stories', p.id, p.name, 'Сторис · ' + (p.owner || ''), p.slides[0]); });
    }

    container.innerHTML = count === 0 ? `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Очередь модерации пуста </p>` : html;
    updateModCounter();
}


// === КАРТОЧКА ЗАЯВКИ ВИТРИНЫ (кликабельная) ===
function buildShowcaseModCard(item) {
    const p = item.proposed;
    const img = p.banner
        ? `<img src="${escHtml(p.banner)}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">`
        : `<div class="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] shrink-0">Фото</div>`;
    return `
        <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2">
            <div onclick="previewShowcaseModeration('${item.id}')" class="flex items-center gap-2 cursor-pointer active:opacity-70">
                ${img}
                <div class="flex-1 min-w-0">
                    <h5 class="font-bold text-xs text-slate-800 truncate">${escHtml(p.name)}</h5>
                    <p class="text-[10px] text-slate-400 truncate">Витрина · ${item.shopName}</p>
                </div>
                <span class="text-[10px] text-[#1e6091] font-bold whitespace-nowrap">Открыть</span>
            </div>
            <div class="flex gap-1.5">
                <button onclick="adminApproveShowcase('${item.id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg">Одобрить</button>
                <button onclick="adminRejectShowcase('${item.id}')" class="flex-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold py-1.5 rounded-lg">Отклонить</button>
            </div>
        </div>`;
}


// === ПРЕДПРОСМОТР ВИТРИНЫ (открываем витрину как её увидят покупатели) ===
function previewShowcaseModeration(id) {
    const item = showcaseModerationDb.find(x => x.id === id);
    if (!item) return;
    const p = item.proposed;

    // Временно показываем предлагаемые данные в модальном окне витрины
    document.getElementById('shop-catalog-title').innerText = p.name;
    document.getElementById('shop-catalog-banner').src = p.banner || '';
    document.getElementById('shop-catalog-desc').innerText = p.description || '';
    document.getElementById('shop-catalog-addr').innerText = p.address || '';
    document.getElementById('shop-catalog-site').innerText = (p.site || '#').replace('https://', '');
    document.getElementById('shop-catalog-site').href = p.site || '#';
    document.getElementById('shop-catalog-tg').href = p.telegram || '#';

    // Видео и галерею берём из текущего магазина (они не менялись через эту форму)
    const shop = shopsProfileDb[item.shopName] || {};
    if (shop.video) {
        document.getElementById('shop-catalog-video-container').classList.remove('hidden');
        document.getElementById('shop-catalog-video').src = shop.video;
    } else {
        document.getElementById('shop-catalog-video-container').classList.add('hidden');
    }

    let galHtml = '';
    if (shop.gallery && shop.gallery.length > 0) {
        shop.gallery.forEach(img => { galHtml += `<img src="${img}" onclick="openLightbox('${img}')" class="h-20 w-32 object-cover rounded-xl shrink-0 cursor-pointer snap-center border">`; });
        document.getElementById('shop-catalog-gallery-wrapper').classList.remove('hidden');
        document.getElementById('shop-catalog-gallery').innerHTML = galHtml;
    } else {
        document.getElementById('shop-catalog-gallery-wrapper').classList.add('hidden');
    }

    // Товары магазина
    let prodHtml = '';
    Object.values(productsDb).filter(pr => pr.store === item.shopName && pr.status === 'published').forEach(prod => {
        prodHtml += `<div class="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm"><div class="w-full h-28 bg-slate-50 relative"><img src="${escHtml(prod.image)}" class="w-full h-full object-cover"></div><div class="p-2"><h5 class="font-bold text-[11px] text-slate-800 line-clamp-1">${escHtml(prod.title)}</h5><span class="font-bold text-xs text-slate-900">${escHtml(prod.price)}</span></div></div>`;
    });
    document.getElementById('shop-catalog-grid').innerHTML = prodHtml;

    document.getElementById('shop-catalog-modal').classList.remove('hidden');
}


// === ОДОБРИТЬ ВИТРИНУ (применяем изменения к магазину) ===
function adminApproveShowcase(id) {
    const item = showcaseModerationDb.find(x => x.id === id);
    if (!item) return;
    const p = item.proposed;
    const oldName = item.shopName;
    const shop = shopsProfileDb[oldName];
    if (!shop) {
        // магазин удалён — просто убираем заявку
        showcaseModerationDb = showcaseModerationDb.filter(x => x.id !== id);
        renderAdminModerationList();
        return;
    }

    // Применяем изменения
    shop.description = p.description;
    shop.address = p.address;
    shop.site = p.site;
    shop.telegram = p.telegram;
    shop.banner = p.banner;
    shop.logo = p.logo;

    // Если имя изменилось — переносим запись и товары
    if (p.name && p.name !== oldName) {
        shop.name = p.name;
        shopsProfileDb[p.name] = shop;
        delete shopsProfileDb[oldName];
        Object.values(productsDb).forEach(pr => { if (pr.store === oldName) pr.store = p.name; });
        // если это был текущий магазин в кабинете — обновим
        if (state.currentShop === oldName) state.currentShop = p.name;
    } else {
        shop.name = p.name || shop.name;
    }

    // Убираем заявку из очереди
    showcaseModerationDb = showcaseModerationDb.filter(x => x.id !== id);

    showSmsToast("Витрина одобрена и опубликована ");
    renderAdminModerationList();
    updateModCounter();
    renderDirectorySubviews();
    renderProductGrid();
    saveAllData();
}


// === ОТКЛОНИТЬ ВИТРИНУ ===
function adminRejectShowcase(id) {
    showcaseModerationDb = showcaseModerationDb.filter(x => x.id !== id);
    showSmsToast("Заявка на витрину отклонена ");
    renderAdminModerationList();
    updateModCounter();
    saveAllData();
}


// === СТРОИМ КАРТОЧКУ ЗАЯВКИ (с 3 кнопками) ===
function buildModCard(type, id, title, subtitle, image) {
    const img = image ? `<img src="${image}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">` : `<div class="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">?</div>`;
    return `
        <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2">
            <div class="flex items-center gap-2">
                ${img}
                <div class="flex-1 min-w-0">
                    <h5 class="font-bold text-xs text-slate-800 truncate">${title}</h5>
                    <p class="text-[10px] text-slate-400">${subtitle}</p>
                </div>
                <span class="text-[9px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Ожидает</span>
            </div>
            <div class="flex gap-1.5">
                <button onclick="adminApproveItem('${type}', '${id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg">Одобрить</button>
                <button onclick="adminRejectItem('${type}', '${id}')" class="flex-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold py-1.5 rounded-lg">Отклонить</button>
            </div>
        </div>`;
}


// === СЧИТАЕМ ВСЕ ЗАЯВКИ И ОБНОВЛЯЕМ КРАСНЫЙ КРУЖОК ===
function updateModCounter() {
    let total = 0;
    total += Object.values(productsDb).filter(p => p.status === 'pending').length;
    total += directoryDb.specialists.filter(p => p.status === 'pending').length;
    total += vacanciesDb.filter(p => p.status === 'pending').length;
    total += storiesData.filter(p => p.status === 'pending').length;
    total += showcaseModerationDb.filter(p => p.status === 'pending').length;

    const counter = document.getElementById('mod-counter');
    if (!counter) return;
    if (total > 0) {
        counter.innerText = total;
        counter.classList.remove('hidden');
    } else {
        counter.classList.add('hidden');
    }
}
