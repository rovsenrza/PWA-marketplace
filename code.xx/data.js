// ==========================================================
//  ОБЩАЯ БАЗА ДАННЫХ (data.js)
//  Подключается ко всем 3 приложениям: app / admin / shop
// ==========================================================

// ---------- НАЧАЛЬНЫЕ ДАННЫЕ (по умолчанию) ----------
const DEFAULT_PRODUCTS = {
    'prod-1': { id: 'prod-1', title: 'Кухня "KT-01"', price: '189 000 ₽', sku: 'KT-01', store: 'Кухни Дриада', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400', status: 'published', category: 'кухня' },
    'prod-2': { id: 'prod-2', title: 'Кровать "Samanta"', price: '57 240 ₽', sku: 'AD-SAM', store: 'Любимый Дом', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400', status: 'published', category: 'спальня' },
    'prod-4': { id: 'prod-4', title: 'Цемент М500 (50 кг)', price: '450 ₽', sku: 'PS-CEM', store: 'Постройка', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400', status: 'published', category: 'стройматериалы' },
    'prod-7': { id: 'prod-7', title: 'Диван "Комфорт"', price: '48 900 ₽', sku: 'NV-SOF', store: 'Новоселье', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', status: 'published', category: 'гостиная' },
    'prod-8': { id: 'prod-8', title: 'Кухня "Модерн"', price: '215 000 ₽', sku: 'KD-MOD', store: 'Кухни Дриада', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400', status: 'published', category: 'кухня' },
    'prod-10': { id: 'prod-10', title: 'Шкаф-купе "Уют"', price: '34 200 ₽', sku: 'LD-SHK', store: 'Любимый Дом', image: 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=400', status: 'published', category: 'спальня' }
};

const DEFAULT_SHOPS = {
    'Любимый Дом': { name: 'Любимый Дом', status: 'published', banner: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', description: 'Уютная мебель для дома.', address: 'МЦ «Гранд Интерьер»', site: 'https://lubimydom.ru', telegram: 'https://t.me/lubimydom', video: '', gallery: [] },
    'Кухни Дриада': { name: 'Кухни Дриада', status: 'published', banner: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', description: 'Премиальные кухни.', address: 'ТЦ «Центральный»', site: 'https://driada.ru', telegram: 'https://t.me/driada', video: '', gallery: [] },
    'Постройка': { name: 'Постройка', status: 'published', banner: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600', description: 'Стройматериалы.', address: 'ул. Строительная, 10', site: 'https://postroyka.ru', telegram: 'https://t.me/postroyka', video: '', gallery: [] },
    'Новоселье': { name: 'Новоселье', status: 'published', banner: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', description: 'Мебель с доставкой.', address: 'ТЦ «Новоселье»', site: 'https://novoselie.ru', telegram: 'https://t.me/novoselie', video: '', gallery: [] }
};

const DEFAULT_STORIES = [
    { id: 'lifehack', name: 'Лайфхак', isLifehack: true, status: 'published', slides: ['https://i.pinimg.com/736x/37/50/46/375046b8fed8a025d71bab0a3193fb3b.jpg', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400'], createdAt: Date.now() },
    { id: 'lubimiy', name: 'Любимый Дом', status: 'published', slides: ['https://i.pinimg.com/736x/3d/d8/96/3dd8964ef4a9bfbbd582d8e46734e3c0.jpg', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=400'], createdAt: Date.now() }
];

const DEFAULT_PROMO = [
    { title: 'Товары для праздника', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600' },
    { title: 'Дизайн-проекты кухонь', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600' },
    { title: 'Элитные спальни', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600' }
];

// ---------- ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ----------
let productsDb = {};
let shopsProfileDb = {};
let storiesData = [];
let promoData = [];

// ---------- ЗАГРУЗКА из localStorage (или дефолт) ----------
function DB_load() {
    productsDb    = JSON.parse(localStorage.getItem('meb_products')) || JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    shopsProfileDb= JSON.parse(localStorage.getItem('meb_shops'))    || JSON.parse(JSON.stringify(DEFAULT_SHOPS));
    storiesData   = JSON.parse(localStorage.getItem('meb_stories'))  || JSON.parse(JSON.stringify(DEFAULT_STORIES));
    promoData     = JSON.parse(localStorage.getItem('meb_promo'))    || JSON.parse(JSON.stringify(DEFAULT_PROMO));
}

// ---------- СОХРАНЕНИЕ в localStorage ----------
function DB_save() {
    localStorage.setItem('meb_products', JSON.stringify(productsDb));
    localStorage.setItem('meb_shops',    JSON.stringify(shopsProfileDb));
    localStorage.setItem('meb_stories',  JSON.stringify(storiesData));
    localStorage.setItem('meb_promo',    JSON.stringify(promoData));
    // Сигнал другим вкладкам: "данные изменились!"
    localStorage.setItem('meb_updated', Date.now().toString());
}

// ---------- АВТООБНОВЛЕНИЕ между вкладками ----------
// Когда в другой вкладке вызвали DB_save() — эта вкладка перезагрузит данные
window.addEventListener('storage', function(e) {
    if (e.key === 'meb_updated') {
        DB_load();
        if (typeof onDataUpdated === 'function') {
            onDataUpdated(); // каждое приложение опишет свою функцию перерисовки
        }
    }
});

// Сразу загружаем при подключении файла
DB_load();