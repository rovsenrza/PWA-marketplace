/* Разделы главной.
   Рекомендации, плитки категорий, экран товаров категории.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


function openRecModal() {
    const m = document.getElementById('rec-modal');
    m.classList.remove('hidden');
    m.classList.add('flex');
}

function closeRecModal() {
    const m = document.getElementById('rec-modal');
    m.classList.add('hidden');
    m.classList.remove('flex');
}


    // ==========================================
// ЛОГИКА ДИНАМИЧЕСКИХ РЕКОМЕНДАЦИЙ И КАТЕГОРИЙ
// ==========================================

function renderRecommendations() {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    // сначала подборка, затем добираем опубликованными товарами для горизонтальной ленты
    const picked = ['prod-8', 'prod-2', 'prod-3', 'prod-5'].filter(id => productsDb[id]);
    for (const key in productsDb) {
        if (picked.length >= 8) break;
        const p = productsDb[key];
        if (!p || p.status !== 'published' || !p.image || picked.includes(p.id)) continue;
        if (typeof pmIsGoods === 'function' && !pmIsGoods(p)) continue;
        picked.push(p.id);
    }
    // карточки ленты — общая ячейка со «спинкой» магазина (src/app/ui/product-cell.ts)
    container.innerHTML = typeof productCellHtml === 'function'
        ? picked.map(id => productCellHtml(productsDb[id], 'rail')).join('')
        : '';
    renderHomeCategories();
}


// Плитки категорий на главной: только те, где есть опубликованные товары
const HOME_CAT_ICONS = {
    all: '<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
    'стройматериалы': '<path d="M3 20h18M5 20V10l7-5 7 5v10"/><path d="M9 20v-6h6v6"/>',
    'кухня': '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 10h16M8 6.5h.01M12 6.5h.01M9 14v3"/>',
    'гостиная': '<path d="M4 12V9a2 2 0 012-2h12a2 2 0 012 2v3"/><path d="M3 12a2 2 0 012 2v2h14v-2a2 2 0 114 0v4H1v-4a2 2 0 012-2zM5 18v2M19 18v2"/>',
    'спальня': '<path d="M3 18V8M21 18v-5a3 3 0 00-3-3h-8v8M3 14h18M3 18h18"/><circle cx="6.5" cy="11.5" r="1.5"/>',
    'ванная': '<path d="M4 12h16v3a5 5 0 01-5 5H9a5 5 0 01-5-5v-3zM6 12V5a2 2 0 014 0M7 20l-1 2M17 20l1 2"/>',
    'декор': '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3z"/>',
    'мебель': '<path d="M5 11V7a3 3 0 013-3h8a3 3 0 013 3v4M3 13a2 2 0 014 0v2h10v-2a2 2 0 014 0v5H3v-5zM6 18v2M18 18v2"/>',
    'недвижимость': '<path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5"/>'
};

function renderHomeCategories() {
    const box = document.getElementById('home-cats');
    if (!box) return;
    const order = ['стройматериалы', 'кухня', 'гостиная', 'спальня', 'ванная', 'мебель', 'декор', 'недвижимость'];
    const has = {};
    for (const key in productsDb) {
        const p = productsDb[key];
        if (p && p.status === 'published' && p.category) has[String(p.category).toLowerCase()] = true;
    }
    const tile = (onclick, icon, label, on) =>
        `<button type="button" role="listitem" class="home-cat${on ? ' on' : ''}" onclick="${onclick}">` +
        `<span class="home-cat-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg></span>` +
        `<span class="home-cat-label">${label}</span></button>`;
    let html = tile('openProductCatalogFromHome()', HOME_CAT_ICONS.all, 'Все', true);
    order.filter(c => has[c]).forEach(c => {
        const meta = typeof pmCategoryMeta === 'function' ? pmCategoryMeta({ category: c }) : { id: c, title: c, chip: c };
        html += tile(`openCategoryProducts('${meta.id}', '${meta.title}')`, HOME_CAT_ICONS[c] || HOME_CAT_ICONS.all, meta.chip, false);
    });
    box.innerHTML = html;
}


function openCategoryProducts(catId, catTitle) {
    closeRecModal();
    // Скрываем все остальные экраны, включая подэкраны каталога и справочника:
    // со страницы товара (чип категории) сюда приходят из «Каталога товаров», и он оставался видимым
    ['catalog','directory','cart','favorites','profile'].forEach(t => {
        const v = document.getElementById('view-' + t);
        if (v) v.classList.add('hidden');
    });
    document.querySelectorAll('[id^="subview-"]').forEach(el => el.classList.add('hidden'));
    
    // Показываем экран выбранной категории
    const view = document.getElementById('view-category-products');
    if (view) view.classList.remove('hidden');
    
    document.getElementById('cat-prod-title').innerText = catTitle;
    window.currentOpenedCategory = catId;
    document.getElementById('main-scroll-container').scrollTop = 0;
    
    renderCategoryProducts();
}


function closeCategoryProducts() {
    document.getElementById('view-category-products').classList.add('hidden');
    window.currentOpenedCategory = null;
    switchTab('catalog'); // Возвращаемся на главную
}


function renderCategoryProducts() {
    if (!window.currentOpenedCategory) return;
    let html = '';
    let found = 0;
    for (const key in productsDb) {
        const prod = productsDb[key];
        if (prod.status !== 'published') continue;
        if (prod.category !== window.currentOpenedCategory) continue;

        found++;
        html += productCardHtml(prod);
    }
    const grid = document.getElementById('cat-prod-grid');
    if (grid) grid.innerHTML = html || `<p class="col-span-2 text-center text-xs text-slate-400 py-6">Товаров в этой категории пока нет</p>`;
}
