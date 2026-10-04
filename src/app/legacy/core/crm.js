/* Управление в приложении (CRM).
   Статистика, промо, сторис, онбординг, магазины, специалисты, товары, одобрение.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


        // ========== КЛИК ПО ПЛИТКАМ СТАТИСТИКИ ==========
function statGoTo(type) {
    if (type === 'pending') {
        // Модерация — переходим на вкладку модерации
        switchAdminTab('moderation');
        return;
    }
    if (type === 'stories') {
        // Сторис — на вкладку "Главная"
        switchAdminTab('home');
        return;
    }
    if (type === 'lifehacks') {
        switchAdminTab('crm');
        const crmType = document.getElementById('crm-type');
        if (crmType) { crmType.value = 'lifehacks'; switchCrmType(); }
        return;
    }
    if (type === 'vacancies') {
        // Вакансии — тоже в модерацию (там управление анкетами/вакансиями)
        switchAdminTab('moderation');
        const filter = document.getElementById('mod-category-filter');
        if (filter) { filter.value = 'vacancies'; renderAdminModerationList(); }
        return;
    }
    // Товары / Магазины / Мастера — вкладка "Каталог"
    switchAdminTab('crm');
    const crmType = document.getElementById('crm-type');
    if (crmType) {
        crmType.value = type; // products / shops / specialists
        switchCrmType();
    }
}




        // ========== ДАШБОРД СТАТИСТИКИ ==========
function updateAdminStats() {
    // Товары
    const prodCount = Object.keys(productsDb).length;
    // Магазины
    const shopCount = Object.keys(shopsProfileDb).length;
    // Мастера
    const specCount = directoryDb.specialists.length;
    // Сторис
    const storyCount = storiesData.length;
    // Вакансии
    const vacCount = vacanciesDb.length;
    // На модерации (все типы)
    let pending = Object.values(productsDb).filter(p => p.status === 'pending').length;
    pending += directoryDb.specialists.filter(p => p.status === 'pending').length;
    pending += vacanciesDb.filter(p => p.status === 'pending').length;
    pending += storiesData.filter(p => p.status === 'pending').length;
    pending += showcaseModerationDb.filter(p => p.status === 'pending').length;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    set('stat-products', prodCount);
    set('stat-shops', shopCount);
    set('stat-specialists', specCount);
    set('stat-stories', storyCount);
    set('stat-vacancies', vacCount);
    set('stat-pending', pending);
    set('stat-lifehacks', Array.isArray(lifehacksDb) ? lifehacksDb.length : 0);
}


        // ========== ДАННЫЕ ОНБОРДИНГА (до 20 слайдов) ==========
let onboardingData = [
    { title: 'Кухня Вашей Мечты', desc: 'Рассчитайте стоимость, пройдите короткий опрос и получите ценный подарок.', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600', badge: 'АКЦИЯ АВГУСТА', badgeColor: 'bg-amber-500' },
    { title: 'Современные Решения', desc: 'Готовые кухонные гарнитуры напрямую от лучших фабрик региона.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', badge: 'ПРЕМИУМ', badgeColor: 'bg-blue-600' },
    { title: 'Мебель Люкс Класса', desc: 'Премиальные дизайнерские кровати для безупречного комфорта.', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600', badge: 'ЭСТЕТИКА СНА', badgeColor: 'bg-emerald-600' },
    { title: 'Надежные мастера', desc: 'Проверенные бригады и дизайнеры для вашего идеального ремонта.', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', badge: 'СПЕЦИАЛИСТЫ', badgeColor: 'bg-red-600' },
    { title: 'Стильные гостиные', desc: 'Мягкая мебель и декор для уютной атмосферы в вашем доме.', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600', badge: 'НОВИНКА', badgeColor: 'bg-violet-600' },
    { title: 'Ванная мечты', desc: 'Сантехника и плитка от проверенных производителей.', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600', badge: 'ХИТ', badgeColor: 'bg-pink-600' }
];


// Сколько слайдов показывать за один заход
const ONBOARDING_SHOW = 4;

// Слайды текущего показа
let onboardingSlides = [];


        // ========== УПРАВЛЕНИЕ ПРОМО-БАННЕРАМИ ==========
// Собираем данные баннеров из HTML в массив (один раз)
let promoData = SEED.promo();


function renderCrmPromoList() {
    let html = '';
    promoData.forEach((p, i) => {
        html += `
            <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                <img src="${p.image}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">
                <div class="flex-1 min-w-0">
                    <p class="text-[9px] text-slate-400">Слайд ${i + 1}</p>
                    <h5 class="font-bold text-xs text-slate-800 truncate">${p.title}</h5>
                </div>
                <button onclick="openPromoEditor(${i})" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shrink-0">Редактировать</button>
            </div>`;
    });
    document.getElementById('crm-promo-list').innerHTML = html;
}


function openPromoEditor(index) {
    const p = promoData[index];
    document.getElementById('promo-editor-index').value = index;
    document.getElementById('promo-editor-title').value = p.title;
    document.getElementById('promo-editor-image').value = p.image;
    document.getElementById('promo-editor-preview').src = p.image;
    const e = document.getElementById('promo-editor');
    e.classList.remove('hidden'); e.classList.add('flex');
}


function closePromoEditor() {
    const e = document.getElementById('promo-editor');
    e.classList.add('hidden'); e.classList.remove('flex');
}


function savePromoFromEditor() {
    const i = parseInt(document.getElementById('promo-editor-index').value);
    const title = document.getElementById('promo-editor-title').value.trim();
    const image = document.getElementById('promo-editor-image').value.trim();
    if (!title || !image) return showSmsToast("Заполните заголовок и фото!");

    promoData[i] = { title, image };

    // Обновляем сам баннер на главной
    const slide = document.getElementById('promo-slide-' + (i + 1));
    if (slide) {
        slide.querySelector('img').src = image;
        slide.querySelector('h4').innerText = title;
    }

                showSmsToast("Баннер обновлён ");
    closePromoEditor();
    renderCrmPromoList();
    saveAllData();
}


// ========== УПРАВЛЕНИЕ СТОРИС ==========
function renderCrmStoryList() {
    const list = document.getElementById('crm-story-list');
    if (!list) return;
    let html = '';
    storiesData.forEach(s => {
        const cover = (s.slides && s.slides[0]) || s.image || '';
        const count = (s.slides && s.slides.length) || 0;
        html += `
            <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                <img src="${cover}" class="w-11 h-11 rounded-full object-cover shrink-0 bg-slate-100">
                <div class="flex-1 min-w-0">
                    <h5 class="font-bold text-xs text-slate-800 truncate">${s.name}</h5>
                    <p class="text-[10px] text-slate-400">${count} фото</p>
                </div>
                <div class="flex flex-col gap-1 shrink-0">
                    <button onclick="openStoryEditor('${s.id}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                    <button onclick="deleteStory('${s.id}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                </div>
            </div>`;
    });
    list.innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Сторис нет</p>`;
}


// Временное хранилище загруженных слайдов (пока форма открыта)
let storyEditorSlides = [];


function openStoryEditor(id) {
    const e = document.getElementById('story-editor');
    if (!e) return;
    const s = storiesData.find(x => x.id === id);

    // Строим выпадающий список магазинов
    buildStoryShopDropdown();

    if (s) {
        document.getElementById('story-editor-title').innerText = 'Редактировать сторис';
        document.getElementById('story-editor-id').value = s.id;
        setStoryShop(s.name);          // подставляем выбранный магазин
        storyEditorSlides = [...s.slides]; // копируем существующие слайды
    } else {
        document.getElementById('story-editor-title').innerText = 'Новый сторис';
        document.getElementById('story-editor-id').value = '';
        setStoryShop('');              // сбрасываем магазин
        storyEditorSlides = [];        // пусто
    }

    // Очищаем поле выбора файлов
    const fileInput = document.getElementById('story-editor-files');
    if (fileInput) fileInput.value = '';

    renderStoryEditorPreviews();       // рисуем превью
    e.classList.remove('hidden'); e.classList.add('flex');
}


// === ВЫПАДАЮЩИЙ СПИСОК МАГАЗИНОВ ===
function buildStoryShopDropdown() {
    const list = document.getElementById('story-shop-list');
    if (!list) return;
    let html = '';
    for (const name in shopsProfileDb) {
        html += `<div onclick="pickStoryShop('${name.replace(/'/g, "\\'")}')" class="px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer">${name}</div>`;
    }
    list.innerHTML = html || '<div class="px-3 py-2.5 text-sm text-slate-400">Магазинов нет</div>';
}


// Открыть/закрыть список магазинов
function toggleStoryShopDropdown(event) {
    if (event) event.stopPropagation();
    const list = document.getElementById('story-shop-list');
    if (list) list.classList.toggle('hidden');
}


// Выбрать магазин из списка
function pickStoryShop(name) {
    setStoryShop(name);
    document.getElementById('story-shop-list').classList.add('hidden');
}


// Записать выбранный магазин в форму
function setStoryShop(name) {
    const hidden = document.getElementById('story-editor-name');
    const label = document.getElementById('story-shop-label');
    if (!hidden || !label) return;
    hidden.value = name || '';
    if (name) {
        label.innerText = name;
        label.className = 'text-slate-800';
    } else {
        label.innerText = '— Выберите магазин —';
        label.className = 'text-slate-400';
    }
}


// === ЗАГРУЗКА ФАЙЛОВ С УСТРОЙСТВА ===
function handleStoryFilesUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = function (ev) {
            // Сохраняем файл как data:URL (base64-строка)
            storyEditorSlides.push(ev.target.result);
            renderStoryEditorPreviews();
        };
        reader.readAsDataURL(file);
    }
    // Очищаем input, чтобы можно было выбрать те же файлы снова
    event.target.value = '';
}


// Рисуем превью загруженных слайдов (с кнопкой удаления)
function renderStoryEditorPreviews() {
    const box = document.getElementById('story-editor-previews');
    if (!box) return;
    let html = '';
    storyEditorSlides.forEach((src, i) => {
        const isVideo = src.startsWith('data:video') || isVideoUrl(src);
        const media = isVideo
            ? `<video src="${src}" class="w-full h-full object-cover" muted></video><span class="absolute inset-0 flex items-center justify-center text-white text-lg pointer-events-none">▶</span>`
            : `<img src="${src}" class="w-full h-full object-cover">`;
        html += `
            <div class="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                ${media}
                <button onclick="removeStorySlide(${i})" class="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 text-xs flex items-center justify-center rounded-bl-lg">✕</button>
            </div>`;
    });
    box.innerHTML = html || '<p class="text-xs text-slate-400">Файлы не загружены</p>';
}


// Удалить один слайд из превью
function removeStorySlide(index) {
    storyEditorSlides.splice(index, 1);
    renderStoryEditorPreviews();
}


function closeStoryEditor() {
    const e = document.getElementById('story-editor');
    e.classList.add('hidden'); e.classList.remove('flex');
}


function saveStoryFromEditor() {
    const id = document.getElementById('story-editor-id').value;
    const name = document.getElementById('story-editor-name').value.trim();

    if (!name) return showSmsToast("Выберите магазин!");
    if (storyEditorSlides.length === 0) return showSmsToast("Загрузите хотя бы одно фото или видео!");

    const slides = [...storyEditorSlides]; // берём загруженные файлы

    const existing = storiesData.find(x => x.id === id);
    if (existing) {
        existing.name = name;
        existing.slides = slides;
        existing.createdAt = Date.now(); // обновляем время (сброс отсчёта 24ч)
        showSmsToast("Сторис обновлён ");
    } else {
        storiesData.push({
            id: 'story-' + Date.now(),
            name: name,
            slides: slides,
            createdAt: Date.now()        // время создания — для отсчёта 24 часов
        });
        showSmsToast("Сторис добавлен (хранится 24 часа)");
    }

    closeStoryEditor();
    renderCrmStoryList();
    renderStories();
    saveAllData();
}


        function deleteStory(id) {
    storiesData = storiesData.filter(x => x.id !== id);
    showSmsToast("Сторис удалён ");
    renderCrmStoryList();
    renderStories();
    saveAllData();
}



// ========== УПРАВЛЕНИЕ ОНБОРДИНГОМ ==========

// Список слайдов онбординга для админа
function renderCrmOnbList() {
    const container = document.getElementById('crm-onb-list');
    if (!container) return;
    let html = '';
    onboardingData.forEach((s, i) => {
        const badgeHtml = s.badge
            ? `<span class="text-[8px] ${s.badgeColor || 'bg-amber-500'} text-white font-bold px-1.5 py-0.5 rounded-full">${s.badge}</span>`
            : '';
        html += `
            <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                <img src="${s.image}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">
                <div class="flex-1 min-w-0">
                    <p class="text-[9px] text-slate-400">Слайд ${i + 1}</p>
                    <h5 class="font-bold text-xs text-slate-800 truncate">${s.title}</h5>
                    ${badgeHtml}
                </div>
                <div class="flex flex-col gap-1 shrink-0">
                    <button onclick="openOnbEditor(${i})" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                    <button onclick="deleteOnbSlide(${i})" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                </div>
            </div>`;
    });
    container.innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Слайдов нет</p>`;
}


// Открыть форму слайда (index — если редактируем, пусто — если новый)
function openOnbEditor(index) {
    const e = document.getElementById('onb-editor');
    if (index !== undefined && onboardingData[index]) {
        const s = onboardingData[index];
        document.getElementById('onb-editor-title').innerText = 'Редактировать слайд';
        document.getElementById('onb-editor-index').value = index;
        document.getElementById('onb-editor-title-input').value = s.title || '';
        document.getElementById('onb-editor-desc').value = s.desc || '';
        document.getElementById('onb-editor-badge').value = s.badge || '';
        document.getElementById('onb-editor-badgecolor').value = s.badgeColor || 'bg-amber-500';
        document.getElementById('onb-editor-image').value = s.image || '';
        document.getElementById('onb-editor-preview').src = s.image || '';
    } else {
        // Проверка лимита 20 слайдов
        if (onboardingData.length >= 20) {
            return showSmsToast("Максимум 20 слайдов!");
        }
        document.getElementById('onb-editor-title').innerText = 'Новый слайд';
        document.getElementById('onb-editor-index').value = '';
        document.getElementById('onb-editor-title-input').value = '';
        document.getElementById('onb-editor-desc').value = '';
        document.getElementById('onb-editor-badge').value = '';
        document.getElementById('onb-editor-badgecolor').value = 'bg-amber-500';
        document.getElementById('onb-editor-image').value = '';
        document.getElementById('onb-editor-preview').src = '';
    }
    e.classList.remove('hidden');
    e.classList.add('flex');
}


// Закрыть форму
function closeOnbEditor() {
    const e = document.getElementById('onb-editor');
    e.classList.add('hidden');
    e.classList.remove('flex');
}


// Удалить слайд
function deleteOnbSlide(index) {
    if (onboardingData.length <= 1) {
        return showSmsToast("Нельзя удалить последний слайд!");
    }
    onboardingData.splice(index, 1);
    showSmsToast("Слайд удалён ");
    renderCrmOnbList();
    saveAllData();
}



        // ========== ПЕРЕКЛЮЧАТЕЛЬ ТИПОВ (Товары / Магазины / Мастера) ==========
function switchCrmType() {
    const type = document.getElementById('crm-type').value;
    ['products', 'shops', 'specialists', 'lifehacks'].forEach(t => {
        const el = document.getElementById('crm-block-' + t);
        if (el) el.classList.add('hidden');
    });
    const show = document.getElementById('crm-block-' + type);
    if (show) show.classList.remove('hidden');
    if (type === 'products') renderCrmProductList();
    if (type === 'shops') renderCrmShopList();
    if (type === 'specialists') renderCrmSpecList();
    if (type === 'lifehacks') renderCrmLifehackList();
}


// ========== УПРАВЛЕНИЕ МАГАЗИНАМИ ==========
function renderCrmShopList() {
    let html = '';
    for (const name in shopsProfileDb) {
        const s = shopsProfileDb[name];
        html += `
            <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                <img src="${s.banner}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">
                <div class="flex-1 min-w-0">
                    <h5 class="font-bold text-xs text-slate-800 truncate">${s.name}</h5>
                    <p class="text-[10px] text-slate-400 truncate">${s.address || ''}</p>
                </div>
                <div class="flex flex-col gap-1 shrink-0">
                    <button onclick="openShopEditor('${name}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                    <button onclick="deleteShop('${name}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                </div>
            </div>`;
    }
    document.getElementById('crm-shop-list').innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Магазинов нет</p>`;
}


        // === ЗАГРУЗКА БАННЕРА МАГАЗИНА С УСТРОЙСТВА ===
function handleShopBannerUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        // Записываем картинку (base64) в скрытое поле
        document.getElementById('shop-editor-banner').value = ev.target.result;
        // Показываем превью
        document.getElementById('shop-editor-preview').src = ev.target.result;
    };
    reader.readAsDataURL(file);
}


// === ЗАГРУЗКА ЛОГОТИПА МАГАЗИНА С УСТРОЙСТВА ===
function handleShopLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        document.getElementById('shop-editor-logo').value = ev.target.result;
        document.getElementById('shop-editor-logo-preview').src = ev.target.result;
    };
    reader.readAsDataURL(file);
}


        // === ВРЕМЕННОЕ ХРАНИЛИЩЕ ФОТО/ВИДЕО ГАЛЕРЕИ (пока форма открыта) ===
let shopEditorGallery = [];


// === ЗАГРУЗКА НЕСКОЛЬКИХ ФОТО/ВИДЕО ГАЛЕРЕИ С УСТРОЙСТВА ===
function handleShopGalleryUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = function (ev) {
            shopEditorGallery.push(ev.target.result); // сохраняем как base64
            renderShopGalleryPreviews();
        };
        reader.readAsDataURL(file);
    }
    event.target.value = ''; // очищаем, чтобы можно было выбрать те же файлы снова
}


// === ПРЕВЬЮ ЗАГРУЖЕННЫХ ФОТО/ВИДЕО (с кнопкой удаления) ===
function renderShopGalleryPreviews() {
    const box = document.getElementById('shop-editor-gallery-previews');
    if (!box) return;
    let html = '';
    shopEditorGallery.forEach((src, i) => {
        const isVideo = src.startsWith('data:video') || isVideoUrl(src);
        const media = isVideo
            ? `<video src="${src}" class="w-full h-full object-cover" muted></video><span class="absolute inset-0 flex items-center justify-center text-white text-lg pointer-events-none">▶</span>`
            : `<img src="${src}" class="w-full h-full object-cover">`;
        html += `
            <div class="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                ${media}
                <button onclick="removeShopGalleryItem(${i})" class="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 text-xs flex items-center justify-center rounded-bl-lg">✕</button>
            </div>`;
    });
    box.innerHTML = html || '<p class="text-[9px] text-slate-400">Файлы не загружены</p>';
}


// === УДАЛИТЬ ОДИН ФАЙЛ ИЗ ГАЛЕРЕИ ===
function removeShopGalleryItem(index) {
    shopEditorGallery.splice(index, 1);
    renderShopGalleryPreviews();
}


        // === ВРЕМЕННОЕ ХРАНИЛИЩЕ ФОТО "О КОМПАНИИ" (макс 3) ===
let shopEditorAbout = [];


// === ЗАГРУЗКА ФОТО "О КОМПАНИИ" (до 3 шт) ===
function handleShopAboutUpload(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
        if (shopEditorAbout.length >= 3) {
            alert('Можно загрузить максимум 3 фото к описанию.');
            break;
        }
        const file = files[i];
        const reader = new FileReader();
        reader.onload = function (ev) {
            if (shopEditorAbout.length < 3) {
                shopEditorAbout.push(ev.target.result);
                renderShopAboutPreviews();
            }
        };
        reader.readAsDataURL(file);
    }
    event.target.value = ''; // сброс, чтобы можно было выбрать те же файлы снова
}


// === ПРЕВЬЮ ФОТО "О КОМПАНИИ" (квадратные, с кнопкой удаления) ===
function renderShopAboutPreviews() {
    const box = document.getElementById('shop-editor-about-previews');
    if (!box) return;
    let html = '';
    shopEditorAbout.forEach((src, i) => {
        html += `
            <div class="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                <img src="${src}" class="w-full h-full object-cover">
                <button onclick="removeShopAboutItem(${i})" class="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 text-xs flex items-center justify-center rounded-bl-lg">✕</button>
            </div>`;
    });
    // добавим пустые ячейки-заглушки, чтобы всегда было видно 3 квадрата
    for (let i = shopEditorAbout.length; i < 3; i++) {
        html += `<div class="aspect-square rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300 text-lg">＋</div>`;
    }
    box.innerHTML = html;
}


// === УДАЛИТЬ ОДНО ФОТО "О КОМПАНИИ" ===
function removeShopAboutItem(index) {
    shopEditorAbout.splice(index, 1);
    renderShopAboutPreviews();
}



function openShopEditor(name) {
    const editor = document.getElementById('shop-editor');
    if (name && shopsProfileDb[name]) {
        const s = shopsProfileDb[name];
        document.getElementById('shop-editor-title').innerText = 'Редактировать магазин';
        document.getElementById('shop-editor-oldname').value = name;
        document.getElementById('shop-editor-name').value = s.name;
        document.getElementById('shop-editor-desc').value = s.description || '';
        document.getElementById('shop-editor-addr').value = s.address || '';
        document.getElementById('shop-editor-site').value = s.site || '';
        document.getElementById('shop-editor-tg').value = s.telegram || '';
        document.getElementById('shop-editor-banner').value = s.banner || '';
        document.getElementById('shop-editor-preview').src = s.banner || '';
        document.getElementById('shop-editor-logo').value = s.logo || '';
        document.getElementById('shop-editor-logo-preview').src = s.logo || '';
                        // Загружаем галерею и текст
        shopEditorGallery = Array.isArray(s.gallery) ? [...s.gallery] : [];
        document.getElementById('shop-editor-gallery-text').value = s.galleryText || '';
                        // Загружаем фото "О компании"
        shopEditorAbout = Array.isArray(s.aboutImages) ? [...s.aboutImages] : [];
    } else {
        document.getElementById('shop-editor-title').innerText = 'Новый магазин';
        document.getElementById('shop-editor-oldname').value = '';
        document.getElementById('shop-editor-name').value = '';
        document.getElementById('shop-editor-desc').value = '';
        document.getElementById('shop-editor-addr').value = '';
        document.getElementById('shop-editor-site').value = '';
        document.getElementById('shop-editor-tg').value = '';
        document.getElementById('shop-editor-banner').value = '';
        document.getElementById('shop-editor-preview').src = '';
        document.getElementById('shop-editor-logo').value = '';
        document.getElementById('shop-editor-logo-preview').src = '';
                        // Пустая галерея для нового магазина
        shopEditorGallery = [];
        document.getElementById('shop-editor-gallery-text').value = '';
                        // Пустые фото "О компании"
        shopEditorAbout = [];
    }
                renderShopGalleryPreviews();
                            renderShopAboutPreviews();
    editor.classList.remove('hidden');
    editor.classList.add('flex');
}


function closeShopEditor() {
    const editor = document.getElementById('shop-editor');
    editor.classList.add('hidden');
    editor.classList.remove('flex');
}


function saveShopFromEditor() {
    const oldName = document.getElementById('shop-editor-oldname').value;
    const name = document.getElementById('shop-editor-name').value.trim();
    if (!name) return showSmsToast("Введите название магазина!");

    const data = {
        name: name,
        status: 'published',
        banner: document.getElementById('shop-editor-banner').value.trim() || 'https://via.placeholder.com/600',
        description: document.getElementById('shop-editor-desc').value.trim(),
        address: document.getElementById('shop-editor-addr').value.trim(),
        site: document.getElementById('shop-editor-site').value.trim() || '#',
        telegram: document.getElementById('shop-editor-tg').value.trim() || '#',
        logo: document.getElementById('shop-editor-logo').value.trim(),
        video: (oldName && shopsProfileDb[oldName]) ? shopsProfileDb[oldName].video : '',
        gallery: [...shopEditorGallery],
        galleryText: document.getElementById('shop-editor-gallery-text').value.trim(),
        aboutImages: [...shopEditorAbout]
    };

    // если имя поменяли — удаляем старую запись
    if (oldName && oldName !== name) delete shopsProfileDb[oldName];
    shopsProfileDb[name] = data;

                showSmsToast(oldName ? "Магазин обновлён " : "Магазин добавлен ");
    closeShopEditor();
    renderCrmShopList();
    renderDirectorySubviews();
    saveAllData();
}


        function deleteShop(name) {
    if (!shopsProfileDb[name]) return;
    delete shopsProfileDb[name];
    showSmsToast("Магазин удалён ");
    renderCrmShopList();
    renderDirectorySubviews();
    saveAllData();
}


// ========== УПРАВЛЕНИЕ МАСТЕРАМИ ==========
function renderCrmSpecList() {
    let html = '';
    directoryDb.specialists.forEach(s => {
        const img = s.avatarPhoto
            ? `<img src="${s.avatarPhoto}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">`
            : `<div class="w-11 h-11 rounded-lg bg-[#1e6091] text-white flex items-center justify-center font-bold shrink-0">${s.avatar || '?'}</div>`;
        html += `
            <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                ${img}
                <div class="flex-1 min-w-0">
                    <h5 class="font-bold text-xs text-slate-800 truncate">${s.name}</h5>
                    <p class="text-[10px] text-slate-400 truncate">${s.title || ''}</p>
                </div>
                <div class="flex flex-col gap-1 shrink-0">
                    <button onclick="openSpecEditor('${s.id}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                    <button onclick="deleteSpec('${s.id}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                </div>
            </div>`;
    });
    document.getElementById('crm-spec-list').innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Мастеров нет</p>`;
}


function openSpecEditor(id) {
    const editor = document.getElementById('spec-editor');
    const spec = directoryDb.specialists.find(x => x.id === id);
    if (spec) {
        document.getElementById('spec-editor-title').innerText = 'Редактировать мастера';
        document.getElementById('spec-editor-id').value = spec.id;
        document.getElementById('spec-editor-name').value = spec.name;
        document.getElementById('spec-editor-jobtitle').value = spec.title || '';
        document.getElementById('spec-editor-desc').value = spec.description || '';
        document.getElementById('spec-editor-phone').value = spec.phone || '';
        document.getElementById('spec-editor-hours').value = spec.hours || '';
        document.getElementById('spec-editor-photo').value = spec.avatarPhoto || '';
        document.getElementById('spec-editor-preview').src = spec.avatarPhoto || '';
    } else {
        document.getElementById('spec-editor-title').innerText = 'Новый мастер';
        document.getElementById('spec-editor-id').value = '';
        document.getElementById('spec-editor-name').value = '';
        document.getElementById('spec-editor-jobtitle').value = '';
        document.getElementById('spec-editor-desc').value = '';
        document.getElementById('spec-editor-phone').value = '';
        document.getElementById('spec-editor-hours').value = '';
        document.getElementById('spec-editor-photo').value = '';
        document.getElementById('spec-editor-preview').src = '';
    }
    editor.classList.remove('hidden');
    editor.classList.add('flex');
}


function closeSpecEditor() {
    const editor = document.getElementById('spec-editor');
    editor.classList.add('hidden');
    editor.classList.remove('flex');
}


function saveSpecFromEditor() {
    const id = document.getElementById('spec-editor-id').value;
    const name = document.getElementById('spec-editor-name').value.trim();
    if (!name) return showSmsToast("Введите имя мастера!");

    const photo = document.getElementById('spec-editor-photo').value.trim();
    const fields = {
        name: name,
        title: document.getElementById('spec-editor-jobtitle').value.trim(),
        description: document.getElementById('spec-editor-desc').value.trim(),
        phone: document.getElementById('spec-editor-phone').value.trim(),
        hours: document.getElementById('spec-editor-hours').value.trim(),
        avatarPhoto: photo,
        avatar: name[0].toUpperCase()
    };

    const existing = directoryDb.specialists.find(x => x.id === id);
    if (existing) {
        Object.assign(existing, fields);
        showSmsToast("Мастер обновлён ");
    } else {
        directoryDb.specialists.push({
            id: 'spec-' + Date.now(),
            status: 'published',
            prices: [],
            gallery: [],
            ...fields
        });
        showSmsToast("Мастер добавлен ");
    }

                closeSpecEditor();
    renderCrmSpecList();
    renderDirectorySubviews();
    saveAllData();
}


        function deleteSpec(id) {
    directoryDb.specialists = directoryDb.specialists.filter(x => x.id !== id);
    showSmsToast("Мастер удалён ");
    renderCrmSpecList();
    renderDirectorySubviews();
    saveAllData();
}



        // ========== КОНТЕНТ-МЕНЕДЖЕР ТОВАРОВ ==========

// === СПИСОК ВСЕХ ТОВАРОВ ДЛЯ АДМИНА ===
function renderCrmProductList() {
    const q = (document.getElementById('crm-search')?.value || '').toLowerCase();
    const container = document.getElementById('crm-product-list');
    let html = '';
    for (const key in productsDb) {
        const p = productsDb[key];
        const text = (p.title + ' ' + p.store).toLowerCase();
        if (q && !text.includes(q)) continue;
        const badge = p.status === 'pending'
            ? '<span class="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">На модерации</span>'
            : '<span class="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Опубликован</span>';
        html += `
            <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                <img src="${p.image}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">
                <div class="flex-1 min-w-0">
                    <h5 class="font-bold text-xs text-slate-800 truncate">${p.title}</h5>
                    <p class="text-[10px] text-slate-400 truncate">${p.price} · ${p.store}</p>
                    ${badge}
                </div>
                <div class="flex flex-col gap-1 shrink-0">
                    <button onclick="openProductEditor('${p.id}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                    <button onclick="deleteProduct('${p.id}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                </div>
            </div>`;
    }
    container.innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Товары не найдены</p>`;
}


// === ОТКРЫТЬ ФОРМУ (пустую для нового ИЛИ с данными для редактирования) ===
function openProductEditor(id) {
     window.editorMode = 'admin';
    const editor = document.getElementById('product-editor');
    if (id && productsDb[id]) {
        const p = productsDb[id];
        document.getElementById('editor-title').innerText = 'Редактировать товар';
        document.getElementById('editor-prod-id').value = id;
        document.getElementById('editor-prod-title').value = p.title;
        document.getElementById('editor-prod-price').value = p.price;
        document.getElementById('editor-prod-store').value = p.store;
        setCategoryDropdown(p.category || '');
        document.getElementById('editor-prod-image').value = p.image;
    } else {
        document.getElementById('editor-title').innerText = 'Новый товар';
        document.getElementById('editor-prod-id').value = '';
        document.getElementById('editor-prod-title').value = '';
        document.getElementById('editor-prod-price').value = '';
        document.getElementById('editor-prod-store').value = '';
        setCategoryDropdown('');
        document.getElementById('editor-prod-image').value = '';
    }
    updateEditorPreview();
    editor.classList.remove('hidden');
    editor.classList.add('flex');
}


// === ЗАКРЫТЬ ФОРМУ ===
function closeProductEditor() {
    const editor = document.getElementById('product-editor');
    editor.classList.add('hidden');
    editor.classList.remove('flex');
}


// === ПРЕВЬЮ ФОТО В ФОРМЕ ===
function updateEditorPreview() {
    const url = document.getElementById('editor-prod-image').value;
    document.getElementById('editor-preview').src = url || 'https://via.placeholder.com/300x150?text=Фото';
}



// ========== КАСТОМНЫЙ ВЫПАДАЮЩИЙ СПИСОК КАТЕГОРИЙ ==========

// Открыть/закрыть список
function toggleCatDropdown(event) {
    if (event) event.stopPropagation();
    const list = document.getElementById('cat-dropdown-list');
    if (list) list.classList.toggle('hidden');
}


// Выбрать категорию из списка
function pickCategory(value, label) {
    // Записываем значение в скрытое поле
    document.getElementById('editor-prod-category').value = value;
    // Показываем название на кнопке
    const labelEl = document.getElementById('cat-dropdown-label');
    labelEl.innerText = label;
    labelEl.className = 'text-slate-800'; // делаем текст тёмным (выбрано)
    // Закрываем список
    document.getElementById('cat-dropdown-list').classList.add('hidden');
}


// Установить категорию при открытии формы (для редактирования)
function setCategoryDropdown(value) {
    const labelEl = document.getElementById('cat-dropdown-label');
    const hidden = document.getElementById('editor-prod-category');
    if (!labelEl || !hidden) return;

    hidden.value = value || '';

    // Карта: значение -> красивое название
    const names = {
        'кухня':'Кухня','спальня':'Спальня','гостиная':'Гостиная','ванная':'Ванная',
        'прихожая':'Прихожая','детская':'Детская','мебель':'Мебель','стройматериалы':'Стройматериалы',
        'отделочные':'Отделочные материалы','сантехника':'Сантехника','аксессуары':'Аксессуары',
        'ландшафт':'Ландшафт','освещение':'Освещение','декор':'Декор','текстиль':'Текстиль'
    };

    if (value && names[value]) {
        labelEl.innerText = names[value];
        labelEl.className = 'text-slate-800';
    } else {
        labelEl.innerText = '— Выберите категорию —';
        labelEl.className = 'text-slate-400';
    }
}


        // === СОХРАНИТЬ ТОВАР ИЗ ФОРМЫ (для админа И для магазина) ===
function saveProductFromEditor() {
    const id = document.getElementById('editor-prod-id').value;
    const title = document.getElementById('editor-prod-title').value.trim();
    const price = document.getElementById('editor-prod-price').value.trim();
    const store = document.getElementById('editor-prod-store').value.trim();
    const category = document.getElementById('editor-prod-category').value.trim();
    const image = document.getElementById('editor-prod-image').value.trim();

    if (!title || !price) return showSmsToast("Заполните название и цену!");

    // Кто сохраняет: магазин или админ?
    const isShop = (window.editorMode === 'shop');

    if (id && productsDb[id]) {
        // --- РЕДАКТИРУЕМ существующий товар ---
        productsDb[id].title = title;
        productsDb[id].price = price;
        productsDb[id].store = store;
        productsDb[id].category = category;
        productsDb[id].image = image;
        // Если правит магазин — товар снова уходит на модерацию
        if (isShop) {
            productsDb[id].status = 'pending';
            showSmsToast("Товар изменён и отправлен на модерацию ");
        } else {
            showSmsToast("Товар обновлён ");
        }
    } else {
        // --- СОЗДАЁМ новый товар ---
        const newId = 'prod-' + Date.now();
        productsDb[newId] = {
            id: newId,
            title,
            price,
            store: store || 'Магазин',
            category: category || 'мебель',
            image: image || 'https://via.placeholder.com/300',
            status: isShop ? 'pending' : 'published',  // магазин → модерация, админ → сразу
            sku: isShop ? 'SHOP' : 'ADM'
        };
        showSmsToast(isShop ? "Товар отправлен на модерацию " : "Товар добавлен ");
    }

    closeProductEditor();

    // Обновляем нужные списки в зависимости от того, кто сохранял
    if (isShop) {
        renderShopMyProducts();   // список товаров магазина
        updateShopStats();        // статистика магазина
    } else {
        renderCrmProductList();   // список товаров админа
    }

    renderProductGrid();          // главная страница приложения
    renderDirectorySubviews();    // витрины магазинов
    saveAllData();                // сохраняем в память
}


// === УДАЛИТЬ ТОВАР ===
        function deleteProduct(id) {
    if (!productsDb[id]) return;
    delete productsDb[id];
    showSmsToast("Товар удалён ");
    renderCrmProductList();
    renderProductGrid();
    saveAllData();
}



// === ОТКЛОНИТЬ (УДАЛИТЬ) ЗАЯВКУ ===
        function adminRejectItem(type, id) {
    if (type === 'products') {
        delete productsDb[id];
    } else if (type === 'directory') {
        directoryDb.specialists = directoryDb.specialists.filter(x => x.id !== id);
    } else if (type === 'vacancies') {
        vacanciesDb = vacanciesDb.filter(x => x.id !== id);
    } else if (type === 'stories') {
        storiesData = storiesData.filter(x => x.id !== id);
    }
    showSmsToast("Заявка отклонена ");
    renderAdminModerationList();
    updateAdminStats();
    renderStories();
    saveAllData();
}


        function adminApproveItem(type, id) {
    if (type === 'products') productsDb[id].status = 'published';
    else if (type === 'directory') directoryDb.specialists.find(x=>x.id===id).status = 'published';
    else if (type === 'vacancies') vacanciesDb.find(x=>x.id===id).status = 'published';
    else if (type === 'stories') { const s = storiesData.find(x=>x.id===id); if (s) s.status = 'published'; }

    showSmsToast("Одобрено и опубликовано!");
    renderAdminModerationList(); updateAdminStats(); renderProductGrid(); renderDirectorySubviews(); renderStories();
    saveAllData();
}
