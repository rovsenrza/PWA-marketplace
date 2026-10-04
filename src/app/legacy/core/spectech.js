/* Спецтехника.
   Каталог аренды, фильтры, карточка, расчёт смен, телефон.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */

const ST_CATS = ['Все', 'Землеройная', 'Грузовые', 'Манипуляторы', 'Подъём', 'Транспорт', 'Коммунальная', 'Складская'];

const ST_QUICK = [
    { id: 'all', label: 'Все' },
    { id: 'Трактор', label: 'Трактор' },
    { id: 'КАМАЗ', label: 'КАМАЗ' },
    { id: 'Газель', label: 'Газель' },
    { id: 'Погрузчик', label: 'Погрузчик' },
    { id: 'Кран', label: 'Кран' },
    { id: 'Экскаватор', label: 'Экскаватор' }
];

function stRub(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }

function stAvailText(a) { return a === 'today' ? 'Свободно сегодня' : a === 'tomorrow' ? 'Завтра' : 'Свободно на неделе'; }

function stFiltered() {
    const s = window.stState;
    const q = ((document.getElementById('st-search') || {}).value || '').trim().toLowerCase();
    let list = (spectechDb || []).slice();
    if (s.cat && s.cat !== 'все') list = list.filter(x => x.cat === s.cat);
    if (s.quick && s.quick !== 'all') list = list.filter(x => x.type === s.quick || (x.name || '').indexOf(s.quick) !== -1);
    if (s.crew) list = list.filter(x => x.crew);
    if (s.today) list = list.filter(x => x.available === 'today');
    if (s.favOnly) list = list.filter(x => window.stFavs.indexOf(x.id) !== -1);
    if (q) list = list.filter(x => (x.name + ' ' + x.type + ' ' + x.cat + ' ' + x.company).toLowerCase().indexOf(q) !== -1);
    if (s.sort === 'cheap') list.sort((a, b) => a.priceShift - b.priceShift);
    else if (s.sort === 'exp') list.sort((a, b) => b.priceShift - a.priceShift);
    return list;
}

function stSyncChips() {
    const s = window.stState;
    const crew = document.getElementById('st-chip-crew');
    const today = document.getElementById('st-chip-today');
    const unit = document.getElementById('st-chip-unit');
    const fav = document.getElementById('st-chip-fav');
    const sort = document.getElementById('st-chip-sort');
    if (crew) crew.className = 'comm-chip' + (s.crew ? ' on' : '');
    if (today) today.className = 'comm-chip' + (s.today ? ' on' : '');
    if (unit) { unit.className = 'comm-chip on'; unit.textContent = s.unit === 'hour' ? 'За час' : 'За смену'; }
    if (fav) fav.className = 'comm-chip' + (s.favOnly ? ' on' : '');
    if (sort) sort.textContent = s.sort === 'cheap' ? 'Сначала дешевле' : s.sort === 'exp' ? 'Сначала дороже' : 'Сначала популярные';
}

function setStCat(cat) { window.stState.cat = cat || 'все'; renderSpectech(); }

function setStQuick(id) { window.stState.quick = id || 'all'; renderSpectech(); }

function toggleStCrew() { window.stState.crew = !window.stState.crew; renderSpectech(); }

function toggleStToday() { window.stState.today = !window.stState.today; renderSpectech(); }

function toggleStFavOnly() { window.stState.favOnly = !window.stState.favOnly; renderSpectech(); }

function toggleStUnit() { window.stState.unit = window.stState.unit === 'hour' ? 'shift' : 'hour'; renderSpectech(); if (window.stCurrent) fillSpectechModal(window.stCurrent); }

function cycleStSort() { window.stState.sort = window.stState.sort === 'pop' ? 'cheap' : window.stState.sort === 'cheap' ? 'exp' : 'pop'; renderSpectech(); }

function toggleStFav(id, ev) {
    if (ev) ev.stopPropagation();
    const i = window.stFavs.indexOf(id);
    if (i >= 0) window.stFavs.splice(i, 1); else window.stFavs.push(id);
    renderSpectech();
    if (window.stCurrent && window.stCurrent.id === id) stSyncModalFav();
}

function toggleStFavCurrent() { if (window.stCurrent) toggleStFav(window.stCurrent.id); }

