/* Витрины магазинов.
   Карточка магазина, персонал, промо на главной, мега-меню и категории витрины.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


function shopHash(str) {
    let h = 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

function shopDomain(s) {
    return String((s && s.site) || 'shop.ru').replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'shop.ru';
}

function shopTelHref(phone) {
    return 'tel:' + String(phone || '').replace(/[^\d+]/g, '');
}

function shopStaffFor(s) {
    if (s && Array.isArray(s.staff) && s.staff.length) return s.staff;
    const h = shopHash(s && s.name);
    const managers = ['Анна Волкова', 'Мария Соколова', 'Екатерина Лебедева'];
    const accs = ['Сергей Морозов', 'Игорь Павлов', 'Андрей Кузнецов'];
    const hrs = ['Елена Кравцова', 'Ольга Новикова', 'Татьяна Белова'];
    const photosM = [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
    ];
    const photosA = [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400'
    ];
    const photosH = [
        'https://images.unsplash.com/photo-1594744803329-e58b31de8bf1?w=400',
        'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'
    ];
    const i = h % 3;
    const base = 120 + (h % 780);
    const d = shopDomain(s);
    const fmt = function (n) {
        const x = String(10000000 + n).slice(-7);
        return '+7 (904) ' + x.slice(0, 3) + '-' + x.slice(3, 5) + '-' + x.slice(5);
    };
    return [
        { role: 'менеджер', cta: 'Связаться с менеджером', name: managers[i], phone: fmt(base), email: 'manager@' + d, photo: photosM[i] },
        { role: 'бухгалтерия', cta: 'Связаться с бухгалтерией', name: accs[i], phone: fmt(base + 11), email: 'buh@' + d, photo: photosA[i] },
        { role: 'отдел кадров', cta: 'Связаться с отделом кадров', name: hrs[i], phone: fmt(base + 23), email: 'hr@' + d, photo: photosH[i] }
    ];
}

function shopContactDept(role, phone) {
    if (phone) {
        try { window.location.href = shopTelHref(phone); } catch (e) {}
    }
    if (typeof showSmsToast === 'function') showSmsToast('Соединяем: ' + role);
}

function shopRequestService(label) {
    if (typeof showSmsToast === 'function') showSmsToast('Заявка: «' + label + '». Перезвоним в рабочее время.');
}

function fillShopCatalogExtras(s) {
    const list = document.getElementById('shop-staff-list');
    const extras = document.getElementById('shop-catalog-extras');
    if (!s) return;
    const staff = shopStaffFor(s);
    if (list) {
        list.innerHTML = staff.map(function (p) {
            const photo = p.photo || '';
            return '<div class="shop-person">' +
                '<img src="' + photo + '" alt="" class="shop-person-photo" onclick="openAvatarModal(\'' + photo + '\')">' +
                '<div class="shop-person-body">' +
                '<button type="button" class="shop-person-cta" onclick="shopContactDept(\'' + p.role + '\', \'' + p.phone + '\')">' + p.cta + '</button>' +
                '<p class="shop-person-name">' + escHtml(p.name) + '</p>' +
                '<a class="shop-person-link" href="' + shopTelHref(p.phone) + '"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>' + p.phone + '</a>' +
                '<a class="shop-person-link" href="mailto:' + p.email + '"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>' + p.email + '</a>' +
                '</div>' +
                '</div>';
        }).join('');
    }
    if (!extras) return;
    const cat = String(s.category || '').toLowerCase();
    let perks;
    if (cat.indexOf('строй') !== -1 || cat.indexOf('отдел') !== -1) {
        perks = [
            { t: 'Доставка', d: 'По городу', k: 'Доставка материалов' },
            { t: 'Погрузка', d: 'На складе', k: 'Погрузка на складе' },
            { t: 'Опт', d: 'Для объекта', k: 'Оптовый расчёт' }
        ];
    } else {
        perks = [
            { t: 'Замер', d: 'Бесплатно', k: 'Выезд замерщика' },
            { t: 'Доставка', d: '1–2 дня', k: 'Доставка заказа' },
            { t: 'Сборка', d: 'Мастером', k: 'Сборка на месте' }
        ];
    }
    let perkTitle = 'Услуги салона';
    let hoursLeftL = 'Пн–Сб';
    let hoursLeftV = '10:00–20:00';
    let hoursRightL = 'Воскресенье';
    let hoursRightV = '10:00–18:00';
    let hoursNote = 'Самовывоз в рабочее время · консультация без записи';
    let howTitle = 'Как оформить';
    let howSteps = [
        'Выберите товар на витрине или оставьте заявку менеджеру',
        'Подтвердим наличие, срок и счёт — в рабочий день',
        'Доставка или самовывоз, документы и гарантия'
    ];
    extras.innerHTML =
        '<div class="bg-white rounded-2xl border border-[#d7e6f2] p-3.5 shadow-[0_8px_24px_rgba(30,96,145,0.08)]">' +
            '<p class="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1e6091]">Режим работы</p>' +
            '<div class="mt-2.5 grid grid-cols-2 gap-2">' +
                '<div class="rounded-xl bg-[#f7fbfe] border border-[#e8f1f8] px-3 py-2.5"><p class="text-[10px] text-slate-400 font-semibold">' + hoursLeftL + '</p><p class="text-[13px] font-extrabold text-slate-800 mt-0.5">' + hoursLeftV + '</p></div>' +
                '<div class="rounded-xl bg-[#f7fbfe] border border-[#e8f1f8] px-3 py-2.5"><p class="text-[10px] text-slate-400 font-semibold">' + hoursRightL + '</p><p class="text-[13px] font-extrabold text-slate-800 mt-0.5">' + hoursRightV + '</p></div>' +
            '</div>' +
            '<p class="text-[11px] text-slate-500 mt-2.5">' + hoursNote + '</p>' +
        '</div>' +
        '<div>' +
            '<p class="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1e6091] mb-2">' + perkTitle + '</p>' +
            '<div class="grid grid-cols-3 gap-2">' +
                perks.map(function (p) {
                    return '<button type="button" class="shop-perk" onclick="shopRequestService(\'' + p.k + '\')"><p class="text-[13px] font-extrabold text-[#1e6091]">' + p.t + '</p><p class="text-[10px] text-slate-400 font-semibold mt-0.5">' + p.d + '</p></button>';
                }).join('') +
            '</div>' +
        '</div>' +
        '<div>' +
            '<p class="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1e6091] mb-2">' + howTitle + '</p>' +
            '<div class="bg-white rounded-2xl border border-[#d7e6f2] overflow-hidden">' +
                howSteps.map(function (step, i) {
                    const line = i < howSteps.length - 1 ? ' border-b border-[#e8f1f8]' : '';
                    return '<div class="px-3.5 py-2.5' + line + ' flex gap-3"><span class="w-6 h-6 rounded-full bg-[#1e6091] text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">' + (i + 1) + '</span><p class="text-[12px] font-semibold text-slate-700 leading-snug">' + step + '</p></div>';
                }).join('') +
            '</div>' +
        '</div>' +
        '<button type="button" onclick="shopRequestService(\'Обратный звонок\')" class="w-full bg-[#1e6091] hover:bg-[#16324a] shadow-[0_10px_22px_rgba(30,96,145,0.28)] text-white font-bold text-[13px] py-3 rounded-2xl active:scale-[0.99] transition-transform">Заказать обратный звонок</button>';
}


function openShopCatalogModal(storeName) {
    const s = shopsProfileDb[storeName];
    if (!s) return;
    if (s.kind === 'landscape') {
        openLandscapeStudio(storeName);
        return;
    }
    window.currentCatalogShop = storeName;

    document.getElementById('shop-catalog-title').innerText = s.name;
    const bannerEl = document.getElementById('shop-catalog-banner');
    bannerEl.src = s.banner;
    bannerEl.className = s.bannerFit === 'contain' ? 'w-full h-full object-contain bg-white' : 'w-full h-full object-cover';

    // Подзаголовок под названием (короткое описание)
    const sub = document.getElementById('shop-catalog-subtitle');
    if (sub) sub.innerText = s.description || '';

    document.getElementById('shop-catalog-desc').innerText = s.description;

    // Адрес (кликабельно -> Яндекс.Карты)
    document.getElementById('shop-catalog-addr').innerText = s.address || '—';
    const addrLink = document.getElementById('shop-catalog-addr-link');
    if (addrLink) addrLink.href = s.address ? 'https://yandex.ru/maps/?text=' + encodeURIComponent(s.address) : '#';

    // Сайт (кликабельно)
    document.getElementById('shop-catalog-site').innerText = (s.site || '#').replace('https://', '').replace('http://', '');
    const siteLink = document.getElementById('shop-catalog-site-link');
    if (siteLink) siteLink.href = s.site || '#';

    // Telegram
    document.getElementById('shop-catalog-tg').href = s.telegram || '#';

    // Фото "О компании" (до 3 квадратных)
    const aboutBox = document.getElementById('shop-catalog-about-imgs');
    if (aboutBox) {
        const aboutImgs = (s.aboutImages && s.aboutImages.length) ? s.aboutImages : ((s.gallery || []).filter(function (m) {
            return !(m.startsWith && m.startsWith('data:video')) && !(typeof isVideoUrl === 'function' && isVideoUrl(m));
        }).slice(0, 3));
        if (aboutImgs && aboutImgs.length > 0) {
            aboutBox.innerHTML = aboutImgs.map(function (img) {
                return '<div class="aspect-square rounded-xl overflow-hidden border bg-slate-100"><img src="' + img + '" onclick="openAvatarModal(\'' + img + '\')" class="w-full h-full object-cover cursor-pointer"></div>';
            }).join('');
            aboutBox.classList.remove('hidden');
        } else {
            aboutBox.innerHTML = '';
            aboutBox.classList.add('hidden');
        }
    }

    // Видео
    if (s.video) {
        document.getElementById('shop-catalog-video-container').classList.remove('hidden');
        document.getElementById('shop-catalog-video').src = s.video;
    } else {
        document.getElementById('shop-catalog-video-container').classList.add('hidden');
    }

    // Текст к блоку фото/видео
    const galTextEl = document.getElementById('shop-catalog-gallery-text');
    if (galTextEl) {
        if (s.galleryText) {
            galTextEl.innerText = s.galleryText;
            galTextEl.classList.remove('hidden');
        } else {
            galTextEl.classList.add('hidden');
        }
    }

    // Фото и видео (галерея)
    let galHtml = '';
    if (s.gallery && s.gallery.length > 0) {
        s.gallery.forEach(media => {
            const isVideo = (media.startsWith && media.startsWith('data:video')) || isVideoUrl(media);
            if (isVideo) {
                galHtml += `<video src="${media}" controls playsinline class="h-32 w-48 object-cover rounded-xl shrink-0 snap-center border bg-black"></video>`;
            } else {
                galHtml += `<img src="${media}" onclick="openAvatarModal('${media}')" class="h-32 w-48 object-cover rounded-xl shrink-0 cursor-pointer snap-center border">`;
            }
        });
        document.getElementById('shop-catalog-gallery-wrapper').classList.remove('hidden');
        document.getElementById('shop-catalog-gallery').innerHTML = galHtml;
    } else if (s.galleryText) {
        document.getElementById('shop-catalog-gallery-wrapper').classList.remove('hidden');
        document.getElementById('shop-catalog-gallery').innerHTML = '';
    } else {
        document.getElementById('shop-catalog-gallery-wrapper').classList.add('hidden');
    }

    // Товары магазина
    renderShopCatalogProducts(storeName);

    fillShopCatalogExtras(s);

    document.getElementById('shop-catalog-modal').classList.remove('hidden');
}


function pickHomePromoShops(n) {
    const names = [];
    if (typeof shopsProfileDb !== 'object' || !shopsProfileDb) return names;
    for (const store in shopsProfileDb) {
        const s = shopsProfileDb[store];
        if (!s || s.status !== 'published' || s.isRealEstate || s.kind === 'landscape') continue;
        names.push(store);
    }
    for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = names[i];
        names[i] = names[j];
        names[j] = t;
    }
    return names.slice(0, Math.min(n, names.length));
}


function openHomeShopFromPromo(i) {
    const name = window.homePromoShops && window.homePromoShops[i];
    if (!name) return;
    if (typeof openShopCatalogModal === 'function') openShopCatalogModal(name);
}


function renderHomeShopPromo() {
    const box = document.getElementById('home-shop-slides');
    if (!box) return;
    const names = Object.keys(shopsProfileDb).filter(name => {
        const shop = shopsProfileDb[name];
        return shop.status === 'published' && !shop.isRealEstate && shop.kind !== 'landscape';
    });
    names.sort((a,b) => Number(!!(shopsProfileDb[b].storefront && shopsProfileDb[b].storefront.demo)) - Number(!!(shopsProfileDb[a].storefront && shopsProfileDb[a].storefront.demo)));
    const picked = names.slice(0, 3);
    window.homePromoShops = picked;
    box.innerHTML = picked.map((name, i) => {
        const shop = shopsProfileDb[name];
        const theme = typeof storeTheme === 'function' ? storeTheme(name) : { ink: '#FE5000', onInk: '#111110' };
        const cover = shop.storefront && shop.storefront.blocks && shop.storefront.blocks.find(b => b.type === 'cover');
        const photo = cover && cover.image || shop.banner || '';
        const desc = cover && cover.line || shop.description || 'Товары и услуги рядом с вами';
        return `<div id="promo-slide-${i}" class="promo-slide absolute inset-0 transition-opacity duration-500 ${i === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0'}" aria-hidden="${i !== 0}" style="--promo-ink:${theme.ink};--promo-text:${theme.onInk}"><div class="promo-copy" data-action="open-store" data-store="${escHtml(name)}"><h4 class="promo-name${name.length > 16 ? ' promo-name--compact' : ''}">${escHtml(name)}</h4><p class="promo-desc">${escHtml(desc)}</p><button type="button" class="r-btn r-btn--sm promo-go">В витрину</button><span class="promo-pager">${String(i+1).padStart(2,'0')} / ${String(picked.length).padStart(2,'0')}</span></div><img class="promo-photo" src="${escHtml(photo)}" alt="" loading="${i ? 'lazy' : 'eager'}"></div>`;
    }).join('');
    currentPromoIdx = 0;
    if (typeof updatePromoSlider === 'function') updatePromoSlider();
}


// --- 3. УПРАВЛЕНИЕ МЕГА-ПАНЕЛЯМИ (Спальни, Кухни и т.д.) ---
function toggleMegaPanel(panelId) {
    const container = document.getElementById('mega-panels-container');
    const targetPanel = document.getElementById(panelId);
    const allPanels = document.querySelectorAll('.mega-panel');

    const dropdown = document.getElementById('main-filter-dropdown');
    if (dropdown) dropdown.classList.add('hidden');

    if (targetPanel && !targetPanel.classList.contains('hidden')) {
        container.classList.add('hidden');
        targetPanel.classList.add('hidden');
        return;
    }

    allPanels.forEach(p => p.classList.add('hidden'));
    
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        container.classList.remove('hidden');
    }
}


// --- 5. ПРИМЕНЕНИЕ ФИЛЬТРА И ЗАКРЫТИЕ ВСЕХ МЕНЮ ---
function applyCategoryFilter(catName) {
    window.shopActiveCategory = catName;
    renderShopCatalogProducts(window.currentCatalogShop);
    
    const megaContainer = document.getElementById('mega-panels-container');
    if (megaContainer) megaContainer.classList.add('hidden');
    document.querySelectorAll('.mega-panel').forEach(p => p.classList.add('hidden'));
    
    const dropdown = document.getElementById('main-filter-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    
    if (catName === 'все') showSmsToast('Сброс: показаны все товары');
    else showSmsToast('Фильтр: ' + catName);
}


// УМНЫЙ РЕНДЕР ТОВАРОВ (ищет совпадения и в категории, и в подкатегории, и в названии)
function renderShopCatalogProducts(storeName) {
    const container = document.getElementById('shop-catalog-grid');
    if (!container) return;
    if (typeof renderLandscapeOffers === 'function' && renderLandscapeOffers(storeName, container)) return;

    let prodHtml = '';
    
    Object.values(productsDb).filter(p => {
        if (p.store !== storeName || p.status !== 'published') return false;
        if (window.shopActiveCategory === 'все') return true;
        
        // Умный поиск по слову из фильтра
        const search = window.shopActiveCategory.toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const sub = (p.subcategory || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        
        return cat.includes(search) || sub.includes(search) || title.includes(search) || search.includes(cat);
    }).forEach(prod => {
        const isFav = state.favorites && state.favorites.includes(prod.id);
        const inCart = cartHasProduct(prod.id);
        
        prodHtml += `
            <div onclick="openProductModal('${prod.id}')" class="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform flex flex-col">
                <div class="relative w-full h-40 bg-slate-100">
                    <img src="${escHtml(prod.image)}" class="w-full h-full object-cover">
                    <button onclick="event.stopPropagation(); toggleFavorite('${prod.id}'); renderShopCatalogProducts('${escJsArg(storeName)}')" class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm ${isFav ? 'text-[#f43f5e]' : 'text-slate-300'}">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                </div>
                <div class="p-3 flex items-end justify-between gap-2">
                    <div class="min-w-0">
                        <h5 class="oz-title line-clamp-1">${escHtml(prod.title)}</h5>
                        <p class="oz-price mt-1">${escHtml(prod.price)}</p>
                    </div>
                    <button onclick="event.stopPropagation(); addToCart('${prod.id}'); renderShopCatalogProducts('${escJsArg(storeName)}')" class="w-9 h-9 rounded-full ${inCart ? 'bg-[#e11d48]' : 'bg-[#1c3a34]'} text-white flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition-transform">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </button>
                </div>
            </div>`;
    });
    
    container.innerHTML = prodHtml || `<div class="col-span-2 flex flex-col items-center justify-center py-10"><svg class="w-10 h-10 text-slate-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg><p class="text-xs text-slate-400">Товаров по фильтру "${window.shopActiveCategory}" не найдено</p></div>`;
}



// === ЛОГИКА ОТКРЫТИЯ/ЗАКРЫТИЯ ГЛАВНОГО ФИЛЬТРА (КЛИК ПО ТРЕМ ТОЧКАМ) ===
function toggleMainMenu(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('main-filter-dropdown');
    if (dropdown) {
        // Открываем или закрываем меню
        dropdown.classList.toggle('hidden');
    }
}

// "Смотреть все" -> открыть каталог товаров этого магазина через фильтр
function shopCatalogSeeAll() {
    const store = window.currentCatalogShop;
    const shop = shopsProfileDb[store];
    if (shop && shop.kind === 'landscape') {
        showSmsToast('Все услуги студии на витрине ниже');
        return;
    }
    closeShopCatalogModal();
    switchTab('catalog');
    // подставляем название магазина в поиск на главной
    const input = document.getElementById('search-input');
    if (input) { input.value = store; handleSearch(); }
    showSmsToast('Все товары магазина: ' + store);
}

function closeShopCatalogModal() {
    const modal = document.getElementById('shop-catalog-modal');
    modal.classList.add('hidden');
    modal.classList.remove('ls-mode');
    modal.style.zIndex = '';
    document.getElementById('shop-catalog-video').src = '';
}
