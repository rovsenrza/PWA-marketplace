/* Заглушка для битых картинок.
   Стоит в начале <body>, чтобы ловить ошибки загрузки до отрисовки остальных картинок.
   Классический скрипт (не модуль): функции глобальные, их вызывают inline-обработчики разметки.
   Сборка: плагин legacy-scripts в vite.config.ts (минификация без переименования, хэш в имени). */

(function () {
    var placeholder = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#e2e8f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#94a3b8" font-size="18" font-family="system-ui,sans-serif">Фото</text></svg>'
    );
    document.addEventListener("error", function (e) {
        var el = e.target;
        if (!el || el.tagName !== "IMG" || el.dataset.offlineFallback) return;
        el.dataset.offlineFallback = "1";
        el.src = placeholder;
    }, true);
})();
function setAppUi(id) {
    id = 'market';
    var phone = document.getElementById('phone-container');
    if (phone) phone.setAttribute('data-ui', id);
    try { localStorage.setItem('app-ui-skin', id); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', '#FFFFFF');
}
(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setAppUi('market'); });
    } else {
        setAppUi('market');
    }
})();