function stSyncModalFav() {
    const btn = document.getElementById('st-modal-fav');
    if (!btn || !window.stCurrent) return;
    const on = window.stFavs.indexOf(window.stCurrent.id) !== -1;
    btn.innerHTML = on ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linejoin="round" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linejoin="round" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
    btn.style.color = on ? '#E5195E' : '#fff';
}

function renderSpectech() {
    const quickEl = document.getElementById('st-quick-row');
    const chipsEl = document.getElementById('st-cat-chips');
    const listEl = document.getElementById('st-list');
    const countEl = document.getElementById('st-count');
    const s = window.stState;
    if (quickEl) {
        quickEl.innerHTML = ST_QUICK.map(q => {
            const on = s.quick === q.id ? ' on' : '';
            const mark = q.id === 'all' ? 'Все' : q.label.slice(0, 2);
            return `<button type="button" class="st-quick${on}" onclick="setStQuick('${q.id}')"><span class="st-quick-ico text-[12px] font-extrabold tracking-wide">${mark}</span><span class="text-[10px] font-bold text-slate-600">${q.label}</span></button>`;
        }).join('');
    }
    if (chipsEl) {
        chipsEl.innerHTML = ST_CATS.map(c => {
            const val = c === 'Все' ? 'все' : c;
            return `<button type="button" onclick="setStCat('${val}')" class="comm-chip${s.cat === val ? ' on' : ''}">${c}</button>`;
        }).join('');
    }
    stSyncChips();
    const list = stFiltered();
    const parkEl = document.getElementById('st-park-n');
    const todayEl = document.getElementById('st-today-n');
    if (parkEl) parkEl.textContent = String((spectechDb || []).length);
    if (todayEl) todayEl.textContent = String((spectechDb || []).filter(x => x.available === 'today').length);
    if (countEl) countEl.textContent = list.length ? (list.length + ' единиц в аренду') : 'Ничего не найдено';
    if (!listEl) return;
    if (!list.length) {
        listEl.innerHTML = '<div class="py-12 text-center text-sm text-slate-400">Нет техники по этим условиям</div>';
        return;
    }
    listEl.innerHTML = list.map(item => {
        const price = s.unit === 'hour' ? stRub(item.priceHour) + ' / час' : stRub(item.priceShift) + ' / смена';
        const fav = window.stFavs.indexOf(item.id) !== -1;
        const wait = item.available !== 'today';
        return `<div onclick="openSpectechModal('${item.id}')" class="st-card active:scale-[0.99] transition-transform">
            <div class="relative h-40 bg-slate-200">
                <img src="${item.photo}" class="w-full h-full object-cover" alt="">
                <div class="absolute inset-0 bg-gradient-to-t from-[#12283c]/80 via-transparent to-transparent"></div>
                <button type="button" onclick="toggleStFav('${item.id}', event)" class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/35 backdrop-blur text-white text-sm flex items-center justify-center" style="color:${fav ? '#E5195E' : '#fff'}">${fav ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linejoin="round" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linejoin="round" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>'}</button>
                <span class="absolute top-2.5 left-2.5 text-[9px] font-extrabold uppercase tracking-wider bg-[#1e6091] text-white px-2 py-1 rounded-full">${item.cat}</span>
                <div class="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                    <h4 class="text-white font-extrabold text-[15px] leading-tight drop-shadow pr-2">${item.name}</h4>
                    <span class="shrink-0 text-[12px] font-extrabold text-sky-200">${price}</span>
                </div>
            </div>
            <div class="px-3.5 py-3 flex items-center justify-between gap-2">
                <div class="min-w-0">
                    <p class="text-[11px] font-semibold text-slate-700 truncate">${item.company}</p>
                    <p class="text-[10px] text-slate-400">${item.crew ? 'С экипажем' : 'Без экипажа'} · <span class="mk-rating"><svg class="mk-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg>${item.rating}</span></p>
                </div>
                <span class="st-avail${wait ? ' wait' : ''} shrink-0"><i></i>${stAvailText(item.available)}</span>
            </div>
        </div>`;
    }).join('');
}

function openSpectechModal(id) {
    const item = (spectechDb || []).find(x => x.id === id);
    if (!item) return;
    window.stCurrent = item;
    window.stPhotoI = 0;
    window.stPhoneShown = false;
    window.stState.shifts = item.minShift || 1;
    fillSpectechModal(item);
    const m = document.getElementById('spectech-modal');
    if (m) m.classList.remove('hidden');
}

