/* Кабинет магазина в приложении.
   Дашборд, витрина, товары и сторис магазина, заявки.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


                function switchAdminTab(id) { 
    ['moderation','crm','home'].forEach(t=>{ document.getElementById(`adm-view-${t}`).classList.add('hidden'); document.getElementById(`adm-tab-btn-${t}`).className='py-1 px-3 text-xs font-bold text-slate-400 whitespace-nowrap'; }); 
    document.getElementById(`adm-view-${id}`).classList.remove('hidden'); document.getElementById(`adm-tab-btn-${id}`).className='py-1 px-3 text-xs font-bold border-b-2 border-amber-500 text-amber-600 whitespace-nowrap'; 
    if (id === 'crm') { renderCrmProductList(); switchCrmType(); }
    if (id === 'home') { renderCrmPromoList(); renderCrmStoryList(); renderCrmOnbList(); }
}


        // ========== КАБИНЕТ МАГАЗИНА ==========

// Главная функция: заполняет весь кабинет данными магазина
function renderShopDashboard() {
    const shopName = state.currentShop;
    const shop = shopsProfileDb[shopName];
    if (!shop) return;

    // Шапка
    document.getElementById('shop-dash-name').innerText = shopName;

    // Заполняем форму витрины
    document.getElementById('shop-my-name').value = shop.name || '';
    document.getElementById('shop-my-desc').value = shop.description || '';
    document.getElementById('shop-my-addr').value = shop.address || '';
    document.getElementById('shop-my-site').value = shop.site || '';
    document.getElementById('shop-my-tg').value = shop.telegram || '';
    document.getElementById('shop-my-banner').value = shop.banner || '';
    document.getElementById('shop-my-banner-preview').src = shop.banner || '';
    document.getElementById('shop-my-logo').value = shop.logo || '';
    document.getElementById('shop-my-logo-preview').src = shop.logo || '';

    updateShopStats();
    renderShopMyProducts();
}


// Обновление мини-статистики
function updateShopStats() {
    const shopName = state.currentShop;
    let published = 0, pending = 0;
    Object.values(productsDb).forEach(p => {
        if (p.store !== shopName) return;
        if (p.status === 'published') published++;
        else if (p.status === 'pending') pending++;
    });
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
    set('shop-stat-published', published);
    set('shop-stat-pending', pending);
    const storiesCount = storiesData.filter(s => s.owner === shopName).length;
    set('shop-stat-stories', storiesCount);
    expireExpiredStoreOrders();
    const orderCount = (marketplace && marketplace.storeOrders || []).filter(o => o.storeId === shopName && o.status === 'pending_review').length;
    set('shop-stat-orders', orderCount);
}


// Переключение вкладок внутри кабинета магазина
function switchShopTab(id) {
    ['showcase', 'products', 'stories', 'orders'].forEach(t => {
        const view = document.getElementById('shop-view-' + t);
        const btn = document.getElementById('shop-tab-btn-' + t);
        if (view) view.classList.add('hidden');
        if (btn) btn.className = 'py-1 px-3 text-xs font-bold text-slate-400 whitespace-nowrap';
    });
    const view = document.getElementById('shop-view-' + id);
    const btn = document.getElementById('shop-tab-btn-' + id);
    if (view) view.classList.remove('hidden');
    if (btn) btn.className = 'py-1 px-3 text-xs font-bold border-b-2 border-[#1e6091] text-[#1e6091] whitespace-nowrap';
    if (id === 'products') renderShopMyProducts();
    if (id === 'stories') renderShopMyStories();
    if (id === 'orders') renderShopOrders();
}


// Сохранение витрины (уходит на МОДЕРАЦИЮ)
function shopSaveShowcase() {
    const oldName = state.currentShop;
    const shop = shopsProfileDb[oldName];
    if (!shop) return;

    const newName = document.getElementById('shop-my-name').value.trim();
    if (!newName) return showSmsToast("Введите название магазина!");

    // Собираем предложенные изменения (пока НЕ применяем к самому магазину)
    const proposed = {
        name: newName,
        description: document.getElementById('shop-my-desc').value.trim(),
        address: document.getElementById('shop-my-addr').value.trim(),
        site: document.getElementById('shop-my-site').value.trim() || '#',
        telegram: document.getElementById('shop-my-tg').value.trim() || '#',
        banner: document.getElementById('shop-my-banner').value.trim() || shop.banner,
        logo: document.getElementById('shop-my-logo').value.trim() || shop.logo || ''
    };

    // Кладём изменения в очередь модерации витрин
    // Если для этого магазина уже есть заявка — обновляем её
    const existing = showcaseModerationDb.find(x => x.shopName === oldName);
    if (existing) {
        existing.proposed = proposed;
        existing.date = Date.now();
    } else {
        showcaseModerationDb.push({
            id: 'showcase-' + Date.now(),
            shopName: oldName,       // текущее имя магазина (владелец заявки)
            proposed: proposed,      // что предлагается опубликовать
            status: 'pending',
            date: Date.now()
        });
    }

    saveAllData();
    updateModCounter();
    showSmsToast("Витрина отправлена на модерацию ");
}


// ---------- ТОВАРЫ МАГАЗИНА ----------

// Список товаров текущего магазина
function renderShopMyProducts() {
    const shopName = state.currentShop;
    const container = document.getElementById('shop-my-products-list');
    if (!container) return;

    let html = '';
    Object.values(productsDb).forEach(p => {
        if (p.store !== shopName) return;
        const badge = p.status === 'pending'
            ? '<span class="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">На модерации</span>'
            : '<span class="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Опубликован</span>';
        html += `
            <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                <img src="${escHtml(p.image)}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">
                <div class="flex-1 min-w-0">
                    <h5 class="font-bold text-xs text-slate-800 truncate">${escHtml(p.title)}</h5>
                    <p class="text-[10px] text-slate-400 truncate">${escHtml(p.price)}</p>
                    ${badge}
                </div>
                <div class="flex flex-col gap-1 shrink-0">
                    <button onclick="openShopProductEditor('${p.id}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                    <button onclick="shopDeleteProduct('${p.id}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                </div>
            </div>`;
    });
    container.innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">У вас пока нет товаров</p>`;
}


        // Открыть форму товара магазина (используем существующее окно product-editor)
       function openShopProductEditor(id) {
    window.shopEditingId = id || '';
    window.editorMode = 'shop';
    const editor = document.getElementById('product-editor');

    // ВАЖНО: переносим форму в body, чтобы она не была скрыта внутри админ-панели
    if (editor.parentElement !== document.body) {
        document.body.appendChild(editor);
    }

    if (id && productsDb[id]) {
        const p = productsDb[id];
        document.getElementById('editor-title').innerText = 'Редактировать товар';
        document.getElementById('editor-prod-id').value = id;
        document.getElementById('editor-prod-title').value = p.title;
        document.getElementById('editor-prod-price').value = p.price;
        document.getElementById('editor-prod-store').value = state.currentShop;
        setCategoryDropdown(p.category || '');
        document.getElementById('editor-prod-image').value = p.image;
    } else {
        document.getElementById('editor-title').innerText = 'Новый товар';
        document.getElementById('editor-prod-id').value = '';
        document.getElementById('editor-prod-title').value = '';
        document.getElementById('editor-prod-price').value = '';
        document.getElementById('editor-prod-store').value = state.currentShop;
        setCategoryDropdown('');
        document.getElementById('editor-prod-image').value = '';
    }
    updateEditorPreview();
    editor.classList.remove('hidden');
    editor.classList.add('flex');
}


// Удаление товара магазина
function shopDeleteProduct(id) {
    if (!productsDb[id]) return;
    if (productsDb[id].store !== state.currentShop) return; // защита
    delete productsDb[id];
    showSmsToast("Товар удалён ");
    renderShopMyProducts();
    updateShopStats();
    renderProductGrid();
    renderDirectorySubviews();
    saveAllData();
}



// ---------- СТОРИС МАГАЗИНА ----------

// Показать переключение на вкладку "Сторис" -> дорисуем список
// (дополняем switchShopTab, вызвав рендер)

// Список сторис текущего магазина
function renderShopMyStories() {
    const shopName = state.currentShop;
    const container = document.getElementById('shop-my-stories-list');
    if (!container) return;

    let html = '';
    let count = 0;
    storiesData.forEach(s => {
        if (s.owner !== shopName) return; // только свои
        count++;
        const badge = s.status === 'pending'
            ? '<span class="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">На модерации</span>'
            : '<span class="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Опубликован</span>';
        html += `
            <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                <img src="${s.slides[0]}" class="w-11 h-11 rounded-full object-cover shrink-0 bg-slate-100">
                <div class="flex-1 min-w-0">
                    <h5 class="font-bold text-xs text-slate-800 truncate">${escHtml(s.name)}</h5>
                    <p class="text-[10px] text-slate-400">${s.slides.length} фото</p>
                    ${badge}
                </div>
                <div class="flex flex-col gap-1 shrink-0">
                    <button onclick="openShopStoryEditor('${s.id}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                    <button onclick="shopDeleteStory('${s.id}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                </div>
            </div>`;
    });
    container.innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">У вас пока нет сторис</p>`;
}


// Открыть форму сторис магазина
function openShopStoryEditor(id) {
    const e = document.getElementById('shop-story-editor');
    const s = storiesData.find(x => x.id === id);
    if (s && s.owner === state.currentShop) {
        document.getElementById('shop-story-editor-title').innerText = 'Редактировать сторис';
        document.getElementById('shop-story-editor-id').value = s.id;
        document.getElementById('shop-story-editor-name').value = s.name;
        document.getElementById('shop-story-editor-slides').value = s.slides.join('\n');
    } else {
        document.getElementById('shop-story-editor-title').innerText = 'Новый сторис';
        document.getElementById('shop-story-editor-id').value = '';
        document.getElementById('shop-story-editor-name').value = state.currentShop; // подставим имя магазина
        document.getElementById('shop-story-editor-slides').value = '';
    }
    e.classList.remove('hidden'); e.classList.add('flex');
}


function closeShopStoryEditor() {
    const e = document.getElementById('shop-story-editor');
    e.classList.add('hidden'); e.classList.remove('flex');
}


// Сохранить сторис магазина (уходит на модерацию)
function saveShopStoryFromEditor() {
    const id = document.getElementById('shop-story-editor-id').value;
    const name = document.getElementById('shop-story-editor-name').value.trim();
    const slidesText = document.getElementById('shop-story-editor-slides').value.trim();
    if (!name || !slidesText) return showSmsToast("Заполните название и фото!");

    const slides = slidesText.split('\n').map(x => x.trim()).filter(x => x);
    if (slides.length === 0) return showSmsToast("Добавьте хотя бы одно фото!");

    const existing = storiesData.find(x => x.id === id);
    if (existing && existing.owner === state.currentShop) {
        existing.name = name;
        existing.slides = slides;
        existing.status = 'pending'; // после правок снова на модерацию
        showSmsToast("Сторис отправлен на модерацию ");
    } else {
        storiesData.push({
            id: 'story-' + Date.now(),
            name: name,
            slides: slides,
            owner: state.currentShop, // владелец = магазин
            status: 'pending',        // на модерацию
            createdAt: Date.now()
        });
        showSmsToast("Сторис отправлен на модерацию ");
    }

    closeShopStoryEditor();
    renderShopMyStories();
    updateShopStats();
    renderStories();
    saveAllData();
}


// Удаление сторис магазина
function shopDeleteStory(id) {
    const s = storiesData.find(x => x.id === id);
    if (!s || s.owner !== state.currentShop) return; // защита
    storiesData = storiesData.filter(x => x.id !== id);
    showSmsToast("Сторис удалён ");
    renderShopMyStories();
    updateShopStats();
    renderStories();
    saveAllData();
}


// Подача заявок
function shopSaveProduct() {
    const title = document.getElementById('new-prod-title').value.trim(); const price = document.getElementById('new-prod-price').value.trim();
    if(!title || !price) return showSmsToast("Заполните Название и Цену!");
    const id = 'prod-' + Date.now();
    productsDb[id] = { id: id, title: title, price: price + ' ₽', sku: 'NEW', store: 'Любимый Дом', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', status: 'pending', category: 'мебель' };
    showSmsToast("Товар отправлен на модерацию!"); document.getElementById('new-prod-title').value = ''; document.getElementById('new-prod-price').value = '';
}

function userSubmitApplication() {
    const type = document.getElementById('user-submit-type').value; const title = document.getElementById('user-submit-title').value.trim();
    if(!title) return showSmsToast("Заполните Название!");
    const id = 'req-' + Date.now();
    if(type === 'specialists') directoryDb.specialists.push({ id: id, name: title, title: 'Анкета', description: 'Ожидает', avatar: title[0], status: 'pending' });
    else vacanciesDb.push({ id: id, title: title, company: 'Моя компания', salary: 'Договорная', status: 'pending' });
    showSmsToast("Заявка успешно отправлена на модерацию!"); document.getElementById('user-submit-title').value = ''; document.getElementById('user-submit-desc').value = '';
}
