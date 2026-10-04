/* Установка PWA.
   Подсказка «Установить приложение» и регистрация service worker.
   Классический скрипт (не модуль): функции глобальные, их вызывают inline-обработчики разметки.
   Сборка: плагин legacy-scripts в vite.config.ts (минификация без переименования, хэш в имени). */

var deferredPwaPrompt = null;

function isPwaStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function pwaUa() {
    return navigator.userAgent || '';
}

function isPwaIOS() {
    var ua = pwaUa();
    return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isPwaInAppBrowser() {
    var ua = pwaUa();
    return /FBAN|FBAV|Instagram|Line\/|Twitter|Telegram|VKAndroid|vk_app|OKApp|Snapchat|YaApp|YandexSearch|GSA\//i.test(ua)
        || (/Android/i.test(ua) && /; wv\)/.test(ua));
}

function pwaDismissedRecently() {
    try {
        var t = parseInt(localStorage.getItem('pwa_install_dismissed') || '0', 10);
        return t && (Date.now() - t) < 14 * 24 * 60 * 60 * 1000;
    } catch (e) { return false; }
}

function showPwaInstallBanner(mode) {
    if (isPwaStandalone() || pwaDismissedRecently()) return;
    var box = document.getElementById('pwa-install-banner');
    var txt = document.getElementById('pwa-install-text');
    var btn = document.getElementById('pwa-install-btn');
    if (!box || !txt || !btn) return;
    box.dataset.mode = mode || 'manual';
    if (mode === 'ios') {
        txt.textContent = 'На iPhone нажмите «Поделиться», затем «На экран „Домой“».';
        btn.textContent = 'Понятно';
    } else if (mode === 'inapp') {
        txt.textContent = 'Откройте эту ссылку в Chrome или Safari — там можно установить приложение на телефон.';
        btn.textContent = 'Понятно';
    } else if (mode === 'android') {
        txt.textContent = 'В Chrome нажмите меню «⋮» справа сверху и выберите «Установить приложение» или «На главный экран».';
        btn.textContent = 'Понятно';
    } else {
        txt.textContent = 'Добавьте Супер-Апп на главный экран — будет открываться как обычное приложение.';
        btn.textContent = 'Установить';
    }
    box.classList.remove('hidden', 'pointer-events-none', 'translate-y-6', 'opacity-0');
    box.classList.add('pwa-show');
}

function hidePwaInstallBanner() {
    var box = document.getElementById('pwa-install-banner');
    if (!box) return;
    box.classList.remove('pwa-show');
    box.classList.add('translate-y-6', 'opacity-0', 'pointer-events-none');
    setTimeout(function () { box.classList.add('hidden'); }, 300);
}

function dismissPwaInstall(remember) {
    hidePwaInstallBanner();
    if (remember) {
        try { localStorage.setItem('pwa_install_dismissed', String(Date.now())); } catch (e) {}
    }
}

function acceptPwaInstall() {
    var box = document.getElementById('pwa-install-banner');
    var mode = box && box.dataset.mode;
    if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        deferredPwaPrompt.userChoice.then(function (choice) {
            deferredPwaPrompt = null;
            hidePwaInstallBanner();
            if (choice && choice.outcome === 'accepted') {
                try { localStorage.setItem('pwa_install_dismissed', String(Date.now())); } catch (e) {}
            }
        }).catch(function () {});
        return;
    }
    if (mode === 'native') {
        showPwaInstallBanner(isPwaIOS() ? 'ios' : 'android');
        return;
    }
    dismissPwaInstall(true);
}

function maybeShowPwaInstallBanner() {
    if (isPwaStandalone() || pwaDismissedRecently()) return;
    var onb = document.getElementById('screen-onboarding');
    if (onb && !onb.classList.contains('hidden') && !onb.classList.contains('-translate-y-full')) return;
    var box = document.getElementById('pwa-install-banner');
    if (box && box.classList.contains('pwa-show')) return;
    if (deferredPwaPrompt) {
        showPwaInstallBanner('native');
        return;
    }
    if (isPwaInAppBrowser()) {
        showPwaInstallBanner('inapp');
        return;
    }
    if (isPwaIOS()) {
        showPwaInstallBanner('ios');
        return;
    }
    showPwaInstallBanner('native');
}

function schedulePwaInstallBanner() {
    setTimeout(maybeShowPwaInstallBanner, 700);
    setTimeout(maybeShowPwaInstallBanner, 2500);
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
}
if (document.readyState === 'complete') schedulePwaInstallBanner();
else window.addEventListener('load', schedulePwaInstallBanner);
window.addEventListener('pageshow', function () { setTimeout(maybeShowPwaInstallBanner, 400); });

window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPwaPrompt = e;
    showPwaInstallBanner('native');
});

window.addEventListener('appinstalled', function () {
    hidePwaInstallBanner();
    try { localStorage.setItem('pwa_install_dismissed', String(Date.now())); } catch (e) {}
});
