/* Профиль покупателя.
   Карточка покупателя и её редактирование.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */



        // ========== КАРТОЧКА ПОКУПАТЕЛЯ ==========
let buyerProfile = {
    name: '',
    phone: '',
    email: '',
    city: ''
};


function loadBuyerProfile() {
    try {
        const saved = localStorage.getItem('meb_buyer');
        if (saved) buyerProfile = JSON.parse(saved);
    } catch (e) { console.warn(e); }
}


function renderBuyerCard() {
    document.getElementById('buyer-view-name').innerText = buyerProfile.name || 'Не указано';
    document.getElementById('buyer-view-phone').innerText = buyerProfile.phone || 'Не указан';
    document.getElementById('buyer-view-email').innerText = buyerProfile.email || state.userEmail || 'Не указан';
    document.getElementById('buyer-view-city').innerText = buyerProfile.city || 'Не указан';

    // Аватар — первая буква имени
    const letter = buyerProfile.name ? buyerProfile.name.trim()[0].toUpperCase() : 'П';
    document.getElementById('user-avatar-letter').innerText = letter;

    // В шапке показываем имя, если оно есть, иначе email
    document.getElementById('user-display-email').innerText = buyerProfile.name || state.userEmail;

    updateBuyerFavCount();
}


function updateBuyerFavCount() {
    const el = document.getElementById('buyer-fav-count');
    if (el) el.innerText = state.favorites ? state.favorites.length : 0;
}


function openBuyerEditor() {
    document.getElementById('buyer-edit-name').value = buyerProfile.name || '';
    document.getElementById('buyer-edit-phone').value = buyerProfile.phone || '';
    document.getElementById('buyer-edit-email').value = buyerProfile.email || state.userEmail || '';
    document.getElementById('buyer-edit-city').value = buyerProfile.city || '';
    const e = document.getElementById('buyer-editor');
    e.classList.remove('hidden'); e.classList.add('flex');
}


function closeBuyerEditor() {
    const e = document.getElementById('buyer-editor');
    e.classList.add('hidden'); e.classList.remove('flex');
}


function saveBuyerCard() {
    const name = document.getElementById('buyer-edit-name').value.trim();
    if (!name) return showSmsToast("Введите имя!");

    buyerProfile = {
        name: name,
        phone: document.getElementById('buyer-edit-phone').value.trim(),
        email: document.getElementById('buyer-edit-email').value.trim(),
        city: document.getElementById('buyer-edit-city').value.trim()
    };

    try { localStorage.setItem('meb_buyer', JSON.stringify(buyerProfile)); } catch (e) {}

    showSmsToast("Профиль сохранён ");
    closeBuyerEditor();
    renderBuyerCard();
}
