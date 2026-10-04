/* Лайфхаки.
   Лента, статьи, чек-листы, опросы, сметы, сохранённое, редактор.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


const DEFAULT_LIFEHACK_CATEGORIES = SEED.lifehackCategories();

/* lifehackSavedIds: данные в CatalogStore (src/shared/data/catalog-store.ts); здесь — аксессор на window */

let lifehackEditorGallery = [];

let currentLifehackId = null;

let lifehackBackTo = 'directory';

let lifehackFeedOrigin = 'directory';

let lifehackActiveCat = 'all';

let lifehackActiveFormat = 'all';

/* lhCheckState: src/app/data/engagement.ts (EngagementStore), здесь — аксессор на window */

/* lhPollVotes: src/app/data/engagement.ts (EngagementStore), здесь — аксессор на window */

/* lhPollCounts: src/app/data/engagement.ts (EngagementStore), здесь — аксессор на window */

/* lhUsefulMine: src/app/data/engagement.ts (EngagementStore), здесь — аксессор на window */

/* lhUsefulCounts: src/app/data/engagement.ts (EngagementStore), здесь — аксессор на window */

let lhBaOn = false;


/* lifehacksDb: данные в CatalogStore (src/shared/data/catalog-store.ts); здесь — аксессор на window */


const LIFEHACK_ENGAGE = {
    'lh-1': {
        format: 'estimate',
        productIds: ['prod-5', 'prod-16', 'prod-17'],
        assistantQuery: 'краска ламинат плитка для косметического ремонта',
        checklist: [
            { id: 'c1', text: 'Выбрать комнаты и бюджет на выходные' },
            { id: 'c2', text: 'Купить краску с запасом на 2 слоя', productId: 'prod-5' },
            { id: 'c3', text: 'Обновить пол (ламинат или плитка)', productId: 'prod-16' },
            { id: 'c4', text: 'Заменить свет и текстиль' }
        ],
        estimate: { title: 'Набор на косметику комнаты', calc: 'Онлайн Калькулятор Ламинат', lines: [
            { productId: 'prod-5', qty: 1, note: 'стены' },
            { productId: 'prod-16', qty: 12, note: 'м² пола' },
            { productId: 'prod-17', qty: 4, note: 'фартук / мокрые зоны' }
        ]},
        steps: [
            { t: 'План', d: 'Комнаты, бюджет и сколько дней реально выделить.' },
            { t: 'Стены и пол', d: 'Шпаклёвка, краска в два слоя, пол поверх ровного основания.' },
            { t: 'Свет', d: 'Нейтральный белый и один дополнительный источник.' }
        ]
    },
    'lh-2': {
        format: 'article', productIds: ['prod-13', 'prod-15'], assistantQuery: 'стеллаж полка крепёж для гипсокартона',
        steps: [
            { t: 'Доска', d: 'Сухая строганая 20–25 мм, масло или краска.' },
            { t: 'Крепёж', d: 'Скрытые полкодержатели и дюбели под тип стены.' },
            { t: 'Навесить', d: 'По уровню. Сразу не грузить — дать креплениям сесть.' }
        ]
    },
    'lh-3': {
        format: 'article', productIds: ['prod-10', 'prod-13', 'prod-8'], assistantQuery: 'шкаф стеллаж кухня чтобы квартира была удобнее',
        steps: [
            { t: 'Прихожая', d: 'Закрытый шкаф или крючки разной высоты и полка для ключей.' },
            { t: 'Свет слоями', d: 'Общий, рабочий над столом и мягкий вечерний.' },
            { t: 'Зона', d: 'Узкий стеллаж вместо глухой стены — хранит и делит комнату.' }
        ]
    },
    'lh-4': {
        format: 'checklist',
        productIds: ['prod-4', 'prod-6', 'prod-18'],
        assistantQuery: 'цемент газобетон кирпич для строительства дома',
        checklist: [
            { id: 'c1', text: 'Геология и проект до котлована' },
            { id: 'c2', text: 'Не экономить на фундаменте и дренаже', productId: 'prod-4' },
            { id: 'c3', text: 'Стены по проекту, не «на глаз»', productId: 'prod-6' },
            { id: 'c4', text: 'Закрыть кровлю сразу после стропил' },
            { id: 'c5', text: 'Фото скрытых работ на каждом этапе' }
        ],
        steps: [
            { t: 'До котлована', d: 'Геология и проект. Не наоборот.' },
            { t: 'Фундамент', d: 'Дренаж и гидроизоляция — не место для экономии.' },
            { t: 'Коробка', d: 'Стены по проекту, кровлю закрыть сразу после стропил.' }
        ]
    },
    'lh-5': {
        format: 'poll', featured: true,
        productIds: ['prod-5', 'prod-14', 'prod-16', 'prod-4'],
        assistantQuery: 'как выбрать краску цемент ламинат и не переплатить',
        poll: { id: 'primer-gkl', question: 'Грунтуете гипсокартон перед покраской?', options: [
            { id: 'yes', label: 'Да, всегда' },
            { id: 'no', label: 'Нет, сразу краска' },
            { id: 'idk', label: 'Ещё не знаю' }
        ]}
    },
    'lh-6': { format: 'article', productIds: ['prod-15', 'prod-14'], assistantQuery: 'профиль гипсокартон инструменты для ремонта' },
    'lh-7': { format: 'article', productIds: ['prod-5', 'prod-4', 'prod-16'], assistantQuery: 'сэкономить на ремонте какие материалы купить' },
    'lh-8': {
        format: 'error',
        productIds: ['prod-4', 'prod-14', 'prod-15'],
        assistantQuery: 'ошибки при строительстве штукатурка расходные материалы',
        checklist: [
            { id: 'c1', text: 'Гидроизоляция мокрых зон до чистовой отделки', productId: 'prod-4' },
            { id: 'c2', text: 'План розеток до закрытия стен', productId: 'prod-15' },
            { id: 'c3', text: 'Окна с четвертью и пароизоляцией' },
            { id: 'c4', text: 'Вентиляция не «через форточку»' },
            { id: 'c5', text: 'Фото скрытых работ до приёмки' }
        ],
        steps: [
            { t: 'Мокрые зоны', d: 'Уклон и гидроизоляция до чистовой отделки.' },
            { t: 'Электрика', d: 'План розеток до закрытия стен.' },
            { t: 'Воздух', d: 'Вентиляция не «через форточку» в герметичном доме.' }
        ]
    },
    'lh-9': {
        format: 'estimate', featured: false,
        productIds: ['prod-5', 'prod-16', 'prod-2', 'prod-11'],
        assistantQuery: 'кровать 160х200 комод краска ламинат для спальни',
        estimate: { title: 'Спальня 12 м²', calc: 'Онлайн Калькулятор Ламинат', lines: [
            { productId: 'prod-5', qty: 2, note: '2 слоя стен' },
            { productId: 'prod-16', qty: 14, note: 'пол + запас' },
            { productId: 'prod-2', qty: 1, note: 'кровать' },
            { productId: 'prod-11', qty: 1, note: 'хранение' }
        ]},
        steps: [
            { t: 'Замер', d: '12 м² пола и около 30 м² стен без окна.' },
            { t: 'Стены и пол', d: 'Краска на два слоя, ламинат 33 класс с запасом.' },
            { t: 'Мебель', d: 'Кровать и комод из каталога, без сборки с пяти сайтов.' }
        ]
    }
};


