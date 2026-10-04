/* Вход и регистрация.
   Маска телефона, вход, регистрация, выход.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


// ========== АВТОРИЗАЦИЯ: вкладки, маска, регистрация ==========

// Переключение вкладок Вход / Регистрация
function switchAuthTab(tab) {
    const loginBtn = document.getElementById('auth-tab-login');
    const regBtn = document.getElementById('auth-tab-register');
    const loginForm = document.getElementById('form-login');
    const regForm = document.getElementById('form-register');

    if (tab === 'login') {
        loginBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-white text-[#1e6091] shadow-sm transition-all';
        regBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 transition-all';
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
    } else {
        regBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-white text-emerald-600 shadow-sm transition-all';
        loginBtn.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-slate-400 transition-all';
        regForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}


       // Маска для телефона +7 (900) 123-45-67
function applyPhoneMask(input) {
    const raw = input.value.trim().toLowerCase();

    // Если в поле есть буквы (admin, shop, shop1...) — маску НЕ применяем
    if (/[a-zа-я]/i.test(raw)) {
        return; // оставляем текст как есть, чтобы можно было ввести служебный логин
    }

    let digits = input.value.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = '7' + digits.slice(1);
    if (!digits.startsWith('7')) digits = '7' + digits;
    digits = digits.slice(0, 11);

    let formatted = '+7';
    if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
    if (digits.length >= 4) formatted += ') ' + digits.slice(4, 7);
    if (digits.length >= 7) formatted += '-' + digits.slice(7, 9);
    if (digits.length >= 9) formatted += '-' + digits.slice(9, 11);

    input.value = formatted;
}


// Показать/скрыть пароль
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerText = 'Показать пароль';
    } else {
        input.type = 'password';
        btn.innerText = 'Скрыть пароль';
    }
}


// Регистрация нового покупателя
function submitRegister() {
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const pass = document.getElementById('reg-password').value.trim();
    const pass2 = document.getElementById('reg-password2').value.trim();

    if (!name) return showSmsToast("Введите имя и фамилию");
    if (phone.length < 18) return showSmsToast("Введите корректный номер телефона");
    if (pass.length < 6) return showSmsToast("Пароль минимум 6 символов");
    if (pass !== pass2) return showSmsToast("Пароли не совпадают");

    // Сохраняем данные в карточку покупателя
    buyerProfile = { name: name, phone: phone, email: '', city: '' };
    try { localStorage.setItem('meb_buyer', JSON.stringify(buyerProfile)); } catch (e) {}

    // Сразу авторизуем как покупателя
    state.isAuthenticated = true;
    state.userEmail = phone;
    state.userRole = 'user';

    finishLogin();
    showSmsToast("Регистрация успешна!");
}


// Авторизация и Модерация
               function submitLogin() {
    const phoneRaw = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value.trim();
    if(!phoneRaw) return showSmsToast("Введите номер телефона");
    if(!password) return showSmsToast("Введите пароль");

                // Служебный вход админа/магазина
    let role = 'user';
    const lower = phoneRaw.toLowerCase();
    if (lower === 'admin') {
        role = 'admin';
    } else if (shopLoginsMap[lower]) {
        role = 'shop';
        state.currentShop = shopLoginsMap[lower]; // запоминаем какой магазин
    } else {
        // Для обычного покупателя проверяем длину пароля
        if (password.length < 6) return showSmsToast("Пароль минимум 6 символов");
    }

    state.isAuthenticated = true;
    state.userEmail = phoneRaw;
    state.userRole = role;

    finishLogin();
}


// Общая часть: оформление профиля после входа/регистрации
function finishLogin() {
    const em = state.userEmail;
    document.getElementById('profile-unauth').classList.add('hidden');
    document.getElementById('profile-auth').classList.remove('hidden');
    ['dash-admin','dash-shop','dash-user'].forEach(d=>document.getElementById(d).classList.add('hidden'));
    document.getElementById(`dash-${state.userRole}`).classList.remove('hidden');
    document.getElementById('user-display-email').innerText = em;

    // Красивое название роли на русском
    const roleNames = { user: 'Покупатель', shop: 'Магазин', admin: 'Администратор' };
    const roleEl = document.getElementById('user-display-role');
    roleEl.innerText = roleNames[state.userRole] || 'Покупатель';

    // Карточка покупателя только для user
    const buyerCard = document.getElementById('buyer-card');
    if (state.userRole === 'user') {
        buyerCard.classList.remove('hidden');
        loadBuyerProfile();
        renderBuyerCard();
    } else {
        buyerCard.classList.add('hidden');
    }

                if (state.userRole === 'admin') { renderAdminModerationList(); updateModCounter(); updateAdminStats(); }
    if (state.userRole === 'shop') { renderShopDashboard(); }
}

function logout() { state.isAuthenticated=false; document.getElementById('profile-unauth').classList.remove('hidden'); document.getElementById('profile-auth').classList.add('hidden'); }
