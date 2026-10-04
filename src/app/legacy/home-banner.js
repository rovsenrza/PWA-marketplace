/* Баннер-полоса на главной.
   Перебирает пути к banner.jpg и скрывает блок, если файла нет.
   Классический скрипт (не модуль): функции глобальные, их вызывают inline-обработчики разметки.
   Сборка: плагин legacy-scripts в vite.config.ts (минификация без переименования, хэш в имени). */

(function () {
    var img = document.getElementById('home-brand-banner');
    var wrap = document.getElementById('home-brand-banner-wrap');
    if (!img) return;
    var paths = ['banner.jpg', 'assets/banner.jpg', './banner.jpg', './assets/banner.jpg'];
    var i = 0;
    img.onload = function () { img.style.display = 'block'; };
    img.onerror = function () {
        if (i >= paths.length) {
            if (wrap) wrap.style.display = 'none';
            return;
        }
        img.src = paths[i++];
    };
    img.src = paths[i++];
})();
