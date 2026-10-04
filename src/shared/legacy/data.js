// ==========================================================
//  ОБЩАЯ БАЗА ДАННЫХ (data.js)
//  Подключается ко всем 3 приложениям: app / admin / shop
// ==========================================================

// ---------- НАЧАЛЬНЫЕ ДАННЫЕ: общий seed (src/shared/legacy/seed.js) ----------
const DEFAULT_PRODUCTS = SEED.products();

const DEFAULT_SHOPS = SEED.shops();

const DEFAULT_STORIES = SEED.stories();

const DEFAULT_PROMO = SEED.promo();

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