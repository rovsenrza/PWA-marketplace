/* =====================================================================
   Супер-Апп · движение и жесты (в духе SwiftUI)
   1. Переходы между экранами: вкладки — растворение, вглубь — push справа, назад — слева.
   2. Открытие/закрытие оверлеев: страницы (push), шиты (снизу), диалоги (масштаб), сторис (из кружка).
      Закрытие не задерживает код приложения: состояние меняется сразу,
      а уходит визуальная копия («призрак»), которая сама удаляется.
   3. Свайп влево для удаления в списках: [data-swipe-fn="имяФункции"][data-swipe-arg="id"].
   4. Уведомления — шит с детентами (средний/большой), тянется за ручку, смахивается вниз.
   ===================================================================== */
(function () {
    'use strict';

    var phone = document.getElementById('phone-container');
    if (!phone || !window.Element || !Element.prototype.animate) return;

    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    function calm() { return !!(reduced && reduced.matches); }

    var EASE_PUSH = 'cubic-bezier(.32, .72, 0, 1)';   // кривая навигации iOS
    var EASE_OUT = 'cubic-bezier(.22, 1, .36, 1)';
    var EASE_SPRING = 'cubic-bezier(.34, 1.36, .64, 1)';

    /* ---------- что как анимировать ---------- */
    var MAIN_VIEWS = { 'view-catalog': 1, 'view-directory': 1, 'view-cart': 1, 'view-favorites': 1, 'view-profile': 1 };
    var PUSH_IDS = {
        'product-modal': 1, 'shop-catalog-modal': 1, 'company-catalog-modal': 1, 'spectech-modal': 1,
        'vacancy-modal': 1, 'portfolio-modal': 1, 'ls-studio-modal': 1, 'assistant-sheet': 1
    };
    var SKIP_IDS = { 'home-shop-slides': 1, 'screen-onboarding': 1, 'sv-video': 1, 'sv-image': 1, 'lg-notif-sheet': 1 };

    function isView(el) {
        var id = el.id || '';
        return !!(MAIN_VIEWS[id] || id.indexOf('subview-') === 0 || id === 'view-category-products');
    }

    function overlayKind(el) {
        var id = el.id || '';
        if (SKIP_IDS[id] || el.closest('#story-viewer') && id !== 'story-viewer') return null;
        if (id === 'story-viewer') return 'story';
        if (id === 'lightbox') return 'zoom';
        if (id === 'pm-about-sheet') return 'rise';
        if (PUSH_IDS[id]) return 'push';
        var c = ' ' + (el.getAttribute('class') || '') + ' ';
        if (c.indexOf(' inset-0 ') === -1 || (c.indexOf(' absolute ') === -1 && c.indexOf(' fixed ') === -1)) return null;
        if (c.indexOf('promo-slide') !== -1) return null;
        if (c.indexOf(' justify-end ') !== -1) return 'sheet';
        if (c.indexOf(' items-center ') !== -1) return 'dialog';
        return 'fade';
    }

    function panelOf(el) {
        for (var n = el.firstElementChild; n; n = n.nextElementSibling) {
            if (n.tagName === 'svg' || n.getAttribute('aria-hidden') === 'true' || n.tagName === 'SCRIPT') continue;
            return n;
        }
        return null;
    }

    function play(el, frames, opts) {
        if (!el) return null;
        try { return el.animate(frames, Object.assign({ fill: 'none' }, opts)); } catch (e) { return null; }
    }

    /* ---------- сторис: откуда открыли ---------- */
    var storyOrigin = null;
    document.addEventListener('click', function (e) {
        var t = e.target.closest && e.target.closest('[onclick^="openStory("]');
        if (!t) return;
        var img = t.querySelector('img') || t;
        storyOrigin = img.getBoundingClientRect();
    }, true);

    function storyFrames(el, opening) {
        var p = phone.getBoundingClientRect();
        var r = storyOrigin;
        var from = 'scale(.6)';
        var origin = '50% 50%';
        if (r && r.width) {
            var cx = r.left + r.width / 2 - p.left, cy = r.top + r.height / 2 - p.top;
            origin = cx + 'px ' + cy + 'px';
            from = 'scale(' + Math.max(0.06, r.width / p.width).toFixed(3) + ')';
        }
        el.style.transformOrigin = origin;
        var a = { transform: from, borderRadius: '50%', opacity: 0.4 };
        var b = { transform: 'scale(1)', borderRadius: '0px', opacity: 1 };
        return opening ? [a, b] : [b, a];
    }

    /* ---------- вход ---------- */
    function enter(el, kind) {
        if (calm()) { play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 120 }); return; }
        var panel;
        switch (kind) {
            case 'push':
                play(el, [{ transform: 'translateX(100%)', boxShadow: '-20px 0 40px rgba(0,0,0,0)' },
                          { transform: 'translateX(0)', boxShadow: '-20px 0 40px rgba(0,0,0,.18)' }],
                     { duration: 420, easing: EASE_PUSH });
                dimUnder(0.94);
                break;
            case 'sheet':
                panel = panelOf(el);
                play(el, [{ backgroundColor: 'rgba(0,0,0,0)' }, {}], { duration: 260, easing: 'ease-out' });
                play(panel, [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 420, easing: EASE_PUSH });
                break;
            case 'dialog':
                panel = panelOf(el);
                play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
                play(panel, [{ transform: 'scale(.9)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 380, easing: EASE_SPRING });
                break;
            case 'rise':
                play(el, [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 420, easing: EASE_PUSH });
                break;
            case 'zoom':
                play(el, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 260, easing: EASE_OUT });
                break;
            case 'story':
                play(el, storyFrames(el, true), { duration: 380, easing: EASE_PUSH });
                break;
            default:
                play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
        }
    }

    /* фон под push-страницей чуть уходит назад, как в UINavigationController */
    function dimUnder(scale) {
        var main = document.getElementById('main-scroll-container');
        if (!main || calm()) return;
        play(main, [{ transform: 'translateX(0)', opacity: 1 }, { transform: 'translateX(-22%)', opacity: scale }, { transform: 'translateX(0)', opacity: 1 }],
             { duration: 520, easing: EASE_PUSH });
    }

    /* ---------- выход: визуальная копия уезжает, оригинал уже закрыт ---------- */
    var scrollMemo = new WeakMap();
    document.addEventListener('scroll', function (e) {
        if (e.target && e.target.nodeType === 1) scrollMemo.set(e.target, e.target.scrollTop);
    }, { capture: true, passive: true });

    function ghost(el, oldClass, kind) {
        if (calm()) return;
        /* id сохраняются, чтобы стили по #id применились к копии; оригинал стоит раньше в DOM,
           поэтому getElementById по-прежнему находит его */
        var clone = el.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute('data-lg-ghost', '');
        clone.className = oldClass.replace(/(^|\s)hidden(\s|$)/g, ' ');
        if (kind === 'push' || kind === 'story') clone.style.setProperty('z-index', '200', 'important');
        clone.style.pointerEvents = 'none';
        clone.querySelectorAll('video, iframe, audio').forEach(function (m) { m.remove(); });
        el.parentNode.insertBefore(clone, el.nextSibling);
        /* вернуть прокрутку, чтобы копия не прыгала наверх */
        var src = el.querySelectorAll('*'), dst = clone.querySelectorAll('*');
        for (var i = 0; i < src.length && i < dst.length; i++) {
            var y = scrollMemo.get(src[i]);
            if (y) dst[i].scrollTop = y;
        }
        var anim, panel;
        switch (kind) {
            case 'push':
                anim = play(clone, [{ transform: 'translateX(0)' }, { transform: 'translateX(100%)' }], { duration: 340, easing: EASE_PUSH, fill: 'forwards' });
                var main = document.getElementById('main-scroll-container');
                play(main, [{ transform: 'translateX(-18%)', opacity: 0.92 }, { transform: 'translateX(0)', opacity: 1 }], { duration: 340, easing: EASE_PUSH });
                break;
            case 'sheet':
                panel = panelOf(clone);
                anim = play(clone, [{}, { backgroundColor: 'rgba(0,0,0,0)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
                play(panel, [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], { duration: 300, easing: EASE_PUSH, fill: 'forwards' });
                break;
            case 'dialog':
                anim = play(clone, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
                play(panelOf(clone), [{ transform: 'scale(1)' }, { transform: 'scale(.94)' }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
                break;
            case 'rise':
                anim = play(clone, [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], { duration: 300, easing: EASE_PUSH, fill: 'forwards' });
                break;
            case 'story':
                anim = play(clone, storyFrames(clone, false), { duration: 300, easing: EASE_PUSH, fill: 'forwards' });
                break;
            default:
                anim = play(clone, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-in', fill: 'forwards' });
        }
        var done = function () { if (clone.parentNode) clone.remove(); };
        if (anim) { anim.onfinish = done; anim.oncancel = done; }
        setTimeout(done, 700);
    }

    /* ---------- переходы между экранами ---------- */
    var history = [];
    function viewEntered(el) {
        var id = el.id;
        var dir;
        if (history.length > 1 && history[history.length - 2] === id) { history.pop(); dir = 'back'; }
        else if (MAIN_VIEWS[id]) { dir = history.length && !MAIN_VIEWS[history[history.length - 1]] && history.indexOf(id) !== -1 ? 'back' : 'tab'; history = [id]; }
        else { if (history[history.length - 1] !== id) history.push(id); dir = 'push'; }
        if (calm()) { play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 120 }); return; }
        if (dir === 'tab') play(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: EASE_OUT });
        else if (dir === 'push') play(el, [{ opacity: 0, transform: 'translateX(28%)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EASE_PUSH });
        else play(el, [{ opacity: 0, transform: 'translateX(-22%)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: EASE_PUSH });
    }

    function hasHidden(cls) { return /(^|\s)hidden(\s|$)/.test(cls || ''); }

    new MutationObserver(function (records) {
        var seen = new Set();
        records.forEach(function (r) {
            var el = r.target;
            if (seen.has(el) || el.nodeType !== 1 || el.hasAttribute && el.hasAttribute('data-lg-ghost') || !el.id && !/inset-0/.test(el.getAttribute('class') || '')) return;
            var was = hasHidden(r.oldValue), now = el.classList.contains('hidden');
            if (was === now) return;
            seen.add(el);
            if (isView(el)) { if (!now) viewEntered(el); return; }
            var kind = overlayKind(el);
            if (!kind) return;
            if (!now) enter(el, kind);
            else ghost(el, r.oldValue || '', kind);
        });
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });

    var bootId = ['view-catalog'];
    history = bootId;

    /* =================================================================
       Свайп для удаления (List .onDelete)
       ================================================================= */
    var openRow = null;
    /* строка оборачивается снаружи: её собственные стили не меняются,
       обёртка держит красную кнопку «Удалить» позади */
    function contentOf(wrap) { return wrap.querySelector(':scope > .lg-swipe-content'); }
    function closeRow(wrap, instant) {
        if (!wrap) return;
        var c = contentOf(wrap);
        c.style.transition = instant ? 'none' : 'transform .32s ' + EASE_PUSH;
        c.style.transform = '';
        wrap.classList.remove('is-open');
        if (openRow === wrap) openRow = null;
    }

    function runDelete(wrap, fn, arg) {
        var c = contentOf(wrap);
        wrap.style.height = wrap.offsetHeight + 'px';
        c.style.transition = 'transform .24s ' + EASE_PUSH;
        c.style.transform = 'translateX(-110%)';
        setTimeout(function () {
            wrap.classList.add('is-gone');
            wrap.style.height = '0px';
            setTimeout(function () {
                if (openRow === wrap) openRow = null;
                if (typeof window[fn] === 'function') window[fn](arg);
                if (wrap.isConnected) wrap.remove();
            }, 260);
        }, 180);
    }

    function enhanceRow(row) {
        if (row.__lgSwipe || !row.parentNode) return;
        row.__lgSwipe = true;
        var fn = row.getAttribute('data-swipe-fn'), arg = row.getAttribute('data-swipe-arg');
        var wrap = document.createElement('div');
        wrap.className = 'lg-swipe';
        var cs = getComputedStyle(row);
        wrap.style.borderRadius = cs.borderRadius;
        wrap.style.marginTop = cs.marginTop; wrap.style.marginBottom = cs.marginBottom;
        row.style.marginTop = '0'; row.style.marginBottom = '0';
        row.parentNode.insertBefore(wrap, row);
        var action = document.createElement('button');
        action.type = 'button';
        action.className = 'lg-swipe-action';
        action.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg><span>Удалить</span>';
        action.addEventListener('click', function (e) { e.stopPropagation(); runDelete(wrap, fn, arg); });
        wrap.appendChild(action);
        wrap.appendChild(row);
        row.classList.add('lg-swipe-content');

        var x0 = 0, y0 = 0, dx = 0, base = 0, dragging = false, decided = false, moved = false, pid = null, openW = 88;
        row.addEventListener('pointerdown', function (e) {
            if (e.button) return;
            if (openRow && openRow !== wrap) closeRow(openRow);
            x0 = e.clientX; y0 = e.clientY; dx = 0; decided = false; dragging = false; moved = false; pid = e.pointerId;
            openW = action.offsetWidth || 88;
            base = wrap.classList.contains('is-open') ? -openW : 0;
        });
        row.addEventListener('pointermove', function (e) {
            if (e.pointerId !== pid) return;
            var mx = e.clientX - x0, my = e.clientY - y0;
            if (!decided) {
                if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
                decided = true;
                dragging = Math.abs(mx) > Math.abs(my) * 1.2 && (mx < 0 || base < 0);
                if (dragging) { try { row.setPointerCapture(pid); } catch (err) {} row.style.transition = 'none'; }
            }
            if (!dragging) return;
            moved = true;
            var w = wrap.offsetWidth;
            dx = Math.min(0, base + mx);
            if (dx < -w * 0.85) dx = -w * 0.85 + (dx + w * 0.85) * 0.25;   /* резинка */
            row.style.transform = 'translateX(' + dx + 'px)';
            wrap.classList.toggle('is-full', dx < -w * 0.5);
            action.style.width = Math.max(openW, -dx) + 'px';
        });
        function release(e) {
            if (e.pointerId !== pid) return;
            pid = null;
            if (!dragging) return;
            dragging = false;
            var w = wrap.offsetWidth;
            wrap.classList.remove('is-full');
            if (dx < -w * 0.5) { action.style.width = w + 'px'; runDelete(wrap, fn, arg); return; }
            action.style.width = '';
            if (dx < -openW * 0.5) {
                row.style.transition = 'transform .4s ' + EASE_SPRING;
                row.style.transform = 'translateX(' + (-openW) + 'px)';
                wrap.classList.add('is-open'); openRow = wrap;
            } else closeRow(wrap);
        }
        row.addEventListener('pointerup', release);
        row.addEventListener('pointercancel', release);
        /* после жеста карточка не открывается; тап по открытой строке — закрыть */
        row.addEventListener('click', function (e) {
            if (moved || wrap.classList.contains('is-open')) {
                e.stopPropagation(); e.preventDefault();
                if (!moved) closeRow(wrap);
                moved = false;
            }
        }, true);
    }

    document.addEventListener('pointerdown', function (e) {
        if (openRow && !openRow.contains(e.target)) closeRow(openRow);
    }, true);

    function scanSwipe(root) {
        if (!root || root.nodeType !== 1) return;
        if (root.classList && root.classList.contains('lg-swipe') || root.closest && root.closest('[data-lg-ghost]')) return;
        if (root.hasAttribute('data-swipe-fn')) enhanceRow(root);
        root.querySelectorAll && root.querySelectorAll('[data-swipe-fn]').forEach(enhanceRow);
    }
    new MutationObserver(function (records) {
        records.forEach(function (r) { r.addedNodes.forEach(scanSwipe); });
    }).observe(document.body, { childList: true, subtree: true });
    scanSwipe(document.body);

    /* =================================================================
       Уведомления — шит SwiftUI (.presentationDetents([.medium, .large]))
       ================================================================= */
    var NOTIF_KEY = 'meb_notif_dismissed', SEEN_KEY = 'meb_notif_seen';
    function readSet(k) { try { return new Set(JSON.parse(localStorage.getItem(k) || '[]')); } catch (e) { return new Set(); } }
    function writeSet(k, s) { try { localStorage.setItem(k, JSON.stringify(Array.from(s))); } catch (e) {} }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

    /* только реальные события приложения: заказы покупателя, корзина, свежие сторис */
    function collectNotifications() {
        var list = [];
        try {
            var orders = (typeof marketplace !== 'undefined' && marketplace.storeOrders) || [];
            orders.slice().sort(function (a, b) { return b.createdAt - a.createdAt; }).slice(0, 10).forEach(function (o) {
                var label = typeof soStatusLabel === 'function' ? soStatusLabel(o.status) : o.status;
                list.push({ id: 'ord-' + o.id + '-' + o.status, kind: 'order', title: o.storeId + ': ' + label, text: 'Заказ из корзины', at: o.updatedAt || o.createdAt, go: "switchTab('cart')" });
            });
        } catch (e) {}
        try {
            var items = typeof getCartItems === 'function' ? getCartItems() : [];
            if (items.length) {
                var stores = {}; items.forEach(function (i) { stores[i.storeId] = 1; });
                var n = Object.keys(stores).length;
                list.push({ id: 'cart-' + items.length + '-' + n, kind: 'cart', title: 'В корзине ' + items.length + ' ' + plural(items.length, 'товар', 'товара', 'товаров'), text: 'Отправьте заказ ' + (n > 1 ? n + ' магазинам' : 'менеджеру магазина'), at: Date.now(), go: "switchTab('cart')" });
            }
        } catch (e) {}
        try {
            var stories = (typeof storiesData !== 'undefined' && storiesData) || [];
            stories.filter(function (s) { return s.status === 'published' || !s.status; }).forEach(function (s) {
                list.push({ id: 'story-' + s.id, kind: 'story', title: s.isLifehack ? 'Новый лайфхак' : s.name, text: s.isLifehack ? 'Советы по ремонту в историях' : 'Новая история магазина', img: (s.slides && s.slides[0]) || s.image, at: s.createdAt || null, go: "openStory('" + s.id + "')" });
            });
        } catch (e) {}
        var gone = readSet(NOTIF_KEY);
        return list.filter(function (n) { return !gone.has(n.id); });
    }
    function plural(n, a, b, c) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : (m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c); }
    function when(t) {
        if (!t) return 'сегодня';
        var d = (Date.now() - t) / 60000;
        if (d < 1) return 'сейчас';
        if (d < 60) return Math.round(d) + ' мин';
        if (d < 1440) return Math.round(d / 60) + ' ч';
        return Math.round(d / 1440) + ' дн';
    }
    var ICONS = {
        order: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
        cart: '<path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.3 2.3c-.6.6-.2 1.7.7 1.7H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>'
    };

    function updateBell() {
        var dot = document.querySelector('.lg-bell .lg-dot');
        if (!dot) return;
        var seen = readSet(SEEN_KEY);
        var unread = collectNotifications().some(function (n) { return !seen.has(n.id); });
        dot.style.display = unread ? '' : 'none';
    }

    var sheetRoot = null, sheet = null, detent = 'medium';
    function build() {
        sheetRoot = document.createElement('div');
        sheetRoot.id = 'lg-notif-sheet';
        sheetRoot.className = 'lg-sheet-root';
        sheetRoot.hidden = true;
        sheetRoot.innerHTML =
            '<div class="lg-sheet-scrim"></div>' +
            '<section class="lg-sheet" role="dialog" aria-modal="true" aria-labelledby="lg-notif-title">' +
                '<div class="lg-sheet-grab" aria-hidden="true"><i></i></div>' +
                '<header class="lg-sheet-head">' +
                    '<button type="button" class="lg-sheet-btn" data-act="clear">Очистить</button>' +
                    '<h2 id="lg-notif-title">Уведомления</h2>' +
                    '<button type="button" class="lg-sheet-btn lg-sheet-btn--done" data-act="close">Готово</button>' +
                '</header>' +
                '<div class="lg-sheet-body"><div class="lg-notif-list"></div></div>' +
            '</section>';
        phone.appendChild(sheetRoot);
        sheet = sheetRoot.querySelector('.lg-sheet');
        sheetRoot.querySelector('.lg-sheet-scrim').addEventListener('click', closeNotifications);
        sheetRoot.querySelector('[data-act="close"]').addEventListener('click', closeNotifications);
        sheetRoot.querySelector('[data-act="clear"]').addEventListener('click', function () {
            var gone = readSet(NOTIF_KEY);
            collectNotifications().forEach(function (n) { gone.add(n.id); });
            writeSet(NOTIF_KEY, gone);
            var rows = sheetRoot.querySelectorAll('.lg-notif-row');
            rows.forEach(function (r, i) { play(r, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(-30%)' }], { duration: 220, delay: i * 30, easing: EASE_PUSH, fill: 'forwards' }); });
            setTimeout(renderList, 240 + rows.length * 30);
        });
        bindDrag();
    }

    function renderList() {
        var box = sheetRoot.querySelector('.lg-notif-list');
        var items = collectNotifications();
        sheetRoot.querySelector('[data-act="clear"]').style.visibility = items.length ? '' : 'hidden';
        if (!items.length) {
            box.innerHTML = '<div class="lg-notif-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3C7.7 6.2 6 8.4 6 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg><p>Новых уведомлений нет</p><span>Здесь появятся статусы заказов и новые истории магазинов</span></div>';
            updateBell();
            return;
        }
        box.innerHTML = items.map(function (n) {
            var ico = n.img
                ? '<img src="' + esc(n.img) + '" alt="">'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[n.kind] || ICONS.order) + '</svg>';
            return '<div class="lg-notif-row" data-swipe-fn="dismissNotification" data-swipe-arg="' + esc(n.id) + '" data-go="' + esc(n.go) + '">' +
                '<span class="lg-notif-ico lg-notif-ico--' + n.kind + '">' + ico + '</span>' +
                '<span class="lg-notif-copy"><b>' + esc(n.title) + '</b><span>' + esc(n.text) + '</span></span>' +
                '<time>' + when(n.at) + '</time></div>';
        }).join('');
        box.querySelectorAll('.lg-notif-row').forEach(function (row) {
            row.addEventListener('click', function () {
                var go = row.getAttribute('data-go');
                closeNotifications();
                /* действие — после ухода шита */
                setTimeout(function () { try { (new Function(go))(); } catch (e) {} }, 220);
            });
        });
        var seen = readSet(SEEN_KEY);
        items.forEach(function (n) { seen.add(n.id); });
        writeSet(SEEN_KEY, seen);
        updateBell();
    }

    window.dismissNotification = function (id) {
        var gone = readSet(NOTIF_KEY); gone.add(id); writeSet(NOTIF_KEY, gone);
        var row = sheetRoot && sheetRoot.querySelector('.lg-notif-row[data-swipe-arg="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
        if (row) (row.closest('.lg-swipe') || row).remove();
        if (sheetRoot && !sheetRoot.querySelector('.lg-notif-row')) renderList();
    };

    function detentY(d) {
        var h = phone.clientHeight;
        return d === 'large' ? 0 : Math.round(h * 0.42);
    }
    function setY(y, anim) {
        sheet.style.transition = anim ? 'transform .46s ' + EASE_PUSH : 'none';
        sheet.style.transform = 'translateY(' + y + 'px)';
        var h = phone.clientHeight;
        var k = Math.max(0, Math.min(1, 1 - y / h));
        sheetRoot.querySelector('.lg-sheet-scrim').style.opacity = String(Math.min(1, k * 1.4));
        /* большой детент — страница позади уменьшается, как карточка в iOS */
        var main = document.getElementById('main-scroll-container');
        var large = Math.max(0, 1 - y / detentY('medium'));
        if (main) {
            main.style.transition = anim ? 'transform .46s ' + EASE_PUSH + ', border-radius .46s' : 'none';
            main.style.transform = large > 0 ? 'scale(' + (1 - 0.06 * large) + ')' : '';
            main.style.borderRadius = large > 0 ? (18 * large) + 'px' : '';
        }
    }

    window.openNotifications = function () {
        if (!sheetRoot) build();
        renderList();
        sheetRoot.hidden = false;
        detent = 'medium';
        sheetRoot.classList.remove('is-large');
        setY(phone.clientHeight, false);
        void sheet.offsetHeight;
        requestAnimationFrame(function () { setY(detentY(detent), true); });
        document.addEventListener('keydown', onKey);
    };
    function closeNotifications() {
        if (!sheetRoot || sheetRoot.hidden) return;
        setY(phone.clientHeight, true);
        document.removeEventListener('keydown', onKey);
        setTimeout(function () {
            sheetRoot.hidden = true;
            var main = document.getElementById('main-scroll-container');
            if (main) { main.style.transform = ''; main.style.borderRadius = ''; main.style.transition = ''; }
        }, 380);
    }
    window.closeNotifications = closeNotifications;
    function onKey(e) { if (e.key === 'Escape') closeNotifications(); }

    function bindDrag() {
        /* средний детент: тянется весь шит; большой: список прокручивается, тянется шапка.
           горизонтальные жесты отдаются свайпу строк */
        var body = sheetRoot.querySelector('.lg-sheet-body');
        var pid = null, active = false, startX = 0, startY = 0, baseY = 0, lastY = 0, lastT = 0, vel = 0;
        sheet.addEventListener('pointerdown', function (e) {
            if (detent === 'large' && body.contains(e.target)) return;
            pid = e.pointerId; active = false; vel = 0;
            startX = e.clientX; startY = lastY = e.clientY; lastT = performance.now();
            baseY = detentY(detent);
        });
        /* движение слушаем на окне: палец быстро уходит за верхний край шита */
        window.addEventListener('pointermove', function (e) {
            if (e.pointerId !== pid) return;
            var dx = e.clientX - startX, dy = e.clientY - startY;
            if (!active) {
                if (Math.abs(dx) < 7 && Math.abs(dy) < 7) return;
                if (Math.abs(dx) > Math.abs(dy)) { pid = null; return; }
                active = true;
                try { sheet.setPointerCapture(pid); } catch (err) {}
            }
            var now = performance.now();
            vel = (e.clientY - lastY) / Math.max(1, now - lastT);
            lastY = e.clientY; lastT = now;
            var y = baseY + dy;
            if (y < 0) y *= 0.3;              /* резинка выше большого детента */
            setY(y, false);
        });
        function up(e) {
            if (e.pointerId !== pid) return;
            pid = null;
            if (!active) return;
            active = false;
            var y = baseY + (lastY - startY), mid = detentY('medium'), h = phone.clientHeight;
            if (vel > 0.8 || y > mid + (h - mid) * 0.38) { closeNotifications(); return; }
            if (vel < -0.5) detent = 'large';
            else if (vel > 0.5) detent = 'medium';
            else detent = y < mid / 2 ? 'large' : 'medium';
            applyDetent();
        }
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
        body.addEventListener('wheel', function (e) {
            if (detent === 'medium' && e.deltaY > 0) { detent = 'large'; applyDetent(); e.preventDefault(); }
            else if (detent === 'large' && e.deltaY < 0 && body.scrollTop <= 0) { detent = 'medium'; applyDetent(); e.preventDefault(); }
        }, { passive: false });
    }
    function applyDetent() {
        sheetRoot.classList.toggle('is-large', detent === 'large');
        setY(detentY(detent), true);
    }

    updateBell();
    window.addEventListener('storage', updateBell);
})();
