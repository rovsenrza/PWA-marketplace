/* Форматирование цен и бейджей.
   Разбор цены, бейджи «Хит/Новинка/Распродажа», вывод цены.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


        // ========== ИЗБРАННОЕ (с группировкой по магазинам) ==========

// Достаём число из строки цены "189 000 ₽" -> 189000
function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const num = priceStr.toString().replace(/[^\d]/g, '');
    return parseInt(num) || 0;
}


        // Возвращает HTML бейджа (хит/новинка/распродажа) для товара
function getBadgeHtml(prod) {
    if (!prod || !prod.badge) return '';
    const map = {
        hit:  { text: 'ХИТ',        bg: 'bg-rose-500' },
        new:  { text: 'НОВИНКА',    bg: 'bg-emerald-500' },
        sale: { text: 'РАСПРОДАЖА', bg: 'bg-red-600' }
    };
    const b = map[prod.badge];
    if (!b) return '';
    return `<span class="${b.bg} text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wide">${b.text}</span>`;
}


// Возвращает HTML цены (со скидкой или обычной)
function getPriceHtml(prod, size) {
    const priceCls = size || 'oz-price';
    const isSale = prod.oldPrice && prod.badge === 'sale';
    if (isSale) {
        return `<div class="flex items-baseline gap-1.5 flex-wrap">
                    <span class="${priceCls}" style="color:#f43f5e !important;">${prod.price}</span>
                    <span class="oz-price-old">${prod.oldPrice}</span>
                </div>`;
    }
    return `<span class="${priceCls}">${prod.price}</span>`;
}


// Форматируем число обратно "189000" -> "189 000 ₽"
function formatPrice(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
}