function closeSpectechModal() {
    const m = document.getElementById('spectech-modal');
    if (m) m.classList.add('hidden');
    window.stCurrent = null;
}

function stModalPhotos() {
    const item = window.stCurrent;
    if (!item) return [];
    return (item.photos && item.photos.length) ? item.photos : [item.photo];
}

function stCyclePhoto(dir) {
    const photos = stModalPhotos();
    if (!photos.length) return;
    window.stPhotoI = (window.stPhotoI + (dir || 1) + photos.length) % photos.length;
    const img = document.getElementById('st-modal-photo');
    if (img) img.src = photos[window.stPhotoI];
    stRenderDots();
}

function stRenderDots() {
    const el = document.getElementById('st-modal-dots');
    const photos = stModalPhotos();
    if (!el) return;
    el.innerHTML = photos.map((_, i) => `<span class="inline-block h-1.5 rounded-full ${i === window.stPhotoI ? 'w-5 bg-sky-300' : 'w-1.5 bg-white/40'}"></span>`).join('');
}

function fillSpectechModal(item) {
    const s = window.stState;
    const photos = stModalPhotos();
    document.getElementById('st-modal-photo').src = photos[window.stPhotoI] || item.photo;
    document.getElementById('st-modal-cat').textContent = item.cat + ' · ' + item.type;
    document.getElementById('st-modal-title').textContent = item.name;
    document.getElementById('st-modal-price').textContent = s.unit === 'hour' ? stRub(item.priceHour) : stRub(item.priceShift);
    document.getElementById('st-modal-price-sub').textContent = s.unit === 'hour' ? 'за моточас' : 'за смену 8 часов';
    const av = document.getElementById('st-modal-avail');
    av.className = 'st-avail' + (item.available === 'today' ? '' : ' wait');
    av.innerHTML = '<i></i>' + stAvailText(item.available);
    document.getElementById('st-modal-company').textContent = item.company;
    document.getElementById('st-modal-loc').textContent = item.loc || 'Волгодонск';
    document.getElementById('st-modal-rating').innerHTML = '<svg class="mk-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg><span>' + item.rating + '</span>';
    document.getElementById('st-modal-desc').textContent = item.desc + (item.extra ? ' ' + item.extra : '');
    document.getElementById('st-modal-specs').innerHTML = (item.specs || []).map(sp => `<div class="st-spec"><p class="text-[10px] text-slate-400">${sp[0]}</p><p class="font-bold text-slate-800 mt-0.5">${sp[1]}</p></div>`).join('');
    document.getElementById('st-modal-includes').innerHTML = (item.includes || []).map(t => `<span class="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#e8f1fc] text-[#1e6091]">${t}</span>`).join('');
    document.getElementById('st-modal-delivery').textContent = item.delivery;
    document.getElementById('st-modal-min').textContent = (item.minShift || 1) + ' смена';
    document.getElementById('st-modal-note').textContent = (item.crew ? 'Экипаж в цене · ' : 'Без экипажа · ') + (item.delivery || '');
    stRenderDots();
    stSyncModalFav();
    stUpdateTotal();
}

function stShiftDelta(d) {
    const item = window.stCurrent;
    if (!item) return;
    const min = item.minShift || 1;
    window.stState.shifts = Math.max(min, Math.min(14, (window.stState.shifts || 1) + d));
    stUpdateTotal();
}

function stUpdateTotal() {
    const item = window.stCurrent;
    if (!item) return;
    const n = window.stState.shifts || 1;
    document.getElementById('st-modal-shifts').textContent = n;
    const total = n * item.priceShift;
    document.getElementById('st-modal-total').textContent = stRub(total);
}

function revealSpectechPhone() {
    const item = window.stCurrent;
    if (!item) return;
    window.stPhoneShown = true;
    showSmsToast(item.phone);
}

function requestSpectech() {
    const item = window.stCurrent;
    if (!item) return;
    const n = window.stState.shifts || 1;
    showSmsToast('Заявка: ' + item.name + ', ' + n + ' смен. ' + item.company + ' перезвонит за 10 минут.');
}
