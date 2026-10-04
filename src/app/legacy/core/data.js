/* Данные каталога и справочника.
   Товары и магазины из SEED, компании, спецтехника, справочник, вакансии, общее состояние покупателя.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */

/* productsDb: данные в CatalogStore (src/shared/data/catalog-store.ts); здесь — аксессор на window */


        // ===== СТРУКТУРА КАТЕГОРИЙ ДЛЯ ФИЛЬТРА =====
const filterCategories = {
    'Строительные материалы': ['Бетон и растворы','Арматура и металлопрокат','Кирпич и блоки','Дерево и древесноволокнистые материалы','Изоляционные материалы','Кровля и гидроизоляция','Крепеж и фурнитура','Инструменты и оборудование','Утеплители','Технологические расходники'],
    'Отделочные материалы': ['Стены и поверхности','Полы','Потолки','Окна','Фасад и внешняя отделка','Декоративные элементы','Краски и покрытия по дереву','Герметики и клеи','Инструменты и расходники'],
    'Мебель': ['Мягкая мебель','Корпусная мебель','Столы и стулья','Кухонная мебель','Спальная мебель','Мебель для прихожей','Детская мебель','Мебель для ванны'],
    'Сантехника': ['Ванная комната','Унитаз/Биде','Раковины','Комплектующие'],
    'Аксессуары': ['Текстиль','Освещение','Декор','Зеркала','Часы','Аксессуары для ванной','Кухонные мелочи'],
    'Ландшафт': ['Малые формы','Дорожки','Ограждения','Освещение','Водоёмы','Системы полива','Зеленые зоны']
};


let selectedFilterCategory = null;

   // выбранная главная категория
let selectedFilterSub = null;

        // выбранная подкатегория

const SHOP_B = SEED.shopBanners;

/* shopsProfileDb: данные в CatalogStore (src/shared/data/catalog-store.ts); здесь — аксессор на window */


let companiesProfileDb = SEED.companies();


let spectechDb = SEED.spectech();


        /* directoryDb: данные в CatalogStore (src/shared/data/catalog-store.ts); здесь — аксессор на window */

/* vacanciesDb: данные в CatalogStore (src/shared/data/catalog-store.ts); здесь — аксессор на window */


let state = { currentSlide: 1, totalSlides: 4, currentPromo: 1, totalPromos: 3, isAuthenticated: false, userRole: 'user', userEmail: '', favorites: [], cart: [], designerCategory: 'interior', currentShop: '' };


/* демо-логины магазинов — src/shared/auth/demo-auth.ts (DEMO_STORE_LOGINS) */


const FEEDBACK_LINKS = {
    telegram: 'https://t.me/remontik',
    max: 'https://max.ru/remontik'
};


let currentPortfolioItem = null;
