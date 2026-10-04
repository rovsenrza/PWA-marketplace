/* Запуск ядра приложения: всё, что выполняется при загрузке, в исходном порядке —
   состояние с вычисляемой инициализацией, обработчики событий, window.onload.
   Подключается после файлов доменов. */


window.currentOpenedCategory = null;


// ПЕРЕЗАПИСЫВАЕМ ФУНКЦИИ ИЗБРАННОГО И КОРЗИНЫ (чтобы они обновляли новые экраны)
// Перерисовка разделов при изменении избранного и корзины — через события, а не подменой функций
document.addEventListener('app:favorites-changed', function () {
    if (typeof renderRecommendations === 'function') renderRecommendations();
    if (typeof renderCategoryProducts === 'function') renderCategoryProducts();
    if (typeof pmRefreshFav === 'function') pmRefreshFav();
    if (typeof renderPmSimilar === 'function') renderPmSimilar();
    if (typeof renderPmRecent === 'function') renderPmRecent();
});

// refreshCartSurfaces уже перерисовывает рекомендации, категории, товар и «недавние»; здесь — «похожие»
document.addEventListener('app:cart-changed', function () {
    if (typeof renderPmSimilar === 'function') renderPmSimilar();
});

// Загружаем рекомендации при старте (после window.onload из core/boot.js — он назначен раньше)
window.addEventListener('load', function () {
    renderRecommendations();
});


window.currentReStore = '';
