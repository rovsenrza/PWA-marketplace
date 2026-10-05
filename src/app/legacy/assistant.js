/**
 * Умный помощник: локальный разбор запроса + поиск по каталогу.
 * Позже можно сменить provider на 'api' и реализовать fetch в AssistantAI.remoteAsk.
 */
(function (global) {
    var SYNONYMS = {
        штукатурка: ['штукатур', 'шпаклев', 'шпаклёв', 'гипсокарт', 'цемент', 'смес', 'отделк', 'расходн', 'профиль'],
        расходники: ['расходн', 'смес', 'цемент', 'краск', 'плитк', 'профиль', 'гипсокарт', 'кирп'],
        кровать: ['кроват', 'спальн', 'изголов'],
        матрас: ['матрас', 'основан', 'реечн', 'спального места', 'кроват'],
        кухня: ['кухн', 'столешниц', 'фасад'],
        диван: ['диван', 'гостиная', 'еврокниж'],
        шкаф: ['шкаф', 'купе', 'хранен'],
        краска: ['краск', 'фасадн', 'колер'],
        плитка: ['плитк', 'керамич', 'ванн'],
        ламинат: ['ламинат', 'пол'],
        цемент: ['цемент', 'фундамент', 'стяжк', 'клалк'],
        блок: ['газобетон', 'блок'],
        стол: ['стол', 'обеден'],
        лайфхак: ['лайфхак', 'совет', 'ремонт', 'экономи']
    };

    var CATEGORY_HINTS = [
        { keys: ['штукатур', 'цемент', 'краск', 'гипсокарт', 'профиль', 'плитк', 'ламинат', 'кирп', 'газобетон', 'расходн', 'смес', 'строй'], cat: 'стройматериалы' },
        { keys: ['кроват', 'матрас', 'шкаф', 'комод', 'спальн'], cat: 'спальня' },
        { keys: ['кухн'], cat: 'кухня' },
        { keys: ['диван', 'стол', 'стеллаж', 'кресл', 'гостиная'], cat: 'гостиная' },
        { keys: ['ванн', 'зеркал', 'сантех'], cat: 'ванная' }
    ];

    function norm(s) {
        return String(s || '')
            .toLowerCase()
            .replace(/ё/g, 'е')
            .replace(/×/g, 'x')
            .replace(/х/g, 'x');
    }

    /* общий разбор цены (src/shared/format/price.ts): «1 299,90 ₽» — это 1299,9, а не 129 990 */
    function parsePrice(raw) {
        return window.parsePrice(raw);
    }

    function parseQuery(text) {
        var q = norm(text);
        var intent = { type: 'product_search', raw: text, q: q, tokens: [], priceMin: null, priceMax: null, size: null, categories: [], wantsLifehacks: false };

        var rangeThou = q.match(/(\d+(?:\s?\d+)*)\s*(?:[-–—]|до)\s*(\d+(?:\s?\d+)*)\s*(тыс|тысяч|т\.?\s*р)/);
        var oneThou = q.match(/(?:до|не дороже|бюджет)\s*(\d+(?:\s?\d+)*)\s*(тыс|тысяч)/);
        var rangeRub = q.match(/(\d[\d\s]{2,})\s*(?:[-–—]|до)\s*(\d[\d\s]{2,})\s*(?:руб|₽)/);

        if (rangeThou) {
            intent.priceMin = parseInt(rangeThou[1].replace(/\s/g, ''), 10) * 1000;
            intent.priceMax = parseInt(rangeThou[2].replace(/\s/g, ''), 10) * 1000;
        } else if (oneThou) {
            intent.priceMax = parseInt(oneThou[1].replace(/\s/g, ''), 10) * 1000;
        } else if (rangeRub) {
            intent.priceMin = parseInt(rangeRub[1].replace(/\s/g, ''), 10);
            intent.priceMax = parseInt(rangeRub[2].replace(/\s/g, ''), 10);
        }

        var size = q.match(/(\d+(?:[.,]\d+)?)\s*[x]\s*(\d+(?:[.,]\d+)?)/);
        if (size) {
            var a = parseFloat(size[1].replace(',', '.'));
            var b = parseFloat(size[2].replace(',', '.'));
            if (a <= 4 && b <= 4) {
                intent.size = { w: Math.round(a * 100), h: Math.round(b * 100) };
            } else {
                intent.size = { w: Math.round(a), h: Math.round(b) };
            }
        }

        Object.keys(SYNONYMS).forEach(function (key) {
            if (q.indexOf(norm(key)) !== -1 || SYNONYMS[key].some(function (s) { return q.indexOf(norm(s)) !== -1; })) {
                intent.tokens.push(key);
            }
        });

        CATEGORY_HINTS.forEach(function (h) {
            if (h.keys.some(function (k) { return q.indexOf(k) !== -1; })) {
                if (intent.categories.indexOf(h.cat) === -1) intent.categories.push(h.cat);
            }
        });

        intent.wantsLifehacks = /лайфхак|совет|как сделать|экономи/.test(q);
        if (/услуг|мастер|сантехник|электрик|дизайн/.test(q)) intent.type = 'mixed';
        return intent;
    }

    function blob(prod) {
        return norm([prod.title, prod.category, prod.subcategory, prod.store, prod.description, prod.sku].join(' '));
    }

    function sizeMatch(prod, size) {
        if (!size) return 0;
        var t = blob(prod);
        var m = t.match(/(\d{2,3})\s*x\s*(\d{2,3})/);
        if (!m) return /кроват|спального места|двуспальн/.test(t) ? 4 : 0;
        var w = parseInt(m[1], 10);
        var h = parseInt(m[2], 10);
        var dw = Math.min(Math.abs(w - size.w), Math.abs(w - size.h));
        var dh = Math.min(Math.abs(h - size.h), Math.abs(h - size.w));
        if (dw <= 5 && dh <= 5) return 28;
        if (dw <= 25 && dh <= 25) return 14;
        return 2;
    }

    function scoreProduct(prod, intent) {
        if (!prod || prod.status !== 'published') return -1;
        if (prod.category === 'недвижимость') return -1;
        var t = blob(prod);
        var score = 0;

        intent.tokens.forEach(function (tok) {
            var syns = SYNONYMS[tok] || [tok];
            syns.forEach(function (s) {
                if (t.indexOf(norm(s)) !== -1) score += 16;
            });
            if (t.indexOf(norm(tok)) !== -1) score += 10;
        });

        intent.categories.forEach(function (c) {
            if (norm(prod.category).indexOf(norm(c)) !== -1) score += 12;
        });

        (intent.q.split(/[^a-zа-я0-9]+/).filter(function (w) { return w.length > 3; })).forEach(function (w) {
            if (t.indexOf(w) !== -1) score += 3;
        });

        var price = parsePrice(prod.price);
        if (intent.priceMin != null || intent.priceMax != null) {
            var min = intent.priceMin != null ? intent.priceMin : 0;
            var max = intent.priceMax != null ? intent.priceMax : 1e12;
            if (price >= min && price <= max) score += 18;
            else if (price && (price < min * 0.7 || price > max * 1.4)) score -= 8;
            else score += 4;
        }

        score += sizeMatch(prod, intent.size);

        if (intent.tokens.indexOf('матрас') !== -1 && /кроват|основан|реечн|спального/.test(t)) score += 8;
        if (intent.tokens.indexOf('штукатурка') !== -1 && /цемент|гипсокарт|профиль|краск|плитк/.test(t)) score += 10;

        return score;
    }

    function traits(prod) {
        var bits = [];
        if (prod.category) bits.push(prod.category);
        if (prod.sku) bits.push('арт. ' + prod.sku);
        var dim = String(prod.description || '').match(/(\d{2,4}\s*[xх×]\s*\d{2,4}\s*(?:x\s*\d{2,4})?\s*(?:см|мм)?)/i);
        if (dim) bits.push(dim[1].replace(/\s+/g, ' '));
        var len = String(prod.description || '').match(/(длина[^.]+)/i);
        if (len) bits.push(len[1].trim());
        return bits.slice(0, 3).join(' · ');
    }

    function searchCatalog(intent, catalog) {
        var list = Object.keys(catalog || {}).map(function (id) { return catalog[id]; });
        var ranked = list.map(function (p) {
            return { product: p, score: scoreProduct(p, intent) };
        }).filter(function (x) { return x.score >= 8; });
        ranked.sort(function (a, b) { return b.score - a.score; });
        if (!ranked.length) {
            ranked = list.filter(function (p) { return p && p.status === 'published' && p.category !== 'недвижимость'; })
                .map(function (p) { return { product: p, score: 1 }; })
                .slice(0, 0);
        }
        return ranked.slice(0, 8).map(function (x) { return x.product; });
    }

    function searchLifehacks(intent, items) {
        if (!intent.wantsLifehacks && intent.tokens.indexOf('лайфхак') === -1) {
            if (!/ремонт|материал|строительств/.test(intent.q)) return [];
        }
        var q = intent.q;
        return (items || []).filter(function (it) {
            if (it.status && it.status !== 'published') return false;
            var t = norm([it.title, it.excerpt, it.category, it.body].join(' '));
            return q.split(/[^a-zа-я0-9]+/).filter(function (w) { return w.length > 3; }).some(function (w) { return t.indexOf(w) !== -1; });
        }).slice(0, 3);
    }

    function localAsk(text, ctx) {
        var intent = parseQuery(text);
        var products = searchCatalog(intent, ctx.products || {});
        var lifehacks = searchLifehacks(intent, ctx.lifehacks || []);
        var message;
        if (products.length) {
            var bits = [];
            if (intent.categories.length) bits.push('категории: ' + intent.categories.join(', '));
            if (intent.priceMin != null || intent.priceMax != null) {
                bits.push('бюджет ' + (intent.priceMin ? intent.priceMin.toLocaleString('ru-RU') : 'от 0') + '–' + (intent.priceMax ? intent.priceMax.toLocaleString('ru-RU') : '∞') + ' ₽');
            }
            if (intent.size) bits.push('размер ~' + intent.size.w + '×' + intent.size.h + ' см');
            message = 'Нашёл в каталоге магазинов приложения' + (bits.length ? ' (' + bits.join(', ') + ')' : '') + '. Откройте карточку, чтобы увидеть детали.';
        } else if (lifehacks.length) {
            message = 'Товаров по запросу мало, но есть подходящие лайфхаки.';
        } else {
            message = 'Пока не нашёл точное совпадение. Уточните товар, размер или бюджет — например: «кровать 160×200 до 60 тысяч».';
        }
        return { provider: 'local', intent: intent, message: message, products: products, lifehacks: lifehacks };
    }

    var AssistantAI = {
        provider: 'local',
        endpoint: '',
        parseQuery: parseQuery,
        searchCatalog: searchCatalog,
        traits: traits,
        parsePrice: parsePrice,
        ask: function (text, ctx) {
            ctx = ctx || {};
            if (AssistantAI.provider === 'api' && AssistantAI.endpoint) {
                return AssistantAI.remoteAsk(text, ctx);
            }
            return Promise.resolve(localAsk(text, ctx));
        },
        remoteAsk: function (text, ctx) {
            return fetch(AssistantAI.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text, catalogHint: Object.keys(ctx.products || {}).length })
            }).then(function (r) { return r.json(); }).catch(function () {
                return localAsk(text, ctx);
            });
        }
    };

    global.AssistantAI = AssistantAI;
})(window);
