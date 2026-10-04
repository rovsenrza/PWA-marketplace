/* Компании, портфолио, вакансии.
   Каталог компании, прайс и команда, портфолио дизайнеров, карточка вакансии.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */

const COMPANY_PRICE = {
    'штукатурка': 'от 450 ₽/м²',
    'плитка': 'от 1 200 ₽/м²',
    'электрика': 'от 380 ₽/т.т.',
    'сантехника': 'от 2 800 ₽',
    'гипсокартон': 'от 650 ₽/м²',
    'покраска': 'от 280 ₽/м²',
    'дизайн': 'от 1 200 ₽/м²',
    'дизайн-проект': 'от 25 000 ₽',
    'черновая отделка': 'от 4 500 ₽/м²',
    'натяжные потолки': 'от 890 ₽/м²',
    'демонтаж': 'от 180 ₽/м²',
    'чистовая отделка': 'от 3 200 ₽/м²',
    'стяжка': 'от 520 ₽/м²',
    'двери': 'от 8 500 ₽',
    'отделка': 'от 2 400 ₽/м²'
};

function companyServiceIcon(name) {
    const n = String(name || '').toLowerCase();
    const ico = function (d) {
        return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="' + d + '"/></svg>';
    };
    if (n.indexOf('плит') !== -1) return ico('M4 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z M4 10h16M10 4v16');
    if (n.indexOf('штукатур') !== -1) return ico('M7 21h10M5 3h14M7 3v18M17 3v18M5 8h14M5 16h14');
    if (n.indexOf('электр') !== -1) return ico('M13 2L3 14h8l-1 8 10-12h-8l1-8z');
    if (n.indexOf('сантех') !== -1) return ico('M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1M8 12a4 4 0 108 0 4 4 0 00-8 0z');
    if (n.indexOf('гипс') !== -1) return ico('M4 4h16v16H4zM9 4v16M4 12h16');
    if (n.indexOf('покрас') !== -1) return ico('M15.5 4.5l4 4-9.5 9.5H6v-4L15.5 4.5zM5 20h14');
    if (n.indexOf('дизайн') !== -1) return ico('M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586');
    if (n.indexOf('демонт') !== -1) return ico('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16');
    if (n.indexOf('стяжк') !== -1 || n.indexOf('ламинат') !== -1) return ico('M4 6h16M4 12h16M4 18h16');
    if (n.indexOf('потол') !== -1) return ico('M4 8h16M8 8v12M16 8v12M4 20h16');
    if (n.indexOf('двер') !== -1) return ico('M8 3h8a2 2 0 012 2v16H6V5a2 2 0 012-2zM15 12h.01');
    if (n.indexOf('чернов') !== -1) return ico('M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z');
    return ico('M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z');
}

function companyTeamFor(c) {
    if (c && Array.isArray(c.team) && c.team.length) return c.team;
    const h = (typeof shopHash === 'function') ? shopHash(c && c.name) : 1;
    const dirs = ['Алексей Орлов', 'Виктор Смирнов', 'Павел Никитин'];
    const mans = ['Анна Волкова', 'Мария Соколова', 'Екатерина Лебедева'];
    const dirPhotos = [
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400'
    ];
    const manPhotos = [
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
    ];
    const i = h % 3;
    return [
        { role: 'Директор', name: dirs[i], photo: dirPhotos[i] },
        { role: 'Менеджер', name: mans[i], photo: manPhotos[i] }
    ];
}

function fillCompanyTeam(c) {
    const box = document.getElementById('company-catalog-team');
    if (!box) return;
    const team = companyTeamFor(c);
    box.innerHTML = team.map(function (p) {
        const photo = p.photo || '';
        return '<div class="co-team" onclick="openAvatarModal(\'' + photo + '\')">' +
            '<img src="' + photo + '" alt="">' +
            '<div class="px-3 py-2.5">' +
            '<p class="text-[10px] font-extrabold uppercase tracking-[0.12em] text-sky-200/80">' + p.role + '</p>' +
            '<p class="text-[13px] font-bold text-white mt-0.5 leading-tight">' + escHtml(p.name) + '</p>' +
            '</div></div>';
    }).join('');
}

