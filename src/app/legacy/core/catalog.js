/* Каталог товаров.
   Сетка товаров, поиск, фильтры и сортировка, переход в каталог с главной.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


                function renderProductGrid() {
    let html = '';
    let found = 0;

    const minEl = document.getElementById('filter-price-min');
    const maxEl = document.getElementById('filter-price-max');
    const minPrice = minEl && minEl.value ? parseInt(minEl.value) : null;
    const maxPrice = maxEl && maxEl.value ? parseInt(maxEl.value) : null;

    for (const key in productsDb) {
        const prod = productsDb[key];
        if (prod.status !== 'published') continue;

        if (selectedFilterCategory) {
            const cat = (prod.category || '').toLowerCase();
            const sub = (prod.subcategory || '').toLowerCase();
            const wantCat = selectedFilterCategory.toLowerCase();
            const catMatch = cat.includes(wantCat) || wantCat.includes(cat) || sub.includes(wantCat);
            if (!catMatch) continue;
        }

        if (selectedFilterSub) {
            const cat = (prod.category || '').toLowerCase();
            const sub = (prod.subcategory || '').toLowerCase();
            const wantSub = selectedFilterSub.toLowerCase();
            const subMatch = sub.includes(wantSub) || wantSub.includes(sub) || cat.includes(wantSub);
            if (!subMatch) continue;
        }

        if (minPrice !== null || maxPrice !== null) {
            const numPrice = parsePrice(prod.price); // общий разбор цены: копейки — не лишние разряды
            if (minPrice !== null && numPrice < minPrice) continue;
            if (maxPrice !== null && numPrice > maxPrice) continue;
        }

        found++;
        html += productCardHtml(prod);
    }

    if (found === 0) {
        html = `<div class="col-span-2 text-center py-10 text-slate-400 text-sm">Ничего не найдено</div>`;
    }

    document.getElementById('product-grid').innerHTML = html;
}


        // === ПЕРЕХОД С ГЛАВНОЙ В КАТАЛОГ ТОВАРОВ (категории со стрелками) ===
function openProductCatalogFromHome() {
    // Прячем все главные вкладки
    ['catalog','directory','cart','favorites','profile'].forEach(t => {
        const v = document.getElementById(`view-${t}`);
        if (v) v.classList.add('hidden');
    });
    // Прячем все подэкраны каталога
    ['product_categories','shops','specialists','spec-private','spec-companies','spectech','landscaping','other','other-profiles','designers','companies','jobs','building_materials','finishing_materials','furniture','plumbing','accessories','landscape', 'realestate', 're-agencies', 're-commercial', 're-catalog', 'lifehacks', 'lifehack-article'].forEach(sv => {
        const el = document.getElementById(`subview-${sv}`);
        if (el) el.classList.add('hidden');
    });
    // Показываем экран "Каталог Товаров"
    const cat = document.getElementById('subview-product_categories');
    if (cat) cat.classList.remove('hidden');
    // Подсвечиваем таб "Каталог" в нижнем меню
    ['home','directory','cart','favorites','profile'].forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (btn) btn.className = (t === 'cart')
            ? 'relative flex flex-col items-center justify-center flex-1 py-1 text-slate-400'
            : 'flex flex-col items-center justify-center flex-1 py-1 text-slate-400';
    });
    const dirBtn = document.getElementById('tab-directory');
    if (dirBtn) dirBtn.className = 'flex flex-col items-center justify-center flex-1 py-1 text-blue-600';
    // Прокрутка вверх
    const scroll = document.getElementById('main-scroll-container');
    if (scroll) scroll.scrollTop = 0;
}


        // === ПЕРЕХОД В КАТАЛОГ ТОВАРОВ ПО КНОПКЕ ФИЛЬТР ===
function goToProductCatalog() {
    // Прячем главную страницу
    document.getElementById('view-catalog').classList.add('hidden');
    // Прячем директорию (справочник), чтобы Назад работал правильно
    document.getElementById('view-directory').classList.add('hidden');
    // Показываем каталог товаров
    document.getElementById('subview-product_categories').classList.remove('hidden');
    // Прокрутка вверх
    document.getElementById('main-scroll-container').scrollTop = 0;
    // Очищаем поиск и показываем все товары
    const input = document.getElementById('catalog-search-input');
    if (input) input.value = '';
    renderCatalogProducts('');
}


// === РЕНДЕР ТОВАРОВ В КАТАЛОГЕ ===
function renderCatalogProducts(query) {
    const q = (query || '').toLowerCase();
    let html = '';
    for (const key in productsDb) {
        const prod = productsDb[key];
        if (prod.status !== 'published') continue;
        // Фильтруем по названию, магазину и категории
        const text = (prod.title + ' ' + prod.store + ' ' + (prod.category || '')).toLowerCase();
        if (q && !text.includes(q)) continue;
        html += productCardHtml(prod);
    }
    const grid = document.getElementById('catalog-product-grid');
    if (grid) grid.innerHTML = html || `<p class="col-span-2 text-center text-xs text-slate-400 py-6">Ничего не найдено </p>`;
}


// === ОБРАБОТКА ВВОДА В ПОИСК КАТАЛОГА ===
function handleCatalogSearch() {
    const q = document.getElementById('catalog-search-input').value;
    renderCatalogProducts(q);
}


// Фильтры и Поиск
function toggleQuickSearchFilters() { document.getElementById('quick-search-filters').classList.toggle('hidden'); }

function applySearchQuery(query) { document.getElementById('search-input').value = query; handleSearch(); toggleQuickSearchFilters(); }

function handleSearch() {
    const q = document.getElementById('search-input').value.toLowerCase();
    document.querySelectorAll('.product-card').forEach(c => {
        c.classList.toggle('hidden', !c.innerText.toLowerCase().includes(q));
    });
}

function toggleFilters() { document.getElementById('filter-panel').classList.toggle('hidden'); }

function filterCategory(cat) { document.querySelectorAll('.product-card').forEach(c => c.classList.toggle('hidden', c.dataset.category !== cat)); showSmsToast(`Категория: ${cat}`); }

function resetAllFilters() { document.querySelectorAll('.product-card').forEach(c => c.classList.remove('hidden')); document.getElementById('filter-panel').classList.add('hidden'); }


        // ========== НОВЫЕ ФИЛЬТРЫ (Wildberries-стиль) ==========

// Текущее состояние фильтров
let activeFilters = { category: '', store: '', priceMin: null, priceMax: null, sort: 'popular' };


        // ===== РИСУЕМ ГЛАВНЫЕ КАТЕГОРИИ (Уровень 1) =====
function buildTopFilters() {
    const box = document.getElementById('filter-cat-list');
    if (!box) return;
    let html = '';
    for (const cat in filterCategories) {
        const active = selectedFilterCategory === cat;
        html += `<button onclick="selectFilterCategory('${cat}')" class="px-3 py-1.5 text-xs rounded-full font-bold border ${active ? 'bg-[#1e6091] text-white border-[#1e6091]' : 'bg-white text-slate-600 border-slate-200'}">${cat}</button>`;
    }
    box.innerHTML = html;
    buildSubFilters();
}


// ===== РИСУЕМ ПОДКАТЕГОРИИ (Уровень 2) =====
function buildSubFilters() {
    const box = document.getElementById('filter-sub-list');
    const wrap = document.getElementById('filter-sub-wrap');
    if (!box || !wrap) return;
    if (!selectedFilterCategory) { wrap.classList.add('hidden'); box.innerHTML = ''; return; }
    wrap.classList.remove('hidden');
    let html = '';
    filterCategories[selectedFilterCategory].forEach(sub => {
        const active = selectedFilterSub === sub;
        html += `<button onclick="selectFilterSub('${sub}')" class="px-3 py-1.5 text-xs rounded-full font-bold border ${active ? 'bg-[#1e6091] text-white border-[#1e6091]' : 'bg-white text-slate-600 border-slate-200'}">${sub}</button>`;
    });
    box.innerHTML = html;
}


// ===== КЛИК ПО ГЛАВНОЙ КАТЕГОРИИ =====
function selectFilterCategory(cat) {
    if (selectedFilterCategory === cat) { selectedFilterCategory = null; selectedFilterSub = null; }
    else { selectedFilterCategory = cat; selectedFilterSub = null; }
    buildTopFilters();
}


// ===== КЛИК ПО ПОДКАТЕГОРИИ =====
function selectFilterSub(sub) {
    selectedFilterSub = (selectedFilterSub === sub) ? null : sub;
    buildSubFilters();
}


// ===== ПРИМЕНИТЬ ФИЛЬТР =====
function applyTopFilters() {
    renderProductGrid();
    toggleQuickSearchFilters();
}


// Выбрать категорию в фильтре (подсветка)
function pickFilterCat(cat) {
    activeFilters.category = cat;
    document.querySelectorAll('.fcat-btn').forEach(b => {
        const on = b.dataset.cat === cat;
        b.className = 'fcat-btn text-[11px] px-3 py-1.5 rounded-lg font-bold capitalize ' + (on ? 'bg-[#1e6091] text-white' : 'bg-white border border-slate-200 text-slate-700');
    });
}


// Выбрать магазин в фильтре (подсветка)
function pickFilterStore(store) {
    activeFilters.store = store;
    document.querySelectorAll('.fstore-btn').forEach(b => {
        const on = b.dataset.store === store;
        b.className = 'fstore-btn text-[11px] px-3 py-1.5 rounded-lg font-bold ' + (on ? 'bg-[#1e6091] text-white' : 'bg-white border border-slate-200 text-slate-700');
    });
}


// Сбросить верхние фильтры
function resetTopFilters() {
    activeFilters = { category: '', store: '', priceMin: null, priceMax: null, sort: activeFilters.sort };
    document.getElementById('filter-price-min').value = '';
    document.getElementById('filter-price-max').value = '';
    pickFilterCat('');
    pickFilterStore('');
    renderFilteredGrid();
    showSmsToast('Фильтры сброшены ');
}


// === СОРТИРОВКА (нижняя панель) ===
function applySort(mode) {
    activeFilters.sort = mode;
    // Подсветка активной кнопки сортировки
    document.querySelectorAll('.sort-btn').forEach(b => {
        b.className = 'sort-btn text-[11px] bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold';
    });
    const btn = document.getElementById('sort-' + mode);
    if (btn) btn.className = 'sort-btn text-[11px] bg-[#1e6091] text-white px-3 py-1.5 rounded-lg font-bold';

    renderFilteredGrid();
}


// === ГЛАВНАЯ ФУНКЦИЯ: собрать товары с учётом всех фильтров и сортировки ===
function renderFilteredGrid() {
    let list = [];
    for (const k in productsDb) {
        const p = productsDb[k];
        if (p.status !== 'published') continue;

        // Фильтр по категории
        if (activeFilters.category && p.category !== activeFilters.category) continue;
        // Фильтр по магазину
        if (activeFilters.store && p.store !== activeFilters.store) continue;
        // Фильтр по цене
        const priceNum = parsePrice(p.price);
        if (activeFilters.priceMin !== null && priceNum < activeFilters.priceMin) continue;
        if (activeFilters.priceMax !== null && priceNum > activeFilters.priceMax) continue;

        list.push(p);
    }

    // Сортировка
    const s = activeFilters.sort;
    if (s === 'cheap') list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    else if (s === 'expensive') list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    else if (s === 'name') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (s === 'new') list.reverse(); // новинки = последние добавленные
    // 'popular' — оставляем как есть

    // Рисуем карточки
    let html = '';
    list.forEach(prod => {
        html += productCardHtml(prod);
    });

    const grid = document.getElementById('product-grid');
    if (grid) grid.innerHTML = html || `<p class="col-span-2 text-center text-xs text-slate-400 py-6">Товары не найдены </p>`;
}