const LH_DAILY_TIPS = [
    { title: 'Не экономьте на скрытом', text: 'Гидроизоляция, электрика и основание. Декор меняется, трубы — нет.', id: 'lh-7' },
    { title: 'Фото до приёмки этапа', text: 'Если подрядчик торопит закрыть без снимков — остановите работу.', id: 'lh-8' },
    { title: 'Два слоя краски, не один', text: 'Укрывистость экономит нервы. Берите с запасом на второй проход.', id: 'lh-1' },
    { title: 'Запас плитки — 10%', text: 'На подрез и бой. Диагональ — 12–15%, иначе докупать другую партию.', id: 'lh-5' },
    { title: 'Свет важнее новой мебели', text: 'Нейтральный белый и один дополнительный источник меняют комнату сильнее дивана.', id: 'lh-3' },
    { title: 'Кровлю закрывайте сразу', text: 'Рубероид «на пару месяцев» мочит утеплитель. Это дороже новой крыши.', id: 'lh-4' },
    { title: 'Уровень не экономить', text: 'Дешёвый уровень врёт — и вся отделка уходит винтом.', id: 'lh-6' }
];

const LH_FACTS = [
    { k: '10%', v: 'запас плитки', id: 'lh-5' },
    { k: '2 слоя', v: 'краски', id: 'lh-1' },
    { k: '8–12%', v: 'на подрез', id: 'lh-9' }
];

/* LH_USEFUL_SEED → SEED.demoCommunity() (демо-цифры) */


/* persistLhEngage: src/app/data/engagement.ts */

/* loadLhEngageState: src/app/data/engagement.ts */

