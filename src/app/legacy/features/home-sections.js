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
    const inks = ['#FE5000','#FFC20E','#0067B1','#6D2C91','#00A19A','#00753A','#D7261E','#4C8C2B'];
    const tile = (action, label, ink, photo, all) => {
        const foreground = typeof onInk === 'function' ? onInk(ink) : (['#FE5000','#FFC20E','#00A19A','#4C8C2B'].includes(ink) ? '#111110' : '#FFFFFF');
        return `<button type="button" class="home-cat${all ? ' on' : ''}" onclick="${escHtml(action)}" style="--cat-ink:${ink};--cat-text:${foreground}"><span class="home-cat-label${label.length > 11 ? ' home-cat-label--long' : ''}">${escHtml(label)}</span>${photo ? `<img src="${escHtml(photo)}" alt="" loading="lazy">` : `<span class="home-cat-all"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">${HOME_CAT_ICONS.all}</svg></span>`}</button>`;
    };
    /* V3: each category has its own cut-out picture (public/cat/, generated product shots on transparency) */
    const art = { 'стройматериалы': 'stroymaterialy', 'кухня': 'kuhnya', 'гостиная': 'gostinaya', 'спальня': 'spalnya', 'ванная': 'vannaya', 'мебель': 'mebel', 'декор': 'dekor', 'недвижимость': 'nedvizhimost', 'освещение': 'osveshchenie' };
    let html = tile('openProductCatalogFromHome()', 'Все товары', '#111110', 'cat/all.png', true);
    order.filter(c => has[c]).forEach((c, i) => {
        const meta = typeof pmCategoryMeta === 'function' ? pmCategoryMeta({ category: c }) : { id: c, title: c, chip: c };
        const product = Object.values(productsDb).find(p => p.status === 'published' && String(p.category).toLowerCase() === c);
        html += tile(`openCategoryProducts('${escJsArg(meta.id)}', '${escJsArg(meta.title)}')`, meta.chip, inks[i % inks.length], art[c] ? `cat/${art[c]}.png` : (product && product.image), false);
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
    window.categoryFilters = {};
    window.categorySort = 'popular';
    document.getElementById('main-scroll-container').scrollTop = 0;
    
    renderCategoryProducts();
}


function closeCategoryProducts() {
    document.getElementById('view-category-products').classList.add('hidden');
    window.currentOpenedCategory = null;
    switchTab('catalog'); // Возвращаемся на главную
}


const categoryFilterDefs = [{ key: 'store', label: 'Магазин', type: 'chips' }, { key: 'price', label: 'Цена', type: 'range', unit: '₽' }];

function pickCategoryStore(name) {
    window.categoryFilters = window.categoryFilters || {};
    window.categoryFilters.store = (window.categoryFilters.store || []).includes(name) ? [] : [name];
    renderCategoryProducts();
}

function setCategoryPrice(key, value) {
    window.categoryFilters = window.categoryFilters || {};
    const range = window.categoryFilters.price || {};
    if (value === '') delete range[key]; else range[key] = Number(value);
    window.categoryFilters.price = range;
    renderCategoryProducts(false);
}

function setCategorySort(sort) { window.categorySort = sort; renderCategoryProducts(); }

function renderCategoryProducts(refreshControls) {
    if (!window.currentOpenedCategory) return;
    const products = Object.values(productsDb).filter(p => p.status === 'published' && p.category === window.currentOpenedCategory);
    const state = window.categoryFilters || {};
    const filtered = typeof applyFilters === 'function' ? applyFilters(products, categoryFilterDefs, state) : products.filter(p => !state.store || !state.store.length || state.store.includes(p.store));
    const list = typeof sortProducts === 'function' ? sortProducts(filtered, window.categorySort || 'popular') : filtered;
    const count = document.getElementById('cat-prod-count');
    if (count) count.textContent = list.length + ' товаров';
    const controls = document.getElementById('cat-prod-filters');
    if (controls && refreshControls !== false) {
        const facets = typeof buildFacets === 'function' ? buildFacets(products, categoryFilterDefs) : [];
        controls.innerHTML = facets.map(f => f.type === 'chips' ? `<div class="r-filter-group"><span>${escHtml(f.def.label)}</span><div class="r-filter-chips">${f.values.map(v => `<button type="button" class="r-chip" aria-pressed="${(state.store || []).includes(v.value)}" onclick="pickCategoryStore('${escHtml(escJsArg(v.value))}')">${escHtml(v.value)} <small>${v.count}</small></button>`).join('')}</div></div>` : `<div class="r-filter-group"><span>Цена, ₽</span><div class="r-price-range"><input aria-label="Цена от" class="r-input" type="number" min="0" inputmode="decimal" placeholder="От ${f.min}" value="${state.price && state.price.min !== undefined ? state.price.min : ''}" onchange="setCategoryPrice('min',this.value)"><input aria-label="Цена до" class="r-input" type="number" min="0" inputmode="decimal" placeholder="До ${f.max}" value="${state.price && state.price.max !== undefined ? state.price.max : ''}" onchange="setCategoryPrice('max',this.value)"></div></div>`).join('') + `<div class="r-filter-chips">${[['popular','Популярные'],['cheap','Дешевле'],['expensive','Дороже'],['new','Новинки']].map(([key,label]) => `<button type="button" class="r-chip" aria-pressed="${(window.categorySort || 'popular') === key}" onclick="setCategorySort('${key}')">${label}</button>`).join('')}</div>`;
    }
    const grid = document.getElementById('cat-prod-grid');
    if (grid) grid.innerHTML = list.map(productCardHtml).join('') || '<p class="r-empty">Товары не найдены. Измените фильтры.</p>';
}
