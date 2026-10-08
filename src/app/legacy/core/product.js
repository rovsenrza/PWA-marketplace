/* Карточка товара.
   Галерея, цена, характеристики, варианты, калькулятор, похожие и недавние, связь с менеджером.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


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


// Карточка товара в сетке: общая ячейка со «спинкой» магазина (src/app/ui/product-cell.ts)
function productCardHtml(prod) {
    return prod && typeof productCellHtml === 'function' ? productCellHtml(prod, 'grid') : '';
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


// Мини-карточка для лент «Похожие» и «Недавно смотрели»: общая ячейка (src/app/ui/product-cell.ts).
// Кнопки корзины нет у всего, что не товар (недвижимость), — ячейка решает это сама; commercial оставлен для вызовов.
// Сердце и корзина перерисовывают ленты через события app:favorites-changed / app:cart-changed (features/boot.js).
function pmMiniCard(prod, commercial) {
    return prod && typeof productCellHtml === 'function' ? productCellHtml(prod, 'mini') : '';
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
