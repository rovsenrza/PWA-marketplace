/* Промо-слайдер на главной.
   Точки и переключение слайдов #promo-slide-N.
   Классический скрипт (не модуль): функции глобальные, их вызывают inline-обработчики разметки.
   Сборка: плагин legacy-scripts в vite.config.ts (минификация без переименования, хэш в имени). */

let currentPromoIdx = 0;
const totalPromoSlides = 3;

function updatePromoSlider() {
    for (let i = 0; i < totalPromoSlides; i++) {
        const slide = document.getElementById('promo-slide-' + i);
        if (!slide) continue;
        if (i === currentPromoIdx) {
            slide.classList.replace('opacity-0', 'opacity-100');
            slide.classList.replace('z-0', 'z-10');
        } else {
            slide.classList.replace('opacity-100', 'opacity-0');
            slide.classList.replace('z-10', 'z-0');
        }
    }
    const dotsBox = document.getElementById('promo-dots');
    if (!dotsBox) return;
    const dots = dotsBox.children;
    for (let i = 0; i < dots.length; i++) {
        if (i === currentPromoIdx) {
            dots[i].className = 'w-4 h-1.5 bg-white rounded-full transition-all duration-300';
        } else {
            dots[i].className = 'w-1.5 h-1.5 bg-white/50 rounded-full transition-all duration-300';
        }
    }
}

// Листаем вперед
function nextPromoSlide() {
    currentPromoIdx = (currentPromoIdx + 1) % totalPromoSlides;
    updatePromoSlider();
}

// Листаем назад
function prevPromoSlide() {
    currentPromoIdx = (currentPromoIdx - 1 + totalPromoSlides) % totalPromoSlides;
    updatePromoSlider();
}
