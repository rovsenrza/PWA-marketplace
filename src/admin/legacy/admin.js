// ==========================================================
//  Супер-Апп · Управление
//  Роли: администратор, магазин, агентство недвижимости.
//  Товары, витрины, сторис и баннеры сохраняются в общий каталог (CatalogStore, src/admin/main.ts);
//  импорт из 1С / Excel — модуль src/admin/features/import; оформление, блоки и фильтры витрины —
//  модуль src/admin/features/storefront-designer.
//  Общие карточки, фильтры, разделы, недвижимость и доступы — демо-данные в памяти:
//  серверной части пока нет.
// ==========================================================

// ---------- Утилиты ----------
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const arg = v => esc(JSON.stringify(v));
const ico = (name, cls) => `<svg class="ico ${cls || ''}"><use href="#i-${name}"/></svg>`;
const $ = id => document.getElementById(id);
const fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const DAY = 24 * 60 * 60 * 1000;

function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}
function openOverlay(id) { const m = $(id); m.classList.remove('hidden'); m.classList.add('flex'); }
function closeOverlay(id) { const m = $(id); m.classList.add('hidden'); m.classList.remove('flex'); }
function toggleSide(open) {
    $('side').classList.toggle('open', open);
    $('scrim').classList.toggle('show', open);
}
function onDataUpdated() { renderAll(); }

// ---------- Демо-данные (до появления сервера) ----------
const CATEGORIES = ['стройматериалы', 'отделка', 'мебель', 'кухня', 'спальня', 'гостиная', 'сантехника', 'инструменты', 'освещение'];

