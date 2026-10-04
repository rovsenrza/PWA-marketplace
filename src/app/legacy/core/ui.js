/* Общие элементы интерфейса.
   Аватар на весь экран, лайтбокс фото, тост-уведомление.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */

/* Ядро приложения покупателя.
   Данные, вкладки, каталог, справочник, товар, витрины, корзина, избранное, сторис, профиль, онбординг. Этап 2 — разнести по модулям (docs/ARCHITECTURE.md).
   Классический скрипт (не модуль): функции глобальные, их вызывают inline-обработчики разметки.
   Сборка: плагин legacy-scripts в vite.config.ts (минификация без переименования, хэш в имени). */

         function openAvatarModal(photoUrl, event) {
    if (event) event.stopPropagation();
    if (!photoUrl) return;
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;cursor:pointer;';
    modal.innerHTML = `<img src="${photoUrl}" style="max-width:90%;max-height:90%;border-radius:16px;object-fit:contain;">`;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}


// ========= ЛАЙТБОКС (просмотр фото на весь экран) =========
function openLightbox(src) {
    const imgs = window.pmImages || [];
    const idx = imgs.indexOf(src);
    window.pmIndex = idx >= 0 ? idx : 0;
    lbShow();
    const lb = document.getElementById('lightbox');
    lb.classList.remove('hidden');
    lb.classList.add('flex');
}


function lbShow() {
    const imgs = window.pmImages || [];
    const img = document.getElementById('lb-image');
    if (img) img.src = imgs[window.pmIndex] || '';
    const c = document.getElementById('lb-counter');
    if (c) c.textContent = (window.pmIndex + 1) + ' / ' + imgs.length;
}


function lbNext() {
    const imgs = window.pmImages || [];
    if (!imgs.length) return;
    window.pmIndex = (window.pmIndex + 1) % imgs.length;
    lbShow();
}


function lbPrev() {
    const imgs = window.pmImages || [];
    if (!imgs.length) return;
    window.pmIndex = (window.pmIndex - 1 + imgs.length) % imgs.length;
    lbShow();
}


function closeLightbox() {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    lb.classList.add('hidden');
    lb.classList.remove('flex');
}

function showSmsToast(msg) { document.getElementById('sms-toast-msg').innerText = msg; const t = document.getElementById('sms-toast'); t.classList.remove('translate-y-20','opacity-0'); setTimeout(()=>t.classList.add('translate-y-20','opacity-0'), 3000); }
