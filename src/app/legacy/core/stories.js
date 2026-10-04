/* Сторис.
   Лента историй на главной, просмотр, таймеры, пауза удержанием.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


        // ---Данные сторис --(фото и изменения) ---
function getDefaultStories() {
    return SEED.stories();
}


// 24 часа только у новых сторис из редактора (id story-*). Базовые сторис главной не истекают.
function cleanOldStories() {
    const day = 24 * 60 * 60 * 1000;
    const now = Date.now();
    storiesData = storiesData.filter(s => {
        if (!s || !(s.slides && s.slides.length) && !s.image) return false;
        if (!String(s.id || '').startsWith('story-')) return true;
        if (!s.createdAt) return true;
        return (now - s.createdAt) < day;
    });
    if (!storiesData.length) storiesData = getDefaultStories();
}


        // Прокрутка ленты сторис стрелками
function scrollStories(direction) {
    const scroller = document.getElementById('stories-scroll');
    if (!scroller) return;
    const amount = 200; // на сколько пикселей листать
    scroller.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
}


// Прокрутка ленты сторис перетаскиванием мышью (для ПК)
function enableStoriesDragScroll() {
    const scroller = document.getElementById('stories-scroll');
    if (!scroller) return;
    let isDown = false, startX, scrollLeft;

    scroller.addEventListener('mousedown', (e) => {
        isDown = true;
        scroller.classList.add('cursor-grabbing');
        startX = e.pageX - scroller.offsetLeft;
        scrollLeft = scroller.scrollLeft;
    });
    scroller.addEventListener('mouseleave', () => { isDown = false; scroller.classList.remove('cursor-grabbing'); });
    scroller.addEventListener('mouseup', () => { isDown = false; scroller.classList.remove('cursor-grabbing'); });
    scroller.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - scroller.offsetLeft;
        const walk = (x - startX) * 1.5;
        scroller.scrollLeft = scrollLeft - walk;
    });
}


        // Сториз
                function renderStories() {
    cleanOldStories();
    const container = document.getElementById('stories-container');
    if (!container) return;

    let html = '';
    const visibleStories = storiesData.filter(s => s.status === 'published' || !s.status);
    visibleStories.forEach((s, index) => {
        const divider = (index === 1) 
            ? `<div class="flex-shrink-0 w-px h-14 bg-slate-200 mx-1 self-center"></div>` 
            : '';

        const ringColor = s.isLifehack 
            ? 'from-amber-400 to-orange-500' 
            : 'from-[#1e6091] to-[#2a7fb8]';

        html += `
            ${divider}
            <div onclick="openStory('${s.id}')" class="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer active:scale-95 transition-transform" style="width:64px">
                <div class="p-[2.5px] rounded-full bg-gradient-to-tr ${ringColor}">
                    <div class="p-[2px] bg-white rounded-full">
                        <img src="${s.slides ? s.slides[0] : s.image}" class="w-14 h-14 rounded-full object-cover">
                    </div>
                </div>
                <span class="text-[10px] font-bold text-slate-600 truncate w-full text-center">${escHtml(s.name)}</span>
            </div>`;
    });

    container.innerHTML = html;
}


        // Переменные для листания
let currentStory = null;

let slideIndex = 0;

let storyTimer = null;

let storyDuration = 4000;

// 4 секунды на слайд
       let storyPaused = false;



        // Открыть сторис
function openStory(id) {
    const s = storiesData.find(x => x.id === id);
    if (!s) return;

    currentStory = s;
    slideIndex = 0;

    document.getElementById('sv-name').textContent = s.name;

    renderSlide();

    const phone = document.getElementById('phone-container');
    const v = document.getElementById('story-viewer');
    if (phone && v && v.parentElement !== phone) phone.appendChild(v);
    v.classList.remove('hidden');
    v.classList.add('flex');
    const status = document.getElementById('phone-status-bar');
    if (status) status.classList.replace('text-black', 'text-white');
}


                       // Показать текущий слайд (фото ИЛИ видео)
function renderSlide() {
    const slides = currentStory.slides || [currentStory.image];
    const currentUrl = slides[slideIndex];

    const imgEl = document.getElementById('sv-image');
    const videoEl = document.getElementById('sv-video');

    const avatar = document.getElementById('sv-avatar');
    if (avatar) avatar.src = slides[0];

    // Рисуем полоски прогресса
    const progress = document.getElementById('sv-progress');
    if (progress) {
        progress.innerHTML = '';
        for (let i = 0; i < slides.length; i++) {
            const bar = document.createElement('div');
            bar.className = 'flex-1 h-1 rounded-full bg-white/30 overflow-hidden';
            const fill = document.createElement('div');
            fill.className = 'story-bar-fill';
            if (i < slideIndex) fill.style.width = '100%';
            else fill.style.width = '0%';
            bar.appendChild(fill);
            progress.appendChild(bar);
        }
    }

    // Проверяем — это видео или фото?
    if (isVideoUrl(currentUrl)) {
        // ===== ВИДЕО =====
        imgEl.classList.add('hidden');
        videoEl.classList.remove('hidden');
        videoEl.src = currentUrl;
        videoEl.currentTime = 0;
        videoEl.muted = false; // включаем звук
        videoEl.play().catch(() => {
            // Если браузер блокирует звук — играем без звука
            videoEl.muted = true;
            videoEl.play().catch(() => {});
        });
        startVideoStoryTimer(); // таймер по длине видео
    } else {
        // ===== ФОТО =====
        videoEl.pause();
        videoEl.classList.add('hidden');
        videoEl.removeAttribute('src');
        imgEl.classList.remove('hidden');
        imgEl.src = currentUrl;
        startStoryTimer(); // обычный таймер на 4 сек
    }
}


// Определяет: ссылка — это видео?
function isVideoUrl(url) {
    if (!url) return false;
    // Загруженное с устройства видео (data:video/mp4;base64,...) — сразу видео
    if (url.startsWith('data:video')) return true;
    // Обычные ссылки — проверяем расширение
    const u = url.toLowerCase().split('?')[0]; // убираем параметры после ?
    return u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov') || u.endsWith('.m4v');
}


// Таймер для видео — ждём его окончания и переходим дальше
function startVideoStoryTimer() {
    clearTimeout(storyTimer);
    storyPaused = false;

    const videoEl = document.getElementById('sv-video');
    const progress = document.getElementById('sv-progress');
    if (!progress || !videoEl) return;

    const bars = progress.querySelectorAll('.story-bar-fill');
    const currentFill = bars[slideIndex];

    // Заполняем полоску по мере проигрывания видео
    videoEl.ontimeupdate = () => {
        if (!videoEl.duration) return;
        const percent = (videoEl.currentTime / videoEl.duration) * 100;
        if (currentFill) {
            currentFill.style.transition = 'none';
            currentFill.style.width = percent + '%';
        }
    };

    // Когда видео закончилось — следующий слайд
    videoEl.onended = () => {
        nextStorySlide();
    };
}


// Запуск таймера автоперехода + анимация текущей полоски
function startStoryTimer() {
    clearTimeout(storyTimer);
    storyPaused = false;

    const progress = document.getElementById('sv-progress');
    if (!progress) return;

    // Находим полоску текущего слайда и запускаем её заполнение
    const bars = progress.querySelectorAll('.story-bar-fill');
    const currentFill = bars[slideIndex];
    if (currentFill) {
        currentFill.style.transition = 'none';
        currentFill.style.width = '0%';
        // Небольшая задержка, чтобы браузер применил width:0 перед анимацией
        requestAnimationFrame(() => {
            currentFill.classList.add('filling');
            currentFill.style.transitionDuration = storyDuration + 'ms';
            currentFill.style.width = '100%';
        });
    }

    // Через storyDuration переключаем на следующий слайд
    storyTimer = setTimeout(() => {
        nextStorySlide();
    }, storyDuration);
}


        // Следующее фото сториса (вправо)
function nextStorySlide() {
    const slides = currentStory.slides || [currentStory.image];
    if (slideIndex < slides.length - 1) {
        slideIndex++;
        renderSlide();
    } else {
        closeStory();
    }
}


// Предыдущее фото сториса (влево)
function prevStorySlide() {
    if (slideIndex > 0) {
        slideIndex--;
        renderSlide();
    }
}


// Предыдущее фото (влево)
function prevSlide() {
    if (slideIndex > 0) {
        slideIndex--;
        renderSlide();
    }
}


        // Закрыть сторис
function closeStory() {
    clearTimeout(storyTimer); // останавливаем таймер
    // Останавливаем видео, если оно играло
    const videoEl = document.getElementById('sv-video');
    if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.classList.add('hidden');
    }
    const v = document.getElementById('story-viewer');
    v.classList.add('hidden');
    v.classList.remove('flex');
    const status = document.getElementById('phone-status-bar');
    if (status) status.classList.replace('text-white', 'text-black');
}


// ===== ПАУЗА ПРИ УДЕРЖАНИИ ЭКРАНА =====

// Поставить на паузу (палец нажат)
function pauseStory() {
    storyPaused = true;
    const currentUrl = (currentStory && currentStory.slides) ? currentStory.slides[slideIndex] : '';
    if (isVideoUrl(currentUrl)) {
        // Пауза видео
        const videoEl = document.getElementById('sv-video');
        if (videoEl) videoEl.pause();
    } else {
        // Пауза фото: останавливаем таймер и замораживаем полоску
        clearTimeout(storyTimer);
        const progress = document.getElementById('sv-progress');
        if (progress) {
            const bars = progress.querySelectorAll('.story-bar-fill');
            const currentFill = bars[slideIndex];
            if (currentFill) {
                // Фиксируем текущую ширину полоски
                const w = getComputedStyle(currentFill).width;
                const parentW = getComputedStyle(currentFill.parentElement).width;
                currentFill.style.transition = 'none';
                currentFill.style.width = w;
                // Запоминаем сколько прошло (для продолжения)
                window.photoPauseRatio = parseFloat(w) / parseFloat(parentW);
            }
        }
    }
}


// Снять с паузы (палец отпущен)
function resumeStory() {
    if (!storyPaused) return;
    storyPaused = false;
    const currentUrl = (currentStory && currentStory.slides) ? currentStory.slides[slideIndex] : '';
    if (isVideoUrl(currentUrl)) {
        // Продолжаем видео
        const videoEl = document.getElementById('sv-video');
        if (videoEl) videoEl.play().catch(() => {});
    } else {
        // Продолжаем фото с того места, где остановились
        const ratio = window.photoPauseRatio || 0;
        const remaining = storyDuration * (1 - ratio);
        const progress = document.getElementById('sv-progress');
        if (progress) {
            const bars = progress.querySelectorAll('.story-bar-fill');
            const currentFill = bars[slideIndex];
            if (currentFill) {
                requestAnimationFrame(() => {
                    currentFill.classList.add('filling');
                    currentFill.style.transitionDuration = remaining + 'ms';
                    currentFill.style.width = '100%';
                });
            }
        }
        clearTimeout(storyTimer);
        storyTimer = setTimeout(() => { nextStorySlide(); }, remaining);
    }
}