const demo = {
    shared: [
        { name: 'Смесь Ceresit CM 11, 25 кг', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=200', stores: 6, from: '520 ₽', to: '610 ₽' },
        { name: 'Цемент М500, 50 кг', img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=200', stores: 4, from: '450 ₽', to: '520 ₽' },
        { name: 'Саморез по дереву 3,5×35, 1000 шт', img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=200', stores: 9, from: '390 ₽', to: '480 ₽' },
        { name: 'Грунтовка глубокого проникновения, 10 л', img: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=200', stores: 5, from: '780 ₽', to: '940 ₽' },
        { name: 'Гипсокартон Knauf 12,5 мм, 2500×1200', img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=200', stores: 3, from: '510 ₽', to: '565 ₽' },
        { name: 'Штукатурка Ротбанд, 30 кг', img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=200', stores: 7, from: '560 ₽', to: '690 ₽' }
    ],
    filters: {
        'стройматериалы': [
            { name: 'Тип', type: 'Список', home: true, vals: ['Цемент', 'Штукатурка', 'Шпаклёвка', 'Грунтовка', 'Клей'] },
            { name: 'Фасовка', type: 'Список', home: true, vals: ['5 кг', '25 кг', '30 кг', '50 кг'] },
            { name: 'Бренд', type: 'Список', home: false, vals: ['Ceresit', 'Knauf', 'Волма', 'Основит'] },
            { name: 'Цена', type: 'Диапазон', home: true, vals: [] }
        ],
        'мебель': [
            { name: 'Материал', type: 'Список', home: true, vals: ['Массив', 'ЛДСП', 'МДФ', 'Металл'] },
            { name: 'Цвет', type: 'Список', home: true, vals: ['Белый', 'Дуб', 'Графит', 'Бежевый'] },
            { name: 'Ширина, см', type: 'Диапазон', home: false, vals: [] },
            { name: 'Есть сборка', type: 'Да / нет', home: false, vals: [] }
        ],
        'сантехника': [
            { name: 'Тип', type: 'Список', home: true, vals: ['Смеситель', 'Унитаз', 'Ванна', 'Душевая'] },
            { name: 'Монтаж', type: 'Список', home: false, vals: ['Напольный', 'Подвесной', 'Встраиваемый'] }
        ],
        'отделка': [
            { name: 'Покрытие', type: 'Список', home: true, vals: ['Ламинат', 'Плитка', 'Обои', 'Краска'] },
            { name: 'Класс износа', type: 'Список', home: false, vals: ['31', '32', '33', '34'] }
        ],
        'инструменты': [
            { name: 'Питание', type: 'Список', home: true, vals: ['Аккумулятор', 'Сеть'] },
            { name: 'Бренд', type: 'Список', home: false, vals: ['Makita', 'Bosch', 'DeWalt'] }
        ]
    },
    sections: [
        { id: 'specialists', name: 'Специалисты', items: [
            { name: 'Алексей Николаев', sub: 'Плиточник · опыт 8 лет', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200', status: 'published', upd: '2 октября' },
            { name: 'Игорь Петров', sub: 'Электрик', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', status: 'published', upd: '30 сентября' },
            { name: 'Сергей Волков', sub: 'Сантехник', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200', status: 'published', upd: '29 сентября' },
            { name: 'Андрей Морозов', sub: 'Маляр-штукатур', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', status: 'pending', upd: 'сегодня' }
        ] },
        { id: 'spectech', name: 'Спецтехника', items: [
            { name: 'Трактор МТЗ-82.1', sub: 'ДонТехАренда · 14 000 ₽ / смена', img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=200', status: 'published', upd: '1 октября' },
            { name: 'Экскаватор-погрузчик JCB 3CX', sub: 'ЮгСпец · 22 000 ₽ / смена', img: 'https://images.unsplash.com/photo-1580901368919-7738efb0f87e?w=200', status: 'published', upd: '27 сентября' },
            { name: 'Самосвал Scania', sub: 'ДонТехАренда · 18 000 ₽ / смена', img: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=200', status: 'published', upd: '25 сентября' }
        ] },
        { id: 'designers', name: 'Дизайнеры', items: [
            { name: 'Елена Власова', sub: 'Дизайнер интерьеров', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', status: 'published', upd: '3 октября' },
            { name: 'Студия «Эстетика»', sub: 'Дизайн-бюро', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', status: 'published', upd: '28 сентября' },
            { name: 'Дмитрий Соколов', sub: 'Дизайнер-декоратор', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200', status: 'published', upd: '20 сентября' }
        ] },
        { id: 'companies', name: 'Компании', items: [
            { name: 'ВЛКЗ Полимер', sub: 'Лакокрасочные материалы', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200', status: 'published', upd: '30 сентября' },
            { name: 'Благовест', sub: 'Вентиляция и инженерные системы', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200', status: 'published', upd: '26 сентября' },
            { name: 'Дриада', sub: 'Проектирование и строительство', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200', status: 'published', upd: '22 сентября' }
        ] },
        { id: 'jobs', name: 'Вакансии', items: [
            { name: 'Прораб', sub: 'СтройТрест · от 100 000 ₽', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200', status: 'published', upd: '2 октября' },
            { name: 'Строитель', sub: 'ООО «ГлавСтройРегион» · от 90 000 ₽', img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=200', status: 'published', upd: '1 октября' },
            { name: 'Арматурщик / бетонщик', sub: 'СтройТрест · от 100 000 ₽', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=200', status: 'pending', upd: 'сегодня' }
        ] },
        { id: 'other', name: 'Прочее', items: [
            { name: 'Клининг', sub: 'Уборка после ремонта', img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200', status: 'published', upd: '18 сентября' },
            { name: 'Монтаж и установка техники', sub: 'Бытовая техника, кондиционеры', img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200', status: 'published', upd: '18 сентября' },
            { name: 'Вывоз мусора', sub: 'Контейнер, самосвал', img: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=200', status: 'published', upd: '15 сентября' },
            { name: 'Грузчики', sub: 'Переезд, подъём на этаж', img: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=200', status: 'published', upd: '15 сентября' }
        ] },
        { id: 'lifehacks', name: 'Лайфхаки', items: [
            { name: 'Запас плитки — 10%', sub: 'Совет дня · отделка', img: 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=200', status: 'published', upd: '4 октября' },
            { name: 'Смета: косметика спальни 12 м²', sub: 'Смета · 3 шага', img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=200', status: 'published', upd: '1 октября' }
        ] },
        { id: 'landscape', name: 'Ландшафт', items: [
            { name: 'Флора Сервис', sub: 'Сад под ключ · от 185 000 ₽', img: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=200', status: 'published', upd: '29 сентября' },
            { name: 'Зелёный Двор', sub: 'Газон и изгороди · от 124 000 ₽', img: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200', status: 'published', upd: '24 сентября' },
            { name: 'ПаркЛэнд', sub: 'Крупномеры и двор · от 210 000 ₽', img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=200', status: 'published', upd: '20 сентября' }
        ] }
    ],
    agencies: [
        { name: 'Дом Хиллс', sub: 'Элитная недвижимость, загородные дома', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200', managers: [{ name: 'Ольга Смирнова', login: '+7 904 000-11-22' }, { name: 'Павел Орлов', login: 'orlov@domhills.ru' }] },
        { name: 'Салита', sub: 'Покупка, продажа, аренда жилья', img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200', managers: [{ name: 'Марина Кузнецова', login: '+7 904 000-33-44' }] },
        { name: 'Поверие', sub: 'Юридическое сопровождение сделок', img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=200', managers: [] }
    ],
    listings: [
        { id: 'l1', agency: 'Дом Хиллс', title: 'Дом 180 м², участок 8 соток', price: '14 500 000 ₽', type: 'Дом', deal: 'Продажа', address: 'пос. Рассвет', img: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400', status: 'published' },
        { id: 'l2', agency: 'Дом Хиллс', title: '2-комн. квартира, 54 м²', price: '6 900 000 ₽', type: 'Квартира', deal: 'Продажа', address: 'ул. Ленина, 112', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400', status: 'pending' },
        { id: 'l3', agency: 'Салита', title: '1-комн. квартира, 38 м²', price: '25 000 ₽ / мес', type: 'Квартира', deal: 'Аренда', address: 'пр. Мира, 7', img: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400', status: 'pending' }
    ],
    commercial: [
        { title: 'Офис, 45 м²', kind: 'Офис', deal: 'Аренда', area: 45, price: '45 000 ₽ / мес', address: 'ул. Ленина, 40', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200' },
        { title: 'Торговая площадь, 120 м²', kind: 'Торговая площадь', deal: 'Аренда', area: 120, price: '180 000 ₽ / мес', address: 'ТЦ «Восход»', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200' },
        { title: 'Склад, 350 м²', kind: 'Склад', deal: 'Продажа', area: 350, price: '9 800 000 ₽', address: 'промзона Северная', img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200' },
        { title: 'Помещение свободного назначения, 70 м²', kind: 'Свободного назначения', deal: 'Аренда', area: 70, price: '70 000 ₽ / мес', address: 'ул. Садовая, 3', img: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=200' }
    ],
    accounts: [
        { name: 'Постройка', person: 'Виктор Ли', role: 'Магазин', login: '+7 904 000-08-10', active: true },
        { name: 'Любимый Дом', person: 'Наталья Белова', role: 'Магазин', login: 'manager@lubimydom.ru', active: true },
        { name: 'Кухни Дриада', person: 'Антон Ерёмин', role: 'Магазин', login: '+7 904 000-21-90', active: false },
        { name: 'Дом Хиллс', person: 'Ольга Смирнова', role: 'Агентство', login: '+7 904 000-11-22', active: true },
        { name: 'Дом Хиллс', person: 'Павел Орлов', role: 'Агентство', login: 'orlov@domhills.ru', active: true },
        { name: 'Салита', person: 'Марина Кузнецова', role: 'Агентство', login: '+7 904 000-33-44', active: true }
    ]
};

// ---------- Состояние экрана ----------
const ui = {
    role: 'admin',
    page: 'overview',
    modType: 'products',
    prodStatus: 'all',
    prodStore: '',
    prodSearch: '',
    filterCat: 'стройматериалы',
    section: 'specialists',
    reTab: 'agencies',
    commDeal: 'all',
    myStore: '',
    myAgency: 'Дом Хиллс',
    batch: [],
    rejectTarget: null
};

// ---------- Навигация ----------
const NAV = {
    admin: [
        { h: '', items: [['overview', 'Обзор', 'overview'], ['moderation', 'Модерация', 'shield']] },
        { h: 'Каталог', items: [['products', 'Товары', 'box'], ['import', 'Импорт из 1С / Excel', 'upload'], ['shared', 'Общие карточки', 'layers'], ['filters', 'Фильтры каталога', 'sliders']] },
        { h: 'Магазины', items: [['shops', 'Витрины', 'store'], ['stories', 'Сторис', 'play'], ['home', 'Главная страница', 'image']] },
        { h: 'Разделы', items: [['sections', 'Разделы приложения', 'grid'], ['realestate', 'Недвижимость', 'building']] },
        { h: 'Доступы', items: [['accounts', 'Аккаунты', 'key']] }
    ],
    store: [
        { h: '', items: [['s-home', 'Мой магазин', 'store'], ['s-add', 'Добавить товары', 'plus'], ['s-products', 'Мои товары', 'box'], ['s-stories', 'Мои сторис', 'play']] }
    ],
    agency: [
        { h: '', items: [['a-home', 'Мои объекты', 'building'], ['a-add', 'Добавить объект', 'plus']] }
    ]
};

const TITLES = {
    overview: ['Обзор', 'Что требует внимания сегодня'],
    moderation: ['Модерация', 'Товары, сторис и объекты, которые ждут проверки'],
    products: ['Товары', 'Все товары всех витрин'],
    import: ['Импорт из 1С / Excel', 'Загрузка больших каталогов магазинов'],
    shared: ['Общие карточки', 'Одинаковые товары разных магазинов'],
    filters: ['Фильтры каталога', 'Какие фильтры видит покупатель'],
    shops: ['Витрины', 'Страницы магазинов в приложении'],
    stories: ['Сторис', 'Показываются 24 часа'],
    home: ['Главная страница', 'Промо-баннеры на главной'],
    sections: ['Разделы приложения', 'Специалисты, спецтехника, дизайнеры и другие'],
    realestate: ['Недвижимость', 'Агентства и коммерческие объекты'],
    accounts: ['Аккаунты', 'Входы для магазинов и агентств'],
    's-home': ['Мой магазин', ''],
    's-add': ['Добавить товары', 'До 5 товаров за раз · проверка администратором'],
    's-products': ['Мои товары', ''],
    's-stories': ['Мои сторис', 'Сторис проходят проверку и живут 24 часа'],
    'a-home': ['Мои объекты', ''],
    'a-add': ['Добавить объект', 'Объект появится в приложении после проверки']
};

function pendingCounts() {
    const products = Object.values(productsDb).filter(p => p.status === 'pending').length;
    const stories = storiesData.filter(s => s.status === 'pending').length;
    const re = demo.listings.filter(l => l.status === 'pending').length;
    return { products, stories, re, total: products + stories + re };
}

function renderNav() {
    const c = pendingCounts();
    $('side-nav').innerHTML = NAV[ui.role].map(g => `
        <div class="nav-group">
            ${g.h ? `<h6>${g.h}</h6>` : ''}
            ${g.items.map(([id, label, icon]) => `
                <button class="nav-item${ui.page === id ? ' on' : ''}" onclick="go('${id}')">
                    ${ico(icon)}<span>${label}</span>
                    ${id === 'moderation' && c.total ? `<span class="count">${c.total}</span>` : ''}
                </button>`).join('')}
        </div>`).join('');

    const who = {
        admin: ['А', 'Администратор', 'Полный доступ'],
        store: [ui.myStore.slice(0, 1), ui.myStore, 'Кабинет магазина'],
        agency: [ui.myAgency.slice(0, 1), ui.myAgency, 'Кабинет агентства']
    }[ui.role];
    $('side-who').innerHTML = `<div class="avatar">${esc(who[0])}</div><div><b>${esc(who[1])}</b><span>${who[2]}</span></div>`;
    $('side-role-label').textContent = { admin: 'Управление', store: 'Кабинет магазина', agency: 'Кабинет агентства' }[ui.role];
    ['admin', 'store', 'agency'].forEach(r => $('role-' + r).classList.toggle('on', r === ui.role));
}

function go(page) {
    ui.page = page;
    toggleSide(false);
    renderAll();
    window.scrollTo(0, 0);
}

function setRole(role) {
    ui.role = role;
    ui.page = { admin: 'overview', store: 's-home', agency: 'a-home' }[role];
    if (role === 'store' && !ui.batch.length) ui.batch = [blankBatchRow()];
    renderAll();
}

function renderAll() {
    if (!ui.myStore || !shopsProfileDb[ui.myStore]) ui.myStore = Object.keys(shopsProfileDb)[0] || '';
    renderNav();
    const t = TITLES[ui.page] || ['', ''];
    $('page-title').textContent = t[0];
    $('page-sub').textContent = t[1];
    const fn = PAGES[ui.page];
    $('content').innerHTML = `<div class="page">${fn ? fn() : ''}</div>`;
}

// ---------- Статусы ----------
function statusBadge(p) {
    if (p.status === 'pending') return '<span class="badge b-wait">На проверке</span>';
    if (p.status === 'rejected') return '<span class="badge b-bad">Отклонён</span>';
    if (!p.image) return '<span class="badge b-bad">Нет фото</span>';
    if (p.status === 'published') return '<span class="badge b-ok">Опубликован</span>';
    return '<span class="badge b-off">Черновик</span>';
}
const IMG_FALLBACK = "this.onerror=null;this.replaceWith(Object.assign(document.createElement('div'),{className:this.className+' thumb-empty',innerHTML:'<svg class=&quot;ico ico-sm&quot;><use href=&quot;#i-camera&quot;/></svg>'}))";
function thumb(src, round) {
    return src
        ? `<img class="thumb${round ? ' round' : ''}" src="${esc(src)}" alt="" loading="lazy" onerror="${IMG_FALLBACK}">`
        : `<div class="thumb thumb-empty${round ? ' round' : ''}">${ico('camera', 'ico-sm')}</div>`;
}
function shopCompleteness(s) {
    const checks = [
        s.banner, s.description, s.address,
        (s.facades || []).length, (s.managers || []).length,
        s.hours, s.delivery, (s.services || []).some(x => x.on), s.login
    ];
    return Math.round(checks.filter(Boolean).length / checks.length * 100);
}

// ==========================================================
//  СТРАНИЦЫ АДМИНИСТРАТОРА
// ==========================================================
const PAGES = {};

// ---------- Обзор ----------
PAGES.overview = function () {
    const c = pendingCounts();
    const prods = Object.values(productsDb);
    const nophoto = prods.filter(p => !p.image).length;
    const now = Date.now();
    const expiring = storiesData.filter(s => s.status === 'published' && s.createdAt && (DAY - (now - s.createdAt)) < 6 * 3600 * 1000 && (DAY - (now - s.createdAt)) > 0);
    const weakShops = Object.values(shopsProfileDb).filter(s => shopCompleteness(s) < 80);

    const rows = [];
    if (c.products) rows.push(['moderation', 'wait', 'shield', `${c.products} ${plural(c.products, 'товар ждёт', 'товара ждут', 'товаров ждут')} проверки`, 'Магазины добавили товары через свой кабинет', "ui.modType='products'"]);
    if (c.stories) rows.push(['moderation', 'wait', 'play', `${c.stories} ${plural(c.stories, 'сторис ждёт', 'сторис ждут', 'сторис ждут')} проверки`, 'Предложены магазинами', "ui.modType='stories'"]);
    if (c.re) rows.push(['moderation', 'wait', 'building', `${c.re} ${plural(c.re, 'объект', 'объекта', 'объектов')} недвижимости на проверке`, 'От менеджеров агентств', "ui.modType='re'"]);
    if (nophoto) rows.push(['products', 'bad', 'camera', `${nophoto} ${plural(nophoto, 'товар', 'товара', 'товаров')} без фото`, 'Не показываются покупателям, пока нет фото', "ui.prodStatus='nophoto'"]);
    /* товары, загруженные импортом без фото: по магазинам */
    const waiting = {};
    prods.forEach(p => { if (p.importedAt && !p.image) waiting[p.store] = (waiting[p.store] || 0) + 1; });
    Object.keys(waiting).forEach(store => rows.push(['import', 'bad', 'camera', `${waiting[store]} ${plural(waiting[store], 'товар', 'товара', 'товаров')} «${esc(store)}» ${waiting[store] === 1 ? 'ждёт' : 'ждут'} фото после импорта`, 'Загрузите выгрузку ещё раз вместе с архивом фото: цены не задвоятся', `startImport(${arg(store)})`]));
    expiring.forEach(s => rows.push(['stories', 'info', 'clock', `Сторис «${esc(s.name)}» исчезнет через ${Math.max(1, Math.round((DAY - (now - s.createdAt)) / 3600000))} ч`, 'Можно опубликовать новую', '']));
    if (weakShops.length === 1) rows.push(['shops', 'info', 'store', `Витрина «${esc(weakShops[0].name)}» заполнена на ${shopCompleteness(weakShops[0])}%`, 'Добавьте фасады, менеджеров и режим работы', '']);
    else if (weakShops.length) rows.push(['shops', 'info', 'store', `${weakShops.length} ${plural(weakShops.length, 'витрина заполнена', 'витрины заполнены', 'витрин заполнены')} не до конца`, 'Не хватает фасадов, менеджеров или режима работы', '']);

    const tint = { wait: ['var(--wait-soft)', 'var(--wait)'], bad: ['var(--sale-soft)', 'var(--sale)'], info: ['var(--brand-soft)', 'var(--brand-text)'] };
    const attn = rows.map(([page, tone, icon, title, sub, pre]) => `
        <div class="attn-row" onclick="${pre ? pre + ';' : ''}go('${page}')">
            <div class="attn-ico" style="background:${tint[tone][0]};color:${tint[tone][1]}">${ico(icon)}</div>
            <div><b>${title}</b><span>${sub}</span></div>
            ${ico('chevron', 'go')}
        </div>`).join('');

    const shopRows = Object.values(shopsProfileDb).map(s => {
        const mine = prods.filter(p => p.store === s.name);
        return `<div class="lrow cols-dash clickable" onclick="openShopEditor(${arg(s.name)})">
            <div class="cell-main">${thumb(s.banner)}<div style="min-width:0"><b>${esc(s.name)}</b><span>${esc(s.address || 'Адрес не указан')}</span></div></div>
            <div class="num strong hide-m">${mine.length}</div>
            <div class="num strong hide-m">${mine.filter(p => p.status === 'pending').length}</div>
            <div class="hide-m mini-bar"><span class="num">${shopCompleteness(s)}%</span><div class="bar"><i style="width:${shopCompleteness(s)}%;background:var(--brand)"></i></div></div>
        </div>`;
    }).join('');

    return `
    <div class="dash">
        <div class="card">
            <div class="card-head"><h3>Требует внимания</h3></div>
            <div style="padding-top:6px">${attn || '<div class="empty"><b>Всё проверено</b>Новых задач нет</div>'}</div>
        </div>
        <div style="display:grid;gap:16px">
            <div class="card">
                <div class="card-head"><h3>Быстрые действия</h3></div>
                <div class="quick">
                    <button onclick="go('import')">${ico('upload')}<b>Загрузить каталог</b><span>Файл из 1С или Excel</span></button>
                    <button onclick="go('stories');openStoryEditor()">${ico('play')}<b>Добавить сторис</b><span>Магазина или лайфхак</span></button>
                    <button onclick="openShopEditor()">${ico('store')}<b>Новая витрина</b><span>Страница магазина</span></button>
                    <button onclick="go('accounts');openAccountEditor()">${ico('key')}<b>Выдать доступ</b><span>Магазину или агентству</span></button>
                </div>
            </div>
            <div class="list">
                <div class="lrow head cols-dash"><div>Магазин</div><div>Товаров</div><div>На проверке</div><div>Витрина</div></div>
                ${shopRows}
            </div>
        </div>
    </div>`;
};
function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
    return many;
}

// ---------- Модерация ----------
PAGES.moderation = function () {
    const c = pendingCounts();
    const tabs = [['products', 'Товары', c.products], ['stories', 'Сторис', c.stories], ['re', 'Недвижимость', c.re]];
    let cards = '';
    if (ui.modType === 'products') {
        cards = Object.values(productsDb).filter(p => p.status === 'pending').map(p => `
            <div class="mod-card">
                <div class="mod-photo">${p.image ? `<img src="${esc(p.image)}" alt="">` : ''}<span class="badge b-wait">На проверке</span></div>
                <div class="mod-body">
                    <div class="price">${esc(p.price || 'Цена не указана')}</div>
                    <h4>${esc(p.title)}</h4>
                    <div class="mod-meta"><span>${esc(p.store || '—')}</span>${p.sku ? `<span>Арт. ${esc(p.sku)}</span>` : ''}${p.category ? `<span>${esc(p.category)}</span>` : ''}</div>
                    <div class="mod-check">
                        ${checkLine(!!p.image, 'Есть фото', 'Нет фото')}
                        ${checkLine(!!p.price, 'Цена указана', 'Нет цены')}
                        ${checkLine(!!p.category, 'Выбрана категория', 'Нет категории — не найдётся в фильтрах')}
                    </div>
                </div>
                <div class="mod-actions">
                    <button class="btn btn-danger" onclick="reject('products', ${arg(p.id)})">Отклонить</button>
                    <button class="btn btn-primary" onclick="approve('products', ${arg(p.id)})">${ico('check', 'ico-sm')}Одобрить</button>
                </div>
            </div>`).join('');
    } else if (ui.modType === 'stories') {
        cards = storiesData.filter(s => s.status === 'pending').map(s => `
            <div class="mod-card">
                <div class="mod-photo">${s.slides && s.slides[0] ? `<img src="${esc(s.slides[0])}" alt="">` : ''}<span class="badge b-wait">Сторис</span></div>
                <div class="mod-body"><h4 style="font-weight:600">${esc(s.name)}</h4><div class="mod-meta"><span>${esc(s.owner || 'Магазин')}</span><span>${(s.slides || []).length} слайд.</span></div></div>
                <div class="mod-actions">
                    <button class="btn btn-danger" onclick="reject('stories', ${arg(s.id)})">Отклонить</button>
                    <button class="btn btn-primary" onclick="approve('stories', ${arg(s.id)})">${ico('check', 'ico-sm')}Опубликовать</button>
                </div>
            </div>`).join('');
    } else {
        cards = demo.listings.filter(l => l.status === 'pending').map(l => `
            <div class="mod-card">
                <div class="mod-photo"><img src="${esc(l.img)}" alt=""><span class="badge b-deal">${esc(l.deal)}</span></div>
                <div class="mod-body">
                    <div class="price">${esc(l.price)}</div>
                    <h4>${esc(l.title)}</h4>
                    <div class="mod-meta"><span>${esc(l.agency)}</span><span>${esc(l.address)}</span></div>
                </div>
                <div class="mod-actions">
                    <button class="btn btn-danger" onclick="reject('re', ${arg(l.id)})">Отклонить</button>
                    <button class="btn btn-primary" onclick="approve('re', ${arg(l.id)})">${ico('check', 'ico-sm')}Одобрить</button>
                </div>
            </div>`).join('');
    }
    return `
        <div class="toolbar"><div class="chips">
            ${tabs.map(([id, l, n]) => `<button class="chip${ui.modType === id ? ' on' : ''}" onclick="ui.modType='${id}';renderAll()">${l}<span class="c">${n}</span></button>`).join('')}
        </div></div>
        ${cards ? `<div class="mod-grid">${cards}</div>` : `<div class="card empty"><b>Очередь пуста</b>Всё проверено — новые заявки появятся здесь</div>`}`;
};
function checkLine(ok, yes, no) {
    return `<div>${ok ? `<span class="y">${ico('check')}</span>${yes}` : `<span class="n">${ico('alert')}</span>${no}`}</div>`;
}

function approve(type, id) {
    if (type === 'products' && productsDb[id]) { productsDb[id].status = 'published'; delete productsDb[id].rejectReason; }
    if (type === 'stories') { const s = storiesData.find(x => x.id === id); if (s) { s.status = 'published'; s.createdAt = Date.now(); } }
    if (type === 're') { const l = demo.listings.find(x => x.id === id); if (l) l.status = 'published'; }
    DB_save();
    renderAll();
    toast('Одобрено — уже в приложении');
}

const REASONS = ['Нет фото или фото плохого качества', 'Неверная или не указана цена', 'Неполное описание или нет характеристик', 'Товар не соответствует правилам площадки', 'Дубль уже опубликованного товара'];
function reject(type, id) {
    ui.rejectTarget = { type, id };
    $('reject-reasons').innerHTML = REASONS.map((r, i) => `<label><input type="radio" name="rr" value="${esc(r)}"${i === 0 ? ' checked' : ''}>${esc(r)}</label>`).join('');
    $('reject-comment').value = '';
    openOverlay('reject-modal');
}
function confirmReject() {
    const t = ui.rejectTarget; if (!t) return;
    const picked = document.querySelector('input[name="rr"]:checked');
    const comment = $('reject-comment').value.trim();
    const reason = (picked ? picked.value : '') + (comment ? ' — ' + comment : '');
    if (t.type === 'products' && productsDb[t.id]) { productsDb[t.id].status = 'rejected'; productsDb[t.id].rejectReason = reason; }
    if (t.type === 'stories') storiesData = storiesData.filter(x => x.id !== t.id);
    if (t.type === 're') { const l = demo.listings.find(x => x.id === t.id); if (l) { l.status = 'rejected'; l.reason = reason; } }
    DB_save();
    closeOverlay('reject-modal');
    renderAll();
    toast('Отклонено — причина отправлена');
}

// ---------- Товары ----------
PAGES.products = function () {
    const all = Object.values(productsDb);
    const counts = {
        all: all.length,
        published: all.filter(p => p.status === 'published' && p.image).length,
        pending: all.filter(p => p.status === 'pending').length,
        nophoto: all.filter(p => !p.image).length,
        rejected: all.filter(p => p.status === 'rejected').length
    };
    const list = filteredProducts();
    const chips = [['all', 'Все'], ['published', 'Опубликованы'], ['pending', 'На проверке'], ['nophoto', 'Без фото'], ['rejected', 'Отклонены']];
    return `
        <div class="toolbar">
            <div class="search">${ico('search')}<input class="input" placeholder="Название или артикул" value="${esc(ui.prodSearch)}" oninput="ui.prodSearch=this.value;renderProductsList()"></div>
            <select class="select" style="width:auto;min-width:180px" onchange="ui.prodStore=this.value;renderAll()">
                <option value="">Все магазины</option>
                ${Object.keys(shopsProfileDb).map(n => `<option${ui.prodStore === n ? ' selected' : ''}>${esc(n)}</option>`).join('')}
            </select>
            <span class="sp"></span>
            <button class="btn btn-secondary" onclick="go('import')">${ico('upload')}Импорт</button>
            <button class="btn btn-primary" onclick="openProdEditor()">${ico('plus')}Добавить товар</button>
        </div>
        <div class="toolbar"><div class="chips">
            ${chips.map(([id, l]) => `<button class="chip${ui.prodStatus === id ? ' on' : ''}" onclick="ui.prodStatus='${id}';renderAll()">${l}<span class="c">${counts[id]}</span></button>`).join('')}
        </div></div>
        <div class="list" id="prod-list">${productRows(list)}</div>`;
};
// после импорта товаров могут быть тысячи: список показывает первые, остальные — через поиск и фильтры
const PRODUCT_ROWS_LIMIT = 300;
function productRows(list) {
    if (!list.length) return '<div class="empty"><b>Товаров не найдено</b>Измените поиск или фильтр</div>';
    const more = list.length > PRODUCT_ROWS_LIMIT
        ? `<div class="empty" style="padding:18px">Показаны ${PRODUCT_ROWS_LIMIT} из ${fmt(list.length)}: найдите товар по названию или артикулу, выберите магазин или статус</div>`
        : '';
    return `<div class="lrow head cols-products"><div>Товар</div><div>Магазин</div><div>Цена</div><div>Статус</div><div></div></div>` +
        list.slice(0, PRODUCT_ROWS_LIMIT).map(p => `
        <div class="lrow cols-products">
            <div class="cell-main">${thumb(p.image)}<div style="min-width:0"><b>${esc(p.title || 'Без названия')}</b><span>${p.sku ? 'Арт. ' + esc(p.sku) + ' · ' : ''}${esc(p.category || 'без категории')}</span></div></div>
            <div class="hide-m">${esc(p.store || '—')}</div>
            <div class="price">${esc(p.price || '—')}</div>
            <div>${statusBadge(p)}</div>
            <div class="cell-actions">
                <button class="icon-btn" onclick="openProdEditor(${arg(p.id)})" aria-label="Изменить">${ico('edit')}</button>
                <button class="icon-btn danger" onclick="deleteProduct(${arg(p.id)})" aria-label="Удалить">${ico('trash')}</button>
            </div>
        </div>`).join('') + more;
}
// поиск, магазин и статус — одни и те же для страницы и для перерисовки списка при вводе
function filteredProducts() {
    const s = ui.prodSearch.toLowerCase();
    return Object.values(productsDb).filter(p => {
        if (s && !((p.title || '') + ' ' + (p.sku || '')).toLowerCase().includes(s)) return false;
        if (ui.prodStore && p.store !== ui.prodStore) return false;
        if (ui.prodStatus === 'published') return p.status === 'published' && p.image;
        if (ui.prodStatus === 'pending') return p.status === 'pending';
        if (ui.prodStatus === 'nophoto') return !p.image;
        if (ui.prodStatus === 'rejected') return p.status === 'rejected';
        return true;
    });
}
function renderProductsList() {
    // перерисовываем только список, чтобы поле поиска не теряло фокус
    $('prod-list').innerHTML = productRows(filteredProducts());
}
function renderProducts() { if (ui.page === 'products') renderAll(); }

function deleteProduct(id) {
    if (!confirm('Удалить этот товар?')) return;
    delete productsDb[id];
    DB_save();
    renderAll();
    toast('Товар удалён');
}
function openProdEditor(id) {
    $('f-prod-store').innerHTML = Object.keys(shopsProfileDb).map(n => `<option>${esc(n)}</option>`).join('');
    const p = id && productsDb[id];
    $('prod-modal-title').textContent = p ? 'Редактировать товар' : 'Новый товар';
    $('f-prod-id').value = p ? id : '';
    $('f-prod-title').value = p ? p.title || '' : '';
    $('f-prod-price').value = p ? p.price || '' : '';
    $('f-prod-sku').value = p ? p.sku || '' : '';
    $('f-prod-store').value = p ? p.store || '' : (ui.prodStore || Object.keys(shopsProfileDb)[0] || '');
    $('f-prod-category').value = p ? p.category || '' : '';
    $('f-prod-image').value = p ? p.image || '' : '';
    $('f-prod-desc').value = p ? p.desc || '' : '';
    $('f-prod-status').value = p ? p.status || 'published' : 'published';
    openOverlay('prod-modal');
}
function closeProdEditor() { closeOverlay('prod-modal'); }
function saveProduct() {
    const title = $('f-prod-title').value.trim();
    if (!title) { toast('Введите название товара'); return; }
    const id = $('f-prod-id').value || 'p' + Date.now();
    productsDb[id] = Object.assign({}, productsDb[id], {
        id, title,
        price: $('f-prod-price').value.trim(),
        sku: $('f-prod-sku').value.trim(),
        store: $('f-prod-store').value,
        category: $('f-prod-category').value.trim(),
        image: $('f-prod-image').value.trim(),
        desc: $('f-prod-desc').value.trim(),
        status: $('f-prod-status').value
    });
    DB_save();
    closeProdEditor();
    renderAll();
    toast('Товар сохранён');
}

// ---------- Импорт из 1С / Excel ----------
// Мастер — модуль src/admin/features/import: чтение файла, колонки, совпадения, фото, запуск.
PAGES.import = function () { return renderImportPage(); };

/* товары магазина в разделе «Товары» (из итогов импорта) */
function showStoreProducts(store, status) {
    ui.prodStore = store;
    ui.prodStatus = status || 'all';
    go('products');
}

// ---------- Общие карточки ----------
PAGES.shared = function () {
    return `
        <p class="lead">Одинаковые товары разных магазинов — саморезы, смеси, грунтовки — оформляются <b>одной карточкой</b> с общими фото и описанием. Каждый магазин указывает только свою цену и наличие. Покупатель видит один товар и сравнивает цены магазинов.</p>
        <div class="toolbar"><div class="search">${ico('search')}<input class="input" placeholder="Найти общую карточку"></div><span class="sp"></span><button class="btn btn-primary" onclick="openSharedEditor()">${ico('plus')}Новая карточка</button></div>
        <div class="list">
            <div class="lrow head cols-shared"><div>Карточка</div><div>Магазинов</div><div>Цены</div><div></div></div>
            ${demo.shared.map((s, i) => `
            <div class="lrow cols-shared">
                <div class="cell-main">${thumb(s.img)}<div style="min-width:0"><b>${esc(s.name)}</b><span>Фото и описание общие</span></div></div>
                <div class="num">${s.stores}</div>
                <div class="price hide-m">${esc(s.from)} – ${esc(s.to)}</div>
                <div class="cell-actions"><button class="icon-btn" onclick="openSharedEditor(${i})" aria-label="Изменить">${ico('edit')}</button></div>
            </div>`).join('')}
        </div>`;
};
function openSharedEditor(i) {
    const s = i != null ? demo.shared[i] : { name: '', img: '' };
    openEntry(i != null ? 'Общая карточка' : 'Новая общая карточка', `
        <div class="panel">
            <label class="field"><span>Название</span><input id="e-name" class="input" value="${esc(s.name)}"></label>
            <label class="field"><span>Фото (ссылка)</span><input id="e-img" class="input" value="${esc(s.img)}"></label>
            <label class="field" style="margin-bottom:0"><span>Описание и характеристики</span><textarea class="textarea" rows="4" placeholder="Состав, расход, фасовка…"></textarea></label>
        </div>
        <div class="note">${ico('info')}<div>Магазины привязываются к карточке при импорте — по артикулу, штрихкоду или названию.</div></div>`,
        () => {
            const v = { name: $('e-name').value.trim(), img: $('e-img').value.trim(), stores: s.stores || 0, from: s.from || '—', to: s.to || '—' };
            if (!v.name) return toast('Введите название');
            if (i != null) demo.shared[i] = v; else demo.shared.unshift(v);
            return true;
        });
}

// ---------- Фильтры каталога ----------
PAGES.filters = function () {
    const cats = Object.keys(demo.filters);
    const list = demo.filters[ui.filterCat] || [];
    return `
        <p class="lead">Фильтры задаются для категории — их получают все товары этой категории во всех магазинах. На главной покупатель видит фильтры с отметкой «На главной». Свои дополнительные фильтры магазина настраиваются в его витрине.</p>
        <div class="toolbar"><div class="chips">
            ${cats.map(c => `<button class="chip${ui.filterCat === c ? ' on' : ''}" onclick="ui.filterCat=${arg(c)};renderAll()">${esc(c[0].toUpperCase() + c.slice(1))}</button>`).join('')}
        </div><span class="sp"></span><button class="btn btn-primary" onclick="openFilterEditor('cat')">${ico('plus')}Добавить фильтр</button></div>
        <div class="card card-pad">${filterBuilder(list, 'cat')}</div>`;
};
function filterBuilder(list, scope) {
    if (!list.length) return '<div class="empty"><b>Фильтров пока нет</b>Добавьте первый фильтр</div>';
    return list.map((f, i) => `
        <div class="flt">
            <div class="flt-head">
                <b>${esc(f.name)}</b><span class="badge b-off">${esc(f.type)}</span>
                <span class="sp"></span>
                ${scope === 'cat' ? `<span class="muted" style="font-size:13px">На главной</span><label class="switch"><input type="checkbox"${f.home ? ' checked' : ''} onchange="filterList('${scope}')[${i}].home=this.checked"><i></i></label>` : ''}
                <button class="icon-btn danger" onclick="filterList('${scope}').splice(${i},1);refreshFilters('${scope}')" aria-label="Удалить фильтр">${ico('trash')}</button>
            </div>
            ${f.type === 'Список'
                ? `<div class="flt-vals">${f.vals.map((v, j) => `<span class="val">${esc(v)}<button onclick="filterList('${scope}')[${i}].vals.splice(${j},1);refreshFilters('${scope}')" aria-label="Убрать">${ico('x', 'ico-sm')}</button></span>`).join('')}
                    <button class="val-add" onclick="addFilterValue(this,'${scope}',${i})">+ значение</button></div>`
                : `<div class="range-demo">${f.type === 'Диапазон' ? 'Покупатель задаёт «от» и «до» — значения берутся из товаров' : 'Переключатель «да / нет» у покупателя'}</div>`}
        </div>`).join('');
}
/* фильтры категорий (демо в памяти); свои фильтры магазина — в витрине, вкладка «Фильтры» редактора */
function filterList() { return demo.filters[ui.filterCat]; }
function refreshFilters() { renderAll(); }
function addFilterValue(btn, scope, i) {
    const inp = document.createElement('input');
    inp.className = 'input'; inp.placeholder = 'Новое значение'; inp.style.cssText = 'width:160px;min-height:30px;padding:4px 12px';
    btn.replaceWith(inp); inp.focus();
    const done = () => { const v = inp.value.trim(); if (v) filterList(scope)[i].vals.push(v); refreshFilters(scope); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') done(); if (e.key === 'Escape') refreshFilters(scope); });
    inp.addEventListener('blur', done);
}
function openFilterEditor(scope) {
    openEntry('Новый фильтр', `
        <div class="panel">
            <label class="field"><span>Название</span><input id="e-fname" class="input" placeholder="Например, Цвет"></label>
            <label class="field"><span>Как выбирает покупатель</span><select id="e-ftype" class="select"><option>Список</option><option>Диапазон</option><option>Да / нет</option></select></label>
            <label class="field" style="margin-bottom:0"><span>Значения через запятую (для списка)</span><input id="e-fvals" class="input" placeholder="Белый, Серый, Чёрный"></label>
        </div>`,
        () => {
            const name = $('e-fname').value.trim(); if (!name) return toast('Введите название фильтра');
            const type = $('e-ftype').value;
            filterList(scope).push({ name, type, home: false, vals: type === 'Список' ? $('e-fvals').value.split(',').map(x => x.trim()).filter(Boolean) : [] });
            return true;
        });
}

// ---------- Витрины ----------
PAGES.shops = function () {
    const prods = Object.values(productsDb);
    const cards = Object.values(shopsProfileDb).map(s => {
        const mine = prods.filter(p => p.store === s.name);
        const pct = shopCompleteness(s);
        const ink = storeInkOf(s);
        return `
        <div class="shop-card" onclick="openShopEditor(${arg(s.name)})">
            <div class="cover">${s.banner ? `<img src="${esc(s.banner)}" alt="" loading="lazy">` : ''}</div>
            <h4 class="spine" style="--spine:${esc(ink.ink)};--on-spine:${esc(ink.on)}"><span>${esc(s.name)}</span></h4>
            <div class="body">
                <p>${esc(s.address || 'Адрес не указан')}</p>
                <div class="shop-stats"><span><b>${mine.length}</b> товаров</span><span><b>${(s.managers || []).length}</b> менеджеров</span><span><b>${(s.facades || []).length}</b> адресов</span></div>
                <div class="completeness"><div><span>Витрина заполнена</span><b class="num" style="color:var(--ink)">${pct}%</b></div><div class="bar"><i style="width:${pct}%;background:var(--brand)"></i></div></div>
            </div>
        </div>`;
    }).join('');
    return `
        <div class="toolbar"><p class="lead" style="margin:0;flex:1">Каждый магазин получает одинаковую по структуре страницу: о фирме, фасады с адресами, карта, режим работы, менеджеры, оплата и доставка, услуги, свой каталог и свои фильтры.</p>
        <button class="btn btn-primary" onclick="openShopEditor()">${ico('plus')}Новая витрина</button></div>
        <div class="shop-grid">${cards || '<div class="card empty"><b>Витрин пока нет</b></div>'}</div>`;
};
function renderShops() { if (ui.page === 'shops') renderAll(); }

let shopDraft = null, shopKey = null, shopTab = 'main';
/* «Оформление», «Блоки» и «Фильтры» рисует модуль src/admin/features/storefront-designer */
const SHOP_TABS = [['main', 'О магазине'], ['design', 'Оформление'], ['blocks', 'Блоки'], ['filters', 'Фильтры'], ['facades', 'Адреса'], ['map', 'Карта'], ['hours', 'Часы'], ['managers', 'Менеджеры'], ['pay', 'Оплата'], ['services', 'Услуги'], ['access', 'Доступ']];
const DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

function openShopEditor(name) {
    const src = name && shopsProfileDb[name];
    shopKey = src ? name : null;
    shopDraft = JSON.parse(JSON.stringify(src || { name: '', status: 'published', gallery: [] }));
    shopDraft.facades = shopDraft.facades || (shopDraft.address ? [{ photo: shopDraft.banner || '', address: shopDraft.address }] : []);
    shopDraft.managers = shopDraft.managers || [];
    shopDraft.hours = shopDraft.hours || DAYS.map((d, i) => ({ from: '10:00', to: i === 6 ? '18:00' : '20:00', off: false }));
    shopDraft.services = shopDraft.services || [{ name: 'Доставка', on: false, price: '' }, { name: 'Сборка', on: false, price: '' }, { name: 'Замер', on: false, price: '' }];
    shopTab = 'main';
    $('shop-modal-title').textContent = src ? src.name : 'Новая витрина';
    renderShopTab();
    openOverlay('shop-modal');
}
function closeShopEditor() { closeOverlay('shop-modal'); }
function sd(k, v) { shopDraft[k] = v; }
function setShopTab(id) {
    if (!SHOP_TABS.some(([t]) => t === id)) return;
    shopTab = id;
    renderShopTab();
    $('shop-body').scrollTop = 0;
}
function renderShopTab() {
    $('shop-tabs').innerHTML = SHOP_TABS.map(([id, l]) => `<button class="${shopTab === id ? 'on' : ''}" onclick="setShopTab('${id}')"${shopTab === id ? ' aria-current="page"' : ''}>${l}</button>`).join('');
    const d = shopDraft;
    const T = {
        main: () => `
            <div class="panel">
                <h4>О магазине</h4><p>Это видит покупатель в начале витрины.</p>
                <label class="field"><span>Название</span><input class="input" value="${esc(d.name)}" oninput="sd('name',this.value)"></label>
                <div class="row2">
                    <label class="field"><span>Категория</span><input class="input" value="${esc(d.category || '')}" placeholder="Мебель, кухни…" oninput="sd('category',this.value)"></label>
                    <label class="field"><span>Сайт</span><input class="input" value="${esc(d.site || '')}" placeholder="https://…" oninput="sd('site',this.value)"></label>
                </div>
                <label class="field"><span>Описание</span><textarea class="textarea" rows="4" oninput="sd('description',this.value)">${esc(d.description || '')}</textarea></label>
                <label class="field" style="margin-bottom:0"><span>Главное фото (ссылка)</span><input class="input" value="${esc(d.banner || '')}" placeholder="https://…" oninput="sd('banner',this.value)"><small>Фото без надписей — название магазина приложение подпишет само.</small></label>
            </div>`,
        facades: () => `
            <div class="panel">
                <h4>Фасады и адреса</h4><p>Для сети — несколько фасадов, у каждого свой адрес.</p>
                ${d.facades.map((f, i) => `
                <div class="facade">
                    ${f.photo ? `<img src="${esc(f.photo)}" alt="">` : `<div class="ph thumb-empty">${ico('camera')}</div>`}
                    <div style="display:grid;gap:6px">
                        <input class="input" value="${esc(f.address)}" placeholder="Адрес" oninput="shopDraft.facades[${i}].address=this.value">
                        <input class="input" value="${esc(f.photo)}" placeholder="Фото фасада (ссылка)" onchange="shopDraft.facades[${i}].photo=this.value;renderShopTab()">
                    </div>
                    <button class="icon-btn danger" onclick="shopDraft.facades.splice(${i},1);renderShopTab()" aria-label="Удалить адрес">${ico('trash')}</button>
                </div>`).join('') || '<div class="empty" style="padding:20px">Адресов пока нет</div>'}
                <button class="btn btn-ghost" style="margin-top:8px" onclick="shopDraft.facades.push({photo:'',address:''});renderShopTab()">${ico('plus')}Добавить адрес</button>
            </div>`,
        map: () => `
            <div class="panel">
                <h4>Карта</h4><p>Покупатель откроет точку в Яндекс Картах или Google Maps.</p>
                <div class="map-box"><div class="road1"></div><div class="road2"></div><div class="pin">${ico('pin')}</div><div class="lbl">${esc((d.facades[0] && d.facades[0].address) || d.address || 'Адрес не указан')}</div></div>
                <div class="row2" style="margin-top:14px">
                    <label class="field"><span>Ссылка на Яндекс Карты</span><input class="input" value="${esc(d.mapYandex || '')}" placeholder="https://yandex.ru/maps/…" oninput="sd('mapYandex',this.value)"></label>
                    <label class="field"><span>Ссылка на Google Maps</span><input class="input" value="${esc(d.mapGoogle || '')}" placeholder="https://maps.google.com/…" oninput="sd('mapGoogle',this.value)"></label>
                </div>
            </div>`,
        hours: () => `
            <div class="panel">
                <h4>Режим работы</h4><p>Показывается на витрине и в карточке адреса.</p>
                ${DAYS.map((day, i) => `
                <div class="hours">
                    <b style="font-weight:500">${day}</b>
                    <input class="input" value="${esc(d.hours[i].from)}" ${d.hours[i].off ? 'disabled' : ''} oninput="shopDraft.hours[${i}].from=this.value">
                    <input class="input" value="${esc(d.hours[i].to)}" ${d.hours[i].off ? 'disabled' : ''} oninput="shopDraft.hours[${i}].to=this.value">
                    <label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" ${d.hours[i].off ? 'checked' : ''} onchange="shopDraft.hours[${i}].off=this.checked;renderShopTab()" style="accent-color:var(--brand)">Вых.</label>
                </div>`).join('')}
            </div>`,
        managers: () => `
            <div class="panel">
                <h4>Менеджеры</h4><p>Сюда приходят заказы из корзины. Кнопка в приложении откроет MAX или Telegram с данными товара.</p>
                ${d.managers.map((m, i) => `
                <div class="person">
                    <div class="person-head"><b>Менеджер ${i + 1}</b><button class="btn btn-ghost btn-sm" style="color:var(--sale)" onclick="shopDraft.managers.splice(${i},1);renderShopTab()">Удалить</button></div>
                    <label class="field"><span>Имя и фамилия</span><input class="input" value="${esc(m.name)}" oninput="shopDraft.managers[${i}].name=this.value"></label>
                    <label class="field"><span>Отдел</span><input class="input" value="${esc(m.role)}" placeholder="Продажи, бухгалтерия…" oninput="shopDraft.managers[${i}].role=this.value"></label>
                    <label class="field"><span>Телефон</span><input class="input" value="${esc(m.phone)}" oninput="shopDraft.managers[${i}].phone=this.value"></label>
                    <label class="field"><span>E-mail</span><input class="input" value="${esc(m.email)}" oninput="shopDraft.managers[${i}].email=this.value"></label>
                    <label class="field"><span>MAX — логин или ссылка</span><input class="input" value="${esc(m.max)}" oninput="shopDraft.managers[${i}].max=this.value"></label>
                    <label class="field"><span>Telegram</span><input class="input" value="${esc(m.tg)}" placeholder="@логин" oninput="shopDraft.managers[${i}].tg=this.value"></label>
                </div>`).join('') || '<div class="empty" style="padding:20px">Менеджеров пока нет — заказы некому будет отправить</div>'}
                <button class="btn btn-ghost" style="margin-top:8px" onclick="shopDraft.managers.push({name:'',role:'',phone:'',email:'',max:'',tg:''});renderShopTab()">${ico('plus')}Добавить менеджера</button>
            </div>`,
        pay: () => `
            <div class="panel">
                <h4>Оплата и доставка</h4><p>Текст для покупателя на витрине.</p>
                <div class="note" style="margin-bottom:14px">${ico('info')}<div>Оплата проходит <b>напрямую через менеджера магазина</b> — приложение платежи не принимает.</div></div>
                <label class="field"><span>Как оплатить</span><textarea class="textarea" rows="3" placeholder="Наличными или картой в магазине, по счёту для юрлиц…" oninput="sd('payment',this.value)">${esc(d.payment || '')}</textarea></label>
                <label class="field" style="margin-bottom:0"><span>Доставка</span><textarea class="textarea" rows="3" placeholder="По городу — 1–2 дня, бесплатно от 30 000 ₽…" oninput="sd('delivery',this.value)">${esc(d.delivery || '')}</textarea></label>
            </div>`,
        services: () => `
            <div class="panel">
                <h4>Дополнительные услуги</h4><p>Включённые услуги появятся на витрине.</p>
                ${d.services.map((s, i) => `
                <div class="svc">
                    <label class="switch"><input type="checkbox" ${s.on ? 'checked' : ''} onchange="shopDraft.services[${i}].on=this.checked"><i></i></label>
                    <div><b>${esc(s.name)}</b><span>${{ 'Доставка': 'По городу и области', 'Сборка': 'Сборка мебели мастером', 'Замер': 'Выезд замерщика' }[s.name] || ''}</span></div>
                    <span class="sp"></span>
                    <input class="input" value="${esc(s.price)}" placeholder="Цена или «бесплатно»" oninput="shopDraft.services[${i}].price=this.value">
                </div>`).join('')}
            </div>`,
        design: () => renderStorefrontTab('design', d, shopKey),
        blocks: () => renderStorefrontTab('blocks', d, shopKey),
        filters: () => renderStorefrontTab('filters', d, shopKey),
        access: () => `
            <div class="panel">
                <h4>Кабинет магазина</h4><p>Магазин сам добавляет товары по 1–5 штук, они приходят вам на проверку.</p>
                <label class="field"><span>Логин — телефон или e-mail</span><input class="input" value="${esc(d.login || '')}" placeholder="+7 … или manager@…" oninput="sd('login',this.value)"></label>
                <div class="svc" style="border:0;padding-top:0"><label class="switch"><input type="checkbox" ${d.loginActive !== false ? 'checked' : ''} onchange="sd('loginActive',this.checked)"><i></i></label><div><b>Доступ включён</b><span>Выключите, чтобы временно закрыть кабинет</span></div></div>
                <button class="btn btn-secondary" onclick="toast('Приглашение со временным паролем отправлено')">${ico('key')}Отправить приглашение</button>
            </div>`
    };
    $('shop-body').innerHTML = T[shopTab]();
}
function saveShop() {
    const name = (shopDraft.name || '').trim();
    if (!name) { shopTab = 'main'; renderShopTab(); toast('Введите название магазина'); return; }
    shopDraft.name = name;
    prepareStorefrontForSave(shopDraft);
    if (shopDraft.facades[0] && shopDraft.facades[0].address) shopDraft.address = shopDraft.facades[0].address;
    if (shopKey && shopKey !== name) {
        delete shopsProfileDb[shopKey];
        Object.values(productsDb).forEach(p => { if (p.store === shopKey) p.store = name; });
    }
    shopsProfileDb[name] = shopDraft;
    DB_save();
    closeShopEditor();
    renderAll();
    toast('Витрина сохранена');
}
function deleteShop(name) {
    if (!confirm('Удалить витрину «' + name + '»?')) return;
    delete shopsProfileDb[name];
    DB_save();
    renderAll();
    toast('Витрина удалена');
}

// ---------- Сторис ----------
function storyCover(s) {
    const vid = s.youtube && ytId(s.youtube);
    return vid ? 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg' : (s.slides && s.slides[0]) || '';
}
function storyLeft(s) {
    if (s.status === 'pending') return '<span class="badge b-wait">На проверке</span>';
    if (!s.createdAt) return '<span class="badge b-ok">Активна</span>';
    const left = DAY - (Date.now() - s.createdAt);
    if (left <= 0) return '<span class="badge b-off">Истекла</span>';
    const h = Math.floor(left / 3600000), m = Math.floor(left % 3600000 / 60000);
    return `<span class="badge b-info">Ещё ${h ? h + ' ч ' : ''}${m} мин</span>`;
}
function storyRows(list) {
    if (!list.length) return '<div class="empty"><b>Сторис нет</b>Добавьте первую</div>';
    return `<div class="lrow head cols-stories"><div>Сторис</div><div>Источник</div><div>Осталось</div><div></div></div>` + list.map(s => `
        <div class="lrow cols-stories">
            <div class="cell-main">${thumb(storyCover(s), true)}<div style="min-width:0"><b>${esc(s.name || 'Без названия')}</b><span>${s.isLifehack ? 'Лайфхак · ' + esc(s.author || 'автор не указан') : (s.slides || []).length + ' ' + plural((s.slides || []).length, 'слайд', 'слайда', 'слайдов')}</span></div></div>
            <div class="hide-m">${s.isLifehack ? 'YouTube Shorts' : esc(s.owner || s.name)}</div>
            <div>${storyLeft(s)}</div>
            <div class="cell-actions">
                <button class="icon-btn" onclick="openStoryEditor(${arg(s.id)})" aria-label="Изменить">${ico('edit')}</button>
                <button class="icon-btn danger" onclick="deleteStory(${arg(s.id)})" aria-label="Удалить">${ico('trash')}</button>
            </div>
        </div>`).join('');
}
PAGES.stories = function () {
    const live = storiesData.filter(s => s.status !== 'pending');
    return `
        <div class="toolbar"><span class="sp"></span>
            <button class="btn btn-secondary" onclick="openStoryEditor(null,'lifehack')">${ico('yt')}Лайфхак из YouTube</button>
            <button class="btn btn-primary" onclick="openStoryEditor(null,'shop')">${ico('plus')}Сторис магазина</button>
        </div>
        <div class="card" style="margin-bottom:16px">
            <div class="card-head"><h3>Как видит покупатель</h3></div>
            <div class="story-strip">${live.map(s => {
                const old = s.createdAt && DAY - (Date.now() - s.createdAt) <= 0;
                return `<button class="story-bubble${s.isLifehack ? ' lh' : ''}${old ? ' old' : ''}" onclick="openStoryEditor(${arg(s.id)})"><div class="ring"><img src="${esc(storyCover(s))}" alt="" onerror="this.onerror=null;this.src='icons/icon-192.png'"></div><span>${esc(s.name)}</span></button>`;
            }).join('')}</div>
        </div>
        <div class="list">${storyRows(storiesData)}</div>`;
};
function renderStoriesList() { if (ui.page === 'stories') renderAll(); }

let storyType = 'shop';
function setStoryType(t) {
    storyType = t;
    $('st-type-shop').classList.toggle('on', t === 'shop');
    $('st-type-lh').classList.toggle('on', t === 'lifehack');
    $('story-shop-fields').classList.toggle('hidden', t !== 'shop');
    $('story-lh-fields').classList.toggle('hidden', t !== 'lifehack');
    if (t === 'lifehack') renderYtPreview();
}
function ytId(url) { const m = String(url || '').match(/(?:shorts\/|v=|youtu\.be\/|embed\/)([\w-]{11})/); return m ? m[1] : ''; }
function renderYtPreview() {
    const id = ytId($('f-story-yt').value);
    const title = $('f-story-lh-title').value.trim() || 'Заголовок ролика';
    const author = $('f-story-author').value.trim() || 'Автор не указан';
    $('yt-preview').innerHTML = id
        ? `<div class="yt-preview"><div class="shot"><img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" onerror="this.style.display='none'"><div class="play">${ico('yt')}</div></div>
            <div><b>${esc(title)}</b><span>${esc(author)}</span><span style="margin-top:8px">В сторис будет указан автор и кнопка «Смотреть на YouTube» — прямой переход к ролику.</span></div></div>`
        : `<div class="note">${ico('link')}<div>Вставьте ссылку вида <b>youtube.com/shorts/…</b> — здесь появится превью.</div></div>`;
}
function openStoryEditor(id, type) {
    const s = id ? storiesData.find(x => x.id === id) : null;
    const owners = ui.role === 'store' ? [ui.myStore] : Object.keys(shopsProfileDb);
    $('f-story-owner').innerHTML = owners.map(n => `<option>${esc(n)}</option>`).join('');
    $('story-type-pick').classList.toggle('hidden', ui.role === 'store');
    $('story-modal-title').textContent = s ? 'Редактировать сторис' : 'Новая сторис';
    $('f-story-id').value = s ? s.id : '';
    $('f-story-name').value = s && !s.isLifehack ? s.name || '' : '';
    $('f-story-owner').value = s && s.owner ? s.owner : owners[0] || '';
    $('f-story-slides').value = s && !s.isLifehack ? (s.slides || []).join('\n') : '';
    $('f-story-yt').value = s && s.isLifehack ? s.youtube || '' : '';
    $('f-story-lh-title').value = s && s.isLifehack ? s.name || '' : '';
    $('f-story-author').value = s && s.isLifehack ? s.author || '' : '';
    setStoryType(s ? (s.isLifehack ? 'lifehack' : 'shop') : (ui.role === 'store' ? 'shop' : (type || 'shop')));
    openOverlay('story-modal');
}
function closeStoryEditor() { closeOverlay('story-modal'); }
function saveStory() {
    const id = $('f-story-id').value;
    let data;
    if (storyType === 'lifehack') {
        const url = $('f-story-yt').value.trim(), vid = ytId(url);
        if (!vid) { toast('Нужна ссылка на YouTube Shorts'); return; }
        data = { name: $('f-story-lh-title').value.trim() || 'Лайфхак', isLifehack: true, youtube: url, author: $('f-story-author').value.trim(), slides: ['https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg'] };
    } else {
        const name = $('f-story-name').value.trim();
        const slides = $('f-story-slides').value.split('\n').map(x => x.trim()).filter(Boolean);
        if (!name) { toast('Введите название'); return; }
        if (!slides.length) { toast('Добавьте хотя бы один слайд'); return; }
        data = { name, owner: $('f-story-owner').value, slides, isLifehack: false };
    }
    const existing = id && storiesData.find(x => x.id === id);
    if (existing) Object.assign(existing, data);
    else storiesData.push(Object.assign({ id: 'st' + Date.now(), status: ui.role === 'store' ? 'pending' : 'published', createdAt: Date.now() }, data));
    DB_save();
    closeStoryEditor();
    renderAll();
    toast(ui.role === 'store' ? 'Сторис отправлена на проверку' : 'Сторис опубликована на 24 часа');
}
function deleteStory(id) {
    if (!confirm('Удалить эту сторис?')) return;
    storiesData = storiesData.filter(x => x.id !== id);
    DB_save();
    renderAll();
    toast('Сторис удалена');
}

// ---------- Главная страница: баннеры ----------
PAGES.home = function () {
    return `
        <div class="toolbar"><p class="lead" style="margin:0;flex:1">Баннеры листаются на главной под поиском и сторис. Нажатие ведёт в витрину магазина.</p>
        <button class="btn btn-primary" onclick="openBannerEditor()">${ico('plus')}Новый баннер</button></div>
        <div class="list" id="promo-list">${promoData.length ? `<div class="lrow head cols-banners"><div>Баннер</div><div>Подпись</div><div></div></div>` + promoData.map((b, i) => `
            <div class="lrow cols-banners">
                <div class="cell-main"><img class="thumb" style="width:88px;height:56px" src="${esc(b.image || '')}" alt=""><div style="min-width:0"><b>${esc(b.title || 'Без заголовка')}</b><span>Слайд ${i + 1}</span></div></div>
                <div class="hide-m muted">${esc(b.subtitle || '—')}</div>
                <div class="cell-actions">
                    <button class="icon-btn" onclick="openBannerEditor(${i})" aria-label="Изменить">${ico('edit')}</button>
                    <button class="icon-btn danger" onclick="deleteBanner(${i})" aria-label="Удалить">${ico('trash')}</button>
                </div>
            </div>`).join('') : '<div class="empty"><b>Баннеров нет</b></div>'}</div>`;
};
function renderBanners() { if (ui.page === 'home') renderAll(); }
function openBannerEditor(index) {
    const b = index != null && index !== '' ? promoData[index] : null;
    $('banner-modal-title').textContent = b ? 'Редактировать баннер' : 'Новый баннер';
    $('f-banner-id').value = b ? index : '';
    $('f-banner-title').value = b ? b.title || '' : '';
    $('f-banner-subtitle').value = b ? b.subtitle || '' : '';
    $('f-banner-image').value = b ? b.image || '' : '';
    openOverlay('banner-modal');
}
function closeBannerEditor() { closeOverlay('banner-modal'); }
function saveBanner() {
    const title = $('f-banner-title').value.trim();
    if (!title) { toast('Введите заголовок'); return; }
    const index = $('f-banner-id').value;
    const data = Object.assign({}, index !== '' ? promoData[index] : {}, { title, subtitle: $('f-banner-subtitle').value.trim(), image: $('f-banner-image').value.trim() });
    if (index !== '') promoData[index] = data; else promoData.push(data);
    DB_save();
    closeBannerEditor();
    renderAll();
    toast('Баннер сохранён');
}
function deleteBanner(index) {
    if (!confirm('Удалить баннер?')) return;
    promoData.splice(index, 1);
    DB_save();
    renderAll();
    toast('Баннер удалён');
}

// ---------- Разделы приложения ----------
const SECTION_EXTRA = {
    jobs: [['Компания', 'company'], ['Зарплата', 'salary']],
    spectech: [['Цена за смену', 'price'], ['С экипажем?', 'crew']],
    lifehacks: [['Ссылка на YouTube (необязательно)', 'yt']],
    landscape: [['Цена «от»', 'price'], ['Услуги', 'services']],
    designers: [['Цены (услуга — стоимость)', 'prices']]
};
PAGES.sections = function () {
    const sec = demo.sections.find(s => s.id === ui.section) || demo.sections[0];
    return `
        <div class="sec-layout">
            <div class="sec-list">${demo.sections.map(s => `<button class="sec-item${s.id === sec.id ? ' on' : ''}" onclick="ui.section='${s.id}';renderAll()">${esc(s.name)}<span class="c">${s.items.length}</span></button>`).join('')}</div>
            <div>
                <div class="toolbar"><div class="search">${ico('search')}<input class="input" placeholder="Поиск в разделе «${esc(sec.name)}»"></div><span class="sp"></span><button class="btn btn-primary" onclick="openSectionEntry()">${ico('plus')}Добавить</button></div>
                <div class="list">
                    <div class="lrow head cols-section"><div>${esc(sec.name)}</div><div>Статус</div><div>Обновлено</div><div></div></div>
                    ${sec.items.map((it, i) => `
                    <div class="lrow cols-section">
                        <div class="cell-main">${thumb(it.img, sec.id === 'specialists' || sec.id === 'designers')}<div style="min-width:0"><b>${esc(it.name)}</b><span>${esc(it.sub)}</span></div></div>
                        <div>${it.status === 'pending' ? '<span class="badge b-wait">На проверке</span>' : '<span class="badge b-ok">Опубликовано</span>'}</div>
                        <div class="hide-m muted">${esc(it.upd)}</div>
                        <div class="cell-actions">
                            <button class="icon-btn" onclick="openSectionEntry(${i})" aria-label="Изменить">${ico('edit')}</button>
                            <button class="icon-btn danger" onclick="if(confirm('Удалить запись?')){demo.sections.find(s=>s.id===ui.section).items.splice(${i},1);renderAll()}" aria-label="Удалить">${ico('trash')}</button>
                        </div>
                    </div>`).join('') || '<div class="empty"><b>Записей пока нет</b></div>'}
                </div>
            </div>
        </div>`;
};
function openSectionEntry(i) {
    const sec = demo.sections.find(s => s.id === ui.section);
    const it = i != null ? sec.items[i] : { name: '', sub: '', img: '' };
    const extra = (SECTION_EXTRA[sec.id] || []).map(([l, k]) => `<label class="field"><span>${l}</span><input class="input" data-k="${k}" value="${esc(it[k] || '')}"></label>`).join('');
    openEntry((i != null ? '' : 'Новая запись · ') + sec.name, `
        <div class="panel">
            <label class="field"><span>Название или имя</span><input id="e-name" class="input" value="${esc(it.name)}"></label>
            <label class="field"><span>Подзаголовок</span><input id="e-sub" class="input" value="${esc(it.sub)}" placeholder="Специализация, цена, компания…"></label>
            <label class="field"><span>Фото (ссылка)</span><input id="e-img" class="input" value="${esc(it.img)}"></label>
            ${extra}
            <label class="field" style="margin-bottom:0"><span>Описание</span><textarea class="textarea" rows="3">${esc(it.desc || '')}</textarea></label>
        </div>
        <div class="panel">
            <h4>Контакты</h4><p>Покупатель свяжется напрямую.</p>
            <div class="row3">
                <label class="field"><span>Телефон</span><input class="input" value="${esc(it.phone || '')}"></label>
                <label class="field"><span>Telegram</span><input class="input" value="${esc(it.tg || '')}"></label>
                <label class="field"><span>MAX</span><input class="input" value="${esc(it.max || '')}"></label>
            </div>
        </div>`,
        () => {
            const v = Object.assign({}, it, { name: $('e-name').value.trim(), sub: $('e-sub').value.trim(), img: $('e-img').value.trim(), status: it.status || 'published', upd: 'сегодня' });
            if (!v.name) return toast('Введите название');
            document.querySelectorAll('#entry-body [data-k]').forEach(el => { v[el.dataset.k] = el.value; });
            if (i != null) sec.items[i] = v; else sec.items.unshift(v);
            return true;
        });
}

// ---------- Недвижимость ----------
PAGES.realestate = function () {
    const tabs = `<div class="chips"><button class="chip${ui.reTab === 'agencies' ? ' on' : ''}" onclick="ui.reTab='agencies';renderAll()">Агентства<span class="c">${demo.agencies.length}</span></button><button class="chip${ui.reTab === 'commercial' ? ' on' : ''}" onclick="ui.reTab='commercial';renderAll()">Коммерческая<span class="c">${demo.commercial.length}</span></button></div>`;
    if (ui.reTab === 'agencies') {
        return `
        <div class="toolbar">${tabs}<span class="sp"></span><button class="btn btn-primary" onclick="openAgencyEditor()">${ico('plus')}Новое агентство</button></div>
        <p class="lead">У каждого менеджера агентства свой логин. Менеджеры добавляют объекты сами — они появляются в приложении после вашей проверки.</p>
        <div class="agency-grid">${demo.agencies.map((a, i) => {
            const mine = demo.listings.filter(l => l.agency === a.name);
            return `
            <div class="agency">
                <div class="agency-top"><img src="${esc(a.img)}" alt=""><div style="flex:1;min-width:0"><b>${esc(a.name)}</b><span>${esc(a.sub)}</span></div><button class="icon-btn" onclick="openAgencyEditor(${i})" aria-label="Изменить">${ico('edit')}</button></div>
                <div class="agency-nums">
                    <div><b>${mine.filter(l => l.status === 'published').length}</b><span>в приложении</span></div>
                    <div><b>${mine.filter(l => l.status === 'pending').length}</b><span>на проверке</span></div>
                    <div><b>${a.managers.length}</b><span>менеджеров</span></div>
                </div>
                ${a.managers.map(m => `<div class="mgr">${ico('user', 'ico-sm')}${esc(m.name)}<span>${esc(m.login)}</span></div>`).join('') || '<div class="mgr muted">Менеджеров пока нет</div>'}
                <button class="btn btn-ghost" style="margin-top:8px;padding:0" onclick="openAccountEditor('Агентство', ${arg(a.name)})">${ico('plus')}Добавить менеджера</button>
            </div>`;
        }).join('')}</div>`;
    }
    const list = demo.commercial.filter(c => ui.commDeal === 'all' || c.deal === ui.commDeal);
    return `
        <div class="toolbar">${tabs}<span class="sp"></span><button class="btn btn-primary" onclick="openCommEditor()">${ico('plus')}Добавить объект</button></div>
        <div class="toolbar"><div class="chips">${[['all', 'Все'], ['Аренда', 'Аренда'], ['Продажа', 'Продажа']].map(([v, l]) => `<button class="chip${ui.commDeal === v ? ' on' : ''}" onclick="ui.commDeal='${v}';renderAll()">${l}</button>`).join('')}</div></div>
        <div class="list">
            <div class="lrow head cols-comm"><div>Объект</div><div>Тип</div><div>Сделка</div><div>Цена</div><div></div></div>
            ${list.map(c => {
                const i = demo.commercial.indexOf(c);
                return `
            <div class="lrow cols-comm">
                <div class="cell-main">${thumb(c.img)}<div style="min-width:0"><b>${esc(c.title)}</b><span>${esc(c.address)}</span></div></div>
                <div class="hide-m">${esc(c.kind)}</div>
                <div class="hide-m"><span class="badge b-deal">${esc(c.deal)}</span></div>
                <div class="price">${esc(c.price)}</div>
                <div class="cell-actions">
                    <button class="icon-btn" onclick="openCommEditor(${i})" aria-label="Изменить">${ico('edit')}</button>
                    <button class="icon-btn danger" onclick="if(confirm('Удалить объект?')){demo.commercial.splice(${i},1);renderAll()}" aria-label="Удалить">${ico('trash')}</button>
                </div>
            </div>`; }).join('')}
        </div>`;
};
function listingForm(c) {
    return `
        <div class="panel">
            <label class="field"><span>Заголовок</span><input id="e-title" class="input" value="${esc(c.title || '')}" placeholder="Офис, 45 м²"></label>
            <div class="row2">
                <label class="field"><span>Тип объекта</span><select id="e-kind" class="select">${['Офис', 'Склад', 'Торговая площадь', 'Производство', 'Свободного назначения', 'Квартира', 'Дом', 'Участок'].map(k => `<option${c.kind === k ? ' selected' : ''}>${k}</option>`).join('')}</select></label>
                <label class="field"><span>Сделка</span><select id="e-deal" class="select">${['Аренда', 'Продажа'].map(k => `<option${c.deal === k ? ' selected' : ''}>${k}</option>`).join('')}</select></label>
            </div>
            <div class="row3">
                <label class="field"><span>Площадь, м²</span><input id="e-area" class="input" value="${esc(c.area || '')}"></label>
                <label class="field"><span>Цена</span><input id="e-price" class="input" value="${esc(c.price || '')}" placeholder="45 000 ₽ / мес"></label>
                <label class="field"><span>Этаж</span><input class="input" placeholder="1"></label>
            </div>
            <label class="field"><span>Адрес или район</span><input id="e-addr" class="input" value="${esc(c.address || '')}"></label>
            <label class="field"><span>Фото (ссылка)</span><input id="e-img" class="input" value="${esc(c.img || '')}"></label>
            <label class="field" style="margin-bottom:0"><span>Описание</span><textarea class="textarea" rows="3"></textarea></label>
        </div>
        <div class="note">${ico('sliders')}<div>Тип, сделка, площадь и цена становятся фильтрами в каталоге недвижимости.</div></div>`;
}
function readListing(base) {
    return Object.assign({}, base, { title: $('e-title').value.trim(), kind: $('e-kind').value, deal: $('e-deal').value, area: $('e-area').value.trim(), price: $('e-price').value.trim(), address: $('e-addr').value.trim(), img: $('e-img').value.trim() });
}
function openCommEditor(i) {
    const c = i != null ? demo.commercial[i] : {};
    openEntry(i != null ? 'Коммерческий объект' : 'Новый коммерческий объект', listingForm(c), () => {
        const v = readListing(c); if (!v.title) return toast('Введите заголовок');
        if (i != null) demo.commercial[i] = v; else demo.commercial.unshift(v);
        return true;
    });
}
function openAgencyEditor(i) {
    const a = i != null ? demo.agencies[i] : { name: '', sub: '', img: '', managers: [] };
    openEntry(i != null ? a.name : 'Новое агентство', `
        <div class="panel">
            <label class="field"><span>Название агентства</span><input id="e-name" class="input" value="${esc(a.name)}"></label>
            <label class="field"><span>Чем занимается</span><input id="e-sub" class="input" value="${esc(a.sub)}"></label>
            <label class="field" style="margin-bottom:0"><span>Логотип или фото (ссылка)</span><input id="e-img" class="input" value="${esc(a.img)}"></label>
        </div>
        <div class="note">${ico('key')}<div>Логины менеджеров выдаются в разделе «Аккаунты» или кнопкой «Добавить менеджера» на карточке агентства.</div></div>`,
        () => {
            const v = Object.assign({}, a, { name: $('e-name').value.trim(), sub: $('e-sub').value.trim(), img: $('e-img').value.trim() });
            if (!v.name) return toast('Введите название');
            if (i != null) demo.agencies[i] = v; else demo.agencies.push(v);
            return true;
        });
}

// ---------- Аккаунты ----------
PAGES.accounts = function () {
    return `
        <div class="toolbar"><p class="lead" style="margin:0;flex:1">Входы для кабинетов магазинов и менеджеров агентств. Пароль приходит в SMS или на почту — вы его не видите.</p>
        <button class="btn btn-primary" onclick="openAccountEditor()">${ico('plus')}Выдать доступ</button></div>
        <div class="list">
            <div class="lrow head cols-accounts"><div>Кто</div><div>Роль</div><div>Логин</div><div>Статус</div><div></div></div>
            ${demo.accounts.map((a, i) => `
            <div class="lrow cols-accounts">
                <div class="cell-main"><div class="avatar">${esc(a.person.slice(0, 1))}</div><div style="min-width:0"><b>${esc(a.person)}</b><span>${esc(a.name)}</span></div></div>
                <div class="hide-m"><span class="badge ${a.role === 'Магазин' ? 'b-info' : 'b-off'}">${esc(a.role)}</span></div>
                <div class="hide-m num">${esc(a.login)}</div>
                <div><label class="switch" title="${a.active ? 'Доступ открыт' : 'Доступ закрыт'}"><input type="checkbox"${a.active ? ' checked' : ''} onchange="demo.accounts[${i}].active=this.checked;toast(this.checked?'Доступ открыт':'Доступ закрыт')"><i></i></label></div>
                <div class="cell-actions">
                    <button class="icon-btn" onclick="toast('Новый временный пароль отправлен')" aria-label="Сбросить пароль">${ico('key')}</button>
                    <button class="icon-btn danger" onclick="if(confirm('Удалить доступ?')){demo.accounts.splice(${i},1);renderAll()}" aria-label="Удалить">${ico('trash')}</button>
                </div>
            </div>`).join('')}
        </div>`;
};
function openAccountEditor(role, org) {
    const orgs = r => r === 'Агентство' ? demo.agencies.map(a => a.name) : Object.keys(shopsProfileDb);
    const r0 = role || 'Магазин';
    openEntry('Выдать доступ', `
        <div class="panel">
            <label class="field"><span>Роль</span><select id="e-role" class="select" onchange="document.getElementById('e-org').innerHTML=(this.value==='Агентство'?${arg(demo.agencies.map(a => a.name))}:${arg(Object.keys(shopsProfileDb))}).map(n=>'<option>'+n+'</option>').join('')">${['Магазин', 'Агентство'].map(r => `<option${r === r0 ? ' selected' : ''}>${r}</option>`).join('')}</select></label>
            <label class="field"><span>Организация</span><select id="e-org" class="select">${orgs(r0).map(n => `<option${n === org ? ' selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
            <label class="field"><span>Имя сотрудника</span><input id="e-person" class="input"></label>
            <label class="field" style="margin-bottom:0"><span>Телефон или e-mail для входа</span><input id="e-login" class="input" placeholder="+7 … или name@…"></label>
        </div>
        <div class="note">${ico('info')}<div>Сотрудник получит временный пароль и сменит его при первом входе.</div></div>`,
        () => {
            const v = { role: $('e-role').value, name: $('e-org').value, person: $('e-person').value.trim(), login: $('e-login').value.trim(), active: true };
            if (!v.person || !v.login) return toast('Заполните имя и логин');
            demo.accounts.unshift(v);
            if (v.role === 'Агентство') { const a = demo.agencies.find(x => x.name === v.name); if (a) a.managers.push({ name: v.person, login: v.login }); }
            setTimeout(() => toast('Доступ создан — пароль отправлен на ' + v.login), 50);
            return true;
        });
}

// ---------- Универсальная панель ----------
let entrySave = null;
function openEntry(title, html, onSave) {
    $('entry-title').textContent = title;
    $('entry-body').innerHTML = html;
    entrySave = onSave;
    $('entry-save').onclick = () => { if (entrySave && entrySave() === true) { closeOverlay('entry-modal'); renderAll(); } };
    openOverlay('entry-modal');
}

// ==========================================================
//  КАБИНЕТ МАГАЗИНА
// ==========================================================
function blankBatchRow() { return { title: '', price: '', category: '', sku: '', image: '', desc: '' }; }

PAGES['s-home'] = function () {
    const s = shopsProfileDb[ui.myStore] || {};
    const mine = Object.values(productsDb).filter(p => p.store === ui.myStore);
    const n = st => mine.filter(p => p.status === st).length;
    const rejected = n('rejected');
    return `
        <div class="toolbar">
            <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--ink-3)">Демо: войти как
                <select class="select" style="width:auto;min-width:200px" onchange="ui.myStore=this.value;ui.batch=[blankBatchRow()];renderAll()">${Object.keys(shopsProfileDb).map(k => `<option${k === ui.myStore ? ' selected' : ''}>${esc(k)}</option>`).join('')}</select>
            </label>
        </div>
        <div class="dash">
            <div class="card" style="overflow:hidden">
                <div style="height:160px;background:var(--sunk)">${s.banner ? `<img src="${esc(s.banner)}" alt="" style="width:100%;height:100%;object-fit:cover">` : ''}</div>
                <div class="card-pad">
                    <h3 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-.025em">${esc(ui.myStore)}</h3>
                    <p class="muted" style="margin:4px 0 16px">${esc(s.address || '')}</p>
                    <div class="sumrows flat">
                        <div><b>${n('published')}</b><span>в каталоге</span><button class="btn btn-ghost btn-sm" onclick="go('s-products')">Смотреть</button></div>
                        <div><b>${n('pending')}</b><span>на проверке у администратора</span></div>
                        <div${rejected ? ' class="warn"' : ''}><b>${rejected}</b><span>${rejected ? 'отклонены — нужно исправить' : 'отклонено'}</span>${rejected ? `<button class="btn btn-ghost btn-sm" onclick="go('s-products')">Исправить</button>` : ''}</div>
                    </div>
                </div>
            </div>
            <div style="display:grid;gap:16px">
                <div class="card">
                    <div class="card-head"><h3>Что сделать</h3></div>
                    <div class="quick">
                        <button onclick="go('s-add')">${ico('plus')}<b>Добавить товары</b><span>До 5 за раз</span></button>
                        <button onclick="go('s-stories');openStoryEditor()">${ico('play')}<b>Предложить сторис</b><span>Живёт 24 часа</span></button>
                    </div>
                </div>
                <div class="note">${ico('info')}<div>Адреса, менеджеров, режим работы и фильтры витрины настраивает администратор. Нужно что-то изменить — напишите ему.</div></div>
            </div>
        </div>`;
};

PAGES['s-add'] = function () {
    const rows = ui.batch.map((r, i) => `
        <div class="batch-row">
            <div class="batch-photo">${r.image ? `<img src="${esc(r.image)}" alt="">` : ico('camera')}</div>
            <div>
                <div class="batch-num"><span>Товар ${i + 1} из ${ui.batch.length}</span>${ui.batch.length > 1 ? `<button class="btn btn-ghost btn-sm" style="height:24px" onclick="ui.batch.splice(${i},1);renderAll()">Убрать</button>` : ''}</div>
                <div class="batch-fields">
                    <label class="field"><span>Название</span><input class="input" value="${esc(r.title)}" oninput="ui.batch[${i}].title=this.value"></label>
                    <label class="field"><span>Цена, ₽</span><input class="input" value="${esc(r.price)}" oninput="ui.batch[${i}].price=this.value"></label>
                    <label class="field"><span>Артикул</span><input class="input" value="${esc(r.sku)}" oninput="ui.batch[${i}].sku=this.value"></label>
                    <label class="field"><span>Категория</span><select class="select" onchange="ui.batch[${i}].category=this.value"><option value="">Выберите</option>${CATEGORIES.map(c => `<option${r.category === c ? ' selected' : ''}>${c}</option>`).join('')}</select></label>
                    <label class="field" style="grid-column:span 2"><span>Фото (ссылка)</span><input class="input" placeholder="https://…" value="${esc(r.image)}" onchange="ui.batch[${i}].image=this.value;renderAll()"></label>
                    <label class="field wide"><span>Коротко о товаре</span><input class="input" placeholder="Размер, материал, цвет" value="${esc(r.desc)}" oninput="ui.batch[${i}].desc=this.value"></label>
                </div>
                ${r.reason ? `<div class="reason">Причина отклонения: ${esc(r.reason)}</div>` : ''}
            </div>
        </div>`).join('');
    return `
        <div class="card card-pad">
            ${rows}
            <div class="wizard-foot" style="margin-top:8px">
                ${ui.batch.length < 5 ? `<button class="btn btn-secondary" onclick="ui.batch.push(blankBatchRow());renderAll()">${ico('plus')}Ещё товар</button>` : '<span class="muted">Максимум 5 товаров за раз</span>'}
                <span class="sp"></span>
                <button class="btn btn-primary btn-lg" onclick="submitBatch()">Отправить на проверку · ${ui.batch.length}</button>
            </div>
        </div>
        <div class="note" style="margin-top:12px">${ico('shield')}<div>Перед публикацией товар проверяет администратор: фото, цена, категория и соответствие правилам. Обычно в течение дня.</div></div>`;
};
function submitBatch() {
    const filled = ui.batch.filter(r => r.title.trim());
    if (!filled.length) { toast('Заполните хотя бы название'); return; }
    filled.forEach((r, i) => {
        const id = r.id || 'p' + Date.now() + i;
        productsDb[id] = { id, title: r.title.trim(), price: r.price.trim() ? r.price.trim().replace(/\s*₽?$/, '') + ' ₽' : '', sku: r.sku.trim(), category: r.category, image: r.image.trim(), desc: r.desc.trim(), store: ui.myStore, status: 'pending' };
    });
    DB_save();
    ui.batch = [blankBatchRow()];
    ui.page = 's-products';
    renderAll();
    toast(filled.length + ' ' + plural(filled.length, 'товар отправлен', 'товара отправлены', 'товаров отправлены') + ' на проверку');
}
function fixRejected(id) {
    const p = productsDb[id]; if (!p) return;
    ui.batch = [{ id, title: p.title || '', price: (p.price || '').replace(/\s*₽$/, ''), category: p.category || '', sku: p.sku || '', image: p.image || '', desc: p.desc || '', reason: p.rejectReason || '' }];
    go('s-add');
}
PAGES['s-products'] = function () {
    const mine = Object.values(productsDb).filter(p => p.store === ui.myStore);
    TITLES['s-products'][1] = ui.myStore;
    return `
        <div class="toolbar"><span class="sp"></span><button class="btn btn-primary" onclick="go('s-add')">${ico('plus')}Добавить товары</button></div>
        <div class="list">${mine.length ? `<div class="lrow head cols-products"><div>Товар</div><div>Категория</div><div>Цена</div><div>Статус</div><div></div></div>` + mine.map(p => `
            <div class="lrow cols-products">
                <div class="cell-main">${thumb(p.image)}<div style="min-width:0"><b>${esc(p.title)}</b><span>${p.status === 'rejected' && p.rejectReason ? `<span style="color:var(--sale)">${esc(p.rejectReason)}</span>` : (p.sku ? 'Арт. ' + esc(p.sku) : '')}</span></div></div>
                <div class="hide-m">${esc(p.category || '—')}</div>
                <div class="price">${esc(p.price || '—')}</div>
                <div>${statusBadge(p)}</div>
                <div class="cell-actions">${p.status === 'rejected' ? `<button class="btn btn-sm btn-secondary" onclick="fixRejected(${arg(p.id)})">Исправить</button>` : ''}</div>
            </div>`).join('') : '<div class="empty"><b>Товаров пока нет</b>Добавьте первые — до 5 за раз</div>'}</div>`;
};
PAGES['s-stories'] = function () {
    const mine = storiesData.filter(s => s.owner === ui.myStore || s.name === ui.myStore);
    return `
        <div class="toolbar"><span class="sp"></span><button class="btn btn-primary" onclick="openStoryEditor()">${ico('plus')}Предложить сторис</button></div>
        <div class="list">${storyRows(mine)}</div>`;
};

// ==========================================================
//  КАБИНЕТ АГЕНТСТВА
// ==========================================================
PAGES['a-home'] = function () {
    const mine = demo.listings.filter(l => l.agency === ui.myAgency);
    TITLES['a-home'][1] = ui.myAgency;
    const badge = l => l.status === 'pending' ? '<span class="badge b-wait">На проверке</span>' : l.status === 'rejected' ? '<span class="badge b-bad">Отклонён</span>' : '<span class="badge b-ok">В приложении</span>';
    return `
        <div class="toolbar">
            <label style="display:flex;align-items:center;gap:10px;font-size:13.5px;color:var(--ink-3)">Демо: войти как
                <select class="select" style="width:auto;min-width:180px" onchange="ui.myAgency=this.value;renderAll()">${demo.agencies.map(a => `<option${a.name === ui.myAgency ? ' selected' : ''}>${esc(a.name)}</option>`).join('')}</select>
            </label>
            <span class="sp"></span><button class="btn btn-primary" onclick="go('a-add')">${ico('plus')}Добавить объект</button>
        </div>
        <div class="list">${mine.length ? `<div class="lrow head cols-comm"><div>Объект</div><div>Тип</div><div>Сделка</div><div>Цена</div><div>Статус</div></div>` + mine.map(l => `
            <div class="lrow cols-comm">
                <div class="cell-main">${thumb(l.img)}<div style="min-width:0"><b>${esc(l.title)}</b><span>${l.status === 'rejected' && l.reason ? `<span style="color:var(--sale)">${esc(l.reason)}</span>` : esc(l.address)}</span></div></div>
                <div class="hide-m">${esc(l.type || l.kind || '')}</div>
                <div class="hide-m">${esc(l.deal)}</div>
                <div class="price">${esc(l.price)}</div>
                <div>${badge(l)}</div>
            </div>`).join('') : '<div class="empty"><b>Объектов пока нет</b></div>'}</div>`;
};
PAGES['a-add'] = function () {
    return `${listingForm({ kind: 'Квартира', deal: 'Продажа' })}
        <div class="wizard-foot"><span class="sp"></span><button class="btn btn-primary btn-lg" onclick="submitListing()">Отправить на проверку</button></div>`;
};
function submitListing() {
    const v = readListing({});
    if (!v.title) { toast('Введите заголовок'); return; }
    demo.listings.unshift({ id: 'l' + Date.now(), agency: ui.myAgency, title: v.title, price: v.price, type: v.kind, deal: v.deal, address: v.address, img: v.img, status: 'pending' });
    go('a-home');
    toast('Объект отправлен на проверку');
}

// ---------- Запуск ----------
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    ['entry-modal', 'reject-modal', 'prod-modal', 'shop-modal', 'banner-modal', 'story-modal'].forEach(id => { if (!$(id).classList.contains('hidden')) closeOverlay(id); });
});
/* старт после загрузки каталога: его поднимает модуль src/admin/main.ts (модули выполняются до DOMContentLoaded) */
document.addEventListener('DOMContentLoaded', function () {
    // демо: у лайфхака из стартовых данных указываем автора
    storiesData.forEach(s => { if (s.isLifehack && !s.author) s.author = '@remont_lifehacks'; });
    renderAll();
});
