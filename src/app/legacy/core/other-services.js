/* Прочие услуги.
   Клининг и другие профили раздела «Прочее».
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */

const OTHER_META = {
    cleaning: { title: 'Клининг', sub: 'Уборка квартир, офисов и после ремонта' },
    install: { title: 'Монтаж и установка техники', sub: 'Бытовая техника, сплиты и встраиваемые системы' },
    waste: { title: 'Вывоз мусора и сырья', sub: 'Контейнер, самосвал, строительный бой' },
    movers: { title: 'Грузчики', sub: 'Переезд, подъём на этаж и разгрузка' }
};

function openOtherProfiles(cat) {
    window.otherCat = cat || 'cleaning';
    switchDirectoryView('other-profiles');
}

function renderOtherProfiles() {
    const cat = window.otherCat || 'cleaning';
    const meta = OTHER_META[cat] || OTHER_META.cleaning;
    const titleEl = document.getElementById('other-profiles-title');
    const subEl = document.getElementById('other-profiles-sub');
    const listEl = document.getElementById('other-profiles-list');
    if (titleEl) titleEl.textContent = meta.title;
    if (subEl) subEl.textContent = meta.sub;
    if (!listEl) return;
    const items = (directoryDb[cat] || []).filter(function (s) { return s.status === 'published'; });
    if (!items.length) {
        listEl.innerHTML = '<div class="py-12 text-center text-sm text-slate-400">Анкет пока нет</div>';
        return;
    }
    listEl.innerHTML = items.map(function (spec) {
        return `<div onclick="openPortfolioModal('${cat}', '${spec.id}')" class="p-4 rounded-2xl border border-[#d7e6f2] bg-white space-y-2 shadow-[0_8px_24px_rgba(30,96,145,0.08)] cursor-pointer active:scale-[0.99] transition-transform">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center space-x-3 min-w-0">
                    <div class="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-[#1e6091] text-white font-bold text-xs flex-shrink-0">${spec.avatarPhoto ? `<img src="${spec.avatarPhoto}" class="w-full h-full object-cover">` : spec.avatar}</div>
                    <div class="min-w-0">
                        <h4 class="font-bold text-slate-800 text-sm truncate">${spec.name}</h4>
                        <p class="text-[10px] text-[#1e6091] font-semibold">${spec.title}</p>
                    </div>
                </div>
            </div>
            <p class="text-xs text-slate-500 line-clamp-2">${spec.description}</p>
            <span class="text-[10px] text-[#1e6091] font-bold block text-right">Открыть анкету</span>
        </div>`;
    }).join('');
}
