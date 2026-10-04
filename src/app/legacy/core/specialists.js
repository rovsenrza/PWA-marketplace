/* Специалисты.
   Частные мастера и компании полного цикла, фильтр по ремеслу.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


function specCraftOf(spec) {
    if (spec && spec.craft) return spec.craft;
    const t = String(spec && spec.title || '').toLowerCase();
    if (t.includes('плиточ')) return 'Плиточник';
    if (t.includes('электр')) return 'Электрик';
    if (t.includes('сантех')) return 'Сантехник';
    if (t.includes('штукатур') || t.includes('маляр')) return 'Штукатур';
    if (t.includes('отделоч')) return 'Отделочник';
    if (t.includes('гипсокарт')) return 'Гипсокартонщик';
    if (t.includes('монтаж')) return 'Монтажник';
    if (t.includes('кровл')) return 'Кровельщик';
    if (t.includes('плотн')) return 'Плотник';
    const raw = String(spec && spec.title || 'Мастер').split('/')[0].trim();
    return raw || 'Мастер';
}


function setSpecCraftFilter(craft) {
    window.specCraftFilter = craft || 'все';
    renderSpecialistsList();
}


function renderSpecialistsList() {
    const specContainer = document.getElementById('specialists-list-container');
    const chipsEl = document.getElementById('spec-craft-chips');
    const countEl = document.getElementById('spec-count');
    const published = (directoryDb && directoryDb.specialists ? directoryDb.specialists : []).filter(s => s.status === 'published');
    const crafts = [];
    published.forEach(s => {
        const c = specCraftOf(s);
        if (c && crafts.indexOf(c) === -1) crafts.push(c);
    });
    const active = window.specCraftFilter || 'все';
    if (chipsEl) {
        chipsEl.innerHTML = ['Все'].concat(crafts).map(label => {
            const val = label === 'Все' ? 'все' : label;
            const on = active === val ? ' on' : '';
            return `<button type="button" onclick="setSpecCraftFilter('${val}')" class="comm-chip${on}">${label}</button>`;
        }).join('');
    }
    const filtered = active === 'все' ? published : published.filter(s => specCraftOf(s) === active);
    if (countEl) countEl.textContent = filtered.length ? (filtered.length + ' мастеров') : 'Мастера';
    if (!specContainer) return;
    if (!filtered.length) {
        specContainer.innerHTML = '<div class="py-12 text-center text-sm text-slate-400">Мастеров в этой категории пока нет</div>';
        return;
    }
    specContainer.innerHTML = filtered.map(spec => {
        const craft = specCraftOf(spec);
        return `
        <div onclick="openPortfolioModal('specialists', '${spec.id}')" class="p-4 rounded-2xl border border-slate-100 bg-white space-y-2 shadow-sm cursor-pointer hover:border-slate-300 transition-all mb-3">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3 min-w-0">
                    <div class="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-[#1e6091] text-white font-bold text-xs flex-shrink-0">${spec.avatarPhoto ? `<img src="${spec.avatarPhoto}" class="w-full h-full object-cover">` : spec.avatar}</div>
                    <div class="min-w-0">
                        <h4 class="font-medium text-slate-800 text-sm serif-font truncate">${escHtml(spec.name)}</h4>
                        <p class="text-[10px] text-slate-400">${escHtml(spec.title)}</p>
                    </div>
                </div>
                <span class="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-[#e8f1fc] text-[#1e6091]">${craft}</span>
            </div>
            <p class="text-xs text-slate-500 line-clamp-2">${escHtml(spec.description)}</p>
            <span class="text-[10px] text-[#1e6091] font-bold block text-right">Посмотреть портфолио</span>
        </div>`;
    }).join('');
}


function renderSpecCompaniesList() {
    const el = document.getElementById('spec-companies-list');
    if (!el) return;
    const firms = [];
    for (const compName in companiesProfileDb) {
        const c = companiesProfileDb[compName];
        if (!c || c.status !== 'published' || c.kind !== 'remont') continue;
        firms.push({ name: compName, c: c });
    }
    if (!firms.length) {
        el.innerHTML = '<div class="py-12 text-center text-sm text-slate-400">Компаний пока нет</div>';
        return;
    }
    el.innerHTML = firms.map(function (item, i) {
        const c = item.c;
        return '<div onclick="openCompanyCatalogModal(\'' + escJsArg(item.name) + '\')" class="sc-firm">' +
            '<div class="sc-firm-body">' +
                '<div>' +
                    '<h4 class="sc-firm-title">' + escHtml(item.name) + '</h4>' +
                    '<p class="sc-firm-co">Ремонт под ключ</p>' +
                    '<p class="sc-firm-desc">' + (escHtml(c.description || '')) + '</p>' +
                '</div>' +
                '<span class="sc-firm-go">Открыть профиль</span>' +
            '</div>' +
            '<div class="sc-firm-photo">' +
                '<img src="' + (escHtml(c.banner || '')) + '" alt="">' +
            '</div>' +
        '</div>';
    }).join('');
}
