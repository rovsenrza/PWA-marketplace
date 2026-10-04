/* Доп. функции приложения.
   Обратная связь, ассистент (UI), рекомендации и категории, калькуляторы ремонта, агентства.
   Классический скрипт (не модуль): функции глобальные, их вызывают inline-обработчики разметки.
   Сборка: плагин legacy-scripts в vite.config.ts (минификация без переименования, хэш в имени). */

    function openFeedbackModal() {
        const m = document.getElementById('feedback-modal');
        if (!m) return;
        m.classList.remove('hidden');
        m.classList.add('flex');
    }
    function closeFeedbackModal() {
        const m = document.getElementById('feedback-modal');
        if (!m) return;
        m.classList.add('hidden');
        m.classList.remove('flex');
    }
    function openFeedbackChannel(kind) {
        const url = (typeof FEEDBACK_LINKS !== 'undefined' && FEEDBACK_LINKS[kind]) ? FEEDBACK_LINKS[kind] : '';
        if (!url) return;
        window.open(url, '_blank');
    }

    var ASSISTANT_CHIPS = [
        'Мне нужна штукатурка и расходные материалы',
        'Кровать 2×2 м за 20–30 тыс. и матрас',
        'Кухня до 200 тысяч'
    ];

    function assistantEsc(s) {
        return String(s || '').replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }

    function openAssistant() {
        var sheet = document.getElementById('assistant-sheet');
        var tab = document.getElementById('assistant-side-tab');
        if (!sheet) return;
        sheet.classList.remove('hidden');
        sheet.classList.add('flex');
        if (tab) tab.hidden = true;
        var thread = document.getElementById('assistant-thread');
        if (thread && !thread.dataset.ready) {
            thread.dataset.ready = '1';
            appendAssistantBot('Здравствуйте. Опишите задачу — подберу товары из каталога всех магазинов. Можно указать размер, бюджет и материалы.');
            renderAssistantChips();
        }
        setTimeout(function () {
            var inp = document.getElementById('assistant-input');
            if (inp) inp.focus();
        }, 200);
    }

    function closeAssistant() {
        var sheet = document.getElementById('assistant-sheet');
        var tab = document.getElementById('assistant-side-tab');
        if (sheet) {
            sheet.classList.add('hidden');
            sheet.classList.remove('flex');
        }
        if (tab) tab.hidden = false;
    }

    function renderAssistantChips() {
        var wrap = document.getElementById('assistant-chips');
        if (!wrap) return;
        wrap.innerHTML = ASSISTANT_CHIPS.map(function (t) {
            return '<button type="button" class="shrink-0 text-[11px] font-semibold text-[#1e6091] bg-[#e8f1f8] px-3 py-1.5 rounded-full" onclick="assistantFillChip(this)">' + assistantEsc(t) + '</button>';
        }).join('');
    }

    function assistantFillChip(btn) {
        var inp = document.getElementById('assistant-input');
        if (!inp || !btn) return;
        inp.value = btn.textContent;
        sendAssistantQuery();
    }

    function appendAssistantUser(text) {
        var thread = document.getElementById('assistant-thread');
        if (!thread) return;
        var d = document.createElement('div');
        d.className = 'as-msg as-msg-user rounded-2xl rounded-tr-md px-3 py-2 text-[13px] leading-relaxed';
        d.textContent = text;
        thread.appendChild(d);
        thread.scrollTop = thread.scrollHeight;
    }

    function appendAssistantBot(text) {
        var thread = document.getElementById('assistant-thread');
        if (!thread) return;
        var d = document.createElement('div');
        d.className = 'as-msg as-msg-bot rounded-2xl rounded-tl-md px-3 py-2 text-[13px] leading-relaxed';
        d.textContent = text;
        thread.appendChild(d);
        thread.scrollTop = thread.scrollHeight;
    }

    function assistantOpenProduct(id) {
        var pm = document.getElementById('product-modal');
        if (pm) pm.style.zIndex = '150';
        if (typeof openProductModal === 'function') openProductModal(id);
    }

    function assistantOpenLifehack(id) {
        closeAssistant();
        if (typeof openLifehackArticle === 'function') openLifehackArticle(id);
    }

    function renderAssistantResults(res) {
        var thread = document.getElementById('assistant-thread');
        if (!thread || !res) return;
        var products = res.products || [];
        var hacks = res.lifehacks || [];
        if (products.length) {
            var wrap = document.createElement('div');
            wrap.className = 'space-y-2';
            products.forEach(function (p) {
                var traits = (window.AssistantAI && AssistantAI.traits) ? AssistantAI.traits(p) : (p.category || '');
                var card = document.createElement('button');
                card.type = 'button';
                card.className = 'as-prod-card w-full text-left bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex gap-3 p-2';
                card.onclick = function () { assistantOpenProduct(p.id); };
                card.innerHTML =
                    '<img src="' + assistantEsc(p.image || '') + '" alt="" class="w-[72px] h-[72px] object-cover rounded-xl bg-slate-100 shrink-0">' +
                    '<div class="min-w-0 flex-1 py-0.5">' +
                    '<p class="text-[13px] font-bold text-slate-900 line-clamp-2 leading-snug">' + assistantEsc(p.title) + '</p>' +
                    '<p class="text-[14px] font-extrabold text-[#1e6091] mt-0.5">' + assistantEsc(p.price) + '</p>' +
                    '<p class="text-[11px] text-slate-400 mt-0.5">' + assistantEsc(p.store || '') + '</p>' +
                    (traits ? '<p class="text-[11px] text-slate-500 mt-0.5 line-clamp-2">' + assistantEsc(traits) + '</p>' : '') +
                    '</div>';
                wrap.appendChild(card);
            });
            thread.appendChild(wrap);
        }
        if (hacks.length) {
            hacks.forEach(function (h) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'as-msg as-msg-bot w-full text-left rounded-2xl px-3 py-2 text-[12px]';
                b.innerHTML = '<span class="text-[10px] font-bold uppercase text-[#1e6091]">Лайфхак</span><p class="font-semibold mt-0.5">' + assistantEsc(h.title) + '</p>';
                b.onclick = function () { assistantOpenLifehack(h.id); };
                thread.appendChild(b);
            });
        }
        thread.scrollTop = thread.scrollHeight;
    }

    function sendAssistantQuery(e) {
        if (e) e.preventDefault();
        var inp = document.getElementById('assistant-input');
        var text = inp ? String(inp.value || '').trim() : '';
        if (!text) return false;
        if (inp) inp.value = '';
        appendAssistantUser(text);
        var ctx = {
            products: (typeof productsDb !== 'undefined' ? productsDb : window.productsDb) || {},
            lifehacks: (typeof lifehacksDb !== 'undefined' ? lifehacksDb : window.lifehacksDb) || []
        };
        var run = (window.AssistantAI && AssistantAI.ask)
            ? AssistantAI.ask(text, ctx)
            : Promise.resolve({ message: 'Помощник загружается. Обновите страницу.', products: [], lifehacks: [] });
        run.then(function (res) {
            appendAssistantBot(res.message || 'Готово.');
            renderAssistantResults(res);
        });
        return false;
    }

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
    const esc = typeof pmEsc === 'function' ? pmEsc : (v => String(v || ''));
    const heart = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>';
    let html = '';
    picked.forEach(id => {
        const prod = productsDb[id];
        const isFav = state.favorites && state.favorites.includes(prod.id);
        const inCart = cartHasProduct(prod.id);
        const meta = typeof pmCategoryMeta === 'function' ? pmCategoryMeta(prod).chip : (prod.category || '');
        const badge = (prod.badge === 'sale' && prod.oldPrice) ? '<span class="rec-sale">Скидка</span>' : '';
        html += `
        <div class="rec-card cursor-pointer" onclick="openProductModal('${prod.id}')">
            <div class="rec-photo relative overflow-hidden">
                <img src="${esc(prod.image)}" class="w-full h-full object-cover" alt="${esc(prod.title)}" loading="lazy">
                ${badge}
                <button type="button" onclick="event.stopPropagation(); toggleFavorite('${prod.id}')" class="rec-fav lg lg--circle${isFav ? ' on' : ''}" aria-label="${isFav ? 'Убрать из избранного' : 'В избранное'}" aria-pressed="${isFav ? 'true' : 'false'}">
                    <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor">${heart}</svg>
                </button>
            </div>
            <div class="rec-body">
                <div class="rec-price-row">
                    <span class="rec-price">${esc(prod.price)}</span>
                    ${prod.oldPrice ? `<span class="rec-old">${esc(prod.oldPrice)}</span>` : ''}
                </div>
                <h5 class="rec-title">${esc(prod.title)}</h5>
                <p class="rec-meta">${esc(meta)}</p>
                <p class="rec-store">${esc(prod.store || '')}</p>
            </div>
            <button type="button" onclick="event.stopPropagation(); addToCart('${prod.id}')" class="rec-add${inCart ? ' in' : ''}" aria-label="${inCart ? 'В корзине' : 'В корзину'}">
                ${inCart
                    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4" d="M5 13l4 4L19 7"/></svg>'
                    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-width="2.4" d="M12 5v14M5 12h14"/></svg>'}
            </button>
        </div>`;
    });
    container.innerHTML = html;
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

window.currentOpenedCategory = null;

