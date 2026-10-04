/* Каталог недвижимости.
   Агентства, фильтры объявлений, коммерческая недвижимость: тип, цена, площадь, сортировка.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */

// ================= НЕДВИЖИМОСТЬ =================

        // Моковые данные агентов (добавлены контакты)
        const mockAgents = [
            { name: 'Анна Смирнова', role: 'Эксперт по жилой недвижимости', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200', phone: '+79001234567', tg: 'https://t.me/anna', max: '#' },
            { name: 'Иван Петров', role: 'Специалист по загородной недвижимости', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200', phone: '+79001234568', tg: 'https://t.me/ivan', max: '#' },
            { name: 'Елена Кузнецова', role: 'Эксперт по инвестициям', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200', phone: '+79001234569', tg: 'https://t.me/elena', max: '#' }
        ];


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
                    <img src="${escHtml(agent.image)}" class="w-full h-full object-cover object-top">
                </div>
                <div class="p-3 flex flex-col flex-1 bg-white">
                    <h5 class="text-[12px] font-bold text-slate-900 leading-tight">${escHtml(agent.name)}</h5>
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
                        <img src="${escHtml(obj.image)}" class="w-full h-full object-cover">
                        <button onclick="event.stopPropagation(); toggleFavorite('${obj.id}'); applyReFilters();" class="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm transition-colors ${isFav ? 'text-[#f43f5e]' : 'text-slate-300'} hover:text-[#f43f5e]">
                            <svg class="w-4 h-4 ${isFav ? 'fill-current' : ''}" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                        </button>
                        <div class="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-md capitalize">${obj.reType || 'Объект'}</div>
                    </div>
                    <div class="p-3">
                        <p class="text-[10px] text-slate-500 font-medium truncate mb-1">${escHtml(specs)}</p>
                        <p class="text-[13px] font-extrabold text-slate-900 leading-none mb-2">${escHtml(obj.price)}</p>
                        <div class="flex items-center gap-1 text-[9px] text-slate-400 truncate">
                            <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            <span>${escHtml(obj.reLocation || 'Не указано')}</span>
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
            '<img src="' + (escHtml(obj.image || '')) + '" class="w-full h-full object-cover" alt="">' +
            '<span class="absolute top-2 left-2 bg-[#1e6091] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">' + deal + '</span>' +
            '<button type="button" onclick="event.stopPropagation(); toggleFavorite(\'' + obj.id + '\'); renderCommListings();" class="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm ' + (isFav ? 'text-[#f43f5e]' : 'text-slate-300') + '">' +
            '<svg class="w-4 h-4 ' + (isFav ? 'fill-current' : '') + '" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>' +
            '</div>' +
            '<div class="flex-1 py-2.5 pr-3 min-w-0 flex flex-col">' +
            '<p class="text-[16px] font-extrabold text-slate-900 leading-none">' + (escHtml(obj.price || '')) + priceNote + '</p>' +
            '<p class="text-[13px] text-slate-800 mt-1.5 leading-snug line-clamp-2">' + (escHtml(obj.title || '')) + '</p>' +
            '<p class="text-[11px] text-slate-400 mt-1">' + escHtml([area, commTypeLabel(obj.reType), info.biz ? 'Бизнес' : 'Помещение'].filter(Boolean).join(' · ')) + '</p>' +
            '<p class="text-[11px] text-slate-400 truncate mt-1">' + commPostedLabel(obj.id) + ' · ' + escHtml(loc) + '</p>' +
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