function fillCompanyPrice(c) {
    const svcWrap = document.getElementById('company-catalog-services-wrap');
    const svc = document.getElementById('company-catalog-services');
    if (!svcWrap || !svc) return;
    const list = (c && c.services) ? c.services : [];
    if (!list.length) {
        svc.innerHTML = '';
        svcWrap.classList.add('hidden');
        return;
    }
    svc.innerHTML = list.map(function (name) {
        const key = String(name || '').toLowerCase();
        const price = COMPANY_PRICE[key] || 'по смете';
        return '<button type="button" class="co-price-row" onclick="shopRequestService(\'' + escJsArg(name) + '\')">' +
            '<span class="co-price-ico">' + companyServiceIcon(name) + '</span>' +
            '<span class="flex-1 min-w-0"><span class="block text-[13px] font-bold text-white leading-tight">' + escHtml(name) + '</span><span class="block text-[11px] text-white/50 mt-0.5">Работа под ключ</span></span>' +
            '<span class="text-[12px] font-extrabold text-sky-200 shrink-0">' + price + '</span>' +
            '</button>';
    }).join('');
    svcWrap.classList.remove('hidden');
}

const COMPANY_ROOMS = ['Ванная', 'Прихожая', 'Кухня', 'Гостиная', 'Спальня'];

const COMPANY_ROOM_PHOTOS = {
    'Ванная': [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
        'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600',
        'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600',
        'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=600'
    ],
    'Прихожая': [
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600',
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
        'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600'
    ],
    'Кухня': [
        'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=600',
        'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600',
        'https://images.unsplash.com/photo-1484154214963-01d56f8c276c?w=600',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600'
    ],
    'Гостиная': [
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
        'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600'
    ],
    'Спальня': [
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600',
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600',
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'
    ]
};

function setCompanyRoom(room) {
    window.coRoom = room || 'Ванная';
    const name = window.coPortfolioCompany;
    const c = (typeof companiesProfileDb === 'object' && companiesProfileDb[name]) ? companiesProfileDb[name] : {};
    fillCompanyPortfolio(c);
}

function fillCompanyPortfolio(c) {
    const wrap = document.getElementById('company-catalog-gallery-wrapper');
    const roomsEl = document.getElementById('company-catalog-rooms');
    const gal = document.getElementById('company-catalog-gallery');
    if (!wrap || !gal) return;
    const room = window.coRoom || 'Ванная';
    const stock = COMPANY_ROOM_PHOTOS[room] || COMPANY_ROOM_PHOTOS['Ванная'];
    const own = (c && c.photos) ? c.photos.slice() : [];
    const roomIdx = COMPANY_ROOMS.indexOf(room);
    const photos = stock.slice();
    if (own[roomIdx]) photos.unshift(own[roomIdx]);
    else if (own[0] && room === 'Гостиная') photos.unshift(own[0]);
    const seen = {};
    const uniq = photos.filter(function (u) {
        if (!u || seen[u]) return false;
        seen[u] = true;
        return true;
    }).slice(0, 4);
    if (roomsEl) {
        roomsEl.innerHTML = COMPANY_ROOMS.map(function (r) {
            return '<button type="button" class="co-room' + (r === room ? ' on' : '') + '" onclick="setCompanyRoom(\'' + r + '\')">' + r + '</button>';
        }).join('');
    }
    gal.className = 'grid grid-cols-2 gap-2.5';
    gal.innerHTML = uniq.map(function (url) {
        return '<img src="' + url + '" onclick="openAvatarModal(\'' + url + '\')" class="w-full h-32 object-cover rounded-2xl cursor-pointer hover:opacity-80 transition border border-white/10">';
    }).join('');
    wrap.classList.remove('hidden');
    wrap.removeAttribute('hidden');
}

