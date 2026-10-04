/* Недвижимость.
   Коммерческие объявления: план, карта, сравнение, запись на просмотр.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


function pmIsCommercial(prod) {
    if (!prod) return false;
    if (typeof isCommercialListing === 'function') return isCommercialListing(prod);
    return prod.reSegment === 'commercial';
}


function commListingProfile(prod) {
    const t = String((prod && prod.reType) || '').toLowerCase();
    const isRent = prod && prod.reDeal === 'арендовать';
    const by = {
        'офис': { floor: '3 из 5', ceiling: '3.2 м', parking: 'Гостевая', entrance: 'Через холл', power: '15 кВт', condition: 'С отделкой', features: ['Интернет', 'Кондиционер', 'Охрана 24/7'], suitable: ['Офис', 'Бухгалтерия', 'Юр. адрес'], nearby: 'Центр, парковка, остановки рядом' },
        'торговая площадь': { floor: '1 из 2', ceiling: '3.5 м', parking: 'У ТЦ', entrance: 'С улицы', power: '20 кВт', condition: 'Под отделку', features: ['Витрины', 'Первая линия', 'Трафик'], suitable: ['Магазин', 'Пункт выдачи', 'Салон'], nearby: 'Первая линия, поток покупателей' },
        'склад': { floor: '1', ceiling: '6 м', parking: 'Для фур', entrance: 'Пандус', power: '380 В', condition: 'Отапливаемый', features: ['Пандус', 'Зона разгрузки', 'Охрана'], suitable: ['Склад', 'Ответхранение', 'Интернет-магазин'], nearby: 'Промзона, подъезд фуры' },
        'кладовая': { floor: 'Цоколь', ceiling: '2.4 м', parking: '—', entrance: 'Со двора', power: 'Освещение', condition: 'Сухое', features: ['Доступ 24/7', 'Сухое'], suitable: ['Хранение', 'Архив'], nearby: 'Жилой дом, доступ 24/7' },
        'производство': { floor: '1', ceiling: '8 м', parking: 'Для фур', entrance: 'Ворота', power: '380 В', condition: 'Цех', features: ['Кран-балка', 'Подъезд фур'], suitable: ['Производство', 'Цех', 'Склад'], nearby: 'Промзона, удобный въезд' },
        'общепит': { floor: '1 из 1', ceiling: '3.3 м', parking: 'Гостевая', entrance: 'С улицы', power: '25 кВт', condition: 'С вытяжкой', features: ['Вытяжка', 'Посадка', 'Мокрые точки'], suitable: ['Кафе', 'Кофейня', 'Столовая'], nearby: 'Жилой массив, остановка' },
        'гостиница': { floor: '3 этажа', ceiling: '2.8 м', parking: 'Своя', entrance: 'Ресепшен', power: '50 кВт', condition: 'Действующий бизнес', features: ['Номера', 'Парковка', 'Ресепшен'], suitable: ['Гостиница', 'Хостел', 'Апартаменты'], nearby: 'Центр города, парковка' },
        'автосервис': { floor: '1', ceiling: '4.5 м', parking: 'Перед боксами', entrance: 'Ворота', power: '380 В', condition: 'Готовый', features: ['Ямы', 'Компрессор', 'Приёмка'], suitable: ['СТО', 'Шиномонтаж', 'Детейлинг'], nearby: 'Трасса, удобный съезд' },
        'здание целиком': { floor: '3 этажа', ceiling: '3.3 м', parking: 'Двор', entrance: 'Отдельное здание', power: '100 кВт', condition: 'Готово к работе', features: ['Лифт', '3 этажа', 'Отдельно стоящее'], suitable: ['Бизнес-центр', 'Медцентр', 'Офисы'], nearby: 'Центр, двор, парковка' },
        'свободного назначения': { floor: '1 из 4', ceiling: '3.2 м', parking: 'Есть', entrance: 'С улицы', power: '18 кВт', condition: 'Открытая планировка', features: ['Отдельный вход', 'Витрины'], suitable: ['Офис', 'Студия', 'Шоурум'], nearby: 'Новый город, вход с улицы' }
    };
    const deal = isRent
        ? { vat: 'НДС не облагается', deposit: '1 месяц', utilities: 'Коммуналка отдельно', term: 'От 11 месяцев', sublease: 'По согласованию', fee: 'Без комиссии' }
        : { vat: 'НДС не облагается', deposit: '—', utilities: 'По счётчикам', term: 'Прямая продажа', sublease: '—', fee: 'Без комиссии', burden: 'Без обременений' };
    const base = Object.assign({ owner: commIsOwner(prod), suitable: [], nearby: '', features: [] }, by[t] || { floor: '—', ceiling: '—', parking: '—', entrance: '—', power: '—', condition: '—' }, deal);
    const info = Object.assign(base, (prod && prod.reComm) || {});
    info.ceilingM = parseFloat(String(info.ceiling || '').replace(',', '.')) || 0;
    info.power380 = /380/.test(String(info.power || ''));
    info.firstLine = t === 'торговая площадь' || t === 'общепит' || (info.features || []).indexOf('Первая линия') !== -1 || /с улицы/i.test(String(info.entrance || ''));
    info.floor1 = /^1\b/.test(String(info.floor || ''));
    info.biz = t === 'гостиница' || t === 'общепит' || t === 'автосервис' || /бизнес/i.test(String(info.condition || ''));
    info.opex = info.opex || ({ 'офис': 280, 'торговая площадь': 420, 'склад': 160, 'производство': 140, 'общепит': 380, 'гостиница': 220, 'автосервис': 190, 'здание целиком': 250, 'свободного назначения': 300, 'кладовая': 80 }[t] || 200);
    info.plan = info.plan || commPlanImage(prod && prod.title);
    info.ownership = info.ownership || (prod && prod.id === 're-16' ? 'По договору аренды' : 'Собственность');
    info.legal = prod && prod.id === 're-16' ? false : info.legal !== false;
    if (!info.burden) info.burden = (prod && prod.id === 're-15') ? 'Залог в банке' : (isRent ? '—' : 'Нет');
    return info;
}

function commPlanImage(title) {
    const label = String(title || 'Планировка').replace(/[<>&]/g, '');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 300"><rect width="420" height="300" fill="#eef4f8"/><rect x="22" y="18" width="376" height="248" fill="#fff" stroke="#1e6091" stroke-width="3"/><line x1="170" y1="18" x2="170" y2="266" stroke="#1e6091" stroke-width="2"/><line x1="22" y1="150" x2="170" y2="150" stroke="#93c5d8" stroke-width="2"/><rect x="196" y="40" width="172" height="100" fill="#dbeafe" stroke="#1e6091"/><rect x="196" y="158" width="80" height="88" fill="#f8fafc" stroke="#94a3b8"/><text x="30" y="290" font-size="13" fill="#1e6091" font-family="Arial">' + label + '</text></svg>';
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function commPhone(id) {
    const n = parseInt(String(id).replace(/\D/g, '') || '4', 10);
    const a = String(10 + (n % 89)).padStart(2, '0');
    const b = String(10 + ((n * 7) % 89)).padStart(2, '0');
    return '+7 904 555-' + a + '-' + b;
}

function commPostedDays(id) {
    if (window.commActual && window.commActual[id]) return 0;
    let h = 0;
    String(id || '').split('').forEach(function (c) { h += c.charCodeAt(0); });
    return h % 11;
}

function commPostedLabel(id) {
    const d = commPostedDays(id);
    if (d === 0) return 'Сегодня';
    if (d === 1) return 'Вчера';
    const m = d % 10;
    if (d > 10 && d < 20) return d + ' дней назад';
    if (m === 1) return d + ' день назад';
    if (m > 1 && m < 5) return d + ' дня назад';
    return d + ' дней назад';
}

function commMapPos(prod) {
    const loc = String((prod && prod.reLocation) || '').toLowerCase();
    let x = 50, y = 48;
    if (loc.indexOf('ленин') !== -1 || loc.indexOf('центр') !== -1) { x = 46; y = 36; }
    else if (loc.indexOf('новый') !== -1) { x = 70; y = 30; }
    else if (loc.indexOf('пром') !== -1 || loc.indexOf('южн') !== -1) { x = 26; y = 72; }
    else if (loc.indexOf('трасс') !== -1 || loc.indexOf('ростов') !== -1) { x = 16; y = 58; }
    else if (loc.indexOf('восток') !== -1 || loc.indexOf('тц') !== -1) { x = 54; y = 44; }
    else if (loc.indexOf('морск') !== -1) { x = 74; y = 60; }
    else if (loc.indexOf('в-9') !== -1 || loc.indexOf('строител') !== -1) { x = 64; y = 40; }
    const j = (String(prod.id || 'a').charCodeAt(prod.id.length - 1) % 7) - 3;
    return { x: Math.max(10, Math.min(90, x + j)), y: Math.max(14, Math.min(86, y + (j % 4))) };
}

function commIsOwner(prod) {
    if (!prod) return false;
    if (prod.reOwner === true || (prod.reComm && prod.reComm.owner === true)) return true;
    if (prod.reOwner === false) return false;
    return ['re-4', 're-10', 're-12', 're-16', 're-18', 're-19'].indexOf(prod.id) !== -1;
}


function applyPmCommercialLayout(prod) {
    const isComm = pmIsCommercial(prod);
    const aboutBtn = document.getElementById('pm-about-toggle');
    const aboutPanel = document.getElementById('pm-about-panel');
    const sellerWrap = document.getElementById('pm-seller-wrap');
    const commBox = document.getElementById('pm-comm');
    const cartBtn = document.getElementById('pm-cart-btn');
    const viewBtn = document.getElementById('pm-comm-view-btn');
    const callBtn = document.getElementById('pm-comm-call-btn');
    const mgrBtn = document.getElementById('pm-manager-btn');
    const mgrLabel = document.getElementById('pm-manager-label');
    const similarTitle = document.getElementById('pm-similar-title');
    const shareBtn = document.getElementById('pm-comm-share-btn');
    const tabs = document.getElementById('pm-comm-tabs');
    if (aboutBtn) aboutBtn.classList.toggle('hidden', isComm || pmIsGoods(prod));
    if (aboutPanel) aboutPanel.classList.toggle('hidden', isComm || pmIsGoods(prod));
    if (sellerWrap) sellerWrap.classList.toggle('hidden', isComm);
    if (cartBtn) cartBtn.classList.toggle('hidden', isComm);
    if (viewBtn) viewBtn.classList.toggle('hidden', !isComm);
    if (callBtn) callBtn.classList.toggle('hidden', !isComm);
    if (mgrBtn) mgrBtn.classList.toggle('hidden', isComm);
    if (shareBtn) shareBtn.classList.remove('hidden');
    if (tabs) tabs.classList.toggle('hidden', !isComm);
    if (mgrLabel) mgrLabel.textContent = isComm ? 'Написать' : 'Менеджеру';
    if (similarTitle) similarTitle.textContent = isComm ? 'Похожие помещения' : 'Похожие товары';
    pmSetGoodsVisible(!isComm && pmIsGoods(prod));
    if (!commBox) return;
    if (!isComm) {
        commBox.classList.add('hidden');
        commBox.innerHTML = '';
        window.pmPlanImage = '';
        const thumbs = document.getElementById('pm-thumbs');
        if (thumbs && window.pmImages) thumbs.classList.toggle('hidden', window.pmImages.length < 2);
        return;
    }
    const info = commListingProfile(prod);
    const isRent = prod.reDeal === 'арендовать';
    const priceNum = typeof commParsePrice === 'function' ? commParsePrice(prod) : (parseInt(String(prod.price || '0').replace(/\D/g, ''), 10) || 0);
    const area = parseInt(prod.reArea || '0', 10) || 0;
    const perM = area ? Math.round(priceNum / area) : 0;
    const fmt = typeof commFmtNum === 'function' ? commFmtNum : function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    const typeLabel = typeof commTypeLabel === 'function' ? commTypeLabel(prod.reType) : (prod.reType || 'Объект');
    const loc = prod.reLocation || 'Волгодонск';
    const yearNote = isRent && priceNum ? ('<p class="text-[12px] text-slate-400 mt-1">' + fmt(priceNum * 12) + ' ₽ в год · ' + fmt(perM) + ' ₽/м² в месяц</p>') : (perM ? '<p class="text-[12px] text-slate-400 mt-1">' + fmt(perM) + ' ₽/м²</p>' : '');
    document.getElementById('pm-price').innerHTML =
        '<div class="flex items-end gap-2 flex-wrap"><span class="oz-price-main">' + pmEsc(prod.price || '') + '</span>' +
        (isRent ? '<span class="text-[13px] font-semibold text-slate-400 mb-0.5">/ мес</span>' : '') + '</div>' + yearNote;
    const badgeEl = document.getElementById('pm-badge');
    if (badgeEl) {
        const bizPill = info.biz ? '<span class="inline-flex bg-[#16324a] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Готовый бизнес</span>' : '<span class="inline-flex bg-white/90 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full">Помещение</span>';
        badgeEl.innerHTML = '<div class="flex gap-1 flex-wrap"><span class="inline-flex bg-[#1e6091] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">' + (isRent ? 'Аренда' : 'Продажа') + '</span>' + bizPill + '</div>';
    }
    window.pmPlanImage = info.plan;
    window.commMediaTab = 'photo';
    setCommMediaTab('photo');
    const inCmp = (window.commCompare || []).indexOf(prod.id) !== -1;
    const feats = (info.features || []).map(function (f) { return '<span class="comm-feat">' + pmEsc(f) + '</span>'; }).join('');
    const suited = (info.suitable || []).map(function (f) { return '<span class="comm-feat">' + pmEsc(f) + '</span>'; }).join('');
    const descHtml = String(prod.description || '')
        .split(/\n\n+/)
        .filter(Boolean)
        .map(function (p) { return '<p>' + pmEsc(p) + '</p>'; })
        .join('') || '<p>Описание уточняйте при просмотре.</p>';
    const opexLabel = '+' + fmt(info.opex) + ' ₽/м²';
    const dealRows = isRent
        ? [['НДС', info.vat], ['Залог', info.deposit], ['Коммуналка', info.utilities], ['Эксплуатация', opexLabel], ['Срок', info.term]]
        : [['НДС', info.vat], ['Обременения', info.burden || 'Без обременений'], ['Комиссия', info.fee], ['Эксплуатация', opexLabel], ['Сделка', info.term]];
    const dealHtml = dealRows.map(function (row) {
        return '<div class="comm-param"><span>' + pmEsc(row[0]) + '</span><b>' + pmEsc(row[1] || '—') + '</b></div>';
    }).join('');
    commBox.classList.remove('hidden');
    commBox.innerHTML =
        '<div class="comm-stats">' +
            '<div class="comm-stat"><b>' + (area ? area + ' м²' : '—') + '</b><span>Площадь</span></div>' +
            '<div class="comm-stat"><b>' + pmEsc(info.floor) + '</b><span>Этаж</span></div>' +
            '<div class="comm-stat"><b>' + pmEsc(info.ceiling) + '</b><span>Потолки</span></div>' +
        '</div>' +
        (suited ? '<div><p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Подходит для</p><div class="flex flex-wrap gap-1.5">' + suited + '</div></div>' : '') +
        '<div class="comm-deal-card"><p class="lbl">Условия сделки</p>' + dealHtml +
            (isRent ? '<div class="comm-param" style="border-bottom:0"><span>Субаренда</span><b>' + pmEsc(info.sublease || '—') + '</b></div>' : '') +
        '</div>' +
        '<div>' +
            '<button type="button" id="pm-comm-params-toggle" onclick="toggleCommParams()" class="pm-about-link" aria-expanded="false">' +
                'Параметры' +
                '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>' +
            '</button>' +
            '<div id="pm-comm-params-panel" class="pm-about-panel">' +
                '<div class="pm-about-panel-inner">' +
                    '<div class="pt-1">' +
                        '<div class="comm-param"><span>Тип</span><b>' + pmEsc(typeLabel) + '</b></div>' +
                        '<div class="comm-param"><span>Состояние</span><b>' + pmEsc(info.condition) + '</b></div>' +
                        '<div class="comm-param"><span>Вход</span><b>' + pmEsc(info.entrance) + '</b></div>' +
                        '<div class="comm-param"><span>Парковка</span><b>' + pmEsc(info.parking) + '</b></div>' +
                        '<div class="comm-param"><span>Электричество</span><b>' + pmEsc(info.power) + '</b></div>' +
                        (feats ? '<div class="flex flex-wrap gap-1.5 pt-3">' + feats + '</div>' : '') +
                        '<div class="comm-desc pt-4">' +
                            '<p class="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2" style="color:#94a3b8;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Описание</p>' +
                            descHtml +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<button type="button" onclick="openCommListingMap()" class="w-full text-left">' +
            '<div class="comm-map mb-2.5"><div class="comm-map-pin"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg></div></div>' +
            '<p class="text-[14px] font-bold text-slate-900">' + pmEsc(loc) + '</p>' +
            (info.nearby ? '<p class="text-[12px] text-slate-500 mt-0.5">' + pmEsc(info.nearby) + '</p>' : '') +
            '<p class="text-[12px] text-[#1e6091] font-semibold mt-0.5">Открыть на карте ›</p>' +
        '</button>' +
        '<div class="comm-deal-card"><p class="lbl">Документы</p>' +
            '<div class="comm-param"><span>Право</span><b>' + pmEsc(info.ownership) + '</b></div>' +
            '<div class="comm-param"><span>Обременения</span><b>' + pmEsc(info.burden || 'Нет') + '</b></div>' +
            '<div class="comm-param"><span>Юрлицу</span><b>' + (info.legal ? 'Можно' : 'Нет') + '</b></div>' +
        '</div>' +
        '<div class="flex items-center justify-between gap-2">' +
            '<p class="text-[12px] text-slate-400">Размещено: ' + commPostedLabel(prod.id) + '</p>' +
            '<button type="button" onclick="markCommActual(\'' + prod.id + '\')" class="text-[12px] font-bold text-[#1e6091]">Ещё актуально</button>' +
        '</div>' +
        '<button type="button" onclick="toggleCommCompare(\'' + prod.id + '\')" class="w-full bg-white border border-slate-200 text-slate-800 font-bold py-3 rounded-2xl text-[13px]">' + (inCmp ? 'Убрать из сравнения' : 'Добавить к сравнению') + '</button>';
    setCommParamsOpen(false);
}


function openCommListingMap() {
    const prod = productsDb[window.currentProductId];
    const loc = (prod && prod.reLocation) || 'Волгодонск';
    window.open('https://yandex.ru/maps/?text=' + encodeURIComponent(loc), '_blank');
}

function setCommParamsOpen(open) {
    const panel = document.getElementById('pm-comm-params-panel');
    const btn = document.getElementById('pm-comm-params-toggle');
    if (panel) panel.classList.toggle('open', !!open);
    if (btn) {
        btn.classList.toggle('open', !!open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
}

function toggleCommParams() {
    const panel = document.getElementById('pm-comm-params-panel');
    setCommParamsOpen(!(panel && panel.classList.contains('open')));
}

function setCommMediaTab(tab) {
    window.commMediaTab = tab || 'photo';
    const photoBtn = document.getElementById('pm-comm-tab-photo');
    const planBtn = document.getElementById('pm-comm-tab-plan');
    const thumbs = document.getElementById('pm-thumbs');
    const img = document.getElementById('pm-main-image');
    const count = document.getElementById('pm-photo-count');
    if (photoBtn) photoBtn.className = 'comm-chip' + (window.commMediaTab === 'photo' ? ' on' : '');
    if (planBtn) planBtn.className = 'comm-chip' + (window.commMediaTab === 'plan' ? ' on' : '');
    if (window.commMediaTab === 'plan' && window.pmPlanImage) {
        if (img) img.src = window.pmPlanImage;
        if (thumbs) thumbs.classList.add('hidden');
        if (count) { count.classList.remove('hidden'); count.textContent = 'План'; }
        ['pm-prev', 'pm-next', 'pm-dots'].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        return;
    }
    if (thumbs) thumbs.classList.toggle('hidden', !(window.pmImages && window.pmImages.length > 1));
    if (img && window.pmImages && window.pmImages.length) img.src = window.pmImages[window.pmIndex || 0];
    if (typeof pmPaintGalleryChrome === 'function') pmPaintGalleryChrome();
}

function callCommListing() {
    const prod = productsDb[window.currentProductId];
    if (!prod) return;
    window.location.href = 'tel:' + commPhone(prod.id).replace(/\s/g, '');
}

function shareCommListing() {
    const prod = productsDb[window.currentProductId];
    if (!prod) return;
    const text = prod.title + ' — ' + prod.price + '\n' + (prod.reLocation || '');
    if (navigator.share) {
        navigator.share({ title: prod.title, text: text }).catch(function () {});
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { showSmsToast('Объявление скопировано'); }).catch(function () { showSmsToast(text); });
    } else showSmsToast(text);
}

function markCommActual(id) {
    window.commActual = window.commActual || {};
    window.commActual[id] = true;
    showSmsToast('Отмечено: ещё актуально');
    if (productsDb[id]) applyPmCommercialLayout(productsDb[id]);
}

function toggleCommCompare(id) {
    window.commCompare = window.commCompare || [];
    const i = window.commCompare.indexOf(id);
    if (i >= 0) window.commCompare.splice(i, 1);
    else {
        if (window.commCompare.length >= 3) return showSmsToast('Можно сравнить до 3 объектов');
        window.commCompare.push(id);
    }
    if (typeof renderCommListings === 'function') renderCommListings();
    if (productsDb[window.currentProductId]) applyPmCommercialLayout(productsDb[window.currentProductId]);
}

function openCommCompare() {
    const ids = window.commCompare || [];
    const box = document.getElementById('comm-compare-body');
    if (!box) return;
    if (ids.length < 2) return showSmsToast('Добавьте ещё объект');
    const rows = [['Объект'], ['Цена'], ['₽/м²'], ['Площадь'], ['Этаж'], ['Потолки'], ['380 В'], ['НДС'], ['Эксплуатация']];
    ids.forEach(function (id) {
        const p = productsDb[id];
        const info = commListingProfile(p);
        const area = parseInt(p.reArea || '0', 10) || 0;
        const per = area ? Math.round(commParsePrice(p) / area) : 0;
        rows[0].push('<button type="button" class="text-[#1e6091] font-bold text-left" onclick="closeCommCompare(); openProductModal(\'' + id + '\')">' + pmEsc(p.title) + '</button>');
        rows[1].push(pmEsc(p.price));
        rows[2].push(commFmtNum(per) + ' ₽');
        rows[3].push(area ? area + ' м²' : '—');
        rows[4].push(pmEsc(info.floor));
        rows[5].push(pmEsc(info.ceiling));
        rows[6].push(info.power380 ? 'Да' : 'Нет');
        rows[7].push(pmEsc(info.vat));
        rows[8].push('+' + commFmtNum(info.opex) + ' ₽/м²');
    });
    box.innerHTML = '<div class="overflow-x-auto"><table class="w-full text-[12px]">' + rows.map(function (r, idx) {
        return '<tr class="' + (idx === 0 ? '' : 'border-t border-slate-100') + '">' + r.map(function (c, ci) {
            return '<td class="py-2.5 pr-3 align-top ' + (ci === 0 ? 'text-slate-400 font-semibold whitespace-nowrap' : 'font-bold text-slate-800') + '">' + c + '</td>';
        }).join('') + '</tr>';
    }).join('') + '</table></div>';
    commSheetShow('comm-compare-sheet', true);
}

function closeCommCompare() { commSheetShow('comm-compare-sheet', false); }

function clearCommCompare() {
    window.commCompare = [];
    closeCommCompare();
    if (typeof renderCommListings === 'function') renderCommListings();
}

function copyCommListingId() {
    const id = window.currentProductId;
    if (!id) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(id).then(function () { showSmsToast('Номер скопирован'); }).catch(function () { showSmsToast(id); });
    } else showSmsToast(id);
}


let commViewDay = 'Сегодня';

let commViewTime = '12:00';

function commSheetToggle(id, on) {
    const e = document.getElementById(id);
    if (!e) return;
    e.classList.toggle('hidden', !on);
    e.classList.toggle('flex', !!on);
}

function openCommViewSheet() {
    const prod = productsDb[window.currentProductId];
    const obj = document.getElementById('comm-view-obj');
    if (obj) obj.textContent = prod ? prod.title : 'Объект';
    const days = ['Сегодня', 'Завтра', 'Сб', 'Вс'];
    const times = ['10:00', '12:00', '15:00', '18:00'];
    if (!days.includes(commViewDay)) commViewDay = 'Сегодня';
    if (!times.includes(commViewTime)) commViewTime = '12:00';
    const daysBox = document.getElementById('comm-view-days');
    const timesBox = document.getElementById('comm-view-times');
    if (daysBox) daysBox.innerHTML = days.map(function (d) {
        return '<button type="button" class="comm-slot' + (commViewDay === d ? ' on' : '') + '" onclick="setCommViewDay(\'' + d + '\')">' + d + '</button>';
    }).join('');
    if (timesBox) timesBox.innerHTML = times.map(function (t) {
        return '<button type="button" class="comm-slot' + (commViewTime === t ? ' on' : '') + '" onclick="setCommViewTime(\'' + t + '\')">' + t + '</button>';
    }).join('');
    commSheetToggle('comm-view-sheet', true);
}

function closeCommViewSheet() { commSheetToggle('comm-view-sheet', false); }

function setCommViewDay(d) { commViewDay = d; openCommViewSheet(); }

function setCommViewTime(t) { commViewTime = t; openCommViewSheet(); }

function confirmCommViewing() {
    closeCommViewSheet();
    showSmsToast('Просмотр: ' + commViewDay + ', ' + commViewTime);
}