function openCategoryProducts(catId, catTitle) {
    closeRecModal();
    // Скрываем все остальные экраны
    ['catalog','directory','cart','favorites','profile'].forEach(t => {
        const v = document.getElementById('view-' + t);
        if (v) v.classList.add('hidden');
    });
    
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

// ПЕРЕЗАПИСЫВАЕМ ФУНКЦИИ ИЗБРАННОГО И КОРЗИНЫ (чтобы они обновляли новые экраны)
const _oldToggleFavorite = toggleFavorite;
toggleFavorite = function(prodId) {
    _oldToggleFavorite(prodId);
    if (typeof renderRecommendations === 'function') renderRecommendations();
    if (typeof renderCategoryProducts === 'function') renderCategoryProducts();
    if (typeof pmRefreshFav === 'function') pmRefreshFav();
    if (typeof renderPmSimilar === 'function') renderPmSimilar();
    if (typeof renderPmRecent === 'function') renderPmRecent();
};

const _oldAddToCart = addToCart;
addToCart = function(prodId, qty) {
    _oldAddToCart(prodId, qty);
    if (typeof renderRecommendations === 'function') renderRecommendations();
    if (typeof renderCategoryProducts === 'function') renderCategoryProducts();
    if (typeof pmRefreshCart === 'function') pmRefreshCart();
    if (typeof renderPmSimilar === 'function') renderPmSimilar();
    if (typeof renderPmRecent === 'function') renderPmRecent();
};

// Загружаем рекомендации при старте
const _oldOnLoad = window.onload;
window.onload = function() {
    if (_oldOnLoad) _oldOnLoad();
    renderRecommendations();
};


// === ЛОГИКА КАЛЬКУЛЯТОРОВ ===
function openSpecificCalc(title) {
    document.getElementById('subview-calculator').classList.add('hidden');
    document.getElementById('subview-specific-calc').classList.remove('hidden');
    document.getElementById('specific-calc-title').innerText = title;
    document.getElementById('main-scroll-container').scrollTop = 0;
    
    const tileBlock = document.getElementById('calc-content-tile');
    const lamBlock = document.getElementById('calc-content-laminate');
    const placeholderBlock = document.getElementById('calc-content-placeholder');
    
    const plasterBlock = document.getElementById('calc-content-plaster');
    const repairBlock = document.getElementById('calc-content-repair');
    
    if (tileBlock) tileBlock.classList.add('hidden');
    if (lamBlock) lamBlock.classList.add('hidden');
    if (plasterBlock) plasterBlock.classList.add('hidden');
    if (repairBlock) repairBlock.classList.add('hidden');
    if (placeholderBlock) placeholderBlock.classList.add('hidden');

    if (title === 'Онлайн Калькулятор Плитки') {
        if (tileBlock) tileBlock.classList.remove('hidden');
    } else if (title === 'Онлайн Калькулятор Ламинат') {
        if (lamBlock) lamBlock.classList.remove('hidden');
    } else if (title === 'Онлайн Калькулятор Штукатурки') {
        if (plasterBlock) plasterBlock.classList.remove('hidden');
        if (typeof pcInit === 'function') pcInit();
    } else if (title === 'Онлайн Калькулятор Расчет Работы Ремонта') {
        if (repairBlock) repairBlock.classList.remove('hidden');
        if (typeof rcInit === 'function') rcInit();
    } else {
        if (placeholderBlock) placeholderBlock.classList.remove('hidden');
    }
}

function backToCalcList() {
    document.getElementById('subview-specific-calc').classList.add('hidden');
    document.getElementById('subview-calculator').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
}

// === ПЛИТКА ===
function switchTileCalcTab(tab) {
    ['floor', 'walls', 'apron'].forEach(t => {
        const btn = document.getElementById('calc-tab-' + t);
        if(t === tab) btn.className = 'flex-1 py-1.5 text-[11px] font-bold rounded-lg bg-white text-[#1e6091] shadow-sm transition-all';
        else btn.className = 'flex-1 py-1.5 text-[11px] font-bold rounded-lg text-slate-400 transition-all';
    });
    
    if (tab === 'walls') {
        document.getElementById('tc-room-l').value = 5; document.getElementById('tc-room-w').value = 2.5; 
        document.getElementById('tc-tile-l').value = 30; document.getElementById('tc-tile-w').value = 20;
    } else if (tab === 'apron') {
        document.getElementById('tc-room-l').value = 3; document.getElementById('tc-room-w').value = 0.6; 
        document.getElementById('tc-tile-l').value = 20; document.getElementById('tc-tile-w').value = 10;
    } else {
        document.getElementById('tc-room-l').value = 3; document.getElementById('tc-room-w').value = 2;
        document.getElementById('tc-tile-l').value = 60; document.getElementById('tc-tile-w').value = 60;
    }
    document.getElementById('tc-results-block').classList.add('hidden');
}

function selectTileMethod(method) {
    document.getElementById('tc-lay-method').value = method;
    const activeCls = 'lay-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-[#1e6091] bg-[#1e6091]/5 text-[#1e6091] transition-all';
    const inactiveCls = 'lay-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-transparent bg-white text-slate-500 shadow-sm transition-all hover:border-slate-200';

    ['straight', 'offset', 'diagonal'].forEach(m => {
        const btn = document.getElementById('lay-' + m);
        if (btn) btn.className = (m === method) ? activeCls : inactiveCls;
    });

    const resInput = document.getElementById('tc-reserve');
    if (method === 'straight') resInput.value = '5';
    else if (method === 'offset') resInput.value = '10';
    else if (method === 'diagonal') resInput.value = '15';

    if (!document.getElementById('tc-results-block').classList.contains('hidden')) calculateTile();
}

function calculateTile() {
    const rL = parseFloat(document.getElementById('tc-room-l').value) || 0;
    const rW = parseFloat(document.getElementById('tc-room-w').value) || 0;
    const tL = parseFloat(document.getElementById('tc-tile-l').value) || 0;
    const tW = parseFloat(document.getElementById('tc-tile-w').value) || 0;
    const gap = parseFloat(document.getElementById('tc-gap').value) || 0;
    const res = parseFloat(document.getElementById('tc-reserve').value) || 0;
    const pack = parseFloat(document.getElementById('tc-pack').value) || 1;
    const method = document.getElementById('tc-lay-method').value;

    if (rL === 0 || rW === 0 || tL === 0 || tW === 0) return;

    const area = rL * rW;
    const tL_m = (tL * 10 + gap) / 1000;
    const tW_m = (tW * 10 + gap) / 1000;
    
    const baseCount = Math.ceil(area / (tL_m * tW_m)); 
    const totalCount = Math.ceil(baseCount * (1 + (res / 100))); 
    const packsCount = Math.ceil(totalCount / pack);

    document.getElementById('tc-res-area').innerText = area.toFixed(2) + ' м²';
    document.getElementById('tc-res-count').innerText = baseCount + ' шт';
    document.getElementById('tc-res-total').innerText = totalCount + ' шт';
    document.getElementById('tc-res-packs').innerText = packsCount + ' упаковок';

    drawGrid('tc-scheme-canvas', rL, rW, tL*10, tW*10, gap, method, false);

    document.getElementById('tc-results-block').classList.remove('hidden');
    setTimeout(() => { document.getElementById('main-scroll-container').scrollBy({ top: 400, behavior: 'smooth' }); }, 100);
}

// === ЛАМИНАТ ===
function selectLaminateMethod(method) {
    document.getElementById('lc-lay-method').value = method;
    const activeCls = 'lay-lam-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-[#1e6091] bg-[#1e6091]/5 text-[#1e6091] transition-all';
    const inactiveCls = 'lay-lam-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-transparent bg-white text-slate-500 shadow-sm transition-all hover:border-slate-200';

    ['straight', 'diagonal', 'half', 'third'].forEach(m => {
        const btn = document.getElementById('lay-lam-' + m);
        if (btn) btn.className = (m === method) ? activeCls : inactiveCls;
    });

    const resInput = document.getElementById('lc-reserve');
    if (method === 'straight') resInput.value = '5';
    else if (method === 'diagonal') resInput.value = '15';
    else if (method === 'half') resInput.value = '7';
    else if (method === 'third') resInput.value = '10';

    if (!document.getElementById('lc-results-block').classList.contains('hidden')) calculateLaminate();
}

function calculateLaminate() {
    const rL = parseFloat(document.getElementById('lc-room-l').value) || 0;
    const rW = parseFloat(document.getElementById('lc-room-w').value) || 0;
    const lL = parseFloat(document.getElementById('lc-tile-l').value) || 0;
    const lW = parseFloat(document.getElementById('lc-tile-w').value) || 0;
    const res = parseFloat(document.getElementById('lc-reserve').value) || 0;
    const pack = parseFloat(document.getElementById('lc-pack').value) || 1;
    const method = document.getElementById('lc-lay-method').value;
    const gap = parseFloat(document.getElementById('lc-gap').value) || 0;

    if (rL === 0 || rW === 0 || lL === 0 || lW === 0) return;

    // Площадь комнаты (с учетом отступов от стен)
    const L_m = rL - (gap * 2 / 1000);
    const W_m = rW - (gap * 2 / 1000);
    const area = (L_m > 0 && W_m > 0) ? (L_m * W_m) : 0;
    
    const panelArea = (lL * lW) / 1000000;
    
    const baseCount = Math.ceil(area / panelArea); 
    const totalCount = Math.ceil(baseCount * (1 + (res / 100))); 
    const packsCount = Math.ceil(totalCount / pack);

    document.getElementById('lc-res-area').innerText = area.toFixed(2) + ' м²';
    document.getElementById('lc-res-count').innerText = baseCount + ' шт';
    document.getElementById('lc-res-total').innerText = totalCount + ' шт';
    document.getElementById('lc-res-packs').innerText = packsCount + ' упаковок';

    // Для ламината зазор между досками = 0
    drawGrid('lc-scheme-canvas', L_m, W_m, lL, lW, 0, method, true);

    document.getElementById('lc-results-block').classList.remove('hidden');
    setTimeout(() => { document.getElementById('main-scroll-container').scrollBy({ top: 400, behavior: 'smooth' }); }, 100);
}

// === КАЛЬКУЛЯТОР ШТУКАТУРКИ (СтройКальк, синяя тема) ===
let pcStep = 1;
let pcMethod = 'room';
let pcMixId = 'gips';
const PC_MIXES = [
    { id: 'gips', name: 'Гипсовая, 8,5 кг/м² на 10 мм', cons: 8.5, short: 'Гипсовая' },
    { id: 'cement', name: 'Цементная, 16 кг/м² на 10 мм', cons: 16, short: 'Цементная' },
    { id: 'lime', name: 'Цементно-известковая, 14 кг/м² на 10 мм', cons: 14, short: 'Цементно-известковая' },
    { id: 'facade', name: 'Фасадная, 15 кг/м² на 10 мм', cons: 15, short: 'Фасадная' }
];

function pcN(id) {
    const el = document.getElementById(id);
    return el ? (parseFloat(String(el.value).replace(',', '.')) || 0) : 0;
}
function pcRu(n, d) {
    if (n == null || isNaN(n)) return '—';
    return n.toLocaleString('ru-RU', { maximumFractionDigits: d, minimumFractionDigits: d === 0 ? 0 : undefined });
}
function pcRub(n) {
    return Math.round(n).toLocaleString('ru-RU') + ' ₽';
}
function pcWallLengths() {
    const L = pcN('pc-len'), W = pcN('pc-wid');
    const longS = Math.max(L, W), shortS = Math.min(L, W);
    const mode = (document.getElementById('pc-walls') || {}).value || '4';
    if (mode === '1L') return [longS];
    if (mode === '1S') return [shortS];
    if (mode === '2L') return [longS, longS];
    if (mode === '2S') return [shortS, shortS];
    return [L, L, W, W];
}
function pcBeaconM(wallLens, step, height) {
    const st = step > 0 ? step : 1.2;
    const lines = wallLens.reduce((s, len) => s + Math.floor(len / st) + 2, 0);
    return { lines, meters: lines * height };
}
function pcCompute() {
    const H = pcMethod === 'room' ? pcN('pc-h') : pcN('pc-h2');
    const extra = pcMethod === 'room' ? pcN('pc-extra') : 0;
    let walls, peri, gross;
    if (pcMethod === 'room') {
        walls = pcWallLengths();
        peri = walls.reduce((s, x) => s + x, 0);
        gross = peri * H + extra;
    } else {
        peri = pcN('pc-peri');
        gross = pcN('pc-area-gross');
        const side = peri > 0 ? peri / 4 : 0;
        walls = side ? [side, side, side, side] : [];
    }
    const winN = pcN('pc-win-n'), doorN = pcN('pc-door-n');
    const openings = winN * pcN('pc-win-a') + doorN * pcN('pc-door-a');
    const net = Math.max(0, gross - openings);
    const thick = pcN('pc-thick');
    const mixRes = pcN('pc-mix-res') / 100;
    const cons = pcN('pc-cons');
    const bagKg = pcN('pc-bag') || 30;
    const mixKg = net * cons * (thick / 10) * (1 + mixRes);
    const bags = mixKg > 0 ? Math.ceil(mixKg / bagKg) : 0;
    const mixCost = bags * pcN('pc-price-bag');
    const primL = net * pcN('pc-prim-r');
    const primCost = primL * pcN('pc-price-prim');
    const beacons = pcBeaconM(walls, pcN('pc-beacon-step'), H);
    const beaconCost = beacons.meters * pcN('pc-price-beacon');
    const meshPct = pcN('pc-mesh-pct') / 100;
    const meshM2 = net * meshPct;
    const meshCost = meshM2 * pcN('pc-price-mesh');
    const openCnt = winN + doorN;
    const cornersM = openCnt * pcN('pc-open-h') * 2;
    const cornerCost = cornersM * pcN('pc-price-corner');
    const workCost = net * pcN('pc-price-work');
    const deliv = pcN('pc-price-deliv');
    const materials = mixCost + primCost + beaconCost + meshCost + cornerCost;
    const sub = materials + workCost + deliv;
    const budgetPct = pcN('pc-budget-res');
    const reserve = sub * (budgetPct / 100);
    const total = sub + reserve;
    const mix = PC_MIXES.find(m => m.id === pcMixId) || PC_MIXES[0];
    const scheme = pcMethod === 'room' ? 'По размерам помещения' : 'По площади стен';
    return {
        scheme, peri, H, gross, openings, net, thick, mixKg, bags, bagKg, mixCost, mix,
        primL, primCost, beacons, beaconCost, meshM2, meshCost, meshPct, cornersM, cornerCost, openCnt,
        workCost, deliv, materials, reserve, budgetPct, total, winN, doorN, extra
    };
}
function pcInit() {
    pcStep = 1;
    pcMethod = 'room';
    pcMixId = 'gips';
    const list = document.getElementById('pc-mix-list');
    if (list && !list.dataset.ready) {
        list.innerHTML = PC_MIXES.map(m => `
            <button type="button" id="pc-mix-${m.id}" onclick="pcSetMix('${m.id}')" class="w-full text-left p-3 rounded-xl border-2 ${m.id === 'gips' ? 'border-[#1e6091] bg-[#1e6091]/5' : 'border-slate-100'}">
                <p class="font-bold text-[12px]">${m.name}</p>
            </button>`).join('');
        list.dataset.ready = '1';
    }
    pcSetMethod('room');
    pcSetMix('gips');
    pcGoStep(1);
    pcLive();
}
function pcReset() {
    const vals = {
        'pc-len': 6, 'pc-wid': 3, 'pc-h': 2.8, 'pc-extra': 0, 'pc-open-h': 2,
        'pc-area-gross': 50.4, 'pc-peri': 18, 'pc-h2': 2.8,
        'pc-win-n': 1, 'pc-win-a': 1.8, 'pc-door-n': 1, 'pc-door-a': 2.1, 'pc-thick': 15, 'pc-mix-res': 10,
        'pc-cons': 8.5, 'pc-bag': 30, 'pc-prim-r': 0.15, 'pc-beacon-step': 1.2, 'pc-mesh-pct': 0, 'pc-budget-res': 5,
        'pc-price-bag': 420, 'pc-price-prim': 90, 'pc-price-beacon': 35, 'pc-price-mesh': 80, 'pc-price-corner': 55, 'pc-price-work': 550, 'pc-price-deliv': 2500
    };
    Object.keys(vals).forEach(id => { const el = document.getElementById(id); if (el) el.value = vals[id]; });
    const w = document.getElementById('pc-walls'); if (w) w.value = '4';
    pcInit();
    if (typeof showSmsToast === 'function') showSmsToast('Параметры сброшены');
}
function pcSetMethod(m) {
    pcMethod = m;
    const room = document.getElementById('pc-method-room');
    const area = document.getElementById('pc-method-area');
    if (room) room.className = 'w-full text-left p-3.5 rounded-2xl border-2 relative ' + (m === 'room' ? 'border-[#1e6091] bg-[#1e6091]/5' : 'border-slate-100 bg-white');
    if (area) area.className = 'w-full text-left p-3.5 rounded-2xl border-2 relative ' + (m === 'area' ? 'border-[#1e6091] bg-[#1e6091]/5' : 'border-slate-100 bg-white');
    if (room) {
        let mark = room.querySelector('.pc-check');
        if (m === 'room') {
            if (!mark) { mark = document.createElement('span'); mark.className = 'pc-check absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1e6091] text-white text-[10px] flex items-center justify-center'; mark.textContent = '✓'; room.appendChild(mark); }
        } else if (mark) mark.remove();
    }
    if (area) {
        let mark = area.querySelector('.pc-check');
        if (m === 'area') {
            if (!mark) { mark = document.createElement('span'); mark.className = 'pc-check absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1e6091] text-white text-[10px] flex items-center justify-center'; mark.textContent = '✓'; area.appendChild(mark); }
        } else if (mark) mark.remove();
    }
    const boxR = document.getElementById('pc-box-room');
    const boxA = document.getElementById('pc-box-area');
    if (boxR) boxR.classList.toggle('hidden', m !== 'room');
    if (boxA) boxA.classList.toggle('hidden', m !== 'area');
    pcLive();
}
function pcSetMix(id) {
    pcMixId = id;
    const mix = PC_MIXES.find(x => x.id === id);
    if (mix) {
        const c = document.getElementById('pc-cons');
        if (c) c.value = mix.cons;
    }
    PC_MIXES.forEach(m => {
        const btn = document.getElementById('pc-mix-' + m.id);
        if (btn) btn.className = 'w-full text-left p-3 rounded-xl border-2 ' + (m.id === id ? 'border-[#1e6091] bg-[#1e6091]/5' : 'border-slate-100');
    });
    pcLive();
}
function pcGoStep(n) {
    if (n < 1 || n > 5) return;
    pcStep = n;
    for (let i = 1; i <= 5; i++) {
        const p = document.getElementById('pc-step-' + i);
        const t = document.getElementById('pc-tab-' + i);
        if (p) p.classList.toggle('hidden', i !== n);
        if (t) {
            const on = i === n;
            t.className = 'pc-tab w-full min-w-0 py-1 px-0 rounded-md text-center ' + (on ? 'border-b-2 border-[#1e6091] bg-[#1e6091]/10' : '');
            const num = t.querySelector('span:first-child');
            const labSpan = t.querySelector('span:last-child');
            if (num) num.className = 'block text-[11px] font-extrabold leading-none ' + (on ? 'text-[#1e6091]' : 'text-slate-400');
            if (labSpan) labSpan.className = 'block text-[8px] font-bold leading-tight mt-0.5 ' + (on ? 'text-slate-800' : 'text-slate-400');
        }
    }
    const pct = n * 20;
    const bar = document.getElementById('pc-progress');
    const lab = document.getElementById('pc-step-label');
    const pctEl = document.getElementById('pc-step-pct');
    if (bar) bar.style.width = pct + '%';
    if (lab) lab.textContent = 'Шаг ' + n + ' из 5';
    if (pctEl) pctEl.textContent = pct + '%';
    const back = document.getElementById('pc-btn-back');
    const next = document.getElementById('pc-btn-next');
    if (back) back.classList.toggle('hidden', n === 1);
    if (next) {
        next.classList.toggle('hidden', n === 5);
        next.textContent = 'Далее';
    }
    if (n === 5) pcRenderResults();
    const sc = document.getElementById('main-scroll-container');
    if (sc) sc.scrollTop = 0;
}
function pcLive() {
    if (pcStep === 5) pcRenderResults();
}
function pcFocusStep(step, msg) {
    pcGoStep(step);
    if (msg && typeof showSmsToast === 'function') showSmsToast(msg);
}
function pcPrintEstimate() {
    window.print();
}
function pcArt(id) {
    const files = { area: 'pc-area.png', mix: 'pc-mix.png', volume: 'pc-volume.png', primer: 'pc-primer.png', beacons: 'pc-beacons.png', total: 'pc-total.png' };
    const src = 'pc-arts/' + (files[id] || '');
    return `<img src="${src}" alt="" class="w-[88px] h-[88px] object-contain mx-auto mb-1 pointer-events-none">`;
}
function pcRenderResults() {
    const r = pcCompute();
    const cards = document.getElementById('pc-result-cards');
    if (!cards) return;
    const items = [
        { step: 2, title: 'Площадь штукатурки', val: pcRu(r.net, 1) + ' м²', sub: 'проёмы ' + pcRu(r.openings, 1) + ' м², брутто ' + pcRu(r.gross, 1) + ' м²', art: 'area' },
        { step: 3, title: 'Штукатурная смесь', val: r.bags + ' шт.', sub: pcRu(r.mixKg, 0) + ' кг, ' + r.bagKg + ' кг/меш.', art: 'mix' },
        { step: 2, title: 'Объём слоя', val: pcRu(r.net * (r.thick / 1000), 1) + ' м³', sub: 'средний слой ' + r.thick + ' мм', art: 'volume' },
        { step: 3, title: 'Грунтовка', val: pcRu(r.primL, 1) + ' л', sub: 'по площади стен', art: 'primer' },
        { step: 3, title: 'Маяки и уголки', val: pcRu(r.beacons.meters, 1) + ' / ' + pcRu(r.cornersM, 1) + ' м', sub: r.beacons.lines + ' линий маяков', art: 'beacons' },
        { step: 4, title: 'Результат', val: pcRub(r.total), sub: 'с резервом бюджета', art: 'total', hl: true }
    ];
    cards.innerHTML = items.map(c => `
        <button type="button" onclick="pcFocusStep(${c.step}, '${c.title}')" class="text-center rounded-2xl border p-3 ${c.hl ? 'border-[#1e6091] bg-[#e8f1f8]' : 'border-slate-200 bg-white'}">
            ${pcArt(c.art)}
            <p class="text-[10px] font-bold text-slate-800">${c.title}</p>
            <p class="text-[16px] font-bold">${c.val}</p>
            <p class="text-[10px] text-slate-400 mt-0.5">${c.sub}</p>
        </button>`).join('');
    const sum = document.getElementById('pc-summary-cards');
    const sItems = [
        { t: 'Проёмы', v: pcRu(r.openings, 1) + ' м²', s: 2 },
        { t: 'Сетка', v: r.meshPct > 0 ? pcRu(r.meshM2, 1) + ' м²' : '—', s: 3 },
        { t: 'Материалы', v: pcRub(r.materials), s: 4 },
        { t: 'Работы', v: pcRub(r.workCost), s: 4 },
        { t: 'Доставка', v: pcRub(r.deliv), s: 4 },
        { t: 'Резерв', v: pcRub(r.reserve), s: 4 }
    ];
    if (sum) sum.innerHTML = sItems.map(x => `
        <button type="button" onclick="pcFocusStep(${x.s}, '${x.t}')" class="text-left rounded-xl border border-slate-200 p-2.5 bg-white">
            <p class="text-[10px] font-bold text-slate-500">${x.t}</p>
            <p class="text-[14px] font-bold">${x.v}</p>
        </button>`).join('');
    const body = document.getElementById('pc-estimate-body');
    const rows = [
        { name: 'Схема расчёта', vol: r.scheme, cost: '—', com: pcRu(r.peri, 1) + ' пог. м × ' + pcRu(r.H, 1) + ' м', s: 1 },
        { name: 'Площадь стен брутто', vol: pcRu(r.gross, 1) + ' м²', cost: '—', com: 'до вычета окон и дверей', s: 2 },
        { name: 'Проёмы', vol: pcRu(r.openings, 1) + ' м²', cost: '—', com: r.winN + ' шт. окон, ' + r.doorN + ' шт. дверей', s: 2 },
        { name: 'Площадь штукатурки', vol: pcRu(r.net, 1) + ' м²', cost: '—', com: 'после вычета проёмов', s: 2 },
        { name: 'Объём слоя', vol: pcRu(r.net * (r.thick / 1000), 1) + ' м³', cost: '—', com: 'средняя толщина ' + r.thick + ' мм', s: 2 },
        { name: 'Штукатурная смесь', vol: pcRu(r.mixKg, 0) + ' кг, ' + r.bags + ' шт. меш.', cost: pcRub(r.mixCost), com: r.mix.short + ', ' + r.mix.cons + ' кг/м² на 10 мм, запас ' + pcN('pc-mix-res') + '%', s: 3 },
        { name: 'Грунтовка', vol: pcRu(r.primL, 0) + ' л', cost: pcRub(r.primCost), com: pcN('pc-prim-r') + ' л/м²', s: 3 },
        { name: 'Маяки', vol: pcRu(r.beacons.meters, 1) + ' пог. м', cost: pcRub(r.beaconCost), com: r.beacons.lines + ' линий, шаг ' + pcN('pc-beacon-step') + ' м', s: 3 },
        { name: 'Армирующая сетка', vol: r.meshPct > 0 ? pcRu(r.meshM2, 1) + ' м²' : '—', cost: pcRub(r.meshCost), com: Math.round(r.meshPct * 100) + '% площади', s: 3 },
        { name: 'Уголки проёмов', vol: pcRu(r.cornersM, 1) + ' пог. м', cost: pcRub(r.cornerCost), com: r.openCnt + ' шт. проёмов × ' + pcN('pc-open-h') + ' м × 2', s: 3 },
        { name: 'Работа', vol: pcRu(r.net, 1) + ' м²', cost: pcRub(r.workCost), com: pcN('pc-price-work') + ' ₽/м²', s: 4 },
        { name: 'Доставка', vol: '—', cost: pcRub(r.deliv), com: 'доставка смеси и комплектующих', s: 4 },
        { name: 'Резерв бюджета', vol: pcN('pc-budget-res') + '%', cost: pcRub(r.reserve), com: 'резерв на уточнения и добор', s: 4 }
    ];
    if (body) body.innerHTML = rows.map(row => `
        <tr onclick="pcFocusStep(${row.s}, '${row.name}')" class="border-t border-slate-100 cursor-pointer hover:bg-blue-50">
            <td class="p-2">${row.name}</td>
            <td class="p-2 font-bold">${row.vol}</td>
            <td class="p-2">${row.cost}</td>
            <td class="p-2 text-slate-500">${row.com}</td>
        </tr>`).join('');
}

// === КАЛЬКУЛЯТОР РЕМОНТА (stk-svoydom, синяя тема) ===
let rcType = 'apt';
let rcUid = 1;
let rcData = { groups: [], extras: [], area: 50 };

function rcMoney(n) {
    return (Number(n) || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' руб';
}
function rcWalls(area) { return Math.round(area * 2.4 * 10) / 10; }
function rcTpl() {
    return {
        apt: {
            areaLabel: 'Площадь квартиры (м²)', resultTitle: 'Детализация стоимости ремонта квартиры', area: 50,
            groups: [
                { name: 'Демонтажные работы', items: [
                    { t: 'Демонтаж старых покрытий (полы, стены)', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 300, q: 50, from: 'area' },
                    { t: 'Демонтаж сантехники', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 1500, q: 3, hint: 'Унитаз, раковина, ванна/душевая' }
                ]},
                { name: 'Черновые работы', items: [
                    { t: 'Выравнивание стен штукатуркой', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 800, q: 120, from: 'walls' },
                    { t: 'Стяжка пола цементная', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 600, q: 50, from: 'area' },
                    { t: 'Шпаклевка стен под покраску', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 400, q: 120, from: 'walls' }
                ]},
                { name: 'Электромонтажные работы', items: [
                    { t: 'Разводка электрики', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 2500, q: 15 },
                    { t: 'Установка щитка', pl: 'Цена (руб)', ql: 'Количество', p: 15000, q: 1 }
                ]},
                { name: 'Сантехнические работы', items: [
                    { t: 'Разводка водопровода', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 3500, q: 5 },
                    { t: 'Разводка канализации', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 2400, q: 5 }
                ]},
                { name: 'Чистовая отделка', items: [
                    { t: 'Покраска стен', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 300, q: 120, from: 'walls' },
                    { t: 'Укладка ламината', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 500, q: 50, from: 'area' },
                    { t: 'Укладка плитки в санузле', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 1200, q: 10 },
                    { t: 'Установка межкомнатных дверей', pl: 'Цена за шт. (руб)', ql: 'Количество', p: 3000, q: 4 },
                    { t: 'Монтаж потолка (натяжной/ГКЛ)', pl: 'Цена за м² (руб)', ql: 'Площадь потолка (м²)', p: 800, q: 50, from: 'area' }
                ]}
            ]
        },
        new: {
            areaLabel: 'Площадь новостройки (м²)', resultTitle: 'Детализация стоимости ремонта новостройки', area: 50,
            groups: [
                { name: 'Подготовительные работы', items: [
                    { t: 'Грунтовка стен и потолков', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 510, q: 50, from: 'area' },
                    { t: 'Штукатурка стен по маякам', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 600, q: 120, from: 'walls' }
                ]},
                { name: 'Черновые работы', items: [
                    { t: 'Стяжка пола с утеплением', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 900, q: 50, from: 'area' },
                    { t: 'Шпаклевка стен под обои', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 400, q: 120, from: 'walls' }
                ]},
                { name: 'Электромонтажные работы', items: [
                    { t: 'Полная разводка электрики', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 2520, q: 20 },
                    { t: 'Установка распределительного щита', pl: 'Цена (руб)', ql: 'Количество', p: 18000, q: 1 }
                ]},
                { name: 'Сантехнические работы', items: [
                    { t: 'Разводка водопроводных труб', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 4800, q: 5 },
                    { t: 'Монтаж канализационных труб', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 3600, q: 5 }
                ]},
                { name: 'Чистовая отделка', items: [
                    { t: 'Поклейка обоев', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 450, q: 120, from: 'walls' },
                    { t: 'Укладка плитки в санузле', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 1800, q: 10 },
                    { t: 'Укладка ламината/паркета', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 700, q: 50, from: 'area' },
                    { t: 'Монтаж натяжных потолков', pl: 'Цена за м² (руб)', ql: 'Площадь потолка (м²)', p: 1200, q: 50, from: 'area' }
                ]}
            ]
        },
        house: {
            areaLabel: 'Площадь дома (м²)', resultTitle: 'Детализация стоимости ремонта частного дома', area: 150,
            groups: [
                { name: 'Наружные работы', items: [
                    { t: 'Утепление фасада (пенопласт+штукатурка)', pl: 'Цена за м² (руб)', ql: 'Площадь фасада (м²)', p: 2400, q: 150, from: 'area' },
                    { t: 'Монтаж водосточной системы', pl: 'Цена за п.м. (руб)', ql: 'Длина (м)', p: 2000, q: 30 }
                ]},
                { name: 'Внутренние работы', items: [
                    { t: 'Штукатурка стен по маякам', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 1400, q: 150, from: 'area' },
                    { t: 'Стяжка пола с утеплением', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 600, q: 150, from: 'area' }
                ]},
                { name: 'Коммуникации', items: [
                    { t: 'Разводка электрики по дому', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 3500, q: 30 },
                    { t: 'Монтаж отопительной системы', pl: 'Цена за м² (руб)', ql: 'Площадь дома (м²)', p: 1000, q: 150, from: 'area' },
                    { t: 'Разводка водопровода', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 3600, q: 10 }
                ]},
                { name: 'Чистовая отделка', items: [
                    { t: 'Покраска стен', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 700, q: 150, from: 'area' },
                    { t: 'Укладка плитки в санузлах', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 1750, q: 20 },
                    { t: 'Установка межкомнатных дверей', pl: 'Цена за шт. (руб)', ql: 'Количество', p: 8000, q: 5 },
                    { t: 'Монтаж лестницы', pl: 'Цена (руб)', ql: 'Количество', p: 50000, q: 1 }
                ]}
            ]
        },
        comm: {
            areaLabel: 'Площадь помещения (м²)', resultTitle: 'Детализация стоимости коммерческого ремонта', area: 80,
            groups: [
                { name: 'Демонтажные работы', items: [
                    { t: 'Демонтаж перегородок и конструкций', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 500, q: 80, from: 'area' }
                ]},
                { name: 'Черновые работы', items: [
                    { t: 'Возведение перегородок (ГКЛ)', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 750, q: 80, from: 'area' },
                    { t: 'Стяжка пола промышленная', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 800, q: 80, from: 'area' }
                ]},
                { name: 'Электромонтажные работы', items: [
                    { t: 'Разводка электрики (офисный стандарт)', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 2750, q: 20 },
                    { t: 'Монтаж щита учета', pl: 'Цена (руб)', ql: 'Количество', p: 25000, q: 1 }
                ]},
                { name: 'Отделочные работы', items: [
                    { t: 'Покраска стен (офисная)', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 700, q: 100 },
                    { t: 'Напольные покрытия (линолеум коммерческий)', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 600, q: 80, from: 'area' },
                    { t: 'Подвесные потолки (Армстронг)', pl: 'Цена за м² (руб)', ql: 'Площадь потолка (м²)', p: 900, q: 80, from: 'area' },
                    { t: 'Освещение (светильники LED)', pl: 'Цена за шт. (руб)', ql: 'Количество', p: 1500, q: 30 }
                ]}
            ]
        }
    };
}
function rcStamp(src) {
    const d = JSON.parse(JSON.stringify(src));
    d.groups.forEach(g => g.items.forEach(it => { it.id = rcUid++; }));
    d.extras = [];
    return d;
}
function rcInit() {
    rcEnsureBind();
    rcType = 'apt';
    rcLoadType('apt');
}
function rcReset() {
    rcLoadType(rcType);
    const res = document.getElementById('rc-results');
    if (res) res.classList.add('hidden');
    if (typeof showSmsToast === 'function') showSmsToast('Расчёт сброшен');
}
function rcLoadType(type) {
    rcType = type;
    rcData = rcStamp(rcTpl()[type]);
    const areaEl = document.getElementById('rc-area');
    const lab = document.getElementById('rc-area-label');
    if (areaEl) areaEl.value = rcData.area;
    if (lab) lab.textContent = rcData.areaLabel;
    ['apt', 'new', 'house', 'comm'].forEach(k => {
        const b = document.getElementById('rc-tab-' + k);
        if (!b) return;
        b.className = 'shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold ' + (k === type ? 'bg-[#1e6091] text-white' : 'bg-white border border-slate-200 text-slate-700');
    });
    rcRender();
}
function rcSetType(type) { rcLoadType(type); }
function rcOnArea() {
    const area = parseFloat(document.getElementById('rc-area').value) || 0;
    rcData.area = area;
    const walls = rcWalls(area);
    rcData.groups.forEach(g => g.items.forEach(it => {
        if (it.from === 'area') it.q = area;
        if (it.from === 'walls') it.q = walls;
    }));
    rcRender();
}
function rcCardHtml(it, kind, g, i) {
    const sum = (Number(it.p) || 0) * (Number(it.q) || 0);
    const key = kind + '-' + g + '-' + i;
    return `<div class="bg-white border border-slate-200 rounded-xl p-3 relative" style="border-left:4px solid #1e6091">
        <div class="flex items-start justify-between gap-2 pr-8">
            <input type="text" value="${String(it.t).replace(/"/g, '&quot;')}" oninput="rcRename('${kind}',${g},${i},this.value)" class="font-bold text-[13px] text-[#1e6091] bg-transparent w-full outline-none">
            <button type="button" data-rc-del="${kind},${g},${i}" class="absolute top-2 right-2 w-6 h-6 rounded bg-red-500 text-white text-sm font-bold leading-none">×</button>
        </div>
        ${it.hint ? `<p class="text-[10px] text-slate-400 mt-0.5">${it.hint}</p>` : ''}
        <div class="grid grid-cols-2 gap-2 mt-2">
            <div><label class="text-[10px] text-slate-500">${it.pl || 'Цена (руб)'}</label><input type="number" value="${it.p}" oninput="rcSet('${kind}',${g},${i},'p',this.value)" class="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs"></div>
            <div><label class="text-[10px] text-slate-500">${it.ql || 'Количество'}</label><input type="number" value="${it.q}" oninput="rcSet('${kind}',${g},${i},'q',this.value)" class="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs"></div>
        </div>
        <div class="flex flex-col items-end mt-2 gap-1.5">
            <p id="rc-sum-${key}" class="text-[13px] font-extrabold text-[#1e6091]">${rcMoney(sum)}</p>
            <button type="button" data-rc-add="${kind},${g},${i}" class="bg-[#1e6091] text-white text-[12px] font-bold px-3 py-2 rounded-lg active:opacity-80">+ Добавить услугу</button>
        </div>
    </div>`;
}
function rcEnsureBind() {
    const root = document.getElementById('calc-content-repair');
    if (!root || root.dataset.rcBound) return;
    root.dataset.rcBound = '1';
    root.addEventListener('click', function(e) {
        const addBtn = e.target.closest('[data-rc-add]');
        if (addBtn) {
            e.preventDefault();
            const p = addBtn.getAttribute('data-rc-add').split(',');
            rcAddAfter(p[0], Number(p[1]), Number(p[2]));
            return;
        }
        const rm = e.target.closest('[data-rc-del]');
        if (rm) {
            e.preventDefault();
            const p = rm.getAttribute('data-rc-del').split(',');
            rcRemove(p[0], Number(p[1]), Number(p[2]));
        }
    });
}
function rcRender() {
    rcEnsureBind();
    const wrap = document.getElementById('rc-groups');
    if (!wrap) return;
    wrap.innerHTML = rcData.groups.map((g, gi) => `
        <div>
            <h6 class="text-[14px] font-bold text-[#1e6091] pb-1 mb-2 border-b border-[#1e6091]/40">${g.name}</h6>
            <div class="space-y-2">${g.items.map((it, ii) => rcCardHtml(it, 'work', gi, ii)).join('')}</div>
        </div>`).join('');
    const ex = document.getElementById('rc-extras');
    if (ex) ex.innerHTML = (rcData.extras || []).map((it, ii) => rcCardHtml(it, 'extra', 0, ii)).join('');
}
function rcItem(kind, g, i) {
    return kind === 'extra' ? rcData.extras[i] : rcData.groups[g].items[i];
}
function rcSet(kind, g, i, field, val) {
    const it = rcItem(kind, g, i);
    if (!it) return;
    it[field] = parseFloat(val) || 0;
    if (it.from) it.from = null;
    const el = document.getElementById('rc-sum-' + kind + '-' + g + '-' + i);
    if (el) el.textContent = rcMoney((Number(it.p) || 0) * (Number(it.q) || 0));
}
function rcRename(kind, g, i, val) {
    const it = rcItem(kind, g, i);
    if (it) it.t = val;
}
function rcRemove(kind, g, i) {
    if (kind === 'extra') rcData.extras.splice(i, 1);
    else rcData.groups[g].items.splice(i, 1);
    rcRender();
}
function rcNewItem() {
    return { id: rcUid++, t: 'Новая услуга', pl: 'Цена (руб)', ql: 'Количество', p: 0, q: 1 };
}
function rcAddAfter(kind, g, i) {
    if (kind === 'extra') rcData.extras.splice(i + 1, 0, rcNewItem());
    else {
        if (!rcData.groups[g]) return;
        rcData.groups[g].items.splice(i + 1, 0, rcNewItem());
    }
    rcRender();
    if (typeof showSmsToast === 'function') showSmsToast('Добавлена «Новая услуга»');
}
function rcAllItems() {
    const list = [];
    rcData.groups.forEach(g => g.items.forEach(it => list.push({ name: it.t, sum: (it.p || 0) * (it.q || 0), group: g.name })));
    rcData.extras.forEach(it => list.push({ name: it.t, sum: (it.p || 0) * (it.q || 0), group: 'Дополнительные услуги' }));
    return list;
}
function rcCalculate() {
    const items = rcAllItems().filter(x => x.sum > 0 || true);
    const mainSum = rcData.groups.reduce((s, g) => s + g.items.reduce((a, it) => a + (it.p || 0) * (it.q || 0), 0), 0);
    const extraSum = rcData.extras.reduce((s, it) => s + (it.p || 0) * (it.q || 0), 0);
    const total = mainSum + extraSum;
    const tpl = rcTpl()[rcType];
    const title = document.getElementById('rc-results-title');
    const body = document.getElementById('rc-results-body');
    const box = document.getElementById('rc-results');
    if (title) title.textContent = tpl.resultTitle;
    let html = '<p class="text-[13px] font-bold mb-2">Основные работы</p>';
    rcData.groups.forEach(g => {
        g.items.forEach(it => {
            html += `<button type="button" class="w-full flex justify-between gap-2 py-2 border-b border-dotted border-slate-200 text-[12px] text-left"><span>${it.t}</span><span class="font-semibold shrink-0">${rcMoney((it.p || 0) * (it.q || 0))}</span></button>`;
        });
    });
    html += `<div class="flex justify-between py-2 text-[12px] font-bold"><span>Итого по основным работам</span><span>${rcMoney(mainSum)}</span></div>`;
    if (rcData.extras.length) {
        html += '<p class="text-[13px] font-bold mt-3 mb-2">Дополнительные услуги</p>';
        rcData.extras.forEach(it => {
            html += `<button type="button" class="w-full flex justify-between gap-2 py-2 border-b border-dotted border-slate-200 text-[12px] text-left"><span>${it.t}</span><span class="font-semibold shrink-0">${rcMoney((it.p || 0) * (it.q || 0))}</span></button>`;
        });
        html += `<div class="flex justify-between py-2 text-[12px] font-bold"><span>Итого по доп. услугам</span><span>${rcMoney(extraSum)}</span></div>`;
    }
    html += `<div class="flex justify-between pt-3 text-[16px] font-extrabold text-[#1e6091]"><span>Итого:</span><span>${rcMoney(total)}</span></div>`;
    if (body) body.innerHTML = html;
    if (box) box.classList.remove('hidden');
    const sc = document.getElementById('main-scroll-container');
    if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' });
}

// === УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ОТРИСОВКИ СЕТКИ (Плитка + Ламинат) С ПОЛНОЙ НУМЕРАЦИЕЙ КАЖДОГО КУСОЧКА ===
function drawGrid(canvasId, rL, rW, tL_mm, tW_mm, gap_mm, method, isLaminate) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    canvas.innerHTML = '';
    
    const cWidth = canvas.clientWidth || 300;
    const cHeight = 280; // Комфортная высота для полной видимости цифр
    
    const roomW = rL * 1000; 
    const roomH = rW * 1000;
    
    const scale = Math.min((cWidth - 20) / roomW, (cHeight - 20) / roomH);
    
    const drawW = roomW * scale;
    const drawH = roomH * scale;
    const dTileW = tL_mm * scale;
    const dTileH = tW_mm * scale;
    const dGap = gap_mm * scale;

    const roomDiv = document.createElement('div');
    roomDiv.className = 'relative overflow-hidden bg-slate-100 shadow-inner';
    roomDiv.style.width = drawW + 'px';
    roomDiv.style.height = drawH + 'px';
    roomDiv.style.border = '2px solid #1e6091'; // Синие границы комнаты
    
    if (method !== 'diagonal') {
        // === ПРЯМЫЕ И ПАЛУБНЫЕ УКЛАДКИ ===
        let boardNum = 1;
        let remL = dTileW; 
        
        const rows = Math.ceil(drawH / (dTileH + dGap));
        
        for (let r = 0; r < rows; r++) {
            let x = 0;
            let y = r * (dTileH + dGap);
            
            if (method === 'half' || (method === 'offset' && !isLaminate)) {
                remL = (r % 2 === 0) ? dTileW : dTileW / 2;
                boardNum++; 
            } else if (method === 'third') {
                remL = dTileW - ((r % 3) * (dTileW / 3));
                boardNum++;
            } else if (method === 'offset' && isLaminate) {
                 remL = (r % 2 === 0) ? dTileW : dTileW / 2;
                 boardNum++; 
            }
            
            if (remL <= 0.1) remL = dTileW;

            while (x < drawW) {
                let w = Math.min(remL, drawW - x);
                
                let tile = document.createElement('div');
                tile.className = 'absolute bg-white border border-[#1e6091] overflow-hidden hover:bg-blue-50 transition-colors cursor-pointer';
                tile.style.left = x + 'px';
                tile.style.top = y + 'px';
                tile.style.width = w + 'px';
                tile.style.height = dTileH + 'px';
                
                if (isLaminate) {
                    let texture = document.createElement('div');
                    texture.className = 'w-[40%] h-[1px] bg-slate-200 absolute top-1/2 left-[30%] -translate-y-1/2 opacity-50 pointer-events-none';
                    tile.appendChild(texture);
                }
                
                // НУМЕРАЦИЯ КАЖДОЙ ПЛИТКИ И КУСОЧКА БЕЗ ПРОПУСКОВ
                let num = document.createElement('span');
                num.innerText = boardNum;
                num.className = 'absolute top-[2px] left-[4px] text-[9px] font-extrabold text-[#1e6091] leading-none pointer-events-none select-none z-10';
                tile.appendChild(num);
                
                roomDiv.appendChild(tile);
                x += w + dGap;
                
                if (w >= remL - 0.5) {
                    remL = dTileW;
                    boardNum++; 
                } else {
                    remL -= w;
                }
            }
        }
        canvas.appendChild(roomDiv);
    } else {
        // === ДИАГОНАЛЬНАЯ УКЛАДКА ===
        const innerDiv = document.createElement('div');
        innerDiv.style.position = 'absolute';
        
        const diag = Math.sqrt(drawW*drawW + drawH*drawH);
        innerDiv.style.width = diag + 'px';
        innerDiv.style.height = diag + 'px';
        innerDiv.style.left = -(diag - drawW) / 2 + 'px';
        innerDiv.style.top = -(diag - drawH) / 2 + 'px';
        innerDiv.style.transform = 'rotate(45deg)';
        
        const cols = Math.ceil(diag / (dTileW + dGap));
        const rows = Math.ceil(diag / (dTileH + dGap));
        
        let tilesToNumber = [];

        for (let r = -2; r < rows + 2; r++) {
            for (let c = -2; c < cols + 2; c++) {
                let lx = c * (dTileW + dGap);
                let ly = r * (dTileH + dGap);
                
                let tcx = lx + dTileW / 2;
                let tcy = ly + dTileH / 2;
                const a = 45 * Math.PI / 180;
                let dx = tcx - diag / 2;
                let dy = tcy - diag / 2;
                let rx = dx * Math.cos(a) - dy * Math.sin(a) + drawW / 2;
                let ry = dx * Math.sin(a) + dy * Math.cos(a) + drawH / 2;
                
                const tol = Math.max(dTileW, dTileH) / 1.5; 
                if (rx < -tol || rx > drawW + tol || ry < -tol || ry > drawH + tol) continue;

                let tile = document.createElement('div');
                tile.className = 'absolute bg-white border border-[#1e6091] overflow-hidden hover:bg-blue-50 transition-colors cursor-pointer';
                tile.style.left = lx + 'px';
                tile.style.top = ly + 'px';
                tile.style.width = dTileW + 'px';
                tile.style.height = dTileH + 'px';
                
                if (isLaminate) {
                    let texture = document.createElement('div');
                    texture.className = 'w-[40%] h-[1px] bg-slate-200 absolute top-1/2 left-[30%] -translate-y-1/2 opacity-50 pointer-events-none';
                    tile.appendChild(texture);
                }

                innerDiv.appendChild(tile);
                tilesToNumber.push({ el: tile, rx: rx, ry: ry });
            }
        }
        
        // Сортируем строго сверху-вниз, слева-направо
        tilesToNumber.sort((a, b) => {
            if (Math.abs(a.ry - b.ry) < (dTileH * 0.4)) return a.rx - b.rx; 
            return a.ry - b.ry; 
        });

        // Нумеруем абсолютно каждый видимый элемент диагонали
        let tileNumber = 1;
        tilesToNumber.forEach(t => {
            let num = document.createElement('span');
            num.innerText = tileNumber++;
            num.style.transform = 'rotate(-45deg)';
            num.style.transformOrigin = 'top left';
            num.className = 'absolute top-[6px] left-[5px] text-[9px] font-extrabold text-[#1e6091] leading-none pointer-events-none select-none z-10';
            t.el.appendChild(num);
        });

        roomDiv.appendChild(innerDiv);
        canvas.appendChild(roomDiv);
    }
    
    // Подпись схемы
    const label = document.getElementById(isLaminate ? 'lc-scheme-label' : 'tc-scheme-label');
    if(label) {
        if(method === 'straight') label.innerText = 'Схема: Прямая укладка';
        if(method === 'offset') label.innerText = 'Схема: Укладка со смещением';
        if(method === 'half') label.innerText = 'Схема: Палубная 1/2';
        if(method === 'third') label.innerText = 'Схема: Палубная 1/3';
        if(method === 'diagonal') label.innerText = 'Схема: Диагональ 45°';
    }
}
// ================= НЕДВИЖИМОСТЬ =================

        // Моковые данные агентов (добавлены контакты)
        const mockAgents = [
            { name: 'Анна Смирнова', role: 'Эксперт по жилой недвижимости', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', phone: '+79001234567', tg: 'https://t.me/anna', max: '#' },
            { name: 'Иван Петров', role: 'Специалист по загородной недвижимости', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200', phone: '+79001234568', tg: 'https://t.me/ivan', max: '#' },
            { name: 'Елена Кузнецова', role: 'Эксперт по инвестициям', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', phone: '+79001234569', tg: 'https://t.me/elena', max: '#' }
        ];

        window.currentReStore = '';

        // Открытие каталога агентства
        function openRealEstateCatalog(storeName) {
            const c = shopsProfileDb[storeName];
            if (!c) return;
            window.currentReStore = storeName;

            // Заполняем профиль агентства
            document.getElementById('re-catalog-title-top').innerText = c.name;
            document.getElementById('re-catalog-banner').src = c.banner;
            
            // 1. Отрисовываем карусель Агентов с новыми иконками связи
            let agentsHtml = '';
            mockAgents.forEach(agent => {
                agentsHtml += `
                    <div class="w-[140px] shrink-0 bg-white rounded-[20px] shadow-sm border border-slate-100 flex flex-col overflow-hidden cursor-pointer active:scale-[0.98] transition-transform">
                        <div class="w-full h-[120px] bg-slate-200">
                            <img src="${agent.image}" class="w-full h-full object-cover object-top">
                        </div>
                        <div class="p-3 flex flex-col flex-1 bg-white">
                            <h5 class="text-[12px] font-bold text-slate-900 leading-tight">${agent.name}</h5>
                            <p class="text-[10px] text-slate-500 mt-1 leading-snug flex-1">${agent.role}</p>
                            <div class="mt-3 flex gap-1.5 w-full">
                                <button onclick="event.stopPropagation(); window.open('tel:${agent.phone}')" class="flex-1 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-[#16332c] hover:text-white transition-colors border border-slate-100 shadow-sm"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1.3 1.3 0 01-.321.988l-1.305 1.305a12.01 12.01 0 005.168 5.168l1.305-1.305a1.3 1.3 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></button>
                                <button onclick="event.stopPropagation(); window.open('${agent.tg}')" class="flex-1 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-[#2AABEE] hover:bg-[#2AABEE] hover:text-white transition-colors border border-slate-100 shadow-sm"><svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg></button>
                                <button onclick="event.stopPropagation(); window.open('${agent.max}')" class="flex-1 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-[#7B4DFF] hover:bg-[#7B4DFF] hover:text-white transition-colors border border-slate-100 shadow-sm"><span class="text-[9px] font-extrabold tracking-wider">MAX</span></button>
                            </div>
                        </div>
                    </div>`;
            });
            document.getElementById('re-agents-container').innerHTML = agentsHtml;

            // Запускаем фильтрацию (она сама отрисует объекты и счетчик)
            applyReFilters();

            // Переключаем экраны
            const agenciesView = document.getElementById('subview-re-agencies');
            if (agenciesView) agenciesView.classList.add('hidden');
            document.getElementById('subview-realestate').classList.add('hidden');
            document.getElementById('subview-re-catalog').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
        }

        // --- ЛОГИКА ИНТЕРАКТИВНЫХ ФИЛЬТРОВ ---
        
        function setReDeal(dealType) {
            document.getElementById('filter-re-deal').value = dealType;
            ['buy', 'rent', 'sell'].forEach(t => {
                const btn = document.getElementById('re-deal-' + t);
                const isMatch = (t==='buy'&&dealType==='купить') || (t==='rent'&&dealType==='арендовать') || (t==='sell'&&dealType==='продать');
                if(isMatch) btn.className = 'flex-1 bg-[#16332c] text-white text-[13px] font-bold py-2.5 rounded-full shadow-sm transition-all';
                else btn.className = 'flex-1 text-slate-600 text-[13px] font-medium py-2.5 rounded-full hover:bg-white transition-all';
            });
            applyReFilters();
        }

        function setReType(type) {
            let curr = document.getElementById('filter-re-type').value;
            if (curr === type) type = 'all'; // Отжимаем кнопку, если нажата повторно
            document.getElementById('filter-re-type').value = type;

            document.querySelectorAll('.re-type-btn').forEach(btn => {
                const iconBox = btn.firstElementChild;
                const textSpan = btn.lastElementChild;
                if (btn.dataset.type === type) {
                    iconBox.className = 'w-[56px] h-[56px] rounded-[18px] bg-[#16332c] text-white flex items-center justify-center shadow-md transition-transform group-active:scale-95';
                    textSpan.className = 'text-[10.5px] text-slate-800 font-bold leading-none ' + (type === 'машиноместо' ? 'text-center' : '');
                } else {
                    iconBox.className = 'w-[56px] h-[56px] rounded-[18px] bg-white border border-slate-200 text-slate-600 flex items-center justify-center transition-transform group-active:scale-95 shadow-sm';
                    textSpan.className = 'text-[10.5px] text-slate-600 font-medium leading-none ' + (btn.dataset.type === 'машиноместо' ? 'text-center' : '');
                }
            });
            applyReFilters();
        }

        function applyReFilters() {
            const storeName = window.currentReStore;
            if (!storeName) return;

            // Читаем значения всех 6 фильтров
            const deal = document.getElementById('filter-re-deal').value;
            const type = document.getElementById('filter-re-type').value;
            const city = document.getElementById('filter-re-city').value;
            const maxPrice = parseInt(document.getElementById('filter-re-price').value) || null;
            const rooms = document.getElementById('filter-re-rooms').value;
            const minArea = parseInt(document.getElementById('filter-re-area').value) || null;
            const market = document.getElementById('filter-re-market').value;
            const renov = document.getElementById('filter-re-renovation').value;

            // Фильтруем объекты
            const reObjects = Object.values(productsDb).filter(p => {
                if (p.category !== 'недвижимость' || p.status !== 'published' || p.store !== storeName) return false;

                if (deal !== 'all' && p.reDeal && p.reDeal !== deal) return false;
                if (type !== 'all') {
                    if (type === 'коммерция') {
                        if (typeof isCommercialListing === 'function' ? !isCommercialListing(p) : p.reType !== 'коммерция') return false;
                    } else if (p.reType && p.reType !== type) return false;
                }

                // Умный фильтр Города
                if (city !== 'all') {
                    const loc = (p.reLocation || '').toLowerCase();
                    if (city === 'Новый город' && !loc.includes('в-') && !loc.includes('звездный')) return false;
                    if (city === 'Старый город' && !loc.includes('старо') && !loc.includes('ленина')) return false;
                }

                // Цена до...
                if (maxPrice !== null) {
                    const pPrice = parseInt((p.price || '0').replace(/\D/g, ''));
                    if (pPrice > maxPrice) return false;
                }

                // Площадь от...
                if (minArea !== null) {
                    const pArea = parseInt(p.reArea || '0');
                    if (pArea < minArea) return false;
                }

                if (rooms !== 'all' && p.reRooms && p.reRooms !== rooms) return false;
                if (market !== 'all' && p.reMarket && p.reMarket !== market) return false;
                
                // Фильтр ремонта (мягкая проверка)
                if (renov !== 'all') {
                    const itemRenov = (p.reRenovation || 'с ремонтом').toLowerCase(); // По умолчанию считаем, что ремонт есть
                    if (itemRenov !== renov) return false;
                }

                return true;
            });

            // Обновляем текст на кнопке "Показать"
            document.getElementById('re-filter-count-btn').innerText = `Показать ${reObjects.length} объектов`;

            // Рендерим результат
            let objsHtml = '';
            if (reObjects.length === 0) {
                objsHtml = `<div class="py-10 text-center w-full text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50">Объекты не найдены</div>`;
            } else {
                reObjects.forEach(obj => {
                    const isFav = state.favorites && state.favorites.includes(obj.id);
                    const specs = [obj.reRooms ? (obj.reRooms === 'Студия' ? 'Студия' : obj.reRooms + '-к.') : obj.reType, obj.reArea ? obj.reArea + ' м²' : ''].filter(Boolean).join(', ');
                    
                    objsHtml += `
                        <div onclick="openProductModal('${obj.id}')" class="w-[150px] shrink-0 bg-white rounded-[20px] shadow-sm overflow-hidden border border-slate-100 flex flex-col cursor-pointer active:scale-95 transition-transform">
                            <div class="relative w-full h-[110px] bg-slate-200">
                                <img src="${obj.image}" class="w-full h-full object-cover">
                                <button onclick="event.stopPropagation(); toggleFavorite('${obj.id}'); applyReFilters();" class="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm transition-colors ${isFav ? 'text-[#f43f5e]' : 'text-slate-300'} hover:text-[#f43f5e]">
                                    <svg class="w-4 h-4 ${isFav ? 'fill-current' : ''}" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                </button>
                                <div class="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-md capitalize">${obj.reType || 'Объект'}</div>
                            </div>
                            <div class="p-3">
                                <p class="text-[10px] text-slate-500 font-medium truncate mb-1">${specs}</p>
                                <p class="text-[13px] font-extrabold text-slate-900 leading-none mb-2">${obj.price}</p>
                                <div class="flex items-center gap-1 text-[9px] text-slate-400 truncate">
                                    <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                                    <span>${obj.reLocation || 'Не указано'}</span>
                                </div>
                            </div>
                        </div>`;
                });
            }
            document.getElementById('re-objects-container').innerHTML = objsHtml;
        }
        
        // Кнопка Назад
        function closeReCatalog() {
            document.getElementById('subview-re-catalog').classList.add('hidden');
            const agenciesView = document.getElementById('subview-re-agencies');
            if (agenciesView) agenciesView.classList.remove('hidden');
        }

        const COMM_TYPES = ['офис', 'свободного назначения', 'торговая площадь', 'склад', 'кладовая', 'производство', 'общепит', 'гостиница', 'автосервис', 'здание целиком'];
        const COMM_TYPE_LABELS = {
            'офис': 'Офис',
            'свободного назначения': 'Свободного назначения',
            'торговая площадь': 'Торговая площадь',
            'склад': 'Склад',
            'кладовая': 'Кладовая',
            'производство': 'Производство',
            'общепит': 'Общепит',
            'гостиница': 'Гостиница',
            'автосервис': 'Автосервис',
            'здание целиком': 'Здание целиком',
            'коммерция': 'Коммерция'
        };
        let commFilters = { deal: 'all', types: [], typeDraft: [], priceMin: null, priceMax: null, areaMin: null, areaMax: null, sort: 'new', owner: false, firstLine: false, power380: false, ceilingMin: null, biz: 'all', viewMode: 'list' };

        function isCommercialListing(p) {
            if (!p) return false;
            if (p.reSegment === 'commercial') return true;
            const t = String(p.reType || '').toLowerCase();
            return t === 'коммерция' || COMM_TYPES.indexOf(t) !== -1;
        }
        function commTypeLabel(t) {
            const key = String(t || '').toLowerCase();
            return COMM_TYPE_LABELS[key] || (key ? key.charAt(0).toUpperCase() + key.slice(1) : 'Объект');
        }
        function commParsePrice(p) {
            return parseInt(String((p && p.price) || '0').replace(/\D/g, ''), 10) || 0;
        }
        function commFmtNum(n) {
            return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        }
        function commSheetShow(id, on) {
            const e = document.getElementById(id);
            if (!e) return;
            e.classList.toggle('hidden', !on);
            e.classList.toggle('flex', !!on);
        }
        function closeCommSheets() {
            commSheetShow('comm-type-sheet', false);
            commSheetShow('comm-price-sheet', false);
            commSheetShow('comm-ceiling-sheet', false);
            commSheetShow('comm-compare-sheet', false);
            if (typeof closeCommViewSheet === 'function') closeCommViewSheet();
        }
        function setCommDeal(deal) {
            commFilters.deal = deal;
            renderCommListings();
        }
        function toggleCommFlag(key) {
            commFilters[key] = !commFilters[key];
            renderCommListings();
        }
        function setCommBiz(mode) {
            commFilters.biz = (commFilters.biz === mode) ? 'all' : mode;
            renderCommListings();
        }
        function setCommViewMode(mode) {
            commFilters.viewMode = mode;
            renderCommListings();
        }
        function openCommCeilingSheet() { commSheetShow('comm-ceiling-sheet', true); }
        function closeCommCeilingSheet() { commSheetShow('comm-ceiling-sheet', false); }
        function setCommCeiling(v) {
            commFilters.ceilingMin = v;
            closeCommCeilingSheet();
            renderCommListings();
        }
        function toggleCommOwner() {
            commFilters.owner = !commFilters.owner;
            renderCommListings();
        }
        function cycleCommSort() {
            const order = ['new', 'cheap', 'expensive', 'perM'];
            const i = order.indexOf(commFilters.sort);
            commFilters.sort = order[(i + 1) % order.length];
            renderCommListings();
        }
        function syncCommChips() {
            const map = { all: 'comm-chip-deal-all', 'купить': 'comm-chip-deal-buy', 'арендовать': 'comm-chip-deal-rent' };
            Object.keys(map).forEach(function (k) {
                const el = document.getElementById(map[k]);
                if (el) el.className = 'comm-chip' + (commFilters.deal === k ? ' on' : '');
            });
            const typeChip = document.getElementById('comm-chip-type');
            if (typeChip) {
                typeChip.className = 'comm-chip' + (commFilters.types.length ? ' has' : '');
                typeChip.textContent = commFilters.types.length ? ('Вид · ' + commFilters.types.length) : 'Вид объекта';
            }
            const priceChip = document.getElementById('comm-chip-price');
            if (priceChip) {
                const has = commFilters.priceMin != null || commFilters.priceMax != null;
                priceChip.className = 'comm-chip' + (has ? ' has' : '');
                if (commFilters.priceMin != null && commFilters.priceMax != null) priceChip.textContent = commFmtNum(commFilters.priceMin) + '–' + commFmtNum(commFilters.priceMax);
                else if (commFilters.priceMin != null) priceChip.textContent = 'от ' + commFmtNum(commFilters.priceMin);
                else if (commFilters.priceMax != null) priceChip.textContent = 'до ' + commFmtNum(commFilters.priceMax);
                else priceChip.textContent = 'Цена';
            }
            const areaChip = document.getElementById('comm-chip-area');
            if (areaChip) {
                const has = commFilters.areaMin != null || commFilters.areaMax != null;
                areaChip.className = 'comm-chip' + (has ? ' has' : '');
                if (commFilters.areaMin != null && commFilters.areaMax != null) areaChip.textContent = commFilters.areaMin + '–' + commFilters.areaMax + ' м²';
                else if (commFilters.areaMin != null) areaChip.textContent = 'от ' + commFilters.areaMin + ' м²';
                else if (commFilters.areaMax != null) areaChip.textContent = 'до ' + commFilters.areaMax + ' м²';
                else areaChip.textContent = 'Площадь';
            }
            const ownerChip = document.getElementById('comm-chip-owner');
            if (ownerChip) ownerChip.className = 'comm-chip' + (commFilters.owner ? ' on' : '');
            const lineChip = document.getElementById('comm-chip-line');
            if (lineChip) lineChip.className = 'comm-chip' + (commFilters.firstLine ? ' on' : '');
            const p380 = document.getElementById('comm-chip-380');
            if (p380) p380.className = 'comm-chip' + (commFilters.power380 ? ' on' : '');
            const ceilChip = document.getElementById('comm-chip-ceiling');
            if (ceilChip) {
                ceilChip.className = 'comm-chip' + (commFilters.ceilingMin ? ' has' : '');
                ceilChip.textContent = commFilters.ceilingMin ? ('Потолки от ' + commFilters.ceilingMin + ' м') : 'Потолки';
            }
            const spaceChip = document.getElementById('comm-chip-space');
            if (spaceChip) spaceChip.className = 'comm-chip' + (commFilters.biz === 'space' ? ' on' : '');
            const bizChip = document.getElementById('comm-chip-biz');
            if (bizChip) bizChip.className = 'comm-chip' + (commFilters.biz === 'biz' ? ' on' : '');
            const listBtn = document.getElementById('comm-mode-list');
            const mapBtn = document.getElementById('comm-mode-map');
            if (listBtn) listBtn.className = 'comm-mode' + (commFilters.viewMode !== 'map' ? ' on' : '');
            if (mapBtn) mapBtn.className = 'comm-mode' + (commFilters.viewMode === 'map' ? ' on' : '');
            const sortChip = document.getElementById('comm-chip-sort');
            if (sortChip) {
                sortChip.className = 'comm-chip' + (commFilters.sort !== 'new' ? ' has' : '');
                sortChip.textContent = commFilters.sort === 'cheap' ? 'Сначала дешевле' : (commFilters.sort === 'expensive' ? 'Сначала дороже' : (commFilters.sort === 'perM' ? 'Сначала дешевле за м²' : 'Сначала новые'));
            }
        }
        function getCommListings() {
            const q = ((document.getElementById('comm-search') || {}).value || '').trim().toLowerCase();
            let list = Object.values(productsDb).filter(function (p) {
                if (p.category !== 'недвижимость' || p.status !== 'published') return false;
                if (!isCommercialListing(p)) return false;
                if (commFilters.deal !== 'all' && p.reDeal && p.reDeal !== commFilters.deal) return false;
                if (commFilters.types.length) {
                    if (commFilters.types.indexOf(String(p.reType || '').toLowerCase()) === -1) return false;
                }
                const price = commParsePrice(p);
                if (commFilters.priceMin != null && price < commFilters.priceMin) return false;
                if (commFilters.priceMax != null && price > commFilters.priceMax) return false;
                const area = parseInt(p.reArea || '0', 10) || 0;
                if (commFilters.areaMin != null && area < commFilters.areaMin) return false;
                if (commFilters.areaMax != null && area > commFilters.areaMax) return false;
                if (commFilters.owner && !commIsOwner(p)) return false;
                const info = commListingProfile(p);
                if (commFilters.firstLine && !info.firstLine) return false;
                if (commFilters.power380 && !info.power380) return false;
                if (commFilters.ceilingMin != null && info.ceilingM < commFilters.ceilingMin) return false;
                if (commFilters.biz === 'biz' && !info.biz) return false;
                if (commFilters.biz === 'space' && info.biz) return false;
                if (q) {
                    const hay = [p.title, p.reType, p.reLocation, p.description].join(' ').toLowerCase();
                    if (hay.indexOf(q) === -1) return false;
                }
                return true;
            });
            if (commFilters.sort === 'cheap') list.sort(function (a, b) { return commParsePrice(a) - commParsePrice(b); });
            else if (commFilters.sort === 'expensive') list.sort(function (a, b) { return commParsePrice(b) - commParsePrice(a); });
            else if (commFilters.sort === 'perM') list.sort(function (a, b) {
                const aa = parseInt(a.reArea || '0', 10) || 1;
                const ba = parseInt(b.reArea || '0', 10) || 1;
                return (commParsePrice(a) / aa) - (commParsePrice(b) / ba);
            });
            return list;
        }
        function renderCommListings() {
            syncCommChips();
            const list = getCommListings();
            const countEl = document.getElementById('comm-count');
            if (countEl) countEl.textContent = list.length ? (list.length + ' ' + commCountWord(list.length)) : 'Ничего не найдено';
            const isMap = commFilters.viewMode === 'map';
            const mapView = document.getElementById('comm-map-view');
            const box = document.getElementById('comm-list');
            if (mapView) {
                mapView.classList.toggle('hidden', !isMap);
                if (isMap) {
                    mapView.innerHTML = (list.length ? list.map(function (obj) {
                        const pos = commMapPos(obj);
                        const on = (window.commCompare || []).indexOf(obj.id) !== -1;
                        return '<button type="button" class="comm-city-pin' + (on ? ' on' : '') + '" style="left:' + pos.x + '%;top:' + pos.y + '%" onclick="openProductModal(\'' + obj.id + '\')" title="' + String(obj.title || '').replace(/"/g, '') + '"><i></i></button>';
                    }).join('') : '') + '<span class="comm-city-label">Волгодонск · нажмите метку</span>';
                }
            }
            if (!box) return;
            box.classList.toggle('hidden', isMap);
            if (isMap) {
                renderCommCompareBar();
                return;
            }
            if (!list.length) {
                box.innerHTML = '<div class="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50"><p class="text-[14px] font-bold text-slate-500">Объявления не найдены</p><p class="text-[12px] text-slate-400 mt-1">Измените фильтры или сбросьте их</p></div>';
                renderCommCompareBar();
                return;
            }
            box.innerHTML = list.map(function (obj) {
                const isFav = state.favorites && state.favorites.indexOf(obj.id) !== -1;
                const info = commListingProfile(obj);
                const area = obj.reArea ? (obj.reArea + ' м²') : '';
                const deal = obj.reDeal === 'арендовать' ? 'Аренда' : 'Продажа';
                const priceNote = obj.reDeal === 'арендовать' ? '<span class="text-[11px] font-semibold text-slate-400"> / мес</span>' : '';
                const loc = obj.reLocation || 'Волгодонск';
                const cmpOn = (window.commCompare || []).indexOf(obj.id) !== -1;
                return '<div onclick="openProductModal(\'' + obj.id + '\')" class="flex gap-3 bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm cursor-pointer active:scale-[0.99] transition-transform">' +
                    '<div class="relative w-[118px] h-[118px] shrink-0 bg-slate-200">' +
                    '<img src="' + (obj.image || '') + '" class="w-full h-full object-cover" alt="">' +
                    '<span class="absolute top-2 left-2 bg-[#1e6091] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">' + deal + '</span>' +
                    '<button type="button" onclick="event.stopPropagation(); toggleFavorite(\'' + obj.id + '\'); renderCommListings();" class="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm ' + (isFav ? 'text-[#f43f5e]' : 'text-slate-300') + '">' +
                    '<svg class="w-4 h-4 ' + (isFav ? 'fill-current' : '') + '" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>' +
                    '</div>' +
                    '<div class="flex-1 py-2.5 pr-3 min-w-0 flex flex-col">' +
                    '<p class="text-[16px] font-extrabold text-slate-900 leading-none">' + (obj.price || '') + priceNote + '</p>' +
                    '<p class="text-[13px] text-slate-800 mt-1.5 leading-snug line-clamp-2">' + (obj.title || '') + '</p>' +
                    '<p class="text-[11px] text-slate-400 mt-1">' + [area, commTypeLabel(obj.reType), info.biz ? 'Бизнес' : 'Помещение'].filter(Boolean).join(' · ') + '</p>' +
                    '<p class="text-[11px] text-slate-400 truncate mt-1">' + commPostedLabel(obj.id) + ' · ' + loc + '</p>' +
                    '<button type="button" onclick="event.stopPropagation(); toggleCommCompare(\'' + obj.id + '\')" class="mt-auto self-start text-[11px] font-bold ' + (cmpOn ? 'text-[#1e6091]' : 'text-slate-400') + '">' + (cmpOn ? 'В сравнении' : 'Сравнить') + '</button>' +
                    '</div></div>';
            }).join('');
            renderCommCompareBar();
        }
        function renderCommCompareBar() {
            const bar = document.getElementById('comm-compare-bar');
            if (!bar) return;
            const n = (window.commCompare || []).length;
            if (!n) {
                bar.classList.add('hidden');
                bar.innerHTML = '';
                return;
            }
            bar.classList.remove('hidden');
            bar.innerHTML = '<div class="bg-[#1e6091] text-white rounded-2xl px-4 py-3 flex items-center justify-between shadow-lg"><span class="text-[13px] font-bold">Сравнение · ' + n + '</span><button type="button" onclick="openCommCompare()" class="bg-white text-[#1e6091] text-[12px] font-bold px-3 py-1.5 rounded-full">Открыть</button></div>';
        }
        function commCountWord(n) {
            const m = n % 100;
            const d = n % 10;
            if (m > 10 && m < 20) return 'объявлений';
            if (d === 1) return 'объявление';
            if (d > 1 && d < 5) return 'объявления';
            return 'объявлений';
        }
        function renderCommTypeOptions() {
            const q = ((document.getElementById('comm-type-search') || {}).value || '').trim().toLowerCase();
            const selected = commFilters.typeDraft || [];
            const box = document.getElementById('comm-type-options');
            if (!box) return;
            const types = COMM_TYPES.filter(function (t) {
                const label = commTypeLabel(t).toLowerCase();
                return !q || label.indexOf(q) !== -1 || t.indexOf(q) !== -1;
            });
            if (!types.length) {
                box.innerHTML = '<p class="py-8 text-center text-[13px] text-slate-400">Ничего не найдено</p>';
                return;
            }
            box.innerHTML = types.map(function (t) {
                const on = selected.indexOf(t) !== -1;
                const check = on ? '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>' : '';
                return '<button type="button" class="comm-check' + (on ? ' on' : '') + '" onclick="toggleCommType(\'' + t + '\')"><span class="comm-box">' + check + '</span><span class="text-[15px] text-slate-800">' + commTypeLabel(t) + '</span></button>';
            }).join('');
        }
        function toggleCommType(t) {
            if (!commFilters.typeDraft) commFilters.typeDraft = commFilters.types.slice();
            const i = commFilters.typeDraft.indexOf(t);
            if (i >= 0) commFilters.typeDraft.splice(i, 1);
            else commFilters.typeDraft.push(t);
            renderCommTypeOptions();
        }
        function openCommTypeSheet() {
            commFilters.typeDraft = commFilters.types.slice();
            const search = document.getElementById('comm-type-search');
            if (search) search.value = '';
            renderCommTypeOptions();
            commSheetShow('comm-type-sheet', true);
        }
        function closeCommTypeSheet() { commSheetShow('comm-type-sheet', false); }
        function resetCommTypes() {
            commFilters.typeDraft = [];
            renderCommTypeOptions();
        }
        function applyCommTypeSheet() {
            commFilters.types = (commFilters.typeDraft || []).slice();
            closeCommTypeSheet();
            renderCommListings();
        }
        function openCommPriceSheet() {
            const setVal = function (id, v) { const el = document.getElementById(id); if (el) el.value = (v != null ? v : ''); };
            setVal('comm-price-min', commFilters.priceMin);
            setVal('comm-price-max', commFilters.priceMax);
            setVal('comm-area-min', commFilters.areaMin);
            setVal('comm-area-max', commFilters.areaMax);
            commSheetShow('comm-price-sheet', true);
        }
        function closeCommPriceSheet() { commSheetShow('comm-price-sheet', false); }
        function resetCommPriceArea() {
            ['comm-price-min', 'comm-price-max', 'comm-area-min', 'comm-area-max'].forEach(function (id) {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
        }
        function applyCommPriceSheet() {
            const num = function (id) {
                const v = parseInt((document.getElementById(id) || {}).value, 10);
                return isNaN(v) ? null : v;
            };
            commFilters.priceMin = num('comm-price-min');
            commFilters.priceMax = num('comm-price-max');
            commFilters.areaMin = num('comm-area-min');
            commFilters.areaMax = num('comm-area-max');
            closeCommPriceSheet();
            renderCommListings();
        }
        function resetCommFilters() {
            commFilters = { deal: 'all', types: [], typeDraft: [], priceMin: null, priceMax: null, areaMin: null, areaMax: null, sort: 'new', owner: false, firstLine: false, power380: false, ceilingMin: null, biz: 'all', viewMode: commFilters.viewMode || 'list' };
            const s = document.getElementById('comm-search');
            if (s) s.value = '';
            closeCommSheets();
            renderCommListings();
        }
