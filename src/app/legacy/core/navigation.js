/* Навигация.
   Вкладки таббара, разделы справочника, возврат в справочник.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


       function switchTab(id) {
    // 1. Прячем все главные вкладки приложения
    ['catalog','directory','cart','favorites','profile'].forEach(t => { 
        const v = document.getElementById(`view-${t}`);
        if (v) v.classList.add('hidden');
        
        const btn = document.getElementById(`tab-${t==='catalog'?'home':t}`);
        if (btn) {
            btn.className = (t === 'cart')
                ? 'relative flex flex-col items-center justify-center flex-1 py-1 text-slate-400'
                : 'flex flex-col items-center justify-center flex-1 py-1 text-slate-400';
        }
    });
    
    // 2. Прячем ВСЕ подуровни справочника
    const subviews = [
        'product_categories', 'shops', 'specialists', 'spec-private', 'spec-companies', 'spectech', 'landscaping', 'other', 'other-profiles', 'designers', 
        'companies', 'jobs', 'calculator', 'specific-calc', 
        'realestate', 're-agencies', 're-commercial', 're-catalog', 'building_materials', 
        'finishing_materials', 'furniture', 'plumbing', 
        'accessories', 'landscape', 'tools', 'lifehacks', 'lifehack-article'
    ];
    subviews.forEach(sv => {
        const el = document.getElementById(`subview-${sv}`);
        if (el) el.classList.add('hidden');
    });
    if (typeof closeCommSheets === 'function') closeCommSheets();
    if (typeof closeSpectechModal === 'function') closeSpectechModal();
    if (typeof closeLandscapeStudio === 'function') closeLandscapeStudio();

    // 3. Прячем экран товаров категории
    const catProdView = document.getElementById('view-category-products');
    if (catProdView) catProdView.classList.add('hidden');
    window.currentOpenedCategory = null;

    // 4. Показываем нужную главную вкладку
    const view = document.getElementById(`view-${id}`);
    if (view) view.classList.remove('hidden');

    // ★ КРИТИЧЕСКИ ВАЖНО: Если открываем вкладку каталога/справочника, принудительно показываем его корень
    if (id === 'directory') {
        const dirView = document.getElementById('view-directory');
        if (dirView) dirView.classList.remove('hidden');
        if (typeof renderDirectorySubviews === 'function') {
            renderDirectorySubviews();
        }
    }
    
    // Подсветка активной кнопки в нижнем меню
    const activeBtn = document.getElementById(`tab-${id==='catalog'?'home':id}`);
    if (activeBtn) {
        activeBtn.className = (id === 'cart')
            ? 'relative flex flex-col items-center justify-center flex-1 py-1 text-blue-600'
            : 'flex flex-col items-center justify-center flex-1 py-1 text-blue-600';
    }

    const scroll = document.getElementById('main-scroll-container');
    if (scroll) scroll.scrollTop = 0;

    if (id === 'catalog' && typeof renderHomeShopPromo === 'function') renderHomeShopPromo();
    if (id === 'favorites') renderFavorites();
    if (id === 'cart') { renderCart(); renderBuyerOrders(); }
}

     function switchDirectoryView(id) { 
    // Прячем главный экран справочника
    const dirView = document.getElementById('view-directory');
    if (dirView) dirView.classList.add('hidden'); 
    
    // Скрываем абсолютно все подразделы справочника
    const subviews = [
        'product_categories', 'shops', 'specialists', 'spec-private', 'spec-companies', 'spectech', 'landscaping', 'other', 'other-profiles', 'designers', 
        'companies', 'jobs', 'calculator', 'specific-calc', 
        'realestate', 're-agencies', 're-commercial', 're-catalog', 'building_materials', 
        'finishing_materials', 'furniture', 'plumbing', 
        'accessories', 'landscape', 'tools', 'lifehacks', 'lifehack-article'
    ];
    
    subviews.forEach(sub => {
        const el = document.getElementById(`subview-${sub}`);
        if (el) el.classList.add('hidden');
    });

    // Показываем запрашиваемый подраздел
    const target = document.getElementById(`subview-${id}`);
    if (target) {
        target.classList.remove('hidden');
    }

    // Генерируем списки (чтобы они не были пустыми)
    if (typeof renderDirectorySubviews === 'function') {
        renderDirectorySubviews();
    }
    if (id === 'lifehacks' && typeof renderLifehacksFeed === 'function') {
        renderLifehacksFeed();
    }
    if (id === 'spectech' && typeof renderSpectech === 'function') {
        renderSpectech();
    }
    if (id === 'other-profiles' && typeof renderOtherProfiles === 'function') {
        renderOtherProfiles();
    }
    if (id === 'landscaping' && typeof renderLandscapingList === 'function') {
        renderLandscapingList();
    }
    if (id === 're-commercial' && typeof renderCommListings === 'function') {
        if (typeof closeCommSheets === 'function') closeCommSheets();
        renderCommListings();
        renderCommTypeOptions();
        syncCommChips();
    } else if (typeof closeCommSheets === 'function') {
        closeCommSheets();
    }
    
    // Возвращаем скролл наверх
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) scrollContainer.scrollTop = 0; 
}


       function backToDirectory() { 
    ['product_categories', 'shops', 'specialists', 'spec-private', 'spec-companies', 'spectech', 'landscaping', 'other', 'other-profiles', 'designers', 'companies', 'jobs', 'calculator', 'specific-calc', 'realestate', 're-agencies', 're-commercial', 're-catalog', 'building_materials', 'finishing_materials', 'furniture', 'plumbing', 'accessories', 'landscape', 'tools', 'lifehacks', 'lifehack-article'].forEach(sv => {
        const el = document.getElementById(`subview-${sv}`);
        if (el) el.classList.add('hidden');
    }); 
    const dirView = document.getElementById('view-directory');
    if (dirView) dirView.classList.remove('hidden');
    if (typeof renderLifehacksHome === 'function') renderLifehacksHome();
    if (typeof closeSpectechModal === 'function') closeSpectechModal();
    if (typeof closeLandscapeStudio === 'function') closeLandscapeStudio();
}