function openCompanyCatalogModal(compName) { 
    const c = companiesProfileDb[compName]; if (!c) return; 
    document.getElementById('company-catalog-title').innerText = c.name; 
    document.getElementById('company-catalog-banner').src = c.banner; 
    document.getElementById('company-catalog-desc').innerText = c.description; 
    document.getElementById('company-catalog-addr').innerText = c.address; 
    const site = c.site || '';
    document.getElementById('company-catalog-site').innerText = site.replace(/^https?:\/\//, '') || '—';
    document.getElementById('company-catalog-site').href = site || '#';
    document.getElementById('company-catalog-tg').href = c.telegram || '#';
    const badge = document.getElementById('company-catalog-badge');
    if (badge) badge.textContent = c.kind === 'remont' ? 'Ремонт под ключ' : 'Официальный партнер';
    fillCompanyTeam(c);
    fillCompanyPrice(c);
    window.coPortfolioCompany = compName;
    window.coRoom = 'Ванная';
    fillCompanyPortfolio(c);
    
    if(c.video) {
        document.getElementById('company-catalog-video-container').classList.remove('hidden');
        document.getElementById('company-catalog-video').src = c.video;
    } else { document.getElementById('company-catalog-video-container').classList.add('hidden'); }
     document.getElementById('company-catalog-modal').classList.remove('hidden'); 
}

function closeCompanyCatalogModal() { document.getElementById('company-catalog-modal').classList.add('hidden'); document.getElementById('company-catalog-video').src = ''; }


   // --- ПОРТФОЛИО СПЕЦИАЛИСТОВ И ДИЗАЙНЕРОВ ---
    function openAvatarFullscreen(src) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:pointer;';
    overlay.innerHTML = `<img src="${src}" style="max-width:90%;max-height:90%;border-radius:12px;">`;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
}

function openPortfolioModal(cat, id) {
    const item = directoryDb[cat].find(i => i.id === id); if (!item) return;
    currentPortfolioItem = item;
    const modal = document.getElementById('portfolio-modal');
    const isDes = cat === 'designers';
    if (modal) modal.classList.toggle('des-mode', isDes);
    const descEl = document.getElementById('portfolio-description');
    if (descEl) {
        descEl.className = isDes
            ? 'leading-relaxed'
            : 'text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100';
    }
    const avatarEl = document.getElementById('portfolio-avatar');
if (item.avatarPhoto) {
    avatarEl.innerHTML = `<img src="${item.avatarPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;cursor:pointer;" onclick="openAvatarFullscreen('${item.avatarPhoto}')">`;
} else {
    avatarEl.innerText = item.avatar;
}
    document.getElementById('portfolio-name').innerText = item.name;
    document.getElementById('portfolio-title').innerText = item.title;
    document.getElementById('portfolio-description').innerText = item.description;
    document.getElementById('portfolio-hours').innerText = item.hours || 'Пн-Пт 9-18';
    document.getElementById('portfolio-site-link').href = item.site || '#';
    document.getElementById('portfolio-tg-link').href = item.telegram || '#';
    document.getElementById('portfolio-max-link').href = item.max || '#';
    const hero = document.getElementById('portfolio-hero-img');
    if (hero) {
        const cover = item.cover || (item.gallery && item.gallery.interior && item.gallery.interior[0]) || (item.gallery && item.gallery.landscape && item.gallery.landscape[0]) || (Array.isArray(item.gallery) ? item.gallery[0] : '') || item.avatarPhoto || '';
        hero.src = cover;
        hero.onclick = function () { if (cover) openLightbox(cover); };
    }
    let list = (item.prices || []).slice();
    if (isDes) {
        const have = list.map(function (p) { return String(p.service || '').toLowerCase(); }).join(' ');
        if (have.indexOf('планиров') === -1) list.splice(1, 0, { service: 'Планировка', cost: 'от 1 200 ₽ / м²' });
        if (have.indexOf('визуал') === -1 && have.indexOf('3d') === -1) list.push({ service: '3D-визуализация', cost: 'от 8 000 ₽ / зона' });
        if (have.indexOf('надзор') === -1) list.push({ service: 'Авторский надзор', cost: 'от 15 000 ₽ / мес.' });
    }
    let pricesHtml = '';
    list.forEach(p => {
        pricesHtml += isDes
            ? `<div class="des-price-row"><span class="des-price-name">${escHtml(p.service)}</span><span class="des-price-cost">${p.cost}</span></div>`
            : `<div class="flex justify-between"><span class="text-slate-600">${escHtml(p.service)}</span><span class="font-bold text-slate-800">${p.cost}</span></div>`;
    });
    document.getElementById('portfolio-prices').innerHTML = pricesHtml;

    const tabs = document.getElementById('gallery-categories');
    if (cat === 'designers') {
        tabs.classList.remove('hidden');
        filterPortfolioGallery(/ландшафт/i.test(item.title || '') ? 'landscape' : 'interior');
    } else {
        tabs.classList.add('hidden');
        let galHtml = '';
        if(item.gallery) item.gallery.forEach((g) => { galHtml += `<div class="h-24 bg-slate-100 rounded-lg overflow-hidden border"><img src="${g}" onclick="openLightbox('${g}')" class="w-full h-full object-cover cursor-pointer"></div>`; });
        const gal = document.getElementById('portfolio-gallery');
        gal.className = 'grid grid-cols-2 gap-2';
        gal.innerHTML = galHtml;
    }
    document.getElementById('portfolio-phone-text').innerText = 'Показать телефонный номер';
    document.getElementById('portfolio-modal').classList.remove('hidden');
}

