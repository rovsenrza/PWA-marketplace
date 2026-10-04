/* Запуск ядра приложения: всё, что выполняется при загрузке, в исходном порядке —
   состояние с вычисляемой инициализацией, обработчики событий, window.onload.
   Подключается после файлов доменов. */


window.currentOpenedCategory = null;


// ПЕРЕЗАПИСЫВАЕМ ФУНКЦИИ ИЗБРАННОГО И КОРЗИНЫ (чтобы они обновляли новые экраны)
const _oldToggleFavorite = toggleFavorite;

toggleFavorite = function(prodId) {
    _oldToggleFavorite(prodId);
    if (typeof renderRecommendations === 'function') renderRecommendations();
    if (typeof renderCategoryProducts === 'function') renderCategoryProducts();
    if (typeof pmRefreshFav === 'function') pmRefreshFav();
    if (typeof renderPmSimilar === 'function') renderPmSimilar();
    if (typeof renderPmRecent === 'function') renderPmRecent();
};


const _oldAddToCart = addToCart;

addToCart = function(prodId, qty) {
    _oldAddToCart(prodId, qty);
    if (typeof renderRecommendations === 'function') renderRecommendations();
    if (typeof renderCategoryProducts === 'function') renderCategoryProducts();
    if (typeof pmRefreshCart === 'function') pmRefreshCart();
    if (typeof renderPmSimilar === 'function') renderPmSimilar();
    if (typeof renderPmRecent === 'function') renderPmRecent();
};


// Загружаем рекомендации при старте
const _oldOnLoad = window.onload;

window.onload = function() {
    if (_oldOnLoad) _oldOnLoad();
    renderRecommendations();
};


window.currentReStore = '';
