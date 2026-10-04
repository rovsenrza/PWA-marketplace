/* Сохранение и загрузка.
   saveAllData / loadAllData поверх SEED, локальные баннеры магазинов, промо на главной.
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
    bind.forEach(([name, key]) => {
        const shop = shopsProfileDb[name];
        const src = SHOP_B[key];
        if (!shop || !src) return;
        shop.banner = src;
        if (key === 'stroylandiya') shop.bannerFit = 'contain';
        if (Array.isArray(shop.gallery) && shop.gallery.length) shop.gallery[0] = src;
        else shop.gallery = [src];
    });
}

function shopsProfileForStorage() {
    const out = {};
    for (const name in shopsProfileDb) {
        const s = Object.assign({}, shopsProfileDb[name]);
        if (typeof s.banner === 'string' && s.banner.indexOf('data:') === 0) s.banner = '';
        if (Array.isArray(s.gallery)) s.gallery = s.gallery.filter(function(x) { return typeof x !== 'string' || x.indexOf('data:') !== 0; });
        out[name] = s;
    }
    return out;
}

function saveAllData() {
    try {
        localStorage.setItem('meb_products', JSON.stringify(productsDb));
        localStorage.setItem('meb_shops', JSON.stringify(shopsProfileForStorage()));
        localStorage.setItem('meb_directory', JSON.stringify(directoryDb));
        localStorage.setItem('meb_stories', JSON.stringify(storiesData));
        localStorage.setItem('meb_vacancies', JSON.stringify(vacanciesDb));
        localStorage.setItem('meb_promo', JSON.stringify(promoData));
        localStorage.setItem('meb_onboarding', JSON.stringify(onboardingData));
        localStorage.setItem('meb_showcases', JSON.stringify(showcaseModerationDb));
        localStorage.setItem('meb_lifehacks', JSON.stringify({ categories: lifehackCategories, items: lifehacksDb }));
        localStorage.setItem('meb_lifehack_saved', JSON.stringify(lifehackSavedIds));
    } catch (e) {
        console.warn('Ошибка сохранения:', e);
        // Если память переполнена (обычно из-за тяжёлого видео)
        if (e.name === 'QuotaExceededError' || (e.message && e.message.toLowerCase().includes('quota'))) {
            showSmsToast(' Видео слишком большое для сохранения. Попробуйте файл поменьше.');
        }
    }
}


        function loadAllData() {
            try {
                const p = localStorage.getItem('meb_products');
if (p) {
    const d = JSON.parse(p);
    // Обновляем существующие товары, СОХРАНЯЯ описание и images из кода
    for (const k in d) {
        if (productsDb[k]) {
            // товар есть в коде — берём из localStorage только статус, цену, название
            productsDb[k].status = d[k].status;
            productsDb[k].title = d[k].title;
            productsDb[k].price = d[k].price;
            productsDb[k].store = d[k].store;
            productsDb[k].image = d[k].image;
            productsDb[k].category = d[k].category;
            // description, images, oldPrice, badge НЕ трогаем — оставляем из кода
        } else {
            // новый товар (создан магазином) — добавляем целиком
            productsDb[k] = d[k];
        }
    }
}
                const s = localStorage.getItem('meb_shops');
                if (s) { const d = JSON.parse(s); Object.assign(shopsProfileDb, d); }
                applyShopLocalBanners();

                const dir = localStorage.getItem('meb_directory');
                if (dir) {
                    const d = JSON.parse(dir);
                    if (Array.isArray(d.specialists)) {
                        const byId = {};
                        d.specialists.forEach(function (s) { if (s && s.id) byId[s.id] = s; });
                        directoryDb.specialists.forEach(function (s) {
                            if (!s || !s.id) return;
                            if (!byId[s.id]) {
                                d.specialists.push(s);
                                byId[s.id] = s;
                            } else if (!byId[s.id].craft && s.craft) {
                                byId[s.id].craft = s.craft;
                            }
                        });
                        directoryDb.specialists = d.specialists;
                    }
                }

                const st = localStorage.getItem('meb_stories');
                if (st) {
                    const parsed = JSON.parse(st);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        storiesData = parsed;
                    }
                }

                const v = localStorage.getItem('meb_vacancies');
                if (v) { vacanciesDb = JSON.parse(v); }

                const pr = localStorage.getItem('meb_promo');
                if (pr) { promoData = JSON.parse(pr); applyPromoToHome(); }

                const onb = localStorage.getItem('meb_onboarding');
                if (onb) {
                    const parsed = JSON.parse(onb);
                    if (Array.isArray(parsed) && parsed.length > 0) onboardingData = parsed;
                }

                const lh = localStorage.getItem('meb_lifehacks');
                if (lh) {
                    const parsed = JSON.parse(lh);
                    if (Array.isArray(parsed) && parsed.length) {
                        lifehacksDb = parsed;
                    } else if (parsed && Array.isArray(parsed.items)) {
                        lifehacksDb = parsed.items;
                        if (Array.isArray(parsed.categories) && parsed.categories.length) {
                            lifehackCategories = parsed.categories.slice();
                            DEFAULT_LIFEHACK_CATEGORIES.forEach(function (c) {
                                if (lifehackCategories.indexOf(c) < 0) lifehackCategories.push(c);
                            });
                        }
                    }
                }
                try {
                    const savedLh = localStorage.getItem('meb_lifehack_saved');
                    if (savedLh) lifehackSavedIds = JSON.parse(savedLh) || [];
                } catch (e2) {}
                if (typeof loadLhEngageState === 'function') loadLhEngageState();
                if (typeof hydrateLifehacksEngage === 'function') hydrateLifehacksEngage();

                const sc = localStorage.getItem('meb_showcases');
                if (sc) {
                    const parsed = JSON.parse(sc);
                    if (Array.isArray(parsed)) showcaseModerationDb = parsed;
                }
            } catch (e) {
                console.warn('Ошибка загрузки:', e);
            }
        }


// Применяем сохранённый баннер на главную (один большой баннер)
function applyPromoToHome() {
    if (!promoData || !promoData[0]) return;
    const img = document.getElementById('promo-main-img');
    const title = document.getElementById('promo-main-title');
    if (img && promoData[0].image) img.src = promoData[0].image;
    if (title && promoData[0].title) title.innerText = promoData[0].title;
}