function hydrateLifehacksEngage() {
    if (!Array.isArray(lifehacksDb)) lifehacksDb = [];
    Object.keys(LIFEHACK_ENGAGE).forEach(function (id) {
        var extra = LIFEHACK_ENGAGE[id];
        var item = lifehacksDb.find(function (x) { return x.id === id; });
        if (!item) {
            if (id === 'lh-9') lifehacksDb.push(Object.assign({ id: 'lh-9', order: 0, status: 'published', category: 'Ремонт', date: '2026-08-28', readMins: 4, title: 'Смета: косметика спальни 12 м² за выходные', excerpt: 'Готовый набор из каталога: краска, ламинат и мебель.', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', images: [], body: 'Готовая смета из каталога приложения.' }, extra));
            return;
        }
        Object.keys(extra).forEach(function (k) {
            if (item[k] == null) item[k] = extra[k];
            else if (Array.isArray(item[k]) && item[k].length === 0 && extra[k]) item[k] = extra[k];
        });
    });
}


function lhEsc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function publishedLifehacks() {
    return (lifehacksDb || []).filter(function (x) { return x && x.status === 'published'; }).slice().sort(function (a, b) {
        const oa = a.order != null ? a.order : 999;
        const ob = b.order != null ? b.order : 999;
        if (oa !== ob) return oa - ob;
        return String(b.date || '').localeCompare(String(a.date || ''));
    });
}

function formatLifehackDate(d) {
    if (!d) return '';
    const dt = new Date(d + (String(d).indexOf('T') >= 0 ? '' : 'T12:00:00'));
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isLifehackSaved(id) {
    return lifehackSavedIds.indexOf(id) >= 0;
}

function persistLifehackSaved() {
    try { localStorage.setItem('meb_lifehack_saved', JSON.stringify(lifehackSavedIds)); } catch (e) {}
}

function lifehackBookmarkSvg(saved) {
    if (saved) return '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3a2 2 0 00-2 2v16l9-4 9 4V5a2 2 0 00-2-2H5z"/></svg>';
    return '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z"/></svg>';
}

function lhFormatMeta(item) {
    const f = (item && item.format) || 'article';
    const map = {
        error: { label: 'Ошибка', cls: 'lh-fmt-error' },
        estimate: { label: 'Смета', cls: 'lh-fmt-estimate' },
        checklist: { label: 'Чеклист', cls: 'lh-fmt-checklist' },
        poll: { label: 'Опрос', cls: 'lh-fmt-poll' },
        article: { label: 'Совет', cls: 'lh-fmt-article' }
    };
    return map[f] || map.article;
}

function lhGetProduct(id) {
    const db = (typeof productsDb !== 'undefined' ? productsDb : window.productsDb) || {};
    return db[id] || null;
}

function lifehackMatchesFormat(item, fmt) {
    if (!fmt || fmt === 'all') return true;
    if (fmt === 'saved') return isLifehackSaved(item.id);
    if (fmt === 'checklist') return item.format === 'checklist' || (item.checklist && item.checklist.length);
    if (fmt === 'estimate') return item.format === 'estimate' || !!(item.estimate && item.estimate.lines);
    if (fmt === 'poll') return item.format === 'poll' || !!(item.poll && item.poll.options);
    if (fmt === 'error') return item.format === 'error';
    return item.format === fmt;
}

function lhChipIcon(id) {
    const p = 'fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-4 h-4"';
    if (id === 'error') return '<svg ' + p + '><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m0 3.75h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>';
    if (id === 'estimate') return '<svg ' + p + '><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m-7 4h8m-8 4h5M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>';
    if (id === 'checklist') return '<svg ' + p + '><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    if (id === 'poll') return '<svg ' + p + '><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19V9m5 10V5m5 14v-8m5 8V3"/></svg>';
    if (id === 'saved') return '<svg ' + p + '><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z"/></svg>';
    return '<svg ' + p + '><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h10"/></svg>';
}

function lhActionLabel(item) {
    if (item && item.steps && item.steps.length) return item.steps.length + ' шага';
    const f = (item && item.format) || 'article';
    if (f === 'poll') return 'Голосовать';
    if (f === 'checklist') return 'Пройти чеклист';
    if (f === 'estimate') return 'Собрать смету';
    if (f === 'error') return 'Смотреть ошибки';
    return 'Читать';
}

function hideAppShellForLifehacks() {
    ['catalog', 'directory', 'cart', 'favorites', 'profile'].forEach(function (t) {
        const v = document.getElementById('view-' + t);
        if (v) v.classList.add('hidden');
    });
    const catProdView = document.getElementById('view-category-products');
    if (catProdView) catProdView.classList.add('hidden');
    ['home', 'directory', 'cart', 'favorites', 'profile'].forEach(function (t) {
        const btn = document.getElementById('tab-' + t);
        if (!btn) return;
        btn.className = (t === 'cart')
            ? 'relative flex flex-col items-center justify-center flex-1 py-1 text-slate-400'
            : 'flex flex-col items-center justify-center flex-1 py-1 text-slate-400';
    });
    const dirBtn = document.getElementById('tab-directory');
    if (dirBtn) dirBtn.className = 'flex flex-col items-center justify-center flex-1 py-1 text-blue-600';
}

function lifehackCardHtml(item, variant) {
    const saved = isLifehackSaved(item.id);
    const mins = item.readMins ? item.readMins + ' мин' : '';
    const meta = lhFormatMeta(item);
    const action = lhActionLabel(item);
    if (variant === 'home') {
        return `<button type="button" onclick="openLifehackArticle('${item.id}')" class="lh-home-card">
            <img src="${lhEsc(item.image || '')}" alt="">
            <div class="scrim"></div>
            <div class="meta">
                <span class="lh-fmt ${meta.cls}">${escHtml(meta.label)}</span>
                <p class="text-[13px] font-extrabold leading-snug mt-1.5 line-clamp-3">${lhEsc(item.title)}</p>
                <p class="text-[11px] font-bold mt-1.5 text-white/90">${action} →</p>
            </div>
        </button>`;
    }
    if (variant === 'hero') {
        return `<button type="button" onclick="openLifehackArticle('${item.id}')" class="lh-hero">
            <img src="${lhEsc(item.image || '')}" alt="">
            <div class="lh-hero-scrim"></div>
            <div class="lh-hero-body">
                <span class="lh-fmt ${meta.cls}">${item.format === 'poll' ? 'Сейчас голосуют' : meta.label}</span>
                <h4 class="font-extrabold text-[18px] leading-snug mt-1.5">${lhEsc(item.title)}</h4>
                <span class="lh-hero-cta">${action} →</span>
            </div>
        </button>`;
    }
    if (variant === 'related') {
        return `<button type="button" onclick="openLifehackArticle('${item.id}')" class="shrink-0 w-[148px] bg-[#eef3f8] rounded-2xl overflow-hidden text-left">
            <img src="${lhEsc(item.image || '')}" class="w-full h-[86px] object-cover bg-slate-100" alt="">
            <div class="p-2.5">
                <span class="lh-fmt ${meta.cls}">${escHtml(meta.label)}</span>
                <p class="text-[12px] font-extrabold text-slate-900 leading-snug mt-1.5 line-clamp-3">${lhEsc(item.title)}</p>
            </div>
        </button>`;
    }
    return `<article onclick="openLifehackArticle('${item.id}')" class="lh-row cursor-pointer active:scale-[0.99] transition-transform">
        <img src="${lhEsc(item.image || '')}" alt="" class="lh-row-img">
        <div class="min-w-0 flex-1 py-0.5">
            <div class="flex items-center gap-1.5">
                <span class="lh-fmt ${meta.cls}">${escHtml(meta.label)}</span>
                <span class="text-[10px] font-bold text-slate-400">${lhEsc(item.category || '')}</span>
            </div>
            <h4 class="font-extrabold text-[13px] text-slate-900 leading-snug mt-1 line-clamp-2">${lhEsc(item.title)}</h4>
            <p class="text-[11px] font-bold text-[#1e6091] mt-1">${action}${mins ? ' · ' + mins : ''}${item.productIds && item.productIds.length ? ' · товары' : ''}</p>
        </div>
        <button type="button" onclick="event.stopPropagation(); toggleLifehackSave('${item.id}')" class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 self-start ${saved ? 'text-[#1e6091]' : 'text-slate-400'}">${lifehackBookmarkSvg(saved)}</button>
    </article>`;
}

function renderLifehacksHome() {
    const box = document.getElementById('lifehacks-home-preview');
    const wrap = document.getElementById('lifehacks-home-wrap');
    if (!box) return;
    const list = publishedLifehacks().slice(0, 6);
    if (wrap) wrap.classList.toggle('hidden', !list.length);
    box.innerHTML = list.map(function (item) { return lifehackCardHtml(item, 'home'); }).join('');
}

function renderLifehacksChips() {
    const box = document.getElementById('lifehacks-cat-chips');
    if (!box) return;
    const cats = ['all'].concat(lifehackCategories);
    box.innerHTML = cats.map(function (c) {
        const active = lifehackActiveCat === c;
        const label = c === 'all' ? 'Все темы' : c;
        const cls = active ? 'bg-[#1e6091] text-white border border-[#1e6091]' : 'bg-white text-slate-600 border border-slate-200';
        return `<button type="button" onclick="filterLifehacksCat('${c.replace(/'/g, '\\\'')}')" class="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold ${cls}">${lhEsc(label)}</button>`;
    }).join('');
}

function renderLifehacksFormatChips() {
    const box = document.getElementById('lifehacks-fmt-chips');
    if (!box) return;
    const chips = [
        { id: 'all', label: 'Все' },
        { id: 'error', label: 'Ошибки' },
        { id: 'estimate', label: 'Сметы' },
        { id: 'checklist', label: 'Чеклисты' },
        { id: 'poll', label: 'Опросы' },
        { id: 'saved', label: 'Мои' }
    ];
    box.innerHTML = chips.map(function (c) {
        const active = lifehackActiveFormat === c.id;
        return `<button type="button" data-fmt="${c.id}" onclick="filterLifehacksFormat('${c.id}')" class="lh-fmt-tile${active ? ' on' : ''}"><span>${escHtml(c.label)}</span></button>`;
    }).join('');
}

function filterLifehacksFormat(fmt) {
    lifehackActiveFormat = fmt || 'all';
    renderLifehacksFeed();
}

function filterLifehacksCat(cat) {
    lifehackActiveCat = cat || 'all';
    renderLifehacksFeed();
}

function lifehacksHotItem() {
    if (lifehackActiveFormat !== 'all' || (lifehackActiveCat && lifehackActiveCat !== 'all')) return null;
    const list = publishedLifehacks();
    return list.find(function (x) { return x.featured; }) || list.find(function (x) { return x.format === 'poll'; }) || null;
}

function lhDailyTip() {
    const tips = LH_DAILY_TIPS || [];
    if (!tips.length) return null;
    const day = Math.floor(Date.now() / 86400000);
    return tips[day % tips.length];
}

function renderLifehacksDaily() {
    const box = document.getElementById('lifehacks-daily');
    if (!box) return;
    if (lifehackActiveFormat !== 'all' || (lifehackActiveCat && lifehackActiveCat !== 'all')) { box.innerHTML = ''; return; }
    const tip = lhDailyTip();
    if (!tip) { box.innerHTML = ''; return; }
    const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    box.innerHTML = `<button type="button" onclick="openLifehackArticle('${tip.id}')" class="lh-daily">
        <span class="lh-daily-k">Совет дня · ${lhEsc(today)}</span>
        <h4>${lhEsc(tip.title)}</h4>
        <p>${lhEsc(tip.text)}</p>
        <span class="lh-daily-cta">Открыть разбор</span>
    </button>`;
}

function renderLifehacksFacts() {
    const box = document.getElementById('lifehacks-facts');
    if (!box) return;
    if (lifehackActiveFormat !== 'all' || (lifehackActiveCat && lifehackActiveCat !== 'all')) { box.innerHTML = ''; return; }
    box.innerHTML = `<div class="lh-facts">${(LH_FACTS || []).map(function (f) {
        return `<button type="button" class="lh-fact" onclick="openLifehackArticle('${f.id}')"><b>${lhEsc(f.k)}</b><span>${lhEsc(f.v)}</span></button>`;
    }).join('')}</div>`;
}

function renderLifehacksHot() {
    const box = document.getElementById('lifehacks-hot');
    if (!box) return;
    const hot = lifehacksHotItem();
    if (!hot) { box.innerHTML = ''; return; }
    box.innerHTML = lifehackCardHtml(hot, 'hero');
}

function renderLifehacksSavedStrip() {
    const box = document.getElementById('lifehacks-saved');
    if (!box) return;
    if (lifehackActiveFormat === 'saved') { box.innerHTML = ''; return; }
    const saved = publishedLifehacks().filter(function (x) { return isLifehackSaved(x.id); }).slice(0, 6);
    if (!saved.length) { box.innerHTML = ''; return; }
    box.innerHTML = `<div>
        <div class="flex items-center justify-between mb-2">
            <p class="text-[12px] font-bold text-slate-800">Продолжить</p>
            <button type="button" onclick="filterLifehacksFormat('saved')" class="text-[11px] font-bold text-[#1e6091]">Все</button>
        </div>
        <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            ${saved.map(function (x) {
                return `<button type="button" onclick="openLifehackArticle('${x.id}')" class="lh-saved-story">
                    <span class="ring"><img src="${lhEsc(x.image || '')}" alt=""></span>
                    <span class="block text-[10px] font-bold text-slate-700 leading-snug mt-1.5 line-clamp-2">${lhEsc(lhFormatMeta(x).label)}</span>
                </button>`;
            }).join('')}
        </div>
    </div>`;
}

function renderLifehacksFeed() {
    renderLifehacksFormatChips();
    renderLifehacksChips();
    renderLifehacksDaily();
    renderLifehacksFacts();
    renderLifehacksHot();
    renderLifehacksSavedStrip();
    const box = document.getElementById('lifehacks-feed');
    if (!box) return;
    let list = publishedLifehacks();
    if (lifehackActiveCat && lifehackActiveCat !== 'all') {
        list = list.filter(function (x) { return x.category === lifehackActiveCat; });
    }
    list = list.filter(function (x) { return lifehackMatchesFormat(x, lifehackActiveFormat); });
    const hot = lifehacksHotItem();
    if (hot) list = list.filter(function (x) { return x.id !== hot.id; });
    box.innerHTML = list.length
        ? list.map(lifehackCardHtml).join('')
        : '<div class="text-center py-10 px-4 bg-white rounded-2xl"><p class="text-[14px] font-bold text-slate-700">В этом фильтре пока пусто</p><button type="button" onclick="filterLifehacksFormat(\'all\')" class="mt-3 text-[12px] font-bold text-[#1e6091]">Показать все лайфхаки</button></div>';
}

function openLifehacksCatalog(keepFilters) {
    const catalogView = document.getElementById('view-catalog');
    const dirView = document.getElementById('view-directory');
    if (catalogView && !catalogView.classList.contains('hidden')) {
        lifehackFeedOrigin = 'home';
        hideAppShellForLifehacks();
    } else if (dirView && !dirView.classList.contains('hidden')) {
        lifehackFeedOrigin = 'directory';
    }
    if (!keepFilters) {
        lifehackActiveFormat = 'all';
        lifehackActiveCat = 'all';
    }
    lifehackBackTo = 'feed';
    switchDirectoryView('lifehacks');
    renderLifehacksFeed();
}

function openLifehacksCatalogFiltered(fmt) {
    openLifehacksCatalog();
    filterLifehacksFormat(fmt || 'all');
}

function backFromLifehacksFeed() {
    if (lifehackFeedOrigin === 'home') switchTab('catalog');
    else backToDirectory();
}

function scrollLhSection(id) {
    const el = document.getElementById(id);
    if (!el || el.classList.contains('hidden')) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderLhArticleJumps(item) {
    const box = document.getElementById('lh-article-jumps');
    if (!box) return;
    const chips = [];
    if (item.checklist && item.checklist.length) chips.push({ id: 'lh-article-checklist', label: 'Чеклист' });
    if (item.estimate && item.estimate.lines) chips.push({ id: 'lh-article-estimate', label: 'Смета' });
    if (item.poll && item.poll.options) chips.push({ id: 'lh-article-poll', label: 'Опрос' });
    if (item.steps && item.steps.length) chips.push({ id: 'lh-article-steps', label: '3 шага' });
    if (item.images && item.images[0] && item.image) chips.push({ id: 'lh-article-ba', label: 'До / после' });
    if (item.productIds && item.productIds.length) chips.push({ id: 'lh-article-products', label: 'Товары' });
    if (item.assistantQuery) chips.push({ id: 'lh-article-assistant', label: 'Помощник' });
    if (!chips.length) { box.innerHTML = ''; box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    box.innerHTML = chips.map(function (c) {
        return '<button type="button" class="lh-jump" onclick="scrollLhSection(\'' + c.id + '\')">' + escHtml(c.label) + ' ↓</button>';
    }).join('');
}

function relatedLifehacks(item, n) {
    n = n || 4;
    const list = publishedLifehacks().filter(function (x) { return x.id !== item.id; });
    const same = list.filter(function (x) { return x.category === item.category || x.format === item.format; });
    const rest = list.filter(function (x) { return same.indexOf(x) < 0; });
    return same.concat(rest).slice(0, n);
}

function renderLhRelated(item) {
    const box = document.getElementById('lh-article-related');
    if (!box) return;
    const list = relatedLifehacks(item, 4);
    if (!list.length) { box.innerHTML = ''; return; }
    box.innerHTML = '<p class="text-[13px] font-extrabold text-slate-900 mb-2">Ещё по теме</p><div class="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">' +
        list.map(function (x) { return lifehackCardHtml(x, 'related'); }).join('') + '</div>';
}

function nextLifehackItem(item) {
    const list = publishedLifehacks();
    if (!list.length) return null;
    const i = list.findIndex(function (x) { return x.id === item.id; });
    return list[(i + 1) % list.length];
}

function renderLhNext(item) {
    const box = document.getElementById('lh-article-next');
    if (!box) return;
    const next = nextLifehackItem(item);
    if (!next || next.id === item.id) { box.innerHTML = ''; return; }
    const meta = lhFormatMeta(next);
    box.innerHTML = '<button type="button" class="lh-next active:scale-[0.99] transition-transform" onclick="openLifehackArticle(\'' + next.id + '\')">' +
        '<p class="text-[11px] font-bold text-white/70">Дальше · ' + lhEsc(meta.label) + '</p>' +
        '<p class="text-[14px] font-extrabold mt-1 leading-snug">' + lhEsc(next.title) + '</p></button>';
}

function openLifehackArticle(id) {
    const item = (lifehacksDb || []).find(function (x) { return x.id === id; });
    if (!item) return;
    currentLifehackId = id;
    const catalogView = document.getElementById('view-catalog');
    const feed = document.getElementById('subview-lifehacks');
    const pageAlready = document.getElementById('subview-lifehack-article');
    const onHome = catalogView && !catalogView.classList.contains('hidden');
    const onFeed = feed && !feed.classList.contains('hidden');
    const onArticle = pageAlready && !pageAlready.classList.contains('hidden');
    if (onFeed) lifehackBackTo = 'feed';
    else if (onHome) lifehackBackTo = 'home';
    else if (!onArticle) lifehackBackTo = 'directory';
    hideAppShellForLifehacks();
    const dirView = document.getElementById('view-directory');
    if (dirView) dirView.classList.add('hidden');
    const subviews = ['product_categories', 'shops', 'specialists', 'spec-private', 'spec-companies', 'spectech', 'landscaping', 'other', 'other-profiles', 'designers', 'companies', 'jobs', 'calculator', 'specific-calc', 'realestate', 're-agencies', 're-commercial', 're-catalog', 'building_materials', 'finishing_materials', 'furniture', 'plumbing', 'accessories', 'landscape', 'tools', 'lifehacks', 'lifehack-article'];
    subviews.forEach(function (sv) {
        const el = document.getElementById('subview-' + sv);
        if (el) el.classList.add('hidden');
    });
    const page = document.getElementById('subview-lifehack-article');
    if (page) page.classList.remove('hidden');
    document.getElementById('lh-article-image').src = item.image || '';
    document.getElementById('lh-article-cat').textContent = item.category || '';
    document.getElementById('lh-article-date').textContent = formatLifehackDate(item.date);
    document.getElementById('lh-article-read').textContent = item.readMins ? item.readMins + ' мин' : '';
    const readSep = document.getElementById('lh-article-read-sep');
    if (readSep) readSep.classList.toggle('hidden', !(item.date && item.readMins));
    document.getElementById('lh-article-title').textContent = item.title || '';
    document.getElementById('lh-article-excerpt').textContent = item.excerpt || '';
    const body = document.getElementById('lh-article-body');
    const paras = String(item.body || '').split(/\n\n+/).filter(Boolean);
    body.innerHTML = paras.map(function (p) { return '<p>' + lhEsc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
    const gal = document.getElementById('lh-article-gallery');
    const extra = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
    const hasBa = extra.length && item.image;
    gal.innerHTML = extra.slice(hasBa ? 1 : 0).map(function (src) {
        return '<img src="' + lhEsc(src) + '" class="w-full rounded-2xl object-cover bg-slate-100" alt="">';
    }).join('');
    const fmtEl = document.getElementById('lh-article-fmt');
    if (fmtEl) {
        const meta = lhFormatMeta(item);
        fmtEl.className = 'lh-fmt ' + meta.cls;
        fmtEl.textContent = meta.label;
        fmtEl.classList.remove('hidden');
    }
    renderLhArticleJumps(item);
    renderLhArticleBa(item);
    renderLhArticleSteps(item);
    renderLhArticleChecklist(item);
    renderLhArticleEstimate(item);
    renderLhArticlePoll(item);
    renderLhArticleProducts(item);
    renderLhArticleAssistant(item);
    renderLhArticleReact(item);
    renderLhRelated(item);
    renderLhNext(item);
    refreshLifehackArticleSave();
    const scroll = document.getElementById('main-scroll-container');
    if (scroll) scroll.scrollTop = 0;
}

function renderLhArticleSteps(item) {
    const box = document.getElementById('lh-article-steps');
    if (!box) return;
    const steps = item.steps || [];
    if (!steps.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    box.classList.remove('hidden');
    box.innerHTML = '<div class="rounded-2xl border border-slate-100 bg-[#f8fbfe] p-3.5 space-y-3">' +
        '<p class="text-[13px] font-extrabold text-slate-900">За 3 шага</p>' +
        steps.map(function (s, i) {
            return '<div class="lh-step"><span class="lh-step-n">' + (i + 1) + '</span><span class="min-w-0"><span class="block text-[13px] font-extrabold text-slate-900">' + lhEsc(s.t) + '</span><span class="block text-[12px] text-slate-500 mt-0.5 leading-snug">' + lhEsc(s.d) + '</span></span></div>';
        }).join('') + '</div>';
}

function renderLhArticleBa(item) {
    const box = document.getElementById('lh-article-ba');
    if (!box) return;
    const before = item.images && item.images[0];
    const after = item.image;
    if (!before || !after) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    lhBaOn = false;
    box.classList.remove('hidden');
    box.innerHTML = '<button type="button" class="lh-ba" onclick="toggleLhBa()">' +
        '<img id="lh-ba-img" src="' + lhEsc(before) + '" alt="">' +
        '<span id="lh-ba-tag" class="lh-ba-tag">До</span>' +
        '<span class="lh-ba-hint">Нажми · после</span></button>';
    window._lhBaBefore = before;
    window._lhBaAfter = after;
}

function toggleLhBa() {
    lhBaOn = !lhBaOn;
    const img = document.getElementById('lh-ba-img');
    const tag = document.getElementById('lh-ba-tag');
    const hint = document.querySelector('#lh-article-ba .lh-ba-hint');
    if (img) img.src = lhBaOn ? (window._lhBaAfter || '') : (window._lhBaBefore || '');
    if (tag) tag.textContent = lhBaOn ? 'После' : 'До';
    if (hint) hint.textContent = lhBaOn ? 'Нажми · до' : 'Нажми · после';
}

function renderLhArticleReact(item) {
    const box = document.getElementById('lh-article-react');
    if (!box) return;
    const mine = !!lhUsefulMine[item.id];
    const n = lhUsefulCounts[item.id] || 0;
    box.innerHTML = '<button type="button" class="lh-react' + (mine ? ' on' : '') + '" onclick="toggleLhUseful(\'' + item.id + '\')">' +
        '<span>' + (mine ? 'Сработало для вас' : 'Это сработало') + '</span>' +
        '<span>' + n + '</span></button>';
}

function toggleLhUseful(id) {
    if (lhUsefulMine[id]) {
        lhUsefulMine[id] = false;
        lhUsefulCounts[id] = Math.max(0, (lhUsefulCounts[id] || 0) - 1);
    } else {
        lhUsefulMine[id] = true;
        lhUsefulCounts[id] = (lhUsefulCounts[id] || 0) + 1;
    }
    persistLhEngage();
    const item = (lifehacksDb || []).find(function (x) { return x.id === id; });
    if (item) renderLhArticleReact(item);
}

function lhProductCardHtml(prod, extra) {
    if (!prod) return '';
    extra = extra || '';
    return `<button type="button" onclick="event.stopPropagation(); openProductFromLifehack('${prod.id}')" class="w-full flex gap-3 p-2 bg-white border border-slate-100 rounded-2xl text-left shadow-sm active:scale-[0.99] transition-transform">
        <img src="${lhEsc(prod.image || '')}" class="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0" alt="">
        <div class="min-w-0 flex-1">
            <p class="text-[13px] font-bold text-slate-900 line-clamp-2 leading-snug">${lhEsc(prod.title)}</p>
            <p class="text-[14px] font-extrabold text-[#1e6091] mt-0.5">${lhEsc(prod.price || '')}</p>
            <p class="text-[11px] text-slate-400">${lhEsc(prod.store || '')}${extra ? ' · ' + lhEsc(extra) : ''}</p>
        </div>
    </button>`;
}

function openProductFromLifehack(id) {
    const pm = document.getElementById('product-modal');
    if (pm) pm.style.zIndex = '150';
    if (typeof openProductModal === 'function') openProductModal(id);
}

function renderLhArticleProducts(item) {
    const box = document.getElementById('lh-article-products');
    if (!box) return;
    const cards = (item.productIds || []).map(lhGetProduct).filter(Boolean);
    if (!cards.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    box.classList.remove('hidden');
    box.innerHTML = '<p class="text-[13px] font-extrabold text-slate-900">Купить из каталога</p>' +
        cards.map(function (p) { return lhProductCardHtml(p, p.category); }).join('');
}

function renderLhArticleChecklist(item) {
    const box = document.getElementById('lh-article-checklist');
    if (!box) return;
    const list = item.checklist || [];
    if (!list.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    const st = lhCheckState[item.id] || {};
    const done = list.filter(function (c) { return st[c.id]; }).length;
    const pct = list.length ? Math.round(done * 100 / list.length) : 0;
    box.classList.remove('hidden');
    box.innerHTML = '<div class="rounded-2xl border border-slate-100 bg-[#f8fbfe] p-3 space-y-2">' +
        '<div class="flex items-center justify-between"><p class="text-[13px] font-extrabold text-slate-900">Чеклист</p><p class="text-[11px] font-bold text-[#1e6091]">' + done + ' / ' + list.length + '</p></div>' +
        '<div class="lh-progress"><div style="width:' + pct + '%"></div></div>' +
        list.map(function (c) {
            const on = !!st[c.id];
            const prod = c.productId ? lhGetProduct(c.productId) : null;
            const prodBit = prod
                ? ('<span class="block text-[11px] text-[#1e6091] font-bold mt-1" data-pid="' + prod.id + '">' + lhEsc(prod.title) + ' →</span>')
                : '';
            return '<button type="button" class="lh-check-row' + (on ? ' on' : '') + '" data-aid="' + item.id + '" data-cid="' + c.id + '">' +
                '<span class="lh-check-box">' + (on ? '✓' : '') + '</span><span class="min-w-0 flex-1"><span class="block text-[13px] font-semibold text-slate-800 leading-snug">' + lhEsc(c.text) + '</span>' + prodBit + '</span></button>';
        }).join('') + '</div>';
    box.querySelectorAll('.lh-check-row').forEach(function (btn) {
        btn.onclick = function (e) {
            const pid = e.target && e.target.getAttribute && e.target.getAttribute('data-pid');
            if (pid) { e.stopPropagation(); openProductFromLifehack(pid); return; }
            toggleLifehackCheck(btn.getAttribute('data-aid'), btn.getAttribute('data-cid'));
        };
    });
}

function toggleLifehackCheck(articleId, checkId) {
    if (!lhCheckState[articleId]) lhCheckState[articleId] = {};
    lhCheckState[articleId][checkId] = !lhCheckState[articleId][checkId];
    persistLhEngage();
    const item = (lifehacksDb || []).find(function (x) { return x.id === articleId; });
    if (item) renderLhArticleChecklist(item);
    if (!isLifehackSaved(articleId)) toggleLifehackSave(articleId);
}

function renderLhArticleEstimate(item) {
    const box = document.getElementById('lh-article-estimate');
    if (!box) return;
    const est = item.estimate;
    if (!est || !est.lines || !est.lines.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    let total = 0;
    const rows = est.lines.map(function (line) {
        const p = lhGetProduct(line.productId);
        if (!p) return '';
        const price = (typeof parsePrice === 'function' ? parsePrice(p.price) : parseInt(String(p.price || '').replace(/\D/g, ''), 10) || 0);
        const qty = line.qty || 1;
        total += price * qty;
        return lhProductCardHtml(p, (qty > 1 ? qty + ' шт' : '') + (line.note ? ' · ' + line.note : ''));
    }).join('');
    box.classList.remove('hidden');
    box.innerHTML = '<div class="rounded-2xl border border-orange-100 bg-orange-50/60 p-3 space-y-2">' +
        '<div class="flex items-start justify-between gap-2"><div><p class="text-[11px] font-extrabold text-orange-700 uppercase tracking-wide">Смета</p>' +
        '<p class="text-[14px] font-extrabold text-slate-900 mt-0.5">' + lhEsc(est.title || 'Набор из каталога') + '</p></div>' +
        '<p class="text-[14px] font-extrabold text-[#1e6091] whitespace-nowrap">' + total.toLocaleString('ru-RU') + ' ₽</p></div>' +
        rows +
        '<button type="button" onclick="addLifehackEstimateToCart(\'' + item.id + '\')" class="w-full bg-[#1e6091] text-white font-bold text-[13px] py-2.5 rounded-xl active:scale-[0.98]">Собрать в корзину</button>' +
        (est.calc ? '<button type="button" onclick="openLifehackCalc()" class="w-full bg-white border border-slate-200 text-slate-700 font-bold text-[12px] py-2.5 rounded-xl">Открыть калькулятор</button>' : '') +
        '</div>';
    window._lhCalcName = est.calc || '';
}

function addLifehackEstimateToCart(id) {
    const item = (lifehacksDb || []).find(function (x) { return x.id === id; });
    if (!item || !item.estimate) return;
    if (typeof loadCart === 'function') loadCart();
    const items = typeof getCartItems === 'function' ? getCartItems() : (state.cart || []);
    (item.estimate.lines || []).forEach(function (line) {
        const p = lhGetProduct(line.productId);
        if (!p) return;
        const n = line.qty || 1;
        const existing = items.find(function (i) { return i.productId === line.productId; });
        if (existing) existing.qty = (existing.qty || 1) + n;
        else items.push({ productId: p.id, storeId: p.store, qty: n, priceSnapshot: (typeof parsePrice === 'function' ? parsePrice(p.price) : 0), titleSnapshot: p.title, image: p.image });
    });
    state.cart = items;
    if (typeof saveCart === 'function') saveCart();
    if (typeof refreshCartSurfaces === 'function') refreshCartSurfaces();
    showSmsToast('Смета добавлена в корзину');
}

function openLifehackCalc() {
    const name = window._lhCalcName;
    if (!name || typeof openSpecificCalc !== 'function') return;
    hideAppShellForLifehacks();
    switchDirectoryView('calculator');
    openSpecificCalc(name);
}

function renderLhArticlePoll(item) {
    const box = document.getElementById('lh-article-poll');
    if (!box) return;
    const poll = item.poll;
    if (!poll || !poll.options) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    const counts = lhPollCounts[poll.id] || {};
    const total = poll.options.reduce(function (s, o) { return s + (counts[o.id] || 0); }, 0) || 1;
    const mine = lhPollVotes[poll.id];
    box.classList.remove('hidden');
    box.innerHTML = '<div class="rounded-2xl border border-violet-100 bg-[#f5f3ff] p-3">' +
        '<p class="text-[11px] font-extrabold text-violet-700 uppercase tracking-wide mb-1">Опрос</p><p class="text-[15px] font-extrabold text-slate-900 mb-2">' + lhEsc(poll.question) + '</p>' +
        poll.options.map(function (o) {
            const n = counts[o.id] || 0;
            const pct = Math.round(n * 100 / total);
            const picked = mine === o.id;
            return '<button type="button" class="lh-poll-opt' + (picked ? ' picked' : '') + ' mb-2" data-poll="' + poll.id + '" data-opt="' + o.id + '">' +
                '<div class="flex justify-between text-[13px] font-semibold text-slate-800"><span>' + lhEsc(o.label) + '</span><span class="text-[#1e6091]">' + pct + '%</span></div>' +
                '<div class="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-[#1e6091] rounded-full" style="width:' + pct + '%"></div></div></button>';
        }).join('') +
        (mine ? '<p class="text-[12px] text-slate-500">Ваш голос учтён. Ниже — материалы из каталога.</p>' : '<p class="text-[12px] text-slate-500">Один тап — увидите, как голосуют другие.</p>') +
        '</div>';
    box.querySelectorAll('.lh-poll-opt').forEach(function (btn) {
        btn.onclick = function () { voteLifehackPoll(btn.getAttribute('data-poll'), btn.getAttribute('data-opt')); };
    });
}

function voteLifehackPoll(pollId, optId) {
    const prev = lhPollVotes[pollId];
    if (prev === optId) return;
    if (!lhPollCounts[pollId]) lhPollCounts[pollId] = {};
    if (prev) lhPollCounts[pollId][prev] = Math.max(0, (lhPollCounts[pollId][prev] || 0) - 1);
    lhPollCounts[pollId][optId] = (lhPollCounts[pollId][optId] || 0) + 1;
    lhPollVotes[pollId] = optId;
    persistLhEngage();
    const item = (lifehacksDb || []).find(function (x) { return x.poll && x.poll.id === pollId; });
    if (item) renderLhArticlePoll(item);
}

function renderLhArticleAssistant(item) {
    const box = document.getElementById('lh-article-assistant');
    if (!box) return;
    if (!item.assistantQuery) { box.classList.add('hidden'); box.innerHTML = ''; return; }
    box.classList.remove('hidden');
    box.innerHTML = '<button type="button" id="lh-ask-ai" class="w-full flex items-center gap-3 bg-[#1e6091] text-white rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform">' +
        '<span class="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></span>' +
        '<span class="text-left min-w-0"><span class="block text-[13px] font-bold">Спросить умного помощника</span><span class="block text-[11px] text-white/80 mt-0.5">Подберёт товары по этой теме</span></span></button>';
    const b = document.getElementById('lh-ask-ai');
    if (b) b.onclick = function () { askAssistantFromLifehack(item.assistantQuery); };
}

function askAssistantFromLifehack(query) {
    if (typeof openAssistant === 'function') openAssistant();
    const inp = document.getElementById('assistant-input');
    if (inp) inp.value = query || '';
    if (typeof sendAssistantQuery === 'function') sendAssistantQuery();
}

function backFromLifehackArticle() {
    const page = document.getElementById('subview-lifehack-article');
    if (page) page.classList.add('hidden');
    if (lifehackBackTo === 'home') switchTab('catalog');
    else if (lifehackBackTo === 'directory') backToDirectory();
    else openLifehacksCatalog(true);
}

function refreshLifehackArticleSave() {
    const btn = document.getElementById('lh-article-save');
    if (!btn || !currentLifehackId) return;
    const saved = isLifehackSaved(currentLifehackId);
    btn.className = 'lh-article-icon ' + (saved ? 'text-[#1e6091]' : 'text-slate-400');
    btn.innerHTML = lifehackBookmarkSvg(saved);
}

function toggleLifehackSave(id) {
    const i = lifehackSavedIds.indexOf(id);
    if (i >= 0) lifehackSavedIds.splice(i, 1);
    else lifehackSavedIds.push(id);
    persistLifehackSaved();
    renderLifehacksHome();
    const feedEl = document.getElementById('subview-lifehacks');
    if (feedEl && !feedEl.classList.contains('hidden')) renderLifehacksFeed();
    if (currentLifehackId === id) refreshLifehackArticleSave();
}

function toggleLifehackSaveFromArticle() {
    if (currentLifehackId) toggleLifehackSave(currentLifehackId);
}

function shareLifehackFromArticle() {
    const item = (lifehacksDb || []).find(function (x) { return x.id === currentLifehackId; });
    if (!item) return;
    const url = location.href.split('#')[0] + '#lh-' + item.id;
    if (navigator.share) {
        navigator.share({ title: item.title, text: item.excerpt || item.title, url: url }).catch(function () {});
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { showSmsToast('Ссылка скопирована'); }).catch(function () { showSmsToast(url); });
    } else showSmsToast('Скопируйте ссылку: ' + url);
}

function fillLifehackCatSelect(selected) {
    const sel = document.getElementById('lh-editor-cat');
    if (!sel) return;
    sel.innerHTML = lifehackCategories.map(function (c) {
        return '<option value="' + lhEsc(c) + '"' + (c === selected ? ' selected' : '') + '>' + lhEsc(c) + '</option>';
    }).join('');
}

function renderLhEditorGallery() {
    const box = document.getElementById('lh-editor-gallery');
    if (!box) return;
    box.innerHTML = lifehackEditorGallery.map(function (src, i) {
        return '<div class="relative"><img src="' + lhEsc(src) + '" class="w-full h-16 object-cover rounded-lg bg-slate-100"><button type="button" onclick="removeLifehackGalleryImg(' + i + ')" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px]">×</button></div>';
    }).join('');
}

function removeLifehackGalleryImg(i) {
    lifehackEditorGallery.splice(i, 1);
    renderLhEditorGallery();
}

/* загрузка: MediaStore (сжатие на устройстве; с сервером — объектное хранилище), src/app/features/media.ts */
function handleLifehackCoverUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    mediaUpload(file, 'lifehack-cover').then(function (r) {
        if (!r.ok) return;
        document.getElementById('lh-editor-image').value = r.url;
        document.getElementById('lh-editor-preview').src = r.url;
    });
}

/* загрузка: MediaStore (сжатие на устройстве; с сервером — объектное хранилище), src/app/features/media.ts */
function handleLifehackGalleryUpload(event) {
    const files = Array.prototype.slice.call(event.target.files || []);
    event.target.value = ''; // сброс, чтобы можно было выбрать те же файлы снова (список уже скопирован)
    files.reduce(function (chain, file) {
        return chain.then(function () {
            return mediaUpload(file, 'lifehack-gallery').then(function (r) { if (r.ok) { lifehackEditorGallery.push(r.url); renderLhEditorGallery(); } });
        });
    }, Promise.resolve());
}

function addLifehackCategoryFromAdmin() {
    const inp = document.getElementById('lh-new-cat');
    const name = (inp && inp.value || '').trim();
    if (!name) return showSmsToast('Введите название категории');
    if (lifehackCategories.indexOf(name) < 0) lifehackCategories.push(name);
    if (inp) inp.value = '';
    fillLifehackCatSelect(name);
    saveAllData();
    renderLifehacksFeed();
    showSmsToast('Категория добавлена');
}

function renderCrmLifehackList() {
    const box = document.getElementById('crm-lifehack-list');
    if (!box) return;
    const list = (lifehacksDb || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    box.innerHTML = list.map(function (item, idx) {
        const st = item.status === 'published' ? 'Опубл.' : 'Скрыто';
        return `<div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
            <img src="${lhEsc(item.image || '')}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">
            <div class="flex-1 min-w-0">
                <h5 class="font-bold text-xs text-slate-800 truncate">${lhEsc(item.title)}</h5>
                <p class="text-[10px] text-slate-400 truncate">${lhEsc(item.category)} · ${st}</p>
            </div>
            <div class="flex flex-col gap-1 shrink-0">
                <div class="flex gap-1">
                    <button onclick="moveLifehack('${item.id}', -1)" class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg" ${idx === 0 ? 'disabled' : ''}>↑</button>
                    <button onclick="moveLifehack('${item.id}', 1)" class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg">↓</button>
                </div>
                <button onclick="openLifehackEditor('${item.id}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Изменить</button>
                <button onclick="deleteLifehack('${item.id}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
            </div>
        </div>`;
    }).join('') || '<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Публикаций нет</p>';
}

function openLifehackEditor(id) {
    const editor = document.getElementById('lifehack-editor');
    const item = id && (lifehacksDb || []).find(function (x) { return x.id === id; });
    document.getElementById('lh-editor-title').innerText = item ? 'Редактировать публикацию' : 'Новая публикация';
    document.getElementById('lh-editor-id').value = item ? item.id : '';
    document.getElementById('lh-editor-name').value = item ? (item.title || '') : '';
    document.getElementById('lh-editor-excerpt').value = item ? (item.excerpt || '') : '';
    document.getElementById('lh-editor-body').value = item ? (item.body || '') : '';
    document.getElementById('lh-editor-date').value = item && item.date ? item.date : new Date().toISOString().slice(0, 10);
    document.getElementById('lh-editor-read').value = item && item.readMins ? item.readMins : 5;
    document.getElementById('lh-editor-status').value = item ? (item.status || 'published') : 'published';
    document.getElementById('lh-editor-image').value = item ? (item.image || '') : '';
    document.getElementById('lh-editor-preview').src = item ? (item.image || '') : '';
    lifehackEditorGallery = item && Array.isArray(item.images) ? item.images.slice() : [];
    fillLifehackCatSelect(item ? item.category : lifehackCategories[0]);
    renderLhEditorGallery();
    editor.classList.remove('hidden');
    editor.classList.add('flex');
}

function closeLifehackEditor() {
    const editor = document.getElementById('lifehack-editor');
    editor.classList.add('hidden');
    editor.classList.remove('flex');
}

function saveLifehackFromEditor() {
    const title = document.getElementById('lh-editor-name').value.trim();
    if (!title) return showSmsToast('Укажите заголовок');
    const id = document.getElementById('lh-editor-id').value || ('lh-' + Date.now());
    const existing = lifehacksDb.find(function (x) { return x.id === id; });
    const payload = {
        id: id,
        order: existing && existing.order != null ? existing.order : (lifehacksDb.length + 1),
        status: document.getElementById('lh-editor-status').value || 'published',
        category: document.getElementById('lh-editor-cat').value || lifehackCategories[0],
        date: document.getElementById('lh-editor-date').value || new Date().toISOString().slice(0, 10),
        readMins: parseInt(document.getElementById('lh-editor-read').value, 10) || 5,
        title: title,
        excerpt: document.getElementById('lh-editor-excerpt').value.trim(),
        body: document.getElementById('lh-editor-body').value,
        image: document.getElementById('lh-editor-image').value,
        images: lifehackEditorGallery.slice(),
        format: existing && existing.format ? existing.format : 'article',
        productIds: existing && existing.productIds ? existing.productIds : [],
        checklist: existing && existing.checklist ? existing.checklist : undefined,
        estimate: existing && existing.estimate ? existing.estimate : undefined,
        poll: existing && existing.poll ? existing.poll : undefined,
        assistantQuery: existing && existing.assistantQuery ? existing.assistantQuery : '',
        featured: existing && existing.featured
    };
    if (existing) Object.assign(existing, payload);
    else lifehacksDb.push(payload);
    closeLifehackEditor();
    renderCrmLifehackList();
    renderLifehacksHome();
    renderLifehacksFeed();
    updateAdminStats();
    saveAllData();
    showSmsToast('Публикация сохранена');
}

function deleteLifehack(id) {
    lifehacksDb = lifehacksDb.filter(function (x) { return x.id !== id; });
    renderCrmLifehackList();
    renderLifehacksHome();
    renderLifehacksFeed();
    updateAdminStats();
    saveAllData();
    showSmsToast('Публикация удалена');
}

function moveLifehack(id, dir) {
    const list = lifehacksDb.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    const i = list.findIndex(function (x) { return x.id === id; });
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const tmp = list[i].order;
    list[i].order = list[j].order;
    list[j].order = tmp;
    if (list[i].order === list[j].order) {
        list.forEach(function (x, idx) { x.order = idx + 1; });
    }
    renderCrmLifehackList();
    renderLifehacksHome();
    saveAllData();
}
