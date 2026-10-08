/* Справочник: разделы товаров.
   Рендер подразделов справочника, ландшафт, инструменты, сантехника, мебель, отделка, стройматериалы.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


       function renderDirectorySubviews() {
    // 1. Магазины
    let shopsHtml = '';
    let realEstateHtml = '';
    
    for (const store in shopsProfileDb) {
        if(shopsProfileDb[store].status !== 'published') continue;
        const shopData = shopsProfileDb[store];
        if (shopData.kind === 'landscape') continue;
        const badge = shopData.isRealEstate ? (shopData.category || 'Недвижимость') : 'Магазин';
        const btnText = shopData.isRealEstate ? 'Перейти к каталогу' : 'Витрина';
        const clickAction = shopData.isRealEstate ? `openRealEstateCatalog('${escJsArg(store)}')` : `openShopCatalogModal('${escJsArg(store)}')`;
        const theme = typeof storeTheme === 'function' ? storeTheme(store) : { ink: '#FE5000', onInk: '#111110' };
        const action = shopData.isRealEstate ? `onclick="${clickAction}"` : `data-action="open-store" data-store="${escHtml(store)}"`;
        const cardHtml = `<button type="button" ${action} class="r-store-row" style="--store-ink:${theme.ink};--store-text:${theme.onInk}"><div class="r-store-row__field"><h4>${escHtml(store)}</h4><p>${escHtml(shopData.category || badge)}</p><span>${escHtml(shopData.address || shopData.addresses && shopData.addresses[0] && shopData.addresses[0].address || shopData.description || btnText)}</span><b>${btnText} →</b></div><img src="${escHtml(shopData.banner || '')}" alt="" loading="lazy"></button>`;

        if (shopData.isRealEstate) {
            realEstateHtml += cardHtml;
        } else {
            shopsHtml += cardHtml;
        }
    }
    
    const shopsContainer = document.getElementById('shops-list-container');
    if (shopsContainer) shopsContainer.innerHTML = shopsHtml;
    
    const reContainer = document.getElementById('realestate-list-container');
    if (reContainer) reContainer.innerHTML = realEstateHtml;

    // 2. Компании
    let companiesHtml = '';
    for (const compName in companiesProfileDb) {
        if(companiesProfileDb[compName].status !== 'published') continue;
        const compData = companiesProfileDb[compName];
        if (compData.kind === 'remont') continue;
        const rating = compData.rating || '5.0';
        const years = compData.years || 'На рынке';
        const category = compData.category || 'Компания';
        const iconColor = compData.iconColor || 'bg-[#1e6091]';
        const icon = compData.icon || compName.slice(0, 2).toUpperCase();
        
        companiesHtml += `
            <div onclick="openCompanyCatalogModal('${escJsArg(compName)}')" class="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm cursor-pointer hover:border-slate-300 transition-all flex mb-3">
                <div class="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                    <div>
                        <h4 class="font-extrabold text-slate-900 text-base leading-tight mk-name">${escHtml(compName)}<svg class="mk-verified" viewBox="0 0 24 24" aria-label="Проверенная компания"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></h4>
                        <p class="text-[11px] text-slate-500 leading-snug mt-1 line-clamp-2">${escHtml(compData.description)}</p>
                        <div class="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                            <span class="mk-rating"><svg class="mk-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg></span>
                            <span class="font-bold text-slate-700">${escHtml(rating)}</span>
                            <span class="text-slate-300">·</span>
                            <span>${escHtml(years)}</span>
                        </div>
                    </div>
                    <span class="text-[11px] text-[#1e6091] font-bold mt-2">Подробнее</span>
                </div>
                <div class="relative w-32 shrink-0 bg-slate-100">
                    <img src="${escHtml(compData.banner)}" class="w-full h-full object-cover">
                    <div class="absolute top-2 right-2 w-10 h-10 rounded-full ${iconColor} flex items-center justify-center text-white text-[11px] font-bold shadow-md">${escHtml(icon)}</div>
                    <div class="absolute bottom-2 right-2 left-2 bg-black/70 text-white text-[9px] font-bold px-2 py-1 rounded-lg text-center leading-tight">${escHtml(category)}</div>
                </div>
            </div>`;
    }
    const compContainer = document.getElementById('companies-list-container');
    if (compContainer) compContainer.innerHTML = companiesHtml;

    if (typeof renderSpecialistsList === 'function') renderSpecialistsList();
    if (typeof renderSpecCompaniesList === 'function') renderSpecCompaniesList();
    if (typeof renderSpectech === 'function') renderSpectech();
    if (typeof renderLandscapingList === 'function') renderLandscapingList();
    if (typeof renderOtherProfiles === 'function') renderOtherProfiles();

    // 4. Дизайнеры
    let desHtml = '';
    if (directoryDb && directoryDb.designers) {
        directoryDb.designers.filter(s => s.status === 'published').forEach(des => {
            const t = (des.title || '').toLowerCase();
            const tags = t.includes('ландшафт') ? ['сад', 'терраса', 'участок']
                : t.includes('декор') ? ['декор', 'мебель', 'стиль']
                : t.includes('бюро') ? ['бюро', 'под ключ', 'проект']
                : (des.name || '').includes('Д-Дизайн') ? ['квартиры', 'дома', 'офисы']
                : ['интерьер', 'проект', '3D'];
            const tagsHtml = tags.map(tag => `<span class="text-[10px] px-2 py-0.5 rounded-md bg-[var(--r-well)] text-[var(--r-ink-2)]">${tag}</span>`).join('');
            const avatarInner = des.avatarPhoto
                ? `<img src="${des.avatarPhoto}" class="w-full h-full object-cover">`
                : des.avatar;
            desHtml += `
                <div onclick="openPortfolioModal('designers', '${des.id}')" class="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 mb-3 flex items-start gap-3 cursor-pointer active:scale-[0.99] transition-transform">
                    <div class="relative shrink-0">
                        <div class="w-14 h-14 rounded-full overflow-hidden bg-[var(--r-well)] flex items-center justify-center text-[var(--r-ink)] font-bold text-sm">${avatarInner}</div>
                        <div class="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[var(--r-ink)] flex items-center justify-center shadow">
                            <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-slate-900 text-sm leading-tight">${escHtml(des.name)}</h4>
                        <p class="text-[11px] text-[var(--r-orange-text)] font-medium mt-0.5">${escHtml(des.title)}</p>
                        <p class="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">${escHtml(des.description)}</p>
                        <div class="flex flex-wrap gap-1.5 mt-2">${tagsHtml}</div>
                    </div>
                    <div class="flex flex-col items-center shrink-0 pt-1">
                        <div class="w-9 h-9 rounded-full flex items-center justify-center text-[var(--r-ink)] shadow-[inset_0_0_0_1px_var(--r-ink)]">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                        <span class="text-[9px] text-[var(--r-ink-3)] font-medium mt-1">Портфолио</span>
                    </div>
                </div>`;
        });
    }
    const desContainer = document.getElementById('designers-list-container');
    if (desContainer) desContainer.innerHTML = desHtml;

    // 5. Вакансии
    let vacHtml = '';
    if (typeof vacanciesDb !== 'undefined') {
        vacanciesDb.filter(v => v.status === 'published').forEach((vac, i) => {
            const photo = vac.companyPhoto || (vac.photos && vac.photos[0]) || (vac.gallery && vac.gallery.exterior && vac.gallery.exterior[0]) || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600';
            vacHtml += `
                <div onclick="openVacancyModal('${vac.id}')" class="sc-firm">
                    <div class="sc-firm-body">
                        <div>
                            <h4 class="sc-firm-title">${escHtml(vac.title)}</h4>
                            <p class="sc-firm-salary">${escHtml(vac.salary || 'Зарплата по договорённости')}</p>
                            <p class="sc-firm-co">${escHtml(vac.company)}</p>
                            <p class="sc-firm-desc">${escHtml(vac.desc)}</p>
                        </div>
                        <span class="sc-firm-go">Подробнее</span>
                    </div>
                    <div class="sc-firm-photo">
                        <img src="${photo}" alt="">
                    </div>
                </div>`;
        });
    }
    const vacContainer = document.getElementById('jobs-accordion-container');
    if (vacContainer) vacContainer.innerHTML = vacHtml;
    if (typeof renderLifehacksHome === 'function') renderLifehacksHome();
}


        // === ДАННЫЕ ПОДКАТЕГОРИЙ "ЛАНДШАФТ" ===
let landscapeData = [
    { name: 'Малые формы', image: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=300' },
    { name: 'Дорожки', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=300' },
    { name: 'Ограждения', image: 'https://i.pinimg.com/1200x/de/92/bc/de92bc58069fe7280ed45dc4ea4f5ef2.jpg' },
    { name: 'Освещение', image: 'https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=300' },
    { name: 'Водоёмы', image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=300' },
    { name: 'Системы полива', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300' },
    { name: 'Зеленые зоны', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=300' }
];


// === ОТКРЫТЬ ЭКРАН "ЛАНДШАФТ" ===
function openLandscape() {
    document.getElementById('subview-product_categories').classList.add('hidden');
    document.getElementById('subview-landscape').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
    renderLandscape();
}


        // === ДАННЫЕ ПОДКАТЕГОРИЙ "ИНСТРУМЕНТЫ" ===
let toolsData = [
    { name: 'Электроинструменты', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300' },
    { name: 'Ручной инструмент', image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300' },
    { name: 'Измерительный инструмент', image: 'https://images.unsplash.com/photo-1544385561-5817c4194492?w=300' },
    { name: 'Расходные материалы', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300' },
    { name: 'Строительное оборудование', image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=300' },
    { name: 'Спецодежда и СИЗ', image: 'https://tse4.mm.bing.net/th/id/OIP.6g6fGcBGdWlNKAibKwhM5AHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3' }
];


// === ОТКРЫТЬ ЭКРАН "ИНСТРУМЕНТЫ" ===
function openTools() {
    document.getElementById('subview-product_categories').classList.add('hidden');
    document.getElementById('subview-tools').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
    renderTools();
}


// === НАЗАД В КАТАЛОГ (для инструментов) ===
function backFromTools() {
    document.getElementById('subview-tools').classList.add('hidden');
    document.getElementById('subview-product_categories').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
}


// === РЕНДЕР ПОДКАТЕГОРИЙ ИНСТРУМЕНТОВ ===
function renderTools() {
    let html = '';
    toolsData.forEach(item => {
        html += `
            <div onclick="openLightbox('${escJsArg(item.image)}')" class="goods-sub-row">
                <div class="goods-sub-thumb">
                    <img src="${escHtml(item.image)}" class="w-full h-full object-cover">
                </div>
                <span class="text-slate-800 text-sm font-medium leading-snug">${escHtml(item.name)}</span>
            </div>`;
    });
    document.getElementById('tools-grid').innerHTML = html;
}


// === НАЗАД В КАТАЛОГ (для ландшафта) ===
function backFromLandscape() {
    document.getElementById('subview-landscape').classList.add('hidden');
    document.getElementById('subview-product_categories').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
}


// === РЕНДЕР ПОДКАТЕГОРИЙ ЛАНДШАФТА (СТИЛЬ OZON) ===
function renderLandscape() {
    let html = '';
    landscapeData.forEach(item => {
        html += `
            <div onclick="openLightbox('${escJsArg(item.image)}')" class="goods-sub-row">
                <div class="goods-sub-thumb">
                    <img src="${escHtml(item.image)}" class="w-full h-full object-cover">
                </div>
                <span class="text-slate-800 text-sm font-medium leading-snug">${escHtml(item.name)}</span>
            </div>`;
    });
    document.getElementById('landscape-grid').innerHTML = html;
}



        // === ДАННЫЕ ПОДКАТЕГОРИЙ "АКСЕССУАРЫ" ===
let accessoriesData = [
    { name: 'Текстиль', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=300' },
    { name: 'Освещение', image: 'https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=300' },
    { name: 'Декор', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=300' },
    { name: 'Зеркала', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=300' },
    { name: 'Часы', image: 'https://images.unsplash.com/photo-1495856458515-0637185db551?w=300' },
    { name: 'Аксессуары для ванной', image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=300' },
    { name: 'Кухонные мелочи', image: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=300' }
];


// === ОТКРЫТЬ ЭКРАН "АКСЕССУАРЫ" ===
function openAccessories() {
    document.getElementById('subview-product_categories').classList.add('hidden');
    document.getElementById('subview-accessories').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
    renderAccessories();
}


// === НАЗАД В КАТАЛОГ (для аксессуаров) ===
function backFromAccessories() {
    document.getElementById('subview-accessories').classList.add('hidden');
    document.getElementById('subview-product_categories').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
}


// === РЕНДЕР ПОДКАТЕГОРИЙ АКСЕССУАРОВ (СТИЛЬ OZON) ===
function renderAccessories() {
    let html = '';
    accessoriesData.forEach(item => {
        html += `
            <div onclick="openLightbox('${escJsArg(item.image)}')" class="goods-sub-row">
                <div class="goods-sub-thumb">
                    <img src="${escHtml(item.image)}" class="w-full h-full object-cover">
                </div>
                <span class="text-slate-800 text-sm font-medium leading-snug">${escHtml(item.name)}</span>
            </div>`;
    });
    document.getElementById('accessories-grid').innerHTML = html;
}



        // === ДАННЫЕ ПОДКАТЕГОРИЙ "САНТЕХНИКА" ===
let plumbingData = [
    { name: 'Ванная комната', image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=300' },
    { name: 'Унитаз/Биде', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300' },
    { name: 'Раковины', image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=300' },
    { name: 'Комплектующие', image: 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=300' }
];


// === ОТКРЫТЬ ЭКРАН "САНТЕХНИКА" ===
function openPlumbing() {
    document.getElementById('subview-product_categories').classList.add('hidden');
    document.getElementById('subview-plumbing').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
    renderPlumbing();
}


// === НАЗАД В КАТАЛОГ (для сантехники) ===
function backFromPlumbing() {
    document.getElementById('subview-plumbing').classList.add('hidden');
    document.getElementById('subview-product_categories').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
}


// === РЕНДЕР ПОДКАТЕГОРИЙ САНТЕХНИКИ (СТИЛЬ OZON) ===
function renderPlumbing() {
    let html = '';
    plumbingData.forEach(item => {
        html += `
            <div onclick="openLightbox('${escJsArg(item.image)}')" class="goods-sub-row">
                <div class="goods-sub-thumb">
                    <img src="${escHtml(item.image)}" class="w-full h-full object-cover">
                </div>
                <span class="text-slate-800 text-sm font-medium leading-snug">${escHtml(item.name)}</span>
            </div>`;
    });
    document.getElementById('plumbing-grid').innerHTML = html;
}



        // === ДАННЫЕ ПОДКАТЕГОРИЙ "МЕБЕЛЬ" ===
let furnitureData = [
    { name: 'Мягкая мебель', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300' },
    { name: 'Корпусная мебель', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=300' },
    { name: 'Столы и стулья', image: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=300' },
    { name: 'Кухонная мебель', image: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=300' },
    { name: 'Спальная мебель', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300' },
    { name: 'Мебель для прихожей', image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=300' },
    { name: 'Детская мебель', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=300' },
    { name: 'Мебель для ванны', image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=300' }
];


// === ОТКРЫТЬ ЭКРАН "МЕБЕЛЬ" ===
function openFurniture() {
    document.getElementById('subview-product_categories').classList.add('hidden');
    document.getElementById('subview-furniture').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
    renderFurniture();
}


// === НАЗАД В КАТАЛОГ (для мебели) ===
function backFromFurniture() {
    document.getElementById('subview-furniture').classList.add('hidden');
    document.getElementById('subview-product_categories').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
}


// === РЕНДЕР ПОДКАТЕГОРИЙ МЕБЕЛИ (СТИЛЬ OZON) ===
function renderFurniture() {
    let html = '';
    furnitureData.forEach(item => {
        html += `
            <div onclick="openLightbox('${escJsArg(item.image)}')" class="goods-sub-row">
                <div class="goods-sub-thumb">
                    <img src="${escHtml(item.image)}" class="w-full h-full object-cover">
                </div>
                <span class="text-slate-800 text-sm font-medium leading-snug">${escHtml(item.name)}</span>
            </div>`;
    });
    document.getElementById('furniture-grid').innerHTML = html;
}



        // === ДАННЫЕ ПОДКАТЕГОРИЙ "ОТДЕЛОЧНЫЕ МАТЕРИАЛЫ" ===
let finishingMaterialsData = [
    { name: 'Стены и поверхности', image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=300' },
    { name: 'Полы', image: 'https://i.pinimg.com/1200x/76/ee/a5/76eea57d49aae6d51277c78f6bcf9a71.jpg' },
    { name: 'Потолки', image: 'https://images.unsplash.com/photo-1615529162924-f8605388461d?w=300' },
    { name: 'Окна', image: 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=300' },
    { name: 'Фасад и внешняя отделка', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300' },
    { name: 'Декоративные элементы', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=300' },
    { name: 'Краски и покрытия по дереву', image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=300' },
    { name: 'Герметики и клеи', image: 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=300' },
    { name: 'Инструменты и расходники', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300' }
];


// === ОТКРЫТЬ ЭКРАН "ОТДЕЛОЧНЫЕ МАТЕРИАЛЫ" ===
function openFinishingMaterials() {
    document.getElementById('subview-product_categories').classList.add('hidden');
    document.getElementById('subview-finishing_materials').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
    renderFinishingMaterials();
}


// === НАЗАД В КАТАЛОГ (для отделочных) ===
function backFromFinishing() {
    document.getElementById('subview-finishing_materials').classList.add('hidden');
    document.getElementById('subview-product_categories').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
}


// === РЕНДЕР ПОДКАТЕГОРИЙ ОТДЕЛОЧНЫХ (СТИЛЬ OZON) ===
function renderFinishingMaterials() {
    let html = '';
    finishingMaterialsData.forEach(item => {
        html += `
            <div onclick="openLightbox('${escJsArg(item.image)}')" class="goods-sub-row">
                <div class="goods-sub-thumb">
                    <img src="${escHtml(item.image)}" class="w-full h-full object-cover">
                </div>
                <span class="text-slate-800 text-sm font-medium leading-snug">${escHtml(item.name)}</span>
            </div>`;
    });
    document.getElementById('finishing-materials-grid').innerHTML = html;
}


        // === ДАННЫЕ ПОДКАТЕГОРИЙ "СТРОИТЕЛЬНЫЕ МАТЕРИАЛЫ" ===
let buildingMaterialsData = [
    { name: 'Бетон и растворы', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=300' },
    { name: 'Арматура и металлопрокат', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300' },
    { name: 'Кирпич и блоки', image: 'https://images.unsplash.com/photo-1590725140246-20acdee442be?w=300' },
    { name: 'Дерево и древесноволокнистые материалы', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300' },
    { name: 'Изоляционные материалы', image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300' },
    { name: 'Кровля и гидроизоляция', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300' },
    { name: 'Крепеж и фурнитура', image: 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=300' },
    { name: 'Инструменты и оборудование', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300' },
    { name: 'Утеплители', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=300' },
    { name: 'Технологические расходники', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300' }
];


// === ОТКРЫТЬ ЭКРАН "СТРОИТЕЛЬНЫЕ МАТЕРИАЛЫ" ===
function openBuildingMaterials() {
    document.getElementById('subview-product_categories').classList.add('hidden');
    document.getElementById('subview-building_materials').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
    renderBuildingMaterials();
}


// === НАЗАД В КАТАЛОГ ТОВАРОВ ===
function backToProductCatalog() {
    document.getElementById('subview-building_materials').classList.add('hidden');
    document.getElementById('subview-product_categories').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
}


// === РЕНДЕР ПОДКАТЕГОРИЙ ===
function renderBuildingMaterials() {
    let html = '';
    buildingMaterialsData.forEach(item => {
        html += `
            <div onclick="openLightbox('${escJsArg(item.image)}')" class="goods-sub-row">
                <div class="goods-sub-thumb">
                    <img src="${escHtml(item.image)}" class="w-full h-full object-cover">
                </div>
                <span class="text-slate-800 text-sm font-medium leading-snug">${escHtml(item.name)}</span>
            </div>`;
    });
    document.getElementById('building-materials-grid').innerHTML = html;
}