function closePortfolioModal() {
    const modal = document.getElementById('portfolio-modal');
    if (modal) { modal.classList.add('hidden'); modal.classList.remove('des-mode'); }
    currentPortfolioItem = null;
}


function revealPortfolioPhone() { 
    if (currentPortfolioItem) {
        document.getElementById('portfolio-phone-text').innerText = currentPortfolioItem.phone || '+7 (000) 000-00-00'; 
    }
}


function filterPortfolioGallery(category) {
    if(!currentPortfolioItem || !currentPortfolioItem.gallery) return;
    const des = document.getElementById('portfolio-modal') && document.getElementById('portfolio-modal').classList.contains('des-mode');
    ['interior','exterior','landscape'].forEach(c => {
        const el = document.getElementById(`btn-gal-${c}`);
        if (!el) return;
        if (des) el.className = (c===category) ? 'co-room on' : 'co-room';
        else el.className = (c===category) ? 'text-[10px] bg-[#1e6091] text-white px-3 py-1 rounded-full font-bold' : 'text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold';
    });
    const images = currentPortfolioItem.gallery[category] || [];
    const gal = document.getElementById('portfolio-gallery');
    if (des) {
        gal.className = 'des-collage';
        gal.innerHTML = images.map(function (img, i) {
            const cls = 'c' + (i % 9);
            return '<img src="' + img + '" class="' + cls + '" onclick="openLightbox(\'' + img + '\')" alt="">';
        }).join('');
    } else {
        gal.className = 'grid grid-cols-2 gap-2';
        gal.innerHTML = images.map(img => `<div class="w-full aspect-video bg-slate-100 rounded-xl overflow-hidden border col-span-2"><img src="${img}" onclick="openLightbox('${img}')" class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"></div>`).join('');
    }
}


// --- ОКНО ВАКАНСИЙ (С фото, сайтом и т.д.) ---
function openVacancyModal(id) {
    const vac = vacanciesDb.find(v => v.id === id); if (!vac) return;
    currentVacancyItem = vac;
    document.getElementById('vacancy-title').innerText = vac.title;
    document.getElementById('vacancy-company').innerText = vac.company;
    
    document.getElementById('vacancy-company-photo').src = vac.companyPhoto || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600';
    document.getElementById('vacancy-site-link').href = vac.site || '#';
    
    document.getElementById('vacancy-desc').innerText = vac.desc;
    document.getElementById('vacancy-req').innerText = vac.req;
    document.getElementById('vacancy-hours').innerText = vac.hours || 'Полный день';
    document.getElementById('vacancy-salary').innerText = vac.salary;
    
    document.getElementById('vacancy-phone-text').innerText = 'Показать телефонный номер';
    document.getElementById('vacancy-modal').classList.remove('hidden');
}

function closeVacancyModal() { 
    document.getElementById('vacancy-modal').classList.add('hidden'); 
    currentVacancyItem = null; 
    document.getElementById('vacancy-company-photo').src = ''; 
}

function revealVacancyPhone() { 
    if (currentVacancyItem) {
        document.getElementById('vacancy-phone-text').innerText = currentVacancyItem.phone || '+7 (000) 000-00-00'; 
    }
}
