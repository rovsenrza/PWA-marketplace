/* Ландшафтные студии.
   Участки, сезоны, этапы, заявки архитектору.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */

const LS_PLOTS = [
    { n: 6, t: '6 соток' },
    { n: 10, t: '10 соток' },
    { n: 15, t: '15+ соток' }
];

const LS_ATELIER = {
    'Флора Сервис': { focus: 'Сад под ключ', rate: 18500, zone: 'Посадки и полив' },
    'Зелёный Двор': { focus: 'Газон и изгороди', rate: 12400, zone: 'Партер' },
    'ПаркЛэнд': { focus: 'Крупномеры и двор', rate: 21000, zone: 'Деревья' },
    'Сад и Стиль': { focus: 'Проект и свет', rate: 16800, zone: 'Патио' }
};

const LS_SEASONS = [
    { id: 'all', t: 'Год' },
    { id: 'spring', t: 'Весна' },
    { id: 'summer', t: 'Лето' },
    { id: 'autumn', t: 'Осень' },
    { id: 'winter', t: 'Зима' }
];

const LS_SEASON_NOTE = {
    all: 'Работы идут весь год: зимой проектируем, весной сажаем, летом ведём сад, осенью готовим грунт.',
    spring: 'Весна — посадка, рулонный газон, запуск автополива и первая стрижка живых изгородей.',
    summer: 'Лето — стрижка, цветники, полив и уход. Удобный момент для освещения и малых форм.',
    autumn: 'Осень — пересадка крупномеров, дренаж, укрытие и подготовка газона к зиме.',
    winter: 'Зима — концепция, дендроплан и смета. К весне участок уже в графике работ.'
};

const LS_SEASON_NOW = {
    0: { id: 'winter', t: 'Сейчас январь — сезон концепции и сметы.' },
    1: { id: 'winter', t: 'Сейчас февраль — дендроплан и график посадок.' },
    2: { id: 'spring', t: 'Сейчас март — готовим грунт и автополив.' },
    3: { id: 'spring', t: 'Сейчас апрель — посадка и рулонный газон.' },
    4: { id: 'spring', t: 'Сейчас май — цветники и живые изгороди.' },
    5: { id: 'summer', t: 'Сейчас июнь — стрижка и полив в сезоне.' },
    6: { id: 'summer', t: 'Сейчас июль — уход, свет и малые формы.' },
    7: { id: 'summer', t: 'Сейчас август — сад в пике, удобно править зоны.' },
    8: { id: 'autumn', t: 'Сейчас сентябрь — крупномеры и дренаж.' },
    9: { id: 'autumn', t: 'Сейчас октябрь — пересадка и подготовка к зиме.' },
    10: { id: 'autumn', t: 'Сейчас ноябрь — укрытие и завершение грунта.' },
    11: { id: 'winter', t: 'Сейчас декабрь — проект сада к весне.' }
};

const LS_STAGES = [
    { n: '01', t: 'Концепция', d: 'Эскиз, зонирование и пожелания по саду' },
    { n: '02', t: 'Дендроплан', d: 'Посадки, полив, освещение и смета' },
    { n: '03', t: 'Реализация', d: 'Газон, МАФ, посадка и инженерка' },
    { n: '04', t: 'Уход', d: 'Сезонное сопровождение участка' }
];

const LS_ZONES = [
    { id: 'lawn', t: 'Газон', d: 'Партер и стрижка' },
    { id: 'entry', t: 'Вход', d: 'Аллея и фасад' },
    { id: 'patio', t: 'Патио', d: 'Терраса и свет' },
    { id: 'plant', t: 'Посадки', d: 'Деревья и цветники' }
];

