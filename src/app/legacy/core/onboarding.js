/* Онбординг.
   Слайды первого запуска и их редактирование.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


// ==========================================
// УПРАВЛЕНИЕ ОНБОРДИНГОМ (ЕДИНАЯ ЛОГИКА)
// ==========================================

function pickOnboardingSlides() {
    let all = (onboardingData && Array.isArray(onboardingData)) ? onboardingData.filter(s => s && s.image) : [];

    if (all.length === 0) {
        all = [
            { title: 'Кухня Вашей Мечты', desc: 'Рассчитайте стоимость и получите подарок.', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600', badge: 'АКЦИЯ', badgeColor: 'bg-amber-500' },
            { title: 'Современные Решения', desc: 'Готовые кухонные гарнитуры напрямую от фабрик.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', badge: 'ПРЕМИУМ', badgeColor: 'bg-blue-600' },
            { title: 'Мебель Люкс Класса', desc: 'Премиальные дизайнерские кровати.', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600', badge: 'ХИТ', badgeColor: 'bg-emerald-600' },
            { title: 'Надежные мастера', desc: 'Проверенные бригады для вашего ремонта.', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', badge: 'СЕРВИС', badgeColor: 'bg-red-600' }
        ];
        try { localStorage.removeItem('meb_onb_offset'); } catch (e) {}
    }

    onboardingSlides = [];
    let offset = parseInt(localStorage.getItem('meb_onb_offset') || '0') || 0;
    if (offset < 0 || offset >= all.length) offset = 0;

    const ONBOARDING_SHOW = 4;
    const count = Math.min(ONBOARDING_SHOW, all.length);
    for (let i = 0; i < count; i++) {
        onboardingSlides.push(all[(offset + i) % all.length]);
    }

    const nextOffset = (offset + count) % all.length;
    try { localStorage.setItem('meb_onb_offset', String(nextOffset)); } catch (e) {}
}


function renderOnboarding() {
    pickOnboardingSlides();
    const cont = document.getElementById('onb-slides-container');
    const dotsBox = document.getElementById('onb-dots-container');
    const screen = document.getElementById('screen-onboarding');
    if (!cont || !dotsBox || !screen) return;

    state.currentSlide = 1;
    state.totalSlides = onboardingSlides.length;

    let slidesHtml = '';
    let dotsHtml = '';
    for (let i = 0; i < onboardingSlides.length; i++) {
        const s = onboardingSlides[i];
        const hidden = i === 0 ? '' : 'hidden';
        const badgeHtml = s.badge
            ? `<div class="absolute top-3 left-3 onb-badge ${s.badgeColor || 'bg-[#E5195E]'} text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">${s.badge}</div>`
            : '';
        
        slidesHtml += `
            <div id="onb-slide-${i + 1}" class="slide-item w-full ${hidden} flex flex-col items-center animate-scaleUp">
                <div class="w-full max-w-[300px] h-[380px] bg-slate-100 rounded-3xl overflow-hidden shadow-md mb-4 relative border border-slate-100">
                    <img src="${escHtml(s.image)}" class="w-full h-full object-cover">
                    ${badgeHtml}
                </div>
                <h2 class="text-xl font-bold text-slate-900 mb-1.5">${escHtml(s.title || '')}</h2>
                <p class="text-xs text-slate-500 max-w-[280px] leading-relaxed">${escHtml(s.desc || '')}</p>
            </div>`;

        const dotActive = i === 0 ? 'bg-[#1e6091] w-6' : 'bg-slate-200 w-2.5';
        dotsHtml += `<button type="button" id="dot-${i + 1}" onclick="goToOnboardingSlide(${i + 1})" class="h-2.5 ${dotActive} rounded-full transition-all duration-300 shrink-0" aria-label="Слайд ${i + 1}"></button>`;
    }

    cont.innerHTML = slidesHtml;
    dotsBox.innerHTML = dotsHtml;
    screen.classList.remove('hidden');
    screen.classList.remove('-translate-y-full');
}


function setOnboardingDot(el, active) {
    if (!el) return;
    el.className = active
        ? 'h-2.5 w-6 rounded-full bg-[#1e6091] transition-all duration-300 shrink-0'
        : 'h-2.5 w-2.5 rounded-full bg-slate-200 transition-all duration-300 shrink-0';
}


function goToOnboardingSlide(n) {
    n = parseInt(n, 10);
    if (!n || n < 1 || n > state.totalSlides || n === state.currentSlide) return;
    const curSlide = document.getElementById('onb-slide-' + state.currentSlide);
    const curDot = document.getElementById('dot-' + state.currentSlide);
    if (curSlide) curSlide.classList.add('hidden');
    setOnboardingDot(curDot, false);
    state.currentSlide = n;
    const nextSl = document.getElementById('onb-slide-' + n);
    const nextDot = document.getElementById('dot-' + n);
    if (nextSl) nextSl.classList.remove('hidden');
    setOnboardingDot(nextDot, true);
}


function closeOnboarding() {
    const screen = document.getElementById('screen-onboarding');
    if (screen) {
        screen.classList.add('-translate-y-full');
        setTimeout(function () { screen.classList.add('hidden'); }, 500);
    }
    if (typeof maybeShowPwaInstallBanner === 'function') {
        setTimeout(maybeShowPwaInstallBanner, 600);
    }
}


function nextSlide() {
    if (state.currentSlide < state.totalSlides) {
        goToOnboardingSlide(state.currentSlide + 1);
        return;
    }
    closeOnboarding();
}


function saveOnbFromEditor() {
    const indexVal = document.getElementById('onb-editor-index').value;
    const title = document.getElementById('onb-editor-title-input').value.trim();
    const desc = document.getElementById('onb-editor-desc').value.trim();
    const badge = document.getElementById('onb-editor-badge').value.trim();
    const badgeColorNode = document.getElementById('onb-editor-badgecolor');
    const badgeColor = badgeColorNode ? badgeColorNode.value : 'bg-amber-500';
    const image = document.getElementById('onb-editor-image').value.trim();

    if (!title || !image) return showSmsToast("Заполните заголовок и фото!");

    const slideObj = { title, desc, image, badge, badgeColor };

    if (indexVal !== '') {
        onboardingData[parseInt(indexVal)] = slideObj;
        showSmsToast("Слайд обновлён!");
    } else {
        if (onboardingData.length >= 20) return showSmsToast("Максимум 20 слайдов!");
        onboardingData.push(slideObj);
        showSmsToast("Слайд добавлен!");
    }

    closeOnbEditor();
    renderCrmOnbList();
    saveAllData();
}

// Промо (один баннер, карусели больше нет)
function nextPromo() { /* карусель отключена — один баннер */ }
