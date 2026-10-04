/* Сохранение и загрузка.
   Сохранение и загрузка — src/app/data/catalog.ts (CatalogStore). Здесь — хуки после загрузки:
   локальные баннеры магазинов-партнёров и промо на главной.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


         // ========== СОХРАНЕНИЕ И ЗАГРУЗКА ДАННЫХ (localStorage) ==========
function applyShopLocalBanners() {
    if (typeof SHOP_B === 'undefined') return;
    const bind = [
        ['Любимый Дом', 'ld'],
        ['Кухни Дриада', 'driada'],
        ['Мебельная фабрика ТриЯ', 'triya'],
        ['Постройка', 'postroyka'],
        ['Стройландия', 'stroylandiya'],
        ['Новоселье', 'novoselie'],
        ['ЛеГо', 'lego']
    ];
    /* фирменный баннер и его оформление — если у магазина пусто или стоит фирменный же;
       свой баннер, загруженный в редакторе, больше не затирается */
    bind.forEach(([name, key]) => {
        const shop = shopsProfileDb[name];
        const src = SHOP_B[key];
        if (!shop || !src || (shop.banner && shop.banner !== src)) return;
        shop.banner = src;
        if (key === 'stroylandiya') shop.bannerFit = 'contain';
        if (Array.isArray(shop.gallery) && shop.gallery.length) shop.gallery[0] = src;
        else shop.gallery = [src];
    });
}


        


// Применяем сохранённый баннер на главную (один большой баннер)
function applyPromoToHome() {
    if (!promoData || !promoData[0]) return;
    const img = document.getElementById('promo-main-img');
    const title = document.getElementById('promo-main-title');
    if (img && promoData[0].image) img.src = promoData[0].image;
    if (title && promoData[0].title) title.innerText = promoData[0].title;
}