const LS_SEASON_PHOTOS = {
    spring: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900', 'https://images.unsplash.com/photo-1466692476866-aef1dfb1e735?w=900'],
    summer: ['https://images.unsplash.com/photo-1558904541-efa843a96f01?w=900', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=900'],
    autumn: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900', 'https://images.unsplash.com/photo-1507371341162-163c0ced3133?w=900'],
    winter: ['https://images.unsplash.com/photo-1482517967863-00e15c9b5745?w=900', 'https://images.unsplash.com/photo-1457269449834-928af64c6909?w=900']
};

function lsMoney(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
}

function lsOfferSeason(title) {
    const t = String(title || '').toLowerCase();
    if (/проект|дизайн|дендро/.test(t)) return 'winter';
    if (/посад|газон|полив/.test(t)) return 'spring';
    if (/стриж|уход|свет|освещ|изгород/.test(t)) return 'summer';
    if (/крупномер|альпин|дренаж|благоустр|террас|маф/.test(t)) return 'autumn';
    return 'all';
}

function lsArchitectFor(s) {
    const names = ['Илья Садовников', 'Марина Роща', 'Павел Клён', 'Елена Луга'];
    const photos = [
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400'
    ];
    const h = (typeof shopHash === 'function') ? shopHash(s && s.name) : 0;
    const i = h % names.length;
    const d = (typeof shopDomain === 'function') ? shopDomain(s) : 'studio.ru';
    const n = 120 + (h % 780);
    const x = String(10000000 + n).slice(-7);
    return {
        name: names[i],
        photo: photos[i],
        phone: '+7 (904) ' + x.slice(0, 3) + '-' + x.slice(3, 5) + '-' + x.slice(5),
        email: 'architect@' + d
    };
}

function setLsPlot(n) {
    window.lsPlot = Number(n) || 10;
    renderLandscapingList();
    if (window.lsStudioName) fillLandscapeStudio();
}

function lsPhotoSet(s) {
    const extra = [
        'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800',
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
        'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
        'https://images.unsplash.com/photo-1466692476866-aef1dfb1e735?w=800',
        'https://images.unsplash.com/photo-1470058869958-2a77ade41aa9?w=800',
        'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800',
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800'
    ];
    const seen = {};
    const out = [];
    const add = function (src) {
        if (!src || seen[src]) return;
        seen[src] = 1;
        out.push(src);
    };
    add(s && s.banner);
    (s && s.gallery || []).forEach(add);
    ((s && s.offers) || []).forEach(function (o) { add(o.image); });
    extra.forEach(add);
    return out;
}

function renderLandscapingList() {
    const el = document.getElementById('landscaping-list');
    const plot = window.lsPlot || 10;
    const month = (new Date()).getMonth();
    const now = LS_SEASON_NOW[month] || LS_SEASON_NOW[8];
    if (!window.lsSeason) window.lsSeason = now.id || 'all';
    if (!el) return;
    const studios = [];
    for (const name in shopsProfileDb) {
        const s = shopsProfileDb[name];
        if (!s || s.status !== 'published' || s.kind !== 'landscape') continue;
        studios.push({ name: name, s: s });
    }
    if (!studios.length) {
        el.innerHTML = '<div class="py-10 text-center text-sm text-sky-200/70">Нет студий</div>';
        return;
    }
    el.innerHTML = studios.map(function (row) {
        const s = row.s;
        const meta = LS_ATELIER[row.name] || { focus: 'Сад', rate: 15000 };
        const est = lsMoney(meta.rate * plot);
        return '<div onclick="openLandscapeStudio(\'' + escJsArg(row.name) + '\')" class="ls-list-card">' +
            '<img src="' + (escHtml(s.banner || '')) + '" alt="">' +
            '<div class="veil"></div>' +
            '<span class="tag">от ' + est + '</span>' +
            '<div class="copy">' +
                '<div><h4>' + escHtml(row.name) + '</h4><p>' + (meta.focus || s.description || '') + '</p></div>' +
                '<button type="button" class="go" onclick="event.stopPropagation();openLandscapeStudio(\'' + escJsArg(row.name) + '\')">Паспорт участка</button>' +
            '</div></div>';
    }).join('');
}

function lsPing(msg) {
    if (typeof showSmsToast === 'function') showSmsToast(msg);
    const t = document.getElementById('sms-toast');
    if (t) t.style.zIndex = '95';
}

function requestLandscapeOffer(storeName, i) {
    const shop = shopsProfileDb[storeName];
    const o = shop && shop.offers && shop.offers[i];
    if (!o) return;
    lsPing('В график: «' + o.title + '» · ' + storeName);
}

function openLandscapeStudio(name) {
    const s = shopsProfileDb[name];
    if (!s || s.kind !== 'landscape') return;
    window.lsStudioName = name;
    if (!window.lsSeason) {
        const now = LS_SEASON_NOW[(new Date()).getMonth()] || LS_SEASON_NOW[8];
        window.lsSeason = now.id;
    }
    fillLandscapeStudio();
    const modal = document.getElementById('ls-studio-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeLandscapeStudio() {
    const modal = document.getElementById('ls-studio-modal');
    if (modal) modal.classList.add('hidden');
}

function setLsSeason(id) {
    window.lsSeason = id || 'all';
    fillLandscapeStudio();
}

function lsRequestVisit() {
    const name = window.lsStudioName || 'ателье';
    const plot = window.lsPlot || 10;
    lsPing('Выезд на участок: «' + name + '», ' + plot + ' соток. Свяжемся в рабочий день.');
}

function lsRequestZone(t) {
    lsPing('Зона «' + t + '» добавлена в бриф участка.');
}

function lsCallArchitect() {
    const s = shopsProfileDb[window.lsStudioName];
    if (!s) return;
    const a = lsArchitectFor(s);
    lsPing('Соединяем с архитектором: ' + a.name);
    try { window.location.href = 'tel:' + String(a.phone || '').replace(/[^\d+]/g, ''); } catch (e) {}
}

function lsOpenTelegram(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const s = shopsProfileDb[window.lsStudioName];
    const url = (s && s.telegram) || '';
    lsPing('Telegram: ' + ((s && s.name) || 'студия'));
    if (url && url !== '#') {
        try { window.open(url, '_blank'); } catch (err) {}
    }
    return false;
}

function lsOpenMap() {
    const s = shopsProfileDb[window.lsStudioName];
    const loc = (s && s.address) || 'Волгодонск';
    lsPing('Карта: ' + loc);
    try { window.open('https://yandex.ru/maps/?text=' + encodeURIComponent(loc), '_blank'); } catch (e) {}
}

function fillLandscapeStudio() {
    const root = document.getElementById('ls-studio-root');
    const name = window.lsStudioName;
    const s = shopsProfileDb[name];
    if (!root || !s) return;
    const season = window.lsSeason || 'all';
    const seasonPhotos = LS_SEASON_PHOTOS[season] || [];
    const hero = seasonPhotos[0] || s.banner || '';
    const staff = lsArchitectFor(s);
    const tg = s.telegram || '#';
    const site = (s.site || '').replace(/^https?:\/\//, '');
    const seasons = LS_SEASONS.map(function (c) {
        return '<button type="button" class="ls-season' + (season === c.id ? ' on' : '') + '" onclick="setLsSeason(\'' + c.id + '\')">' + c.t + '</button>';
    }).join('');
    const zones = LS_ZONES.map(function (z) {
        return '<button type="button" class="ls-zone" onclick="lsRequestZone(\'' + z.t + '\')"><b>Зона</b><strong>' + z.t + '</strong><span>' + z.d + '</span></button>';
    }).join('');
    const offers = (s.offers || []).slice();
    offers.sort(function (a, b) {
        const am = lsOfferSeason(a.title) === season ? 0 : 1;
        const bm = lsOfferSeason(b.title) === season ? 0 : 1;
        return am - bm;
    });
    const works = offers.map(function (o) {
        const idx = (s.offers || []).indexOf(o);
        const match = season === 'all' || lsOfferSeason(o.title) === season || lsOfferSeason(o.title) === 'all';
        return '<div class="ls-work' + (match ? '' : ' off') + '" onclick="requestLandscapeOffer(\'' + escJsArg(name) + '\', ' + idx + ')">' +
            '<i>' + String(idx + 1).padStart(2, '0') + '</i>' +
            '<div><h4>' + escHtml(o.title) + '</h4><em>' + (match ? 'в этом сезоне' : 'можно заложить в график') + '</em></div>' +
            '<b>' + escHtml(o.price) + '</b></div>';
    }).join('');
    const mosaic = lsPhotoSet(s).slice(0, 3);
    while (mosaic.length < 3) mosaic.push(hero);
    const mosaicHtml = mosaic.map(function (src) {
        return '<img src="' + src + '" alt="" onclick="openAvatarModal(\'' + src + '\')">';
    }).join('');
    root.innerHTML =
        '<div class="ls-pass-top">' +
            '<div><p class="ls-kicker">Паспорт участка</p><h2>' + escHtml(s.name) + '</h2></div>' +
            '<button type="button" class="ls-close" onclick="closeLandscapeStudio()"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>' +
        '</div>' +
        '<div class="ls-pass-hero">' +
            '<img src="' + hero + '" alt="" onclick="openAvatarModal(\'' + hero + '\')">' +
            '<div class="veil"></div>' +
            '<div class="ls-seasons">' + seasons + '</div>' +
        '</div>' +
        '<div class="ls-scroll">' +
            '<p class="ls-sec">Сад на фото</p>' +
            '<div class="ls-mosaic">' + mosaicHtml + '</div>' +
            '<p class="ls-sec">План зон</p>' +
            '<div class="ls-zones">' + zones + '</div>' +
            '<p class="ls-note">' + (LS_SEASON_NOTE[season] || LS_SEASON_NOTE.all) + '</p>' +
            '<p class="ls-sec">В график студии</p>' + works +
            '<button type="button" class="ls-arch" onclick="lsCallArchitect()"><img src="' + staff.photo + '" alt=""><div><p>Ландшафтный архитектор</p><strong>' + escHtml(staff.name) + '</strong><span>' + staff.phone + '</span></div></button>' +
            '<button type="button" class="ls-addr" onclick="lsOpenMap()">' + (escHtml(s.address || '')) + (site ? ' · ' + site : '') + '</button>' +
        '</div>' +
        '<div class="ls-bar">' +
            '<button type="button" class="ls-bar-main" onclick="lsRequestVisit()">Выезд на участок</button>' +
            '<a class="ls-bar-ghost" href="' + tg + '" target="_blank" rel="noopener" onclick="return lsOpenTelegram(event)">Telegram</a>' +
        '</div>';
}
