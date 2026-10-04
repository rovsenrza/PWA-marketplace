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
                let productsDb = SEED.products();

        // ===== СТРУКТУРА КАТЕГОРИЙ ДЛЯ ФИЛЬТРА =====
const filterCategories = {
    'Строительные материалы': ['Бетон и растворы','Арматура и металлопрокат','Кирпич и блоки','Дерево и древесноволокнистые материалы','Изоляционные материалы','Кровля и гидроизоляция','Крепеж и фурнитура','Инструменты и оборудование','Утеплители','Технологические расходники'],
    'Отделочные материалы': ['Стены и поверхности','Полы','Потолки','Окна','Фасад и внешняя отделка','Декоративные элементы','Краски и покрытия по дереву','Герметики и клеи','Инструменты и расходники'],
    'Мебель': ['Мягкая мебель','Корпусная мебель','Столы и стулья','Кухонная мебель','Спальная мебель','Мебель для прихожей','Детская мебель','Мебель для ванны'],
    'Сантехника': ['Ванная комната','Унитаз/Биде','Раковины','Комплектующие'],
    'Аксессуары': ['Текстиль','Освещение','Декор','Зеркала','Часы','Аксессуары для ванной','Кухонные мелочи'],
    'Ландшафт': ['Малые формы','Дорожки','Ограждения','Освещение','Водоёмы','Системы полива','Зеленые зоны']
};

let selectedFilterCategory = null;   // выбранная главная категория
let selectedFilterSub = null;        // выбранная подкатегория

const SHOP_B = SEED.shopBanners;
               let shopsProfileDb = SEED.shops();

        let companiesProfileDb = {
            'ВЛКЗ Полимер': { name: 'ВЛКЗ Полимер', status: 'published', rating: '4.8', years: 'Более 10 лет на рынке', category: 'Лакокрасочные материалы', iconColor: 'bg-orange-500', icon: 'ВЛ', banner: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600', description: 'Производство надёжных лакокрасочных материалов', address: 'Промзона Западная, стр. 4', site: 'https://vlkz.ru', telegram: 'https://t.me/vlkz_polimer', video: '', gallery: [] , photos: ['https://tse1.mm.bing.net/th/id/OIP.1Pr8kn_8_J8LQ4c7H_QzzgHaGN?r=0&rs=1&pid=ImgDetMain&o=7&rm=3','https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400','https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=400','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400'] },
            'Благовест': { name: 'Благовест', status: 'published', rating: '4.9', years: 'Более 15 лет на рынке', category: 'Вентиляционные системы', iconColor: 'bg-blue-500', icon: 'БЛ', banner: 'https://mir-s3-cdn-cf.behance.net/project_modules/1400/649f6f99479841.5ef3987d41df2.jpg', description: 'Системы вентиляции и инженерные решения', address: 'ул. Строителей, 12', site: 'https://blagovest.ru', telegram: 'https://t.me/blagovest_air', video: '', gallery: [] ,  photos: ['https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400','https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400','https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=400','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400'] },
            'Дриада': { name: 'Дриада', status: 'published', rating: '4.7', years: 'Более 8 лет на рынке', category: 'Проектирование и строительство', iconColor: 'bg-green-600', icon: 'ДР', banner: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', description: 'Архитектурное бюро и строительство домов', address: 'Бизнес-центр "Олимп"', site: 'https://driada-company.ru', telegram: 'https://t.me/driada_comp', video: '', gallery: [], photos: ['https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400','https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400','https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=400','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400'] },
            'Эстетика': { name: 'Эстетика', kind: 'remont', status: 'published', rating: '4.9', years: '12 лет на рынке', category: 'Ремонт под ключ', iconColor: 'bg-[#1e6091]', icon: 'ЭС', banner: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800', description: 'Ремонт квартир и домов под ключ: свои бригады штукатурки, плитки, электрики и сантехники. Один договор, один прораб, фиксированные сроки.', address: 'Волгодонск, ул. Ленина, 18', site: 'https://estetika-remont.ru', telegram: 'https://t.me/estetika_remont', video: '', gallery: [], photos: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400','https://images.unsplash.com/photo-1562259949-e8e6c56d0ae1?w=400','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400'], services: ['Штукатурка', 'Плитка', 'Электрика', 'Сантехника', 'Гипсокартон', 'Покраска', 'Дизайн'] },
            'ДонРемонт': { name: 'ДонРемонт', kind: 'remont', status: 'published', rating: '4.8', years: '9 лет на рынке', category: 'Ремонт под ключ', iconColor: 'bg-slate-800', icon: 'ДР', banner: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800', description: 'Капитальный и косметический ремонт: черновая отделка, инженерия и чистовые работы. Бригады работают по смете без скрытых доплат.', address: 'Волгодонск, пр. Мира, 42', site: 'https://donremont.ru', telegram: 'https://t.me/donremont', video: '', gallery: [], photos: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400','https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400','https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=400','https://images.unsplash.com/photo-1484154214963-01d56f8c276c?w=400'], services: ['Черновая отделка', 'Электрика', 'Сантехника', 'Плитка', 'Штукатурка', 'Натяжные потолки'] },
            'Атлант': { name: 'Атлант', kind: 'remont', status: 'published', rating: '4.7', years: '15 лет на рынке', category: 'Ремонт под ключ', iconColor: 'bg-[#16324a]', icon: 'АТ', banner: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', description: 'Полный цикл ремонта квартир в новостройках и вторичке: демонтаж, инженерия, отделка и сдача объекта с гарантией.', address: 'Волгодонск, ул. Строителей, 7', site: 'https://atlant-remont.ru', telegram: 'https://t.me/atlant_remont', video: '', gallery: [], photos: ['https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400','https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400'], services: ['Демонтаж', 'Штукатурка', 'Плитка', 'Электрика', 'Сантехника', 'Чистовая отделка'] },
            'МастерДом': { name: 'МастерДом', kind: 'remont', status: 'published', rating: '4.8', years: '11 лет на рынке', category: 'Ремонт под ключ', iconColor: 'bg-amber-600', icon: 'МД', banner: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800', description: 'Ремонт домов и квартир: стены, полы, потолки, электрика и сантехника. Одна компания закрывает весь объект — от стяжки до мебели.', address: 'Волгодонск, ул. Энтузиастов, 5', site: 'https://masterdom-vd.ru', telegram: 'https://t.me/masterdom_vd', video: '', gallery: [], photos: ['https://images.unsplash.com/photo-1600210492493-0946911123ea?w=400','https://images.unsplash.com/photo-1595846519845-68e298c2edd8?w=400','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400','https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400'], services: ['Стяжка', 'Штукатурка', 'Плитка', 'Электрика', 'Сантехника', 'Покраска'] },
            'Новострой Сервис': { name: 'Новострой Сервис', kind: 'remont', status: 'published', rating: '4.6', years: '7 лет на рынке', category: 'Ремонт под ключ', iconColor: 'bg-sky-700', icon: 'НС', banner: 'https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=800', description: 'Специализация на новостройках: черновая и чистовая отделка, разводка инженерии, окна, двери и сдача под ключ.', address: 'Волгодонск, ул. Гагарина, 31', site: 'https://novostroy-service.ru', telegram: 'https://t.me/novostroy_service', video: '', gallery: [], photos: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400','https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=400','https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=400','https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=400'], services: ['Черновая отделка', 'Гипсокартон', 'Электрика', 'Сантехника', 'Плитка', 'Двери'] },
            'Квадрат': { name: 'Квадрат', kind: 'remont', status: 'published', rating: '4.9', years: '10 лет на рынке', category: 'Ремонт под ключ', iconColor: 'bg-emerald-700', icon: 'КВ', banner: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800', description: 'Студия ремонта с собственными мастерами: штукатурка, плитка, электрика, сантехника и чистовая отделка в одном договоре.', address: 'Волгодонск, ул. Морская, 12', site: 'https://kvadrat-remont.ru', telegram: 'https://t.me/kvadrat_remont', video: '', gallery: [], photos: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400','https://images.unsplash.com/photo-1562259949-e8e6c56d0ae1?w=400','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400'], services: ['Штукатурка', 'Плитка', 'Электрика', 'Сантехника', 'Отделка', 'Дизайн-проект'] }
        };

        let spectechDb = [
            { id:'st-1', name:'Трактор МТЗ-82.1', cat:'Землеройная', type:'Трактор', company:'ДонТехАренда', rating:'4.9', loc:'Волгодонск', available:'today', crew:true, priceShift:14000, priceHour:1900, delivery:'Подача 40 мин по городу', minShift:1, phone:'+7 (904) 120-45-67', photo:'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=900', photos:['https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=900','https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=900','https://images.unsplash.com/photo-1625246333195-78d9c38e3146?w=900'], desc:'Универсальный трактор для расчистки, планировки и навесного оборудования. Сдаётся со сменщиком.', specs:[['Мощность','81 л.с.'],['Привод','4×4'],['Навес','КУН + отвал'],['Год','2021']], includes:['Машинист','ГСМ в смене','ОСАГО','НДС'] },
            { id:'st-2', name:'Экскаватор-погрузчик JCB 3CX', cat:'Землеройная', type:'Экскаватор', company:'ЮгСпец', rating:'4.8', loc:'Волгодонск', available:'today', crew:true, priceShift:22000, priceHour:2900, delivery:'Подача 50 мин по городу', minShift:1, phone:'+7 (904) 211-30-18', photo:'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=900', photos:['https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=900','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900','https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=900'], desc:'Копка котлованов, траншей, погрузка грунта. Полный день с экипажем.', specs:[['Ковш','1.0 м³'],['Глубина','5.5 м'],['Вес','8.2 т'],['Год','2022']], includes:['Машинист','ГСМ','Страховка','НДС'] },
            { id:'st-3', name:'КАМАЗ 65115 самосвал', cat:'Грузовые', type:'КАМАЗ', company:'АвтоПарк 161', rating:'4.7', loc:'Волгодонск', available:'today', crew:true, priceShift:18000, priceHour:2400, delivery:'Подача 35 мин', minShift:1, phone:'+7 (903) 440-12-90', photo:'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900', photos:['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900','https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=900','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900'], desc:'Вывоз грунта и щебня, кузов 15 м³. Водитель в смене, работа по наряду.', specs:[['Кузов','15 м³'],['Груз','15 т'],['Колёсная','6×4'],['Год','2020']], includes:['Водитель','ГСМ','ОСАГО','НДС'] },
            { id:'st-4', name:'КАМАЗ 65117 с КМУ', cat:'Манипуляторы', type:'КАМАЗ', company:'ДонТехАренда', rating:'4.9', loc:'Волгодонск', available:'tomorrow', crew:true, priceShift:21000, priceHour:2700, delivery:'Подача 45 мин', minShift:1, phone:'+7 (904) 120-45-67', photo:'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=900', photos:['https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=900','https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900','https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=900'], desc:'Манипулятор для плит, бытовок и паллет. Стрела 7 т, борт 12 т.', specs:[['КМУ','7 т'],['Борт','12 т'],['Вылет','12 м'],['Год','2021']], includes:['Водитель-оператор','ГСМ','Страховка','НДС'] },
            { id:'st-5', name:'Автокран КС-45717 25 т', cat:'Подъём', type:'Кран', company:'ВолгаСтройМеханизация', rating:'4.8', loc:'Волгодонск', available:'today', crew:true, priceShift:28000, priceHour:3600, delivery:'Подача 60 мин', minShift:1, phone:'+7 (905) 330-77-21', photo:'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900', photos:['https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900','https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=900','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900'], desc:'Монтаж перекрытий, ферм и оборудования. Крановщик с допуском.', specs:[['Груз','25 т'],['Стрела','21 м'],['База','КАМАЗ'],['Год','2019']], includes:['Крановщик','Стропальщик','ГСМ','НДС'] },
            { id:'st-6', name:'Автовышка АГП-18', cat:'Подъём', type:'Вышка', company:'ЮгСпец', rating:'4.7', loc:'Волгодонск', available:'today', crew:true, priceShift:12000, priceHour:1600, delivery:'Подача 40 мин', minShift:1, phone:'+7 (904) 211-30-18', photo:'https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=900', photos:['https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=900','https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900'], desc:'Фасады, освещение, реклама. Корзина на 200 кг, высота 18 м.', specs:[['Высота','18 м'],['Корзина','200 кг'],['Привод','4×2'],['Год','2020']], includes:['Оператор','ГСМ','ОСАГО','НДС'] },
            { id:'st-7', name:'Мини-погрузчик Bobcat S650', cat:'Землеройная', type:'Погрузчик', company:'ДонТехАренда', rating:'4.9', loc:'Волгодонск', available:'today', crew:true, priceShift:16000, priceHour:2100, delivery:'Подача 30 мин', minShift:1, phone:'+7 (904) 120-45-67', photo:'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900', photos:['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900','https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=900','https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900'], desc:'Дворы, склады, узкие проезды. Можно без экипажа для своих операторов.', specs:[['Груз','1.2 т'],['Ширина','1.8 м'],['Навес','ковш / щётка'],['Год','2023']], includes:['Доставка','ГСМ опция','КАСКО','НДС'], crewOptional:true },
            { id:'st-8', name:'Бульдозер Б10М', cat:'Землеройная', type:'Бульдозер', company:'ВолгаСтройМеханизация', rating:'4.6', loc:'Волгодонск', available:'week', crew:true, priceShift:26000, priceHour:3300, delivery:'Подача 70 мин', minShift:1, phone:'+7 (905) 330-77-21', photo:'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900', photos:['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900','https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900','https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=900'], desc:'Планировка площадок и перемещение грунта на больших объёмах.', specs:[['Мощность','180 л.с.'],['Отвал','3.2 м'],['Вес','18 т'],['Год','2018']], includes:['Машинист','ГСМ','Страховка','НДС'] },
            { id:'st-9', name:'ГАЗель Next тент', cat:'Транспорт', type:'Газель', company:'АвтоПарк 161', rating:'4.8', loc:'Волгодонск', available:'today', crew:true, priceShift:8000, priceHour:1100, delivery:'Подача 25 мин', minShift:1, phone:'+7 (903) 440-12-90', photo:'https://images.unsplash.com/photo-1566576721346-d4a3b2bdef75?w=900', photos:['https://images.unsplash.com/photo-1566576721346-d4a3b2bdef75?w=900','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900','https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900'], desc:'Перевозка материалов, мебели и инструмента. Водитель + грузчик по запросу.', specs:[['Кузов','4.2 м'],['Груз','1.5 т'],['Объём','18 м³'],['Год','2022']], includes:['Водитель','ГСМ','ОСАГО','НДС'], extra:'Грузчик +2 500 ₽ / смена' },
            { id:'st-10', name:'ГАЗель Next фермер', cat:'Транспорт', type:'Газель', company:'АвтоПарк 161', rating:'4.7', loc:'Волгодонск', available:'today', crew:true, priceShift:7500, priceHour:1000, delivery:'Подача 25 мин', minShift:1, phone:'+7 (903) 440-12-90', photo:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900', photos:['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900','https://images.unsplash.com/photo-1566576721346-d4a3b2bdef75?w=900','https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=900'], desc:'Кабина на 6 мест + борт. Для бригады и мелкого груза на объект.', specs:[['Мест','6'],['Борт','3 м'],['Груз','1.2 т'],['Год','2021']], includes:['Водитель','ГСМ','ОСАГО','НДС'] },
            { id:'st-11', name:'Вилочный погрузчик 3 т', cat:'Складская', type:'Погрузчик', company:'ЮгСпец', rating:'4.8', loc:'Волгодонск', available:'today', crew:false, priceShift:9000, priceHour:1300, delivery:'Подача 40 мин', minShift:1, phone:'+7 (904) 211-30-18', photo:'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900', photos:['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900','https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=900','https://images.unsplash.com/photo-1566576721346-d4a3b2bdef75?w=900'], desc:'Разгрузка фуры и паллет на складе. Можно со своим водителем.', specs:[['Груз','3 т'],['Подъём','4.5 м'],['Топливо','дизель'],['Год','2021']], includes:['Доставка','КАСКО','НДС'] },
            { id:'st-12', name:'Бетоносмеситель АБС-7', cat:'Коммунальная', type:'Бетон', company:'ВолгаСтройМеханизация', rating:'4.6', loc:'Волгодонск', available:'tomorrow', crew:true, priceShift:17000, priceHour:2300, delivery:'Подача 50 мин', minShift:1, phone:'+7 (905) 330-77-21', photo:'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=900', photos:['https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=900','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900','https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=900'], desc:'Миксер 7 м³ под заливку фундамента и стяжки. Водитель на объекте.', specs:[['Барабан','7 м³'],['База','КАМАЗ'],['Подача','лоток'],['Год','2019']], includes:['Водитель','ГСМ','ОСАГО','НДС'] },
            { id:'st-13', name:'Компрессор Atlas Copco', cat:'Коммунальная', type:'Компрессор', company:'ДонТехАренда', rating:'4.8', loc:'Волгодонск', available:'today', crew:false, priceShift:6500, priceHour:900, delivery:'Подача 30 мин', minShift:1, phone:'+7 (904) 120-45-67', photo:'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900', photos:['https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=900','https://images.unsplash.com/photo-1504148455328-c376907d081c?w=900','https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=900'], desc:'Пескоструй, отбойники, продувка. Сдаётся без экипажа.', specs:[['Произв.','7 м³/мин'],['Давление','8 бар'],['Топливо','дизель'],['Год','2022']], includes:['Доставка','Шланги','НДС'] },
            { id:'st-14', name:'Каток грунтовый ДУ-85', cat:'Коммунальная', type:'Каток', company:'ВолгаСтройМеханизация', rating:'4.7', loc:'Волгодонск', available:'week', crew:true, priceShift:19000, priceHour:2500, delivery:'Подача 55 мин', minShift:1, phone:'+7 (905) 330-77-21', photo:'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900', photos:['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=900','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900','https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=900'], desc:'Уплотнение основания дорог и площадок. Вибрационный валец.', specs:[['Масса','13 т'],['Ширина','2.1 м'],['Вибрация','да'],['Год','2018']], includes:['Машинист','ГСМ','Страховка','НДС'] },
            { id:'st-15', name:'Ямобур БКМ-317', cat:'Землеройная', type:'Ямобур', company:'ЮгСпец', rating:'4.8', loc:'Волгодонск', available:'today', crew:true, priceShift:15000, priceHour:2000, delivery:'Подача 40 мин', minShift:1, phone:'+7 (904) 211-30-18', photo:'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=900', photos:['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=900','https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=900','https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900'], desc:'Столбы забора, сваи и опоры освещения. Бур 300–500 мм.', specs:[['Глубина','3 м'],['Диаметр','300–500'],['База','ГАЗ-66'],['Год','2020']], includes:['Оператор','ГСМ','ОСАГО','НДС'] },
            { id:'st-16', name:'Эвакуатор Mercedes', cat:'Транспорт', type:'Эвакуатор', company:'АвтоПарк 161', rating:'4.9', loc:'Волгодонск', available:'today', crew:true, priceShift:10000, priceHour:1500, delivery:'Подача 20 мин', minShift:1, phone:'+7 (903) 440-12-90', photo:'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=900', photos:['https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=900','https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900','https://images.unsplash.com/photo-1566576721346-d4a3b2bdef75?w=900'], desc:'Эвакуация легковых и LCV, сдвижная платформа. Выезд 20 минут.', specs:[['Платформа','5.2 м'],['Груз','3.5 т'],['Лебёдка','да'],['Год','2021']], includes:['Водитель','ГСМ','ОСАГО','НДС'] },
            { id:'st-17', name:'Самосвал HOWO 10 т', cat:'Грузовые', type:'КАМАЗ', company:'ДонТехАренда', rating:'4.6', loc:'Волгодонск', available:'today', crew:true, priceShift:16000, priceHour:2100, delivery:'Подача 40 мин', minShift:1, phone:'+7 (904) 120-45-67', photo:'https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=900', photos:['https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=900','https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900','https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=900'], desc:'Песок, щебень, бой. Кузов 12 м³, удобен на частных объектах.', specs:[['Кузов','12 м³'],['Груз','10 т'],['Колёсная','6×4'],['Год','2019']], includes:['Водитель','ГСМ','ОСАГО','НДС'] },
            { id:'st-18', name:'Ассенизатор КО-503', cat:'Коммунальная', type:'Ассенизатор', company:'ЮгСпец', rating:'4.7', loc:'Волгодонск', available:'tomorrow', crew:true, priceShift:11000, priceHour:1500, delivery:'Подача 45 мин', minShift:1, phone:'+7 (904) 211-30-18', photo:'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=900', photos:['https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=900','https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900','https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=900'], desc:'Откачка септиков и ливнёвки. Цистерна 4.5 м³, шланг 30 м.', specs:[['Цистерна','4.5 м³'],['Шланг','30 м'],['База','ГАЗ'],['Год','2020']], includes:['Водитель','ГСМ','ОСАГО','НДС'] }
        ];

        let directoryDb = {
            specialists: [{ id:'spec-1', name:'Алексей Николаев', craft:'Плиточник', title:'Плиточник / Опыт 8 лет', description: 'Качественная укладка широкоформатного керамогранита.', avatar:'АН', avatarPhoto:'https://tse4.mm.bing.net/th/id/OIP.NmBfKx1NvyBRY6pv9wCwXwHaEq?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', status: 'published', hours: 'Пн-Сб, с 9:00 до 19:00', phone: '+7 (903) 123-45-67', prices: [{service: 'Укладка плитки', cost: 'от 1 500 ₽ / м²'}], site: 'https://nikolaev.ru', telegram: 'https://t.me/nik', gallery: ['https://images.unsplash.com/photo-1502005229762-fc1b2381f0db?w=400']
            },
        { id:'mas-2', name:'Игорь Петров', craft:'Электрик', title:'Электрик', experience:'Опыт 10 лет', description: 'Монтаж проводки, установка розеток и щитков.', avatar:'ИП', avatarPhoto:'https://i.pravatar.cc/300?img=13', status: 'published', hours: 'Пн-Пт, с 8:00 до 18:00', phone: '+7 (921) 333-44-55', prices: [{service: 'Замена проводки', cost: 'от 500 ₽ / точка'}], site: 'https://petrov.ru', telegram: 'https://t.me/petrov', max: 'https://max.ru/petrov', gallery: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800','https://images.unsplash.com/photo-1565608438257-fac3c27beb36?w=800'] },
        { id:'mas-3', name:'Сергей Волков', craft:'Сантехник', title:'Сантехник', experience:'Опыт 12 лет', description: 'Установка и ремонт сантехники любой сложности.', avatar:'СВ', avatarPhoto:'https://i.pravatar.cc/300?img=15', status: 'published', hours: 'Ежедневно, с 9:00 до 20:00', phone: '+7 (903) 666-77-88', prices: [{service: 'Установка смесителя', cost: 'от 1 500 ₽'}], site: 'https://volkov.ru', telegram: 'https://t.me/volkov', max: 'https://max.ru/volkov', gallery: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800','https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800','https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800'] },
        { id:'mas-4', name:'Андрей Морозов', craft:'Штукатур', title:'Маляр-штукатур', experience:'Опыт 7 лет', description: 'Выравнивание стен, покраска, декоративная штукатурка.', avatar:'АМ', avatarPhoto:'https://i.pravatar.cc/300?img=33', status: 'published', hours: 'Пн-Сб, с 8:00 до 19:00', phone: '+7 (911) 999-00-11', prices: [{service: 'Покраска стен', cost: 'от 300 ₽ / м²'}], site: 'https://morozov.ru', telegram: 'https://t.me/morozov', max: 'https://max.ru/morozov', gallery: ['https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800','https://images.unsplash.com/photo-1595844730289-b1f10de0a091?w=800','https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800'] },
        { id:'mas-5', name:'Денис Орлов', craft:'Отделочник', title:'Отделочник', experience:'Опыт 9 лет', description: 'Чистовая отделка квартир: стены, потолки, откосы и финиш перед сдачей.', avatar:'ДО', avatarPhoto:'https://i.pravatar.cc/300?img=11', status: 'published', hours: 'Пн-Сб, с 8:00 до 19:00', phone: '+7 (904) 210-11-22', prices: [{service: 'Чистовая отделка', cost: 'от 1 200 ₽ / м²'}], site: 'https://orlov-otdelka.ru', telegram: 'https://t.me/orlov_otdelka', max: 'https://max.ru/orlov', gallery: ['https://images.unsplash.com/photo-1562259949-e8e6c56d0ae1?w=800','https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800','https://images.unsplash.com/photo-1595846519845-68e298c2edd8?w=800'] },
        { id:'mas-6', name:'Павел Кузин', craft:'Монтажник', title:'Монтажник', experience:'Опыт 11 лет', description: 'Монтаж окон, дверей, перегородок и инженерных систем на объекте.', avatar:'ПК', avatarPhoto:'https://i.pravatar.cc/300?img=14', status: 'published', hours: 'Пн-Пт, с 8:00 до 18:00', phone: '+7 (905) 340-22-33', prices: [{service: 'Монтаж двери', cost: 'от 3 500 ₽'}], site: 'https://kuzin-montazh.ru', telegram: 'https://t.me/kuzin_montazh', max: 'https://max.ru/kuzin', gallery: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800','https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800','https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800'] },
        { id:'mas-7', name:'Роман Белов', craft:'Гипсокартонщик', title:'Гипсокартонщик', experience:'Опыт 8 лет', description: 'Перегородки, короба, ниши и потолки из ГКЛ под ключ.', avatar:'РБ', avatarPhoto:'https://i.pravatar.cc/300?img=52', status: 'published', hours: 'Пн-Сб, с 9:00 до 19:00', phone: '+7 (908) 450-33-44', prices: [{service: 'Перегородка ГКЛ', cost: 'от 900 ₽ / м²'}], site: 'https://belov-gkl.ru', telegram: 'https://t.me/belov_gkl', max: 'https://max.ru/belov', gallery: ['https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?w=800','https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800'] },
        { id:'mas-8', name:'Виктор Сазонов', craft:'Кровельщик', title:'Кровельщик', experience:'Опыт 14 лет', description: 'Кровля частных домов: металлочерепица, мягкая кровля, водосток.', avatar:'ВС', avatarPhoto:'https://i.pravatar.cc/300?img=59', status: 'published', hours: 'Пн-Сб, с 8:00 до 18:00', phone: '+7 (909) 560-44-55', prices: [{service: 'Кровля', cost: 'от 850 ₽ / м²'}], site: 'https://sazonov-krovlya.ru', telegram: 'https://t.me/sazonov_krov', max: 'https://max.ru/sazonov', gallery: ['https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800','https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=800','https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800'] },
        { id:'mas-9', name:'Николай Громов', craft:'Плотник', title:'Плотник', experience:'Опыт 16 лет', description: 'Столярные работы: лестницы, откосы, встроенная мебель и каркасы.', avatar:'НГ', avatarPhoto:'https://i.pravatar.cc/300?img=68', status: 'published', hours: 'Пн-Пт, с 9:00 до 18:00', phone: '+7 (902) 670-55-66', prices: [{service: 'Столярные работы', cost: 'от 2 000 ₽ / м.п.'}], site: 'https://gromov-plotnik.ru', telegram: 'https://t.me/gromov_plotnik', max: 'https://max.ru/gromov', gallery: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800','https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=800','https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800'] }
],

            designers: [{ id:'des-1', name:'Елена Власова', title:'Дизайнер интерьеров', description: 'Разрабатываю авторские интерьеры: планировка, свет, материалы и комплектация. Один проект — от идеи до чистовой сдачи.', avatar:'ЕВ', avatarPhoto:'https://i.pravatar.cc/300?img=47', status: 'published', hours: 'Пн-Пт, с 10:00 до 18:00', phone: '+7 (921) 555-12-34', prices: [{service: 'Дизайн-проект', cost: 'от 3 500 ₽ / м²'},{service: 'Планировка', cost: 'от 1 200 ₽ / м²'},{service: '3D-визуализация', cost: 'от 8 000 ₽ / зона'},{service: 'Авторский надзор', cost: 'от 15 000 ₽ / мес.'},{service: 'Комплектация', cost: 'от 25 000 ₽'}], site: 'https://vlasova-design.ru', telegram: 'https://t.me/vlasova', max: 'https://max.ru/vlasova',
             gallery: {
    interior: [
        'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
        'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800',
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
        'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800',
        'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
        'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
        'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800',
        'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
        'https://images.unsplash.com/photo-1618220179428-22790b461013?w=800',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'
    ],
    exterior: [
        'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
        'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800',
        'https://images.unsplash.com/photo-1600047509807-ba8b58359017?w=800',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
        'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
        'https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800'
    ],
    landscape: [
        'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
        'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800',
        'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
        'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=800',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
        'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800',
        'https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800',
        'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800',
        'https://images.unsplash.com/photo-1470058869958-2a77ade41ac3?w=800',
        'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800',
        'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800'
    ]
}
 },
        { id:'des-2', name:'Студия "Эстетика"', title:'Дизайн-бюро', description: 'Создаём стильные и функциональные пространства под ключ: планировка, визуализации и сопровождение ремонта.', avatar:'ЭС', avatarPhoto:'https://i.pravatar.cc/300?img=32', status: 'published', hours: 'Пн-Сб, с 10:00 до 20:00', phone: '+7 (921) 111-22-33', prices: [{service: 'Дизайн-проект', cost: 'от 4 000 ₽ / м²'},{service: 'Планировка', cost: 'от 1 400 ₽ / м²'},{service: '3D-визуализация', cost: 'от 9 000 ₽ / зона'},{service: 'Авторский надзор', cost: 'от 18 000 ₽ / мес.'},{service: 'Комплектация', cost: 'от 30 000 ₽'}], site: 'https://estetika.ru', telegram: 'https://t.me/estetika', max: 'https://max.ru/estetika', gallery: { interior: ['https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800','https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800','https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800','https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800','https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800','https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800','https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800','https://images.unsplash.com/photo-1618220179428-22790b461013?w=800','https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'], exterior: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800','https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800','https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800','https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800','https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800','https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800','https://images.unsplash.com/photo-1600047509807-ba8b58359017?w=800','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800','https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800','https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800'], landscape: ['https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800','https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800','https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=800','https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800','https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800','https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800','https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800','https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800','https://images.unsplash.com/photo-1470058869958-2a77ade41ac3?w=800','https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800','https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800'] } },
        { id:'des-3', name:'Дмитрий Соколов', title:'Дизайнер-декоратор', description: 'Авторский декор, текстиль и подбор мебели: собираю интерьер как цельную картину, без случайных вещей.', avatar:'ДС', avatarPhoto:'https://i.pravatar.cc/300?img=12', status: 'published', hours: 'Пн-Пт, с 9:00 до 18:00', phone: '+7 (903) 444-55-66', prices: [{service: 'Декорирование', cost: 'от 2 500 ₽ / м²'},{service: 'Планировка', cost: 'от 1 000 ₽ / м²'},{service: 'Подбор мебели', cost: 'от 18 000 ₽'},{service: 'Текстиль и свет', cost: 'от 12 000 ₽'},{service: 'Выезд-консультация', cost: 'от 4 500 ₽'}], site: 'https://sokolov.ru', telegram: 'https://t.me/sokolov', max: 'https://max.ru/sokolov', gallery: { interior: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800','https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800','https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800','https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800','https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800','https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800','https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800','https://images.unsplash.com/photo-1618220179428-22790b461013?w=800','https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'], exterior: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800','https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800','https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800','https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800','https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800','https://images.unsplash.com/photo-1600047509807-ba8b58359017?w=800','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800','https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800','https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800'], landscape: ['https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=800','https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800','https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800','https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800','https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800','https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800','https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800','https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800','https://images.unsplash.com/photo-1470058869958-2a77ade41ac3?w=800','https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800','https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800'] } },
        { id:'des-4', name:'Студия "Д-Дизайн"', title:'Дизайн интерьеров', description: 'Комплексный дизайн квартир, домов и коммерции: от планировки до авторского надзора на объекте.', avatar:'ДД', avatarPhoto:'https://i.pravatar.cc/300?img=45', status: 'published', hours: 'Ежедневно, с 10:00 до 21:00', phone: '+7 (911) 777-88-99', prices: [{service: 'Дизайн-проект', cost: 'от 5 000 ₽ / м²'},{service: 'Планировка', cost: 'от 1 800 ₽ / м²'},{service: '3D-визуализация', cost: 'от 12 000 ₽ / зона'},{service: 'Авторский надзор', cost: 'от 22 000 ₽ / мес.'},{service: 'Коммерческие интерьеры', cost: 'от 6 500 ₽ / м²'}], site: 'https://d-design.ru', telegram: 'https://t.me/ddesign', max: 'https://max.ru/ddesign', gallery: { interior: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800','https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800','https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=800','https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800','https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800','https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800','https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800','https://images.unsplash.com/photo-1618220179428-22790b461013?w=800','https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'], exterior: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800','https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800','https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800','https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800','https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800','https://images.unsplash.com/photo-1600047509807-ba8b58359017?w=800','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800','https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800','https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800'], landscape: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800','https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800','https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=800','https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800','https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800','https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800','https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800','https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800','https://images.unsplash.com/photo-1470058869958-2a77ade41ac3?w=800','https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800','https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800'] } },
        { id:'des-5', name:'Анна Кузнецова', title:'Ландшафтный дизайнер', description: 'Проектирую сады, террасы и придомовые территории: планировка участка, посадки и вечерний свет.', avatar:'АК', avatarPhoto:'https://i.pravatar.cc/300?img=20', status: 'published', hours: 'Пн-Пт, с 9:00 до 17:00', phone: '+7 (905) 222-33-44', prices: [{service: 'Ландшафтный проект', cost: 'от 1 500 ₽ / м²'},{service: 'Планировка участка', cost: 'от 900 ₽ / м²'},{service: 'Дендроплан', cost: 'от 18 000 ₽'},{service: 'Освещение сада', cost: 'от 12 000 ₽'},{service: 'Авторский надзор', cost: 'от 10 000 ₽ / мес.'}], site: 'https://kuznetsova.ru', telegram: 'https://t.me/kuznetsova', max: 'https://max.ru/kuznetsova', gallery: { interior: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800','https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800','https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800','https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800','https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800','https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800','https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800','https://images.unsplash.com/photo-1618220179428-22790b461013?w=800','https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'], exterior: ['https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800','https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800','https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800','https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800','https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800','https://images.unsplash.com/photo-1600047509807-ba8b58359017?w=800','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800','https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800','https://images.unsplash.com/photo-1600585152915-d208bec867a1?w=800'], landscape: ['https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800','https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800','https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800','https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=800','https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800','https://images.unsplash.com/photo-1466692476866-aef1dfb1e735?w=800','https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800','https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800','https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800','https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800','https://images.unsplash.com/photo-1464146072230-91cabc968266?w=800','https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800','https://images.unsplash.com/photo-1470058869958-2a77ade41ac3?w=800','https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800','https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800'] } }
],
            companies: [{ id:'comp-1', name:'ООО "ГлавСтройРегион"', title:'Строительство', description: 'Возведение коттеджей.', avatar:'ГС', status: 'published'}],
            cleaning: [
                { id:'cl-1', name:'Мария Соколова', title:'Клининг квартир', description:'Генеральная и поддерживающая уборка. Химчистка мягкой мебели.', avatar:'МС', avatarPhoto:'https://i.pravatar.cc/300?img=47', status:'published', hours:'Ежедневно, 8:00–21:00', phone:'+7 (904) 701-11-22', prices:[{service:'Генеральная уборка', cost:'от 4 500 ₽'},{service:'После ремонта', cost:'от 80 ₽ / м²'}], site:'https://sokolova-clean.ru', telegram:'https://t.me/sokolova_clean', gallery:['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600','https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600'] },
                { id:'cl-2', name:'КлинингПро', title:'Бригада клининга', description:'Офисы, магазины и квартиры. Договор, расходники свои.', avatar:'КП', avatarPhoto:'https://i.pravatar.cc/300?img=32', status:'published', hours:'Пн–Сб, 9:00–20:00', phone:'+7 (903) 712-33-44', prices:[{service:'Офис', cost:'от 35 ₽ / м²'},{service:'Химчистка дивана', cost:'от 2 800 ₽'}], site:'https://kliningpro.ru', telegram:'https://t.me/kliningpro', gallery:['https://images.unsplash.com/photo-1584827386912-baaa86d3e6b4?w=600','https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600'] },
                { id:'cl-3', name:'Игорь Чистов', title:'Уборка после ремонта', description:'Смыв пыли, окна, откосы. Сдача объекта под ключ.', avatar:'ИЧ', avatarPhoto:'https://i.pravatar.cc/300?img=12', status:'published', hours:'Пн–Вс, 8:00–19:00', phone:'+7 (905) 723-44-55', prices:[{service:'Послестрой', cost:'от 90 ₽ / м²'}], site:'https://chistov-clean.ru', telegram:'https://t.me/chistov_clean', gallery:['https://images.unsplash.com/photo-1562259949-e8e6c56d0ae1?w=600','https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600'] },
                { id:'cl-4', name:'ОкнаБлеск', title:'Мойка окон и фасадов', description:'Квартиры, коттеджи, витрины. Высота до 3 этажа.', avatar:'ОБ', avatarPhoto:'https://i.pravatar.cc/300?img=20', status:'published', hours:'Пн–Сб, 8:00–18:00', phone:'+7 (908) 734-55-66', prices:[{service:'Окно', cost:'от 350 ₽'},{service:'Фасад', cost:'от 55 ₽ / м²'}], site:'https://oknablesk.ru', telegram:'https://t.me/oknablesk', gallery:['https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600','https://images.unsplash.com/photo-1497366216548-37526070297c?w=600'] }
            ],
            install: [
                { id:'in-1', name:'Алексей Монтаж', title:'Установка бытовой техники', description:'Стиральные машины, духовые шкафы, варочные панели. Гарантия на работу.', avatar:'АМ', avatarPhoto:'https://i.pravatar.cc/300?img=13', status:'published', hours:'Пн–Сб, 9:00–20:00', phone:'+7 (904) 801-22-33', prices:[{service:'Стиральная машина', cost:'от 2 200 ₽'},{service:'Варочная панель', cost:'от 1 800 ₽'}], site:'https://alex-montazh.ru', telegram:'https://t.me/alex_montazh', gallery:['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600','https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600'] },
                { id:'in-2', name:'СервисТех', title:'Кондиционеры и вентиляция', description:'Монтаж сплит-систем, закладка трасс на этапе ремонта.', avatar:'СТ', avatarPhoto:'https://i.pravatar.cc/300?img=15', status:'published', hours:'Пн–Пт, 9:00–18:00', phone:'+7 (903) 812-33-44', prices:[{service:'Сплит 9–12 BTU', cost:'от 8 500 ₽'},{service:'Закладка трассы', cost:'от 4 000 ₽'}], site:'https://servicetech.ru', telegram:'https://t.me/servicetech_vd', gallery:['https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'] },
                { id:'in-3', name:'Павел Установщик', title:'ТВ, кухня, встраиваемая техника', description:'Кронштейны, вытяжки, посудомойки. Аккуратно по уровню.', avatar:'ПУ', avatarPhoto:'https://i.pravatar.cc/300?img=33', status:'published', hours:'Ежедневно, 10:00–21:00', phone:'+7 (905) 823-44-55', prices:[{service:'ТВ на стену', cost:'от 1 500 ₽'},{service:'Вытяжка', cost:'от 2 400 ₽'}], site:'https://pavel-ust.ru', telegram:'https://t.me/pavel_ust', gallery:['https://images.unsplash.com/photo-1593359677879-a4bb337f0848?w=600','https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600'] }
            ],
            waste: [
                { id:'ws-1', name:'ЭкоВывоз', title:'Контейнер 8 м³', description:'Строительный мусор, мебель, грунт. Подача в день заявки.', avatar:'ЭВ', avatarPhoto:'https://i.pravatar.cc/300?img=52', status:'published', hours:'Пн–Сб, 7:00–19:00', phone:'+7 (904) 901-11-00', prices:[{service:'Контейнер 8 м³', cost:'от 7 500 ₽'},{service:'Мешок ТБО', cost:'от 350 ₽'}], site:'https://ekovyvoz.ru', telegram:'https://t.me/ekovyvoz', gallery:['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600'] },
                { id:'ws-2', name:'ДонОтход', title:'Самосвал и ломовоз', description:'Бой бетона, металлолом, ветки. Документы на утилизацию.', avatar:'ДО', avatarPhoto:'https://i.pravatar.cc/300?img=59', status:'published', hours:'Пн–Пт, 8:00–18:00', phone:'+7 (903) 912-22-11', prices:[{service:'Самосвал', cost:'от 9 000 ₽'},{service:'Металлолом', cost:'по весу'}], site:'https://donothod.ru', telegram:'https://t.me/donothod', gallery:['https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600','https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=600'] },
                { id:'ws-3', name:'Максим Грузовой', title:'Вывоз после ремонта', description:'Газель + грузчики. Подъём мешков с этажа без лифта.', avatar:'МГ', avatarPhoto:'https://i.pravatar.cc/300?img=14', status:'published', hours:'Ежедневно, 8:00–20:00', phone:'+7 (905) 923-33-22', prices:[{service:'Газель + 2 грузчика', cost:'от 4 800 ₽'}], site:'https://maxim-gruz.ru', telegram:'https://t.me/maxim_gruz', gallery:['https://images.unsplash.com/photo-1566576721346-d4a3b2bdef75?w=600','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'] }
            ],
            movers: [
                { id:'mv-1', name:'Бригада Сила', title:'Грузчики на переезд', description:'Квартирный и офисный переезд. Такелаж техники и сейфов.', avatar:'БС', avatarPhoto:'https://i.pravatar.cc/300?img=11', status:'published', hours:'Ежедневно, 7:00–22:00', phone:'+7 (904) 100-55-66', prices:[{service:'Час бригады 2 чел.', cost:'от 1 400 ₽'},{service:'Переезд 1-к', cost:'от 8 000 ₽'}], site:'https://sila-gruz.ru', telegram:'https://t.me/sila_gruz', gallery:['https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600','https://images.unsplash.com/photo-1566576721346-d4a3b2bdef75?w=600'] },
                { id:'mv-2', name:'Дмитрий Грузчик', title:'Разгрузка и подъём', description:'Стройматериалы на этаж, мебель, пианино. Аккуратно.', avatar:'ДГ', avatarPhoto:'https://i.pravatar.cc/300?img=68', status:'published', hours:'Пн–Сб, 8:00–20:00', phone:'+7 (903) 111-66-77', prices:[{service:'Час работы', cost:'от 600 ₽'},{service:'Пианино', cost:'от 5 000 ₽'}], site:'https://dmitry-gruz.ru', telegram:'https://t.me/dmitry_gruz', gallery:['https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600','https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600'] },
                { id:'mv-3', name:'Переезд 161', title:'Переезд под ключ', description:'Газель, упаковка, сборка мебели. Фиксированная смета.', avatar:'П1', avatarPhoto:'https://i.pravatar.cc/300?img=45', status:'published', hours:'Ежедневно, 8:00–21:00', phone:'+7 (905) 122-77-88', prices:[{service:'Переезд 2-к', cost:'от 14 000 ₽'}], site:'https://pereezd161.ru', telegram:'https://t.me/pereezd161', gallery:['https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600','https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600'] }
            ]
        };
       let vacanciesDb = [
            { id: 'vac-1', title: 'Прораб', company: 'СтройТрест', salary: 'от 100 000 ₽', desc: 'Управление объектом, контроль сроков и качества.', req: 'Опыт руководства строительными бригадами.', hours: 'Ненормированный рабочий день', phone: '+7 (999) 000-00-00', status: 'published', avatar: 'ПР', site: 'https://stroytrest.ru', companyPhoto: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600', gallery: { exterior: ['https://tse2.mm.bing.net/th/id/OIP.2cqkzYJCFTRQ2FTi0PQnigHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3'], landscape: [] } },
            { id: 'vac-2', title: 'Строитель', company: 'ООО "ГлавСтройРегион"', salary: 'от 90 000 ₽', desc: 'Общестроительные работы на объектах. Возведение стен, перегородок.', req: 'Опыт работы от 2 лет, ответственность, готовность к интенсивной работе.', hours: 'Пн-Пт, с 8:00 до 17:00', phone: '+7 (900) 111-22-33', status: 'published', avatar: 'СТ', site: 'https://glavstroy.ru', companyPhoto: 'https://tse2.mm.bing.net/th/id/OIP.2cqkzYJCFTRQ2FTi0PQnigHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3', gallery: { interior: [], exterior: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400'], landscape: [] } },
            { id: 'vac-3', title: 'Арматурщик \\ бетонщик', company: 'СтройТрест', salary: 'от 100 000 ₽', desc: 'Вязка арматуры, заливка бетона, работа с опалубкой на монолитных объектах.', req: 'Знание технологий монолитного строительства, чтение чертежей.', hours: 'Вахта 15/15', phone: '+7 (900) 222-33-44', status: 'published', avatar: 'АБ', site: 'https://stroytrest.ru', companyPhoto: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600', gallery: { interior: [], exterior: ['https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=400'], landscape: [] } },
            { id: 'vac-4', title: 'Монтажник СТ и ЖБК', company: 'ВЛКЗ Полимер', salary: 'от 110 000 ₽', desc: 'Монтаж стальных и железобетонных конструкций на промышленных объектах.', req: 'Удостоверение монтажника, допуск к высотным работам обязательны.', hours: 'Пн-Сб, с 9:00 до 19:00', phone: '+7 (900) 333-44-55', status: 'published', avatar: 'МЖ',site: 'https://vlkz.ru', photos:['https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500','https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500','https://images.unsplash.com/photo-1590986701673-7e4e677d1d02?w=500','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500'], gallery: { interior: [], exterior: ['https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400'], landscape: [] } },
            { id: 'vac-5', title: 'Инженер по сварке', company: 'Благовест', salary: 'от 130 000 ₽', desc: 'Контроль сварочных работ на объекте, разработка и проверка технологических карт.', req: 'Действующий НАКС, высшее техническое образование, опыт от 3 лет.', hours: 'Пн-Пт, с 9:00 до 18:00', phone: '+7 (900) 444-55-66', status: 'published', avatar: 'ИС', site: 'https://blagovest.ru', photos:['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500','https://images.unsplash.com/photo-1590986701673-7e4e677d1d02?w=500','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500','https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500'], gallery: { interior: [], exterior: [], landscape: [] } },
            { id: 'vac-6', title: 'Электромонтажник', company: 'Дриада', salary: 'от 95 000 ₽', desc: 'Прокладка кабельных трасс, сборка щитового оборудования, монтаж освещения.', req: 'Группа по электробезопасности не ниже III, умение читать электросхемы.', hours: 'Сменный график 2/2', phone: '+7 (900) 555-66-77', status: 'published', avatar: 'ЭМ', site: 'https://driada.ru', photos:['https://images.unsplash.com/photo-1590986701673-7e4e677d1d02?w=500','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500','https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500','https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500'], gallery: { interior: [], exterior: [], landscape: [] } }
        ];

        const DEFAULT_LIFEHACK_CATEGORIES = ['Ремонт', 'Строительство', 'Своими руками', 'Идеи для дома', 'Материалы', 'Экономия', 'Полезные советы'];
        let lifehackCategories = DEFAULT_LIFEHACK_CATEGORIES.slice();
        let lifehackSavedIds = [];
        let lifehackEditorGallery = [];
        let currentLifehackId = null;
        let lifehackBackTo = 'directory';
        let lifehackFeedOrigin = 'directory';
        let lifehackActiveCat = 'all';
        let lifehackActiveFormat = 'all';
        let lhCheckState = {};
        let lhPollVotes = {};
        let lhPollCounts = {};
        let lhUsefulMine = {};
        let lhUsefulCounts = {};
        let lhBaOn = false;

        let lifehacksDb = [
            { id: 'lh-1', order: 1, status: 'published', category: 'Ремонт', date: '2026-08-22', readMins: 6, title: 'Как быстро и недорого сделать косметический ремонт', excerpt: 'Порядок работ, материалы и приёмы, которые помогают обновить квартиру без капитальных затрат.', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800', images: ['https://images.unsplash.com/photo-1562259949-e8e6c56d0ae1?w=800'], body: 'Косметический ремонт даёт свежий вид без сноса стен и замены инженерии.\n\nНачните с плана: какие комнаты трогаете, какой бюджет и сколько дней реально выделить. Самый заметный эффект дают стены, свет и текстиль.\n\nСначала уберите старые покрытия, которые отслаиваются. Затем выровняйте заметные дефекты шпаклёвкой и покрасьте или поклейте обои. Пол можно обновить линолеумом или кварцвинилом поверх старого, если основание ровное.\n\nСвет меняет комнату сильнее новой мебели: замените жёлтые лампы на нейтральный белый, добавьте одну бра или торшер. В конце — плинтусы, ручки и чистый текстиль.' },
            { id: 'lh-2', order: 2, status: 'published', category: 'Своими руками', date: '2026-08-18', readMins: 5, title: 'Как сделать красивую полку своими руками', excerpt: 'Простой способ сделать функциональную полку из доступных материалов без больших затрат.', image: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=800', images: ['https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800'], body: 'Полка из доски и скрытых креплений выглядит аккуратно и не требует столярного цеха.\n\nВозьмите сухую строганую доску 20–25 мм, шлифовальную бумагу, масло или краску и скрытые полкодержатели. Разметьте уровень на стене и найдите стойки или используйте дюбели под ваш тип стены.\n\nОтшлифуйте кромки, покройте маслом в два слоя. Закрепите держатели строго по уровню, затем насадите полку. Не ставьте сразу тяжёлые предметы: дайте креплениям «сесть».\n\nЕсли стена гипсокартон, используйте специальный крепёж. Для кирпича и бетона достаточно обычных дюбелей.' },
            { id: 'lh-3', order: 3, status: 'published', category: 'Идеи для дома', date: '2026-08-12', readMins: 4, title: 'Идеи ремонта, которые сразу делают квартиру удобнее', excerpt: 'Несколько решений для хранения, света и зонирования, которые работают в типовых планировках.', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800', images: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800'], body: 'Удобство квартиры чаще зависит от деталей, а не от дорогого ремонта.\n\nВ прихожей поставьте закрытый шкаф или хотя бы крючки на разной высоте и полку для ключей. На кухне вынесите повседневную посуду ближе к мойке, а редко используемую — наверх.\n\nСвет лучше делать слоями: общий потолочный, рабочий над столом и мягкий вечерний. В комнате помогает узкий стеллаж вместо глухой стены — он зонирует и хранит вещи.\n\nДля дачи и балкона работают те же принципы: меньше визуального шума, больше закрытых коробов и однотонных поверхностей.' },
            { id: 'lh-4', order: 4, status: 'published', category: 'Строительство', date: '2026-08-08', readMins: 7, title: 'Советы по строительству дома без типичных сюрпризов', excerpt: 'На что смотреть на этапе фундамента, стен и кровли, чтобы не переделывать через год.', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800', images: ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800'], body: 'Большинство дорогих ошибок закладываются ещё до отделки.\n\nСначала геология и проект, потом котлован. Экономия на дренаже и гидроизоляции фундамента почти всегда выходит боком: сырость в цоколе и трещины.\n\nСтены и перекрытия должны совпадать с проектом по толщине и армированию. Не меняйте окна «на глаз» после кладки — это ломает тепловой контур.\n\nКровлю закрывайте сразу после стропил. Временный рубероид на месяцы — риск намочить утеплитель. Ведите фотофиксацию скрытых работ: потом это экономит споры с подрядчиком.' },
            { id: 'lh-5', order: 5, status: 'published', category: 'Материалы', date: '2026-08-04', readMins: 5, title: 'Как выбрать строительные материалы и не переплатить', excerpt: 'На что смотреть в характеристиках, сертификатах и расходе, а не только на цену за упаковку.', image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800', images: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800'], body: 'Дешёвая упаковка часто дороже в пересчёте на квадратный метр.\n\nСмотрите расход, класс износостойкости, морозостойкость и совместимость с основанием. Для пола важны класс и толщина, для краски — укрывистость, для утеплителя — плотность и λ.\n\nБерите материалы одной партии, особенно плитку и обои. Спросите про остатки: на подрезку закладывайте 8–12%.\n\nПеред покупкой большого объёма попросите открыть упаковку и сравните тон. Храните смеси в сухом месте, не на земле.' },
            { id: 'lh-6', order: 6, status: 'published', category: 'Полезные советы', date: '2026-07-28', readMins: 4, title: 'Полезные инструменты, без которых ремонт идёт медленнее', excerpt: 'Базовый набор для дома: что купить один раз и использовать на каждом объекте.', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800', images: ['https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800'], body: 'Хороший инструмент экономит часы и бережёт материалы.\n\nМинимум: лазерный или пузырьковый уровень, рулетка 5–8 м, шуруповёрт, набор свёрл, шпатели, малярный нож и стремянка. Для стен — валик с ванночкой, для плитки — крестики и клинья.\n\nНе экономьте на средствах защиты: очки, перчатки, респиратор при шлифовке. Дешёвый уровень врёт — и вся отделка уходит «винтом».\n\nХраните расходники отдельно: биты, дюбели, малярный скотч. Перед работой разложите всё в зоне досягаемости, чтобы не бегать по квартире.' },
            { id: 'lh-7', order: 7, status: 'published', category: 'Экономия', date: '2026-07-21', readMins: 6, title: 'Способы сэкономить на ремонте без потери качества', excerpt: 'Где резать бюджет безопасно, а где экономия почти всегда приводит к переделке.', image: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800', images: ['https://images.unsplash.com/photo-1484154214963-01d56f8c276c?w=800'], body: 'Экономить лучше на видимом декоре, а не на скрытых работах.\n\nНе сокращайте гидроизоляцию, электрику и подготовку основания. Можно сэкономить на бренде смесителей, обоях и декоративных панелях, если база сделана правильно.\n\nЧасть работ берите на себя: демонтаж, вынос мусора, покраска ровных стен. Закупайте материалы сами по списку мастера, сравнивая цены в двух-трёх местах.\n\nДелайте ремонт поэтапно по комнатам. Так проще контролировать кассу и не замораживать всю квартиру сразу.' },
            { id: 'lh-8', order: 8, status: 'published', category: 'Строительство', date: '2026-07-14', readMins: 5, title: 'Ошибки при строительстве, которые дорого исправлять', excerpt: 'Семь промахов частных заказчиков: от мокрых узлов до «потом как-нибудь проведём вентиляцию».', image: 'https://images.unsplash.com/photo-1541888081682-14cb4d232537?w=800', images: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800'], body: 'Самая дорогая ошибка — менять решения после черновых работ.\n\nНе оставляйте мокрые зоны без уклона и гидроизоляции. Не прячьте электрику без плана розеток. Не ставьте окна без четверти и пены с пароизоляцией.\n\nВентиляция «через форточку» в герметичном доме даёт конденсат и плесень. Перекрытия без расчёта прогибают пол.\n\nФиксируйте договор, смету и скрытые работы. Если подрядчик торопит закрыть этап без фото — остановите приёмку.' },
            { id: 'lh-9', order: 0, status: 'published', category: 'Ремонт', date: '2026-08-28', readMins: 4, title: 'Смета: косметика спальни 12 м² за выходные', excerpt: 'Готовый набор из каталога: краска, ламинат и мебель. Можно сразу сложить в корзину.', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', images: ['https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800'], body: 'Косметика спальни не требует капитального ремонта: стены, пол и одна удобная точка хранения.\n\nСначала замер: 12 м² пола и примерно 30 м² стен без окна. Краску берите с запасом на два слоя. Ламинат — 33 класс, если комната проходная.\n\nДальше — кровать и комод из каталога, чтобы не собирать интерьер по разным сайтам. Ниже смета с позициями магазинов приложения.' }
        ];

        const LIFEHACK_ENGAGE = {
            'lh-1': {
                format: 'estimate',
                productIds: ['prod-5', 'prod-16', 'prod-17'],
                assistantQuery: 'краска ламинат плитка для косметического ремонта',
                checklist: [
                    { id: 'c1', text: 'Выбрать комнаты и бюджет на выходные' },
                    { id: 'c2', text: 'Купить краску с запасом на 2 слоя', productId: 'prod-5' },
                    { id: 'c3', text: 'Обновить пол (ламинат или плитка)', productId: 'prod-16' },
                    { id: 'c4', text: 'Заменить свет и текстиль' }
                ],
                estimate: { title: 'Набор на косметику комнаты', calc: 'Онлайн Калькулятор Ламинат', lines: [
                    { productId: 'prod-5', qty: 1, note: 'стены' },
                    { productId: 'prod-16', qty: 12, note: 'м² пола' },
                    { productId: 'prod-17', qty: 4, note: 'фартук / мокрые зоны' }
                ]},
                steps: [
                    { t: 'План', d: 'Комнаты, бюджет и сколько дней реально выделить.' },
                    { t: 'Стены и пол', d: 'Шпаклёвка, краска в два слоя, пол поверх ровного основания.' },
                    { t: 'Свет', d: 'Нейтральный белый и один дополнительный источник.' }
                ]
            },
            'lh-2': {
                format: 'article', productIds: ['prod-13', 'prod-15'], assistantQuery: 'стеллаж полка крепёж для гипсокартона',
                steps: [
                    { t: 'Доска', d: 'Сухая строганая 20–25 мм, масло или краска.' },
                    { t: 'Крепёж', d: 'Скрытые полкодержатели и дюбели под тип стены.' },
                    { t: 'Навесить', d: 'По уровню. Сразу не грузить — дать креплениям сесть.' }
                ]
            },
            'lh-3': {
                format: 'article', productIds: ['prod-10', 'prod-13', 'prod-8'], assistantQuery: 'шкаф стеллаж кухня чтобы квартира была удобнее',
                steps: [
                    { t: 'Прихожая', d: 'Закрытый шкаф или крючки разной высоты и полка для ключей.' },
                    { t: 'Свет слоями', d: 'Общий, рабочий над столом и мягкий вечерний.' },
                    { t: 'Зона', d: 'Узкий стеллаж вместо глухой стены — хранит и делит комнату.' }
                ]
            },
            'lh-4': {
                format: 'checklist',
                productIds: ['prod-4', 'prod-6', 'prod-18'],
                assistantQuery: 'цемент газобетон кирпич для строительства дома',
                checklist: [
                    { id: 'c1', text: 'Геология и проект до котлована' },
                    { id: 'c2', text: 'Не экономить на фундаменте и дренаже', productId: 'prod-4' },
                    { id: 'c3', text: 'Стены по проекту, не «на глаз»', productId: 'prod-6' },
                    { id: 'c4', text: 'Закрыть кровлю сразу после стропил' },
                    { id: 'c5', text: 'Фото скрытых работ на каждом этапе' }
                ],
                steps: [
                    { t: 'До котлована', d: 'Геология и проект. Не наоборот.' },
                    { t: 'Фундамент', d: 'Дренаж и гидроизоляция — не место для экономии.' },
                    { t: 'Коробка', d: 'Стены по проекту, кровлю закрыть сразу после стропил.' }
                ]
            },
            'lh-5': {
                format: 'poll', featured: true,
                productIds: ['prod-5', 'prod-14', 'prod-16', 'prod-4'],
                assistantQuery: 'как выбрать краску цемент ламинат и не переплатить',
                poll: { id: 'primer-gkl', question: 'Грунтуете гипсокартон перед покраской?', options: [
                    { id: 'yes', label: 'Да, всегда' },
                    { id: 'no', label: 'Нет, сразу краска' },
                    { id: 'idk', label: 'Ещё не знаю' }
                ]}
            },
            'lh-6': { format: 'article', productIds: ['prod-15', 'prod-14'], assistantQuery: 'профиль гипсокартон инструменты для ремонта' },
            'lh-7': { format: 'article', productIds: ['prod-5', 'prod-4', 'prod-16'], assistantQuery: 'сэкономить на ремонте какие материалы купить' },
            'lh-8': {
                format: 'error',
                productIds: ['prod-4', 'prod-14', 'prod-15'],
                assistantQuery: 'ошибки при строительстве штукатурка расходные материалы',
                checklist: [
                    { id: 'c1', text: 'Гидроизоляция мокрых зон до чистовой отделки', productId: 'prod-4' },
                    { id: 'c2', text: 'План розеток до закрытия стен', productId: 'prod-15' },
                    { id: 'c3', text: 'Окна с четвертью и пароизоляцией' },
                    { id: 'c4', text: 'Вентиляция не «через форточку»' },
                    { id: 'c5', text: 'Фото скрытых работ до приёмки' }
                ],
                steps: [
                    { t: 'Мокрые зоны', d: 'Уклон и гидроизоляция до чистовой отделки.' },
                    { t: 'Электрика', d: 'План розеток до закрытия стен.' },
                    { t: 'Воздух', d: 'Вентиляция не «через форточку» в герметичном доме.' }
                ]
            },
            'lh-9': {
                format: 'estimate', featured: false,
                productIds: ['prod-5', 'prod-16', 'prod-2', 'prod-11'],
                assistantQuery: 'кровать 160х200 комод краска ламинат для спальни',
                estimate: { title: 'Спальня 12 м²', calc: 'Онлайн Калькулятор Ламинат', lines: [
                    { productId: 'prod-5', qty: 2, note: '2 слоя стен' },
                    { productId: 'prod-16', qty: 14, note: 'пол + запас' },
                    { productId: 'prod-2', qty: 1, note: 'кровать' },
                    { productId: 'prod-11', qty: 1, note: 'хранение' }
                ]},
                steps: [
                    { t: 'Замер', d: '12 м² пола и около 30 м² стен без окна.' },
                    { t: 'Стены и пол', d: 'Краска на два слоя, ламинат 33 класс с запасом.' },
                    { t: 'Мебель', d: 'Кровать и комод из каталога, без сборки с пяти сайтов.' }
                ]
            }
        };

        const LH_DAILY_TIPS = [
            { title: 'Не экономьте на скрытом', text: 'Гидроизоляция, электрика и основание. Декор меняется, трубы — нет.', id: 'lh-7' },
            { title: 'Фото до приёмки этапа', text: 'Если подрядчик торопит закрыть без снимков — остановите работу.', id: 'lh-8' },
            { title: 'Два слоя краски, не один', text: 'Укрывистость экономит нервы. Берите с запасом на второй проход.', id: 'lh-1' },
            { title: 'Запас плитки — 10%', text: 'На подрез и бой. Диагональ — 12–15%, иначе докупать другую партию.', id: 'lh-5' },
            { title: 'Свет важнее новой мебели', text: 'Нейтральный белый и один дополнительный источник меняют комнату сильнее дивана.', id: 'lh-3' },
            { title: 'Кровлю закрывайте сразу', text: 'Рубероид «на пару месяцев» мочит утеплитель. Это дороже новой крыши.', id: 'lh-4' },
            { title: 'Уровень не экономить', text: 'Дешёвый уровень врёт — и вся отделка уходит винтом.', id: 'lh-6' }
        ];
        const LH_FACTS = [
            { k: '10%', v: 'запас плитки', id: 'lh-5' },
            { k: '2 слоя', v: 'краски', id: 'lh-1' },
            { k: '8–12%', v: 'на подрез', id: 'lh-9' }
        ];
        const LH_USEFUL_SEED = { 'lh-1': 86, 'lh-2': 41, 'lh-3': 54, 'lh-4': 73, 'lh-5': 112, 'lh-6': 38, 'lh-7': 91, 'lh-8': 124, 'lh-9': 67 };

        function persistLhEngage() {
            try { localStorage.setItem('meb_lh_checks', JSON.stringify(lhCheckState)); } catch (e) {}
            try { localStorage.setItem('meb_lh_poll_votes', JSON.stringify(lhPollVotes)); } catch (e) {}
            try { localStorage.setItem('meb_lh_poll_counts', JSON.stringify(lhPollCounts)); } catch (e) {}
            try { localStorage.setItem('meb_lh_useful_mine', JSON.stringify(lhUsefulMine)); } catch (e) {}
            try { localStorage.setItem('meb_lh_useful_counts', JSON.stringify(lhUsefulCounts)); } catch (e) {}
        }
        function loadLhEngageState() {
            try { lhCheckState = JSON.parse(localStorage.getItem('meb_lh_checks') || '{}') || {}; } catch (e) { lhCheckState = {}; }
            try { lhPollVotes = JSON.parse(localStorage.getItem('meb_lh_poll_votes') || '{}') || {}; } catch (e) { lhPollVotes = {}; }
            try { lhPollCounts = JSON.parse(localStorage.getItem('meb_lh_poll_counts') || '{}') || {}; } catch (e) { lhPollCounts = {}; }
            try { lhUsefulMine = JSON.parse(localStorage.getItem('meb_lh_useful_mine') || '{}') || {}; } catch (e) { lhUsefulMine = {}; }
            try {
                const saved = JSON.parse(localStorage.getItem('meb_lh_useful_counts') || 'null');
                lhUsefulCounts = saved && typeof saved === 'object' ? saved : Object.assign({}, LH_USEFUL_SEED);
            } catch (e) { lhUsefulCounts = Object.assign({}, LH_USEFUL_SEED); }
            Object.keys(LH_USEFUL_SEED).forEach(function (id) {
                if (lhUsefulCounts[id] == null) lhUsefulCounts[id] = LH_USEFUL_SEED[id];
            });
        }
        function hydrateLifehacksEngage() {
            if (!Array.isArray(lifehacksDb)) lifehacksDb = [];
            Object.keys(LIFEHACK_ENGAGE).forEach(function (id) {
                var extra = LIFEHACK_ENGAGE[id];
                var item = lifehacksDb.find(function (x) { return x.id === id; });
                if (!item) {
                    if (id === 'lh-9') lifehacksDb.push(Object.assign({ id: 'lh-9', order: 0, status: 'published', category: 'Ремонт', date: '2026-08-28', readMins: 4, title: 'Смета: косметика спальни 12 м² за выходные', excerpt: 'Готовый набор из каталога: краска, ламинат и мебель.', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', images: [], body: 'Готовая смета из каталога приложения.' }, extra));
                    return;
                }
                Object.keys(extra).forEach(function (k) {
                    if (item[k] == null) item[k] = extra[k];
                    else if (Array.isArray(item[k]) && item[k].length === 0 && extra[k]) item[k] = extra[k];
                });
            });
            if (!lhPollCounts['primer-gkl']) lhPollCounts['primer-gkl'] = { yes: 41, no: 12, idk: 8 };
        }

        let state = { currentSlide: 1, totalSlides: 4, currentPromo: 1, totalPromos: 3, isAuthenticated: false, userRole: 'user', userEmail: '', favorites: [], cart: [], designerCategory: 'interior', currentShop: '' };

        // Карта логинов магазинов -> название в shopsProfileDb
        const shopLoginsMap = {
            'shop': 'Любимый Дом',
            'shop1': 'Любимый Дом',
            'shop2': 'Кухни Дриада',
            'shop3': 'Новоселье'
        };

        const FEEDBACK_LINKS = {
            telegram: 'https://t.me/remontik',
            max: 'https://max.ru/remontik'
        };

        let currentPortfolioItem = null;

            window.onload = function() {
    loadAllData();
    if (typeof loadLhEngageState === 'function') loadLhEngageState();
    if (typeof hydrateLifehacksEngage === 'function') hydrateLifehacksEngage();
    if (typeof productsDb !== 'undefined') window.productsDb = productsDb;
    if (typeof lifehacksDb !== 'undefined') window.lifehacksDb = lifehacksDb;
    cleanOldStories();
    loadBuyerProfile();
    loadFavorites();
    loadCart();
    loadMarketplace();
    expireExpiredStoreOrders();
    updateCartBadge();
    renderCart();
    renderProductGrid();
    renderDirectorySubviews();
    renderStories();
    enableStoriesDragScroll();
    try { buildTopFilters(); } catch(e) {}
    try { renderOnboarding(); } catch(e) {}
    try { renderHomeShopPromo(); } catch(e) {}
};

// ==========================================
// УПРАВЛЕНИЕ ОНБОРДИНГОМ (ЕДИНАЯ ЛОГИКА)
// ==========================================

function pickOnboardingSlides() {
    let all = (onboardingData && Array.isArray(onboardingData)) ? onboardingData.filter(s => s && s.image) : [];

    if (all.length === 0) {
        all = [
            { title: 'Кухня Вашей Мечты', desc: 'Рассчитайте стоимость и получите подарок.', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600', badge: 'АКЦИЯ', badgeColor: 'bg-amber-500' },
            { title: 'Современные Решения', desc: 'Готовые кухонные гарнитуры напрямую от фабрик.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', badge: 'ПРЕМИУМ', badgeColor: 'bg-blue-600' },
            { title: 'Мебель Люкс Класса', desc: 'Премиальные дизайнерские кровати.', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600', badge: 'ХИТ', badgeColor: 'bg-emerald-600' },
            { title: 'Надежные мастера', desc: 'Проверенные бригады для вашего ремонта.', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', badge: 'СЕРВИС', badgeColor: 'bg-red-600' }
        ];
        try { localStorage.removeItem('meb_onb_offset'); } catch (e) {}
    }

    onboardingSlides = [];
    let offset = parseInt(localStorage.getItem('meb_onb_offset') || '0') || 0;
    if (offset < 0 || offset >= all.length) offset = 0;

    const ONBOARDING_SHOW = 4;
    const count = Math.min(ONBOARDING_SHOW, all.length);
    for (let i = 0; i < count; i++) {
        onboardingSlides.push(all[(offset + i) % all.length]);
    }

    const nextOffset = (offset + count) % all.length;
    try { localStorage.setItem('meb_onb_offset', String(nextOffset)); } catch (e) {}
}

function renderOnboarding() {
    pickOnboardingSlides();
    const cont = document.getElementById('onb-slides-container');
    const dotsBox = document.getElementById('onb-dots-container');
    const screen = document.getElementById('screen-onboarding');
    if (!cont || !dotsBox || !screen) return;

    state.currentSlide = 1;
    state.totalSlides = onboardingSlides.length;

    let slidesHtml = '';
    let dotsHtml = '';
    for (let i = 0; i < onboardingSlides.length; i++) {
        const s = onboardingSlides[i];
        const hidden = i === 0 ? '' : 'hidden';
        const badgeHtml = s.badge
            ? `<div class="absolute top-3 left-3 onb-badge ${s.badgeColor || 'bg-[#E5195E]'} text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">${s.badge}</div>`
            : '';
        
        slidesHtml += `
            <div id="onb-slide-${i + 1}" class="slide-item w-full ${hidden} flex flex-col items-center animate-scaleUp">
                <div class="w-full max-w-[300px] h-[380px] bg-slate-100 rounded-3xl overflow-hidden shadow-md mb-4 relative border border-slate-100">
                    <img src="${s.image}" class="w-full h-full object-cover">
                    ${badgeHtml}
                </div>
                <h2 class="text-xl font-bold text-slate-900 mb-1.5">${s.title || ''}</h2>
                <p class="text-xs text-slate-500 max-w-[280px] leading-relaxed">${s.desc || ''}</p>
            </div>`;

        const dotActive = i === 0 ? 'bg-[#1e6091] w-6' : 'bg-slate-200 w-2.5';
        dotsHtml += `<button type="button" id="dot-${i + 1}" onclick="goToOnboardingSlide(${i + 1})" class="h-2.5 ${dotActive} rounded-full transition-all duration-300 shrink-0" aria-label="Слайд ${i + 1}"></button>`;
    }

    cont.innerHTML = slidesHtml;
    dotsBox.innerHTML = dotsHtml;
    screen.classList.remove('hidden');
    screen.classList.remove('-translate-y-full');
}

function setOnboardingDot(el, active) {
    if (!el) return;
    el.className = active
        ? 'h-2.5 w-6 rounded-full bg-[#1e6091] transition-all duration-300 shrink-0'
        : 'h-2.5 w-2.5 rounded-full bg-slate-200 transition-all duration-300 shrink-0';
}

function goToOnboardingSlide(n) {
    n = parseInt(n, 10);
    if (!n || n < 1 || n > state.totalSlides || n === state.currentSlide) return;
    const curSlide = document.getElementById('onb-slide-' + state.currentSlide);
    const curDot = document.getElementById('dot-' + state.currentSlide);
    if (curSlide) curSlide.classList.add('hidden');
    setOnboardingDot(curDot, false);
    state.currentSlide = n;
    const nextSl = document.getElementById('onb-slide-' + n);
    const nextDot = document.getElementById('dot-' + n);
    if (nextSl) nextSl.classList.remove('hidden');
    setOnboardingDot(nextDot, true);
}

function closeOnboarding() {
    const screen = document.getElementById('screen-onboarding');
    if (screen) {
        screen.classList.add('-translate-y-full');
        setTimeout(function () { screen.classList.add('hidden'); }, 500);
    }
    if (typeof maybeShowPwaInstallBanner === 'function') {
        setTimeout(maybeShowPwaInstallBanner, 600);
    }
}

function nextSlide() {
    if (state.currentSlide < state.totalSlides) {
        goToOnboardingSlide(state.currentSlide + 1);
        return;
    }
    closeOnboarding();
}

function saveOnbFromEditor() {
    const indexVal = document.getElementById('onb-editor-index').value;
    const title = document.getElementById('onb-editor-title-input').value.trim();
    const desc = document.getElementById('onb-editor-desc').value.trim();
    const badge = document.getElementById('onb-editor-badge').value.trim();
    const badgeColorNode = document.getElementById('onb-editor-badgecolor');
    const badgeColor = badgeColorNode ? badgeColorNode.value : 'bg-amber-500';
    const image = document.getElementById('onb-editor-image').value.trim();

    if (!title || !image) return showSmsToast("Заполните заголовок и фото!");

    const slideObj = { title, desc, image, badge, badgeColor };

    if (indexVal !== '') {
        onboardingData[parseInt(indexVal)] = slideObj;
        showSmsToast("Слайд обновлён!");
    } else {
        if (onboardingData.length >= 20) return showSmsToast("Максимум 20 слайдов!");
        onboardingData.push(slideObj);
        showSmsToast("Слайд добавлен!");
    }

    closeOnbEditor();
    renderCrmOnbList();
    saveAllData();
}
        // Промо (один баннер, карусели больше нет)
        function nextPromo() { /* карусель отключена — один баннер */ }

                // ========== ОЧЕРЕДЬ МОДЕРАЦИИ ВИТРИН ==========
        // Здесь хранятся заявки магазинов на изменение витрины
        let showcaseModerationDb = [];

                // ---Данные сторис --(фото и изменения) ---
        function getDefaultStories() {
            return SEED.stories();
        }
        let storiesData = getDefaultStories();

        // 24 часа только у новых сторис из редактора (id story-*). Базовые сторис главной не истекают.
        function cleanOldStories() {
            const day = 24 * 60 * 60 * 1000;
            const now = Date.now();
            storiesData = storiesData.filter(s => {
                if (!s || !(s.slides && s.slides.length) && !s.image) return false;
                if (!String(s.id || '').startsWith('story-')) return true;
                if (!s.createdAt) return true;
                return (now - s.createdAt) < day;
            });
            if (!storiesData.length) storiesData = getDefaultStories();
        }

                // Прокрутка ленты сторис стрелками
        function scrollStories(direction) {
            const scroller = document.getElementById('stories-scroll');
            if (!scroller) return;
            const amount = 200; // на сколько пикселей листать
            scroller.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
        }

        // Прокрутка ленты сторис перетаскиванием мышью (для ПК)
        function enableStoriesDragScroll() {
            const scroller = document.getElementById('stories-scroll');
            if (!scroller) return;
            let isDown = false, startX, scrollLeft;

            scroller.addEventListener('mousedown', (e) => {
                isDown = true;
                scroller.classList.add('cursor-grabbing');
                startX = e.pageX - scroller.offsetLeft;
                scrollLeft = scroller.scrollLeft;
            });
            scroller.addEventListener('mouseleave', () => { isDown = false; scroller.classList.remove('cursor-grabbing'); });
            scroller.addEventListener('mouseup', () => { isDown = false; scroller.classList.remove('cursor-grabbing'); });
            scroller.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - scroller.offsetLeft;
                const walk = (x - startX) * 1.5;
                scroller.scrollLeft = scrollLeft - walk;
            });
        }

        // Сториз
                function renderStories() {
    cleanOldStories();
    const container = document.getElementById('stories-container');
    if (!container) return;

    let html = '';
    const visibleStories = storiesData.filter(s => s.status === 'published' || !s.status);
    visibleStories.forEach((s, index) => {
        const divider = (index === 1) 
            ? `<div class="flex-shrink-0 w-px h-14 bg-slate-200 mx-1 self-center"></div>` 
            : '';

        const ringColor = s.isLifehack 
            ? 'from-amber-400 to-orange-500' 
            : 'from-[#1e6091] to-[#2a7fb8]';

        html += `
            ${divider}
            <div onclick="openStory('${s.id}')" class="flex flex-col items-center gap-1 flex-shrink-0 cursor-pointer active:scale-95 transition-transform" style="width:64px">
                <div class="p-[2.5px] rounded-full bg-gradient-to-tr ${ringColor}">
                    <div class="p-[2px] bg-white rounded-full">
                        <img src="${s.slides ? s.slides[0] : s.image}" class="w-14 h-14 rounded-full object-cover">
                    </div>
                </div>
                <span class="text-[10px] font-bold text-slate-600 truncate w-full text-center">${s.name}</span>
            </div>`;
    });

    container.innerHTML = html;
}

                // Переменные для листания
        let currentStory = null;
        let slideIndex = 0;
        let storyTimer = null;
        let storyDuration = 4000; // 4 секунды на слайд
        let storyPaused = false;


                // Открыть сторис
        function openStory(id) {
            const s = storiesData.find(x => x.id === id);
            if (!s) return;

            currentStory = s;
            slideIndex = 0;

            document.getElementById('sv-name').textContent = s.name;

            renderSlide();

            const phone = document.getElementById('phone-container');
            const v = document.getElementById('story-viewer');
            if (phone && v && v.parentElement !== phone) phone.appendChild(v);
            v.classList.remove('hidden');
            v.classList.add('flex');
            const status = document.getElementById('phone-status-bar');
            if (status) status.classList.replace('text-black', 'text-white');
        }

                               // Показать текущий слайд (фото ИЛИ видео)
        function renderSlide() {
            const slides = currentStory.slides || [currentStory.image];
            const currentUrl = slides[slideIndex];

            const imgEl = document.getElementById('sv-image');
            const videoEl = document.getElementById('sv-video');

            const avatar = document.getElementById('sv-avatar');
            if (avatar) avatar.src = slides[0];

            // Рисуем полоски прогресса
            const progress = document.getElementById('sv-progress');
            if (progress) {
                progress.innerHTML = '';
                for (let i = 0; i < slides.length; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'flex-1 h-1 rounded-full bg-white/30 overflow-hidden';
                    const fill = document.createElement('div');
                    fill.className = 'story-bar-fill';
                    if (i < slideIndex) fill.style.width = '100%';
                    else fill.style.width = '0%';
                    bar.appendChild(fill);
                    progress.appendChild(bar);
                }
            }

            // Проверяем — это видео или фото?
            if (isVideoUrl(currentUrl)) {
                // ===== ВИДЕО =====
                imgEl.classList.add('hidden');
                videoEl.classList.remove('hidden');
                videoEl.src = currentUrl;
                videoEl.currentTime = 0;
                videoEl.muted = false; // включаем звук
                videoEl.play().catch(() => {
                    // Если браузер блокирует звук — играем без звука
                    videoEl.muted = true;
                    videoEl.play().catch(() => {});
                });
                startVideoStoryTimer(); // таймер по длине видео
            } else {
                // ===== ФОТО =====
                videoEl.pause();
                videoEl.classList.add('hidden');
                videoEl.removeAttribute('src');
                imgEl.classList.remove('hidden');
                imgEl.src = currentUrl;
                startStoryTimer(); // обычный таймер на 4 сек
            }
        }

        // Определяет: ссылка — это видео?
        function isVideoUrl(url) {
            if (!url) return false;
            // Загруженное с устройства видео (data:video/mp4;base64,...) — сразу видео
            if (url.startsWith('data:video')) return true;
            // Обычные ссылки — проверяем расширение
            const u = url.toLowerCase().split('?')[0]; // убираем параметры после ?
            return u.endsWith('.mp4') || u.endsWith('.webm') || u.endsWith('.mov') || u.endsWith('.m4v');
        }

        // Таймер для видео — ждём его окончания и переходим дальше
        function startVideoStoryTimer() {
            clearTimeout(storyTimer);
            storyPaused = false;

            const videoEl = document.getElementById('sv-video');
            const progress = document.getElementById('sv-progress');
            if (!progress || !videoEl) return;

            const bars = progress.querySelectorAll('.story-bar-fill');
            const currentFill = bars[slideIndex];

            // Заполняем полоску по мере проигрывания видео
            videoEl.ontimeupdate = () => {
                if (!videoEl.duration) return;
                const percent = (videoEl.currentTime / videoEl.duration) * 100;
                if (currentFill) {
                    currentFill.style.transition = 'none';
                    currentFill.style.width = percent + '%';
                }
            };

            // Когда видео закончилось — следующий слайд
            videoEl.onended = () => {
                nextStorySlide();
            };
        }

        // Запуск таймера автоперехода + анимация текущей полоски
        function startStoryTimer() {
            clearTimeout(storyTimer);
            storyPaused = false;

            const progress = document.getElementById('sv-progress');
            if (!progress) return;

            // Находим полоску текущего слайда и запускаем её заполнение
            const bars = progress.querySelectorAll('.story-bar-fill');
            const currentFill = bars[slideIndex];
            if (currentFill) {
                currentFill.style.transition = 'none';
                currentFill.style.width = '0%';
                // Небольшая задержка, чтобы браузер применил width:0 перед анимацией
                requestAnimationFrame(() => {
                    currentFill.classList.add('filling');
                    currentFill.style.transitionDuration = storyDuration + 'ms';
                    currentFill.style.width = '100%';
                });
            }

            // Через storyDuration переключаем на следующий слайд
            storyTimer = setTimeout(() => {
                nextStorySlide();
            }, storyDuration);
        }

                // Следующее фото сториса (вправо)
        function nextStorySlide() {
            const slides = currentStory.slides || [currentStory.image];
            if (slideIndex < slides.length - 1) {
                slideIndex++;
                renderSlide();
            } else {
                closeStory();
            }
        }

        // Предыдущее фото сториса (влево)
        function prevStorySlide() {
            if (slideIndex > 0) {
                slideIndex--;
                renderSlide();
            }
        }

        // Предыдущее фото (влево)
        function prevSlide() {
            if (slideIndex > 0) {
                slideIndex--;
                renderSlide();
            }
        }
    
                // Закрыть сторис
        function closeStory() {
            clearTimeout(storyTimer); // останавливаем таймер
            // Останавливаем видео, если оно играло
            const videoEl = document.getElementById('sv-video');
            if (videoEl) {
                videoEl.pause();
                videoEl.removeAttribute('src');
                videoEl.classList.add('hidden');
            }
            const v = document.getElementById('story-viewer');
            v.classList.add('hidden');
            v.classList.remove('flex');
            const status = document.getElementById('phone-status-bar');
            if (status) status.classList.replace('text-white', 'text-black');
        }

        // ===== ПАУЗА ПРИ УДЕРЖАНИИ ЭКРАНА =====

        // Поставить на паузу (палец нажат)
        function pauseStory() {
            storyPaused = true;
            const currentUrl = (currentStory && currentStory.slides) ? currentStory.slides[slideIndex] : '';
            if (isVideoUrl(currentUrl)) {
                // Пауза видео
                const videoEl = document.getElementById('sv-video');
                if (videoEl) videoEl.pause();
            } else {
                // Пауза фото: останавливаем таймер и замораживаем полоску
                clearTimeout(storyTimer);
                const progress = document.getElementById('sv-progress');
                if (progress) {
                    const bars = progress.querySelectorAll('.story-bar-fill');
                    const currentFill = bars[slideIndex];
                    if (currentFill) {
                        // Фиксируем текущую ширину полоски
                        const w = getComputedStyle(currentFill).width;
                        const parentW = getComputedStyle(currentFill.parentElement).width;
                        currentFill.style.transition = 'none';
                        currentFill.style.width = w;
                        // Запоминаем сколько прошло (для продолжения)
                        window.photoPauseRatio = parseFloat(w) / parseFloat(parentW);
                    }
                }
            }
        }

        // Снять с паузы (палец отпущен)
        function resumeStory() {
            if (!storyPaused) return;
            storyPaused = false;
            const currentUrl = (currentStory && currentStory.slides) ? currentStory.slides[slideIndex] : '';
            if (isVideoUrl(currentUrl)) {
                // Продолжаем видео
                const videoEl = document.getElementById('sv-video');
                if (videoEl) videoEl.play().catch(() => {});
            } else {
                // Продолжаем фото с того места, где остановились
                const ratio = window.photoPauseRatio || 0;
                const remaining = storyDuration * (1 - ratio);
                const progress = document.getElementById('sv-progress');
                if (progress) {
                    const bars = progress.querySelectorAll('.story-bar-fill');
                    const currentFill = bars[slideIndex];
                    if (currentFill) {
                        requestAnimationFrame(() => {
                            currentFill.classList.add('filling');
                            currentFill.style.transitionDuration = remaining + 'ms';
                            currentFill.style.width = '100%';
                        });
                    }
                }
                clearTimeout(storyTimer);
                storyTimer = setTimeout(() => { nextStorySlide(); }, remaining);
            }
        }

                function renderProductGrid() {
    let html = '';
    let found = 0;

    const minEl = document.getElementById('filter-price-min');
    const maxEl = document.getElementById('filter-price-max');
    const minPrice = minEl && minEl.value ? parseInt(minEl.value) : null;
    const maxPrice = maxEl && maxEl.value ? parseInt(maxEl.value) : null;

    for (const key in productsDb) {
        const prod = productsDb[key];
        if (prod.status !== 'published') continue;

        if (selectedFilterCategory) {
            const cat = (prod.category || '').toLowerCase();
            const sub = (prod.subcategory || '').toLowerCase();
            const wantCat = selectedFilterCategory.toLowerCase();
            const catMatch = cat.includes(wantCat) || wantCat.includes(cat) || sub.includes(wantCat);
            if (!catMatch) continue;
        }

        if (selectedFilterSub) {
            const cat = (prod.category || '').toLowerCase();
            const sub = (prod.subcategory || '').toLowerCase();
            const wantSub = selectedFilterSub.toLowerCase();
            const subMatch = sub.includes(wantSub) || wantSub.includes(sub) || cat.includes(wantSub);
            if (!subMatch) continue;
        }

        if (minPrice !== null || maxPrice !== null) {
            const numPrice = parseInt((prod.price || '').replace(/\D/g, '')) || 0;
            if (minPrice !== null && numPrice < minPrice) continue;
            if (maxPrice !== null && numPrice > maxPrice) continue;
        }

        found++;
        html += productCardHtml(prod);
    }

    if (found === 0) {
        html = `<div class="col-span-2 text-center py-10 text-slate-400 text-sm">Ничего не найдено</div>`;
    }

    document.getElementById('product-grid').innerHTML = html;
}

        window.specCraftFilter = 'все';

        function specCraftOf(spec) {
            if (spec && spec.craft) return spec.craft;
            const t = String(spec && spec.title || '').toLowerCase();
            if (t.includes('плиточ')) return 'Плиточник';
            if (t.includes('электр')) return 'Электрик';
            if (t.includes('сантех')) return 'Сантехник';
            if (t.includes('штукатур') || t.includes('маляр')) return 'Штукатур';
            if (t.includes('отделоч')) return 'Отделочник';
            if (t.includes('гипсокарт')) return 'Гипсокартонщик';
            if (t.includes('монтаж')) return 'Монтажник';
            if (t.includes('кровл')) return 'Кровельщик';
            if (t.includes('плотн')) return 'Плотник';
            const raw = String(spec && spec.title || 'Мастер').split('/')[0].trim();
            return raw || 'Мастер';
        }

        function setSpecCraftFilter(craft) {
            window.specCraftFilter = craft || 'все';
            renderSpecialistsList();
        }

        function renderSpecialistsList() {
            const specContainer = document.getElementById('specialists-list-container');
            const chipsEl = document.getElementById('spec-craft-chips');
            const countEl = document.getElementById('spec-count');
            const published = (directoryDb && directoryDb.specialists ? directoryDb.specialists : []).filter(s => s.status === 'published');
            const crafts = [];
            published.forEach(s => {
                const c = specCraftOf(s);
                if (c && crafts.indexOf(c) === -1) crafts.push(c);
            });
            const active = window.specCraftFilter || 'все';
            if (chipsEl) {
                chipsEl.innerHTML = ['Все'].concat(crafts).map(label => {
                    const val = label === 'Все' ? 'все' : label;
                    const on = active === val ? ' on' : '';
                    return `<button type="button" onclick="setSpecCraftFilter('${val}')" class="comm-chip${on}">${label}</button>`;
                }).join('');
            }
            const filtered = active === 'все' ? published : published.filter(s => specCraftOf(s) === active);
            if (countEl) countEl.textContent = filtered.length ? (filtered.length + ' мастеров') : 'Мастера';
            if (!specContainer) return;
            if (!filtered.length) {
                specContainer.innerHTML = '<div class="py-12 text-center text-sm text-slate-400">Мастеров в этой категории пока нет</div>';
                return;
            }
            specContainer.innerHTML = filtered.map(spec => {
                const craft = specCraftOf(spec);
                return `
                <div onclick="openPortfolioModal('specialists', '${spec.id}')" class="p-4 rounded-2xl border border-slate-100 bg-white space-y-2 shadow-sm cursor-pointer hover:border-slate-300 transition-all mb-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3 min-w-0">
                            <div class="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-[#1e6091] text-white font-bold text-xs flex-shrink-0">${spec.avatarPhoto ? `<img src="${spec.avatarPhoto}" class="w-full h-full object-cover">` : spec.avatar}</div>
                            <div class="min-w-0">
                                <h4 class="font-medium text-slate-800 text-sm serif-font truncate">${spec.name}</h4>
                                <p class="text-[10px] text-slate-400">${spec.title}</p>
                            </div>
                        </div>
                        <span class="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-[#e8f1fc] text-[#1e6091]">${craft}</span>
                    </div>
                    <p class="text-xs text-slate-500 line-clamp-2">${spec.description}</p>
                    <span class="text-[10px] text-[#1e6091] font-bold block text-right">Посмотреть портфолио</span>
                </div>`;
            }).join('');
        }

        function renderSpecCompaniesList() {
            const el = document.getElementById('spec-companies-list');
            if (!el) return;
            const firms = [];
            for (const compName in companiesProfileDb) {
                const c = companiesProfileDb[compName];
                if (!c || c.status !== 'published' || c.kind !== 'remont') continue;
                firms.push({ name: compName, c: c });
            }
            if (!firms.length) {
                el.innerHTML = '<div class="py-12 text-center text-sm text-slate-400">Компаний пока нет</div>';
                return;
            }
            el.innerHTML = firms.map(function (item, i) {
                const c = item.c;
                return '<div onclick="openCompanyCatalogModal(\'' + item.name + '\')" class="sc-firm">' +
                    '<div class="sc-firm-body">' +
                        '<div>' +
                            '<h4 class="sc-firm-title">' + item.name + '</h4>' +
                            '<p class="sc-firm-co">Ремонт под ключ</p>' +
                            '<p class="sc-firm-desc">' + (c.description || '') + '</p>' +
                        '</div>' +
                        '<span class="sc-firm-go">Открыть профиль</span>' +
                    '</div>' +
                    '<div class="sc-firm-photo">' +
                        '<img src="' + (c.banner || '') + '" alt="">' +
                    '</div>' +
                '</div>';
            }).join('');
        }

        window.lsPlot = 10;
        const LS_PLOTS = [
            { n: 6, t: '6 соток' },
            { n: 10, t: '10 соток' },
            { n: 15, t: '15+ соток' }
        ];
        const LS_ATELIER = {
            'Флора Сервис': { focus: 'Сад под ключ', rate: 18500, zone: 'Посадки и полив' },
            'Зелёный Двор': { focus: 'Газон и изгороди', rate: 12400, zone: 'Партер' },
            'ПаркЛэнд': { focus: 'Крупномеры и двор', rate: 21000, zone: 'Деревья' },
            'Сад и Стиль': { focus: 'Проект и свет', rate: 16800, zone: 'Патио' }
        };
        const LS_SEASONS = [
            { id: 'all', t: 'Год' },
            { id: 'spring', t: 'Весна' },
            { id: 'summer', t: 'Лето' },
            { id: 'autumn', t: 'Осень' },
            { id: 'winter', t: 'Зима' }
        ];
        const LS_SEASON_NOTE = {
            all: 'Работы идут весь год: зимой проектируем, весной сажаем, летом ведём сад, осенью готовим грунт.',
            spring: 'Весна — посадка, рулонный газон, запуск автополива и первая стрижка живых изгородей.',
            summer: 'Лето — стрижка, цветники, полив и уход. Удобный момент для освещения и малых форм.',
            autumn: 'Осень — пересадка крупномеров, дренаж, укрытие и подготовка газона к зиме.',
            winter: 'Зима — концепция, дендроплан и смета. К весне участок уже в графике работ.'
        };
        const LS_SEASON_NOW = {
            0: { id: 'winter', t: 'Сейчас январь — сезон концепции и сметы.' },
            1: { id: 'winter', t: 'Сейчас февраль — дендроплан и график посадок.' },
            2: { id: 'spring', t: 'Сейчас март — готовим грунт и автополив.' },
            3: { id: 'spring', t: 'Сейчас апрель — посадка и рулонный газон.' },
            4: { id: 'spring', t: 'Сейчас май — цветники и живые изгороди.' },
            5: { id: 'summer', t: 'Сейчас июнь — стрижка и полив в сезоне.' },
            6: { id: 'summer', t: 'Сейчас июль — уход, свет и малые формы.' },
            7: { id: 'summer', t: 'Сейчас август — сад в пике, удобно править зоны.' },
            8: { id: 'autumn', t: 'Сейчас сентябрь — крупномеры и дренаж.' },
            9: { id: 'autumn', t: 'Сейчас октябрь — пересадка и подготовка к зиме.' },
            10: { id: 'autumn', t: 'Сейчас ноябрь — укрытие и завершение грунта.' },
            11: { id: 'winter', t: 'Сейчас декабрь — проект сада к весне.' }
        };
        const LS_STAGES = [
            { n: '01', t: 'Концепция', d: 'Эскиз, зонирование и пожелания по саду' },
            { n: '02', t: 'Дендроплан', d: 'Посадки, полив, освещение и смета' },
            { n: '03', t: 'Реализация', d: 'Газон, МАФ, посадка и инженерка' },
            { n: '04', t: 'Уход', d: 'Сезонное сопровождение участка' }
        ];
        const LS_ZONES = [
            { id: 'lawn', t: 'Газон', d: 'Партер и стрижка' },
            { id: 'entry', t: 'Вход', d: 'Аллея и фасад' },
            { id: 'patio', t: 'Патио', d: 'Терраса и свет' },
            { id: 'plant', t: 'Посадки', d: 'Деревья и цветники' }
        ];
        const LS_SEASON_PHOTOS = {
            spring: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900', 'https://images.unsplash.com/photo-1466692476866-aef1dfb1e735?w=900'],
            summer: ['https://images.unsplash.com/photo-1558904541-efa843a96f01?w=900', 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=900'],
            autumn: ['https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900', 'https://images.unsplash.com/photo-1507371341162-163c0ced3133?w=900'],
            winter: ['https://images.unsplash.com/photo-1482517967863-00e15c9b5745?w=900', 'https://images.unsplash.com/photo-1457269449834-928af64c6909?w=900']
        };
        function lsMoney(n) {
            return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
        }
        function lsOfferSeason(title) {
            const t = String(title || '').toLowerCase();
            if (/проект|дизайн|дендро/.test(t)) return 'winter';
            if (/посад|газон|полив/.test(t)) return 'spring';
            if (/стриж|уход|свет|освещ|изгород/.test(t)) return 'summer';
            if (/крупномер|альпин|дренаж|благоустр|террас|маф/.test(t)) return 'autumn';
            return 'all';
        }
        function lsArchitectFor(s) {
            const names = ['Илья Садовников', 'Марина Роща', 'Павел Клён', 'Елена Луга'];
            const photos = [
                'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
                'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
                'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400'
            ];
            const h = (typeof shopHash === 'function') ? shopHash(s && s.name) : 0;
            const i = h % names.length;
            const d = (typeof shopDomain === 'function') ? shopDomain(s) : 'studio.ru';
            const n = 120 + (h % 780);
            const x = String(10000000 + n).slice(-7);
            return {
                name: names[i],
                photo: photos[i],
                phone: '+7 (904) ' + x.slice(0, 3) + '-' + x.slice(3, 5) + '-' + x.slice(5),
                email: 'architect@' + d
            };
        }
        function setLsPlot(n) {
            window.lsPlot = Number(n) || 10;
            renderLandscapingList();
            if (window.lsStudioName) fillLandscapeStudio();
        }
        function lsPhotoSet(s) {
            const extra = [
                'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=800',
                'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
                'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800',
                'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
                'https://images.unsplash.com/photo-1466692476866-aef1dfb1e735?w=800',
                'https://images.unsplash.com/photo-1470058869958-2a77ade41aa9?w=800',
                'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800',
                'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800'
            ];
            const seen = {};
            const out = [];
            const add = function (src) {
                if (!src || seen[src]) return;
                seen[src] = 1;
                out.push(src);
            };
            add(s && s.banner);
            (s && s.gallery || []).forEach(add);
            ((s && s.offers) || []).forEach(function (o) { add(o.image); });
            extra.forEach(add);
            return out;
        }
        function renderLandscapingList() {
            const el = document.getElementById('landscaping-list');
            const plot = window.lsPlot || 10;
            const month = (new Date()).getMonth();
            const now = LS_SEASON_NOW[month] || LS_SEASON_NOW[8];
            if (!window.lsSeason) window.lsSeason = now.id || 'all';
            if (!el) return;
            const studios = [];
            for (const name in shopsProfileDb) {
                const s = shopsProfileDb[name];
                if (!s || s.status !== 'published' || s.kind !== 'landscape') continue;
                studios.push({ name: name, s: s });
            }
            if (!studios.length) {
                el.innerHTML = '<div class="py-10 text-center text-sm text-sky-200/70">Нет студий</div>';
                return;
            }
            el.innerHTML = studios.map(function (row) {
                const s = row.s;
                const meta = LS_ATELIER[row.name] || { focus: 'Сад', rate: 15000 };
                const est = lsMoney(meta.rate * plot);
                return '<div onclick="openLandscapeStudio(\'' + row.name + '\')" class="ls-list-card">' +
                    '<img src="' + (s.banner || '') + '" alt="">' +
                    '<div class="veil"></div>' +
                    '<span class="tag">от ' + est + '</span>' +
                    '<div class="copy">' +
                        '<div><h4>' + row.name + '</h4><p>' + (meta.focus || s.description || '') + '</p></div>' +
                        '<button type="button" class="go" onclick="event.stopPropagation();openLandscapeStudio(\'' + row.name + '\')">Паспорт участка</button>' +
                    '</div></div>';
            }).join('');
        }
        function lsPing(msg) {
            if (typeof showSmsToast === 'function') showSmsToast(msg);
            const t = document.getElementById('sms-toast');
            if (t) t.style.zIndex = '95';
        }
        function requestLandscapeOffer(storeName, i) {
            const shop = shopsProfileDb[storeName];
            const o = shop && shop.offers && shop.offers[i];
            if (!o) return;
            lsPing('В график: «' + o.title + '» · ' + storeName);
        }
        function openLandscapeStudio(name) {
            const s = shopsProfileDb[name];
            if (!s || s.kind !== 'landscape') return;
            window.lsStudioName = name;
            if (!window.lsSeason) {
                const now = LS_SEASON_NOW[(new Date()).getMonth()] || LS_SEASON_NOW[8];
                window.lsSeason = now.id;
            }
            fillLandscapeStudio();
            const modal = document.getElementById('ls-studio-modal');
            if (modal) modal.classList.remove('hidden');
        }
        function closeLandscapeStudio() {
            const modal = document.getElementById('ls-studio-modal');
            if (modal) modal.classList.add('hidden');
        }
        function setLsSeason(id) {
            window.lsSeason = id || 'all';
            fillLandscapeStudio();
        }
        function lsRequestVisit() {
            const name = window.lsStudioName || 'ателье';
            const plot = window.lsPlot || 10;
            lsPing('Выезд на участок: «' + name + '», ' + plot + ' соток. Свяжемся в рабочий день.');
        }
        function lsRequestZone(t) {
            lsPing('Зона «' + t + '» добавлена в бриф участка.');
        }
        function lsCallArchitect() {
            const s = shopsProfileDb[window.lsStudioName];
            if (!s) return;
            const a = lsArchitectFor(s);
            lsPing('Соединяем с архитектором: ' + a.name);
            try { window.location.href = 'tel:' + String(a.phone || '').replace(/[^\d+]/g, ''); } catch (e) {}
        }
        function lsOpenTelegram(e) {
            if (e) { e.preventDefault(); e.stopPropagation(); }
            const s = shopsProfileDb[window.lsStudioName];
            const url = (s && s.telegram) || '';
            lsPing('Telegram: ' + ((s && s.name) || 'студия'));
            if (url && url !== '#') {
                try { window.open(url, '_blank'); } catch (err) {}
            }
            return false;
        }
        function lsOpenMap() {
            const s = shopsProfileDb[window.lsStudioName];
            const loc = (s && s.address) || 'Волгодонск';
            lsPing('Карта: ' + loc);
            try { window.open('https://yandex.ru/maps/?text=' + encodeURIComponent(loc), '_blank'); } catch (e) {}
        }
        function fillLandscapeStudio() {
            const root = document.getElementById('ls-studio-root');
            const name = window.lsStudioName;
            const s = shopsProfileDb[name];
            if (!root || !s) return;
            const season = window.lsSeason || 'all';
            const seasonPhotos = LS_SEASON_PHOTOS[season] || [];
            const hero = seasonPhotos[0] || s.banner || '';
            const staff = lsArchitectFor(s);
            const tg = s.telegram || '#';
            const site = (s.site || '').replace(/^https?:\/\//, '');
            const seasons = LS_SEASONS.map(function (c) {
                return '<button type="button" class="ls-season' + (season === c.id ? ' on' : '') + '" onclick="setLsSeason(\'' + c.id + '\')">' + c.t + '</button>';
            }).join('');
            const zones = LS_ZONES.map(function (z) {
                return '<button type="button" class="ls-zone" onclick="lsRequestZone(\'' + z.t + '\')"><b>Зона</b><strong>' + z.t + '</strong><span>' + z.d + '</span></button>';
            }).join('');
            const offers = (s.offers || []).slice();
            offers.sort(function (a, b) {
                const am = lsOfferSeason(a.title) === season ? 0 : 1;
                const bm = lsOfferSeason(b.title) === season ? 0 : 1;
                return am - bm;
            });
            const works = offers.map(function (o) {
                const idx = (s.offers || []).indexOf(o);
                const match = season === 'all' || lsOfferSeason(o.title) === season || lsOfferSeason(o.title) === 'all';
                return '<div class="ls-work' + (match ? '' : ' off') + '" onclick="requestLandscapeOffer(\'' + name + '\', ' + idx + ')">' +
                    '<i>' + String(idx + 1).padStart(2, '0') + '</i>' +
                    '<div><h4>' + o.title + '</h4><em>' + (match ? 'в этом сезоне' : 'можно заложить в график') + '</em></div>' +
                    '<b>' + o.price + '</b></div>';
            }).join('');
            const mosaic = lsPhotoSet(s).slice(0, 3);
            while (mosaic.length < 3) mosaic.push(hero);
            const mosaicHtml = mosaic.map(function (src) {
                return '<img src="' + src + '" alt="" onclick="openAvatarModal(\'' + src + '\')">';
            }).join('');
            root.innerHTML =
                '<div class="ls-pass-top">' +
                    '<div><p class="ls-kicker">Паспорт участка</p><h2>' + s.name + '</h2></div>' +
                    '<button type="button" class="ls-close" onclick="closeLandscapeStudio()"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg></button>' +
                '</div>' +
                '<div class="ls-pass-hero">' +
                    '<img src="' + hero + '" alt="" onclick="openAvatarModal(\'' + hero + '\')">' +
                    '<div class="veil"></div>' +
                    '<div class="ls-seasons">' + seasons + '</div>' +
                '</div>' +
                '<div class="ls-scroll">' +
                    '<p class="ls-sec">Сад на фото</p>' +
                    '<div class="ls-mosaic">' + mosaicHtml + '</div>' +
                    '<p class="ls-sec">План зон</p>' +
                    '<div class="ls-zones">' + zones + '</div>' +
                    '<p class="ls-note">' + (LS_SEASON_NOTE[season] || LS_SEASON_NOTE.all) + '</p>' +
                    '<p class="ls-sec">В график студии</p>' + works +
                    '<button type="button" class="ls-arch" onclick="lsCallArchitect()"><img src="' + staff.photo + '" alt=""><div><p>Ландшафтный архитектор</p><strong>' + staff.name + '</strong><span>' + staff.phone + '</span></div></button>' +
                    '<button type="button" class="ls-addr" onclick="lsOpenMap()">' + (s.address || '') + (site ? ' · ' + site : '') + '</button>' +
                '</div>' +
                '<div class="ls-bar">' +
                    '<button type="button" class="ls-bar-main" onclick="lsRequestVisit()">Выезд на участок</button>' +
                    '<a class="ls-bar-ghost" href="' + tg + '" target="_blank" rel="noopener" onclick="return lsOpenTelegram(event)">Telegram</a>' +
                '</div>';
        }
        window.otherCat = 'cleaning';
        const OTHER_META = {
            cleaning: { title: 'Клининг', sub: 'Уборка квартир, офисов и после ремонта' },
            install: { title: 'Монтаж и установка техники', sub: 'Бытовая техника, сплиты и встраиваемые системы' },
            waste: { title: 'Вывоз мусора и сырья', sub: 'Контейнер, самосвал, строительный бой' },
            movers: { title: 'Грузчики', sub: 'Переезд, подъём на этаж и разгрузка' }
        };
        function openOtherProfiles(cat) {
            window.otherCat = cat || 'cleaning';
            switchDirectoryView('other-profiles');
        }
        function renderOtherProfiles() {
            const cat = window.otherCat || 'cleaning';
            const meta = OTHER_META[cat] || OTHER_META.cleaning;
            const titleEl = document.getElementById('other-profiles-title');
            const subEl = document.getElementById('other-profiles-sub');
            const listEl = document.getElementById('other-profiles-list');
            if (titleEl) titleEl.textContent = meta.title;
            if (subEl) subEl.textContent = meta.sub;
            if (!listEl) return;
            const items = (directoryDb[cat] || []).filter(function (s) { return s.status === 'published'; });
            if (!items.length) {
                listEl.innerHTML = '<div class="py-12 text-center text-sm text-slate-400">Анкет пока нет</div>';
                return;
            }
            listEl.innerHTML = items.map(function (spec) {
                return `<div onclick="openPortfolioModal('${cat}', '${spec.id}')" class="p-4 rounded-2xl border border-[#d7e6f2] bg-white space-y-2 shadow-[0_8px_24px_rgba(30,96,145,0.08)] cursor-pointer active:scale-[0.99] transition-transform">
                    <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center space-x-3 min-w-0">
                            <div class="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-[#1e6091] text-white font-bold text-xs flex-shrink-0">${spec.avatarPhoto ? `<img src="${spec.avatarPhoto}" class="w-full h-full object-cover">` : spec.avatar}</div>
                            <div class="min-w-0">
                                <h4 class="font-bold text-slate-800 text-sm truncate">${spec.name}</h4>
                                <p class="text-[10px] text-[#1e6091] font-semibold">${spec.title}</p>
                            </div>
                        </div>
                    </div>
                    <p class="text-xs text-slate-500 line-clamp-2">${spec.description}</p>
                    <span class="text-[10px] text-[#1e6091] font-bold block text-right">Открыть анкету</span>
                </div>`;
            }).join('');
        }

        window.stState = { cat: 'все', quick: 'all', crew: false, today: false, favOnly: false, unit: 'shift', sort: 'pop', shifts: 1 };
        window.stFavs = [];
        window.stCurrent = null;
        window.stPhotoI = 0;
        window.stPhoneShown = false;
        const ST_CATS = ['Все', 'Землеройная', 'Грузовые', 'Манипуляторы', 'Подъём', 'Транспорт', 'Коммунальная', 'Складская'];
        const ST_QUICK = [
            { id: 'all', label: 'Все' },
            { id: 'Трактор', label: 'Трактор' },
            { id: 'КАМАЗ', label: 'КАМАЗ' },
            { id: 'Газель', label: 'Газель' },
            { id: 'Погрузчик', label: 'Погрузчик' },
            { id: 'Кран', label: 'Кран' },
            { id: 'Экскаватор', label: 'Экскаватор' }
        ];
        function stRub(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; }
        function stAvailText(a) { return a === 'today' ? 'Свободно сегодня' : a === 'tomorrow' ? 'Завтра' : 'Свободно на неделе'; }
        function stFiltered() {
            const s = window.stState;
            const q = ((document.getElementById('st-search') || {}).value || '').trim().toLowerCase();
            let list = (spectechDb || []).slice();
            if (s.cat && s.cat !== 'все') list = list.filter(x => x.cat === s.cat);
            if (s.quick && s.quick !== 'all') list = list.filter(x => x.type === s.quick || (x.name || '').indexOf(s.quick) !== -1);
            if (s.crew) list = list.filter(x => x.crew);
            if (s.today) list = list.filter(x => x.available === 'today');
            if (s.favOnly) list = list.filter(x => window.stFavs.indexOf(x.id) !== -1);
            if (q) list = list.filter(x => (x.name + ' ' + x.type + ' ' + x.cat + ' ' + x.company).toLowerCase().indexOf(q) !== -1);
            if (s.sort === 'cheap') list.sort((a, b) => a.priceShift - b.priceShift);
            else if (s.sort === 'exp') list.sort((a, b) => b.priceShift - a.priceShift);
            return list;
        }
        function stSyncChips() {
            const s = window.stState;
            const crew = document.getElementById('st-chip-crew');
            const today = document.getElementById('st-chip-today');
            const unit = document.getElementById('st-chip-unit');
            const fav = document.getElementById('st-chip-fav');
            const sort = document.getElementById('st-chip-sort');
            if (crew) crew.className = 'comm-chip' + (s.crew ? ' on' : '');
            if (today) today.className = 'comm-chip' + (s.today ? ' on' : '');
            if (unit) { unit.className = 'comm-chip on'; unit.textContent = s.unit === 'hour' ? 'За час' : 'За смену'; }
            if (fav) fav.className = 'comm-chip' + (s.favOnly ? ' on' : '');
            if (sort) sort.textContent = s.sort === 'cheap' ? 'Сначала дешевле' : s.sort === 'exp' ? 'Сначала дороже' : 'Сначала популярные';
        }
        function setStCat(cat) { window.stState.cat = cat || 'все'; renderSpectech(); }
        function setStQuick(id) { window.stState.quick = id || 'all'; renderSpectech(); }
        function toggleStCrew() { window.stState.crew = !window.stState.crew; renderSpectech(); }
        function toggleStToday() { window.stState.today = !window.stState.today; renderSpectech(); }
        function toggleStFavOnly() { window.stState.favOnly = !window.stState.favOnly; renderSpectech(); }
        function toggleStUnit() { window.stState.unit = window.stState.unit === 'hour' ? 'shift' : 'hour'; renderSpectech(); if (window.stCurrent) fillSpectechModal(window.stCurrent); }
        function cycleStSort() { window.stState.sort = window.stState.sort === 'pop' ? 'cheap' : window.stState.sort === 'cheap' ? 'exp' : 'pop'; renderSpectech(); }
        function toggleStFav(id, ev) {
            if (ev) ev.stopPropagation();
            const i = window.stFavs.indexOf(id);
            if (i >= 0) window.stFavs.splice(i, 1); else window.stFavs.push(id);
            renderSpectech();
            if (window.stCurrent && window.stCurrent.id === id) stSyncModalFav();
        }
        function toggleStFavCurrent() { if (window.stCurrent) toggleStFav(window.stCurrent.id); }
        function stSyncModalFav() {
            const btn = document.getElementById('st-modal-fav');
            if (!btn || !window.stCurrent) return;
            const on = window.stFavs.indexOf(window.stCurrent.id) !== -1;
            btn.innerHTML = on ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linejoin="round" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linejoin="round" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
            btn.style.color = on ? '#E5195E' : '#fff';
        }
        function renderSpectech() {
            const quickEl = document.getElementById('st-quick-row');
            const chipsEl = document.getElementById('st-cat-chips');
            const listEl = document.getElementById('st-list');
            const countEl = document.getElementById('st-count');
            const s = window.stState;
            if (quickEl) {
                quickEl.innerHTML = ST_QUICK.map(q => {
                    const on = s.quick === q.id ? ' on' : '';
                    const mark = q.id === 'all' ? 'Все' : q.label.slice(0, 2);
                    return `<button type="button" class="st-quick${on}" onclick="setStQuick('${q.id}')"><span class="st-quick-ico text-[12px] font-extrabold tracking-wide">${mark}</span><span class="text-[10px] font-bold text-slate-600">${q.label}</span></button>`;
                }).join('');
            }
            if (chipsEl) {
                chipsEl.innerHTML = ST_CATS.map(c => {
                    const val = c === 'Все' ? 'все' : c;
                    return `<button type="button" onclick="setStCat('${val}')" class="comm-chip${s.cat === val ? ' on' : ''}">${c}</button>`;
                }).join('');
            }
            stSyncChips();
            const list = stFiltered();
            const parkEl = document.getElementById('st-park-n');
            const todayEl = document.getElementById('st-today-n');
            if (parkEl) parkEl.textContent = String((spectechDb || []).length);
            if (todayEl) todayEl.textContent = String((spectechDb || []).filter(x => x.available === 'today').length);
            if (countEl) countEl.textContent = list.length ? (list.length + ' единиц в аренду') : 'Ничего не найдено';
            if (!listEl) return;
            if (!list.length) {
                listEl.innerHTML = '<div class="py-12 text-center text-sm text-slate-400">Нет техники по этим условиям</div>';
                return;
            }
            listEl.innerHTML = list.map(item => {
                const price = s.unit === 'hour' ? stRub(item.priceHour) + ' / час' : stRub(item.priceShift) + ' / смена';
                const fav = window.stFavs.indexOf(item.id) !== -1;
                const wait = item.available !== 'today';
                return `<div onclick="openSpectechModal('${item.id}')" class="st-card active:scale-[0.99] transition-transform">
                    <div class="relative h-40 bg-slate-200">
                        <img src="${item.photo}" class="w-full h-full object-cover" alt="">
                        <div class="absolute inset-0 bg-gradient-to-t from-[#12283c]/80 via-transparent to-transparent"></div>
                        <button type="button" onclick="toggleStFav('${item.id}', event)" class="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/35 backdrop-blur text-white text-sm flex items-center justify-center" style="color:${fav ? '#E5195E' : '#fff'}">${fav ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linejoin="round" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path stroke-linejoin="round" d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>'}</button>
                        <span class="absolute top-2.5 left-2.5 text-[9px] font-extrabold uppercase tracking-wider bg-[#1e6091] text-white px-2 py-1 rounded-full">${item.cat}</span>
                        <div class="absolute bottom-2.5 left-3 right-3 flex items-end justify-between">
                            <h4 class="text-white font-extrabold text-[15px] leading-tight drop-shadow pr-2">${item.name}</h4>
                            <span class="shrink-0 text-[12px] font-extrabold text-sky-200">${price}</span>
                        </div>
                    </div>
                    <div class="px-3.5 py-3 flex items-center justify-between gap-2">
                        <div class="min-w-0">
                            <p class="text-[11px] font-semibold text-slate-700 truncate">${item.company}</p>
                            <p class="text-[10px] text-slate-400">${item.crew ? 'С экипажем' : 'Без экипажа'} · <span class="mk-rating"><svg class="mk-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg>${item.rating}</span></p>
                        </div>
                        <span class="st-avail${wait ? ' wait' : ''} shrink-0"><i></i>${stAvailText(item.available)}</span>
                    </div>
                </div>`;
            }).join('');
        }
        function openSpectechModal(id) {
            const item = (spectechDb || []).find(x => x.id === id);
            if (!item) return;
            window.stCurrent = item;
            window.stPhotoI = 0;
            window.stPhoneShown = false;
            window.stState.shifts = item.minShift || 1;
            fillSpectechModal(item);
            const m = document.getElementById('spectech-modal');
            if (m) m.classList.remove('hidden');
        }
        function closeSpectechModal() {
            const m = document.getElementById('spectech-modal');
            if (m) m.classList.add('hidden');
            window.stCurrent = null;
        }
        function stModalPhotos() {
            const item = window.stCurrent;
            if (!item) return [];
            return (item.photos && item.photos.length) ? item.photos : [item.photo];
        }
        function stCyclePhoto(dir) {
            const photos = stModalPhotos();
            if (!photos.length) return;
            window.stPhotoI = (window.stPhotoI + (dir || 1) + photos.length) % photos.length;
            const img = document.getElementById('st-modal-photo');
            if (img) img.src = photos[window.stPhotoI];
            stRenderDots();
        }
        function stRenderDots() {
            const el = document.getElementById('st-modal-dots');
            const photos = stModalPhotos();
            if (!el) return;
            el.innerHTML = photos.map((_, i) => `<span class="inline-block h-1.5 rounded-full ${i === window.stPhotoI ? 'w-5 bg-sky-300' : 'w-1.5 bg-white/40'}"></span>`).join('');
        }
        function fillSpectechModal(item) {
            const s = window.stState;
            const photos = stModalPhotos();
            document.getElementById('st-modal-photo').src = photos[window.stPhotoI] || item.photo;
            document.getElementById('st-modal-cat').textContent = item.cat + ' · ' + item.type;
            document.getElementById('st-modal-title').textContent = item.name;
            document.getElementById('st-modal-price').textContent = s.unit === 'hour' ? stRub(item.priceHour) : stRub(item.priceShift);
            document.getElementById('st-modal-price-sub').textContent = s.unit === 'hour' ? 'за моточас' : 'за смену 8 часов';
            const av = document.getElementById('st-modal-avail');
            av.className = 'st-avail' + (item.available === 'today' ? '' : ' wait');
            av.innerHTML = '<i></i>' + stAvailText(item.available);
            document.getElementById('st-modal-company').textContent = item.company;
            document.getElementById('st-modal-loc').textContent = item.loc || 'Волгодонск';
            document.getElementById('st-modal-rating').innerHTML = '<svg class="mk-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg><span>' + item.rating + '</span>';
            document.getElementById('st-modal-desc').textContent = item.desc + (item.extra ? ' ' + item.extra : '');
            document.getElementById('st-modal-specs').innerHTML = (item.specs || []).map(sp => `<div class="st-spec"><p class="text-[10px] text-slate-400">${sp[0]}</p><p class="font-bold text-slate-800 mt-0.5">${sp[1]}</p></div>`).join('');
            document.getElementById('st-modal-includes').innerHTML = (item.includes || []).map(t => `<span class="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#e8f1fc] text-[#1e6091]">${t}</span>`).join('');
            document.getElementById('st-modal-delivery').textContent = item.delivery;
            document.getElementById('st-modal-min').textContent = (item.minShift || 1) + ' смена';
            document.getElementById('st-modal-note').textContent = (item.crew ? 'Экипаж в цене · ' : 'Без экипажа · ') + (item.delivery || '');
            stRenderDots();
            stSyncModalFav();
            stUpdateTotal();
        }
        function stShiftDelta(d) {
            const item = window.stCurrent;
            if (!item) return;
            const min = item.minShift || 1;
            window.stState.shifts = Math.max(min, Math.min(14, (window.stState.shifts || 1) + d));
            stUpdateTotal();
        }
        function stUpdateTotal() {
            const item = window.stCurrent;
            if (!item) return;
            const n = window.stState.shifts || 1;
            document.getElementById('st-modal-shifts').textContent = n;
            const total = n * item.priceShift;
            document.getElementById('st-modal-total').textContent = stRub(total);
        }
        function revealSpectechPhone() {
            const item = window.stCurrent;
            if (!item) return;
            window.stPhoneShown = true;
            showSmsToast(item.phone);
        }
        function requestSpectech() {
            const item = window.stCurrent;
            if (!item) return;
            const n = window.stState.shifts || 1;
            showSmsToast('Заявка: ' + item.name + ', ' + n + ' смен. ' + item.company + ' перезвонит за 10 минут.');
        }

       function renderDirectorySubviews() {
    // 1. Магазины
    let shopsHtml = '';
    let realEstateHtml = '';
    
    for (const store in shopsProfileDb) {
        if(shopsProfileDb[store].status !== 'published') continue;
        const shopData = shopsProfileDb[store];
        if (shopData.kind === 'landscape') continue;
        const badge = shopData.isRealEstate ? (shopData.category || 'Недвижимость') : 'Магазин';
        const btnText = shopData.isRealEstate ? 'Перейти к каталогу' : 'Витрина';
        const clickAction = shopData.isRealEstate ? `openRealEstateCatalog('${store}')` : `openShopCatalogModal('${store}')`;
        const imgClass = shopData.bannerFit === 'contain' ? 'object-contain bg-[#132337]' : 'object-cover';
        const cardHtml = `
            <div onclick="${clickAction}" class="relative w-full h-44 rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.99] transition-transform mb-3">
                <img src="${shopData.banner}" class="absolute inset-0 w-full h-full ${imgClass}">
                <div class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent"></div>
                <div class="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[10px] font-medium px-3 py-1.5 rounded-full">${badge}</div>
                <div class="absolute inset-0 p-4 flex flex-col justify-between max-w-[68%]">
                    <div>
                        <h4 class="text-white font-semibold text-xl leading-tight drop-shadow">${store}</h4>
                        <p class="text-white/90 text-xs mt-1.5 leading-snug line-clamp-2">${shopData.description}</p>
                    </div>
                    <span class="text-[12px] font-medium text-sky-200/90">${btnText}</span>
                </div>
            </div>`;

        if (shopData.isRealEstate) {
            realEstateHtml += cardHtml;
        } else {
            shopsHtml += cardHtml;
        }
    }
    
    const shopsContainer = document.getElementById('shops-list-container');
    if (shopsContainer) shopsContainer.innerHTML = shopsHtml;
    
    const reContainer = document.getElementById('realestate-list-container');
    if (reContainer) reContainer.innerHTML = realEstateHtml;

    // 2. Компании
    let companiesHtml = '';
    for (const compName in companiesProfileDb) {
        if(companiesProfileDb[compName].status !== 'published') continue;
        const compData = companiesProfileDb[compName];
        if (compData.kind === 'remont') continue;
        const rating = compData.rating || '5.0';
        const years = compData.years || 'На рынке';
        const category = compData.category || 'Компания';
        const iconColor = compData.iconColor || 'bg-[#1e6091]';
        const icon = compData.icon || compName.slice(0, 2).toUpperCase();
        
        companiesHtml += `
            <div onclick="openCompanyCatalogModal('${compName}')" class="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm cursor-pointer hover:border-slate-300 transition-all flex mb-3">
                <div class="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                    <div>
                        <h4 class="font-extrabold text-slate-900 text-base leading-tight mk-name">${compName}<svg class="mk-verified" viewBox="0 0 24 24" aria-label="Проверенная компания"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></h4>
                        <p class="text-[11px] text-slate-500 leading-snug mt-1 line-clamp-2">${compData.description}</p>
                        <div class="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                            <span class="mk-rating"><svg class="mk-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/></svg></span>
                            <span class="font-bold text-slate-700">${rating}</span>
                            <span class="text-slate-300">·</span>
                            <span>${years}</span>
                        </div>
                    </div>
                    <span class="text-[11px] text-[#1e6091] font-bold mt-2">Подробнее</span>
                </div>
                <div class="relative w-32 shrink-0 bg-slate-100">
                    <img src="${compData.banner}" class="w-full h-full object-cover">
                    <div class="absolute top-2 right-2 w-10 h-10 rounded-full ${iconColor} flex items-center justify-center text-white text-[11px] font-bold shadow-md">${icon}</div>
                    <div class="absolute bottom-2 right-2 left-2 bg-black/70 text-white text-[9px] font-bold px-2 py-1 rounded-lg text-center leading-tight">${category}</div>
                </div>
            </div>`;
    }
    const compContainer = document.getElementById('companies-list-container');
    if (compContainer) compContainer.innerHTML = companiesHtml;

    if (typeof renderSpecialistsList === 'function') renderSpecialistsList();
    if (typeof renderSpecCompaniesList === 'function') renderSpecCompaniesList();
    if (typeof renderSpectech === 'function') renderSpectech();
    if (typeof renderLandscapingList === 'function') renderLandscapingList();
    if (typeof renderOtherProfiles === 'function') renderOtherProfiles();

    // 4. Дизайнеры
    let desHtml = '';
    if (directoryDb && directoryDb.designers) {
        directoryDb.designers.filter(s => s.status === 'published').forEach(des => {
            const t = (des.title || '').toLowerCase();
            const tags = t.includes('ландшафт') ? ['сад', 'терраса', 'участок']
                : t.includes('декор') ? ['декор', 'мебель', 'стиль']
                : t.includes('бюро') ? ['бюро', 'под ключ', 'проект']
                : (des.name || '').includes('Д-Дизайн') ? ['квартиры', 'дома', 'офисы']
                : ['интерьер', 'проект', '3D'];
            const tagsHtml = tags.map(tag => `<span class="text-[10px] px-2 py-0.5 rounded-md bg-[#e8f1fc] text-[#5b9bd5]">${tag}</span>`).join('');
            const avatarInner = des.avatarPhoto
                ? `<img src="${des.avatarPhoto}" class="w-full h-full object-cover">`
                : des.avatar;
            desHtml += `
                <div onclick="openPortfolioModal('designers', '${des.id}')" class="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100 mb-3 flex items-start gap-3 cursor-pointer active:scale-[0.99] transition-transform">
                    <div class="relative shrink-0">
                        <div class="w-14 h-14 rounded-full overflow-hidden bg-[#dbeafe] flex items-center justify-center text-[#3b82f6] font-bold text-sm">${avatarInner}</div>
                        <div class="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#93c5fd] flex items-center justify-center shadow">
                            <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-slate-900 text-sm leading-tight">${des.name}</h4>
                        <p class="text-[11px] text-[#5b9bd5] font-medium mt-0.5">${des.title}</p>
                        <p class="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">${des.description}</p>
                        <div class="flex flex-wrap gap-1.5 mt-2">${tagsHtml}</div>
                    </div>
                    <div class="flex flex-col items-center shrink-0 pt-1">
                        <div class="w-9 h-9 rounded-full bg-[#e8f1fc] flex items-center justify-center text-[#5b9bd5]">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </div>
                        <span class="text-[9px] text-[#5b9bd5] font-medium mt-1">Портфолио</span>
                    </div>
                </div>`;
        });
    }
    const desContainer = document.getElementById('designers-list-container');
    if (desContainer) desContainer.innerHTML = desHtml;

    // 5. Вакансии
    let vacHtml = '';
    if (typeof vacanciesDb !== 'undefined') {
        vacanciesDb.filter(v => v.status === 'published').forEach((vac, i) => {
            const photo = vac.companyPhoto || (vac.photos && vac.photos[0]) || (vac.gallery && vac.gallery.exterior && vac.gallery.exterior[0]) || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600';
            vacHtml += `
                <div onclick="openVacancyModal('${vac.id}')" class="sc-firm">
                    <div class="sc-firm-body">
                        <div>
                            <h4 class="sc-firm-title">${vac.title}</h4>
                            <p class="sc-firm-salary">${vac.salary || 'Зарплата по договорённости'}</p>
                            <p class="sc-firm-co">${vac.company}</p>
                            <p class="sc-firm-desc">${vac.desc}</p>
                        </div>
                        <span class="sc-firm-go">Подробнее</span>
                    </div>
                    <div class="sc-firm-photo">
                        <img src="${photo}" alt="">
                    </div>
                </div>`;
        });
    }
    const vacContainer = document.getElementById('jobs-accordion-container');
    if (vacContainer) vacContainer.innerHTML = vacHtml;
    if (typeof renderLifehacksHome === 'function') renderLifehacksHome();
}

                // === ДАННЫЕ ПОДКАТЕГОРИЙ "ЛАНДШАФТ" ===
        let landscapeData = [
            { name: 'Малые формы', image: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?w=300' },
            { name: 'Дорожки', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=300' },
            { name: 'Ограждения', image: 'https://i.pinimg.com/1200x/de/92/bc/de92bc58069fe7280ed45dc4ea4f5ef2.jpg' },
            { name: 'Освещение', image: 'https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=300' },
            { name: 'Водоёмы', image: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=300' },
            { name: 'Системы полива', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300' },
            { name: 'Зеленые зоны', image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=300' }
        ];

        // === ОТКРЫТЬ ЭКРАН "ЛАНДШАФТ" ===
        function openLandscape() {
            document.getElementById('subview-product_categories').classList.add('hidden');
            document.getElementById('subview-landscape').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
            renderLandscape();
        }

        // === ДАННЫЕ ПОДКАТЕГОРИЙ "ИНСТРУМЕНТЫ" ===
let toolsData = [
    { name: 'Электроинструменты', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300' },
    { name: 'Ручной инструмент', image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=300' },
    { name: 'Измерительный инструмент', image: 'https://images.unsplash.com/photo-1544385561-5817c4194492?w=300' },
    { name: 'Расходные материалы', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300' },
    { name: 'Строительное оборудование', image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=300' },
    { name: 'Спецодежда и СИЗ', image: 'https://tse4.mm.bing.net/th/id/OIP.6g6fGcBGdWlNKAibKwhM5AHaHa?r=0&rs=1&pid=ImgDetMain&o=7&rm=3' }
];

// === ОТКРЫТЬ ЭКРАН "ИНСТРУМЕНТЫ" ===
function openTools() {
    document.getElementById('subview-product_categories').classList.add('hidden');
    document.getElementById('subview-tools').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
    renderTools();
}

// === НАЗАД В КАТАЛОГ (для инструментов) ===
function backFromTools() {
    document.getElementById('subview-tools').classList.add('hidden');
    document.getElementById('subview-product_categories').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
}

// === РЕНДЕР ПОДКАТЕГОРИЙ ИНСТРУМЕНТОВ ===
function renderTools() {
    let html = '';
    toolsData.forEach(item => {
        html += `
            <div onclick="openLightbox('${item.image}')" class="goods-sub-row">
                <div class="goods-sub-thumb">
                    <img src="${item.image}" class="w-full h-full object-cover">
                </div>
                <span class="text-slate-800 text-sm font-medium leading-snug">${item.name}</span>
            </div>`;
    });
    document.getElementById('tools-grid').innerHTML = html;
}

        // === НАЗАД В КАТАЛОГ (для ландшафта) ===
        function backFromLandscape() {
            document.getElementById('subview-landscape').classList.add('hidden');
            document.getElementById('subview-product_categories').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
        }

        // === РЕНДЕР ПОДКАТЕГОРИЙ ЛАНДШАФТА (СТИЛЬ OZON) ===
        function renderLandscape() {
            let html = '';
            landscapeData.forEach(item => {
                html += `
                    <div onclick="openLightbox('${item.image}')" class="goods-sub-row">
                        <div class="goods-sub-thumb">
                            <img src="${item.image}" class="w-full h-full object-cover">
                        </div>
                        <span class="text-slate-800 text-sm font-medium leading-snug">${item.name}</span>
                    </div>`;
            });
            document.getElementById('landscape-grid').innerHTML = html;
        }


                // === ДАННЫЕ ПОДКАТЕГОРИЙ "АКСЕССУАРЫ" ===
        let accessoriesData = [
            { name: 'Текстиль', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=300' },
            { name: 'Освещение', image: 'https://images.unsplash.com/photo-1524634126442-357e0eac3c14?w=300' },
            { name: 'Декор', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=300' },
            { name: 'Зеркала', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=300' },
            { name: 'Часы', image: 'https://images.unsplash.com/photo-1495856458515-0637185db551?w=300' },
            { name: 'Аксессуары для ванной', image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=300' },
            { name: 'Кухонные мелочи', image: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=300' }
        ];

        // === ОТКРЫТЬ ЭКРАН "АКСЕССУАРЫ" ===
        function openAccessories() {
            document.getElementById('subview-product_categories').classList.add('hidden');
            document.getElementById('subview-accessories').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
            renderAccessories();
        }

        // === НАЗАД В КАТАЛОГ (для аксессуаров) ===
        function backFromAccessories() {
            document.getElementById('subview-accessories').classList.add('hidden');
            document.getElementById('subview-product_categories').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
        }

        // === РЕНДЕР ПОДКАТЕГОРИЙ АКСЕССУАРОВ (СТИЛЬ OZON) ===
        function renderAccessories() {
            let html = '';
            accessoriesData.forEach(item => {
                html += `
                    <div onclick="openLightbox('${item.image}')" class="goods-sub-row">
                        <div class="goods-sub-thumb">
                            <img src="${item.image}" class="w-full h-full object-cover">
                        </div>
                        <span class="text-slate-800 text-sm font-medium leading-snug">${item.name}</span>
                    </div>`;
            });
            document.getElementById('accessories-grid').innerHTML = html;
        }


                // === ДАННЫЕ ПОДКАТЕГОРИЙ "САНТЕХНИКА" ===
        let plumbingData = [
            { name: 'Ванная комната', image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=300' },
            { name: 'Унитаз/Биде', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300' },
            { name: 'Раковины', image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?w=300' },
            { name: 'Комплектующие', image: 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=300' }
        ];

        // === ОТКРЫТЬ ЭКРАН "САНТЕХНИКА" ===
        function openPlumbing() {
            document.getElementById('subview-product_categories').classList.add('hidden');
            document.getElementById('subview-plumbing').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
            renderPlumbing();
        }

        // === НАЗАД В КАТАЛОГ (для сантехники) ===
        function backFromPlumbing() {
            document.getElementById('subview-plumbing').classList.add('hidden');
            document.getElementById('subview-product_categories').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
        }

        // === РЕНДЕР ПОДКАТЕГОРИЙ САНТЕХНИКИ (СТИЛЬ OZON) ===
        function renderPlumbing() {
            let html = '';
            plumbingData.forEach(item => {
                html += `
                    <div onclick="openLightbox('${item.image}')" class="goods-sub-row">
                        <div class="goods-sub-thumb">
                            <img src="${item.image}" class="w-full h-full object-cover">
                        </div>
                        <span class="text-slate-800 text-sm font-medium leading-snug">${item.name}</span>
                    </div>`;
            });
            document.getElementById('plumbing-grid').innerHTML = html;
        }


                // === ДАННЫЕ ПОДКАТЕГОРИЙ "МЕБЕЛЬ" ===
        let furnitureData = [
            { name: 'Мягкая мебель', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300' },
            { name: 'Корпусная мебель', image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=300' },
            { name: 'Столы и стулья', image: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=300' },
            { name: 'Кухонная мебель', image: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=300' },
            { name: 'Спальная мебель', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=300' },
            { name: 'Мебель для прихожей', image: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=300' },
            { name: 'Детская мебель', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=300' },
            { name: 'Мебель для ванны', image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=300' }
        ];

        // === ОТКРЫТЬ ЭКРАН "МЕБЕЛЬ" ===
        function openFurniture() {
            document.getElementById('subview-product_categories').classList.add('hidden');
            document.getElementById('subview-furniture').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
            renderFurniture();
        }

        // === НАЗАД В КАТАЛОГ (для мебели) ===
        function backFromFurniture() {
            document.getElementById('subview-furniture').classList.add('hidden');
            document.getElementById('subview-product_categories').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
        }

        // === РЕНДЕР ПОДКАТЕГОРИЙ МЕБЕЛИ (СТИЛЬ OZON) ===
        function renderFurniture() {
            let html = '';
            furnitureData.forEach(item => {
                html += `
                    <div onclick="openLightbox('${item.image}')" class="goods-sub-row">
                        <div class="goods-sub-thumb">
                            <img src="${item.image}" class="w-full h-full object-cover">
                        </div>
                        <span class="text-slate-800 text-sm font-medium leading-snug">${item.name}</span>
                    </div>`;
            });
            document.getElementById('furniture-grid').innerHTML = html;
        }


                // === ДАННЫЕ ПОДКАТЕГОРИЙ "ОТДЕЛОЧНЫЕ МАТЕРИАЛЫ" ===
        let finishingMaterialsData = [
            { name: 'Стены и поверхности', image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=300' },
            { name: 'Полы', image: 'https://i.pinimg.com/1200x/76/ee/a5/76eea57d49aae6d51277c78f6bcf9a71.jpg' },
            { name: 'Потолки', image: 'https://images.unsplash.com/photo-1615529162924-f8605388461d?w=300' },
            { name: 'Окна', image: 'https://images.unsplash.com/photo-1509644851169-2acc08aa25b5?w=300' },
            { name: 'Фасад и внешняя отделка', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300' },
            { name: 'Декоративные элементы', image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=300' },
            { name: 'Краски и покрытия по дереву', image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=300' },
            { name: 'Герметики и клеи', image: 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=300' },
            { name: 'Инструменты и расходники', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300' }
        ];

        // === ОТКРЫТЬ ЭКРАН "ОТДЕЛОЧНЫЕ МАТЕРИАЛЫ" ===
        function openFinishingMaterials() {
            document.getElementById('subview-product_categories').classList.add('hidden');
            document.getElementById('subview-finishing_materials').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
            renderFinishingMaterials();
        }

        // === НАЗАД В КАТАЛОГ (для отделочных) ===
        function backFromFinishing() {
            document.getElementById('subview-finishing_materials').classList.add('hidden');
            document.getElementById('subview-product_categories').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
        }

        // === РЕНДЕР ПОДКАТЕГОРИЙ ОТДЕЛОЧНЫХ (СТИЛЬ OZON) ===
        function renderFinishingMaterials() {
            let html = '';
            finishingMaterialsData.forEach(item => {
                html += `
                    <div onclick="openLightbox('${item.image}')" class="goods-sub-row">
                        <div class="goods-sub-thumb">
                            <img src="${item.image}" class="w-full h-full object-cover">
                        </div>
                        <span class="text-slate-800 text-sm font-medium leading-snug">${item.name}</span>
                    </div>`;
            });
            document.getElementById('finishing-materials-grid').innerHTML = html;
        }

                // === ДАННЫЕ ПОДКАТЕГОРИЙ "СТРОИТЕЛЬНЫЕ МАТЕРИАЛЫ" ===
        let buildingMaterialsData = [
            { name: 'Бетон и растворы', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=300' },
            { name: 'Арматура и металлопрокат', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300' },
            { name: 'Кирпич и блоки', image: 'https://images.unsplash.com/photo-1590725140246-20acdee442be?w=300' },
            { name: 'Дерево и древесноволокнистые материалы', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300' },
            { name: 'Изоляционные материалы', image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=300' },
            { name: 'Кровля и гидроизоляция', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300' },
            { name: 'Крепеж и фурнитура', image: 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=300' },
            { name: 'Инструменты и оборудование', image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=300' },
            { name: 'Утеплители', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=300' },
            { name: 'Технологические расходники', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300' }
        ];

        // === ОТКРЫТЬ ЭКРАН "СТРОИТЕЛЬНЫЕ МАТЕРИАЛЫ" ===
        function openBuildingMaterials() {
            document.getElementById('subview-product_categories').classList.add('hidden');
            document.getElementById('subview-building_materials').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
            renderBuildingMaterials();
        }

        // === НАЗАД В КАТАЛОГ ТОВАРОВ ===
        function backToProductCatalog() {
            document.getElementById('subview-building_materials').classList.add('hidden');
            document.getElementById('subview-product_categories').classList.remove('hidden');
            document.getElementById('main-scroll-container').scrollTop = 0;
        }

        // === РЕНДЕР ПОДКАТЕГОРИЙ ===
        function renderBuildingMaterials() {
            let html = '';
            buildingMaterialsData.forEach(item => {
                html += `
                    <div onclick="openLightbox('${item.image}')" class="goods-sub-row">
                        <div class="goods-sub-thumb">
                            <img src="${item.image}" class="w-full h-full object-cover">
                        </div>
                        <span class="text-slate-800 text-sm font-medium leading-snug">${item.name}</span>
                    </div>`;
            });
            document.getElementById('building-materials-grid').innerHTML = html;
        }

                // === ПЕРЕХОД С ГЛАВНОЙ В КАТАЛОГ ТОВАРОВ (категории со стрелками) ===
        function openProductCatalogFromHome() {
            // Прячем все главные вкладки
            ['catalog','directory','cart','favorites','profile'].forEach(t => {
                const v = document.getElementById(`view-${t}`);
                if (v) v.classList.add('hidden');
            });
            // Прячем все подэкраны каталога
            ['product_categories','shops','specialists','spec-private','spec-companies','spectech','landscaping','other','other-profiles','designers','companies','jobs','building_materials','finishing_materials','furniture','plumbing','accessories','landscape', 'realestate', 're-agencies', 're-commercial', 're-catalog', 'lifehacks', 'lifehack-article'].forEach(sv => {
                const el = document.getElementById(`subview-${sv}`);
                if (el) el.classList.add('hidden');
            });
            // Показываем экран "Каталог Товаров"
            const cat = document.getElementById('subview-product_categories');
            if (cat) cat.classList.remove('hidden');
            // Подсвечиваем таб "Каталог" в нижнем меню
            ['home','directory','cart','favorites','profile'].forEach(t => {
                const btn = document.getElementById(`tab-${t}`);
                if (btn) btn.className = (t === 'cart')
                    ? 'relative flex flex-col items-center justify-center flex-1 py-1 text-slate-400'
                    : 'flex flex-col items-center justify-center flex-1 py-1 text-slate-400';
            });
            const dirBtn = document.getElementById('tab-directory');
            if (dirBtn) dirBtn.className = 'flex flex-col items-center justify-center flex-1 py-1 text-blue-600';
            // Прокрутка вверх
            const scroll = document.getElementById('main-scroll-container');
            if (scroll) scroll.scrollTop = 0;
        }

                // === ПЕРЕХОД В КАТАЛОГ ТОВАРОВ ПО КНОПКЕ ФИЛЬТР ===
        function goToProductCatalog() {
            // Прячем главную страницу
            document.getElementById('view-catalog').classList.add('hidden');
            // Прячем директорию (справочник), чтобы Назад работал правильно
            document.getElementById('view-directory').classList.add('hidden');
            // Показываем каталог товаров
            document.getElementById('subview-product_categories').classList.remove('hidden');
            // Прокрутка вверх
            document.getElementById('main-scroll-container').scrollTop = 0;
            // Очищаем поиск и показываем все товары
            const input = document.getElementById('catalog-search-input');
            if (input) input.value = '';
            renderCatalogProducts('');
        }

        // === РЕНДЕР ТОВАРОВ В КАТАЛОГЕ ===
        function renderCatalogProducts(query) {
            const q = (query || '').toLowerCase();
            let html = '';
            for (const key in productsDb) {
                const prod = productsDb[key];
                if (prod.status !== 'published') continue;
                // Фильтруем по названию, магазину и категории
                const text = (prod.title + ' ' + prod.store + ' ' + (prod.category || '')).toLowerCase();
                if (q && !text.includes(q)) continue;
                html += productCardHtml(prod);
            }
            const grid = document.getElementById('catalog-product-grid');
            if (grid) grid.innerHTML = html || `<p class="col-span-2 text-center text-xs text-slate-400 py-6">Ничего не найдено </p>`;
        }

        // === ОБРАБОТКА ВВОДА В ПОИСК КАТАЛОГА ===
        function handleCatalogSearch() {
            const q = document.getElementById('catalog-search-input').value;
            renderCatalogProducts(q);
        }

        // Фильтры и Поиск
        function toggleQuickSearchFilters() { document.getElementById('quick-search-filters').classList.toggle('hidden'); }
        function applySearchQuery(query) { document.getElementById('search-input').value = query; handleSearch(); toggleQuickSearchFilters(); }
        function handleSearch() {
            const q = document.getElementById('search-input').value.toLowerCase();
            document.querySelectorAll('.product-card').forEach(c => {
                c.classList.toggle('hidden', !c.innerText.toLowerCase().includes(q));
            });
        }
        function toggleFilters() { document.getElementById('filter-panel').classList.toggle('hidden'); }
        function filterCategory(cat) { document.querySelectorAll('.product-card').forEach(c => c.classList.toggle('hidden', c.dataset.category !== cat)); showSmsToast(`Категория: ${cat}`); }
        function resetAllFilters() { document.querySelectorAll('.product-card').forEach(c => c.classList.remove('hidden')); document.getElementById('filter-panel').classList.add('hidden'); }

                // ========== НОВЫЕ ФИЛЬТРЫ (Wildberries-стиль) ==========

        // Текущее состояние фильтров
        let activeFilters = { category: '', store: '', priceMin: null, priceMax: null, sort: 'popular' };

        // ===== РИСУЕМ ГЛАВНЫЕ КАТЕГОРИИ (Уровень 1) =====
function buildTopFilters() {
    const box = document.getElementById('filter-cat-list');
    if (!box) return;
    let html = '';
    for (const cat in filterCategories) {
        const active = selectedFilterCategory === cat;
        html += `<button onclick="selectFilterCategory('${cat}')" class="px-3 py-1.5 text-xs rounded-full font-bold border ${active ? 'bg-[#1e6091] text-white border-[#1e6091]' : 'bg-white text-slate-600 border-slate-200'}">${cat}</button>`;
    }
    box.innerHTML = html;
    buildSubFilters();
}

// ===== РИСУЕМ ПОДКАТЕГОРИИ (Уровень 2) =====
function buildSubFilters() {
    const box = document.getElementById('filter-sub-list');
    const wrap = document.getElementById('filter-sub-wrap');
    if (!box || !wrap) return;
    if (!selectedFilterCategory) { wrap.classList.add('hidden'); box.innerHTML = ''; return; }
    wrap.classList.remove('hidden');
    let html = '';
    filterCategories[selectedFilterCategory].forEach(sub => {
        const active = selectedFilterSub === sub;
        html += `<button onclick="selectFilterSub('${sub}')" class="px-3 py-1.5 text-xs rounded-full font-bold border ${active ? 'bg-[#1e6091] text-white border-[#1e6091]' : 'bg-white text-slate-600 border-slate-200'}">${sub}</button>`;
    });
    box.innerHTML = html;
}

// ===== КЛИК ПО ГЛАВНОЙ КАТЕГОРИИ =====
function selectFilterCategory(cat) {
    if (selectedFilterCategory === cat) { selectedFilterCategory = null; selectedFilterSub = null; }
    else { selectedFilterCategory = cat; selectedFilterSub = null; }
    buildTopFilters();
}

// ===== КЛИК ПО ПОДКАТЕГОРИИ =====
function selectFilterSub(sub) {
    selectedFilterSub = (selectedFilterSub === sub) ? null : sub;
    buildSubFilters();
}

// ===== СБРОС =====
function resetTopFilters() {
    selectedFilterCategory = null;
    selectedFilterSub = null;
    const min = document.getElementById('filter-price-min');
    const max = document.getElementById('filter-price-max');
    if (min) min.value = '';
    if (max) max.value = '';
    buildTopFilters();
    renderProductGrid();
}

// ===== ПРИМЕНИТЬ ФИЛЬТР =====
function applyTopFilters() {
    renderProductGrid();
    toggleQuickSearchFilters();
}

        // Выбрать категорию в фильтре (подсветка)
        function pickFilterCat(cat) {
            activeFilters.category = cat;
            document.querySelectorAll('.fcat-btn').forEach(b => {
                const on = b.dataset.cat === cat;
                b.className = 'fcat-btn text-[11px] px-3 py-1.5 rounded-lg font-bold capitalize ' + (on ? 'bg-[#1e6091] text-white' : 'bg-white border border-slate-200 text-slate-700');
            });
        }

        // Выбрать магазин в фильтре (подсветка)
        function pickFilterStore(store) {
            activeFilters.store = store;
            document.querySelectorAll('.fstore-btn').forEach(b => {
                const on = b.dataset.store === store;
                b.className = 'fstore-btn text-[11px] px-3 py-1.5 rounded-lg font-bold ' + (on ? 'bg-[#1e6091] text-white' : 'bg-white border border-slate-200 text-slate-700');
            });
        }

        // Сбросить верхние фильтры
        function resetTopFilters() {
            activeFilters = { category: '', store: '', priceMin: null, priceMax: null, sort: activeFilters.sort };
            document.getElementById('filter-price-min').value = '';
            document.getElementById('filter-price-max').value = '';
            pickFilterCat('');
            pickFilterStore('');
            renderFilteredGrid();
            showSmsToast('Фильтры сброшены ');
        }

        // === СОРТИРОВКА (нижняя панель) ===
        function applySort(mode) {
            activeFilters.sort = mode;
            // Подсветка активной кнопки сортировки
            document.querySelectorAll('.sort-btn').forEach(b => {
                b.className = 'sort-btn text-[11px] bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold';
            });
            const btn = document.getElementById('sort-' + mode);
            if (btn) btn.className = 'sort-btn text-[11px] bg-[#1e6091] text-white px-3 py-1.5 rounded-lg font-bold';

            renderFilteredGrid();
        }

        // === ГЛАВНАЯ ФУНКЦИЯ: собрать товары с учётом всех фильтров и сортировки ===
        function renderFilteredGrid() {
            let list = [];
            for (const k in productsDb) {
                const p = productsDb[k];
                if (p.status !== 'published') continue;

                // Фильтр по категории
                if (activeFilters.category && p.category !== activeFilters.category) continue;
                // Фильтр по магазину
                if (activeFilters.store && p.store !== activeFilters.store) continue;
                // Фильтр по цене
                const priceNum = parsePrice(p.price);
                if (activeFilters.priceMin !== null && priceNum < activeFilters.priceMin) continue;
                if (activeFilters.priceMax !== null && priceNum > activeFilters.priceMax) continue;

                list.push(p);
            }

            // Сортировка
            const s = activeFilters.sort;
            if (s === 'cheap') list.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
            else if (s === 'expensive') list.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
            else if (s === 'name') list.sort((a, b) => a.title.localeCompare(b.title));
            else if (s === 'new') list.reverse(); // новинки = последние добавленные
            // 'popular' — оставляем как есть

            // Рисуем карточки
            let html = '';
            list.forEach(prod => {
                html += productCardHtml(prod);
            });

            const grid = document.getElementById('product-grid');
            if (grid) grid.innerHTML = html || `<p class="col-span-2 text-center text-xs text-slate-400 py-6">Товары не найдены </p>`;
        }
        //---витрина магазина---//

        // сохраняем текущий магазин витрины (для "Смотреть все")
        window.currentCatalogShop = '';

        function shopHash(str) {
            let h = 0;
            const s = String(str || '');
            for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
            return Math.abs(h);
        }
        function shopDomain(s) {
            return String((s && s.site) || 'shop.ru').replace(/^https?:\/\//, '').replace(/\/.*$/, '') || 'shop.ru';
        }
        function shopTelHref(phone) {
            return 'tel:' + String(phone || '').replace(/[^\d+]/g, '');
        }
        function shopStaffFor(s) {
            if (s && Array.isArray(s.staff) && s.staff.length) return s.staff;
            const h = shopHash(s && s.name);
            const managers = ['Анна Волкова', 'Мария Соколова', 'Екатерина Лебедева'];
            const accs = ['Сергей Морозов', 'Игорь Павлов', 'Андрей Кузнецов'];
            const hrs = ['Елена Кравцова', 'Ольга Новикова', 'Татьяна Белова'];
            const photosM = [
                'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
                'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
            ];
            const photosA = [
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
                'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400'
            ];
            const photosH = [
                'https://images.unsplash.com/photo-1594744803329-e58b31de8bf1?w=400',
                'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400',
                'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'
            ];
            const i = h % 3;
            const base = 120 + (h % 780);
            const d = shopDomain(s);
            const fmt = function (n) {
                const x = String(10000000 + n).slice(-7);
                return '+7 (904) ' + x.slice(0, 3) + '-' + x.slice(3, 5) + '-' + x.slice(5);
            };
            return [
                { role: 'менеджер', cta: 'Связаться с менеджером', name: managers[i], phone: fmt(base), email: 'manager@' + d, photo: photosM[i] },
                { role: 'бухгалтерия', cta: 'Связаться с бухгалтерией', name: accs[i], phone: fmt(base + 11), email: 'buh@' + d, photo: photosA[i] },
                { role: 'отдел кадров', cta: 'Связаться с отделом кадров', name: hrs[i], phone: fmt(base + 23), email: 'hr@' + d, photo: photosH[i] }
            ];
        }
        function shopContactDept(role, phone) {
            if (phone) {
                try { window.location.href = shopTelHref(phone); } catch (e) {}
            }
            if (typeof showSmsToast === 'function') showSmsToast('Соединяем: ' + role);
        }
        function shopRequestService(label) {
            if (typeof showSmsToast === 'function') showSmsToast('Заявка: «' + label + '». Перезвоним в рабочее время.');
        }
        function fillShopCatalogExtras(s) {
            const list = document.getElementById('shop-staff-list');
            const extras = document.getElementById('shop-catalog-extras');
            if (!s) return;
            const staff = shopStaffFor(s);
            if (list) {
                list.innerHTML = staff.map(function (p) {
                    const photo = p.photo || '';
                    return '<div class="shop-person">' +
                        '<img src="' + photo + '" alt="" class="shop-person-photo" onclick="openAvatarModal(\'' + photo + '\')">' +
                        '<div class="shop-person-body">' +
                        '<button type="button" class="shop-person-cta" onclick="shopContactDept(\'' + p.role + '\', \'' + p.phone + '\')">' + p.cta + '</button>' +
                        '<p class="shop-person-name">' + p.name + '</p>' +
                        '<a class="shop-person-link" href="' + shopTelHref(p.phone) + '"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>' + p.phone + '</a>' +
                        '<a class="shop-person-link" href="mailto:' + p.email + '"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>' + p.email + '</a>' +
                        '</div>' +
                        '</div>';
                }).join('');
            }
            if (!extras) return;
            const cat = String(s.category || '').toLowerCase();
            let perks;
            if (cat.indexOf('строй') !== -1 || cat.indexOf('отдел') !== -1) {
                perks = [
                    { t: 'Доставка', d: 'По городу', k: 'Доставка материалов' },
                    { t: 'Погрузка', d: 'На складе', k: 'Погрузка на складе' },
                    { t: 'Опт', d: 'Для объекта', k: 'Оптовый расчёт' }
                ];
            } else {
                perks = [
                    { t: 'Замер', d: 'Бесплатно', k: 'Выезд замерщика' },
                    { t: 'Доставка', d: '1–2 дня', k: 'Доставка заказа' },
                    { t: 'Сборка', d: 'Мастером', k: 'Сборка на месте' }
                ];
            }
            let perkTitle = 'Услуги салона';
            let hoursLeftL = 'Пн–Сб';
            let hoursLeftV = '10:00–20:00';
            let hoursRightL = 'Воскресенье';
            let hoursRightV = '10:00–18:00';
            let hoursNote = 'Самовывоз в рабочее время · консультация без записи';
            let howTitle = 'Как оформить';
            let howSteps = [
                'Выберите товар на витрине или оставьте заявку менеджеру',
                'Подтвердим наличие, срок и счёт — в рабочий день',
                'Доставка или самовывоз, документы и гарантия'
            ];
            extras.innerHTML =
                '<div class="bg-white rounded-2xl border border-[#d7e6f2] p-3.5 shadow-[0_8px_24px_rgba(30,96,145,0.08)]">' +
                    '<p class="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1e6091]">Режим работы</p>' +
                    '<div class="mt-2.5 grid grid-cols-2 gap-2">' +
                        '<div class="rounded-xl bg-[#f7fbfe] border border-[#e8f1f8] px-3 py-2.5"><p class="text-[10px] text-slate-400 font-semibold">' + hoursLeftL + '</p><p class="text-[13px] font-extrabold text-slate-800 mt-0.5">' + hoursLeftV + '</p></div>' +
                        '<div class="rounded-xl bg-[#f7fbfe] border border-[#e8f1f8] px-3 py-2.5"><p class="text-[10px] text-slate-400 font-semibold">' + hoursRightL + '</p><p class="text-[13px] font-extrabold text-slate-800 mt-0.5">' + hoursRightV + '</p></div>' +
                    '</div>' +
                    '<p class="text-[11px] text-slate-500 mt-2.5">' + hoursNote + '</p>' +
                '</div>' +
                '<div>' +
                    '<p class="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1e6091] mb-2">' + perkTitle + '</p>' +
                    '<div class="grid grid-cols-3 gap-2">' +
                        perks.map(function (p) {
                            return '<button type="button" class="shop-perk" onclick="shopRequestService(\'' + p.k + '\')"><p class="text-[13px] font-extrabold text-[#1e6091]">' + p.t + '</p><p class="text-[10px] text-slate-400 font-semibold mt-0.5">' + p.d + '</p></button>';
                        }).join('') +
                    '</div>' +
                '</div>' +
                '<div>' +
                    '<p class="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#1e6091] mb-2">' + howTitle + '</p>' +
                    '<div class="bg-white rounded-2xl border border-[#d7e6f2] overflow-hidden">' +
                        howSteps.map(function (step, i) {
                            const line = i < howSteps.length - 1 ? ' border-b border-[#e8f1f8]' : '';
                            return '<div class="px-3.5 py-2.5' + line + ' flex gap-3"><span class="w-6 h-6 rounded-full bg-[#1e6091] text-white text-[11px] font-extrabold flex items-center justify-center shrink-0">' + (i + 1) + '</span><p class="text-[12px] font-semibold text-slate-700 leading-snug">' + step + '</p></div>';
                        }).join('') +
                    '</div>' +
                '</div>' +
                '<button type="button" onclick="shopRequestService(\'Обратный звонок\')" class="w-full bg-[#1e6091] hover:bg-[#16324a] shadow-[0_10px_22px_rgba(30,96,145,0.28)] text-white font-bold text-[13px] py-3 rounded-2xl active:scale-[0.99] transition-transform">Заказать обратный звонок</button>';
        }

        function openShopCatalogModal(storeName) {
            const s = shopsProfileDb[storeName];
            if (!s) return;
            if (s.kind === 'landscape') {
                openLandscapeStudio(storeName);
                return;
            }
            window.currentCatalogShop = storeName;

            document.getElementById('shop-catalog-title').innerText = s.name;
            const bannerEl = document.getElementById('shop-catalog-banner');
            bannerEl.src = s.banner;
            bannerEl.className = s.bannerFit === 'contain' ? 'w-full h-full object-contain bg-white' : 'w-full h-full object-cover';

            // Подзаголовок под названием (короткое описание)
            const sub = document.getElementById('shop-catalog-subtitle');
            if (sub) sub.innerText = s.description || '';

            document.getElementById('shop-catalog-desc').innerText = s.description;

            // Адрес (кликабельно -> Яндекс.Карты)
            document.getElementById('shop-catalog-addr').innerText = s.address || '—';
            const addrLink = document.getElementById('shop-catalog-addr-link');
            if (addrLink) addrLink.href = s.address ? 'https://yandex.ru/maps/?text=' + encodeURIComponent(s.address) : '#';

            // Сайт (кликабельно)
            document.getElementById('shop-catalog-site').innerText = (s.site || '#').replace('https://', '').replace('http://', '');
            const siteLink = document.getElementById('shop-catalog-site-link');
            if (siteLink) siteLink.href = s.site || '#';

            // Telegram
            document.getElementById('shop-catalog-tg').href = s.telegram || '#';

            // Фото "О компании" (до 3 квадратных)
            const aboutBox = document.getElementById('shop-catalog-about-imgs');
            if (aboutBox) {
                const aboutImgs = (s.aboutImages && s.aboutImages.length) ? s.aboutImages : ((s.gallery || []).filter(function (m) {
                    return !(m.startsWith && m.startsWith('data:video')) && !(typeof isVideoUrl === 'function' && isVideoUrl(m));
                }).slice(0, 3));
                if (aboutImgs && aboutImgs.length > 0) {
                    aboutBox.innerHTML = aboutImgs.map(function (img) {
                        return '<div class="aspect-square rounded-xl overflow-hidden border bg-slate-100"><img src="' + img + '" onclick="openAvatarModal(\'' + img + '\')" class="w-full h-full object-cover cursor-pointer"></div>';
                    }).join('');
                    aboutBox.classList.remove('hidden');
                } else {
                    aboutBox.innerHTML = '';
                    aboutBox.classList.add('hidden');
                }
            }

            // Видео
            if (s.video) {
                document.getElementById('shop-catalog-video-container').classList.remove('hidden');
                document.getElementById('shop-catalog-video').src = s.video;
            } else {
                document.getElementById('shop-catalog-video-container').classList.add('hidden');
            }

            // Текст к блоку фото/видео
            const galTextEl = document.getElementById('shop-catalog-gallery-text');
            if (galTextEl) {
                if (s.galleryText) {
                    galTextEl.innerText = s.galleryText;
                    galTextEl.classList.remove('hidden');
                } else {
                    galTextEl.classList.add('hidden');
                }
            }

            // Фото и видео (галерея)
            let galHtml = '';
            if (s.gallery && s.gallery.length > 0) {
                s.gallery.forEach(media => {
                    const isVideo = (media.startsWith && media.startsWith('data:video')) || isVideoUrl(media);
                    if (isVideo) {
                        galHtml += `<video src="${media}" controls playsinline class="h-32 w-48 object-cover rounded-xl shrink-0 snap-center border bg-black"></video>`;
                    } else {
                        galHtml += `<img src="${media}" onclick="openAvatarModal('${media}')" class="h-32 w-48 object-cover rounded-xl shrink-0 cursor-pointer snap-center border">`;
                    }
                });
                document.getElementById('shop-catalog-gallery-wrapper').classList.remove('hidden');
                document.getElementById('shop-catalog-gallery').innerHTML = galHtml;
            } else if (s.galleryText) {
                document.getElementById('shop-catalog-gallery-wrapper').classList.remove('hidden');
                document.getElementById('shop-catalog-gallery').innerHTML = '';
            } else {
                document.getElementById('shop-catalog-gallery-wrapper').classList.add('hidden');
            }

            // Товары магазина
            renderShopCatalogProducts(storeName);

            fillShopCatalogExtras(s);

            document.getElementById('shop-catalog-modal').classList.remove('hidden');
        }

        function pickHomePromoShops(n) {
            const names = [];
            if (typeof shopsProfileDb !== 'object' || !shopsProfileDb) return names;
            for (const store in shopsProfileDb) {
                const s = shopsProfileDb[store];
                if (!s || s.status !== 'published' || s.isRealEstate || s.kind === 'landscape') continue;
                names.push(store);
            }
            for (let i = names.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const t = names[i];
                names[i] = names[j];
                names[j] = t;
            }
            return names.slice(0, Math.min(n, names.length));
        }

        function openHomeShopFromPromo(i) {
            const name = window.homePromoShops && window.homePromoShops[i];
            if (!name) return;
            if (typeof openShopCatalogModal === 'function') openShopCatalogModal(name);
        }

        function renderHomeShopPromo() {
            const box = document.getElementById('home-shop-slides');
            if (!box) return;
            const picked = pickHomePromoShops(3);
            window.homePromoShops = picked;
            if (!picked.length) {
                box.innerHTML = '';
                return;
            }
            const esc = typeof pmEsc === 'function' ? pmEsc : function (s) {
                return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
            };
            box.innerHTML = picked.map(function (name, i) {
                const s = shopsProfileDb[name] || {};
                const img = s.banner || '';
                const fit = s.bannerFit === 'contain' ? 'object-contain bg-white' : 'object-cover';
                const title = s.name || name;
                const desc = s.description || 'Витрина магазина';
                const vis = i === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0';
                return '<div id="promo-slide-' + i + '" class="promo-slide absolute inset-0 transition-opacity duration-500 ' + vis + '">' +
                    '<div class="promo-img absolute inset-0 overflow-hidden"><img src="' + esc(img) + '" alt="" class="absolute inset-0 w-full h-full ' + fit + '"></div>' +
                    '<div class="promo-veil absolute inset-0 pointer-events-none"></div>' +
                    '<div class="promo-copy absolute inset-0 flex flex-col justify-end pointer-events-none">' +
                    '<h4 class="promo-name">' + esc(title) + '</h4>' +
                    '<p class="promo-desc line-clamp-2">' + esc(desc) + '</p>' +
                    '<button type="button" onclick="event.stopPropagation(); openHomeShopFromPromo(' + i + ')" class="promo-go pointer-events-auto relative z-30">' +
                    'Смотреть' +
                    '</button></div></div>';
            }).join('');
            currentPromoIdx = 0;
            if (typeof updatePromoSlider === 'function') updatePromoSlider();
        }

// --- 1. ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ ФИЛЬТРА ---
window.shopActiveCategory = 'все';

// --- 2. УМНЫЙ РЕНДЕР ТОВАРОВ ВИТРИНЫ ---
function renderShopCatalogProducts(storeName) {
    const container = document.getElementById('shop-catalog-grid');
    if (!container) return;

    let prodHtml = '';
    
    Object.values(productsDb).filter(p => {
        if (p.store !== storeName || p.status !== 'published') return false;
        if (window.shopActiveCategory === 'все') return true;
        
        // Поиск совпадений по категории или названию
        const search = window.shopActiveCategory.toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const sub = (p.subcategory || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        
        return cat.includes(search) || sub.includes(search) || title.includes(search) || search.includes(cat);
    }).forEach(prod => {
        const isFav = state.favorites && state.favorites.includes(prod.id);
        const inCart = cartHasProduct(prod.id);
        
        prodHtml += `
            <div onclick="openProductModal('${prod.id}')" class="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform flex flex-col">
                <div class="relative w-full h-40 bg-slate-100">
                    <img src="${prod.image}" class="w-full h-full object-cover">
                    <button onclick="event.stopPropagation(); toggleFavorite('${prod.id}'); renderShopCatalogProducts('${storeName}')" class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm ${isFav ? 'text-[#f43f5e]' : 'text-slate-300'}">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                </div>
                <div class="p-3 flex items-end justify-between gap-2">
                    <div class="min-w-0">
                        <h5 class="oz-title line-clamp-1">${prod.title}</h5>
                        <p class="oz-price mt-1">${prod.price}</p>
                    </div>
                    <button onclick="event.stopPropagation(); addToCart('${prod.id}'); renderShopCatalogProducts('${storeName}')" class="w-9 h-9 rounded-full ${inCart ? 'bg-[#e11d48]' : 'bg-[#1c3a34]'} text-white flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition-transform">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </button>
                </div>
            </div>`;
    });
    
    container.innerHTML = prodHtml || `<div class="col-span-2 flex flex-col items-center justify-center py-10"><p class="text-xs text-slate-400">Товаров по фильтру "${window.shopActiveCategory}" не найдено</p></div>`;
}

// --- 3. УПРАВЛЕНИЕ МЕГА-ПАНЕЛЯМИ (Спальни, Кухни и т.д.) ---
function toggleMegaPanel(panelId) {
    const container = document.getElementById('mega-panels-container');
    const targetPanel = document.getElementById(panelId);
    const allPanels = document.querySelectorAll('.mega-panel');

    const dropdown = document.getElementById('main-filter-dropdown');
    if (dropdown) dropdown.classList.add('hidden');

    if (targetPanel && !targetPanel.classList.contains('hidden')) {
        container.classList.add('hidden');
        targetPanel.classList.add('hidden');
        return;
    }

    allPanels.forEach(p => p.classList.add('hidden'));
    
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        container.classList.remove('hidden');
    }
}

// --- 4. ОТКРЫТИЕ МЕНЮ "ТРИ ТОЧКИ" (...) ---
function toggleMainMenu(event) {
    if (event) event.stopPropagation();
    
    const megaContainer = document.getElementById('mega-panels-container');
    if (megaContainer) megaContainer.classList.add('hidden');
    document.querySelectorAll('.mega-panel').forEach(p => p.classList.add('hidden'));

    const dropdown = document.getElementById('main-filter-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}

// --- 5. ПРИМЕНЕНИЕ ФИЛЬТРА И ЗАКРЫТИЕ ВСЕХ МЕНЮ ---
function applyCategoryFilter(catName) {
    window.shopActiveCategory = catName;
    renderShopCatalogProducts(window.currentCatalogShop);
    
    const megaContainer = document.getElementById('mega-panels-container');
    if (megaContainer) megaContainer.classList.add('hidden');
    document.querySelectorAll('.mega-panel').forEach(p => p.classList.add('hidden'));
    
    const dropdown = document.getElementById('main-filter-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    
    if (catName === 'все') showSmsToast('Сброс: показаны все товары');
    else showSmsToast('Фильтр: ' + catName);
}

// --- 6. ЗАКРЫТИЕ МЕНЮ ПРИ КЛИКЕ В ПУСТОЕ МЕСТО ---
document.addEventListener('click', function(event) {
    const wrapper = document.getElementById('shop-nav-wrapper');
    const dropdown = document.getElementById('main-filter-dropdown');
    const btn = document.getElementById('main-filter-btn');
    
    if (wrapper && !wrapper.contains(event.target)) {
        const container = document.getElementById('mega-panels-container');
        if (container) container.classList.add('hidden');
        document.querySelectorAll('.mega-panel').forEach(p => p.classList.add('hidden'));
    }
    
    if (dropdown && !dropdown.classList.contains('hidden')) {
        if (!dropdown.contains(event.target) && (!btn || !btn.contains(event.target))) {
            dropdown.classList.add('hidden');
        }
    }
});

// УМНЫЙ РЕНДЕР ТОВАРОВ (ищет совпадения и в категории, и в подкатегории, и в названии)
function renderShopCatalogProducts(storeName) {
    const container = document.getElementById('shop-catalog-grid');
    if (!container) return;
    if (typeof renderLandscapeOffers === 'function' && renderLandscapeOffers(storeName, container)) return;

    let prodHtml = '';
    
    Object.values(productsDb).filter(p => {
        if (p.store !== storeName || p.status !== 'published') return false;
        if (window.shopActiveCategory === 'все') return true;
        
        // Умный поиск по слову из фильтра
        const search = window.shopActiveCategory.toLowerCase();
        const cat = (p.category || '').toLowerCase();
        const sub = (p.subcategory || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        
        return cat.includes(search) || sub.includes(search) || title.includes(search) || search.includes(cat);
    }).forEach(prod => {
        const isFav = state.favorites && state.favorites.includes(prod.id);
        const inCart = cartHasProduct(prod.id);
        
        prodHtml += `
            <div onclick="openProductModal('${prod.id}')" class="bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer active:scale-[0.98] transition-transform flex flex-col">
                <div class="relative w-full h-40 bg-slate-100">
                    <img src="${prod.image}" class="w-full h-full object-cover">
                    <button onclick="event.stopPropagation(); toggleFavorite('${prod.id}'); renderShopCatalogProducts('${storeName}')" class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm ${isFav ? 'text-[#f43f5e]' : 'text-slate-300'}">
                        <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                    </button>
                </div>
                <div class="p-3 flex items-end justify-between gap-2">
                    <div class="min-w-0">
                        <h5 class="oz-title line-clamp-1">${prod.title}</h5>
                        <p class="oz-price mt-1">${prod.price}</p>
                    </div>
                    <button onclick="event.stopPropagation(); addToCart('${prod.id}'); renderShopCatalogProducts('${storeName}')" class="w-9 h-9 rounded-full ${inCart ? 'bg-[#e11d48]' : 'bg-[#1c3a34]'} text-white flex items-center justify-center shrink-0 shadow-sm active:scale-90 transition-transform">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    </button>
                </div>
            </div>`;
    });
    
    container.innerHTML = prodHtml || `<div class="col-span-2 flex flex-col items-center justify-center py-10"><svg class="w-10 h-10 text-slate-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg><p class="text-xs text-slate-400">Товаров по фильтру "${window.shopActiveCategory}" не найдено</p></div>`;
}


// === ЛОГИКА ОТКРЫТИЯ/ЗАКРЫТИЯ ГЛАВНОГО ФИЛЬТРА (КЛИК ПО ТРЕМ ТОЧКАМ) ===
function toggleMainMenu(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('main-filter-dropdown');
    if (dropdown) {
        // Открываем или закрываем меню
        dropdown.classList.toggle('hidden');
    }
}

// Закрываем меню, если пользователь кликнул мимо него (удобно для телефонов)
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('main-filter-dropdown');
    const btn = document.getElementById('main-filter-btn');
    if (dropdown && !dropdown.classList.contains('hidden')) {
        // Если клик был не по меню и не по самой кнопке открытия - закрываем
        if (!dropdown.contains(event.target) && (!btn || !btn.contains(event.target))) {
            dropdown.classList.add('hidden');
        }
    }
});
        // "Смотреть все" -> открыть каталог товаров этого магазина через фильтр
        function shopCatalogSeeAll() {
            const store = window.currentCatalogShop;
            const shop = shopsProfileDb[store];
            if (shop && shop.kind === 'landscape') {
                showSmsToast('Все услуги студии на витрине ниже');
                return;
            }
            closeShopCatalogModal();
            switchTab('catalog');
            // подставляем название магазина в поиск на главной
            const input = document.getElementById('search-input');
            if (input) { input.value = store; handleSearch(); }
            showSmsToast('Все товары магазина: ' + store);
        }
        function closeShopCatalogModal() {
            const modal = document.getElementById('shop-catalog-modal');
            modal.classList.add('hidden');
            modal.classList.remove('ls-mode');
            modal.style.zIndex = '';
            document.getElementById('shop-catalog-video').src = '';
        }
        const COMPANY_PRICE = {
            'штукатурка': 'от 450 ₽/м²',
            'плитка': 'от 1 200 ₽/м²',
            'электрика': 'от 380 ₽/т.т.',
            'сантехника': 'от 2 800 ₽',
            'гипсокартон': 'от 650 ₽/м²',
            'покраска': 'от 280 ₽/м²',
            'дизайн': 'от 1 200 ₽/м²',
            'дизайн-проект': 'от 25 000 ₽',
            'черновая отделка': 'от 4 500 ₽/м²',
            'натяжные потолки': 'от 890 ₽/м²',
            'демонтаж': 'от 180 ₽/м²',
            'чистовая отделка': 'от 3 200 ₽/м²',
            'стяжка': 'от 520 ₽/м²',
            'двери': 'от 8 500 ₽',
            'отделка': 'от 2 400 ₽/м²'
        };
        function companyServiceIcon(name) {
            const n = String(name || '').toLowerCase();
            const ico = function (d) {
                return '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="' + d + '"/></svg>';
            };
            if (n.indexOf('плит') !== -1) return ico('M4 4a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z M4 10h16M10 4v16');
            if (n.indexOf('штукатур') !== -1) return ico('M7 21h10M5 3h14M7 3v18M17 3v18M5 8h14M5 16h14');
            if (n.indexOf('электр') !== -1) return ico('M13 2L3 14h8l-1 8 10-12h-8l1-8z');
            if (n.indexOf('сантех') !== -1) return ico('M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1M8 12a4 4 0 108 0 4 4 0 00-8 0z');
            if (n.indexOf('гипс') !== -1) return ico('M4 4h16v16H4zM9 4v16M4 12h16');
            if (n.indexOf('покрас') !== -1) return ico('M15.5 4.5l4 4-9.5 9.5H6v-4L15.5 4.5zM5 20h14');
            if (n.indexOf('дизайн') !== -1) return ico('M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586');
            if (n.indexOf('демонт') !== -1) return ico('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16');
            if (n.indexOf('стяжк') !== -1 || n.indexOf('ламинат') !== -1) return ico('M4 6h16M4 12h16M4 18h16');
            if (n.indexOf('потол') !== -1) return ico('M4 8h16M8 8v12M16 8v12M4 20h16');
            if (n.indexOf('двер') !== -1) return ico('M8 3h8a2 2 0 012 2v16H6V5a2 2 0 012-2zM15 12h.01');
            if (n.indexOf('чернов') !== -1) return ico('M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z');
            return ico('M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z');
        }
        function companyTeamFor(c) {
            if (c && Array.isArray(c.team) && c.team.length) return c.team;
            const h = (typeof shopHash === 'function') ? shopHash(c && c.name) : 1;
            const dirs = ['Алексей Орлов', 'Виктор Смирнов', 'Павел Никитин'];
            const mans = ['Анна Волкова', 'Мария Соколова', 'Екатерина Лебедева'];
            const dirPhotos = [
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400',
                'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
                'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400'
            ];
            const manPhotos = [
                'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
                'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
            ];
            const i = h % 3;
            return [
                { role: 'Директор', name: dirs[i], photo: dirPhotos[i] },
                { role: 'Менеджер', name: mans[i], photo: manPhotos[i] }
            ];
        }
        function fillCompanyTeam(c) {
            const box = document.getElementById('company-catalog-team');
            if (!box) return;
            const team = companyTeamFor(c);
            box.innerHTML = team.map(function (p) {
                const photo = p.photo || '';
                return '<div class="co-team" onclick="openAvatarModal(\'' + photo + '\')">' +
                    '<img src="' + photo + '" alt="">' +
                    '<div class="px-3 py-2.5">' +
                    '<p class="text-[10px] font-extrabold uppercase tracking-[0.12em] text-sky-200/80">' + p.role + '</p>' +
                    '<p class="text-[13px] font-bold text-white mt-0.5 leading-tight">' + p.name + '</p>' +
                    '</div></div>';
            }).join('');
        }
        function fillCompanyPrice(c) {
            const svcWrap = document.getElementById('company-catalog-services-wrap');
            const svc = document.getElementById('company-catalog-services');
            if (!svcWrap || !svc) return;
            const list = (c && c.services) ? c.services : [];
            if (!list.length) {
                svc.innerHTML = '';
                svcWrap.classList.add('hidden');
                return;
            }
            svc.innerHTML = list.map(function (name) {
                const key = String(name || '').toLowerCase();
                const price = COMPANY_PRICE[key] || 'по смете';
                return '<button type="button" class="co-price-row" onclick="shopRequestService(\'' + name + '\')">' +
                    '<span class="co-price-ico">' + companyServiceIcon(name) + '</span>' +
                    '<span class="flex-1 min-w-0"><span class="block text-[13px] font-bold text-white leading-tight">' + name + '</span><span class="block text-[11px] text-white/50 mt-0.5">Работа под ключ</span></span>' +
                    '<span class="text-[12px] font-extrabold text-sky-200 shrink-0">' + price + '</span>' +
                    '</button>';
            }).join('');
            svcWrap.classList.remove('hidden');
        }
        window.coRoom = 'Ванная';
        window.coPortfolioCompany = '';
        const COMPANY_ROOMS = ['Ванная', 'Прихожая', 'Кухня', 'Гостиная', 'Спальня'];
        const COMPANY_ROOM_PHOTOS = {
            'Ванная': [
                'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600',
                'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600',
                'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600',
                'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=600'
            ],
            'Прихожая': [
                'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600',
                'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600',
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600',
                'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600'
            ],
            'Кухня': [
                'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=600',
                'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600',
                'https://images.unsplash.com/photo-1484154214963-01d56f8c276c?w=600',
                'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600'
            ],
            'Гостиная': [
                'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600',
                'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
                'https://images.unsplash.com/photo-1618220179428-22790b461013?w=600'
            ],
            'Спальня': [
                'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600',
                'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600',
                'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600',
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'
            ]
        };
        function setCompanyRoom(room) {
            window.coRoom = room || 'Ванная';
            const name = window.coPortfolioCompany;
            const c = (typeof companiesProfileDb === 'object' && companiesProfileDb[name]) ? companiesProfileDb[name] : {};
            fillCompanyPortfolio(c);
        }
        function fillCompanyPortfolio(c) {
            const wrap = document.getElementById('company-catalog-gallery-wrapper');
            const roomsEl = document.getElementById('company-catalog-rooms');
            const gal = document.getElementById('company-catalog-gallery');
            if (!wrap || !gal) return;
            const room = window.coRoom || 'Ванная';
            const stock = COMPANY_ROOM_PHOTOS[room] || COMPANY_ROOM_PHOTOS['Ванная'];
            const own = (c && c.photos) ? c.photos.slice() : [];
            const roomIdx = COMPANY_ROOMS.indexOf(room);
            const photos = stock.slice();
            if (own[roomIdx]) photos.unshift(own[roomIdx]);
            else if (own[0] && room === 'Гостиная') photos.unshift(own[0]);
            const seen = {};
            const uniq = photos.filter(function (u) {
                if (!u || seen[u]) return false;
                seen[u] = true;
                return true;
            }).slice(0, 4);
            if (roomsEl) {
                roomsEl.innerHTML = COMPANY_ROOMS.map(function (r) {
                    return '<button type="button" class="co-room' + (r === room ? ' on' : '') + '" onclick="setCompanyRoom(\'' + r + '\')">' + r + '</button>';
                }).join('');
            }
            gal.className = 'grid grid-cols-2 gap-2.5';
            gal.innerHTML = uniq.map(function (url) {
                return '<img src="' + url + '" onclick="openAvatarModal(\'' + url + '\')" class="w-full h-32 object-cover rounded-2xl cursor-pointer hover:opacity-80 transition border border-white/10">';
            }).join('');
            wrap.classList.remove('hidden');
            wrap.removeAttribute('hidden');
        }
        function openCompanyCatalogModal(compName) { 
            const c = companiesProfileDb[compName]; if (!c) return; 
            document.getElementById('company-catalog-title').innerText = c.name; 
            document.getElementById('company-catalog-banner').src = c.banner; 
            document.getElementById('company-catalog-desc').innerText = c.description; 
            document.getElementById('company-catalog-addr').innerText = c.address; 
            const site = c.site || '';
            document.getElementById('company-catalog-site').innerText = site.replace(/^https?:\/\//, '') || '—';
            document.getElementById('company-catalog-site').href = site || '#';
            document.getElementById('company-catalog-tg').href = c.telegram || '#';
            const badge = document.getElementById('company-catalog-badge');
            if (badge) badge.textContent = c.kind === 'remont' ? 'Ремонт под ключ' : 'Официальный партнер';
            fillCompanyTeam(c);
            fillCompanyPrice(c);
            window.coPortfolioCompany = compName;
            window.coRoom = 'Ванная';
            fillCompanyPortfolio(c);
            
            if(c.video) {
                document.getElementById('company-catalog-video-container').classList.remove('hidden');
                document.getElementById('company-catalog-video').src = c.video;
            } else { document.getElementById('company-catalog-video-container').classList.add('hidden'); }
             document.getElementById('company-catalog-modal').classList.remove('hidden'); 
        }
        function closeCompanyCatalogModal() { document.getElementById('company-catalog-modal').classList.add('hidden'); document.getElementById('company-catalog-video').src = ''; }

       // --- ПОРТФОЛИО СПЕЦИАЛИСТОВ И ДИЗАЙНЕРОВ ---
        function openAvatarFullscreen(src) {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:pointer;';
        overlay.innerHTML = `<img src="${src}" style="max-width:90%;max-height:90%;border-radius:12px;">`;
        overlay.onclick = () => overlay.remove();
        document.body.appendChild(overlay);
    }
        function openPortfolioModal(cat, id) {
            const item = directoryDb[cat].find(i => i.id === id); if (!item) return;
            currentPortfolioItem = item;
            const modal = document.getElementById('portfolio-modal');
            const isDes = cat === 'designers';
            if (modal) modal.classList.toggle('des-mode', isDes);
            const descEl = document.getElementById('portfolio-description');
            if (descEl) {
                descEl.className = isDes
                    ? 'leading-relaxed'
                    : 'text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100';
            }
            const avatarEl = document.getElementById('portfolio-avatar');
        if (item.avatarPhoto) {
            avatarEl.innerHTML = `<img src="${item.avatarPhoto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;cursor:pointer;" onclick="openAvatarFullscreen('${item.avatarPhoto}')">`;
        } else {
            avatarEl.innerText = item.avatar;
        }
            document.getElementById('portfolio-name').innerText = item.name;
            document.getElementById('portfolio-title').innerText = item.title;
            document.getElementById('portfolio-description').innerText = item.description;
            document.getElementById('portfolio-hours').innerText = item.hours || 'Пн-Пт 9-18';
            document.getElementById('portfolio-site-link').href = item.site || '#';
            document.getElementById('portfolio-tg-link').href = item.telegram || '#';
            document.getElementById('portfolio-max-link').href = item.max || '#';
            const hero = document.getElementById('portfolio-hero-img');
            if (hero) {
                const cover = item.cover || (item.gallery && item.gallery.interior && item.gallery.interior[0]) || (item.gallery && item.gallery.landscape && item.gallery.landscape[0]) || (Array.isArray(item.gallery) ? item.gallery[0] : '') || item.avatarPhoto || '';
                hero.src = cover;
                hero.onclick = function () { if (cover) openLightbox(cover); };
            }
            let list = (item.prices || []).slice();
            if (isDes) {
                const have = list.map(function (p) { return String(p.service || '').toLowerCase(); }).join(' ');
                if (have.indexOf('планиров') === -1) list.splice(1, 0, { service: 'Планировка', cost: 'от 1 200 ₽ / м²' });
                if (have.indexOf('визуал') === -1 && have.indexOf('3d') === -1) list.push({ service: '3D-визуализация', cost: 'от 8 000 ₽ / зона' });
                if (have.indexOf('надзор') === -1) list.push({ service: 'Авторский надзор', cost: 'от 15 000 ₽ / мес.' });
            }
            let pricesHtml = '';
            list.forEach(p => {
                pricesHtml += isDes
                    ? `<div class="des-price-row"><span class="des-price-name">${p.service}</span><span class="des-price-cost">${p.cost}</span></div>`
                    : `<div class="flex justify-between"><span class="text-slate-600">${p.service}</span><span class="font-bold text-slate-800">${p.cost}</span></div>`;
            });
            document.getElementById('portfolio-prices').innerHTML = pricesHtml;

            const tabs = document.getElementById('gallery-categories');
            if (cat === 'designers') {
                tabs.classList.remove('hidden');
                filterPortfolioGallery(/ландшафт/i.test(item.title || '') ? 'landscape' : 'interior');
            } else {
                tabs.classList.add('hidden');
                let galHtml = '';
                if(item.gallery) item.gallery.forEach((g) => { galHtml += `<div class="h-24 bg-slate-100 rounded-lg overflow-hidden border"><img src="${g}" onclick="openLightbox('${g}')" class="w-full h-full object-cover cursor-pointer"></div>`; });
                const gal = document.getElementById('portfolio-gallery');
                gal.className = 'grid grid-cols-2 gap-2';
                gal.innerHTML = galHtml;
            }
            document.getElementById('portfolio-phone-text').innerText = 'Показать телефонный номер';
            document.getElementById('portfolio-modal').classList.remove('hidden');
        }
        function closePortfolioModal() {
            const modal = document.getElementById('portfolio-modal');
            if (modal) { modal.classList.add('hidden'); modal.classList.remove('des-mode'); }
            currentPortfolioItem = null;
        }
        
        function revealPortfolioPhone() { 
            if (currentPortfolioItem) {
                document.getElementById('portfolio-phone-text').innerText = currentPortfolioItem.phone || '+7 (000) 000-00-00'; 
            }
        }
        
        function filterPortfolioGallery(category) {
            if(!currentPortfolioItem || !currentPortfolioItem.gallery) return;
            const des = document.getElementById('portfolio-modal') && document.getElementById('portfolio-modal').classList.contains('des-mode');
            ['interior','exterior','landscape'].forEach(c => {
                const el = document.getElementById(`btn-gal-${c}`);
                if (!el) return;
                if (des) el.className = (c===category) ? 'co-room on' : 'co-room';
                else el.className = (c===category) ? 'text-[10px] bg-[#1e6091] text-white px-3 py-1 rounded-full font-bold' : 'text-[10px] bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold';
            });
            const images = currentPortfolioItem.gallery[category] || [];
            const gal = document.getElementById('portfolio-gallery');
            if (des) {
                gal.className = 'des-collage';
                gal.innerHTML = images.map(function (img, i) {
                    const cls = 'c' + (i % 9);
                    return '<img src="' + img + '" class="' + cls + '" onclick="openLightbox(\'' + img + '\')" alt="">';
                }).join('');
            } else {
                gal.className = 'grid grid-cols-2 gap-2';
                gal.innerHTML = images.map(img => `<div class="w-full aspect-video bg-slate-100 rounded-xl overflow-hidden border col-span-2"><img src="${img}" onclick="openLightbox('${img}')" class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"></div>`).join('');
            }
        }

        // --- ОКНО ВАКАНСИЙ (С фото, сайтом и т.д.) ---
        function openVacancyModal(id) {
            const vac = vacanciesDb.find(v => v.id === id); if (!vac) return;
            currentVacancyItem = vac;
            document.getElementById('vacancy-title').innerText = vac.title;
            document.getElementById('vacancy-company').innerText = vac.company;
            
            document.getElementById('vacancy-company-photo').src = vac.companyPhoto || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600';
            document.getElementById('vacancy-site-link').href = vac.site || '#';
            
            document.getElementById('vacancy-desc').innerText = vac.desc;
            document.getElementById('vacancy-req').innerText = vac.req;
            document.getElementById('vacancy-hours').innerText = vac.hours || 'Полный день';
            document.getElementById('vacancy-salary').innerText = vac.salary;
            
            document.getElementById('vacancy-phone-text').innerText = 'Показать телефонный номер';
            document.getElementById('vacancy-modal').classList.remove('hidden');
        }
        function closeVacancyModal() { 
            document.getElementById('vacancy-modal').classList.add('hidden'); 
            currentVacancyItem = null; 
            document.getElementById('vacancy-company-photo').src = ''; 
        }
        function revealVacancyPhone() { 
            if (currentVacancyItem) {
                document.getElementById('vacancy-phone-text').innerText = currentVacancyItem.phone || '+7 (000) 000-00-00'; 
            }
        }

                // ============ СТРАНИЦА ТОВАРА ============
        window.currentProductId = null;

        // Собираем массив из 4 фото товара
        function pmGetImages(prod) {
            // Если у товара есть массив images — берём его
            let imgs = Array.isArray(prod.images) ? prod.images.filter(x => x) : [];
            // Если пусто — используем основное фото
            if (imgs.length === 0 && prod.image) imgs = [prod.image];
            // Дополняем до 4 картинок (повторяем последнюю)
            while (imgs.length < 4 && imgs.length > 0) imgs.push(imgs[imgs.length - 1]);
            return imgs.slice(0, 4);
        }

        // Открыть страницу товара
                        // ========= СТРАНИЦА ТОВАРА =========
        function pmEsc(s) {
            return String(s || '').replace(/[&<>"']/g, function (c) {
                return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
            });
        }

        function pmCategoryMeta(prod) {
            const raw = String((prod && prod.category) || '').toLowerCase().trim();
            const map = {
                'кухня': { id: 'кухня', title: 'Для кухни', chip: 'Кухня' },
                'спальня': { id: 'спальня', title: 'Для спальни', chip: 'Спальня' },
                'гостиная': { id: 'гостиная', title: 'Для гостиной', chip: 'Гостиная' },
                'ванная': { id: 'ванная', title: 'Для ванной', chip: 'Ванная' },
                'стройматериалы': { id: 'стройматериалы', title: 'Стройматериалы', chip: 'Стройматериалы' },
                'недвижимость': { id: 'недвижимость', title: (prod && prod.reSegment === 'commercial') ? 'Коммерческая недвижимость' : 'Недвижимость', chip: (prod && prod.reSegment === 'commercial') ? 'Коммерческая' : 'Недвижимость' }
            };
            if (map[raw]) return map[raw];
            const pretty = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Каталог';
            return { id: raw || 'каталог', title: pretty, chip: pretty };
        }

        function pmSetAssistantTabHidden(hide) {
            const tab = document.getElementById('assistant-side-tab');
            if (!tab) return;
            const sheet = document.getElementById('assistant-sheet');
            const assistantOpen = sheet && !sheet.classList.contains('hidden');
            if (hide) tab.hidden = true;
            else if (!assistantOpen) tab.hidden = false;
        }

        function pmIsGoods(prod) {
            if (!prod) return false;
            if (prod.category === 'недвижимость' || prod.reSegment) return false;
            return !pmIsCommercial(prod);
        }

        function productPassport(prod) {
            const empty = { kind: 'other', unit: 'шт', unitShort: '', specs: [], calc: '', calcHint: '' };
            if (!prod) return empty;
            if (prod.category === 'недвижимость' || prod.reSegment) return { kind: 'realty', unit: '', unitShort: '', specs: [], calc: '', calcHint: '' };
            const cat = String(prod.category || '').toLowerCase();
            const blob = ((prod.title || '') + ' ' + (prod.description || '')).toLowerCase();
            const known = {
                'prod-1': { kind: 'furniture', specs: [['Длина', '3 м'], ['Фасады', 'МДФ, матовые'], ['Столешница', 'Искусственный камень'], ['Фурнитура', 'С доводчиками'], ['Гарантия', '2 года'], ['Наличие', 'В магазине']] },
                'prod-2': { kind: 'furniture', specs: [['Спальное место', '160 × 200 см'], ['Каркас', 'Массив'], ['Основание', 'Реечное в комплекте'], ['Изголовье', 'Мягкое'], ['Наличие', 'В магазине']] },
                'prod-3': { kind: 'furniture', specs: [['Диаметр', '70 см'], ['Подсветка', 'LED по периметру'], ['Управление', 'Сенсор'], ['Покрытие', 'Влагостойкое'], ['Наличие', 'В магазине']] },
                'prod-4': { kind: 'material', unit: 'мешок', calc: 'Онлайн Калькулятор Штукатурки', calcHint: 'Стяжка и стены — посчитать объём', specs: [['Фасовка', '50 кг'], ['Марка', 'М500'], ['Назначение', 'Стяжка, кладка, фундамент']] },
                'prod-5': { kind: 'material', unit: 'ведро', specs: [['Объём', '10 л'], ['Расход', '1 л на 8–10 м²'], ['Тип', 'Фасадная акриловая'], ['Хватит примерно', '80–100 м²']] },
                'prod-6': { kind: 'material', unit: 'шт', specs: [['Размер', '600 × 300 × 200 мм'], ['Материал', 'Газобетон'], ['Свойства', 'Тёплый, лёгкий']] },
                'prod-7': { kind: 'furniture', specs: [['Тип', 'Угловой диван'], ['Механизм', 'Еврокнижка'], ['Обивка', 'Рогожка'], ['Ящик', 'Для белья'], ['Наличие', 'В магазине']] },
                'prod-8': { kind: 'furniture', specs: [['Длина', '3,5 м'], ['Фасады', 'Глянцевые'], ['Столешница', '38 мм'], ['Подсветка', 'Встроенная'], ['Наличие', 'В магазине']] },
                'prod-9': { kind: 'furniture', specs: [['Длина', '2,8 м'], ['Стиль', 'Лофт'], ['Столешница', 'Под бетон'], ['Наличие', 'В магазине']] },
                'prod-10': { kind: 'furniture', specs: [['Ширина', '2 м'], ['Дверцы', 'Зеркальные'], ['Секции', '3'], ['Цвет', 'Венге'], ['Наличие', 'В магазине']] },
                'prod-11': { kind: 'furniture', specs: [['Ящики', '4'], ['Ножки', 'Массив дуба'], ['Доводчики', 'Есть'], ['Наличие', 'В магазине']] },
                'prod-12': { kind: 'furniture', specs: [['Размер', '120 / 160 × 80 × 75 см'], ['Цвет', 'Белый / Мрамор'], ['Материал', 'МДФ, металл, стекло'], ['Вес', '52 кг'], ['Покрытие', 'ЛДСП под дерево'], ['Посадка', 'До 8 персон'], ['Гарантия', '12 месяцев'], ['Наличие', 'В магазине']] },
                'prod-13': { kind: 'furniture', specs: [['Высота', '180 см'], ['Ширина', '80 см'], ['Полки', '5'], ['Наличие', 'В магазине']] },
                'prod-14': { kind: 'material', unit: 'лист', calc: 'Онлайн Калькулятор Штукатурки', calcHint: 'Посчитать площадь стен', specs: [['Размер', '2500 × 1200 × 12,5 мм'], ['Назначение', 'Стены и потолки'], ['Серия', 'Влагостойкая под заказ']] },
                'prod-15': { kind: 'material', unit: 'шт', specs: [['Длина', '3 м'], ['Материал', 'Оцинкованная сталь'], ['Назначение', 'Каркас ГКЛ']] },
                'prod-16': { kind: 'material', unit: 'м²', calc: 'Онлайн Калькулятор Ламинат', calcHint: 'Площадь комнаты + запас 10%', specs: [['Класс', '33'], ['Толщина', '8 мм'], ['Фаска', '4V'], ['Текстура', 'Дуб']] },
                'prod-17': { kind: 'material', unit: 'м²', calc: 'Онлайн Калькулятор Плитки', calcHint: 'Посчитать плитку со швом и запасом', specs: [['Формат', '300 × 600 мм'], ['Поверхность', 'Матовая'], ['Назначение', 'Стены ванной и кухни']] },
                'prod-18': { kind: 'material', unit: 'шт', specs: [['Тип', 'Облицовочный керамический'], ['Назначение', 'Фасад, цоколь, забор'], ['Свойства', 'Морозостойкий']] },
                'prod-19': { kind: 'furniture', specs: [['Стиль', 'Скандинавский'], ['Обивка', 'Велюр'], ['Ножки', 'Деревянные'], ['Наличие', 'В магазине']] },
                'prod-20': { kind: 'furniture', specs: [['Спальное место', '180 × 200 см'], ['Механизм', 'Подъёмный'], ['Обивка', 'Экокожа'], ['Ящик', 'Бельевой'], ['Наличие', 'В магазине']] }
            };
            const base = known[prod.id] || {};
            let kind = base.kind || (cat === 'стройматериалы' ? 'material' : 'furniture');
            let unit = base.unit || 'шт';
            if (!base.unit && kind === 'material') {
                if (/ламинат|плитк/.test(blob)) unit = 'м²';
                else if (/гипс|лист/.test(blob)) unit = 'лист';
                else if (/цемент|мешок/.test(blob)) unit = 'мешок';
                else if (/краск/.test(blob)) unit = 'ведро';
            }
            const unitShort = kind === 'material' && unit ? '/ ' + unit : '';
            let specs = (base.specs || []).slice();
            if (!specs.length) {
                if (prod.sku) specs.push(['Артикул', prod.sku]);
                specs.push(['Наличие', 'В магазине']);
                specs.push(['Получение', 'Самовывоз']);
            }
            return {
                kind: kind,
                unit: unit,
                unitShort: unitShort,
                specs: specs,
                calc: base.calc || (/плитк/.test(blob) ? 'Онлайн Калькулятор Плитки' : (/ламинат/.test(blob) ? 'Онлайн Калькулятор Ламинат' : (/штукатур|гипс|цемент/.test(blob) ? 'Онлайн Калькулятор Штукатурки' : ''))),
                calcHint: base.calcHint || 'Открыть калькулятор'
            };
        }

        function productCardHtml(prod) {
            if (!prod) return '';
            const pass = productPassport(prod);
            const goods = pmIsGoods(prod);
            const inCart = cartHasProduct(prod.id);
            const isFav = state.favorites && state.favorites.includes(prod.id);
            const nPhoto = (Array.isArray(prod.images) && prod.images.length > 1) ? prod.images.length : 0;
            const sale = prod.oldPrice && prod.badge === 'sale';
            const unit = pass.unitShort ? ' <em>' + pmEsc(pass.unitShort) + '</em>' : '';
            const cart = goods
                ? '<button type="button" onclick="event.stopPropagation(); addToCart(\'' + prod.id + '\')" class="pc-cart' + (inCart ? ' in' : '') + '"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg></button>'
                : '';
            return '<div onclick="openProductModal(\'' + prod.id + '\')" class="pc-card product-card" data-category="' + pmEsc(prod.category || 'мебель') + '">' +
                '<div class="pc-photo">' +
                '<img src="' + pmEsc(prod.image || '') + '" alt="">' +
                (getBadgeHtml(prod) ? '<div class="pc-badge">' + getBadgeHtml(prod) + '</div>' : '') +
                (nPhoto ? '<span class="pc-photos">' + nPhoto + ' фото</span>' : '') +
                '<button type="button" onclick="event.stopPropagation(); toggleFavorite(\'' + prod.id + '\')" class="pc-fav' + (isFav ? ' on' : '') + '"><svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>' +
                '</div>' +
                '<div class="pc-body">' +
                '<div class="pc-price">' + pmEsc(prod.price || '') + unit + (sale ? '<span class="pc-old">' + pmEsc(prod.oldPrice) + '</span>' : '') + '</div>' +
                '<h5 class="pc-title line-clamp-2">' + pmEsc(prod.title || '') + '</h5>' +
                '<p class="pc-store">' + pmEsc(prod.store || '') + '</p>' +
                '</div>' + cart +
                '</div>';
        }

        function cartQtyOf(prodId) {
            if (!prodId || typeof getCartItems !== 'function') return 0;
            const item = getCartItems().find(function (i) { return i.productId === prodId; });
            return item ? (item.qty || 1) : 0;
        }

        function pmBindSwipe() {
            const hero = document.getElementById('pm-hero');
            if (!hero || hero.dataset.pmSwipe === '1') return;
            hero.dataset.pmSwipe = '1';
            let x0 = 0;
            hero.addEventListener('touchstart', function (e) {
                if (!e.changedTouches || !e.changedTouches[0]) return;
                x0 = e.changedTouches[0].clientX;
            }, { passive: true });
            hero.addEventListener('touchend', function (e) {
                if (!e.changedTouches || !e.changedTouches[0]) return;
                const dx = e.changedTouches[0].clientX - x0;
                if (Math.abs(dx) < 44) return;
                pmGalleryStep(dx < 0 ? 1 : -1);
            }, { passive: true });
        }

        function pmGalleryStep(dir) {
            if (window.commMediaTab === 'plan') return;
            const imgs = window.pmImages || [];
            if (imgs.length < 2) return;
            const i = ((window.pmIndex || 0) + dir + imgs.length) % imgs.length;
            pmSelectThumb(i);
        }

        function pmPaintGalleryChrome() {
            const imgs = window.pmImages || [];
            const many = imgs.length > 1 && window.commMediaTab !== 'plan';
            const prev = document.getElementById('pm-prev');
            const next = document.getElementById('pm-next');
            const dots = document.getElementById('pm-dots');
            const count = document.getElementById('pm-photo-count');
            if (prev) prev.classList.toggle('hidden', !many);
            if (next) next.classList.toggle('hidden', !many);
            if (count) {
                count.classList.toggle('hidden', imgs.length < 2);
                count.textContent = ((window.pmIndex || 0) + 1) + ' / ' + imgs.length;
            }
            if (dots) {
                dots.classList.toggle('hidden', !many);
                dots.innerHTML = imgs.map(function (_, i) {
                    return '<i class="' + (i === (window.pmIndex || 0) ? 'on' : '') + '"></i>';
                }).join('');
            }
        }

        function pmRenderPrice(prod) {
            const box = document.getElementById('pm-price');
            if (!box || !prod) return;
            const pass = productPassport(prod);
            const sale = prod.oldPrice && prod.badge === 'sale';
            const unit = pass.unitShort ? '<span class="pm-unit">' + pmEsc(pass.unitShort) + '</span>' : '';
            if (sale) {
                box.innerHTML = '<div class="pm-price-row"><span class="oz-price-main text-rose-500">' + pmEsc(prod.price) + '</span>' + unit + '<span class="oz-price-old text-[14px]">' + pmEsc(prod.oldPrice) + '</span></div>';
            } else {
                box.innerHTML = '<div class="pm-price-row"><span class="oz-price-main">' + pmEsc(prod.price || '') + '</span>' + unit + '</div>';
            }
        }

        function pmRenderExcerpt(prod) {
            const box = document.getElementById('pm-excerpt');
            if (!box) return;
            const d = String(prod && prod.description || '').trim();
            box.classList.add('clamp');
            box.textContent = d || 'Коротко о товаре — откройте карточку ниже.';
        }

        function pmWbRow(row) {
            const copy = row[0] === 'Артикул' ? ' onclick="pmCopySku()"' : '';
            const tag = row[0] === 'Артикул' ? 'button type="button"' : 'div';
            const close = row[0] === 'Артикул' ? 'button' : 'div';
            return '<' + tag + ' class="pm-wb-row"' + copy + '><span class="k">' + pmEsc(row[0]) + '</span><i class="dots"></i><span class="v">' + pmEsc(row[1]) + '</span></' + close + '>';
        }

        function pmSpecGroups(specs) {
            const extraNames = { 'Артикул': 1, 'Наличие': 1, 'Гарантия': 1, 'Получение': 1, 'Магазин': 1 };
            const main = [];
            const extra = [];
            (specs || []).forEach(function (r) {
                if (extraNames[r[0]]) extra.push(r);
                else main.push(r);
            });
            const groups = [];
            if (main.length) groups.push({ title: 'Основная информация', rows: main });
            if (extra.length) groups.push({ title: 'Дополнительная информация', rows: extra });
            return groups;
        }

        function pmSheetHighlight(which) {
            const specsBtn = document.getElementById('pm-sheet-pill-specs');
            const descBtn = document.getElementById('pm-sheet-pill-desc');
            if (specsBtn) specsBtn.classList.toggle('on', which !== 'desc');
            if (descBtn) descBtn.classList.toggle('on', which === 'desc');
        }

        function pmSheetScroll(which) {
            const target = document.getElementById(which === 'desc' ? 'pm-sheet-desc' : 'pm-sheet-specs');
            const sc = document.getElementById('pm-about-sheet-body');
            if (!target || target.classList.contains('hidden') || !sc) return;
            const y = target.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 6;
            sc.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }

        function openPmAboutSheet(which) {
            const sheet = document.getElementById('pm-about-sheet');
            if (!sheet) return;
            const specsEl = document.getElementById('pm-sheet-specs');
            const descEl = document.getElementById('pm-sheet-desc');
            const hasSpecs = specsEl && !specsEl.classList.contains('hidden') && specsEl.innerHTML;
            const hasDesc = descEl && !descEl.classList.contains('hidden');
            if (!which || (which === 'specs' && !hasSpecs) || (which === 'desc' && !hasDesc)) {
                which = hasSpecs ? 'specs' : 'desc';
            }
            sheet.classList.remove('hidden');
            const sc = document.getElementById('pm-about-sheet-body');
            if (sc) sc.scrollTop = 0;
            pmSheetHighlight(which);
            requestAnimationFrame(function () {
                requestAnimationFrame(function () { pmSheetScroll(which); });
            });
        }

        function closePmAboutSheet() {
            const sheet = document.getElementById('pm-about-sheet');
            if (!sheet) return;
            sheet.classList.add('hidden');
        }

        function pmJumpTo(which) {
            const sheet = document.getElementById('pm-about-sheet');
            if (!sheet || sheet.classList.contains('hidden')) {
                openPmAboutSheet(which);
                return;
            }
            pmSheetHighlight(which);
            pmSheetScroll(which);
        }

        function pmRenderSpecs(prod) {
            const box = document.getElementById('pm-sheet-specs');
            const descBlock = document.getElementById('pm-sheet-desc');
            const descFull = document.getElementById('pm-sheet-desc-body');
            const openBtn = document.getElementById('pm-about-open');
            const pillSpecs = document.getElementById('pm-sheet-pill-specs');
            const pillDesc = document.getElementById('pm-sheet-pill-desc');
            if (!box) return;
            if (!pmIsGoods(prod)) {
                box.classList.add('hidden');
                box.innerHTML = '';
                if (descBlock) { descBlock.classList.add('hidden'); if (descFull) descFull.innerHTML = ''; }
                if (openBtn) openBtn.classList.add('hidden');
                if (pillSpecs) pillSpecs.classList.add('hidden');
                if (pillDesc) pillDesc.classList.add('hidden');
                const pillsOff = document.querySelector('#pm-about-sheet .pm-about-sheet-pills');
                if (pillsOff) pillsOff.classList.add('hidden');
                return;
            }
            let specs = (productPassport(prod).specs || []).slice();
            if (prod.sku && !specs.some(function (r) { return r[0] === 'Артикул'; })) {
                specs.unshift(['Артикул', prod.sku]);
            }
            if (prod.store && !specs.some(function (r) { return r[0] === 'Магазин'; })) {
                specs.push(['Магазин', prod.store]);
            }
            if (!specs.some(function (r) { return r[0] === 'Получение'; })) {
                specs.push(['Получение', 'Самовывоз']);
            }
            const groups = pmSpecGroups(specs);
            if (!groups.length) {
                box.classList.add('hidden');
                box.innerHTML = '';
            } else {
                box.classList.remove('hidden');
                box.innerHTML = groups.map(function (g) {
                    return '<p class="pm-wb-h">' + pmEsc(g.title) + '</p>' + g.rows.map(pmWbRow).join('');
                }).join('');
            }
            const d = String(prod.description || '').trim();
            const extra = pmExtraAbout(prod).filter(Boolean);
            const paras = [];
            if (d) paras.push(d);
            extra.forEach(function (p) { if (p && p !== d) paras.push(p); });
            if (descBlock && descFull) {
                if (!paras.length) {
                    descBlock.classList.add('hidden');
                    descFull.innerHTML = '';
                } else {
                    descBlock.classList.remove('hidden');
                    descFull.innerHTML = paras.map(function (p) { return '<p>' + pmEsc(p) + '</p>'; }).join('');
                }
            }
            const hasSpecs = !box.classList.contains('hidden');
            const hasDesc = descBlock && !descBlock.classList.contains('hidden');
            if (pillSpecs) pillSpecs.classList.toggle('hidden', !hasSpecs);
            if (pillDesc) pillDesc.classList.toggle('hidden', !hasDesc);
            const pills = document.querySelector('#pm-about-sheet .pm-about-sheet-pills');
            if (pills) pills.classList.toggle('hidden', !hasSpecs && !hasDesc);
            if (openBtn) openBtn.classList.toggle('hidden', !hasSpecs && !hasDesc);
            pmRenderOfferBoard(prod);
        }

        function pmSpecValue(specs, names) {
            const list = specs || [];
            for (let i = 0; i < list.length; i++) {
                const key = String(list[i][0] || '');
                for (let n = 0; n < names.length; n++) {
                    if (key === names[n] || key.indexOf(names[n]) === 0) return String(list[i][1] || '');
                }
            }
            return '';
        }

        function pmColorOptions(prod) {
            const blob = ((prod && prod.title) || '') + ' ' + ((prod && prod.description) || '') + ' ' + pmSpecValue((productPassport(prod).specs || []), ['Цвет', 'Обивка', 'Фасады', 'Покрытие', 'Текстура']);
            const low = blob.toLowerCase();
            const opts = [];
            const hasMarble = /мрамор|белый \/|белый\/мрамор/.test(low);
            if (/венге/.test(low)) opts.push({ id: 'wenge', label: 'Венге', hex: ['#4A3428'] });
            if (!hasMarble && /дуб|соном|дерево/.test(low)) opts.push({ id: 'oak', label: 'Дуб', hex: ['#C4A574'] });
            if (hasMarble || /белый|матовый|глянц/.test(low) || !opts.length) opts.unshift({ id: 'marble', label: 'Белый / Мрамор', hex: ['#F3F0EA', '#8B9098'] });
            if (!opts.some(function (o) { return o.id === 'graphite'; })) opts.push({ id: 'graphite', label: 'Графит', hex: ['#3A4149'] });
            const uniq = [];
            const seen = {};
            opts.forEach(function (o) {
                if (seen[o.id]) return;
                seen[o.id] = 1;
                uniq.push(o);
            });
            return uniq.slice(0, hasMarble ? 2 : 3);
        }

        function pmFormatSize(specs) {
            const size = pmSpecValue(specs, ['Размер', 'Спальное место', 'Формат']);
            if (size && /[x×х]|см|мм/i.test(size)) return size;
            const L = pmSpecValue(specs, ['Длина']);
            const W = pmSpecValue(specs, ['Ширина']);
            const H = pmSpecValue(specs, ['Высота']);
            const parts = [L, W, H].filter(Boolean);
            if (parts.length >= 2) return parts.join(' × ');
            return size || L || W || H || 'По запросу';
        }

        function pmGuessWeight(prod, specs) {
            const fromSpec = pmSpecValue(specs, ['Вес']);
            if (fromSpec) return fromSpec;
            const blob = ((prod && prod.title) || '') + ' ' + ((prod && prod.description) || '');
            const low = blob.toLowerCase();
            if (/стол/.test(low)) return '52 кг';
            if (/диван/.test(low)) return '78 кг';
            if (/кровать/.test(low)) return '64 кг';
            if (/шкаф|комод/.test(low)) return '46 кг';
            if (/кресл/.test(low)) return '18 кг';
            if (/стул/.test(low)) return '7 кг';
            if (/кухн/.test(low)) return '86 кг';
            if (/мешок|цемент/.test(low)) return '50 кг';
            if (/плитк|ламинат/.test(low)) return '18 кг / уп.';
            return '—';
        }

        function pmRenderOfferBoard(prod) {
            const board = document.getElementById('pm-offer-board');
            if (!board) return;
            const show = pmIsGoods(prod);
            board.classList.toggle('hidden', !show);
            if (!show) return;
            const specs = (productPassport(prod).specs || []).slice();
            const size = pmFormatSize(specs);
            const material = pmSpecValue(specs, ['Материал', 'Фасады', 'Каркас', 'Обивка', 'Покрытие']) || 'Уточняется';
            const colors = pmColorOptions(prod);
            const colorFromSpec = pmSpecValue(specs, ['Цвет']);
            if (!window.pmSelectedColor || window.pmSelectedColorProd !== prod.id) {
                let pick = colors[0];
                if (colorFromSpec) {
                    const low = colorFromSpec.toLowerCase();
                    pick = colors.find(function (c) {
                        const lab = String(c.label || '').toLowerCase();
                        return lab && (low.indexOf(lab) !== -1 || lab.indexOf(low) !== -1);
                    }) || Object.assign({}, colors[0] || { id: 'spec', hex: ['#F3F0EA', '#8B9098'] }, { label: colorFromSpec });
                }
                window.pmSelectedColor = pick;
                window.pmSelectedColorProd = prod.id;
            }
            const sizeEl = document.getElementById('pm-spec-size');
            const matEl = document.getElementById('pm-spec-material');
            const weightEl = document.getElementById('pm-spec-weight');
            const warEl = document.getElementById('pm-trust-warranty');
            const delEl = document.getElementById('pm-trust-delivery');
            if (sizeEl) sizeEl.textContent = size;
            if (matEl) matEl.textContent = material;
            if (weightEl) weightEl.textContent = pmGuessWeight(prod, specs);
            if (warEl) warEl.textContent = pmSpecValue(specs, ['Гарантия']) || '12 месяцев';
            if (delEl) delEl.textContent = String(prod.category || '').toLowerCase() === 'стройматериалы' ? '1–2 дня' : '1–3 дня';
            window.pmOfferHints = {
                weight: 'Вес: ' + (weightEl ? weightEl.textContent : '—') + '. Точное значение уточните у продавца.',
                warranty: 'Гарантия: ' + (warEl ? warEl.textContent : '12 месяцев') + '. Условия у продавца.',
                delivery: 'Доставка: ' + (delEl ? delEl.textContent : '1–3 дня') + '. Самовывоз — в день подтверждения.',
                quality: 'Товар от проверенного продавца. Наличие и комплектацию подтверждают перед отгрузкой.'
            };
            pmPaintColorDots(colors);
        }

        function pmPaintColorDots(colors) {
            const box = document.getElementById('pm-color-dots');
            const label = document.getElementById('pm-spec-color');
            if (!box) return;
            const selected = window.pmSelectedColor || colors[0];
            if (label && selected) label.textContent = selected.label;
            box.innerHTML = (colors || []).map(function (c) {
                const on = selected && selected.id === c.id ? ' on' : '';
                const bg = 'linear-gradient(135deg, ' + (c.hex[0] || '#ddd') + ' 0%, ' + (c.hex[1] || c.hex[0] || '#bbb') + ' 100%)';
                return '<button type="button" class="pm-color-dot' + on + '" style="background:' + bg + '" onclick="pmSelectColor(\'' + c.id + '\')" aria-label="' + pmEsc(c.label) + '"></button>';
            }).join('');
        }

        function pmSelectColor(id) {
            const prod = productsDb[window.currentProductId];
            if (!prod) return;
            const colors = pmColorOptions(prod);
            const found = colors.find(function (c) { return c.id === id; });
            if (!found) return;
            window.pmSelectedColor = found;
            window.pmSelectedColorProd = prod.id;
            pmPaintColorDots(colors);
            showSmsToast('Цвет: ' + found.label);
        }

        function pmOfferHint(kind) {
            const hints = window.pmOfferHints || {};
            showSmsToast(hints[kind] || 'Подробности у продавца');
        }

        function pmRenderCalc(prod) {
            const btn = document.getElementById('pm-calc-btn');
            const hint = document.getElementById('pm-calc-hint');
            if (!btn) return;
            const pass = productPassport(prod);
            const show = pmIsGoods(prod) && !!pass.calc;
            btn.classList.toggle('hidden', !show);
            if (hint) hint.textContent = pass.calcHint || 'Открыть калькулятор';
        }

        function pmOpenCalc() {
            const prod = productsDb[window.currentProductId];
            const pass = productPassport(prod);
            if (!pass.calc) return;
            closeProductModal();
            if (typeof switchDirectoryView === 'function') switchDirectoryView('calculator');
            if (typeof openSpecificCalc === 'function') openSpecificCalc(pass.calc);
        }

        function pmSetGoodsVisible(show) {
            const excerpt = document.getElementById('pm-excerpt-wrap');
            const qty = document.getElementById('pm-qty-wrap');
            const openBtn = document.getElementById('pm-about-open');
            if (excerpt) excerpt.classList.toggle('hidden', !show);
            if (qty) qty.classList.toggle('hidden', !show);
            if (!show) {
                closePmAboutSheet();
                if (openBtn) openBtn.classList.add('hidden');
                ['pm-calc-btn', 'pm-recent-wrap', 'pm-about-sheet', 'pm-offer-board'].forEach(function (id) {
                    const el = document.getElementById(id);
                    if (el) el.classList.add('hidden');
                });
            }
        }

        function pmSetQty(delta) {
            const n = Math.max(1, (window.pmQty || 1) + delta);
            window.pmQty = n;
            const el = document.getElementById('pm-qty');
            if (el) el.textContent = String(n);
        }

        function pmTrackRecent(id) {
            if (!id) return;
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem('meb_pm_recent') || '[]') || []; } catch (e) { arr = []; }
            arr = arr.filter(function (x) { return x !== id; });
            arr.unshift(id);
            arr = arr.slice(0, 12);
            try { localStorage.setItem('meb_pm_recent', JSON.stringify(arr)); } catch (e) {}
        }

        function pmMiniCard(prod, commercial) {
            if (!prod) return '';
            const inCart = !commercial && cartHasProduct(prod.id);
            const isFav = state.favorites && state.favorites.includes(prod.id);
            const cartBtn = commercial ? '' : '<button type="button" onclick="event.stopPropagation(); addToCart(\'' + prod.id + '\'); pmRefreshCart(); renderPmSimilar(); renderPmRecent();" class="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow-sm ' + (inCart ? 'bg-[#1e6091] text-white' : 'bg-white text-slate-700') + '"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg></button>';
            const pass = productPassport(prod);
            const unit = pass.unitShort ? ' <span class="text-[11px] font-bold text-slate-400">' + pmEsc(pass.unitShort) + '</span>' : '';
            return '<div class="pc-mini" onclick="openProductModal(\'' + prod.id + '\')">' +
                '<div class="pc-photo relative">' +
                '<img src="' + pmEsc(prod.image || '') + '" alt="">' +
                '<button type="button" onclick="event.stopPropagation(); toggleFavorite(\'' + prod.id + '\'); pmRefreshFav(); renderPmSimilar(); renderPmRecent();" class="pc-fav' + (isFav ? ' on' : '') + '"><svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></button>' +
                cartBtn +
                '</div>' +
                '<span class="pc-price">' + pmEsc(prod.price || '') + unit + '</span>' +
                '<span class="pc-title line-clamp-2">' + pmEsc(prod.title || '') + '</span></div>';
        }

        function renderPmRecent() {
            const wrap = document.getElementById('pm-recent-wrap');
            const box = document.getElementById('pm-recent');
            if (!wrap || !box) return;
            const current = productsDb[window.currentProductId];
            if (!pmIsGoods(current)) { wrap.classList.add('hidden'); box.innerHTML = ''; return; }
            let ids = [];
            try { ids = JSON.parse(localStorage.getItem('meb_pm_recent') || '[]') || []; } catch (e) { ids = []; }
            const items = ids.map(function (id) { return productsDb[id]; }).filter(function (p) {
                return p && p.status === 'published' && p.id !== window.currentProductId && pmIsGoods(p);
            }).slice(0, 8);
            if (!items.length) { wrap.classList.add('hidden'); box.innerHTML = ''; return; }
            wrap.classList.remove('hidden');
            box.innerHTML = items.map(function (p) { return pmMiniCard(p, false); }).join('');
        }

        function shareProduct() {
            const prod = productsDb[window.currentProductId];
            if (!prod) return;
            if (pmIsCommercial(prod)) return shareCommListing();
            const text = (prod.title || '') + ' — ' + (prod.price || '');
            if (navigator.share) {
                navigator.share({ title: prod.title, text: text }).catch(function () {});
                return;
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () { showSmsToast('Ссылка скопирована'); }).catch(function () { showSmsToast(text); });
            } else showSmsToast(text);
        }

        function openProductModal(id) {
            const prod = productsDb[id];
            if (!prod) { console.warn('Товар не найден:', id); return; }
            window.currentProductId = id;
            window.pmQty = 1;
            window.pmExcerptOpen = false;
            setProductAboutOpen(false);
            pmTrackRecent(id);
            pmBindSwipe();

            let imgs = [];
            if (Array.isArray(prod.images) && prod.images.length) imgs = prod.images;
            else if (prod.image) imgs = [prod.image];
            else imgs = ['https://via.placeholder.com/600x400?text=Нет+фото'];
            window.pmImages = imgs;
            window.pmIndex = 0;

            document.getElementById('pm-main-image').src = imgs[0];

            const thumbs = document.getElementById('pm-thumbs');
            thumbs.innerHTML = '';
            thumbs.classList.toggle('hidden', imgs.length < 2);
            imgs.forEach((src, i) => {
                const t = document.createElement('img');
                t.src = src;
                t.className = i === 0 ? 'on' : '';
                t.onclick = () => pmSelectThumb(i);
                thumbs.appendChild(t);
            });
            pmPaintGalleryChrome();

            const badgeEl = document.getElementById('pm-badge');
            if (badgeEl) badgeEl.innerHTML = getBadgeHtml(prod);

            pmRenderPrice(prod);
            pmRenderExcerpt(prod);
            pmRenderSpecs(prod);
            pmRenderCalc(prod);
            pmSetQty(0);

            const meta = pmCategoryMeta(prod);
            const catChip = document.getElementById('pm-cat-chip');
            const catLabel = document.getElementById('pm-cat-label');
            if (catLabel) catLabel.textContent = meta.chip;
            if (catChip) catChip.classList.toggle('hidden', !prod.category);

            document.getElementById('pm-title').textContent = prod.title || 'Без названия';
            document.getElementById('pm-store').textContent = prod.store || '—';
            const sellerSub = document.getElementById('pm-seller-sub');
            if (sellerSub) sellerSub.textContent = pmIsGoods(prod) ? 'Самовывоз · витрина магазина' : 'Продавец';
            pmFillAbout(prod);
            setProductAboutOpen(false);
            applyPmCommercialLayout(prod);
            if (!pmIsCommercial(prod)) pmSetGoodsVisible(pmIsGoods(prod));
            if (pmIsGoods(prod)) {
                pmRenderSpecs(prod);
                pmRenderCalc(prod);
            }
            closePmAboutSheet();

            pmRefreshFav();
            pmRefreshCart();
            renderPmSimilar();
            renderPmRecent();

            const m = document.getElementById('product-modal');
            m.classList.remove('hidden');
            m.classList.add('flex');
            pmSetAssistantTabHidden(true);
            const scroll = document.getElementById('pm-scroll');
            if (scroll) scroll.scrollTop = 0;
        }

        function pmSelectThumb(i) {
            if (!window.pmImages || !window.pmImages[i]) return;
            window.pmIndex = i;
            document.getElementById('pm-main-image').src = window.pmImages[i];
            const thumbs = document.getElementById('pm-thumbs').children;
            for (let k = 0; k < thumbs.length; k++) {
                thumbs[k].classList.toggle('on', k === i);
            }
            pmPaintGalleryChrome();
        }

        function closeProductModal() {
            closeLightbox();
            closePmAboutSheet();
            setProductAboutOpen(false);
            if (typeof closeCommViewSheet === 'function') closeCommViewSheet();
            const m = document.getElementById('product-modal');
            m.classList.add('hidden');
            m.classList.remove('flex');
            m.style.zIndex = '';
            window.currentProductId = null;
            pmSetAssistantTabHidden(false);
        }

        function pmRefreshFav() {
            const btn = document.getElementById('pm-fav-btn');
            if (!btn) return;
            const isFav = state.favorites && state.favorites.includes(window.currentProductId);
            btn.classList.toggle('text-red-500', !!isFav);
            btn.classList.toggle('text-slate-300', !isFav);
        }

        function pmRefreshCart() {
            const btn = document.getElementById('pm-cart-btn');
            const label = document.getElementById('pm-cart-label');
            if (!btn) return;
            const n = cartQtyOf(window.currentProductId);
            btn.classList.remove('bg-[#e11d48]', 'bg-[#1c3a34]');
            btn.classList.add('bg-[#1e6091]');
            if (label) label.textContent = n ? ('В корзине · ' + n + ' шт') : 'В корзину';
        }

        function pmAddToCart() {
            if (!window.currentProductId) return;
            addToCart(window.currentProductId, window.pmQty || 1);
            pmRefreshCart();
        }

        function pmOpenShop() {
            const prod = productsDb[window.currentProductId];
            if (!prod) return;
            const shop = document.getElementById('shop-catalog-modal');
            const pm = document.getElementById('product-modal');
            if (shop) {
                const pmZ = parseInt((pm && pm.style.zIndex) || '60', 10) || 60;
                shop.style.zIndex = String(Math.max(70, pmZ + 10));
            }
            openShopCatalogModal(prod.store);
        }

        function pmOpenCategory() {
            const prod = productsDb[window.currentProductId];
            if (!prod || !prod.category) return;
            if (pmIsCommercial(prod)) {
                closeProductModal();
                const comm = document.getElementById('subview-re-commercial');
                if (!comm || comm.classList.contains('hidden')) {
                    if (typeof switchDirectoryView === 'function') switchDirectoryView('re-commercial');
                }
                return;
            }
            const meta = pmCategoryMeta(prod);
            setProductAboutOpen(false);
            closeProductModal();
            if (typeof closeShopCatalogModal === 'function') closeShopCatalogModal();
            openCategoryProducts(meta.id, meta.title);
        }

        function pmFillAbout(prod) {
            const meta = pmCategoryMeta(prod);
            const skuRow = document.getElementById('pm-about-sku-row');
            const aboutSku = document.getElementById('pm-about-sku');
            const aboutCat = document.getElementById('pm-about-cat');
            const aboutStore = document.getElementById('pm-about-store');
            const desc = document.getElementById('pm-desc');
            if (skuRow) skuRow.classList.toggle('hidden', !prod.sku);
            if (aboutSku) aboutSku.textContent = prod.sku || '—';
            if (aboutCat) aboutCat.textContent = meta.chip + ' ›';
            if (aboutStore) aboutStore.textContent = (prod.store || '—') + ' ›';
            if (desc) desc.innerHTML = pmBuildAboutHtml(prod);
        }

        function pmBuildAboutHtml(prod) {
            const paras = [];
            if (!pmIsGoods(prod) && prod.description) paras.push(prod.description);
            pmExtraAbout(prod).forEach(function (p) { if (p) paras.push(p); });
            if (!paras.length) paras.push('Точные характеристики, наличие и условия получения уточняйте у продавца.');
            return paras.map(function (p) { return '<p>' + pmEsc(p) + '</p>'; }).join('');
        }

        function pmExtraAbout(prod) {
            const out = [];
            if (prod.reType || prod.reArea || prod.reLocation) {
                const bits = [];
                if (prod.reDeal) bits.push(prod.reDeal === 'купить' ? 'Сделка: покупка' : 'Сделка: ' + prod.reDeal);
                if (prod.reType) bits.push('Тип: ' + prod.reType);
                if (prod.reRooms) bits.push('Комнат: ' + prod.reRooms);
                if (prod.reArea) bits.push('Площадь: ' + prod.reArea + ' м²');
                if (prod.reLocation) bits.push('Расположение: ' + prod.reLocation);
                if (prod.reMarket) bits.push('Рынок: ' + prod.reMarket);
                if (bits.length) out.push(bits.join('. ') + '.');
                out.push('Показ объекта, документы и актуальные условия обсуждаются напрямую с продавцом.');
                return out;
            }
            const cat = String(prod.category || '').toLowerCase();
            const byCat = {
                кухня: 'Кухня собирается по размерам помещения. Цвет фасадов, столешницу и фурнитуру можно согласовать с магазином. Замер, доставка и установка обсуждаются отдельно.',
                спальня: 'Перед заказом сверьте габариты с проёмами и планировкой комнаты. Сборка и доставка — по договорённости с продавцом.',
                гостиная: 'Модель подходит для гостиной и студии. Уточните обивку, цвет и наличие у продавца до оформления заказа.',
                ванная: 'Для влажных помещений важны влагостойкость и способ крепления. Комплектацию и установку уточняйте в магазине.',
                стройматериалы: 'Цена указана за единицу товара, как в карточке. Количество, фасовку и доставку на объект лучше согласовать с продавцом заранее.',
                недвижимость: 'Актуальная цена, документы и возможность просмотра — у продавца.'
            };
            out.push(byCat[cat] || 'Точные характеристики, наличие и условия получения уточняйте у продавца.');
            if (prod.oldPrice && prod.badge === 'sale') {
                out.push('Сейчас действует скидка: вместо ' + prod.oldPrice + ' товар стоит ' + prod.price + '.');
            }
            return out;
        }

        function setProductAboutOpen(open) {
            const panel = document.getElementById('pm-about-panel');
            const btn = document.getElementById('pm-about-toggle');
            if (panel) panel.classList.toggle('open', !!open);
            if (btn) {
                btn.classList.toggle('open', !!open);
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            }
        }

        function toggleProductAbout() {
            const panel = document.getElementById('pm-about-panel');
            const willOpen = !(panel && panel.classList.contains('open'));
            setProductAboutOpen(willOpen);
        }

        function closeProductAboutSheet() {
            setProductAboutOpen(false);
        }

        function pmCopySku() {
            const prod = productsDb[window.currentProductId];
            const sku = prod && prod.sku;
            if (!sku) return showSmsToast('Артикул не указан');
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(sku).then(function () {
                    showSmsToast('Артикул скопирован');
                }).catch(function () {
                    showSmsToast(sku);
                });
            } else {
                showSmsToast(sku);
            }
        }

        function renderPmSimilar() {
            const wrap = document.getElementById('pm-similar-wrap');
            const box = document.getElementById('pm-similar');
            if (!wrap || !box) return;
            const current = productsDb[window.currentProductId];
            if (!current || !current.category) {
                wrap.classList.add('hidden');
                box.innerHTML = '';
                return;
            }
            const cat = String(current.category).toLowerCase();
            const commercial = pmIsCommercial(current);
            const items = [];
            const rest = [];
            for (const key in productsDb) {
                const p = productsDb[key];
                if (!p || p.status !== 'published' || p.id === current.id) continue;
                if (String(p.category || '').toLowerCase() !== cat) continue;
                if (commercial) {
                    if (!pmIsCommercial(p)) continue;
                    if (p.reType && current.reType && p.reType === current.reType) items.push(p);
                    else rest.push(p);
                } else {
                    items.push(p);
                }
                if (!commercial && items.length >= 8) break;
            }
            if (commercial) {
                rest.forEach(function (p) { if (items.length < 8) items.push(p); });
            }
            if (!items.length) {
                wrap.classList.add('hidden');
                box.innerHTML = '';
                return;
            }
            wrap.classList.remove('hidden');
            const titleEl = document.getElementById('pm-similar-title');
            if (titleEl) titleEl.textContent = commercial ? 'Похожие помещения' : 'Похожие товары';
            box.innerHTML = items.slice(0, 8).map(function (prod) { return pmMiniCard(prod, commercial); }).join('');
        }

        // Связаться с менеджером
        function pmContactManager() {
            const prod = productsDb[window.currentProductId];
            const title = prod ? prod.title : 'товар';
            if (pmIsCommercial(prod)) {
                showSmsToast('Сообщение по объекту отправлено');
                return;
            }
            alert('Заявка отправлена менеджеру по товару: ' + title);
        }

        function pmIsCommercial(prod) {
            if (!prod) return false;
            if (typeof isCommercialListing === 'function') return isCommercialListing(prod);
            return prod.reSegment === 'commercial';
        }

        function commListingProfile(prod) {
            const t = String((prod && prod.reType) || '').toLowerCase();
            const isRent = prod && prod.reDeal === 'арендовать';
            const by = {
                'офис': { floor: '3 из 5', ceiling: '3.2 м', parking: 'Гостевая', entrance: 'Через холл', power: '15 кВт', condition: 'С отделкой', features: ['Интернет', 'Кондиционер', 'Охрана 24/7'], suitable: ['Офис', 'Бухгалтерия', 'Юр. адрес'], nearby: 'Центр, парковка, остановки рядом' },
                'торговая площадь': { floor: '1 из 2', ceiling: '3.5 м', parking: 'У ТЦ', entrance: 'С улицы', power: '20 кВт', condition: 'Под отделку', features: ['Витрины', 'Первая линия', 'Трафик'], suitable: ['Магазин', 'Пункт выдачи', 'Салон'], nearby: 'Первая линия, поток покупателей' },
                'склад': { floor: '1', ceiling: '6 м', parking: 'Для фур', entrance: 'Пандус', power: '380 В', condition: 'Отапливаемый', features: ['Пандус', 'Зона разгрузки', 'Охрана'], suitable: ['Склад', 'Ответхранение', 'Интернет-магазин'], nearby: 'Промзона, подъезд фуры' },
                'кладовая': { floor: 'Цоколь', ceiling: '2.4 м', parking: '—', entrance: 'Со двора', power: 'Освещение', condition: 'Сухое', features: ['Доступ 24/7', 'Сухое'], suitable: ['Хранение', 'Архив'], nearby: 'Жилой дом, доступ 24/7' },
                'производство': { floor: '1', ceiling: '8 м', parking: 'Для фур', entrance: 'Ворота', power: '380 В', condition: 'Цех', features: ['Кран-балка', 'Подъезд фур'], suitable: ['Производство', 'Цех', 'Склад'], nearby: 'Промзона, удобный въезд' },
                'общепит': { floor: '1 из 1', ceiling: '3.3 м', parking: 'Гостевая', entrance: 'С улицы', power: '25 кВт', condition: 'С вытяжкой', features: ['Вытяжка', 'Посадка', 'Мокрые точки'], suitable: ['Кафе', 'Кофейня', 'Столовая'], nearby: 'Жилой массив, остановка' },
                'гостиница': { floor: '3 этажа', ceiling: '2.8 м', parking: 'Своя', entrance: 'Ресепшен', power: '50 кВт', condition: 'Действующий бизнес', features: ['Номера', 'Парковка', 'Ресепшен'], suitable: ['Гостиница', 'Хостел', 'Апартаменты'], nearby: 'Центр города, парковка' },
                'автосервис': { floor: '1', ceiling: '4.5 м', parking: 'Перед боксами', entrance: 'Ворота', power: '380 В', condition: 'Готовый', features: ['Ямы', 'Компрессор', 'Приёмка'], suitable: ['СТО', 'Шиномонтаж', 'Детейлинг'], nearby: 'Трасса, удобный съезд' },
                'здание целиком': { floor: '3 этажа', ceiling: '3.3 м', parking: 'Двор', entrance: 'Отдельное здание', power: '100 кВт', condition: 'Готово к работе', features: ['Лифт', '3 этажа', 'Отдельно стоящее'], suitable: ['Бизнес-центр', 'Медцентр', 'Офисы'], nearby: 'Центр, двор, парковка' },
                'свободного назначения': { floor: '1 из 4', ceiling: '3.2 м', parking: 'Есть', entrance: 'С улицы', power: '18 кВт', condition: 'Открытая планировка', features: ['Отдельный вход', 'Витрины'], suitable: ['Офис', 'Студия', 'Шоурум'], nearby: 'Новый город, вход с улицы' }
            };
            const deal = isRent
                ? { vat: 'НДС не облагается', deposit: '1 месяц', utilities: 'Коммуналка отдельно', term: 'От 11 месяцев', sublease: 'По согласованию', fee: 'Без комиссии' }
                : { vat: 'НДС не облагается', deposit: '—', utilities: 'По счётчикам', term: 'Прямая продажа', sublease: '—', fee: 'Без комиссии', burden: 'Без обременений' };
            const base = Object.assign({ owner: commIsOwner(prod), suitable: [], nearby: '', features: [] }, by[t] || { floor: '—', ceiling: '—', parking: '—', entrance: '—', power: '—', condition: '—' }, deal);
            const info = Object.assign(base, (prod && prod.reComm) || {});
            info.ceilingM = parseFloat(String(info.ceiling || '').replace(',', '.')) || 0;
            info.power380 = /380/.test(String(info.power || ''));
            info.firstLine = t === 'торговая площадь' || t === 'общепит' || (info.features || []).indexOf('Первая линия') !== -1 || /с улицы/i.test(String(info.entrance || ''));
            info.floor1 = /^1\b/.test(String(info.floor || ''));
            info.biz = t === 'гостиница' || t === 'общепит' || t === 'автосервис' || /бизнес/i.test(String(info.condition || ''));
            info.opex = info.opex || ({ 'офис': 280, 'торговая площадь': 420, 'склад': 160, 'производство': 140, 'общепит': 380, 'гостиница': 220, 'автосервис': 190, 'здание целиком': 250, 'свободного назначения': 300, 'кладовая': 80 }[t] || 200);
            info.plan = info.plan || commPlanImage(prod && prod.title);
            info.ownership = info.ownership || (prod && prod.id === 're-16' ? 'По договору аренды' : 'Собственность');
            info.legal = prod && prod.id === 're-16' ? false : info.legal !== false;
            if (!info.burden) info.burden = (prod && prod.id === 're-15') ? 'Залог в банке' : (isRent ? '—' : 'Нет');
            return info;
        }
        function commPlanImage(title) {
            const label = String(title || 'Планировка').replace(/[<>&]/g, '');
            const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 300"><rect width="420" height="300" fill="#eef4f8"/><rect x="22" y="18" width="376" height="248" fill="#fff" stroke="#1e6091" stroke-width="3"/><line x1="170" y1="18" x2="170" y2="266" stroke="#1e6091" stroke-width="2"/><line x1="22" y1="150" x2="170" y2="150" stroke="#93c5d8" stroke-width="2"/><rect x="196" y="40" width="172" height="100" fill="#dbeafe" stroke="#1e6091"/><rect x="196" y="158" width="80" height="88" fill="#f8fafc" stroke="#94a3b8"/><text x="30" y="290" font-size="13" fill="#1e6091" font-family="Arial">' + label + '</text></svg>';
            return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
        }
        function commPhone(id) {
            const n = parseInt(String(id).replace(/\D/g, '') || '4', 10);
            const a = String(10 + (n % 89)).padStart(2, '0');
            const b = String(10 + ((n * 7) % 89)).padStart(2, '0');
            return '+7 904 555-' + a + '-' + b;
        }
        function commPostedDays(id) {
            if (window.commActual && window.commActual[id]) return 0;
            let h = 0;
            String(id || '').split('').forEach(function (c) { h += c.charCodeAt(0); });
            return h % 11;
        }
        function commPostedLabel(id) {
            const d = commPostedDays(id);
            if (d === 0) return 'Сегодня';
            if (d === 1) return 'Вчера';
            const m = d % 10;
            if (d > 10 && d < 20) return d + ' дней назад';
            if (m === 1) return d + ' день назад';
            if (m > 1 && m < 5) return d + ' дня назад';
            return d + ' дней назад';
        }
        function commMapPos(prod) {
            const loc = String((prod && prod.reLocation) || '').toLowerCase();
            let x = 50, y = 48;
            if (loc.indexOf('ленин') !== -1 || loc.indexOf('центр') !== -1) { x = 46; y = 36; }
            else if (loc.indexOf('новый') !== -1) { x = 70; y = 30; }
            else if (loc.indexOf('пром') !== -1 || loc.indexOf('южн') !== -1) { x = 26; y = 72; }
            else if (loc.indexOf('трасс') !== -1 || loc.indexOf('ростов') !== -1) { x = 16; y = 58; }
            else if (loc.indexOf('восток') !== -1 || loc.indexOf('тц') !== -1) { x = 54; y = 44; }
            else if (loc.indexOf('морск') !== -1) { x = 74; y = 60; }
            else if (loc.indexOf('в-9') !== -1 || loc.indexOf('строител') !== -1) { x = 64; y = 40; }
            const j = (String(prod.id || 'a').charCodeAt(prod.id.length - 1) % 7) - 3;
            return { x: Math.max(10, Math.min(90, x + j)), y: Math.max(14, Math.min(86, y + (j % 4))) };
        }
        function commIsOwner(prod) {
            if (!prod) return false;
            if (prod.reOwner === true || (prod.reComm && prod.reComm.owner === true)) return true;
            if (prod.reOwner === false) return false;
            return ['re-4', 're-10', 're-12', 're-16', 're-18', 're-19'].indexOf(prod.id) !== -1;
        }

        function applyPmCommercialLayout(prod) {
            const isComm = pmIsCommercial(prod);
            const aboutBtn = document.getElementById('pm-about-toggle');
            const aboutPanel = document.getElementById('pm-about-panel');
            const sellerWrap = document.getElementById('pm-seller-wrap');
            const commBox = document.getElementById('pm-comm');
            const cartBtn = document.getElementById('pm-cart-btn');
            const viewBtn = document.getElementById('pm-comm-view-btn');
            const callBtn = document.getElementById('pm-comm-call-btn');
            const mgrBtn = document.getElementById('pm-manager-btn');
            const mgrLabel = document.getElementById('pm-manager-label');
            const similarTitle = document.getElementById('pm-similar-title');
            const shareBtn = document.getElementById('pm-comm-share-btn');
            const tabs = document.getElementById('pm-comm-tabs');
            if (aboutBtn) aboutBtn.classList.toggle('hidden', isComm || pmIsGoods(prod));
            if (aboutPanel) aboutPanel.classList.toggle('hidden', isComm || pmIsGoods(prod));
            if (sellerWrap) sellerWrap.classList.toggle('hidden', isComm);
            if (cartBtn) cartBtn.classList.toggle('hidden', isComm);
            if (viewBtn) viewBtn.classList.toggle('hidden', !isComm);
            if (callBtn) callBtn.classList.toggle('hidden', !isComm);
            if (mgrBtn) mgrBtn.classList.toggle('hidden', isComm);
            if (shareBtn) shareBtn.classList.remove('hidden');
            if (tabs) tabs.classList.toggle('hidden', !isComm);
            if (mgrLabel) mgrLabel.textContent = isComm ? 'Написать' : 'Менеджеру';
            if (similarTitle) similarTitle.textContent = isComm ? 'Похожие помещения' : 'Похожие товары';
            pmSetGoodsVisible(!isComm && pmIsGoods(prod));
            if (!commBox) return;
            if (!isComm) {
                commBox.classList.add('hidden');
                commBox.innerHTML = '';
                window.pmPlanImage = '';
                const thumbs = document.getElementById('pm-thumbs');
                if (thumbs && window.pmImages) thumbs.classList.toggle('hidden', window.pmImages.length < 2);
                return;
            }
            const info = commListingProfile(prod);
            const isRent = prod.reDeal === 'арендовать';
            const priceNum = typeof commParsePrice === 'function' ? commParsePrice(prod) : (parseInt(String(prod.price || '0').replace(/\D/g, ''), 10) || 0);
            const area = parseInt(prod.reArea || '0', 10) || 0;
            const perM = area ? Math.round(priceNum / area) : 0;
            const fmt = typeof commFmtNum === 'function' ? commFmtNum : function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
            const typeLabel = typeof commTypeLabel === 'function' ? commTypeLabel(prod.reType) : (prod.reType || 'Объект');
            const loc = prod.reLocation || 'Волгодонск';
            const yearNote = isRent && priceNum ? ('<p class="text-[12px] text-slate-400 mt-1">' + fmt(priceNum * 12) + ' ₽ в год · ' + fmt(perM) + ' ₽/м² в месяц</p>') : (perM ? '<p class="text-[12px] text-slate-400 mt-1">' + fmt(perM) + ' ₽/м²</p>' : '');
            document.getElementById('pm-price').innerHTML =
                '<div class="flex items-end gap-2 flex-wrap"><span class="oz-price-main">' + pmEsc(prod.price || '') + '</span>' +
                (isRent ? '<span class="text-[13px] font-semibold text-slate-400 mb-0.5">/ мес</span>' : '') + '</div>' + yearNote;
            const badgeEl = document.getElementById('pm-badge');
            if (badgeEl) {
                const bizPill = info.biz ? '<span class="inline-flex bg-[#16324a] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Готовый бизнес</span>' : '<span class="inline-flex bg-white/90 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-full">Помещение</span>';
                badgeEl.innerHTML = '<div class="flex gap-1 flex-wrap"><span class="inline-flex bg-[#1e6091] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">' + (isRent ? 'Аренда' : 'Продажа') + '</span>' + bizPill + '</div>';
            }
            window.pmPlanImage = info.plan;
            window.commMediaTab = 'photo';
            setCommMediaTab('photo');
            const inCmp = (window.commCompare || []).indexOf(prod.id) !== -1;
            const feats = (info.features || []).map(function (f) { return '<span class="comm-feat">' + pmEsc(f) + '</span>'; }).join('');
            const suited = (info.suitable || []).map(function (f) { return '<span class="comm-feat">' + pmEsc(f) + '</span>'; }).join('');
            const descHtml = String(prod.description || '')
                .split(/\n\n+/)
                .filter(Boolean)
                .map(function (p) { return '<p>' + pmEsc(p) + '</p>'; })
                .join('') || '<p>Описание уточняйте при просмотре.</p>';
            const opexLabel = '+' + fmt(info.opex) + ' ₽/м²';
            const dealRows = isRent
                ? [['НДС', info.vat], ['Залог', info.deposit], ['Коммуналка', info.utilities], ['Эксплуатация', opexLabel], ['Срок', info.term]]
                : [['НДС', info.vat], ['Обременения', info.burden || 'Без обременений'], ['Комиссия', info.fee], ['Эксплуатация', opexLabel], ['Сделка', info.term]];
            const dealHtml = dealRows.map(function (row) {
                return '<div class="comm-param"><span>' + pmEsc(row[0]) + '</span><b>' + pmEsc(row[1] || '—') + '</b></div>';
            }).join('');
            commBox.classList.remove('hidden');
            commBox.innerHTML =
                '<div class="comm-stats">' +
                    '<div class="comm-stat"><b>' + (area ? area + ' м²' : '—') + '</b><span>Площадь</span></div>' +
                    '<div class="comm-stat"><b>' + pmEsc(info.floor) + '</b><span>Этаж</span></div>' +
                    '<div class="comm-stat"><b>' + pmEsc(info.ceiling) + '</b><span>Потолки</span></div>' +
                '</div>' +
                (suited ? '<div><p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Подходит для</p><div class="flex flex-wrap gap-1.5">' + suited + '</div></div>' : '') +
                '<div class="comm-deal-card"><p class="lbl">Условия сделки</p>' + dealHtml +
                    (isRent ? '<div class="comm-param" style="border-bottom:0"><span>Субаренда</span><b>' + pmEsc(info.sublease || '—') + '</b></div>' : '') +
                '</div>' +
                '<div>' +
                    '<button type="button" id="pm-comm-params-toggle" onclick="toggleCommParams()" class="pm-about-link" aria-expanded="false">' +
                        'Параметры' +
                        '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>' +
                    '</button>' +
                    '<div id="pm-comm-params-panel" class="pm-about-panel">' +
                        '<div class="pm-about-panel-inner">' +
                            '<div class="pt-1">' +
                                '<div class="comm-param"><span>Тип</span><b>' + pmEsc(typeLabel) + '</b></div>' +
                                '<div class="comm-param"><span>Состояние</span><b>' + pmEsc(info.condition) + '</b></div>' +
                                '<div class="comm-param"><span>Вход</span><b>' + pmEsc(info.entrance) + '</b></div>' +
                                '<div class="comm-param"><span>Парковка</span><b>' + pmEsc(info.parking) + '</b></div>' +
                                '<div class="comm-param"><span>Электричество</span><b>' + pmEsc(info.power) + '</b></div>' +
                                (feats ? '<div class="flex flex-wrap gap-1.5 pt-3">' + feats + '</div>' : '') +
                                '<div class="comm-desc pt-4">' +
                                    '<p class="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2" style="color:#94a3b8;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Описание</p>' +
                                    descHtml +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<button type="button" onclick="openCommListingMap()" class="w-full text-left">' +
                    '<div class="comm-map mb-2.5"><div class="comm-map-pin"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg></div></div>' +
                    '<p class="text-[14px] font-bold text-slate-900">' + pmEsc(loc) + '</p>' +
                    (info.nearby ? '<p class="text-[12px] text-slate-500 mt-0.5">' + pmEsc(info.nearby) + '</p>' : '') +
                    '<p class="text-[12px] text-[#1e6091] font-semibold mt-0.5">Открыть на карте ›</p>' +
                '</button>' +
                '<div class="comm-deal-card"><p class="lbl">Документы</p>' +
                    '<div class="comm-param"><span>Право</span><b>' + pmEsc(info.ownership) + '</b></div>' +
                    '<div class="comm-param"><span>Обременения</span><b>' + pmEsc(info.burden || 'Нет') + '</b></div>' +
                    '<div class="comm-param"><span>Юрлицу</span><b>' + (info.legal ? 'Можно' : 'Нет') + '</b></div>' +
                '</div>' +
                '<div class="flex items-center justify-between gap-2">' +
                    '<p class="text-[12px] text-slate-400">Размещено: ' + commPostedLabel(prod.id) + '</p>' +
                    '<button type="button" onclick="markCommActual(\'' + prod.id + '\')" class="text-[12px] font-bold text-[#1e6091]">Ещё актуально</button>' +
                '</div>' +
                '<button type="button" onclick="toggleCommCompare(\'' + prod.id + '\')" class="w-full bg-white border border-slate-200 text-slate-800 font-bold py-3 rounded-2xl text-[13px]">' + (inCmp ? 'Убрать из сравнения' : 'Добавить к сравнению') + '</button>';
            setCommParamsOpen(false);
        }

        function openCommListingMap() {
            const prod = productsDb[window.currentProductId];
            const loc = (prod && prod.reLocation) || 'Волгодонск';
            window.open('https://yandex.ru/maps/?text=' + encodeURIComponent(loc), '_blank');
        }
        function setCommParamsOpen(open) {
            const panel = document.getElementById('pm-comm-params-panel');
            const btn = document.getElementById('pm-comm-params-toggle');
            if (panel) panel.classList.toggle('open', !!open);
            if (btn) {
                btn.classList.toggle('open', !!open);
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            }
        }
        function toggleCommParams() {
            const panel = document.getElementById('pm-comm-params-panel');
            setCommParamsOpen(!(panel && panel.classList.contains('open')));
        }
        function setCommMediaTab(tab) {
            window.commMediaTab = tab || 'photo';
            const photoBtn = document.getElementById('pm-comm-tab-photo');
            const planBtn = document.getElementById('pm-comm-tab-plan');
            const thumbs = document.getElementById('pm-thumbs');
            const img = document.getElementById('pm-main-image');
            const count = document.getElementById('pm-photo-count');
            if (photoBtn) photoBtn.className = 'comm-chip' + (window.commMediaTab === 'photo' ? ' on' : '');
            if (planBtn) planBtn.className = 'comm-chip' + (window.commMediaTab === 'plan' ? ' on' : '');
            if (window.commMediaTab === 'plan' && window.pmPlanImage) {
                if (img) img.src = window.pmPlanImage;
                if (thumbs) thumbs.classList.add('hidden');
                if (count) { count.classList.remove('hidden'); count.textContent = 'План'; }
                ['pm-prev', 'pm-next', 'pm-dots'].forEach(function (id) {
                    const el = document.getElementById(id);
                    if (el) el.classList.add('hidden');
                });
                return;
            }
            if (thumbs) thumbs.classList.toggle('hidden', !(window.pmImages && window.pmImages.length > 1));
            if (img && window.pmImages && window.pmImages.length) img.src = window.pmImages[window.pmIndex || 0];
            if (typeof pmPaintGalleryChrome === 'function') pmPaintGalleryChrome();
        }
        function callCommListing() {
            const prod = productsDb[window.currentProductId];
            if (!prod) return;
            window.location.href = 'tel:' + commPhone(prod.id).replace(/\s/g, '');
        }
        function shareCommListing() {
            const prod = productsDb[window.currentProductId];
            if (!prod) return;
            const text = prod.title + ' — ' + prod.price + '\n' + (prod.reLocation || '');
            if (navigator.share) {
                navigator.share({ title: prod.title, text: text }).catch(function () {});
                return;
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(function () { showSmsToast('Объявление скопировано'); }).catch(function () { showSmsToast(text); });
            } else showSmsToast(text);
        }
        function markCommActual(id) {
            window.commActual = window.commActual || {};
            window.commActual[id] = true;
            showSmsToast('Отмечено: ещё актуально');
            if (productsDb[id]) applyPmCommercialLayout(productsDb[id]);
        }
        window.commCompare = window.commCompare || [];
        function toggleCommCompare(id) {
            window.commCompare = window.commCompare || [];
            const i = window.commCompare.indexOf(id);
            if (i >= 0) window.commCompare.splice(i, 1);
            else {
                if (window.commCompare.length >= 3) return showSmsToast('Можно сравнить до 3 объектов');
                window.commCompare.push(id);
            }
            if (typeof renderCommListings === 'function') renderCommListings();
            if (productsDb[window.currentProductId]) applyPmCommercialLayout(productsDb[window.currentProductId]);
        }
        function openCommCompare() {
            const ids = window.commCompare || [];
            const box = document.getElementById('comm-compare-body');
            if (!box) return;
            if (ids.length < 2) return showSmsToast('Добавьте ещё объект');
            const rows = [['Объект'], ['Цена'], ['₽/м²'], ['Площадь'], ['Этаж'], ['Потолки'], ['380 В'], ['НДС'], ['Эксплуатация']];
            ids.forEach(function (id) {
                const p = productsDb[id];
                const info = commListingProfile(p);
                const area = parseInt(p.reArea || '0', 10) || 0;
                const per = area ? Math.round(commParsePrice(p) / area) : 0;
                rows[0].push('<button type="button" class="text-[#1e6091] font-bold text-left" onclick="closeCommCompare(); openProductModal(\'' + id + '\')">' + pmEsc(p.title) + '</button>');
                rows[1].push(pmEsc(p.price));
                rows[2].push(commFmtNum(per) + ' ₽');
                rows[3].push(area ? area + ' м²' : '—');
                rows[4].push(pmEsc(info.floor));
                rows[5].push(pmEsc(info.ceiling));
                rows[6].push(info.power380 ? 'Да' : 'Нет');
                rows[7].push(pmEsc(info.vat));
                rows[8].push('+' + commFmtNum(info.opex) + ' ₽/м²');
            });
            box.innerHTML = '<div class="overflow-x-auto"><table class="w-full text-[12px]">' + rows.map(function (r, idx) {
                return '<tr class="' + (idx === 0 ? '' : 'border-t border-slate-100') + '">' + r.map(function (c, ci) {
                    return '<td class="py-2.5 pr-3 align-top ' + (ci === 0 ? 'text-slate-400 font-semibold whitespace-nowrap' : 'font-bold text-slate-800') + '">' + c + '</td>';
                }).join('') + '</tr>';
            }).join('') + '</table></div>';
            commSheetShow('comm-compare-sheet', true);
        }
        function closeCommCompare() { commSheetShow('comm-compare-sheet', false); }
        function clearCommCompare() {
            window.commCompare = [];
            closeCommCompare();
            if (typeof renderCommListings === 'function') renderCommListings();
        }
        function copyCommListingId() {
            const id = window.currentProductId;
            if (!id) return;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(id).then(function () { showSmsToast('Номер скопирован'); }).catch(function () { showSmsToast(id); });
            } else showSmsToast(id);
        }

        let commViewDay = 'Сегодня';
        let commViewTime = '12:00';
        function commSheetToggle(id, on) {
            const e = document.getElementById(id);
            if (!e) return;
            e.classList.toggle('hidden', !on);
            e.classList.toggle('flex', !!on);
        }
        function openCommViewSheet() {
            const prod = productsDb[window.currentProductId];
            const obj = document.getElementById('comm-view-obj');
            if (obj) obj.textContent = prod ? prod.title : 'Объект';
            const days = ['Сегодня', 'Завтра', 'Сб', 'Вс'];
            const times = ['10:00', '12:00', '15:00', '18:00'];
            if (!days.includes(commViewDay)) commViewDay = 'Сегодня';
            if (!times.includes(commViewTime)) commViewTime = '12:00';
            const daysBox = document.getElementById('comm-view-days');
            const timesBox = document.getElementById('comm-view-times');
            if (daysBox) daysBox.innerHTML = days.map(function (d) {
                return '<button type="button" class="comm-slot' + (commViewDay === d ? ' on' : '') + '" onclick="setCommViewDay(\'' + d + '\')">' + d + '</button>';
            }).join('');
            if (timesBox) timesBox.innerHTML = times.map(function (t) {
                return '<button type="button" class="comm-slot' + (commViewTime === t ? ' on' : '') + '" onclick="setCommViewTime(\'' + t + '\')">' + t + '</button>';
            }).join('');
            commSheetToggle('comm-view-sheet', true);
        }
        function closeCommViewSheet() { commSheetToggle('comm-view-sheet', false); }
        function setCommViewDay(d) { commViewDay = d; openCommViewSheet(); }
        function setCommViewTime(t) { commViewTime = t; openCommViewSheet(); }
        function confirmCommViewing() {
            closeCommViewSheet();
            showSmsToast('Просмотр: ' + commViewDay + ', ' + commViewTime);
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

       function switchTab(id) {
    // 1. Прячем все главные вкладки приложения
    ['catalog','directory','cart','favorites','profile'].forEach(t => { 
        const v = document.getElementById(`view-${t}`);
        if (v) v.classList.add('hidden');
        
        const btn = document.getElementById(`tab-${t==='catalog'?'home':t}`);
        if (btn) {
            btn.className = (t === 'cart')
                ? 'relative flex flex-col items-center justify-center flex-1 py-1 text-slate-400'
                : 'flex flex-col items-center justify-center flex-1 py-1 text-slate-400';
        }
    });
    
    // 2. Прячем ВСЕ подуровни справочника
    const subviews = [
        'product_categories', 'shops', 'specialists', 'spec-private', 'spec-companies', 'spectech', 'landscaping', 'other', 'other-profiles', 'designers', 
        'companies', 'jobs', 'calculator', 'specific-calc', 
        'realestate', 're-agencies', 're-commercial', 're-catalog', 'building_materials', 
        'finishing_materials', 'furniture', 'plumbing', 
        'accessories', 'landscape', 'tools', 'lifehacks', 'lifehack-article'
    ];
    subviews.forEach(sv => {
        const el = document.getElementById(`subview-${sv}`);
        if (el) el.classList.add('hidden');
    });
    if (typeof closeCommSheets === 'function') closeCommSheets();
    if (typeof closeSpectechModal === 'function') closeSpectechModal();
    if (typeof closeLandscapeStudio === 'function') closeLandscapeStudio();

    // 3. Прячем экран товаров категории
    const catProdView = document.getElementById('view-category-products');
    if (catProdView) catProdView.classList.add('hidden');
    window.currentOpenedCategory = null;

    // 4. Показываем нужную главную вкладку
    const view = document.getElementById(`view-${id}`);
    if (view) view.classList.remove('hidden');

    // ★ КРИТИЧЕСКИ ВАЖНО: Если открываем вкладку каталога/справочника, принудительно показываем его корень
    if (id === 'directory') {
        const dirView = document.getElementById('view-directory');
        if (dirView) dirView.classList.remove('hidden');
        if (typeof renderDirectorySubviews === 'function') {
            renderDirectorySubviews();
        }
    }
    
    // Подсветка активной кнопки в нижнем меню
    const activeBtn = document.getElementById(`tab-${id==='catalog'?'home':id}`);
    if (activeBtn) {
        activeBtn.className = (id === 'cart')
            ? 'relative flex flex-col items-center justify-center flex-1 py-1 text-blue-600'
            : 'flex flex-col items-center justify-center flex-1 py-1 text-blue-600';
    }

    const scroll = document.getElementById('main-scroll-container');
    if (scroll) scroll.scrollTop = 0;

    if (id === 'catalog' && typeof renderHomeShopPromo === 'function') renderHomeShopPromo();
    if (id === 'favorites') renderFavorites();
    if (id === 'cart') { renderCart(); renderBuyerOrders(); }
}
     function switchDirectoryView(id) { 
    // Прячем главный экран справочника
    const dirView = document.getElementById('view-directory');
    if (dirView) dirView.classList.add('hidden'); 
    
    // Скрываем абсолютно все подразделы справочника
    const subviews = [
        'product_categories', 'shops', 'specialists', 'spec-private', 'spec-companies', 'spectech', 'landscaping', 'other', 'other-profiles', 'designers', 
        'companies', 'jobs', 'calculator', 'specific-calc', 
        'realestate', 're-agencies', 're-commercial', 're-catalog', 'building_materials', 
        'finishing_materials', 'furniture', 'plumbing', 
        'accessories', 'landscape', 'tools', 'lifehacks', 'lifehack-article'
    ];
    
    subviews.forEach(sub => {
        const el = document.getElementById(`subview-${sub}`);
        if (el) el.classList.add('hidden');
    });

    // Показываем запрашиваемый подраздел
    const target = document.getElementById(`subview-${id}`);
    if (target) {
        target.classList.remove('hidden');
    }

    // Генерируем списки (чтобы они не были пустыми)
    if (typeof renderDirectorySubviews === 'function') {
        renderDirectorySubviews();
    }
    if (id === 'lifehacks' && typeof renderLifehacksFeed === 'function') {
        renderLifehacksFeed();
    }
    if (id === 'spectech' && typeof renderSpectech === 'function') {
        renderSpectech();
    }
    if (id === 'other-profiles' && typeof renderOtherProfiles === 'function') {
        renderOtherProfiles();
    }
    if (id === 'landscaping' && typeof renderLandscapingList === 'function') {
        renderLandscapingList();
    }
    if (id === 're-commercial' && typeof renderCommListings === 'function') {
        if (typeof closeCommSheets === 'function') closeCommSheets();
        renderCommListings();
        renderCommTypeOptions();
        syncCommChips();
    } else if (typeof closeCommSheets === 'function') {
        closeCommSheets();
    }
    
    // Возвращаем скролл наверх
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) scrollContainer.scrollTop = 0; 
}

       function backToDirectory() { 
    ['product_categories', 'shops', 'specialists', 'spec-private', 'spec-companies', 'spectech', 'landscaping', 'other', 'other-profiles', 'designers', 'companies', 'jobs', 'calculator', 'specific-calc', 'realestate', 're-agencies', 're-commercial', 're-catalog', 'building_materials', 'finishing_materials', 'furniture', 'plumbing', 'accessories', 'landscape', 'tools', 'lifehacks', 'lifehack-article'].forEach(sv => {
        const el = document.getElementById(`subview-${sv}`);
        if (el) el.classList.add('hidden');
    }); 
    const dirView = document.getElementById('view-directory');
    if (dirView) dirView.classList.remove('hidden');
    if (typeof renderLifehacksHome === 'function') renderLifehacksHome();
    if (typeof closeSpectechModal === 'function') closeSpectechModal();
    if (typeof closeLandscapeStudio === 'function') closeLandscapeStudio();
}
        
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
        function showSmsToast(msg) { document.getElementById('sms-toast-msg').innerText = msg; const t = document.getElementById('sms-toast'); t.classList.remove('translate-y-20','opacity-0'); setTimeout(()=>t.classList.add('translate-y-20','opacity-0'), 3000); }

                        function switchAdminTab(id) { 
            ['moderation','crm','home'].forEach(t=>{ document.getElementById(`adm-view-${t}`).classList.add('hidden'); document.getElementById(`adm-tab-btn-${t}`).className='py-1 px-3 text-xs font-bold text-slate-400 whitespace-nowrap'; }); 
            document.getElementById(`adm-view-${id}`).classList.remove('hidden'); document.getElementById(`adm-tab-btn-${id}`).className='py-1 px-3 text-xs font-bold border-b-2 border-amber-500 text-amber-600 whitespace-nowrap'; 
            if (id === 'crm') { renderCrmProductList(); switchCrmType(); }
            if (id === 'home') { renderCrmPromoList(); renderCrmStoryList(); renderCrmOnbList(); }
        }

                // ========== КАБИНЕТ МАГАЗИНА ==========

        // Главная функция: заполняет весь кабинет данными магазина
        function renderShopDashboard() {
            const shopName = state.currentShop;
            const shop = shopsProfileDb[shopName];
            if (!shop) return;

            // Шапка
            document.getElementById('shop-dash-name').innerText = shopName;

            // Заполняем форму витрины
            document.getElementById('shop-my-name').value = shop.name || '';
            document.getElementById('shop-my-desc').value = shop.description || '';
            document.getElementById('shop-my-addr').value = shop.address || '';
            document.getElementById('shop-my-site').value = shop.site || '';
            document.getElementById('shop-my-tg').value = shop.telegram || '';
            document.getElementById('shop-my-banner').value = shop.banner || '';
            document.getElementById('shop-my-banner-preview').src = shop.banner || '';
            document.getElementById('shop-my-logo').value = shop.logo || '';
            document.getElementById('shop-my-logo-preview').src = shop.logo || '';

            updateShopStats();
            renderShopMyProducts();
        }

        // Обновление мини-статистики
        function updateShopStats() {
            const shopName = state.currentShop;
            let published = 0, pending = 0;
            Object.values(productsDb).forEach(p => {
                if (p.store !== shopName) return;
                if (p.status === 'published') published++;
                else if (p.status === 'pending') pending++;
            });
            const set = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
            set('shop-stat-published', published);
            set('shop-stat-pending', pending);
            const storiesCount = storiesData.filter(s => s.owner === shopName).length;
            set('shop-stat-stories', storiesCount);
            expireExpiredStoreOrders();
            const orderCount = (marketplace && marketplace.storeOrders || []).filter(o => o.storeId === shopName && o.status === 'pending_review').length;
            set('shop-stat-orders', orderCount);
        }

        // Переключение вкладок внутри кабинета магазина
        function switchShopTab(id) {
            ['showcase', 'products', 'stories', 'orders'].forEach(t => {
                const view = document.getElementById('shop-view-' + t);
                const btn = document.getElementById('shop-tab-btn-' + t);
                if (view) view.classList.add('hidden');
                if (btn) btn.className = 'py-1 px-3 text-xs font-bold text-slate-400 whitespace-nowrap';
            });
            const view = document.getElementById('shop-view-' + id);
            const btn = document.getElementById('shop-tab-btn-' + id);
            if (view) view.classList.remove('hidden');
            if (btn) btn.className = 'py-1 px-3 text-xs font-bold border-b-2 border-[#1e6091] text-[#1e6091] whitespace-nowrap';
            if (id === 'products') renderShopMyProducts();
            if (id === 'stories') renderShopMyStories();
            if (id === 'orders') renderShopOrders();
        }

        // Сохранение витрины (уходит на МОДЕРАЦИЮ)
        function shopSaveShowcase() {
            const oldName = state.currentShop;
            const shop = shopsProfileDb[oldName];
            if (!shop) return;

            const newName = document.getElementById('shop-my-name').value.trim();
            if (!newName) return showSmsToast("Введите название магазина!");

            // Собираем предложенные изменения (пока НЕ применяем к самому магазину)
            const proposed = {
                name: newName,
                description: document.getElementById('shop-my-desc').value.trim(),
                address: document.getElementById('shop-my-addr').value.trim(),
                site: document.getElementById('shop-my-site').value.trim() || '#',
                telegram: document.getElementById('shop-my-tg').value.trim() || '#',
                banner: document.getElementById('shop-my-banner').value.trim() || shop.banner,
                logo: document.getElementById('shop-my-logo').value.trim() || shop.logo || ''
            };

            // Кладём изменения в очередь модерации витрин
            // Если для этого магазина уже есть заявка — обновляем её
            const existing = showcaseModerationDb.find(x => x.shopName === oldName);
            if (existing) {
                existing.proposed = proposed;
                existing.date = Date.now();
            } else {
                showcaseModerationDb.push({
                    id: 'showcase-' + Date.now(),
                    shopName: oldName,       // текущее имя магазина (владелец заявки)
                    proposed: proposed,      // что предлагается опубликовать
                    status: 'pending',
                    date: Date.now()
                });
            }

            saveAllData();
            updateModCounter();
            showSmsToast("Витрина отправлена на модерацию ");
        }

        // ---------- ТОВАРЫ МАГАЗИНА ----------

        // Список товаров текущего магазина
        function renderShopMyProducts() {
            const shopName = state.currentShop;
            const container = document.getElementById('shop-my-products-list');
            if (!container) return;

            let html = '';
            Object.values(productsDb).forEach(p => {
                if (p.store !== shopName) return;
                const badge = p.status === 'pending'
                    ? '<span class="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">На модерации</span>'
                    : '<span class="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Опубликован</span>';
                html += `
                    <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                        <img src="${p.image}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">
                        <div class="flex-1 min-w-0">
                            <h5 class="font-bold text-xs text-slate-800 truncate">${p.title}</h5>
                            <p class="text-[10px] text-slate-400 truncate">${p.price}</p>
                            ${badge}
                        </div>
                        <div class="flex flex-col gap-1 shrink-0">
                            <button onclick="openShopProductEditor('${p.id}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                            <button onclick="shopDeleteProduct('${p.id}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                        </div>
                    </div>`;
            });
            container.innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">У вас пока нет товаров</p>`;
        }

        // Открыть форму товара магазина (используем существующее окно product-editor)
       function openShopProductEditor(id) {
    window.shopEditingId = id || '';
    window.editorMode = 'shop';
    const editor = document.getElementById('product-editor');

    // ВАЖНО: переносим форму в body, чтобы она не была скрыта внутри админ-панели
    if (editor.parentElement !== document.body) {
        document.body.appendChild(editor);
    }

    if (id && productsDb[id]) {
        const p = productsDb[id];
        document.getElementById('editor-title').innerText = 'Редактировать товар';
        document.getElementById('editor-prod-id').value = id;
        document.getElementById('editor-prod-title').value = p.title;
        document.getElementById('editor-prod-price').value = p.price;
        document.getElementById('editor-prod-store').value = state.currentShop;
        setCategoryDropdown(p.category || '');
        document.getElementById('editor-prod-image').value = p.image;
    } else {
        document.getElementById('editor-title').innerText = 'Новый товар';
        document.getElementById('editor-prod-id').value = '';
        document.getElementById('editor-prod-title').value = '';
        document.getElementById('editor-prod-price').value = '';
        document.getElementById('editor-prod-store').value = state.currentShop;
        setCategoryDropdown('');
        document.getElementById('editor-prod-image').value = '';
    }
    updateEditorPreview();
    editor.classList.remove('hidden');
    editor.classList.add('flex');
}

        // Удаление товара магазина
        function shopDeleteProduct(id) {
            if (!productsDb[id]) return;
            if (productsDb[id].store !== state.currentShop) return; // защита
            delete productsDb[id];
            showSmsToast("Товар удалён ");
            renderShopMyProducts();
            updateShopStats();
            renderProductGrid();
            renderDirectorySubviews();
            saveAllData();
        }

        
        // ---------- СТОРИС МАГАЗИНА ----------

        // Показать переключение на вкладку "Сторис" -> дорисуем список
        // (дополняем switchShopTab, вызвав рендер)

        // Список сторис текущего магазина
        function renderShopMyStories() {
            const shopName = state.currentShop;
            const container = document.getElementById('shop-my-stories-list');
            if (!container) return;

            let html = '';
            let count = 0;
            storiesData.forEach(s => {
                if (s.owner !== shopName) return; // только свои
                count++;
                const badge = s.status === 'pending'
                    ? '<span class="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">На модерации</span>'
                    : '<span class="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Опубликован</span>';
                html += `
                    <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                        <img src="${s.slides[0]}" class="w-11 h-11 rounded-full object-cover shrink-0 bg-slate-100">
                        <div class="flex-1 min-w-0">
                            <h5 class="font-bold text-xs text-slate-800 truncate">${s.name}</h5>
                            <p class="text-[10px] text-slate-400">${s.slides.length} фото</p>
                            ${badge}
                        </div>
                        <div class="flex flex-col gap-1 shrink-0">
                            <button onclick="openShopStoryEditor('${s.id}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                            <button onclick="shopDeleteStory('${s.id}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                        </div>
                    </div>`;
            });
            container.innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">У вас пока нет сторис</p>`;
        }

        // Открыть форму сторис магазина
        function openShopStoryEditor(id) {
            const e = document.getElementById('shop-story-editor');
            const s = storiesData.find(x => x.id === id);
            if (s && s.owner === state.currentShop) {
                document.getElementById('shop-story-editor-title').innerText = 'Редактировать сторис';
                document.getElementById('shop-story-editor-id').value = s.id;
                document.getElementById('shop-story-editor-name').value = s.name;
                document.getElementById('shop-story-editor-slides').value = s.slides.join('\n');
            } else {
                document.getElementById('shop-story-editor-title').innerText = 'Новый сторис';
                document.getElementById('shop-story-editor-id').value = '';
                document.getElementById('shop-story-editor-name').value = state.currentShop; // подставим имя магазина
                document.getElementById('shop-story-editor-slides').value = '';
            }
            e.classList.remove('hidden'); e.classList.add('flex');
        }

        function closeShopStoryEditor() {
            const e = document.getElementById('shop-story-editor');
            e.classList.add('hidden'); e.classList.remove('flex');
        }

        // Сохранить сторис магазина (уходит на модерацию)
        function saveShopStoryFromEditor() {
            const id = document.getElementById('shop-story-editor-id').value;
            const name = document.getElementById('shop-story-editor-name').value.trim();
            const slidesText = document.getElementById('shop-story-editor-slides').value.trim();
            if (!name || !slidesText) return showSmsToast("Заполните название и фото!");

            const slides = slidesText.split('\n').map(x => x.trim()).filter(x => x);
            if (slides.length === 0) return showSmsToast("Добавьте хотя бы одно фото!");

            const existing = storiesData.find(x => x.id === id);
            if (existing && existing.owner === state.currentShop) {
                existing.name = name;
                existing.slides = slides;
                existing.status = 'pending'; // после правок снова на модерацию
                showSmsToast("Сторис отправлен на модерацию ");
            } else {
                storiesData.push({
                    id: 'story-' + Date.now(),
                    name: name,
                    slides: slides,
                    owner: state.currentShop, // владелец = магазин
                    status: 'pending',        // на модерацию
                    createdAt: Date.now()
                });
                showSmsToast("Сторис отправлен на модерацию ");
            }

            closeShopStoryEditor();
            renderShopMyStories();
            updateShopStats();
            renderStories();
            saveAllData();
        }

        // Удаление сторис магазина
        function shopDeleteStory(id) {
            const s = storiesData.find(x => x.id === id);
            if (!s || s.owner !== state.currentShop) return; // защита
            storiesData = storiesData.filter(x => x.id !== id);
            showSmsToast("Сторис удалён ");
            renderShopMyStories();
            updateShopStats();
            renderStories();
            saveAllData();
        }

        // Подача заявок
        function shopSaveProduct() {
            const title = document.getElementById('new-prod-title').value.trim(); const price = document.getElementById('new-prod-price').value.trim();
            if(!title || !price) return showSmsToast("Заполните Название и Цену!");
            const id = 'prod-' + Date.now();
            productsDb[id] = { id: id, title: title, price: price + ' ₽', sku: 'NEW', store: 'Любимый Дом', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', status: 'pending', category: 'мебель' };
            showSmsToast("Товар отправлен на модерацию!"); document.getElementById('new-prod-title').value = ''; document.getElementById('new-prod-price').value = '';
        }
        function userSubmitApplication() {
            const type = document.getElementById('user-submit-type').value; const title = document.getElementById('user-submit-title').value.trim();
            if(!title) return showSmsToast("Заполните Название!");
            const id = 'req-' + Date.now();
            if(type === 'specialists') directoryDb.specialists.push({ id: id, name: title, title: 'Анкета', description: 'Ожидает', avatar: title[0], status: 'pending' });
            else vacanciesDb.push({ id: id, title: title, company: 'Моя компания', salary: 'Договорная', status: 'pending' });
            showSmsToast("Заявка успешно отправлена на модерацию!"); document.getElementById('user-submit-title').value = ''; document.getElementById('user-submit-desc').value = '';
        }

        // Админка
                function renderAdminModerationList() {
            const type = document.getElementById('mod-category-filter').value;
            const container = document.getElementById('admin-pending-products-list');
            let html = '', count = 0;

            if (type === 'products') {
                Object.values(productsDb).filter(p => p.status === 'pending').forEach(p => { count++; html += buildModCard('products', p.id, p.title, p.store, p.image); });
            } else if (type === 'showcases') {
                showcaseModerationDb.filter(p => p.status === 'pending').forEach(p => {
                    count++;
                    html += buildShowcaseModCard(p);
                });
            } else if (type === 'directory') {
                directoryDb.specialists.filter(p => p.status === 'pending').forEach(p => { count++; html += buildModCard('directory', p.id, p.name, 'Мастер', p.avatarPhoto); });
            } else if (type === 'vacancies') {
                vacanciesDb.filter(p => p.status === 'pending').forEach(p => { count++; html += buildModCard('vacancies', p.id, p.title, 'Вакансия', p.companyPhoto); });
            } else if (type === 'stories') {
                storiesData.filter(p => p.status === 'pending').forEach(p => { count++; html += buildModCard('stories', p.id, p.name, 'Сторис · ' + (p.owner || ''), p.slides[0]); });
            }

            container.innerHTML = count === 0 ? `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Очередь модерации пуста </p>` : html;
            updateModCounter();
        }

        // === КАРТОЧКА ЗАЯВКИ ВИТРИНЫ (кликабельная) ===
        function buildShowcaseModCard(item) {
            const p = item.proposed;
            const img = p.banner
                ? `<img src="${p.banner}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">`
                : `<div class="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] shrink-0">Фото</div>`;
            return `
                <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2">
                    <div onclick="previewShowcaseModeration('${item.id}')" class="flex items-center gap-2 cursor-pointer active:opacity-70">
                        ${img}
                        <div class="flex-1 min-w-0">
                            <h5 class="font-bold text-xs text-slate-800 truncate">${p.name}</h5>
                            <p class="text-[10px] text-slate-400 truncate">Витрина · ${item.shopName}</p>
                        </div>
                        <span class="text-[10px] text-[#1e6091] font-bold whitespace-nowrap">Открыть</span>
                    </div>
                    <div class="flex gap-1.5">
                        <button onclick="adminApproveShowcase('${item.id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg">Одобрить</button>
                        <button onclick="adminRejectShowcase('${item.id}')" class="flex-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold py-1.5 rounded-lg">Отклонить</button>
                    </div>
                </div>`;
        }

        // === ПРЕДПРОСМОТР ВИТРИНЫ (открываем витрину как её увидят покупатели) ===
        function previewShowcaseModeration(id) {
            const item = showcaseModerationDb.find(x => x.id === id);
            if (!item) return;
            const p = item.proposed;

            // Временно показываем предлагаемые данные в модальном окне витрины
            document.getElementById('shop-catalog-title').innerText = p.name;
            document.getElementById('shop-catalog-banner').src = p.banner || '';
            document.getElementById('shop-catalog-desc').innerText = p.description || '';
            document.getElementById('shop-catalog-addr').innerText = p.address || '';
            document.getElementById('shop-catalog-site').innerText = (p.site || '#').replace('https://', '');
            document.getElementById('shop-catalog-site').href = p.site || '#';
            document.getElementById('shop-catalog-tg').href = p.telegram || '#';

            // Видео и галерею берём из текущего магазина (они не менялись через эту форму)
            const shop = shopsProfileDb[item.shopName] || {};
            if (shop.video) {
                document.getElementById('shop-catalog-video-container').classList.remove('hidden');
                document.getElementById('shop-catalog-video').src = shop.video;
            } else {
                document.getElementById('shop-catalog-video-container').classList.add('hidden');
            }

            let galHtml = '';
            if (shop.gallery && shop.gallery.length > 0) {
                shop.gallery.forEach(img => { galHtml += `<img src="${img}" onclick="openLightbox('${img}')" class="h-20 w-32 object-cover rounded-xl shrink-0 cursor-pointer snap-center border">`; });
                document.getElementById('shop-catalog-gallery-wrapper').classList.remove('hidden');
                document.getElementById('shop-catalog-gallery').innerHTML = galHtml;
            } else {
                document.getElementById('shop-catalog-gallery-wrapper').classList.add('hidden');
            }

            // Товары магазина
            let prodHtml = '';
            Object.values(productsDb).filter(pr => pr.store === item.shopName && pr.status === 'published').forEach(prod => {
                prodHtml += `<div class="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm"><div class="w-full h-28 bg-slate-50 relative"><img src="${prod.image}" class="w-full h-full object-cover"></div><div class="p-2"><h5 class="font-bold text-[11px] text-slate-800 line-clamp-1">${prod.title}</h5><span class="font-bold text-xs text-slate-900">${prod.price}</span></div></div>`;
            });
            document.getElementById('shop-catalog-grid').innerHTML = prodHtml;

            document.getElementById('shop-catalog-modal').classList.remove('hidden');
        }

        // === ОДОБРИТЬ ВИТРИНУ (применяем изменения к магазину) ===
        function adminApproveShowcase(id) {
            const item = showcaseModerationDb.find(x => x.id === id);
            if (!item) return;
            const p = item.proposed;
            const oldName = item.shopName;
            const shop = shopsProfileDb[oldName];
            if (!shop) {
                // магазин удалён — просто убираем заявку
                showcaseModerationDb = showcaseModerationDb.filter(x => x.id !== id);
                renderAdminModerationList();
                return;
            }

            // Применяем изменения
            shop.description = p.description;
            shop.address = p.address;
            shop.site = p.site;
            shop.telegram = p.telegram;
            shop.banner = p.banner;
            shop.logo = p.logo;

            // Если имя изменилось — переносим запись и товары
            if (p.name && p.name !== oldName) {
                shop.name = p.name;
                shopsProfileDb[p.name] = shop;
                delete shopsProfileDb[oldName];
                Object.values(productsDb).forEach(pr => { if (pr.store === oldName) pr.store = p.name; });
                // если это был текущий магазин в кабинете — обновим
                if (state.currentShop === oldName) state.currentShop = p.name;
            } else {
                shop.name = p.name || shop.name;
            }

            // Убираем заявку из очереди
            showcaseModerationDb = showcaseModerationDb.filter(x => x.id !== id);

            showSmsToast("Витрина одобрена и опубликована ");
            renderAdminModerationList();
            updateModCounter();
            renderDirectorySubviews();
            renderProductGrid();
            saveAllData();
        }

        // === ОТКЛОНИТЬ ВИТРИНУ ===
        function adminRejectShowcase(id) {
            showcaseModerationDb = showcaseModerationDb.filter(x => x.id !== id);
            showSmsToast("Заявка на витрину отклонена ");
            renderAdminModerationList();
            updateModCounter();
            saveAllData();
        }

        // === СТРОИМ КАРТОЧКУ ЗАЯВКИ (с 3 кнопками) ===
        function buildModCard(type, id, title, subtitle, image) {
            const img = image ? `<img src="${image}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">` : `<div class="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">?</div>`;
            return `
                <div class="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2">
                    <div class="flex items-center gap-2">
                        ${img}
                        <div class="flex-1 min-w-0">
                            <h5 class="font-bold text-xs text-slate-800 truncate">${title}</h5>
                            <p class="text-[10px] text-slate-400">${subtitle}</p>
                        </div>
                        <span class="text-[9px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">Ожидает</span>
                    </div>
                    <div class="flex gap-1.5">
                        <button onclick="adminApproveItem('${type}', '${id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 rounded-lg">Одобрить</button>
                        <button onclick="adminRejectItem('${type}', '${id}')" class="flex-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold py-1.5 rounded-lg">Отклонить</button>
                    </div>
                </div>`;
        }

        // === СЧИТАЕМ ВСЕ ЗАЯВКИ И ОБНОВЛЯЕМ КРАСНЫЙ КРУЖОК ===
        function updateModCounter() {
            let total = 0;
            total += Object.values(productsDb).filter(p => p.status === 'pending').length;
            total += directoryDb.specialists.filter(p => p.status === 'pending').length;
            total += vacanciesDb.filter(p => p.status === 'pending').length;
            total += storiesData.filter(p => p.status === 'pending').length;
            total += showcaseModerationDb.filter(p => p.status === 'pending').length;

            const counter = document.getElementById('mod-counter');
            if (!counter) return;
            if (total > 0) {
                counter.innerText = total;
                counter.classList.remove('hidden');
            } else {
                counter.classList.add('hidden');
            }
        }

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

                // Свернуть/развернуть группу товаров в избранном
        function toggleFavGroup(id) {
            const body = document.getElementById(id);
            const arrow = document.getElementById(id + '-arrow');
            if (!body) return;
            body.classList.toggle('hidden');
            if (arrow) arrow.style.transform = body.classList.contains('hidden') ? 'rotate(-90deg)' : 'rotate(0deg)';
        }


        // Добавить/убрать товар из избранного
        function toggleFavorite(prodId) {
            if (!state.favorites) state.favorites = [];
            const idx = state.favorites.indexOf(prodId);
            if (idx === -1) {
                state.favorites.push(prodId);
                showSmsToast("Добавлено в избранное ");
            } else {
                state.favorites.splice(idx, 1);
                showSmsToast("Удалено из избранного");
            }
            saveFavorites();
            renderProductGrid();       // перекрасить сердечки
            renderFavorites();         // обновить список
            updateBuyerFavCount();     // обновить счётчик в карточке
        }

        function saveFavorites() {
            try { localStorage.setItem('meb_favorites', JSON.stringify(state.favorites)); } catch (e) {}
        }

        function loadFavorites() {
            try {
                const saved = localStorage.getItem('meb_favorites');
                if (saved) state.favorites = JSON.parse(saved);
            } catch (e) { state.favorites = []; }
        }

                // ========== МАРКЕТПЛЕЙС: Cart → Checkout → StoreOrder → Invoice → Payment ==========
        let marketplace = { checkouts: [], storeOrders: [], invoices: [], payments: [] };
        const STORE_ORDER_SLA_MS = 2 * 60 * 60 * 1000;

        function formatRub(n) {
            const v = Math.round(Number(n) || 0);
            return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
        }

        function cartUid(prefix) {
            return prefix + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
        }

        function getCartItems() {
            if (!Array.isArray(state.cart)) return [];
            return state.cart.filter(i => i && i.productId);
        }

        function cartHasProduct(prodId) {
            if (!prodId || !Array.isArray(state.cart)) return false;
            return getCartItems().some(i => i.productId === prodId);
        }

        function cartQtyTotal() {
            return getCartItems().reduce((s, i) => s + (i.qty || 1), 0);
        }

        function loadCart() {
            try {
                const saved = localStorage.getItem('meb_cart');
                const parsed = saved ? JSON.parse(saved) : [];
                if (!Array.isArray(parsed)) { state.cart = []; }
                else if (parsed.length && typeof parsed[0] === 'string') {
                    state.cart = parsed.filter(Boolean).map(id => {
                        const p = productsDb[id];
                        if (!p) return null;
                        return { productId: p.id, storeId: p.store, qty: 1, priceSnapshot: parsePrice(p.price), titleSnapshot: p.title, image: p.image };
                    }).filter(Boolean);
                } else {
                    state.cart = parsed.filter(i => i && i.productId);
                }
            } catch (e) { state.cart = []; }
            updateCartBadge();
        }

        function saveCart() {
            try { localStorage.setItem('meb_cart', JSON.stringify(getCartItems())); } catch (e) {}
        }

        function loadMarketplace() {
            try {
                const raw = localStorage.getItem('meb_marketplace');
                if (raw) {
                    const d = JSON.parse(raw);
                    marketplace = {
                        checkouts: Array.isArray(d.checkouts) ? d.checkouts : [],
                        storeOrders: Array.isArray(d.storeOrders) ? d.storeOrders : [],
                        invoices: Array.isArray(d.invoices) ? d.invoices : [],
                        payments: Array.isArray(d.payments) ? d.payments : []
                    };
                }
            } catch (e) {}
        }

        function saveMarketplace() {
            try { localStorage.setItem('meb_marketplace', JSON.stringify(marketplace)); } catch (e) {}
        }

        function soStatusLabel(st) {
            const map = {
                pending_review: 'Ждёт магазин',
                awaiting_buyer: 'Ждёт ваше согласие по цене',
                partial: 'Частично подтверждён',
                confirmed: 'Подтверждён, можно выставить счёт',
                rejected: 'Отклонён',
                expired: 'Магазин не ответил',
                cancelled: 'Отменён',
                invoiced: 'Счёт выставлен',
                awaiting_payment: 'Ожидает оплату',
                paid: 'Оплачен'
            };
            return map[st] || st;
        }

        function expireExpiredStoreOrders() {
            const now = Date.now();
            let changed = false;
            (marketplace.storeOrders || []).forEach(o => {
                if (o.status === 'pending_review' && o.slaDeadline && now > o.slaDeadline) {
                    o.status = 'expired';
                    changed = true;
                }
            });
            if (changed) saveMarketplace();
        }

        function soRecalc(order) {
            const lines = order.lines || [];
            const active = lines.filter(l => l.lineStatus !== 'removed' && l.lineStatus !== 'unavailable');
            if (order.status === 'cancelled' || order.status === 'expired' || order.status === 'paid' || order.status === 'invoiced' || order.status === 'awaiting_payment') return;
            if (lines.every(l => l.lineStatus === 'unavailable' || l.lineStatus === 'removed')) { order.status = 'rejected'; return; }
            if (lines.some(l => l.lineStatus === 'price_changed')) { order.status = 'awaiting_buyer'; return; }
            if (lines.some(l => l.lineStatus === 'pending')) { order.status = 'pending_review'; return; }
            const conf = lines.filter(l => l.lineStatus === 'confirmed');
            const unav = lines.filter(l => l.lineStatus === 'unavailable');
            if (conf.length && unav.length) order.status = 'partial';
            else if (conf.length) order.status = 'confirmed';
        }

        function soConfirmedAmount(order) {
            return (order.lines || []).filter(l => l.lineStatus === 'confirmed').reduce((s, l) => s + (l.proposedPrice || l.quotedPrice) * (l.qty || 1), 0);
        }

        function refreshCartSurfaces() {
            updateCartBadge();
            renderCart();
            renderBuyerOrders();
            renderProductGrid();
            try { if (typeof renderRecommendations === 'function') renderRecommendations(); } catch (e) {}
            try { if (typeof renderCategoryProducts === 'function') renderCategoryProducts(); } catch (e) {}
            try { if (window.currentCatalogShop) renderShopCatalogProducts(window.currentCatalogShop); } catch (e) {}
            try {
                const input = document.getElementById('catalog-search-input');
                if (typeof renderCatalogProducts === 'function') renderCatalogProducts(input ? input.value : '');
            } catch (e) {}
            try { pmRefreshCart(); } catch (e) {}
            try { if (typeof renderPmRecent === 'function') renderPmRecent(); } catch (e) {}
            try { if (state.userRole === 'shop') { updateShopStats(); renderShopOrders(); } } catch (e) {}
        }

        function updateCartBadge() {
            const badge = document.getElementById('cart-badge');
            if (!badge) return;
            const count = cartQtyTotal();
            if (count > 0) { badge.innerText = count; badge.classList.remove('hidden'); }
            else badge.classList.add('hidden');
        }

        function clearCart() {
            state.cart = [];
            saveCart();
            refreshCartSurfaces();
            showSmsToast('Корзина очищена');
        }

        function addToCart(prodId, qty) {
            if (!prodId) return;
            const p = productsDb[prodId];
            if (!p) return showSmsToast('Товар не найден');
            if (!Array.isArray(state.cart) || (state.cart.length && typeof state.cart[0] === 'string')) loadCart();
            const addQty = Math.max(1, parseInt(qty, 10) || 1);
            const items = getCartItems();
            const existing = items.find(i => i.productId === prodId);
            if (existing) existing.qty = (existing.qty || 1) + addQty;
            else items.push({ productId: p.id, storeId: p.store, qty: addQty, priceSnapshot: parsePrice(p.price), titleSnapshot: p.title, image: p.image, variant: (window.currentProductId === prodId && window.pmSelectedColor && window.pmSelectedColor.label) ? window.pmSelectedColor.label : '' });
            state.cart = items;
            saveCart();
            refreshCartSurfaces();
            showSmsToast(existing ? 'Количество увеличено' : 'Добавлено в корзину');
        }

        function setCartQty(prodId, qty) {
            const n = Math.max(0, parseInt(qty, 10) || 0);
            state.cart = getCartItems().map(i => i.productId === prodId ? { ...i, qty: n } : i).filter(i => i.qty > 0);
            saveCart();
            refreshCartSurfaces();
        }

        function removeFromCart(prodId) {
            state.cart = getCartItems().filter(i => i.productId !== prodId);
            saveCart();
            refreshCartSurfaces();
            showSmsToast('Удалено из корзины');
        }

        function renderCart() {
            expireExpiredStoreOrders();
            const container = document.getElementById('cart-list');
            const clearBtn = document.getElementById('cart-clear-btn');
            const box = document.getElementById('cart-checkout-box');
            if (!container) return;
            const items = getCartItems();
            if (!items.length) {
                container.innerHTML = '<div class="cart-empty"><p class="text-sm text-sky-100/80">Корзина пуста</p><p class="text-xs text-sky-200/50 mt-1">Товары разных магазинов можно добавить в одну корзину</p></div>';
                if (clearBtn) clearBtn.classList.add('hidden');
                if (box) box.classList.add('hidden');
                renderBuyerOrders();
                return;
            }
            if (clearBtn) clearBtn.classList.remove('hidden');
            if (box) box.classList.remove('hidden');
            const nameEl = document.getElementById('chk-name');
            const phoneEl = document.getElementById('chk-phone');
            if (nameEl && !nameEl.value && buyerProfile && buyerProfile.name) nameEl.value = buyerProfile.name;
            if (phoneEl && !phoneEl.value && buyerProfile && buyerProfile.phone) phoneEl.value = buyerProfile.phone;

            let html = '';
            let grand = 0;
            items.forEach(function (i) {
                const line = (i.priceSnapshot || 0) * (i.qty || 1);
                grand += line;
                html += '<div class="cart-card" data-swipe-fn="removeFromCart" data-swipe-arg="' + i.productId + '">' +
                    '<div class="cart-card-top">' +
                        '<div class="min-w-0">' +
                            '<span class="cart-card-store">' + (i.storeId || '') + '</span>' +
                            '<span class="cart-card-note">Отдельный заказ при оформлении</span>' +
                        '</div>' +
                        '<button type="button" class="cart-card-x" onclick="removeFromCart(\'' + i.productId + '\')">×</button>' +
                    '</div>' +
                    '<div class="cart-card-body">' +
                        '<img src="' + (i.image || '') + '" class="cart-card-photo" alt="">' +
                        '<div class="min-w-0">' +
                            '<p class="cart-card-title">' + (i.titleSnapshot || '') + '</p>' +
                            (i.variant ? '<p class="cart-card-var">' + i.variant + '</p>' : '') +
                            '<p class="cart-card-price">' + formatRub(i.priceSnapshot) + '</p>' +
                            '<div class="cart-qty">' +
                                '<button type="button" onclick="setCartQty(\'' + i.productId + '\', ' + ((i.qty || 1) - 1) + ')">−</button>' +
                                '<span>' + (i.qty || 1) + '</span>' +
                                '<button type="button" onclick="setCartQty(\'' + i.productId + '\', ' + ((i.qty || 1) + 1) + ')">+</button>' +
                            '</div>' +
                        '</div>' +
                        '<p class="cart-card-sum">' + formatRub(line) + '</p>' +
                    '</div>' +
                '</div>';
            });
            html += '<p class="cart-total">Итого: ' + formatRub(grand) + '</p>';
            container.innerHTML = html;
            renderBuyerOrders();
        }

        function submitCheckout() {
            const items = getCartItems();
            if (!items.length) return showSmsToast('Корзина пуста');
            const name = (document.getElementById('chk-name') || {}).value || '';
            const phone = (document.getElementById('chk-phone') || {}).value || '';
            if (!name.trim() || !phone.trim()) return showSmsToast('Укажите имя и телефон');
            const contact = {
                name: name.trim(),
                phone: phone.trim(),
                telegram: ((document.getElementById('chk-telegram') || {}).value || '').trim(),
                max: ((document.getElementById('chk-max') || {}).value || '').trim(),
                comment: ((document.getElementById('chk-comment') || {}).value || '').trim()
            };
            const checkout = { id: cartUid('chk-'), userId: state.userEmail || phone, contact, createdAt: Date.now(), status: 'submitted' };
            marketplace.checkouts.push(checkout);
            const byStore = {};
            items.forEach(i => { (byStore[i.storeId] = byStore[i.storeId] || []).push(i); });
            Object.keys(byStore).forEach(storeId => {
                marketplace.storeOrders.push({
                    id: cartUid('so-'),
                    checkoutId: checkout.id,
                    storeId,
                    status: 'pending_review',
                    slaDeadline: Date.now() + STORE_ORDER_SLA_MS,
                    createdAt: Date.now(),
                    contact,
                    lines: byStore[storeId].map(i => ({
                        productId: i.productId,
                        title: i.titleSnapshot,
                        image: i.image,
                        qty: i.qty || 1,
                        quotedPrice: i.priceSnapshot,
                        proposedPrice: null,
                        lineStatus: 'pending'
                    }))
                });
            });
            state.cart = [];
            saveCart();
            saveMarketplace();
            refreshCartSurfaces();
            showSmsToast('Создано заказов: ' + Object.keys(byStore).length + ' (по магазинам)');
        }

        function soFind(id) { return (marketplace.storeOrders || []).find(o => o.id === id); }

        function soLine(order, productId) { return (order.lines || []).find(l => l.productId === productId); }

        function soSetLine(orderId, productId, status, extra) {
            const order = soFind(orderId);
            if (!order) return;
            if (['paid', 'cancelled', 'expired', 'rejected'].includes(order.status) && status !== 'pending') {
                if (order.status === 'expired' || order.status === 'cancelled') return;
            }
            const line = soLine(order, productId);
            if (!line) return;
            line.lineStatus = status;
            if (extra && extra.proposedPrice != null) line.proposedPrice = extra.proposedPrice;
            soRecalc(order);
            saveMarketplace();
            refreshCartSurfaces();
        }

        function soConfirmLine(orderId, productId) { soSetLine(orderId, productId, 'confirmed'); showSmsToast('Позиция подтверждена'); }
        function soMarkUnavailable(orderId, productId) { soSetLine(orderId, productId, 'unavailable'); showSmsToast('Нет в наличии'); }
        function soProposePrice(orderId, productId) {
            const order = soFind(orderId);
            const line = order && soLine(order, productId);
            if (!line) return;
            const val = prompt('Новая цена, ₽', String(line.quotedPrice));
            if (val == null) return;
            const n = parseInt(String(val).replace(/\D/g, ''), 10);
            if (!n) return showSmsToast('Некорректная цена');
            soSetLine(orderId, productId, 'price_changed', { proposedPrice: n });
            showSmsToast('Цена отправлена клиенту');
        }
        function soConfirmAll(orderId) {
            const order = soFind(orderId);
            if (!order) return;
            order.lines.forEach(l => { if (l.lineStatus === 'pending' || l.lineStatus === 'price_changed') { l.lineStatus = 'confirmed'; if (l.proposedPrice) l.quotedPrice = l.proposedPrice; } });
            soRecalc(order);
            saveMarketplace();
            refreshCartSurfaces();
        }
        function soRejectAll(orderId) {
            const order = soFind(orderId);
            if (!order) return;
            order.lines.forEach(l => { l.lineStatus = 'unavailable'; });
            order.status = 'rejected';
            saveMarketplace();
            refreshCartSurfaces();
        }
        function soCancel(orderId) {
            const order = soFind(orderId);
            if (!order || order.status === 'paid') return;
            order.status = 'cancelled';
            saveMarketplace();
            refreshCartSurfaces();
            showSmsToast('Заказ отменён');
        }
        function soAcceptPrice(orderId) {
            const order = soFind(orderId);
            if (!order) return;
            order.lines.forEach(l => {
                if (l.lineStatus === 'price_changed' && l.proposedPrice) {
                    l.quotedPrice = l.proposedPrice;
                    l.lineStatus = 'confirmed';
                }
            });
            soRecalc(order);
            saveMarketplace();
            refreshCartSurfaces();
            showSmsToast('Новая цена принята');
        }
        function soReturnToCart(orderId) {
            const order = soFind(orderId);
            if (!order) return;
            (order.lines || []).forEach(l => {
                if (l.lineStatus === 'unavailable' || order.status === 'expired' || order.status === 'cancelled' || order.status === 'rejected') {
                    const p = productsDb[l.productId];
                    if (!p) return;
                    const items = getCartItems();
                    const ex = items.find(i => i.productId === l.productId);
                    if (ex) ex.qty += l.qty || 1;
                    else items.push({ productId: p.id, storeId: p.store, qty: l.qty || 1, priceSnapshot: parsePrice(p.price), titleSnapshot: p.title, image: p.image });
                    state.cart = items;
                }
            });
            saveCart();
            saveMarketplace();
            refreshCartSurfaces();
            showSmsToast('Позиции возвращены в корзину');
        }
        function soIssueInvoice(orderId) {
            const order = soFind(orderId);
            if (!order) return;
            const amount = soConfirmedAmount(order);
            if (!amount) return showSmsToast('Нет подтверждённых позиций');
            const inv = { id: cartUid('inv-'), storeOrderId: order.id, amount, currency: 'RUB', channel: 'in_app', status: 'issued', createdAt: Date.now() };
            marketplace.invoices.push(inv);
            order.status = 'awaiting_payment';
            order.invoiceId = inv.id;
            saveMarketplace();
            refreshCartSurfaces();
            showSmsToast('Счёт ' + formatRub(amount) + ' выставлен');
        }
        function soMarkPaid(orderId) {
            const order = soFind(orderId);
            if (!order || !order.invoiceId) return showSmsToast('Сначала выставьте счёт');
            const inv = marketplace.invoices.find(i => i.id === order.invoiceId);
            const pay = { id: cartUid('pay-'), invoiceId: order.invoiceId, provider: 'manual', status: 'succeeded', amount: inv ? inv.amount : soConfirmedAmount(order), paidAt: Date.now() };
            marketplace.payments.push(pay);
            if (inv) inv.status = 'paid';
            order.status = 'paid';
            saveMarketplace();
            refreshCartSurfaces();
            showSmsToast('Оплата отмечена');
        }
        function soContactClient(orderId, channel) {
            const order = soFind(orderId);
            if (!order) return;
            const amount = soConfirmedAmount(order);
            const msg = encodeURIComponent('Заказ ' + order.id + ' из «' + order.storeId + '». К оплате: ' + formatRub(amount));
            if (channel === 'telegram') {
                let handle = (order.contact && order.contact.telegram) || '';
                handle = handle.replace(/^@/, '');
                if (handle.indexOf('t.me') >= 0) window.open(handle, '_blank');
                else if (handle) window.open('https://t.me/' + handle + '?text=' + msg, '_blank');
                else showSmsToast('Клиент не указал Telegram');
            } else {
                const m = (order.contact && order.contact.max) || '';
                if (m.indexOf('http') === 0) window.open(m, '_blank');
                else showSmsToast('MAX: ' + (m || 'не указан') + '. Счёт: ' + formatRub(amount));
            }
        }

        function renderBuyerOrders() {
            const el = document.getElementById('buyer-orders-list');
            if (!el) return;
            expireExpiredStoreOrders();
            const uid = state.userEmail;
            const phone = (buyerProfile && buyerProfile.phone) || '';
            const mine = (marketplace.storeOrders || []).filter(o => {
                const chk = marketplace.checkouts.find(c => c.id === o.checkoutId);
                return (chk && (chk.userId === uid || chk.userId === phone)) || (o.contact && o.contact.phone === phone && phone);
            }).sort((a, b) => b.createdAt - a.createdAt);
            if (!mine.length) { el.innerHTML = '<p class="cart-orders-empty">Заказов пока нет</p>'; return; }
            el.innerHTML = mine.map(o => {
                const lines = (o.lines || []).map(l => {
                    const price = l.proposedPrice && l.lineStatus === 'price_changed' ? l.proposedPrice : l.quotedPrice;
                    return `<div class="flex justify-between gap-2 text-[11px] py-1"><span class="truncate">${l.title} ×${l.qty}</span><span>${soLineBadge(l.lineStatus)} ${formatRub(price)}</span></div>`;
                }).join('');
                let actions = '';
                if (o.status === 'awaiting_buyer') actions += `<button onclick="soAcceptPrice('${o.id}')" class="flex-1 bg-[#1e6091] text-white text-[10px] font-bold py-2 rounded-lg">Принять цену</button>`;
                if (['pending_review','awaiting_buyer','partial','confirmed'].includes(o.status)) actions += `<button onclick="soCancel('${o.id}')" class="flex-1 bg-slate-100 text-slate-600 text-[10px] font-bold py-2 rounded-lg">Отменить</button>`;
                if (['expired','rejected','cancelled'].includes(o.status)) actions += `<button onclick="soReturnToCart('${o.id}')" class="flex-1 bg-slate-800 text-white text-[10px] font-bold py-2 rounded-lg">Вернуть в корзину</button>`;
                return `<div class="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
                    <div class="flex justify-between gap-2"><span class="text-xs font-bold">${o.storeId}</span><span class="text-[10px] text-slate-500">${soStatusLabel(o.status)}</span></div>
                    ${lines}
                    <p class="text-xs font-bold text-right">${formatRub(soConfirmedAmount(o) || (o.lines||[]).reduce((s,l)=>s+l.quotedPrice*(l.qty||1),0))}</p>
                    ${actions ? `<div class="flex gap-2">${actions}</div>` : ''}
                </div>`;
            }).join('');
        }

        function soLineBadge(st) {
            const map = { pending: 'ожидание', confirmed: 'ок', unavailable: 'нет', price_changed: 'новая цена', removed: 'снято' };
            return '<span class="text-slate-400">' + (map[st] || st) + '</span>';
        }

        function renderShopOrders() {
            expireExpiredStoreOrders();
            const el = document.getElementById('shop-orders-list');
            if (!el) return;
            const shop = state.currentShop;
            const list = (marketplace.storeOrders || []).filter(o => o.storeId === shop).sort((a, b) => b.createdAt - a.createdAt);
            if (!list.length) { el.innerHTML = '<p class="text-xs text-slate-400 p-4 text-center border border-dashed rounded-xl">Заказов нет</p>'; return; }
            el.innerHTML = list.map(o => {
                const c = o.contact || {};
                const lines = (o.lines || []).map(l => {
                    const canAct = ['pending_review','partial','confirmed','awaiting_buyer'].includes(o.status);
                    const acts = canAct && (l.lineStatus === 'pending' || l.lineStatus === 'price_changed')
                        ? `<div class="flex gap-1 mt-1">
                            <button onclick="soConfirmLine('${o.id}','${l.productId}')" class="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md">Есть</button>
                            <button onclick="soMarkUnavailable('${o.id}','${l.productId}')" class="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-md">Нет</button>
                            <button onclick="soProposePrice('${o.id}','${l.productId}')" class="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-md">Цена</button>
                           </div>` : '';
                    return `<div class="py-2 border-b border-slate-50 last:border-0">
                        <div class="flex justify-between text-[11px]"><span class="font-medium truncate pr-2">${l.title} ×${l.qty}</span><span>${formatRub(l.proposedPrice || l.quotedPrice)}</span></div>
                        <p class="text-[10px] text-slate-400">${soLineBadge(l.lineStatus)}</p>${acts}
                    </div>`;
                }).join('');
                let foot = '';
                if (['confirmed','partial'].includes(o.status)) foot += `<button onclick="soIssueInvoice('${o.id}')" class="w-full bg-[#1c3a34] text-white text-[11px] font-bold py-2 rounded-xl">Выставить счёт</button>`;
                if (o.status === 'awaiting_payment' || o.status === 'invoiced') {
                    foot += `<div class="grid grid-cols-2 gap-2">
                        <button onclick="soContactClient('${o.id}','telegram')" class="bg-[#2AABEE] text-white text-[10px] font-bold py-2 rounded-xl">Telegram</button>
                        <button onclick="soContactClient('${o.id}','max')" class="bg-slate-800 text-white text-[10px] font-bold py-2 rounded-xl">MAX</button>
                    </div>
                    <button onclick="soMarkPaid('${o.id}')" class="w-full bg-emerald-600 text-white text-[11px] font-bold py-2 rounded-xl">Отметить оплату</button>`;
                }
                if (o.status === 'pending_review') foot += `<button onclick="soConfirmAll('${o.id}')" class="w-full bg-[#1e6091] text-white text-[11px] font-bold py-2 rounded-xl mb-1">Подтвердить все</button><button onclick="soRejectAll('${o.id}')" class="w-full bg-slate-100 text-slate-600 text-[11px] font-bold py-2 rounded-xl">Отклонить заказ</button>`;
                return `<div class="bg-white rounded-2xl border border-slate-100 p-3 space-y-2">
                    <div class="flex justify-between"><span class="text-[10px] font-bold text-slate-500">${soStatusLabel(o.status)}</span><span class="text-[10px] text-slate-400">SLA до ${new Date(o.slaDeadline||0).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</span></div>
                    <p class="text-[11px] text-slate-600">${c.name || ''} · ${c.phone || ''}</p>
                    ${lines}
                    <p class="text-xs font-bold">К счёту: ${formatRub(soConfirmedAmount(o))}</p>
                    <div class="space-y-1">${foot}</div>
                </div>`;
            }).join('');
        }

        function clearAllFavorites() {
            state.favorites = [];
            saveFavorites();
            renderProductGrid();
            renderFavorites();
            updateBuyerFavCount();
            showSmsToast("Избранное очищено ");
        }

        // Рендер избранного с группировкой по магазинам
        function renderFavorites() {
            const container = document.getElementById('favorites-list');
            const clearBtn = document.getElementById('fav-clear-btn');
            if (!container) return;

            if (!state.favorites || state.favorites.length === 0) {
                container.innerHTML = `
                    <div class="fav-empty">
                        <p class="text-sm">В избранном пока пусто</p>
                        <p class="text-xs mt-1" style="color:#8AA0B8">Добавляйте товары кнопкой в каталоге</p>
                    </div>`;
                if (clearBtn) clearBtn.classList.add('hidden');
                return;
            }

            if (clearBtn) clearBtn.classList.remove('hidden');

            const groups = {};
            state.favorites.forEach(id => {
                const p = productsDb[id];
                if (!p) return;
                if (!groups[p.store]) groups[p.store] = [];
                groups[p.store].push(p);
            });

            let html = '';
            let groupIndex = 0;

            for (const store in groups) {
                groupIndex++;
                const items = groups[store];
                let storeTotal = 0;
                let itemsHtml = '';
                items.forEach(id_or_p => {
                    const p = productsDb[id_or_p.id] || id_or_p;
                    storeTotal += parsePrice(p.price);
                    const badge = getBadgeHtml(p);
                    itemsHtml += `
                        <div onclick="openProductModal('${p.id}')" class="fav-item" data-swipe-fn="toggleFavorite" data-swipe-arg="${p.id}">
                            <div class="flex-1 min-w-0">
                                ${badge ? `<div class="fav-badge-wrap">${badge}</div>` : ''}
                                <div class="fav-item-price">${getPriceHtml(p, 'fav-price')}</div>
                                <h5 class="fav-item-title">${p.title}</h5>
                            </div>
                            <svg class="fav-chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </div>`;
                });

                const shopData = shopsProfileDb[store] || {};
                const shopImage = shopData.banner || shopData.logo || 'https://via.placeholder.com/600x200';
                const storeAttr = String(store).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                html += `
                    <div class="fav-card">
                        <div class="fav-banner">
                            <img src="${shopImage}" alt="">
                            <div class="fav-banner-veil"></div>
                            <button type="button" class="fav-heart" onclick="event.stopPropagation(); unfavoriteStore('${storeAttr}')">
                                <svg class="fill-current" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                            </button>
                            <div class="fav-banner-copy">
                                <span class="fav-shop">${store}</span>
                                <span class="fav-count">${items.length} тов.</span>
                            </div>
                        </div>
                        <div>
                            ${itemsHtml}
                            <div class="fav-foot">
                                <div class="fav-sum">
                                    <span>Итого по магазину:</span>
                                    <b>${formatPrice(storeTotal)}</b>
                                </div>
                                <div class="fav-actions">
                                    <button type="button" class="fav-chat" onclick="event.stopPropagation(); openAssistant()">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.22-.9L3 20l1.16-3.48C3.43 15.4 3 13.76 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                                    </button>
                                    <button type="button" class="fav-send" onclick="sendOrderToManager('${storeAttr}')">
                                        <svg class="fill-current" viewBox="0 0 24 24"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
                                        Отправить заказ менеджеру
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>`;
            }

            container.innerHTML = html;
        }

        function unfavoriteStore(store) {
            if (!state.favorites) return;
            state.favorites = state.favorites.filter(function (id) {
                const p = productsDb[id];
                return p && p.store !== store;
            });
            saveFavorites();
            renderProductGrid();
            renderFavorites();
            updateBuyerFavCount();
        }

        // Отправить заказ менеджеру магазина в Telegram
        function sendOrderToManager(store) {
            const items = state.favorites.map(id => productsDb[id]).filter(p => p && p.store === store);
            if (items.length === 0) return;

            let total = 0;
            let message = `Здравствуйте! Хочу оформить заказ в магазине "${store}":%0A%0A`;
            items.forEach((p, i) => {
                total += parsePrice(p.price);
                message += `${i + 1}. ${p.title} — ${p.price}%0A`;
            });
            message += `%0AИтого: ${formatPrice(total)}%0A%0A`;

            // Добавляем контакты покупателя, если заполнены
            if (buyerProfile && buyerProfile.name) {
                message += `Мои данные:%0AИмя: ${buyerProfile.name}`;
                if (buyerProfile.phone) message += `%0AТелефон: ${buyerProfile.phone}`;
            }

            const shopInfo = shopsProfileDb[store];
            let tgLink = shopInfo && shopInfo.telegram ? shopInfo.telegram : '';

            if (tgLink && tgLink !== '#') {
                // Превращаем ссылку в username и добавляем текст сообщения
                const username = tgLink.replace('https://t.me/', '').replace('http://t.me/', '').replace('@', '');
                const url = `https://t.me/${username}?text=${message}`;
                window.open(url, '_blank');
                showSmsToast(`Заказ отправлен в ${store}`);
            } else {
                showSmsToast(`У магазина "${store}" не указан Telegram `);
            }
        }


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


                 // ========== СОХРАНЕНИЕ И ЗАГРУЗКА ДАННЫХ (localStorage) ==========
        function applyShopLocalBanners() {
            if (typeof SHOP_B === 'undefined') return;
            const bind = [
                ['Любимый Дом', 'ld'],
                ['Кухни Дриада', 'driada'],
                ['Мебельная фабрика ТриЯ', 'triya'],
                ['Постройка', 'postroyka'],
                ['Стройландия', 'stroylandiya'],
                ['Новоселье', 'novoselie'],
                ['ЛеГо', 'lego']
            ];
            bind.forEach(([name, key]) => {
                const shop = shopsProfileDb[name];
                const src = SHOP_B[key];
                if (!shop || !src) return;
                shop.banner = src;
                if (key === 'stroylandiya') shop.bannerFit = 'contain';
                if (Array.isArray(shop.gallery) && shop.gallery.length) shop.gallery[0] = src;
                else shop.gallery = [src];
            });
        }
        function shopsProfileForStorage() {
            const out = {};
            for (const name in shopsProfileDb) {
                const s = Object.assign({}, shopsProfileDb[name]);
                if (typeof s.banner === 'string' && s.banner.indexOf('data:') === 0) s.banner = '';
                if (Array.isArray(s.gallery)) s.gallery = s.gallery.filter(function(x) { return typeof x !== 'string' || x.indexOf('data:') !== 0; });
                out[name] = s;
            }
            return out;
        }
        function saveAllData() {
            try {
                localStorage.setItem('meb_products', JSON.stringify(productsDb));
                localStorage.setItem('meb_shops', JSON.stringify(shopsProfileForStorage()));
                localStorage.setItem('meb_directory', JSON.stringify(directoryDb));
                localStorage.setItem('meb_stories', JSON.stringify(storiesData));
                localStorage.setItem('meb_vacancies', JSON.stringify(vacanciesDb));
                localStorage.setItem('meb_promo', JSON.stringify(promoData));
                localStorage.setItem('meb_onboarding', JSON.stringify(onboardingData));
                localStorage.setItem('meb_showcases', JSON.stringify(showcaseModerationDb));
                localStorage.setItem('meb_lifehacks', JSON.stringify({ categories: lifehackCategories, items: lifehacksDb }));
                localStorage.setItem('meb_lifehack_saved', JSON.stringify(lifehackSavedIds));
            } catch (e) {
                console.warn('Ошибка сохранения:', e);
                // Если память переполнена (обычно из-за тяжёлого видео)
                if (e.name === 'QuotaExceededError' || (e.message && e.message.toLowerCase().includes('quota'))) {
                    showSmsToast(' Видео слишком большое для сохранения. Попробуйте файл поменьше.');
                }
            }
        }

        function loadAllData() {
            try {
                const p = localStorage.getItem('meb_products');
if (p) {
    const d = JSON.parse(p);
    // Обновляем существующие товары, СОХРАНЯЯ описание и images из кода
    for (const k in d) {
        if (productsDb[k]) {
            // товар есть в коде — берём из localStorage только статус, цену, название
            productsDb[k].status = d[k].status;
            productsDb[k].title = d[k].title;
            productsDb[k].price = d[k].price;
            productsDb[k].store = d[k].store;
            productsDb[k].image = d[k].image;
            productsDb[k].category = d[k].category;
            // description, images, oldPrice, badge НЕ трогаем — оставляем из кода
        } else {
            // новый товар (создан магазином) — добавляем целиком
            productsDb[k] = d[k];
        }
    }
}
                const s = localStorage.getItem('meb_shops');
                if (s) { const d = JSON.parse(s); Object.assign(shopsProfileDb, d); }
                applyShopLocalBanners();

                const dir = localStorage.getItem('meb_directory');
                if (dir) {
                    const d = JSON.parse(dir);
                    if (Array.isArray(d.specialists)) {
                        const byId = {};
                        d.specialists.forEach(function (s) { if (s && s.id) byId[s.id] = s; });
                        directoryDb.specialists.forEach(function (s) {
                            if (!s || !s.id) return;
                            if (!byId[s.id]) {
                                d.specialists.push(s);
                                byId[s.id] = s;
                            } else if (!byId[s.id].craft && s.craft) {
                                byId[s.id].craft = s.craft;
                            }
                        });
                        directoryDb.specialists = d.specialists;
                    }
                }

                const st = localStorage.getItem('meb_stories');
                if (st) {
                    const parsed = JSON.parse(st);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        storiesData = parsed;
                    }
                }

                const v = localStorage.getItem('meb_vacancies');
                if (v) { vacanciesDb = JSON.parse(v); }

                const pr = localStorage.getItem('meb_promo');
                if (pr) { promoData = JSON.parse(pr); applyPromoToHome(); }

                const onb = localStorage.getItem('meb_onboarding');
                if (onb) {
                    const parsed = JSON.parse(onb);
                    if (Array.isArray(parsed) && parsed.length > 0) onboardingData = parsed;
                }

                const lh = localStorage.getItem('meb_lifehacks');
                if (lh) {
                    const parsed = JSON.parse(lh);
                    if (Array.isArray(parsed) && parsed.length) {
                        lifehacksDb = parsed;
                    } else if (parsed && Array.isArray(parsed.items)) {
                        lifehacksDb = parsed.items;
                        if (Array.isArray(parsed.categories) && parsed.categories.length) {
                            lifehackCategories = parsed.categories.slice();
                            DEFAULT_LIFEHACK_CATEGORIES.forEach(function (c) {
                                if (lifehackCategories.indexOf(c) < 0) lifehackCategories.push(c);
                            });
                        }
                    }
                }
                try {
                    const savedLh = localStorage.getItem('meb_lifehack_saved');
                    if (savedLh) lifehackSavedIds = JSON.parse(savedLh) || [];
                } catch (e2) {}
                if (typeof loadLhEngageState === 'function') loadLhEngageState();
                if (typeof hydrateLifehacksEngage === 'function') hydrateLifehacksEngage();

                const sc = localStorage.getItem('meb_showcases');
                if (sc) {
                    const parsed = JSON.parse(sc);
                    if (Array.isArray(parsed)) showcaseModerationDb = parsed;
                }
            } catch (e) {
                console.warn('Ошибка загрузки:', e);
            }
        }

        // Применяем сохранённый баннер на главную (один большой баннер)
        function applyPromoToHome() {
            if (!promoData || !promoData[0]) return;
            const img = document.getElementById('promo-main-img');
            const title = document.getElementById('promo-main-title');
            if (img && promoData[0].image) img.src = promoData[0].image;
            if (title && promoData[0].title) title.innerText = promoData[0].title;
        }

                // ========== КЛИК ПО ПЛИТКАМ СТАТИСТИКИ ==========
        function statGoTo(type) {
            if (type === 'pending') {
                // Модерация — переходим на вкладку модерации
                switchAdminTab('moderation');
                return;
            }
            if (type === 'stories') {
                // Сторис — на вкладку "Главная"
                switchAdminTab('home');
                return;
            }
            if (type === 'lifehacks') {
                switchAdminTab('crm');
                const crmType = document.getElementById('crm-type');
                if (crmType) { crmType.value = 'lifehacks'; switchCrmType(); }
                return;
            }
            if (type === 'vacancies') {
                // Вакансии — тоже в модерацию (там управление анкетами/вакансиями)
                switchAdminTab('moderation');
                const filter = document.getElementById('mod-category-filter');
                if (filter) { filter.value = 'vacancies'; renderAdminModerationList(); }
                return;
            }
            // Товары / Магазины / Мастера — вкладка "Каталог"
            switchAdminTab('crm');
            const crmType = document.getElementById('crm-type');
            if (crmType) {
                crmType.value = type; // products / shops / specialists
                switchCrmType();
            }
        }



                // ========== ДАШБОРД СТАТИСТИКИ ==========
        function updateAdminStats() {
            // Товары
            const prodCount = Object.keys(productsDb).length;
            // Магазины
            const shopCount = Object.keys(shopsProfileDb).length;
            // Мастера
            const specCount = directoryDb.specialists.length;
            // Сторис
            const storyCount = storiesData.length;
            // Вакансии
            const vacCount = vacanciesDb.length;
            // На модерации (все типы)
            let pending = Object.values(productsDb).filter(p => p.status === 'pending').length;
            pending += directoryDb.specialists.filter(p => p.status === 'pending').length;
            pending += vacanciesDb.filter(p => p.status === 'pending').length;
            pending += storiesData.filter(p => p.status === 'pending').length;
            pending += showcaseModerationDb.filter(p => p.status === 'pending').length;

            const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
            set('stat-products', prodCount);
            set('stat-shops', shopCount);
            set('stat-specialists', specCount);
            set('stat-stories', storyCount);
            set('stat-vacancies', vacCount);
            set('stat-pending', pending);
            set('stat-lifehacks', Array.isArray(lifehacksDb) ? lifehacksDb.length : 0);
        }

                // ========== ДАННЫЕ ОНБОРДИНГА (до 20 слайдов) ==========
        let onboardingData = [
            { title: 'Кухня Вашей Мечты', desc: 'Рассчитайте стоимость, пройдите короткий опрос и получите ценный подарок.', image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600', badge: 'АКЦИЯ АВГУСТА', badgeColor: 'bg-amber-500' },
            { title: 'Современные Решения', desc: 'Готовые кухонные гарнитуры напрямую от лучших фабрик региона.', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600', badge: 'ПРЕМИУМ', badgeColor: 'bg-blue-600' },
            { title: 'Мебель Люкс Класса', desc: 'Премиальные дизайнерские кровати для безупречного комфорта.', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600', badge: 'ЭСТЕТИКА СНА', badgeColor: 'bg-emerald-600' },
            { title: 'Надежные мастера', desc: 'Проверенные бригады и дизайнеры для вашего идеального ремонта.', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600', badge: 'СПЕЦИАЛИСТЫ', badgeColor: 'bg-red-600' },
            { title: 'Стильные гостиные', desc: 'Мягкая мебель и декор для уютной атмосферы в вашем доме.', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600', badge: 'НОВИНКА', badgeColor: 'bg-violet-600' },
            { title: 'Ванная мечты', desc: 'Сантехника и плитка от проверенных производителей.', image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600', badge: 'ХИТ', badgeColor: 'bg-pink-600' }
        ];

        // Сколько слайдов показывать за один заход
        const ONBOARDING_SHOW = 4;
        // Слайды текущего показа
        let onboardingSlides = [];

                // ========== УПРАВЛЕНИЕ ПРОМО-БАННЕРАМИ ==========
        // Собираем данные баннеров из HTML в массив (один раз)
        let promoData = SEED.promo();

        function renderCrmPromoList() {
            let html = '';
            promoData.forEach((p, i) => {
                html += `
                    <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                        <img src="${p.image}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">
                        <div class="flex-1 min-w-0">
                            <p class="text-[9px] text-slate-400">Слайд ${i + 1}</p>
                            <h5 class="font-bold text-xs text-slate-800 truncate">${p.title}</h5>
                        </div>
                        <button onclick="openPromoEditor(${i})" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shrink-0">Редактировать</button>
                    </div>`;
            });
            document.getElementById('crm-promo-list').innerHTML = html;
        }

        function openPromoEditor(index) {
            const p = promoData[index];
            document.getElementById('promo-editor-index').value = index;
            document.getElementById('promo-editor-title').value = p.title;
            document.getElementById('promo-editor-image').value = p.image;
            document.getElementById('promo-editor-preview').src = p.image;
            const e = document.getElementById('promo-editor');
            e.classList.remove('hidden'); e.classList.add('flex');
        }

        function closePromoEditor() {
            const e = document.getElementById('promo-editor');
            e.classList.add('hidden'); e.classList.remove('flex');
        }

        function savePromoFromEditor() {
            const i = parseInt(document.getElementById('promo-editor-index').value);
            const title = document.getElementById('promo-editor-title').value.trim();
            const image = document.getElementById('promo-editor-image').value.trim();
            if (!title || !image) return showSmsToast("Заполните заголовок и фото!");

            promoData[i] = { title, image };

            // Обновляем сам баннер на главной
            const slide = document.getElementById('promo-slide-' + (i + 1));
            if (slide) {
                slide.querySelector('img').src = image;
                slide.querySelector('h4').innerText = title;
            }

                        showSmsToast("Баннер обновлён ");
            closePromoEditor();
            renderCrmPromoList();
            saveAllData();
        }

        // ========== УПРАВЛЕНИЕ СТОРИС ==========
        function renderCrmStoryList() {
            const list = document.getElementById('crm-story-list');
            if (!list) return;
            let html = '';
            storiesData.forEach(s => {
                const cover = (s.slides && s.slides[0]) || s.image || '';
                const count = (s.slides && s.slides.length) || 0;
                html += `
                    <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                        <img src="${cover}" class="w-11 h-11 rounded-full object-cover shrink-0 bg-slate-100">
                        <div class="flex-1 min-w-0">
                            <h5 class="font-bold text-xs text-slate-800 truncate">${s.name}</h5>
                            <p class="text-[10px] text-slate-400">${count} фото</p>
                        </div>
                        <div class="flex flex-col gap-1 shrink-0">
                            <button onclick="openStoryEditor('${s.id}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                            <button onclick="deleteStory('${s.id}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                        </div>
                    </div>`;
            });
            list.innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Сторис нет</p>`;
        }

        // Временное хранилище загруженных слайдов (пока форма открыта)
        let storyEditorSlides = [];

        function openStoryEditor(id) {
            const e = document.getElementById('story-editor');
            if (!e) return;
            const s = storiesData.find(x => x.id === id);

            // Строим выпадающий список магазинов
            buildStoryShopDropdown();

            if (s) {
                document.getElementById('story-editor-title').innerText = 'Редактировать сторис';
                document.getElementById('story-editor-id').value = s.id;
                setStoryShop(s.name);          // подставляем выбранный магазин
                storyEditorSlides = [...s.slides]; // копируем существующие слайды
            } else {
                document.getElementById('story-editor-title').innerText = 'Новый сторис';
                document.getElementById('story-editor-id').value = '';
                setStoryShop('');              // сбрасываем магазин
                storyEditorSlides = [];        // пусто
            }

            // Очищаем поле выбора файлов
            const fileInput = document.getElementById('story-editor-files');
            if (fileInput) fileInput.value = '';

            renderStoryEditorPreviews();       // рисуем превью
            e.classList.remove('hidden'); e.classList.add('flex');
        }

        // === ВЫПАДАЮЩИЙ СПИСОК МАГАЗИНОВ ===
        function buildStoryShopDropdown() {
            const list = document.getElementById('story-shop-list');
            if (!list) return;
            let html = '';
            for (const name in shopsProfileDb) {
                html += `<div onclick="pickStoryShop('${name.replace(/'/g, "\\'")}')" class="px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer">${name}</div>`;
            }
            list.innerHTML = html || '<div class="px-3 py-2.5 text-sm text-slate-400">Магазинов нет</div>';
        }

        // Открыть/закрыть список магазинов
        function toggleStoryShopDropdown(event) {
            if (event) event.stopPropagation();
            const list = document.getElementById('story-shop-list');
            if (list) list.classList.toggle('hidden');
        }

        // Выбрать магазин из списка
        function pickStoryShop(name) {
            setStoryShop(name);
            document.getElementById('story-shop-list').classList.add('hidden');
        }

        // Записать выбранный магазин в форму
        function setStoryShop(name) {
            const hidden = document.getElementById('story-editor-name');
            const label = document.getElementById('story-shop-label');
            if (!hidden || !label) return;
            hidden.value = name || '';
            if (name) {
                label.innerText = name;
                label.className = 'text-slate-800';
            } else {
                label.innerText = '— Выберите магазин —';
                label.className = 'text-slate-400';
            }
        }

        // === ЗАГРУЗКА ФАЙЛОВ С УСТРОЙСТВА ===
        function handleStoryFilesUpload(event) {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onload = function (ev) {
                    // Сохраняем файл как data:URL (base64-строка)
                    storyEditorSlides.push(ev.target.result);
                    renderStoryEditorPreviews();
                };
                reader.readAsDataURL(file);
            }
            // Очищаем input, чтобы можно было выбрать те же файлы снова
            event.target.value = '';
        }

        // Рисуем превью загруженных слайдов (с кнопкой удаления)
        function renderStoryEditorPreviews() {
            const box = document.getElementById('story-editor-previews');
            if (!box) return;
            let html = '';
            storyEditorSlides.forEach((src, i) => {
                const isVideo = src.startsWith('data:video') || isVideoUrl(src);
                const media = isVideo
                    ? `<video src="${src}" class="w-full h-full object-cover" muted></video><span class="absolute inset-0 flex items-center justify-center text-white text-lg pointer-events-none">▶</span>`
                    : `<img src="${src}" class="w-full h-full object-cover">`;
                html += `
                    <div class="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        ${media}
                        <button onclick="removeStorySlide(${i})" class="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 text-xs flex items-center justify-center rounded-bl-lg">✕</button>
                    </div>`;
            });
            box.innerHTML = html || '<p class="text-xs text-slate-400">Файлы не загружены</p>';
        }

        // Удалить один слайд из превью
        function removeStorySlide(index) {
            storyEditorSlides.splice(index, 1);
            renderStoryEditorPreviews();
        }

        function closeStoryEditor() {
            const e = document.getElementById('story-editor');
            e.classList.add('hidden'); e.classList.remove('flex');
        }

        function saveStoryFromEditor() {
            const id = document.getElementById('story-editor-id').value;
            const name = document.getElementById('story-editor-name').value.trim();

            if (!name) return showSmsToast("Выберите магазин!");
            if (storyEditorSlides.length === 0) return showSmsToast("Загрузите хотя бы одно фото или видео!");

            const slides = [...storyEditorSlides]; // берём загруженные файлы

            const existing = storiesData.find(x => x.id === id);
            if (existing) {
                existing.name = name;
                existing.slides = slides;
                existing.createdAt = Date.now(); // обновляем время (сброс отсчёта 24ч)
                showSmsToast("Сторис обновлён ");
            } else {
                storiesData.push({
                    id: 'story-' + Date.now(),
                    name: name,
                    slides: slides,
                    createdAt: Date.now()        // время создания — для отсчёта 24 часов
                });
                showSmsToast("Сторис добавлен (хранится 24 часа)");
            }

            closeStoryEditor();
            renderCrmStoryList();
            renderStories();
            saveAllData();
        }

                function deleteStory(id) {
            storiesData = storiesData.filter(x => x.id !== id);
            showSmsToast("Сторис удалён ");
            renderCrmStoryList();
            renderStories();
            saveAllData();
        }

        
        // ========== УПРАВЛЕНИЕ ОНБОРДИНГОМ ==========

        // Список слайдов онбординга для админа
        function renderCrmOnbList() {
            const container = document.getElementById('crm-onb-list');
            if (!container) return;
            let html = '';
            onboardingData.forEach((s, i) => {
                const badgeHtml = s.badge
                    ? `<span class="text-[8px] ${s.badgeColor || 'bg-amber-500'} text-white font-bold px-1.5 py-0.5 rounded-full">${s.badge}</span>`
                    : '';
                html += `
                    <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                        <img src="${s.image}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">
                        <div class="flex-1 min-w-0">
                            <p class="text-[9px] text-slate-400">Слайд ${i + 1}</p>
                            <h5 class="font-bold text-xs text-slate-800 truncate">${s.title}</h5>
                            ${badgeHtml}
                        </div>
                        <div class="flex flex-col gap-1 shrink-0">
                            <button onclick="openOnbEditor(${i})" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                            <button onclick="deleteOnbSlide(${i})" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                        </div>
                    </div>`;
            });
            container.innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Слайдов нет</p>`;
        }

        // Открыть форму слайда (index — если редактируем, пусто — если новый)
        function openOnbEditor(index) {
            const e = document.getElementById('onb-editor');
            if (index !== undefined && onboardingData[index]) {
                const s = onboardingData[index];
                document.getElementById('onb-editor-title').innerText = 'Редактировать слайд';
                document.getElementById('onb-editor-index').value = index;
                document.getElementById('onb-editor-title-input').value = s.title || '';
                document.getElementById('onb-editor-desc').value = s.desc || '';
                document.getElementById('onb-editor-badge').value = s.badge || '';
                document.getElementById('onb-editor-badgecolor').value = s.badgeColor || 'bg-amber-500';
                document.getElementById('onb-editor-image').value = s.image || '';
                document.getElementById('onb-editor-preview').src = s.image || '';
            } else {
                // Проверка лимита 20 слайдов
                if (onboardingData.length >= 20) {
                    return showSmsToast("Максимум 20 слайдов!");
                }
                document.getElementById('onb-editor-title').innerText = 'Новый слайд';
                document.getElementById('onb-editor-index').value = '';
                document.getElementById('onb-editor-title-input').value = '';
                document.getElementById('onb-editor-desc').value = '';
                document.getElementById('onb-editor-badge').value = '';
                document.getElementById('onb-editor-badgecolor').value = 'bg-amber-500';
                document.getElementById('onb-editor-image').value = '';
                document.getElementById('onb-editor-preview').src = '';
            }
            e.classList.remove('hidden');
            e.classList.add('flex');
        }

        // Закрыть форму
        function closeOnbEditor() {
            const e = document.getElementById('onb-editor');
            e.classList.add('hidden');
            e.classList.remove('flex');
        }

        // Удалить слайд
        function deleteOnbSlide(index) {
            if (onboardingData.length <= 1) {
                return showSmsToast("Нельзя удалить последний слайд!");
            }
            onboardingData.splice(index, 1);
            showSmsToast("Слайд удалён ");
            renderCrmOnbList();
            saveAllData();
        }


                // ========== ПЕРЕКЛЮЧАТЕЛЬ ТИПОВ (Товары / Магазины / Мастера) ==========
        function switchCrmType() {
            const type = document.getElementById('crm-type').value;
            ['products', 'shops', 'specialists', 'lifehacks'].forEach(t => {
                const el = document.getElementById('crm-block-' + t);
                if (el) el.classList.add('hidden');
            });
            const show = document.getElementById('crm-block-' + type);
            if (show) show.classList.remove('hidden');
            if (type === 'products') renderCrmProductList();
            if (type === 'shops') renderCrmShopList();
            if (type === 'specialists') renderCrmSpecList();
            if (type === 'lifehacks') renderCrmLifehackList();
        }

        function lhEsc(s) {
            return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }
        function publishedLifehacks() {
            return (lifehacksDb || []).filter(function (x) { return x && x.status === 'published'; }).slice().sort(function (a, b) {
                const oa = a.order != null ? a.order : 999;
                const ob = b.order != null ? b.order : 999;
                if (oa !== ob) return oa - ob;
                return String(b.date || '').localeCompare(String(a.date || ''));
            });
        }
        function formatLifehackDate(d) {
            if (!d) return '';
            const dt = new Date(d + (String(d).indexOf('T') >= 0 ? '' : 'T12:00:00'));
            if (isNaN(dt.getTime())) return d;
            return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
        }
        function isLifehackSaved(id) {
            return lifehackSavedIds.indexOf(id) >= 0;
        }
        function persistLifehackSaved() {
            try { localStorage.setItem('meb_lifehack_saved', JSON.stringify(lifehackSavedIds)); } catch (e) {}
        }
        function lifehackBookmarkSvg(saved) {
            if (saved) return '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3a2 2 0 00-2 2v16l9-4 9 4V5a2 2 0 00-2-2H5z"/></svg>';
            return '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z"/></svg>';
        }
        function lhFormatMeta(item) {
            const f = (item && item.format) || 'article';
            const map = {
                error: { label: 'Ошибка', cls: 'lh-fmt-error' },
                estimate: { label: 'Смета', cls: 'lh-fmt-estimate' },
                checklist: { label: 'Чеклист', cls: 'lh-fmt-checklist' },
                poll: { label: 'Опрос', cls: 'lh-fmt-poll' },
                article: { label: 'Совет', cls: 'lh-fmt-article' }
            };
            return map[f] || map.article;
        }
        function lhGetProduct(id) {
            const db = (typeof productsDb !== 'undefined' ? productsDb : window.productsDb) || {};
            return db[id] || null;
        }
        function lifehackMatchesFormat(item, fmt) {
            if (!fmt || fmt === 'all') return true;
            if (fmt === 'saved') return isLifehackSaved(item.id);
            if (fmt === 'checklist') return item.format === 'checklist' || (item.checklist && item.checklist.length);
            if (fmt === 'estimate') return item.format === 'estimate' || !!(item.estimate && item.estimate.lines);
            if (fmt === 'poll') return item.format === 'poll' || !!(item.poll && item.poll.options);
            if (fmt === 'error') return item.format === 'error';
            return item.format === fmt;
        }
        function lhChipIcon(id) {
            const p = 'fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-4 h-4"';
            if (id === 'error') return '<svg ' + p + '><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3.75m0 3.75h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>';
            if (id === 'estimate') return '<svg ' + p + '><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m-7 4h8m-8 4h5M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>';
            if (id === 'checklist') return '<svg ' + p + '><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
            if (id === 'poll') return '<svg ' + p + '><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 19V9m5 10V5m5 14v-8m5 8V3"/></svg>';
            if (id === 'saved') return '<svg ' + p + '><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z"/></svg>';
            return '<svg ' + p + '><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h10"/></svg>';
        }
        function lhActionLabel(item) {
            if (item && item.steps && item.steps.length) return item.steps.length + ' шага';
            const f = (item && item.format) || 'article';
            if (f === 'poll') return 'Голосовать';
            if (f === 'checklist') return 'Пройти чеклист';
            if (f === 'estimate') return 'Собрать смету';
            if (f === 'error') return 'Смотреть ошибки';
            return 'Читать';
        }
        function hideAppShellForLifehacks() {
            ['catalog', 'directory', 'cart', 'favorites', 'profile'].forEach(function (t) {
                const v = document.getElementById('view-' + t);
                if (v) v.classList.add('hidden');
            });
            const catProdView = document.getElementById('view-category-products');
            if (catProdView) catProdView.classList.add('hidden');
            ['home', 'directory', 'cart', 'favorites', 'profile'].forEach(function (t) {
                const btn = document.getElementById('tab-' + t);
                if (!btn) return;
                btn.className = (t === 'cart')
                    ? 'relative flex flex-col items-center justify-center flex-1 py-1 text-slate-400'
                    : 'flex flex-col items-center justify-center flex-1 py-1 text-slate-400';
            });
            const dirBtn = document.getElementById('tab-directory');
            if (dirBtn) dirBtn.className = 'flex flex-col items-center justify-center flex-1 py-1 text-blue-600';
        }
        function lifehackCardHtml(item, variant) {
            const saved = isLifehackSaved(item.id);
            const mins = item.readMins ? item.readMins + ' мин' : '';
            const meta = lhFormatMeta(item);
            const action = lhActionLabel(item);
            if (variant === 'home') {
                return `<button type="button" onclick="openLifehackArticle('${item.id}')" class="lh-home-card">
                    <img src="${lhEsc(item.image || '')}" alt="">
                    <div class="scrim"></div>
                    <div class="meta">
                        <span class="lh-fmt ${meta.cls}">${meta.label}</span>
                        <p class="text-[13px] font-extrabold leading-snug mt-1.5 line-clamp-3">${lhEsc(item.title)}</p>
                        <p class="text-[11px] font-bold mt-1.5 text-white/90">${action} →</p>
                    </div>
                </button>`;
            }
            if (variant === 'hero') {
                return `<button type="button" onclick="openLifehackArticle('${item.id}')" class="lh-hero">
                    <img src="${lhEsc(item.image || '')}" alt="">
                    <div class="lh-hero-scrim"></div>
                    <div class="lh-hero-body">
                        <span class="lh-fmt ${meta.cls}">${item.format === 'poll' ? 'Сейчас голосуют' : meta.label}</span>
                        <h4 class="font-extrabold text-[18px] leading-snug mt-1.5">${lhEsc(item.title)}</h4>
                        <span class="lh-hero-cta">${action} →</span>
                    </div>
                </button>`;
            }
            if (variant === 'related') {
                return `<button type="button" onclick="openLifehackArticle('${item.id}')" class="shrink-0 w-[148px] bg-[#eef3f8] rounded-2xl overflow-hidden text-left">
                    <img src="${lhEsc(item.image || '')}" class="w-full h-[86px] object-cover bg-slate-100" alt="">
                    <div class="p-2.5">
                        <span class="lh-fmt ${meta.cls}">${meta.label}</span>
                        <p class="text-[12px] font-extrabold text-slate-900 leading-snug mt-1.5 line-clamp-3">${lhEsc(item.title)}</p>
                    </div>
                </button>`;
            }
            return `<article onclick="openLifehackArticle('${item.id}')" class="lh-row cursor-pointer active:scale-[0.99] transition-transform">
                <img src="${lhEsc(item.image || '')}" alt="" class="lh-row-img">
                <div class="min-w-0 flex-1 py-0.5">
                    <div class="flex items-center gap-1.5">
                        <span class="lh-fmt ${meta.cls}">${meta.label}</span>
                        <span class="text-[10px] font-bold text-slate-400">${lhEsc(item.category || '')}</span>
                    </div>
                    <h4 class="font-extrabold text-[13px] text-slate-900 leading-snug mt-1 line-clamp-2">${lhEsc(item.title)}</h4>
                    <p class="text-[11px] font-bold text-[#1e6091] mt-1">${action}${mins ? ' · ' + mins : ''}${item.productIds && item.productIds.length ? ' · товары' : ''}</p>
                </div>
                <button type="button" onclick="event.stopPropagation(); toggleLifehackSave('${item.id}')" class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 self-start ${saved ? 'text-[#1e6091]' : 'text-slate-400'}">${lifehackBookmarkSvg(saved)}</button>
            </article>`;
        }
        function renderLifehacksHome() {
            const box = document.getElementById('lifehacks-home-preview');
            const wrap = document.getElementById('lifehacks-home-wrap');
            if (!box) return;
            const list = publishedLifehacks().slice(0, 6);
            if (wrap) wrap.classList.toggle('hidden', !list.length);
            box.innerHTML = list.map(function (item) { return lifehackCardHtml(item, 'home'); }).join('');
        }
        function renderLifehacksChips() {
            const box = document.getElementById('lifehacks-cat-chips');
            if (!box) return;
            const cats = ['all'].concat(lifehackCategories);
            box.innerHTML = cats.map(function (c) {
                const active = lifehackActiveCat === c;
                const label = c === 'all' ? 'Все темы' : c;
                const cls = active ? 'bg-[#1e6091] text-white border border-[#1e6091]' : 'bg-white text-slate-600 border border-slate-200';
                return `<button type="button" onclick="filterLifehacksCat('${c.replace(/'/g, '\\\'')}')" class="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold ${cls}">${lhEsc(label)}</button>`;
            }).join('');
        }
        function renderLifehacksFormatChips() {
            const box = document.getElementById('lifehacks-fmt-chips');
            if (!box) return;
            const chips = [
                { id: 'all', label: 'Все' },
                { id: 'error', label: 'Ошибки' },
                { id: 'estimate', label: 'Сметы' },
                { id: 'checklist', label: 'Чеклисты' },
                { id: 'poll', label: 'Опросы' },
                { id: 'saved', label: 'Мои' }
            ];
            box.innerHTML = chips.map(function (c) {
                const active = lifehackActiveFormat === c.id;
                return `<button type="button" data-fmt="${c.id}" onclick="filterLifehacksFormat('${c.id}')" class="lh-fmt-tile${active ? ' on' : ''}"><span>${c.label}</span></button>`;
            }).join('');
        }
        function filterLifehacksFormat(fmt) {
            lifehackActiveFormat = fmt || 'all';
            renderLifehacksFeed();
        }
        function filterLifehacksCat(cat) {
            lifehackActiveCat = cat || 'all';
            renderLifehacksFeed();
        }
        function lifehacksHotItem() {
            if (lifehackActiveFormat !== 'all' || (lifehackActiveCat && lifehackActiveCat !== 'all')) return null;
            const list = publishedLifehacks();
            return list.find(function (x) { return x.featured; }) || list.find(function (x) { return x.format === 'poll'; }) || null;
        }
        function lhDailyTip() {
            const tips = LH_DAILY_TIPS || [];
            if (!tips.length) return null;
            const day = Math.floor(Date.now() / 86400000);
            return tips[day % tips.length];
        }
        function renderLifehacksDaily() {
            const box = document.getElementById('lifehacks-daily');
            if (!box) return;
            if (lifehackActiveFormat !== 'all' || (lifehackActiveCat && lifehackActiveCat !== 'all')) { box.innerHTML = ''; return; }
            const tip = lhDailyTip();
            if (!tip) { box.innerHTML = ''; return; }
            const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
            box.innerHTML = `<button type="button" onclick="openLifehackArticle('${tip.id}')" class="lh-daily">
                <span class="lh-daily-k">Совет дня · ${lhEsc(today)}</span>
                <h4>${lhEsc(tip.title)}</h4>
                <p>${lhEsc(tip.text)}</p>
                <span class="lh-daily-cta">Открыть разбор</span>
            </button>`;
        }
        function renderLifehacksFacts() {
            const box = document.getElementById('lifehacks-facts');
            if (!box) return;
            if (lifehackActiveFormat !== 'all' || (lifehackActiveCat && lifehackActiveCat !== 'all')) { box.innerHTML = ''; return; }
            box.innerHTML = `<div class="lh-facts">${(LH_FACTS || []).map(function (f) {
                return `<button type="button" class="lh-fact" onclick="openLifehackArticle('${f.id}')"><b>${lhEsc(f.k)}</b><span>${lhEsc(f.v)}</span></button>`;
            }).join('')}</div>`;
        }
        function renderLifehacksHot() {
            const box = document.getElementById('lifehacks-hot');
            if (!box) return;
            const hot = lifehacksHotItem();
            if (!hot) { box.innerHTML = ''; return; }
            box.innerHTML = lifehackCardHtml(hot, 'hero');
        }
        function renderLifehacksSavedStrip() {
            const box = document.getElementById('lifehacks-saved');
            if (!box) return;
            if (lifehackActiveFormat === 'saved') { box.innerHTML = ''; return; }
            const saved = publishedLifehacks().filter(function (x) { return isLifehackSaved(x.id); }).slice(0, 6);
            if (!saved.length) { box.innerHTML = ''; return; }
            box.innerHTML = `<div>
                <div class="flex items-center justify-between mb-2">
                    <p class="text-[12px] font-bold text-slate-800">Продолжить</p>
                    <button type="button" onclick="filterLifehacksFormat('saved')" class="text-[11px] font-bold text-[#1e6091]">Все</button>
                </div>
                <div class="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    ${saved.map(function (x) {
                        return `<button type="button" onclick="openLifehackArticle('${x.id}')" class="lh-saved-story">
                            <span class="ring"><img src="${lhEsc(x.image || '')}" alt=""></span>
                            <span class="block text-[10px] font-bold text-slate-700 leading-snug mt-1.5 line-clamp-2">${lhEsc(lhFormatMeta(x).label)}</span>
                        </button>`;
                    }).join('')}
                </div>
            </div>`;
        }
        function renderLifehacksFeed() {
            renderLifehacksFormatChips();
            renderLifehacksChips();
            renderLifehacksDaily();
            renderLifehacksFacts();
            renderLifehacksHot();
            renderLifehacksSavedStrip();
            const box = document.getElementById('lifehacks-feed');
            if (!box) return;
            let list = publishedLifehacks();
            if (lifehackActiveCat && lifehackActiveCat !== 'all') {
                list = list.filter(function (x) { return x.category === lifehackActiveCat; });
            }
            list = list.filter(function (x) { return lifehackMatchesFormat(x, lifehackActiveFormat); });
            const hot = lifehacksHotItem();
            if (hot) list = list.filter(function (x) { return x.id !== hot.id; });
            box.innerHTML = list.length
                ? list.map(lifehackCardHtml).join('')
                : '<div class="text-center py-10 px-4 bg-white rounded-2xl"><p class="text-[14px] font-bold text-slate-700">В этом фильтре пока пусто</p><button type="button" onclick="filterLifehacksFormat(\'all\')" class="mt-3 text-[12px] font-bold text-[#1e6091]">Показать все лайфхаки</button></div>';
        }
        function openLifehacksCatalog(keepFilters) {
            const catalogView = document.getElementById('view-catalog');
            const dirView = document.getElementById('view-directory');
            if (catalogView && !catalogView.classList.contains('hidden')) {
                lifehackFeedOrigin = 'home';
                hideAppShellForLifehacks();
            } else if (dirView && !dirView.classList.contains('hidden')) {
                lifehackFeedOrigin = 'directory';
            }
            if (!keepFilters) {
                lifehackActiveFormat = 'all';
                lifehackActiveCat = 'all';
            }
            lifehackBackTo = 'feed';
            switchDirectoryView('lifehacks');
            renderLifehacksFeed();
        }
        function openLifehacksCatalogFiltered(fmt) {
            openLifehacksCatalog();
            filterLifehacksFormat(fmt || 'all');
        }
        function backFromLifehacksFeed() {
            if (lifehackFeedOrigin === 'home') switchTab('catalog');
            else backToDirectory();
        }
        function scrollLhSection(id) {
            const el = document.getElementById(id);
            if (!el || el.classList.contains('hidden')) return;
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        function renderLhArticleJumps(item) {
            const box = document.getElementById('lh-article-jumps');
            if (!box) return;
            const chips = [];
            if (item.checklist && item.checklist.length) chips.push({ id: 'lh-article-checklist', label: 'Чеклист' });
            if (item.estimate && item.estimate.lines) chips.push({ id: 'lh-article-estimate', label: 'Смета' });
            if (item.poll && item.poll.options) chips.push({ id: 'lh-article-poll', label: 'Опрос' });
            if (item.steps && item.steps.length) chips.push({ id: 'lh-article-steps', label: '3 шага' });
            if (item.images && item.images[0] && item.image) chips.push({ id: 'lh-article-ba', label: 'До / после' });
            if (item.productIds && item.productIds.length) chips.push({ id: 'lh-article-products', label: 'Товары' });
            if (item.assistantQuery) chips.push({ id: 'lh-article-assistant', label: 'Помощник' });
            if (!chips.length) { box.innerHTML = ''; box.classList.add('hidden'); return; }
            box.classList.remove('hidden');
            box.innerHTML = chips.map(function (c) {
                return '<button type="button" class="lh-jump" onclick="scrollLhSection(\'' + c.id + '\')">' + c.label + ' ↓</button>';
            }).join('');
        }
        function relatedLifehacks(item, n) {
            n = n || 4;
            const list = publishedLifehacks().filter(function (x) { return x.id !== item.id; });
            const same = list.filter(function (x) { return x.category === item.category || x.format === item.format; });
            const rest = list.filter(function (x) { return same.indexOf(x) < 0; });
            return same.concat(rest).slice(0, n);
        }
        function renderLhRelated(item) {
            const box = document.getElementById('lh-article-related');
            if (!box) return;
            const list = relatedLifehacks(item, 4);
            if (!list.length) { box.innerHTML = ''; return; }
            box.innerHTML = '<p class="text-[13px] font-extrabold text-slate-900 mb-2">Ещё по теме</p><div class="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">' +
                list.map(function (x) { return lifehackCardHtml(x, 'related'); }).join('') + '</div>';
        }
        function nextLifehackItem(item) {
            const list = publishedLifehacks();
            if (!list.length) return null;
            const i = list.findIndex(function (x) { return x.id === item.id; });
            return list[(i + 1) % list.length];
        }
        function renderLhNext(item) {
            const box = document.getElementById('lh-article-next');
            if (!box) return;
            const next = nextLifehackItem(item);
            if (!next || next.id === item.id) { box.innerHTML = ''; return; }
            const meta = lhFormatMeta(next);
            box.innerHTML = '<button type="button" class="lh-next active:scale-[0.99] transition-transform" onclick="openLifehackArticle(\'' + next.id + '\')">' +
                '<p class="text-[11px] font-bold text-white/70">Дальше · ' + lhEsc(meta.label) + '</p>' +
                '<p class="text-[14px] font-extrabold mt-1 leading-snug">' + lhEsc(next.title) + '</p></button>';
        }
        function openLifehackArticle(id) {
            const item = (lifehacksDb || []).find(function (x) { return x.id === id; });
            if (!item) return;
            currentLifehackId = id;
            const catalogView = document.getElementById('view-catalog');
            const feed = document.getElementById('subview-lifehacks');
            const pageAlready = document.getElementById('subview-lifehack-article');
            const onHome = catalogView && !catalogView.classList.contains('hidden');
            const onFeed = feed && !feed.classList.contains('hidden');
            const onArticle = pageAlready && !pageAlready.classList.contains('hidden');
            if (onFeed) lifehackBackTo = 'feed';
            else if (onHome) lifehackBackTo = 'home';
            else if (!onArticle) lifehackBackTo = 'directory';
            hideAppShellForLifehacks();
            const dirView = document.getElementById('view-directory');
            if (dirView) dirView.classList.add('hidden');
            const subviews = ['product_categories', 'shops', 'specialists', 'spec-private', 'spec-companies', 'spectech', 'landscaping', 'other', 'other-profiles', 'designers', 'companies', 'jobs', 'calculator', 'specific-calc', 'realestate', 're-agencies', 're-commercial', 're-catalog', 'building_materials', 'finishing_materials', 'furniture', 'plumbing', 'accessories', 'landscape', 'tools', 'lifehacks', 'lifehack-article'];
            subviews.forEach(function (sv) {
                const el = document.getElementById('subview-' + sv);
                if (el) el.classList.add('hidden');
            });
            const page = document.getElementById('subview-lifehack-article');
            if (page) page.classList.remove('hidden');
            document.getElementById('lh-article-image').src = item.image || '';
            document.getElementById('lh-article-cat').textContent = item.category || '';
            document.getElementById('lh-article-date').textContent = formatLifehackDate(item.date);
            document.getElementById('lh-article-read').textContent = item.readMins ? item.readMins + ' мин' : '';
            const readSep = document.getElementById('lh-article-read-sep');
            if (readSep) readSep.classList.toggle('hidden', !(item.date && item.readMins));
            document.getElementById('lh-article-title').textContent = item.title || '';
            document.getElementById('lh-article-excerpt').textContent = item.excerpt || '';
            const body = document.getElementById('lh-article-body');
            const paras = String(item.body || '').split(/\n\n+/).filter(Boolean);
            body.innerHTML = paras.map(function (p) { return '<p>' + lhEsc(p).replace(/\n/g, '<br>') + '</p>'; }).join('');
            const gal = document.getElementById('lh-article-gallery');
            const extra = Array.isArray(item.images) ? item.images.filter(Boolean) : [];
            const hasBa = extra.length && item.image;
            gal.innerHTML = extra.slice(hasBa ? 1 : 0).map(function (src) {
                return '<img src="' + lhEsc(src) + '" class="w-full rounded-2xl object-cover bg-slate-100" alt="">';
            }).join('');
            const fmtEl = document.getElementById('lh-article-fmt');
            if (fmtEl) {
                const meta = lhFormatMeta(item);
                fmtEl.className = 'lh-fmt ' + meta.cls;
                fmtEl.textContent = meta.label;
                fmtEl.classList.remove('hidden');
            }
            renderLhArticleJumps(item);
            renderLhArticleBa(item);
            renderLhArticleSteps(item);
            renderLhArticleChecklist(item);
            renderLhArticleEstimate(item);
            renderLhArticlePoll(item);
            renderLhArticleProducts(item);
            renderLhArticleAssistant(item);
            renderLhArticleReact(item);
            renderLhRelated(item);
            renderLhNext(item);
            refreshLifehackArticleSave();
            const scroll = document.getElementById('main-scroll-container');
            if (scroll) scroll.scrollTop = 0;
        }
        function renderLhArticleSteps(item) {
            const box = document.getElementById('lh-article-steps');
            if (!box) return;
            const steps = item.steps || [];
            if (!steps.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
            box.classList.remove('hidden');
            box.innerHTML = '<div class="rounded-2xl border border-slate-100 bg-[#f8fbfe] p-3.5 space-y-3">' +
                '<p class="text-[13px] font-extrabold text-slate-900">За 3 шага</p>' +
                steps.map(function (s, i) {
                    return '<div class="lh-step"><span class="lh-step-n">' + (i + 1) + '</span><span class="min-w-0"><span class="block text-[13px] font-extrabold text-slate-900">' + lhEsc(s.t) + '</span><span class="block text-[12px] text-slate-500 mt-0.5 leading-snug">' + lhEsc(s.d) + '</span></span></div>';
                }).join('') + '</div>';
        }
        function renderLhArticleBa(item) {
            const box = document.getElementById('lh-article-ba');
            if (!box) return;
            const before = item.images && item.images[0];
            const after = item.image;
            if (!before || !after) { box.classList.add('hidden'); box.innerHTML = ''; return; }
            lhBaOn = false;
            box.classList.remove('hidden');
            box.innerHTML = '<button type="button" class="lh-ba" onclick="toggleLhBa()">' +
                '<img id="lh-ba-img" src="' + lhEsc(before) + '" alt="">' +
                '<span id="lh-ba-tag" class="lh-ba-tag">До</span>' +
                '<span class="lh-ba-hint">Нажми · после</span></button>';
            window._lhBaBefore = before;
            window._lhBaAfter = after;
        }
        function toggleLhBa() {
            lhBaOn = !lhBaOn;
            const img = document.getElementById('lh-ba-img');
            const tag = document.getElementById('lh-ba-tag');
            const hint = document.querySelector('#lh-article-ba .lh-ba-hint');
            if (img) img.src = lhBaOn ? (window._lhBaAfter || '') : (window._lhBaBefore || '');
            if (tag) tag.textContent = lhBaOn ? 'После' : 'До';
            if (hint) hint.textContent = lhBaOn ? 'Нажми · до' : 'Нажми · после';
        }
        function renderLhArticleReact(item) {
            const box = document.getElementById('lh-article-react');
            if (!box) return;
            const mine = !!lhUsefulMine[item.id];
            const n = lhUsefulCounts[item.id] || 0;
            box.innerHTML = '<button type="button" class="lh-react' + (mine ? ' on' : '') + '" onclick="toggleLhUseful(\'' + item.id + '\')">' +
                '<span>' + (mine ? 'Сработало для вас' : 'Это сработало') + '</span>' +
                '<span>' + n + '</span></button>';
        }
        function toggleLhUseful(id) {
            if (lhUsefulMine[id]) {
                lhUsefulMine[id] = false;
                lhUsefulCounts[id] = Math.max(0, (lhUsefulCounts[id] || 0) - 1);
            } else {
                lhUsefulMine[id] = true;
                lhUsefulCounts[id] = (lhUsefulCounts[id] || 0) + 1;
            }
            persistLhEngage();
            const item = (lifehacksDb || []).find(function (x) { return x.id === id; });
            if (item) renderLhArticleReact(item);
        }
        function lhProductCardHtml(prod, extra) {
            if (!prod) return '';
            extra = extra || '';
            return `<button type="button" onclick="event.stopPropagation(); openProductFromLifehack('${prod.id}')" class="w-full flex gap-3 p-2 bg-white border border-slate-100 rounded-2xl text-left shadow-sm active:scale-[0.99] transition-transform">
                <img src="${lhEsc(prod.image || '')}" class="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0" alt="">
                <div class="min-w-0 flex-1">
                    <p class="text-[13px] font-bold text-slate-900 line-clamp-2 leading-snug">${lhEsc(prod.title)}</p>
                    <p class="text-[14px] font-extrabold text-[#1e6091] mt-0.5">${lhEsc(prod.price || '')}</p>
                    <p class="text-[11px] text-slate-400">${lhEsc(prod.store || '')}${extra ? ' · ' + lhEsc(extra) : ''}</p>
                </div>
            </button>`;
        }
        function openProductFromLifehack(id) {
            const pm = document.getElementById('product-modal');
            if (pm) pm.style.zIndex = '150';
            if (typeof openProductModal === 'function') openProductModal(id);
        }
        function renderLhArticleProducts(item) {
            const box = document.getElementById('lh-article-products');
            if (!box) return;
            const cards = (item.productIds || []).map(lhGetProduct).filter(Boolean);
            if (!cards.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
            box.classList.remove('hidden');
            box.innerHTML = '<p class="text-[13px] font-extrabold text-slate-900">Купить из каталога</p>' +
                cards.map(function (p) { return lhProductCardHtml(p, p.category); }).join('');
        }
        function renderLhArticleChecklist(item) {
            const box = document.getElementById('lh-article-checklist');
            if (!box) return;
            const list = item.checklist || [];
            if (!list.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
            const st = lhCheckState[item.id] || {};
            const done = list.filter(function (c) { return st[c.id]; }).length;
            const pct = list.length ? Math.round(done * 100 / list.length) : 0;
            box.classList.remove('hidden');
            box.innerHTML = '<div class="rounded-2xl border border-slate-100 bg-[#f8fbfe] p-3 space-y-2">' +
                '<div class="flex items-center justify-between"><p class="text-[13px] font-extrabold text-slate-900">Чеклист</p><p class="text-[11px] font-bold text-[#1e6091]">' + done + ' / ' + list.length + '</p></div>' +
                '<div class="lh-progress"><div style="width:' + pct + '%"></div></div>' +
                list.map(function (c) {
                    const on = !!st[c.id];
                    const prod = c.productId ? lhGetProduct(c.productId) : null;
                    const prodBit = prod
                        ? ('<span class="block text-[11px] text-[#1e6091] font-bold mt-1" data-pid="' + prod.id + '">' + lhEsc(prod.title) + ' →</span>')
                        : '';
                    return '<button type="button" class="lh-check-row' + (on ? ' on' : '') + '" data-aid="' + item.id + '" data-cid="' + c.id + '">' +
                        '<span class="lh-check-box">' + (on ? '✓' : '') + '</span><span class="min-w-0 flex-1"><span class="block text-[13px] font-semibold text-slate-800 leading-snug">' + lhEsc(c.text) + '</span>' + prodBit + '</span></button>';
                }).join('') + '</div>';
            box.querySelectorAll('.lh-check-row').forEach(function (btn) {
                btn.onclick = function (e) {
                    const pid = e.target && e.target.getAttribute && e.target.getAttribute('data-pid');
                    if (pid) { e.stopPropagation(); openProductFromLifehack(pid); return; }
                    toggleLifehackCheck(btn.getAttribute('data-aid'), btn.getAttribute('data-cid'));
                };
            });
        }
        function toggleLifehackCheck(articleId, checkId) {
            if (!lhCheckState[articleId]) lhCheckState[articleId] = {};
            lhCheckState[articleId][checkId] = !lhCheckState[articleId][checkId];
            persistLhEngage();
            const item = (lifehacksDb || []).find(function (x) { return x.id === articleId; });
            if (item) renderLhArticleChecklist(item);
            if (!isLifehackSaved(articleId)) toggleLifehackSave(articleId);
        }
        function renderLhArticleEstimate(item) {
            const box = document.getElementById('lh-article-estimate');
            if (!box) return;
            const est = item.estimate;
            if (!est || !est.lines || !est.lines.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }
            let total = 0;
            const rows = est.lines.map(function (line) {
                const p = lhGetProduct(line.productId);
                if (!p) return '';
                const price = (typeof parsePrice === 'function' ? parsePrice(p.price) : parseInt(String(p.price || '').replace(/\D/g, ''), 10) || 0);
                const qty = line.qty || 1;
                total += price * qty;
                return lhProductCardHtml(p, (qty > 1 ? qty + ' шт' : '') + (line.note ? ' · ' + line.note : ''));
            }).join('');
            box.classList.remove('hidden');
            box.innerHTML = '<div class="rounded-2xl border border-orange-100 bg-orange-50/60 p-3 space-y-2">' +
                '<div class="flex items-start justify-between gap-2"><div><p class="text-[11px] font-extrabold text-orange-700 uppercase tracking-wide">Смета</p>' +
                '<p class="text-[14px] font-extrabold text-slate-900 mt-0.5">' + lhEsc(est.title || 'Набор из каталога') + '</p></div>' +
                '<p class="text-[14px] font-extrabold text-[#1e6091] whitespace-nowrap">' + total.toLocaleString('ru-RU') + ' ₽</p></div>' +
                rows +
                '<button type="button" onclick="addLifehackEstimateToCart(\'' + item.id + '\')" class="w-full bg-[#1e6091] text-white font-bold text-[13px] py-2.5 rounded-xl active:scale-[0.98]">Собрать в корзину</button>' +
                (est.calc ? '<button type="button" onclick="openLifehackCalc()" class="w-full bg-white border border-slate-200 text-slate-700 font-bold text-[12px] py-2.5 rounded-xl">Открыть калькулятор</button>' : '') +
                '</div>';
            window._lhCalcName = est.calc || '';
        }
        function addLifehackEstimateToCart(id) {
            const item = (lifehacksDb || []).find(function (x) { return x.id === id; });
            if (!item || !item.estimate) return;
            if (typeof loadCart === 'function') loadCart();
            const items = typeof getCartItems === 'function' ? getCartItems() : (state.cart || []);
            (item.estimate.lines || []).forEach(function (line) {
                const p = lhGetProduct(line.productId);
                if (!p) return;
                const n = line.qty || 1;
                const existing = items.find(function (i) { return i.productId === line.productId; });
                if (existing) existing.qty = (existing.qty || 1) + n;
                else items.push({ productId: p.id, storeId: p.store, qty: n, priceSnapshot: (typeof parsePrice === 'function' ? parsePrice(p.price) : 0), titleSnapshot: p.title, image: p.image });
            });
            state.cart = items;
            if (typeof saveCart === 'function') saveCart();
            if (typeof refreshCartSurfaces === 'function') refreshCartSurfaces();
            showSmsToast('Смета добавлена в корзину');
        }
        function openLifehackCalc() {
            const name = window._lhCalcName;
            if (!name || typeof openSpecificCalc !== 'function') return;
            hideAppShellForLifehacks();
            switchDirectoryView('calculator');
            openSpecificCalc(name);
        }
        function renderLhArticlePoll(item) {
            const box = document.getElementById('lh-article-poll');
            if (!box) return;
            const poll = item.poll;
            if (!poll || !poll.options) { box.classList.add('hidden'); box.innerHTML = ''; return; }
            const counts = lhPollCounts[poll.id] || {};
            const total = poll.options.reduce(function (s, o) { return s + (counts[o.id] || 0); }, 0) || 1;
            const mine = lhPollVotes[poll.id];
            box.classList.remove('hidden');
            box.innerHTML = '<div class="rounded-2xl border border-violet-100 bg-[#f5f3ff] p-3">' +
                '<p class="text-[11px] font-extrabold text-violet-700 uppercase tracking-wide mb-1">Опрос</p><p class="text-[15px] font-extrabold text-slate-900 mb-2">' + lhEsc(poll.question) + '</p>' +
                poll.options.map(function (o) {
                    const n = counts[o.id] || 0;
                    const pct = Math.round(n * 100 / total);
                    const picked = mine === o.id;
                    return '<button type="button" class="lh-poll-opt' + (picked ? ' picked' : '') + ' mb-2" data-poll="' + poll.id + '" data-opt="' + o.id + '">' +
                        '<div class="flex justify-between text-[13px] font-semibold text-slate-800"><span>' + lhEsc(o.label) + '</span><span class="text-[#1e6091]">' + pct + '%</span></div>' +
                        '<div class="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-[#1e6091] rounded-full" style="width:' + pct + '%"></div></div></button>';
                }).join('') +
                (mine ? '<p class="text-[12px] text-slate-500">Ваш голос учтён. Ниже — материалы из каталога.</p>' : '<p class="text-[12px] text-slate-500">Один тап — увидите, как голосуют другие.</p>') +
                '</div>';
            box.querySelectorAll('.lh-poll-opt').forEach(function (btn) {
                btn.onclick = function () { voteLifehackPoll(btn.getAttribute('data-poll'), btn.getAttribute('data-opt')); };
            });
        }
        function voteLifehackPoll(pollId, optId) {
            const prev = lhPollVotes[pollId];
            if (prev === optId) return;
            if (!lhPollCounts[pollId]) lhPollCounts[pollId] = {};
            if (prev) lhPollCounts[pollId][prev] = Math.max(0, (lhPollCounts[pollId][prev] || 0) - 1);
            lhPollCounts[pollId][optId] = (lhPollCounts[pollId][optId] || 0) + 1;
            lhPollVotes[pollId] = optId;
            persistLhEngage();
            const item = (lifehacksDb || []).find(function (x) { return x.poll && x.poll.id === pollId; });
            if (item) renderLhArticlePoll(item);
        }
        function renderLhArticleAssistant(item) {
            const box = document.getElementById('lh-article-assistant');
            if (!box) return;
            if (!item.assistantQuery) { box.classList.add('hidden'); box.innerHTML = ''; return; }
            box.classList.remove('hidden');
            box.innerHTML = '<button type="button" id="lh-ask-ai" class="w-full flex items-center gap-3 bg-[#1e6091] text-white rounded-2xl px-4 py-3 active:scale-[0.98] transition-transform">' +
                '<span class="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg></span>' +
                '<span class="text-left min-w-0"><span class="block text-[13px] font-bold">Спросить умного помощника</span><span class="block text-[11px] text-white/80 mt-0.5">Подберёт товары по этой теме</span></span></button>';
            const b = document.getElementById('lh-ask-ai');
            if (b) b.onclick = function () { askAssistantFromLifehack(item.assistantQuery); };
        }
        function askAssistantFromLifehack(query) {
            if (typeof openAssistant === 'function') openAssistant();
            const inp = document.getElementById('assistant-input');
            if (inp) inp.value = query || '';
            if (typeof sendAssistantQuery === 'function') sendAssistantQuery();
        }
        function backFromLifehackArticle() {
            const page = document.getElementById('subview-lifehack-article');
            if (page) page.classList.add('hidden');
            if (lifehackBackTo === 'home') switchTab('catalog');
            else if (lifehackBackTo === 'directory') backToDirectory();
            else openLifehacksCatalog(true);
        }
        function refreshLifehackArticleSave() {
            const btn = document.getElementById('lh-article-save');
            if (!btn || !currentLifehackId) return;
            const saved = isLifehackSaved(currentLifehackId);
            btn.className = 'lh-article-icon ' + (saved ? 'text-[#1e6091]' : 'text-slate-400');
            btn.innerHTML = lifehackBookmarkSvg(saved);
        }
        function toggleLifehackSave(id) {
            const i = lifehackSavedIds.indexOf(id);
            if (i >= 0) lifehackSavedIds.splice(i, 1);
            else lifehackSavedIds.push(id);
            persistLifehackSaved();
            renderLifehacksHome();
            const feedEl = document.getElementById('subview-lifehacks');
            if (feedEl && !feedEl.classList.contains('hidden')) renderLifehacksFeed();
            if (currentLifehackId === id) refreshLifehackArticleSave();
        }
        function toggleLifehackSaveFromArticle() {
            if (currentLifehackId) toggleLifehackSave(currentLifehackId);
        }
        function shareLifehackFromArticle() {
            const item = (lifehacksDb || []).find(function (x) { return x.id === currentLifehackId; });
            if (!item) return;
            const url = location.href.split('#')[0] + '#lh-' + item.id;
            if (navigator.share) {
                navigator.share({ title: item.title, text: item.excerpt || item.title, url: url }).catch(function () {});
                return;
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(function () { showSmsToast('Ссылка скопирована'); }).catch(function () { showSmsToast(url); });
            } else showSmsToast('Скопируйте ссылку: ' + url);
        }
        function fillLifehackCatSelect(selected) {
            const sel = document.getElementById('lh-editor-cat');
            if (!sel) return;
            sel.innerHTML = lifehackCategories.map(function (c) {
                return '<option value="' + lhEsc(c) + '"' + (c === selected ? ' selected' : '') + '>' + lhEsc(c) + '</option>';
            }).join('');
        }
        function renderLhEditorGallery() {
            const box = document.getElementById('lh-editor-gallery');
            if (!box) return;
            box.innerHTML = lifehackEditorGallery.map(function (src, i) {
                return '<div class="relative"><img src="' + lhEsc(src) + '" class="w-full h-16 object-cover rounded-lg bg-slate-100"><button type="button" onclick="removeLifehackGalleryImg(' + i + ')" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px]">×</button></div>';
            }).join('');
        }
        function removeLifehackGalleryImg(i) {
            lifehackEditorGallery.splice(i, 1);
            renderLhEditorGallery();
        }
        function handleLifehackCoverUpload(event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                document.getElementById('lh-editor-image').value = ev.target.result;
                document.getElementById('lh-editor-preview').src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
        function handleLifehackGalleryUpload(event) {
            const files = event.target.files;
            if (!files) return;
            Array.prototype.forEach.call(files, function (file) {
                const reader = new FileReader();
                reader.onload = function (ev) {
                    lifehackEditorGallery.push(ev.target.result);
                    renderLhEditorGallery();
                };
                reader.readAsDataURL(file);
            });
        }
        function addLifehackCategoryFromAdmin() {
            const inp = document.getElementById('lh-new-cat');
            const name = (inp && inp.value || '').trim();
            if (!name) return showSmsToast('Введите название категории');
            if (lifehackCategories.indexOf(name) < 0) lifehackCategories.push(name);
            if (inp) inp.value = '';
            fillLifehackCatSelect(name);
            saveAllData();
            renderLifehacksFeed();
            showSmsToast('Категория добавлена');
        }
        function renderCrmLifehackList() {
            const box = document.getElementById('crm-lifehack-list');
            if (!box) return;
            const list = (lifehacksDb || []).slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
            box.innerHTML = list.map(function (item, idx) {
                const st = item.status === 'published' ? 'Опубл.' : 'Скрыто';
                return `<div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                    <img src="${lhEsc(item.image || '')}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">
                    <div class="flex-1 min-w-0">
                        <h5 class="font-bold text-xs text-slate-800 truncate">${lhEsc(item.title)}</h5>
                        <p class="text-[10px] text-slate-400 truncate">${lhEsc(item.category)} · ${st}</p>
                    </div>
                    <div class="flex flex-col gap-1 shrink-0">
                        <div class="flex gap-1">
                            <button onclick="moveLifehack('${item.id}', -1)" class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg" ${idx === 0 ? 'disabled' : ''}>↑</button>
                            <button onclick="moveLifehack('${item.id}', 1)" class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg">↓</button>
                        </div>
                        <button onclick="openLifehackEditor('${item.id}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Изменить</button>
                        <button onclick="deleteLifehack('${item.id}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                    </div>
                </div>`;
            }).join('') || '<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Публикаций нет</p>';
        }
        function openLifehackEditor(id) {
            const editor = document.getElementById('lifehack-editor');
            const item = id && (lifehacksDb || []).find(function (x) { return x.id === id; });
            document.getElementById('lh-editor-title').innerText = item ? 'Редактировать публикацию' : 'Новая публикация';
            document.getElementById('lh-editor-id').value = item ? item.id : '';
            document.getElementById('lh-editor-name').value = item ? (item.title || '') : '';
            document.getElementById('lh-editor-excerpt').value = item ? (item.excerpt || '') : '';
            document.getElementById('lh-editor-body').value = item ? (item.body || '') : '';
            document.getElementById('lh-editor-date').value = item && item.date ? item.date : new Date().toISOString().slice(0, 10);
            document.getElementById('lh-editor-read').value = item && item.readMins ? item.readMins : 5;
            document.getElementById('lh-editor-status').value = item ? (item.status || 'published') : 'published';
            document.getElementById('lh-editor-image').value = item ? (item.image || '') : '';
            document.getElementById('lh-editor-preview').src = item ? (item.image || '') : '';
            lifehackEditorGallery = item && Array.isArray(item.images) ? item.images.slice() : [];
            fillLifehackCatSelect(item ? item.category : lifehackCategories[0]);
            renderLhEditorGallery();
            editor.classList.remove('hidden');
            editor.classList.add('flex');
        }
        function closeLifehackEditor() {
            const editor = document.getElementById('lifehack-editor');
            editor.classList.add('hidden');
            editor.classList.remove('flex');
        }
        function saveLifehackFromEditor() {
            const title = document.getElementById('lh-editor-name').value.trim();
            if (!title) return showSmsToast('Укажите заголовок');
            const id = document.getElementById('lh-editor-id').value || ('lh-' + Date.now());
            const existing = lifehacksDb.find(function (x) { return x.id === id; });
            const payload = {
                id: id,
                order: existing && existing.order != null ? existing.order : (lifehacksDb.length + 1),
                status: document.getElementById('lh-editor-status').value || 'published',
                category: document.getElementById('lh-editor-cat').value || lifehackCategories[0],
                date: document.getElementById('lh-editor-date').value || new Date().toISOString().slice(0, 10),
                readMins: parseInt(document.getElementById('lh-editor-read').value, 10) || 5,
                title: title,
                excerpt: document.getElementById('lh-editor-excerpt').value.trim(),
                body: document.getElementById('lh-editor-body').value,
                image: document.getElementById('lh-editor-image').value,
                images: lifehackEditorGallery.slice(),
                format: existing && existing.format ? existing.format : 'article',
                productIds: existing && existing.productIds ? existing.productIds : [],
                checklist: existing && existing.checklist ? existing.checklist : undefined,
                estimate: existing && existing.estimate ? existing.estimate : undefined,
                poll: existing && existing.poll ? existing.poll : undefined,
                assistantQuery: existing && existing.assistantQuery ? existing.assistantQuery : '',
                featured: existing && existing.featured
            };
            if (existing) Object.assign(existing, payload);
            else lifehacksDb.push(payload);
            closeLifehackEditor();
            renderCrmLifehackList();
            renderLifehacksHome();
            renderLifehacksFeed();
            updateAdminStats();
            saveAllData();
            showSmsToast('Публикация сохранена');
        }
        function deleteLifehack(id) {
            lifehacksDb = lifehacksDb.filter(function (x) { return x.id !== id; });
            renderCrmLifehackList();
            renderLifehacksHome();
            renderLifehacksFeed();
            updateAdminStats();
            saveAllData();
            showSmsToast('Публикация удалена');
        }
        function moveLifehack(id, dir) {
            const list = lifehacksDb.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
            const i = list.findIndex(function (x) { return x.id === id; });
            const j = i + dir;
            if (i < 0 || j < 0 || j >= list.length) return;
            const tmp = list[i].order;
            list[i].order = list[j].order;
            list[j].order = tmp;
            if (list[i].order === list[j].order) {
                list.forEach(function (x, idx) { x.order = idx + 1; });
            }
            renderCrmLifehackList();
            renderLifehacksHome();
            saveAllData();
        }

        // ========== УПРАВЛЕНИЕ МАГАЗИНАМИ ==========
        function renderCrmShopList() {
            let html = '';
            for (const name in shopsProfileDb) {
                const s = shopsProfileDb[name];
                html += `
                    <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                        <img src="${s.banner}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">
                        <div class="flex-1 min-w-0">
                            <h5 class="font-bold text-xs text-slate-800 truncate">${s.name}</h5>
                            <p class="text-[10px] text-slate-400 truncate">${s.address || ''}</p>
                        </div>
                        <div class="flex flex-col gap-1 shrink-0">
                            <button onclick="openShopEditor('${name}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                            <button onclick="deleteShop('${name}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                        </div>
                    </div>`;
            }
            document.getElementById('crm-shop-list').innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Магазинов нет</p>`;
        }

                // === ЗАГРУЗКА БАННЕРА МАГАЗИНА С УСТРОЙСТВА ===
        function handleShopBannerUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                // Записываем картинку (base64) в скрытое поле
                document.getElementById('shop-editor-banner').value = ev.target.result;
                // Показываем превью
                document.getElementById('shop-editor-preview').src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }

        // === ЗАГРУЗКА ЛОГОТИПА МАГАЗИНА С УСТРОЙСТВА ===
        function handleShopLogoUpload(event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                document.getElementById('shop-editor-logo').value = ev.target.result;
                document.getElementById('shop-editor-logo-preview').src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }

                // === ВРЕМЕННОЕ ХРАНИЛИЩЕ ФОТО/ВИДЕО ГАЛЕРЕИ (пока форма открыта) ===
        let shopEditorGallery = [];

        // === ЗАГРУЗКА НЕСКОЛЬКИХ ФОТО/ВИДЕО ГАЛЕРЕИ С УСТРОЙСТВА ===
        function handleShopGalleryUpload(event) {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onload = function (ev) {
                    shopEditorGallery.push(ev.target.result); // сохраняем как base64
                    renderShopGalleryPreviews();
                };
                reader.readAsDataURL(file);
            }
            event.target.value = ''; // очищаем, чтобы можно было выбрать те же файлы снова
        }

        // === ПРЕВЬЮ ЗАГРУЖЕННЫХ ФОТО/ВИДЕО (с кнопкой удаления) ===
        function renderShopGalleryPreviews() {
            const box = document.getElementById('shop-editor-gallery-previews');
            if (!box) return;
            let html = '';
            shopEditorGallery.forEach((src, i) => {
                const isVideo = src.startsWith('data:video') || isVideoUrl(src);
                const media = isVideo
                    ? `<video src="${src}" class="w-full h-full object-cover" muted></video><span class="absolute inset-0 flex items-center justify-center text-white text-lg pointer-events-none">▶</span>`
                    : `<img src="${src}" class="w-full h-full object-cover">`;
                html += `
                    <div class="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        ${media}
                        <button onclick="removeShopGalleryItem(${i})" class="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 text-xs flex items-center justify-center rounded-bl-lg">✕</button>
                    </div>`;
            });
            box.innerHTML = html || '<p class="text-[9px] text-slate-400">Файлы не загружены</p>';
        }

        // === УДАЛИТЬ ОДИН ФАЙЛ ИЗ ГАЛЕРЕИ ===
        function removeShopGalleryItem(index) {
            shopEditorGallery.splice(index, 1);
            renderShopGalleryPreviews();
        }

                // === ВРЕМЕННОЕ ХРАНИЛИЩЕ ФОТО "О КОМПАНИИ" (макс 3) ===
        let shopEditorAbout = [];

        // === ЗАГРУЗКА ФОТО "О КОМПАНИИ" (до 3 шт) ===
        function handleShopAboutUpload(event) {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            for (let i = 0; i < files.length; i++) {
                if (shopEditorAbout.length >= 3) {
                    alert('Можно загрузить максимум 3 фото к описанию.');
                    break;
                }
                const file = files[i];
                const reader = new FileReader();
                reader.onload = function (ev) {
                    if (shopEditorAbout.length < 3) {
                        shopEditorAbout.push(ev.target.result);
                        renderShopAboutPreviews();
                    }
                };
                reader.readAsDataURL(file);
            }
            event.target.value = ''; // сброс, чтобы можно было выбрать те же файлы снова
        }

        // === ПРЕВЬЮ ФОТО "О КОМПАНИИ" (квадратные, с кнопкой удаления) ===
        function renderShopAboutPreviews() {
            const box = document.getElementById('shop-editor-about-previews');
            if (!box) return;
            let html = '';
            shopEditorAbout.forEach((src, i) => {
                html += `
                    <div class="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        <img src="${src}" class="w-full h-full object-cover">
                        <button onclick="removeShopAboutItem(${i})" class="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 text-xs flex items-center justify-center rounded-bl-lg">✕</button>
                    </div>`;
            });
            // добавим пустые ячейки-заглушки, чтобы всегда было видно 3 квадрата
            for (let i = shopEditorAbout.length; i < 3; i++) {
                html += `<div class="aspect-square rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300 text-lg">＋</div>`;
            }
            box.innerHTML = html;
        }

        // === УДАЛИТЬ ОДНО ФОТО "О КОМПАНИИ" ===
        function removeShopAboutItem(index) {
            shopEditorAbout.splice(index, 1);
            renderShopAboutPreviews();
        }


        function openShopEditor(name) {
            const editor = document.getElementById('shop-editor');
            if (name && shopsProfileDb[name]) {
                const s = shopsProfileDb[name];
                document.getElementById('shop-editor-title').innerText = 'Редактировать магазин';
                document.getElementById('shop-editor-oldname').value = name;
                document.getElementById('shop-editor-name').value = s.name;
                document.getElementById('shop-editor-desc').value = s.description || '';
                document.getElementById('shop-editor-addr').value = s.address || '';
                document.getElementById('shop-editor-site').value = s.site || '';
                document.getElementById('shop-editor-tg').value = s.telegram || '';
                document.getElementById('shop-editor-banner').value = s.banner || '';
                document.getElementById('shop-editor-preview').src = s.banner || '';
                document.getElementById('shop-editor-logo').value = s.logo || '';
                document.getElementById('shop-editor-logo-preview').src = s.logo || '';
                                // Загружаем галерею и текст
                shopEditorGallery = Array.isArray(s.gallery) ? [...s.gallery] : [];
                document.getElementById('shop-editor-gallery-text').value = s.galleryText || '';
                                // Загружаем фото "О компании"
                shopEditorAbout = Array.isArray(s.aboutImages) ? [...s.aboutImages] : [];
            } else {
                document.getElementById('shop-editor-title').innerText = 'Новый магазин';
                document.getElementById('shop-editor-oldname').value = '';
                document.getElementById('shop-editor-name').value = '';
                document.getElementById('shop-editor-desc').value = '';
                document.getElementById('shop-editor-addr').value = '';
                document.getElementById('shop-editor-site').value = '';
                document.getElementById('shop-editor-tg').value = '';
                document.getElementById('shop-editor-banner').value = '';
                document.getElementById('shop-editor-preview').src = '';
                document.getElementById('shop-editor-logo').value = '';
                document.getElementById('shop-editor-logo-preview').src = '';
                                // Пустая галерея для нового магазина
                shopEditorGallery = [];
                document.getElementById('shop-editor-gallery-text').value = '';
                                // Пустые фото "О компании"
                shopEditorAbout = [];
            }
                        renderShopGalleryPreviews();
                                    renderShopAboutPreviews();
            editor.classList.remove('hidden');
            editor.classList.add('flex');
        }

        function closeShopEditor() {
            const editor = document.getElementById('shop-editor');
            editor.classList.add('hidden');
            editor.classList.remove('flex');
        }

        function saveShopFromEditor() {
            const oldName = document.getElementById('shop-editor-oldname').value;
            const name = document.getElementById('shop-editor-name').value.trim();
            if (!name) return showSmsToast("Введите название магазина!");

            const data = {
                name: name,
                status: 'published',
                banner: document.getElementById('shop-editor-banner').value.trim() || 'https://via.placeholder.com/600',
                description: document.getElementById('shop-editor-desc').value.trim(),
                address: document.getElementById('shop-editor-addr').value.trim(),
                site: document.getElementById('shop-editor-site').value.trim() || '#',
                telegram: document.getElementById('shop-editor-tg').value.trim() || '#',
                logo: document.getElementById('shop-editor-logo').value.trim(),
                video: (oldName && shopsProfileDb[oldName]) ? shopsProfileDb[oldName].video : '',
                gallery: [...shopEditorGallery],
                galleryText: document.getElementById('shop-editor-gallery-text').value.trim(),
                aboutImages: [...shopEditorAbout]
            };

            // если имя поменяли — удаляем старую запись
            if (oldName && oldName !== name) delete shopsProfileDb[oldName];
            shopsProfileDb[name] = data;

                        showSmsToast(oldName ? "Магазин обновлён " : "Магазин добавлен ");
            closeShopEditor();
            renderCrmShopList();
            renderDirectorySubviews();
            saveAllData();
        }

                function deleteShop(name) {
            if (!shopsProfileDb[name]) return;
            delete shopsProfileDb[name];
            showSmsToast("Магазин удалён ");
            renderCrmShopList();
            renderDirectorySubviews();
            saveAllData();
        }

        // ========== УПРАВЛЕНИЕ МАСТЕРАМИ ==========
        function renderCrmSpecList() {
            let html = '';
            directoryDb.specialists.forEach(s => {
                const img = s.avatarPhoto
                    ? `<img src="${s.avatarPhoto}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">`
                    : `<div class="w-11 h-11 rounded-lg bg-[#1e6091] text-white flex items-center justify-center font-bold shrink-0">${s.avatar || '?'}</div>`;
                html += `
                    <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                        ${img}
                        <div class="flex-1 min-w-0">
                            <h5 class="font-bold text-xs text-slate-800 truncate">${s.name}</h5>
                            <p class="text-[10px] text-slate-400 truncate">${s.title || ''}</p>
                        </div>
                        <div class="flex flex-col gap-1 shrink-0">
                            <button onclick="openSpecEditor('${s.id}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                            <button onclick="deleteSpec('${s.id}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                        </div>
                    </div>`;
            });
            document.getElementById('crm-spec-list').innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Мастеров нет</p>`;
        }

        function openSpecEditor(id) {
            const editor = document.getElementById('spec-editor');
            const spec = directoryDb.specialists.find(x => x.id === id);
            if (spec) {
                document.getElementById('spec-editor-title').innerText = 'Редактировать мастера';
                document.getElementById('spec-editor-id').value = spec.id;
                document.getElementById('spec-editor-name').value = spec.name;
                document.getElementById('spec-editor-jobtitle').value = spec.title || '';
                document.getElementById('spec-editor-desc').value = spec.description || '';
                document.getElementById('spec-editor-phone').value = spec.phone || '';
                document.getElementById('spec-editor-hours').value = spec.hours || '';
                document.getElementById('spec-editor-photo').value = spec.avatarPhoto || '';
                document.getElementById('spec-editor-preview').src = spec.avatarPhoto || '';
            } else {
                document.getElementById('spec-editor-title').innerText = 'Новый мастер';
                document.getElementById('spec-editor-id').value = '';
                document.getElementById('spec-editor-name').value = '';
                document.getElementById('spec-editor-jobtitle').value = '';
                document.getElementById('spec-editor-desc').value = '';
                document.getElementById('spec-editor-phone').value = '';
                document.getElementById('spec-editor-hours').value = '';
                document.getElementById('spec-editor-photo').value = '';
                document.getElementById('spec-editor-preview').src = '';
            }
            editor.classList.remove('hidden');
            editor.classList.add('flex');
        }

        function closeSpecEditor() {
            const editor = document.getElementById('spec-editor');
            editor.classList.add('hidden');
            editor.classList.remove('flex');
        }

        function saveSpecFromEditor() {
            const id = document.getElementById('spec-editor-id').value;
            const name = document.getElementById('spec-editor-name').value.trim();
            if (!name) return showSmsToast("Введите имя мастера!");

            const photo = document.getElementById('spec-editor-photo').value.trim();
            const fields = {
                name: name,
                title: document.getElementById('spec-editor-jobtitle').value.trim(),
                description: document.getElementById('spec-editor-desc').value.trim(),
                phone: document.getElementById('spec-editor-phone').value.trim(),
                hours: document.getElementById('spec-editor-hours').value.trim(),
                avatarPhoto: photo,
                avatar: name[0].toUpperCase()
            };

            const existing = directoryDb.specialists.find(x => x.id === id);
            if (existing) {
                Object.assign(existing, fields);
                showSmsToast("Мастер обновлён ");
            } else {
                directoryDb.specialists.push({
                    id: 'spec-' + Date.now(),
                    status: 'published',
                    prices: [],
                    gallery: [],
                    ...fields
                });
                showSmsToast("Мастер добавлен ");
            }

                        closeSpecEditor();
            renderCrmSpecList();
            renderDirectorySubviews();
            saveAllData();
        }

                function deleteSpec(id) {
            directoryDb.specialists = directoryDb.specialists.filter(x => x.id !== id);
            showSmsToast("Мастер удалён ");
            renderCrmSpecList();
            renderDirectorySubviews();
            saveAllData();
        }


                // ========== КОНТЕНТ-МЕНЕДЖЕР ТОВАРОВ ==========

        // === СПИСОК ВСЕХ ТОВАРОВ ДЛЯ АДМИНА ===
        function renderCrmProductList() {
            const q = (document.getElementById('crm-search')?.value || '').toLowerCase();
            const container = document.getElementById('crm-product-list');
            let html = '';
            for (const key in productsDb) {
                const p = productsDb[key];
                const text = (p.title + ' ' + p.store).toLowerCase();
                if (q && !text.includes(q)) continue;
                const badge = p.status === 'pending'
                    ? '<span class="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">На модерации</span>'
                    : '<span class="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">Опубликован</span>';
                html += `
                    <div class="bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                        <img src="${p.image}" class="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100">
                        <div class="flex-1 min-w-0">
                            <h5 class="font-bold text-xs text-slate-800 truncate">${p.title}</h5>
                            <p class="text-[10px] text-slate-400 truncate">${p.price} · ${p.store}</p>
                            ${badge}
                        </div>
                        <div class="flex flex-col gap-1 shrink-0">
                            <button onclick="openProductEditor('${p.id}')" class="bg-[#1e6091] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Редактировать</button>
                            <button onclick="deleteProduct('${p.id}')" class="bg-red-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Удалить</button>
                        </div>
                    </div>`;
            }
            container.innerHTML = html || `<p class="text-xs text-slate-400 p-4 text-center border-2 border-dashed rounded-xl">Товары не найдены</p>`;
        }

        // === ОТКРЫТЬ ФОРМУ (пустую для нового ИЛИ с данными для редактирования) ===
        function openProductEditor(id) {
             window.editorMode = 'admin';
            const editor = document.getElementById('product-editor');
            if (id && productsDb[id]) {
                const p = productsDb[id];
                document.getElementById('editor-title').innerText = 'Редактировать товар';
                document.getElementById('editor-prod-id').value = id;
                document.getElementById('editor-prod-title').value = p.title;
                document.getElementById('editor-prod-price').value = p.price;
                document.getElementById('editor-prod-store').value = p.store;
                setCategoryDropdown(p.category || '');
                document.getElementById('editor-prod-image').value = p.image;
            } else {
                document.getElementById('editor-title').innerText = 'Новый товар';
                document.getElementById('editor-prod-id').value = '';
                document.getElementById('editor-prod-title').value = '';
                document.getElementById('editor-prod-price').value = '';
                document.getElementById('editor-prod-store').value = '';
                setCategoryDropdown('');
                document.getElementById('editor-prod-image').value = '';
            }
            updateEditorPreview();
            editor.classList.remove('hidden');
            editor.classList.add('flex');
        }

        // === ЗАКРЫТЬ ФОРМУ ===
        function closeProductEditor() {
            const editor = document.getElementById('product-editor');
            editor.classList.add('hidden');
            editor.classList.remove('flex');
        }

        // === ПРЕВЬЮ ФОТО В ФОРМЕ ===
        function updateEditorPreview() {
            const url = document.getElementById('editor-prod-image').value;
            document.getElementById('editor-preview').src = url || 'https://via.placeholder.com/300x150?text=Фото';
        }

        
        // ========== КАСТОМНЫЙ ВЫПАДАЮЩИЙ СПИСОК КАТЕГОРИЙ ==========

        // Открыть/закрыть список
        function toggleCatDropdown(event) {
            if (event) event.stopPropagation();
            const list = document.getElementById('cat-dropdown-list');
            if (list) list.classList.toggle('hidden');
        }

        // Выбрать категорию из списка
        function pickCategory(value, label) {
            // Записываем значение в скрытое поле
            document.getElementById('editor-prod-category').value = value;
            // Показываем название на кнопке
            const labelEl = document.getElementById('cat-dropdown-label');
            labelEl.innerText = label;
            labelEl.className = 'text-slate-800'; // делаем текст тёмным (выбрано)
            // Закрываем список
            document.getElementById('cat-dropdown-list').classList.add('hidden');
        }

        // Установить категорию при открытии формы (для редактирования)
        function setCategoryDropdown(value) {
            const labelEl = document.getElementById('cat-dropdown-label');
            const hidden = document.getElementById('editor-prod-category');
            if (!labelEl || !hidden) return;

            hidden.value = value || '';

            // Карта: значение -> красивое название
            const names = {
                'кухня':'Кухня','спальня':'Спальня','гостиная':'Гостиная','ванная':'Ванная',
                'прихожая':'Прихожая','детская':'Детская','мебель':'Мебель','стройматериалы':'Стройматериалы',
                'отделочные':'Отделочные материалы','сантехника':'Сантехника','аксессуары':'Аксессуары',
                'ландшафт':'Ландшафт','освещение':'Освещение','декор':'Декор','текстиль':'Текстиль'
            };

            if (value && names[value]) {
                labelEl.innerText = names[value];
                labelEl.className = 'text-slate-800';
            } else {
                labelEl.innerText = '— Выберите категорию —';
                labelEl.className = 'text-slate-400';
            }
        }

        // Закрывать список при клике мимо него
        document.addEventListener('click', function(e) {
            // Список категорий товара
            const btn = document.getElementById('cat-dropdown-btn');
            const list = document.getElementById('cat-dropdown-list');
            if (btn && list && !btn.contains(e.target) && !list.contains(e.target)) {
                list.classList.add('hidden');
            }
            // Список магазинов в форме сториса
            const sBtn = document.getElementById('story-shop-btn');
            const sList = document.getElementById('story-shop-list');
            if (sBtn && sList && !sBtn.contains(e.target) && !sList.contains(e.target)) {
                sList.classList.add('hidden');
            }
        });

        // === СОХРАНИТЬ ТОВАР ИЗ ФОРМЫ (для админа И для магазина) ===
function saveProductFromEditor() {
    const id = document.getElementById('editor-prod-id').value;
    const title = document.getElementById('editor-prod-title').value.trim();
    const price = document.getElementById('editor-prod-price').value.trim();
    const store = document.getElementById('editor-prod-store').value.trim();
    const category = document.getElementById('editor-prod-category').value.trim();
    const image = document.getElementById('editor-prod-image').value.trim();

    if (!title || !price) return showSmsToast("Заполните название и цену!");

    // Кто сохраняет: магазин или админ?
    const isShop = (window.editorMode === 'shop');

    if (id && productsDb[id]) {
        // --- РЕДАКТИРУЕМ существующий товар ---
        productsDb[id].title = title;
        productsDb[id].price = price;
        productsDb[id].store = store;
        productsDb[id].category = category;
        productsDb[id].image = image;
        // Если правит магазин — товар снова уходит на модерацию
        if (isShop) {
            productsDb[id].status = 'pending';
            showSmsToast("Товар изменён и отправлен на модерацию ");
        } else {
            showSmsToast("Товар обновлён ");
        }
    } else {
        // --- СОЗДАЁМ новый товар ---
        const newId = 'prod-' + Date.now();
        productsDb[newId] = {
            id: newId,
            title,
            price,
            store: store || 'Магазин',
            category: category || 'мебель',
            image: image || 'https://via.placeholder.com/300',
            status: isShop ? 'pending' : 'published',  // магазин → модерация, админ → сразу
            sku: isShop ? 'SHOP' : 'ADM'
        };
        showSmsToast(isShop ? "Товар отправлен на модерацию " : "Товар добавлен ");
    }

    closeProductEditor();

    // Обновляем нужные списки в зависимости от того, кто сохранял
    if (isShop) {
        renderShopMyProducts();   // список товаров магазина
        updateShopStats();        // статистика магазина
    } else {
        renderCrmProductList();   // список товаров админа
    }

    renderProductGrid();          // главная страница приложения
    renderDirectorySubviews();    // витрины магазинов
    saveAllData();                // сохраняем в память
}

        // === УДАЛИТЬ ТОВАР ===
                function deleteProduct(id) {
            if (!productsDb[id]) return;
            delete productsDb[id];
            showSmsToast("Товар удалён ");
            renderCrmProductList();
            renderProductGrid();
            saveAllData();
        }


        // === ОТКЛОНИТЬ (УДАЛИТЬ) ЗАЯВКУ ===
                function adminRejectItem(type, id) {
            if (type === 'products') {
                delete productsDb[id];
            } else if (type === 'directory') {
                directoryDb.specialists = directoryDb.specialists.filter(x => x.id !== id);
            } else if (type === 'vacancies') {
                vacanciesDb = vacanciesDb.filter(x => x.id !== id);
            } else if (type === 'stories') {
                storiesData = storiesData.filter(x => x.id !== id);
            }
            showSmsToast("Заявка отклонена ");
            renderAdminModerationList();
            updateAdminStats();
            renderStories();
            saveAllData();
        }

                function adminApproveItem(type, id) {
            if (type === 'products') productsDb[id].status = 'published';
            else if (type === 'directory') directoryDb.specialists.find(x=>x.id===id).status = 'published';
            else if (type === 'vacancies') vacanciesDb.find(x=>x.id===id).status = 'published';
            else if (type === 'stories') { const s = storiesData.find(x=>x.id===id); if (s) s.status = 'published'; }

            showSmsToast("Одобрено и опубликовано!");
            renderAdminModerationList(); updateAdminStats(); renderProductGrid(); renderDirectorySubviews(); renderStories();
            saveAllData();
        }
