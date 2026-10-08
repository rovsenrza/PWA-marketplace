/* Тема до первой отрисовки (app и admin).
   localStorage ui-theme = system | light | dark → html[data-theme]; общий ключ для обеих страниц.
   Классический скрипт (не модуль): функции глобальные, их вызывают inline-обработчики разметки.
   Сборка: плагин legacy-scripts в vite.config.ts (минификация без переименования, хэш в имени). */

/* Тема: system | light | dark — ставим до отрисовки, чтобы не мигало */
(function () {
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    function readPref() { try { return localStorage.getItem('ui-theme') || 'system'; } catch (e) { return 'system'; } }
    function resolve(p) { return p === 'light' || p === 'dark' ? p : (mq && mq.matches ? 'dark' : 'light'); }
    function apply() {
        var pref = readPref(), t = resolve(pref), root = document.documentElement;
        root.setAttribute('data-theme', t);
        root.setAttribute('data-theme-pref', pref);
        var m = document.querySelector('meta[name="theme-color"]');
        if (m) m.setAttribute('content', t === 'dark' ? '#121211' : '#FFFFFF');
        document.querySelectorAll('[data-theme-opt]').forEach(function (b) {
            b.classList.toggle('on', b.getAttribute('data-theme-opt') === pref);
            b.setAttribute('aria-pressed', b.getAttribute('data-theme-opt') === pref ? 'true' : 'false');
        });
    }
    window.setUiTheme = function (pref) {
        try { localStorage.setItem('ui-theme', pref); } catch (e) {}
        apply();
    };
    window.toggleUiTheme = function () {
        window.setUiTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    };
    if (mq) {
        var onChange = function () { if (readPref() === 'system') apply(); };
        if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
    }
    window.addEventListener('storage', function (e) { if (e.key === 'ui-theme') apply(); });
    document.addEventListener('DOMContentLoaded', apply);
    apply();
})();
