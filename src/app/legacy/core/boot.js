/* Запуск ядра приложения: всё, что выполняется при загрузке, в исходном порядке —
   состояние с вычисляемой инициализацией, обработчики событий, запуск по DOMContentLoaded.
   Подключается после файлов доменов. */

/* lifehackCategories: данные в CatalogStore (src/shared/data/catalog-store.ts); здесь — аксессор на window */


/* Запуск приложения — по готовности DOM, а не по window.onload: onload ждёт ВСЕ картинки
   (включая медленные внешние фото), и до тех пор приложение показывало стартовые данные
   без сохранённой корзины и избранного. Модули (src/app/main.ts) к этому моменту уже выполнены. */
document.addEventListener('DOMContentLoaded', function () {
    loadAllData();
    if (typeof loadLhEngageState === 'function') loadLhEngageState();
    if (typeof hydrateLifehacksEngage === 'function') hydrateLifehacksEngage();
    if (typeof productsDb !== 'undefined') window.productsDb = productsDb;
    if (typeof lifehacksDb !== 'undefined') window.lifehacksDb = lifehacksDb;
    cleanOldStories();
    loadBuyerProfile();
    loadFavorites();
    loadCart();
    loadMarketplace();
    expireExpiredStoreOrders();
    updateCartBadge();
    renderCart();
    renderProductGrid();
    renderDirectorySubviews();
    renderStories();
    enableStoriesDragScroll();
    try { buildTopFilters(); } catch(e) {}
    try { renderOnboarding(); } catch(e) {}
    try { renderHomeShopPromo(); } catch(e) {}
});

/* storiesData: данные в CatalogStore (src/shared/data/catalog-store.ts); здесь — аксессор на window */


window.specCraftFilter = 'все';


window.lsPlot = 10;

window.otherCat = 'cleaning';


window.stState = { cat: 'все', quick: 'all', crew: false, today: false, favOnly: false, unit: 'shift', sort: 'pop', shifts: 1 };

window.stFavs = [];

window.stCurrent = null;

window.stPhotoI = 0;

window.stPhoneShown = false;

//---витрина магазина---//

// сохраняем текущий магазин витрины (для "Смотреть все")
window.currentCatalogShop = '';


// --- 1. ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ ФИЛЬТРА ---
window.shopActiveCategory = 'все';


// --- 6. ЗАКРЫТИЕ МЕНЮ ПРИ КЛИКЕ В ПУСТОЕ МЕСТО ---
document.addEventListener('click', function(event) {
    const wrapper = document.getElementById('shop-nav-wrapper');
    const dropdown = document.getElementById('main-filter-dropdown');
    const btn = document.getElementById('main-filter-btn');
    
    if (wrapper && !wrapper.contains(event.target)) {
        const container = document.getElementById('mega-panels-container');
        if (container) container.classList.add('hidden');
        document.querySelectorAll('.mega-panel').forEach(p => p.classList.add('hidden'));
    }
    
    if (dropdown && !dropdown.classList.contains('hidden')) {
        if (!dropdown.contains(event.target) && (!btn || !btn.contains(event.target))) {
            dropdown.classList.add('hidden');
        }
    }
});


// Закрываем меню, если пользователь кликнул мимо него (удобно для телефонов)
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('main-filter-dropdown');
    const btn = document.getElementById('main-filter-btn');
    if (dropdown && !dropdown.classList.contains('hidden')) {
        // Если клик был не по меню и не по самой кнопке открытия - закрываем
        if (!dropdown.contains(event.target) && (!btn || !btn.contains(event.target))) {
            dropdown.classList.add('hidden');
        }
    }
});

window.coRoom = 'Ванная';

window.coPortfolioCompany = '';


        // ============ СТРАНИЦА ТОВАРА ============
window.currentProductId = null;

window.commCompare = window.commCompare || [];


// Закрывать список при клике мимо него
document.addEventListener('click', function(e) {
    // Список категорий товара
    const btn = document.getElementById('cat-dropdown-btn');
    const list = document.getElementById('cat-dropdown-list');
    if (btn && list && !btn.contains(e.target) && !list.contains(e.target)) {
        list.classList.add('hidden');
    }
    // Список магазинов в форме сториса
    const sBtn = document.getElementById('story-shop-btn');
    const sList = document.getElementById('story-shop-list');
    if (sBtn && sList && !sBtn.contains(e.target) && !sList.contains(e.target)) {
        sList.classList.add('hidden');
    }
});
