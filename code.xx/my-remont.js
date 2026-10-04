(function (global) {
    var KEY = 'meb_my_remont';
    var KEY2 = 'meb_my_remont_v2';
    var SPOR_KEY = 'meb_mr_spor';
    var LIKE_KEY = 'meb_mr_likes';
    var BA_KEY = 'meb_mr_baflip';
    var WEEK_KEY = 'meb_mr_week';
    var screen = 'hub';
    var acceptId = null;
    var galleryFilter = 'all';
    var caseIdx = 0;
    var draft = { type: 'room', title: '', phase: 'cosmo' };
    var COVER = 'assets/my-remont-cover.svg';
    var PH = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800';

    var STEPS = [
        { id: 'plan', title: 'План и замеры',
          hint: 'Комнаты и потолок по деньгам — иначе смета плывёт каждую неделю.',
          doToday: 'Запишите размеры и бюджет.',
          products: ['prod-2'],
          checks: [
            { id: 'rooms', text: 'Понятно, какие комнаты трогаем' },
            { id: 'budget', text: 'Есть потолок по деньгам' },
            { id: 'photo0', text: 'Сфотографировали «до»' }
          ]},
        { id: 'demo', title: 'Демонтаж',
          hint: 'Снимите старое и защитите то, что остаётся.',
          doToday: 'Закройте пол и вынесите мусор.',
          products: ['prod-14'],
          checks: [
            { id: 'protect', text: 'Пол и мебель закрыты' },
            { id: 'trash', text: 'Мусор вынесен, проход свободный' }
          ]},
        { id: 'electro', title: 'Электрика до отделки',
          hint: 'Розетки планируют до штукатурки, иначе долбить заново.',
          doToday: 'Наметьте розетки и свет.',
          products: ['prod-15'],
          checks: [
            { id: 'plan', text: 'Есть схема розеток и света' },
            { id: 'hidden', text: 'Скрытые работы сняты на фото' }
          ]},
        { id: 'plaster', title: 'Штукатурка и стены',
          hint: 'Не принимайте «под покраску», пока плоскость не проверена правилом.',
          doToday: 'Проверьте стену правилом у окна.',
          products: ['prod-4', 'prod-14'],
          checks: [
            { id: 'plane', text: 'Стена ровная по правилу' },
            { id: 'angles', text: 'Углы без ям и горбов' },
            { id: 'dry', text: 'Поверхность не сырая' }
          ]},
        { id: 'floor', title: 'Пол',
          hint: 'Стяжка должна высохнуть. Спешка даёт скрип и пятна.',
          doToday: 'Проверьте: стяжка не тёмная и не холодная.',
          products: ['prod-16'],
          checks: [
            { id: 'dry', text: 'Стяжка не липнет и не тёмная' },
            { id: 'level', text: 'Нет ям под покрытие' }
          ]},
        { id: 'paint', title: 'Покраска',
          hint: 'Грунт и два слоя. Не красьте по сырой штукатурке.',
          doToday: 'Сначала грунт, потом два слоя.',
          products: ['prod-5'],
          checks: [
            { id: 'prime', text: 'Грунтовка сделана' },
            { id: 'even', text: 'Нет полос и непрокрасов' }
          ]},
        { id: 'finish', title: 'Финиш и мебель',
          hint: 'Плинтусы, свет, хранение — то, что делает комнату жилой.',
          doToday: 'Свет у кровати и место для вещей.',
          products: ['prod-2', 'prod-10'],
          checks: [
            { id: 'light', text: 'Свет не только люстра по центру' },
            { id: 'store', text: 'Есть место для хранения' }
          ]}
    ];

    var SHOTS = {
        plan: {
            before: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
            work: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
            after: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800'
        },
        demo: {
            before: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800',
            work: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
            after: 'https://images.unsplash.com/photo-1562259949-e8e6c56d0ae1?w=800'
        },
        electro: {
            before: 'https://images.unsplash.com/photo-1590986701673-7e4e677d1d02?w=800',
            work: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800',
            after: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800'
        },
        plaster: {
            before: 'https://images.unsplash.com/photo-1562259949-e8e6c56d0ae1?w=800',
            work: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800',
            after: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800'
        },
        floor: {
            before: 'https://images.unsplash.com/photo-1484154214963-01d56f8c276c?w=800',
            work: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
            after: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800'
        },
        paint: {
            before: 'https://images.unsplash.com/photo-1562259949-e8e6c56d0ae1?w=800',
            work: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
            after: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800'
        },
        finish: {
            before: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800',
            work: 'https://images.unsplash.com/photo-1594026112284-02bb6f3352fe?w=800',
            after: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800'
        }
    };

    var WEEK_TASKS = [
        { id: 'w1', t: 'Снять фото текущего этапа' },
        { id: 'w2', t: 'Сверить закупку в каталоге' },
        { id: 'w3', t: 'Закрыть пункт в чеклисте' },
        { id: 'w4', t: 'Не закрывать этап без фото' }
    ];

    var CASE = {
        title: 'Спальня 12 м²',
        kicker: 'Разбор объекта',
        area: '12 м²',
        budget: '186 000 ₽',
        time: '3 недели',
        cover: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=900',
        stages: [
            { id: 'plan', title: 'Замеры и бюджет', when: 'Неделя 1',
              did: 'Зафиксировали 12 м² пола и ~30 м² стен. Потолок — 190 тыс., с запасом на свет.',
              miss: 'Не закладывали «ещё чуть-чуть». Любая добавка шла через вычёркивание декора.',
              img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800',
              products: ['prod-2'], lh: 'lh-9' },
            { id: 'demo', title: 'Демонтаж за день', when: 'Неделя 1',
              did: 'Сняли старые обои, закрыли пол, вынесли мусор в тот же вечер.',
              miss: 'Если оставить завал, электрик теряет полдня на проход.',
              img: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800',
              products: ['prod-14'], lh: 'lh-1' },
            { id: 'electro', title: 'Свет до штукатурки', when: 'Неделя 1',
              did: 'Розетка у кровати и бра запланированы до стен. Скрытые работы сняли на фото.',
              miss: 'Одна люстра по центру — комната дешевле самого ремонта.',
              img: 'https://images.unsplash.com/photo-1590986701673-7e4e677d1d02?w=800',
              products: ['prod-15'], lh: 'lh-8' },
            { id: 'plaster', title: 'Стены под правило', when: 'Неделя 2',
              did: 'Приёмка у окна с правилом. Волну после краски уже не спрятать.',
              miss: '«На глаз нормально» от мастера — самый дорогой комплимент.',
              img: 'https://images.unsplash.com/photo-1562259949-e8e6c56d0ae1?w=800',
              products: ['prod-4', 'prod-14'], lh: 'lh-4' },
            { id: 'floor', title: 'Пол с запасом', when: 'Неделя 2',
              did: 'Ламинат 33 класс, +10% на подрез. Стяжку не закрывали сырой.',
              miss: 'Докупать другую партию — другой тон. Дешевле сразу взять запас.',
              img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
              products: ['prod-16'], lh: 'lh-5' },
            { id: 'paint', title: 'Грунт и два слоя', when: 'Неделя 3',
              did: 'Грунт по ГКЛ, затем два слоя. Один слой всегда пятнами.',
              miss: 'Экономия на грунте видна на каждой стене.',
              img: 'https://images.unsplash.com/photo-1562259949-e8e6c56d0ae1?w=800',
              products: ['prod-5'], lh: 'lh-1' },
            { id: 'finish', title: 'Кровать и свет', when: 'Неделя 3',
              did: 'Кровать и комод из каталога, бра у изголовья. Комната «после» без нового ремонта.',
              miss: 'Мебель с пяти сайтов собирается дольше стен.',
              img: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800',
              products: ['prod-2', 'prod-10'], lh: 'lh-3' }
        ]
    };

    var SPORS = [
        { id: 'gkl', q: 'Грунтовать гипсокартон перед покраской?', a: 'Да, всегда', b: 'Можно сразу красить',
          verdict: 'Грунт закрывает пыль и стыки. Без него краска пятнами.' },
        { id: 'lam', q: 'Ламинат на кухню — нормальная идея?', a: '33 класс и аккуратно', b: 'Только плитка',
          verdict: 'Можно при высоком классе. Одна лужа у мойки — и вздуется.' },
        { id: 'rule', q: 'Принимать штукатурку «на глаз»?', a: 'Нет, только правилом', b: 'Если мастер говорит ок',
          verdict: 'После краски волна видна. Правило у окна дешевле спора.' },
        { id: 'light', q: 'Хватит одной люстры в спальне?', a: 'Нужен свет у кровати', b: 'Люстры достаточно',
          verdict: 'Бра или торшер меняют комнату сильнее новых обоев.' },
        { id: 'dry', q: 'Класть ламинат на чуть сырую стяжку?', a: 'Ждать, пока высохнет', b: 'Закрыть и забыть',
          verdict: 'Влага пойдёт в замки. Лучше три дня подождать.' }
    ];

    var STORIES = [
        { id: 'bed', cat: 'bed', room: 'Спальня 12 м²', days: '3 недели', budget: '186 000 ₽',
          before: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=700',
          after: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=700',
          note: 'Сначала стены и свет, кровать — в конце. Так комната сразу читается как «после».',
          products: ['prod-2', 'prod-10'] },
        { id: 'kit', cat: 'kit', room: 'Кухня без сноса', days: '5 недель', budget: '410 000 ₽',
          before: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=700',
          after: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700',
          note: 'Плитку не сбивали целиком — выровняли и поставили гарнитур.',
          products: ['prod-8', 'prod-16'] },
        { id: 'bath', cat: 'bath', room: 'Ванная 4 м²', days: '18 дней', budget: '94 000 ₽',
          before: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=700',
          after: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=700',
          note: 'Зеркало со светом вместо одной лампы сверху.',
          products: ['prod-3', 'prod-17'] }
    ];

    function ymd(d) {
        d = d || new Date();
        var m = d.getMonth() + 1, day = d.getDate();
        return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
    }
    function todayStr() { return ymd(new Date()); }
    function weekId() {
        var d = new Date();
        var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
        var y = t.getUTCFullYear();
        var w = Math.ceil((((t - new Date(Date.UTC(y, 0, 1))) / 86400000) + 1) / 7);
        return y + '-W' + w;
    }
    function esc(s) {
        return String(s || '').replace(/[&<>"']/g, function (c) {
            return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
        });
    }
    function imgOnErr() {
        return 'this.onerror=null;this.src=\'' + PH + '\'';
    }
    function readJson(k) {
        try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; }
    }
    function writeJson(k, v) {
        try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    }
    function priceOf(id) {
        var db = window.productsDb || {};
        var p = db[id];
        if (!p) return 0;
        if (typeof parsePrice === 'function') return parsePrice(p.price) || 0;
        return parseInt(String(p.price || '').replace(/\D/g, ''), 10) || 0;
    }
    function fmtMoney(n) {
        return (n || 0).toLocaleString('ru-RU') + ' ₽';
    }
    function hydrate(p) {
        if (!p || !p.steps) return p;
        p.steps.forEach(function (s) {
            if (!s.shots) s.shots = { before: false, work: false, after: false };
            if (!s.shotView) s.shotView = 'before';
        });
        return p;
    }
    function loadPersonal() {
        var a = readJson(KEY);
        if (a && a.steps && a.steps.length && !a.demo) return hydrate(a);
        var b = readJson(KEY2);
        if (b && b.steps && b.steps.length && !b.demo) return hydrate(b);
        if (a && a.steps && a.steps.length) return hydrate(a);
        return null;
    }
    function savePersonal(p) {
        p.demo = false;
        writeJson(KEY, p);
    }
    function meta(id) {
        return STEPS.find(function (s) { return s.id === id; }) || STEPS[0];
    }
    function buildProject(type, title, phase) {
        var names = { room: 'Комната', flat: 'Квартира', house: 'Дом' };
        var start = 0;
        if (phase === 'chern') start = 2;
        if (phase === 'chist') start = 3;
        var steps = STEPS.map(function (s, i) {
            return {
                id: s.id, title: s.title, hint: s.hint,
                status: i < start ? 'done' : (i === start ? 'now' : 'todo'),
                photo: false,
                shotView: 'before',
                shots: { before: false, work: false, after: false },
                checks: s.checks.map(function (c) { return { id: c.id, text: c.text, ok: null }; })
            };
        });
        return {
            type: type || 'room',
            title: title || names[type] || 'Мой ремонт',
            phase: phase || 'cosmo',
            demo: false,
            createdAt: Date.now(),
            visits: [todayStr()],
            today: { date: '', qid: '', answer: '' },
            steps: steps
        };
    }
    function ensureVisit(p) {
        var t = todayStr();
        if (!Array.isArray(p.visits)) p.visits = [];
        if (p.visits.indexOf(t) < 0) p.visits.push(t);
        if (p.visits.length > 60) p.visits = p.visits.slice(-60);
    }
    function stats(p) {
        var done = p.steps.filter(function (s) { return s.status === 'done'; }).length;
        return { done: done, total: p.steps.length, pct: Math.round(done * 100 / p.steps.length) };
    }
    function currentStep(p) {
        return p.steps.find(function (s) { return s.status === 'now'; })
            || p.steps.find(function (s) { return s.status !== 'done'; })
            || p.steps[p.steps.length - 1];
    }
    function streak(p) {
        if (!p || !p.visits) return 0;
        var n = 0, d = new Date();
        while (n < 40) {
            if (p.visits.indexOf(ymd(d)) < 0) break;
            n++;
            d.setDate(d.getDate() - 1);
        }
        return n;
    }
    function money(p) {
        var total = 0, spent = 0;
        p.steps.forEach(function (s) {
            var ids = meta(s.id).products || [];
            var sum = 0;
            ids.forEach(function (id) { sum += priceOf(id); });
            total += sum;
            if (s.status === 'done') spent += sum;
        });
        return { total: total, spent: spent, left: Math.max(0, total - spent) };
    }
    function loadWeek() {
        var w = readJson(WEEK_KEY) || {};
        var id = weekId();
        if (w.id !== id) w = { id: id, done: {} };
        return w;
    }
    function saveWeek(w) { writeJson(WEEK_KEY, w); }
    function weekDoneCount(w) {
        return WEEK_TASKS.filter(function (t) { return w.done && w.done[t.id]; }).length;
    }
    function seasonTip() {
        var m = new Date().getMonth();
        if (m >= 8 && m <= 9) return 'Сейчас удобно закрывать стены внутри. На улице смотрите ночную сырость.';
        if (m >= 10 || m <= 2) return 'Холодный сезон: фасад лучше не открывать, если ночью около нуля.';
        if (m >= 3 && m <= 4) return 'Весна сырая: стяжку не закрывайте навсегда — дайте высохнуть.';
        return 'Тёплый сезон: проветривайте после краски.';
    }
    function todayQuest(p) {
        var step = currentStep(p);
        var map = {
            plan: { qid: 'photo0', text: 'Уже понятно, какие комнаты трогаем и какой бюджет?', yes: 'Можно переходить к демонтажу.', no: 'Набросайте список комнат и потолок по деньгам — 2 минуты.' },
            demo: { qid: 'trash', text: 'Проход уже свободный, мусор вынесен?', yes: 'Можно звать электрика.', no: 'Пока завал — мастер теряет время.' },
            electro: { qid: 'hidden', text: 'Розетки и свет уже намечены?', yes: 'До штукатурки это последний спокойный момент.', no: 'После стен долбить заново.' },
            plaster: { qid: 'plane', text: 'Проверяли стену правилом у окна?', yes: 'Можно думать про грунт.', no: 'Волна после краски будет видна.' },
            floor: { qid: 'dry', text: 'Стяжка уже не тёмная и не холодная?', yes: 'Можно считать покрытие.', no: 'Не кладите ламинат на сырое.' },
            paint: { qid: 'prime', text: 'Грунт уже нанесён?', yes: 'Краски уйдёт меньше.', no: 'На ГКЛ без грунта почти всегда пятна.' },
            finish: { qid: 'light', text: 'Кроме люстры есть мягкий свет?', yes: 'Комната сразу кажется дороже ремонта.', no: 'Одно бра меняет комнату сильнее обоев.' }
        };
        return map[step.id] || map.plan;
    }
    function likes() { return readJson(LIKE_KEY) || []; }
    function liked(id) { return likes().indexOf(id) >= 0; }
    function baFlip() { return readJson(BA_KEY) || {}; }
    function prodCard(id) {
        var db = window.productsDb || {};
        var p = db[id];
        if (!p) return '';
        return '<button type="button" class="mr-prod" onclick="openProductModal(\'' + p.id + '\')">' +
            '<img src="' + esc(p.image || COVER) + '" alt="" onerror="' + imgOnErr() + '">' +
            '<span class="mr-prod-txt"><b>' + esc(p.title) + '</b><i>' + esc(p.price || '') + '</i></span></button>';
    }
    function topBar(mode) {
        if (mode === 'hub') {
            return '<div class="mr-top"><button type="button" class="mr-back" onclick="backToDirectory()">← Каталог</button></div>';
        }
        if (mode === 'accept') {
            return '<div class="mr-top">' +
                '<button type="button" class="mr-back" onclick="mrHub()">← Главная</button>' +
                '<button type="button" class="mr-back alt" onclick="mrBackDiary()">К дневнику</button></div>';
        }
        return '<div class="mr-top"><button type="button" class="mr-back" onclick="mrHub()">← Главная блока</button></div>';
    }

    function render() {
        var root = document.getElementById('mr-app');
        if (!root) return;
        if (screen === 'setup') { root.innerHTML = setupHtml(); return; }
        if (screen === 'case') { root.innerHTML = caseHtml(); return; }
        if (screen === 'gallery') { root.innerHTML = galleryHtml(); return; }
        if (screen === 'accept') {
            var p = loadPersonal();
            if (!p) { screen = 'setup'; root.innerHTML = setupHtml(); return; }
            var step = p.steps.find(function (s) { return s.id === acceptId; }) || currentStep(p);
            root.innerHTML = acceptHtml(p, step);
            return;
        }
        if (screen === 'diary') {
            var d = loadPersonal();
            if (!d) { screen = 'setup'; root.innerHTML = setupHtml(); return; }
            ensureVisit(d); savePersonal(d);
            root.innerHTML = diaryHtml(d);
            return;
        }
        root.innerHTML = hubHtml();
    }

    function sporHtml() {
        var s = SPORS[Math.floor(Date.now() / 86400000) % SPORS.length];
        var vote = readJson(SPOR_KEY);
        var same = vote && vote.id === s.id;
        var seedA = 58 + (s.id.charCodeAt(0) % 17);
        var pa = same ? seedA : 0;
        var pb = same ? 100 - seedA : 0;
        function opt(side, label, pct) {
            var on = same && vote.side === side ? ' on' : '';
            return '<button type="button" class="mr-spor-opt' + on + '" onclick="mrVote(\'' + s.id + '\',\'' + side + '\')">' +
                '<span class="fill" style="width:' + pct + '%"></span><span>' + esc(label) + '</span>' +
                (same ? '<em>' + pct + '%</em>' : '') + '</button>';
        }
        return '<div class="mr-card mr-spor">' +
            '<p class="mr-kicker">Спор дня</p>' +
            '<p class="mr-today-q">' + esc(s.q) + '</p>' +
            '<div class="mr-spor-opts">' + opt('a', s.a, pa) + opt('b', s.b, pb) + '</div>' +
            (same ? '<p class="mr-season">' + esc(s.verdict) + '</p>' : '<p class="mr-fine">Один тап — увидите, как голосуют другие.</p>') +
            '</div>';
    }

    function weekHtml(compact) {
        var w = loadWeek();
        var n = weekDoneCount(w);
        var rows = WEEK_TASKS.map(function (t) {
            var on = !!(w.done && w.done[t.id]);
            return '<button type="button" class="mr-week-row' + (on ? ' on' : '') + '" onclick="mrWeekToggle(\'' + t.id + '\')">' +
                '<span class="box">' + (on ? '✓' : '') + '</span><span>' + esc(t.t) + '</span></button>';
        }).join('');
        return '<div class="mr-card">' +
            '<div class="mr-row-head"><p class="mr-kicker" style="margin:0">Неделя</p><p class="mr-mini">' + n + ' / ' + WEEK_TASKS.length + '</p></div>' +
            '<div class="mr-bar ink tight"><span style="width:' + Math.round(n * 100 / WEEK_TASKS.length) + '%"></span></div>' +
            (compact ? '<p class="mr-fine" style="margin:8px 0 10px">Отметьте короткие дела — серия дней растёт.</p>' : '') +
            rows + '</div>';
    }

    function moneyHtml(p) {
        var m = money(p);
        var pct = m.total ? Math.round(m.spent * 100 / m.total) : 0;
        return '<button type="button" class="mr-money" onclick="mrOpenDiary()">' +
            '<span class="mr-kicker" style="margin:0">Смета объекта</span>' +
            '<strong>' + fmtMoney(m.spent) + ' <em>из ' + fmtMoney(m.total) + '</em></strong>' +
            '<span class="mr-bar"><span style="width:' + pct + '%"></span></span>' +
            '<span class="mr-money-left">Осталось ' + fmtMoney(m.left) + ' · по этапам из каталога</span></button>';
    }

    function buyToday(p) {
        var cur = currentStep(p);
        var ids = meta(cur.id).products || [];
        return ids[0] || null;
    }

    function hubHtml() {
        var p = loadPersonal();
        var board = '';
        if (p) {
            ensureVisit(p); savePersonal(p);
            var st = stats(p);
            var cur = currentStep(p);
            var q = todayQuest(p);
            var sk = streak(p);
            var pid = buyToday(p);
            var prod = pid ? (window.productsDb || {})[pid] : null;
            var answered = p.today && p.today.date === todayStr() && p.today.qid === q.qid && p.today.answer;
            board =
                '<div class="mr-board">' +
                '<p class="mr-kicker light">Сегодня</p>' +
                '<strong>' + esc(p.title) + '</strong>' +
                '<p class="mr-board-sub">' + st.done + ' из ' + st.total + ' этапов' + (sk > 1 ? ' · ' + sk + ' дн. подряд' : '') + '</p>' +
                '<span class="mr-bar light"><span style="width:' + st.pct + '%"></span></span>' +
                '<button type="button" class="mr-board-task" onclick="mrOpenStep(\'' + cur.id + '\')">' +
                '<span>Текущий этап</span><b>' + esc(cur.title) + '</b><i>' + esc(q.text) + '</i></button>' +
                (answered
                    ? '<p class="mr-board-ok">Задача дня отмечена. Можно в каталог или к фото.</p>'
                    : '<div class="mr-yesno">' +
                      '<button type="button" class="mr-yes" onclick="mrAnswer(\'' + q.qid + '\',\'yes\')">Да</button>' +
                      '<button type="button" class="mr-no" onclick="mrAnswer(\'' + q.qid + '\',\'no\')">Ещё нет</button></div>') +
                (prod
                    ? '<button type="button" class="mr-buy" onclick="openProductModal(\'' + prod.id + '\')"><img src="' + esc(prod.image || COVER) + '" alt="" onerror="' + imgOnErr() + '"><span><b>Купить сегодня</b><i>' + esc(prod.title) + ' · ' + esc(prod.price || '') + '</i></span></button>'
                    : '') +
                '<button type="button" class="mr-hero-cta dark" onclick="mrOpenDiary()">Вернуться к ремонту →</button>' +
                '</div>' +
                moneyHtml(p) +
                weekHtml(true);
        } else {
            board = '<button type="button" class="mr-hero-start" onclick="mrOpenDiary()">' +
                '<span class="mr-kicker light">Личный дневник</span>' +
                '<strong>7 этапов вашего ремонта</strong>' +
                '<span>Замеры, смета, фото до / после. Ничего не теряется по ходу.</span>' +
                '<span class="mr-hero-cta">Начать дневник</span></button>' +
                weekHtml(true);
        }
        return '<div class="mr-wrap">' +
            topBar('hub') +
            '<p class="mr-kicker">Мой ремонт</p>' +
            '<h2 class="mr-h">Объект под контролем</h2>' +
            '<p class="mr-lead">Сегодняшний шаг, смета и фото — и можно уйти в кейс или голосование, потом вернуться.</p>' +
            board +
            '<div class="mr-tiles">' +
            '<button type="button" class="mr-tile" onclick="mrOpenCase()">' +
            '<img src="' + CASE.cover + '" alt="" onerror="' + imgOnErr() + '">' +
            '<span class="scrim"></span><span class="meta"><b>Разбор объекта</b><i>Спальня 12 м² · 7 шагов</i></span></button>' +
            '<button type="button" class="mr-tile" onclick="mrGoGallery()">' +
            '<img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600" alt="" onerror="' + imgOnErr() + '">' +
            '<span class="scrim"></span><span class="meta"><b>До и после</b><i>Срок, бюджет, товары</i></span></button>' +
            '</div>' +
            sporHtml() +
            '<div class="mr-links">' +
            '<button type="button" class="mr-ghost" onclick="mrGoLifehack()">Разбор ошибок</button>' +
            '<button type="button" class="mr-ghost" onclick="mrGoCalc()">Калькулятор</button>' +
            '</div></div>';
    }

    function setupHtml() {
        var types = [
            { id: 'room', t: 'Одна комната', d: 'Спальня, кухня, детская' },
            { id: 'flat', t: 'Квартира', d: 'Несколько помещений' },
            { id: 'house', t: 'Дом', d: 'Большой ремонт' }
        ];
        var phases = [
            { id: 'cosmo', t: 'Косметика', d: 'Живём и обновляем' },
            { id: 'chern', t: 'Черновые', d: 'Стяжка, электрика, стены' },
            { id: 'chist', t: 'Чистовые', d: 'Краска, пол, мебель' }
        ];
        function picks(list, key, fn) {
            return '<div class="mr-picks">' + list.map(function (x) {
                var on = draft[key] === x.id ? ' on' : '';
                return '<button type="button" class="mr-pick' + on + '" onclick="' + fn + '(\'' + x.id + '\')"><b>' + x.t + '</b><span>' + x.d + '</span></button>';
            }).join('') + '</div>';
        }
        return '<div class="mr-wrap">' +
            topBar() +
            '<p class="mr-kicker">Дневник</p>' +
            '<h2 class="mr-h">Ваш объект</h2>' +
            '<p class="mr-lead">Короткая анкета один раз. Дальше — этапы, смета и фото.</p>' +
            '<p class="mr-label">Что ремонтируете</p>' + picks(types, 'type', 'mrPickType') +
            '<p class="mr-label">Сейчас какой этап</p>' + picks(phases, 'phase', 'mrPickPhase') +
            '<label class="mr-label" for="mr-title">Как назвать</label>' +
            '<input id="mr-title" class="mr-input" maxlength="40" placeholder="Например: спальня" value="' + esc(draft.title) + '" oninput="mrDraftTitle(this.value)">' +
            '<button type="button" class="mr-primary" onclick="mrCreate()">Начать дневник</button>' +
            '</div>';
    }

    function questBlock(p) {
        var q = todayQuest(p);
        var answered = p.today && p.today.date === todayStr() && p.today.qid === q.qid && p.today.answer;
        if (answered) {
            var msg = p.today.answer === 'yes' ? q.yes : (p.today.answer === 'no' ? q.no : 'Можно вернуться к этому вечером.');
            return '<div class="mr-card"><p class="mr-today-a">' + esc(msg) + '</p>' +
                '<button type="button" class="mr-linkish" onclick="mrAnswer(\'' + q.qid + '\',\'\')">Изменить ответ</button></div>';
        }
        return '<div class="mr-card"><p class="mr-kicker">Задача дня</p><p class="mr-today-q">' + esc(q.text) + '</p>' +
            '<div class="mr-yesno">' +
            '<button type="button" class="mr-yes" onclick="mrAnswer(\'' + q.qid + '\',\'yes\')">Да</button>' +
            '<button type="button" class="mr-no" onclick="mrAnswer(\'' + q.qid + '\',\'no\')">Ещё нет</button>' +
            '<button type="button" class="mr-later" onclick="mrAnswer(\'' + q.qid + '\',\'later\')">Позже</button>' +
            '</div></div>';
    }

    function stepsList(p) {
        return p.steps.map(function (s, i) {
            var cls = s.status === 'done' ? 'done' : (s.status === 'now' ? 'now' : '');
            var mark = s.status === 'done' ? '✓' : String(i + 1);
            var st = s.status === 'done' ? 'Готово' : (s.status === 'now' ? 'Сейчас' : 'Дальше');
            var shotN = s.shots ? (s.shots.before ? 1 : 0) + (s.shots.work ? 1 : 0) + (s.shots.after ? 1 : 0) : 0;
            return '<button type="button" class="mr-step ' + cls + '" onclick="mrOpenStep(\'' + s.id + '\')">' +
                '<span class="mr-num">' + mark + '</span>' +
                '<span class="mr-step-body"><b>' + esc(s.title) + '</b><span>' + esc(s.hint) + (shotN ? ' · фото ' + shotN + '/3' : '') + '</span></span>' +
                '<span class="mr-step-st">' + st + '</span></button>';
        }).join('');
    }

    function diaryHtml(p) {
        var st = stats(p);
        var cur = currentStep(p);
        var sk = streak(p);
        return '<div class="mr-wrap">' +
            topBar() +
            '<p class="mr-kicker">Дневник' + (sk > 1 ? ' · ' + sk + ' дн. подряд' : '') + '</p>' +
            '<h2 class="mr-h">' + esc(p.title) + '</h2>' +
            '<p class="mr-progress">' + st.done + ' из ' + st.total + ' этапов</p>' +
            '<div class="mr-bar ink"><span style="width:' + st.pct + '%"></span></div>' +
            moneyHtml(p) +
            '<button type="button" class="mr-today" onclick="mrOpenStep(\'' + cur.id + '\')">' +
            '<span class="mr-today-label">Текущий этап</span>' +
            '<strong>' + esc(cur.title) + '</strong>' +
            '<span class="mr-today-hint">' + esc(cur.hint) + '</span></button>' +
            questBlock(p) +
            weekHtml(false) +
            '<div class="mr-note">' + esc(seasonTip()) + '</div>' +
            '<p class="mr-label">Ход работ</p>' +
            '<div class="mr-steps">' + stepsList(p) + '</div>' +
            '<div class="mr-links">' +
            '<button type="button" class="mr-ghost" onclick="mrHub()">На главную</button>' +
            '<button type="button" class="mr-ghost" onclick="mrOpenCase()">Смотреть кейс</button>' +
            '</div>' +
            '<button type="button" class="mr-reset" onclick="mrReset()">Начать другой ремонт</button>' +
            '</div>';
    }

    function caseHtml() {
        var st = CASE.stages[caseIdx] || CASE.stages[0];
        var n = CASE.stages.length;
        var p = loadPersonal();
        var mine = p && p.steps.find(function (s) { return s.id === st.id; });
        var adopted = mine && mine.status !== 'todo';
        var pills = CASE.stages.map(function (s, i) {
            return '<button type="button" class="mr-pill' + (i === caseIdx ? ' on' : '') + '" onclick="mrCaseGo(' + i + ')">' + (i + 1) + '</button>';
        }).join('');
        var prods = (st.products || []).map(prodCard).join('');
        return '<div class="mr-wrap">' +
            topBar() +
            '<p class="mr-kicker">' + esc(CASE.kicker) + '</p>' +
            '<h2 class="mr-h">' + esc(CASE.title) + '</h2>' +
            '<div class="mr-stats">' +
            '<span><b>' + esc(CASE.area) + '</b><i>площадь</i></span>' +
            '<span><b>' + esc(CASE.time) + '</b><i>срок</i></span>' +
            '<span><b>' + esc(CASE.budget) + '</b><i>бюджет</i></span></div>' +
            '<div class="mr-case-hero"><img src="' + esc(st.img) + '" alt="" onerror="' + imgOnErr() + '">' +
            '<span class="mr-ba-tag">' + esc(st.when) + '</span></div>' +
            '<div class="mr-pills">' + pills + '</div>' +
            '<p class="mr-progress">Шаг ' + (caseIdx + 1) + ' из ' + n + '</p>' +
            '<h3 class="mr-case-t">' + esc(st.title) + '</h3>' +
            '<p class="mr-lead tight">' + esc(st.did) + '</p>' +
            '<div class="mr-warn"><b>Где ломают</b><span>' + esc(st.miss) + '</span></div>' +
            (prods ? '<p class="mr-label">Купили из каталога</p>' + prods : '') +
            '<button type="button" class="mr-claim' + (adopted ? ' on' : '') + '" onclick="mrAdoptStep()">' +
            (adopted ? '✓ Этот этап уже в вашем дневнике' : 'Сделать этот этап у себя') + '</button>' +
            '<div class="mr-nav">' +
            '<button type="button" class="mr-ghost" ' + (caseIdx === 0 ? 'disabled' : '') + ' onclick="mrCaseGo(' + (caseIdx - 1) + ')">← Назад</button>' +
            (caseIdx < n - 1
                ? '<button type="button" class="mr-primary inline" onclick="mrCaseGo(' + (caseIdx + 1) + ')">Дальше →</button>'
                : '<button type="button" class="mr-primary inline" onclick="mrHub()">На главную</button>') +
            '</div>' +
            (st.lh ? '<button type="button" class="mr-linkish" onclick="openLifehackArticle(\'' + st.lh + '\')">Открыть лайфхак по теме →</button>' : '') +
            '</div>';
    }

    function galleryHtml() {
        var filters = [
            { id: 'all', t: 'Все' }, { id: 'bed', t: 'Спальня' },
            { id: 'kit', t: 'Кухня' }, { id: 'bath', t: 'Ванная' }, { id: 'liked', t: 'Избранное' }
        ];
        var chips = filters.map(function (f) {
            return '<button type="button" class="mr-filter' + (galleryFilter === f.id ? ' on' : '') + '" onclick="mrGalFilter(\'' + f.id + '\')">' + f.t + '</button>';
        }).join('');
        var flip = baFlip();
        var list = STORIES.filter(function (s) {
            if (galleryFilter === 'all') return true;
            if (galleryFilter === 'liked') return liked(s.id);
            return s.cat === galleryFilter;
        });
        var cards = list.map(function (s) {
            var on = liked(s.id);
            var after = !!flip[s.id];
            return '<article class="mr-ba-card">' +
                '<button type="button" class="mr-ba" onclick="mrToggleBa(\'' + s.id + '\')">' +
                '<img src="' + esc(after ? s.after : s.before) + '" alt="" onerror="' + imgOnErr() + '">' +
                '<span class="mr-ba-tag">' + (after ? 'После' : 'До') + '</span>' +
                '<span class="mr-ba-hint">' + (after ? 'Нажми · до' : 'Нажми · после') + '</span></button>' +
                '<div class="mr-ba-meta">' +
                '<div class="mr-ba-top"><strong>' + esc(s.room) + '</strong>' +
                '<button type="button" class="mr-heart' + (on ? ' on' : '') + '" onclick="mrToggleLike(\'' + s.id + '\')">' + (on ? '♥' : '♡') + '</button></div>' +
                '<p>' + esc(s.days) + ' · ' + esc(s.budget) + '</p>' +
                '<p class="mr-season">' + esc(s.note) + '</p>' +
                s.products.map(prodCard).join('') +
                '</div></article>';
        }).join('');
        if (!cards) cards = '<p class="mr-lead">Пока пусто. Откройте «Все» или отметьте ♡.</p>';
        var p = loadPersonal();
        return '<div class="mr-wrap">' +
            topBar() +
            '<p class="mr-kicker">Фото</p>' +
            '<h2 class="mr-h">До и после</h2>' +
            '<p class="mr-lead">Тап по фото — переключить. Потом вернитесь на главную и снова в ремонт.</p>' +
            '<div class="mr-filters">' + chips + '</div>' +
            cards +
            (p ? '<button type="button" class="mr-primary" onclick="mrOpenDiary()">Вернуться к ремонту</button>' : '') +
            '</div>';
    }

    function shotBlock(step) {
        var view = step.shotView || 'before';
        var pack = SHOTS[step.id] || SHOTS.plan;
        var src = pack[view] || pack.before;
        var labels = [
            { id: 'before', t: 'До' },
            { id: 'work', t: 'В работе' },
            { id: 'after', t: 'После' }
        ];
        var tabs = labels.map(function (l) {
            var marked = step.shots && step.shots[l.id];
            return '<button type="button" class="mr-shot-tab' + (view === l.id ? ' on' : '') + '" onclick="mrShotView(\'' + step.id + '\',\'' + l.id + '\')">' +
                l.t + (marked ? ' ✓' : '') + '</button>';
        }).join('');
        var marked = step.shots && step.shots[view];
        return '<div class="mr-shot">' +
            '<button type="button" class="mr-ba" onclick="mrShotCycle(\'' + step.id + '\')">' +
            '<img src="' + esc(src) + '" alt="" onerror="' + imgOnErr() + '">' +
            '<span class="mr-ba-tag">' + (view === 'before' ? 'До' : (view === 'work' ? 'В работе' : 'После')) + '</span>' +
            '<span class="mr-ba-hint">Листать кадры</span></button>' +
            '<div class="mr-shot-tabs">' + tabs + '</div>' +
            '<button type="button" class="mr-photo' + (marked ? ' on' : '') + '" onclick="mrShotMark(\'' + step.id + '\')">' +
            (marked ? '✓ Этот кадр отмечен' : 'Отметить этот кадр как снятый') + '</button></div>';
    }

    function acceptHtml(p, step) {
        var doneN = step.checks.filter(function (c) { return c.ok === true; }).length;
        var rows = step.checks.map(function (c) {
            var st = c.ok === true ? 'ok' : (c.ok === false ? 'bad' : '');
            return '<div class="mr-acc ' + st + '"><p>' + esc(c.text) + '</p>' +
                '<div class="mr-acc-btns">' +
                '<button type="button" class="' + (c.ok === true ? 'on' : '') + '" onclick="mrCheck(\'' + step.id + '\',\'' + c.id + '\',true)">Ок</button>' +
                '<button type="button" class="warn ' + (c.ok === false ? 'on' : '') + '" onclick="mrCheck(\'' + step.id + '\',\'' + c.id + '\',false)">Переделать</button>' +
                '</div></div>';
        }).join('');
        var prods = (meta(step.id).products || []).map(prodCard).join('');
        var sum = (meta(step.id).products || []).reduce(function (s, id) { return s + priceOf(id); }, 0);
        return '<div class="mr-wrap">' +
            topBar('accept') +
            '<p class="mr-kicker">Приёмка этапа</p>' +
            '<h2 class="mr-h">' + esc(step.title) + '</h2>' +
            '<p class="mr-lead">' + esc(step.hint) + '</p>' +
            shotBlock(step) +
            '<p class="mr-label">Чеклист · ' + doneN + ' из ' + step.checks.length + '</p>' +
            '<div class="mr-bar ink"><span style="width:' + Math.round(doneN * 100 / step.checks.length) + '%"></span></div>' +
            rows +
            (prods ? '<p class="mr-label">Материалы этапа · ' + fmtMoney(sum) + '</p>' + prods : '') +
            '<button type="button" class="mr-primary" onclick="mrComplete(\'' + step.id + '\')">Закрыть этап</button>' +
            '</div>';
    }

    function scrollTop() {
        var sc = document.getElementById('main-scroll-container');
        if (sc) sc.scrollTop = 0;
    }
    function toast(msg) {
        if (typeof showSmsToast === 'function') showSmsToast(msg);
    }

    global.mrHub = function () { screen = 'hub'; render(); scrollTop(); };
    global.mrOpenDiary = function () {
        screen = loadPersonal() ? 'diary' : 'setup';
        render(); scrollTop();
    };
    global.mrOpenDemo = function () { global.mrOpenCase(); };
    global.mrOpenCase = function () { screen = 'case'; render(); scrollTop(); };
    global.mrCaseGo = function (i) {
        if (i < 0 || i >= CASE.stages.length) return;
        caseIdx = i;
        render();
        scrollTop();
    };
    global.mrAdoptStep = function () {
        var st = CASE.stages[caseIdx];
        if (!st) return;
        var p = loadPersonal();
        if (!p) {
            p = buildProject('room', 'Спальня 12 м²', 'cosmo');
        }
        hydrate(p);
        var step = p.steps.find(function (s) { return s.id === st.id; });
        if (!step) return;
        if (step.status === 'todo') {
            p.steps.forEach(function (s) { if (s.status === 'now') s.status = 'todo'; });
            step.status = 'now';
        }
        savePersonal(p);
        acceptId = step.id;
        screen = 'accept';
        render();
        toast('Этап открыт в вашем дневнике');
        scrollTop();
    };
    global.mrAdoptCase = function () { global.mrAdoptStep(); };
    global.mrGoGallery = function () { screen = 'gallery'; render(); scrollTop(); };
    global.mrGalFilter = function (id) { galleryFilter = id; render(); };
    global.mrToggleLike = function (id) {
        var arr = likes();
        var i = arr.indexOf(id);
        if (i >= 0) arr.splice(i, 1); else arr.push(id);
        writeJson(LIKE_KEY, arr);
        render();
    };
    global.mrToggleBa = function (id) {
        var map = baFlip();
        map[id] = !map[id];
        writeJson(BA_KEY, map);
        render();
    };
    global.mrVote = function (id, side) {
        writeJson(SPOR_KEY, { id: id, side: side, date: todayStr() });
        render();
    };
    global.mrWeekToggle = function (id) {
        var w = loadWeek();
        if (!w.done) w.done = {};
        w.done[id] = !w.done[id];
        saveWeek(w);
        render();
    };
    global.mrShotView = function (stepId, view) {
        var p = loadPersonal();
        if (!p) return;
        var step = p.steps.find(function (s) { return s.id === stepId; });
        if (!step) return;
        hydrate(p);
        step.shotView = view;
        savePersonal(p);
        render();
    };
    global.mrShotCycle = function (stepId) {
        var order = ['before', 'work', 'after'];
        var p = loadPersonal();
        if (!p) return;
        var step = p.steps.find(function (s) { return s.id === stepId; });
        if (!step) return;
        hydrate(p);
        var i = order.indexOf(step.shotView || 'before');
        step.shotView = order[(i + 1) % 3];
        savePersonal(p);
        render();
    };
    global.mrShotMark = function (stepId) {
        var p = loadPersonal();
        if (!p) return;
        var step = p.steps.find(function (s) { return s.id === stepId; });
        if (!step) return;
        hydrate(p);
        var view = step.shotView || 'before';
        step.shots[view] = !step.shots[view];
        step.photo = !!(step.shots.before || step.shots.work || step.shots.after);
        savePersonal(p);
        render();
    };
    global.mrPickType = function (id) { draft.type = id; render(); };
    global.mrPickPhase = function (id) { draft.phase = id; render(); };
    global.mrDraftTitle = function (v) { draft.title = v; };
    global.mrCreate = function () {
        var title = (document.getElementById('mr-title') && document.getElementById('mr-title').value || draft.title || '').trim();
        var p = buildProject(draft.type, title, draft.phase);
        savePersonal(p);
        screen = 'diary';
        render();
        toast('Дневник создан');
    };
    global.mrOpenStep = function (id) {
        acceptId = id;
        screen = 'accept';
        render();
        scrollTop();
    };
    global.mrBackDiary = function () { screen = 'diary'; render(); scrollTop(); };
    global.mrCheck = function (stepId, checkId, ok) {
        var p = loadPersonal();
        if (!p) return;
        var step = p.steps.find(function (s) { return s.id === stepId; });
        if (!step) return;
        var c = step.checks.find(function (x) { return x.id === checkId; });
        if (c) c.ok = ok;
        savePersonal(p);
        render();
    };
    global.mrTogglePhoto = function (stepId) {
        global.mrShotMark(stepId);
    };
    global.mrComplete = function (stepId) {
        var p = loadPersonal();
        if (!p) return;
        var idx = p.steps.findIndex(function (s) { return s.id === stepId; });
        if (idx < 0) return;
        p.steps[idx].status = 'done';
        p.steps[idx].checks.forEach(function (c) { if (c.ok == null) c.ok = true; });
        var next = p.steps.find(function (s) { return s.status !== 'done'; });
        if (next) next.status = 'now';
        savePersonal(p);
        screen = 'diary';
        render();
        toast('Этап закрыт');
    };
    global.mrAnswer = function (qid, ans) {
        var p = loadPersonal();
        if (!p) return;
        p.today = { date: todayStr(), qid: qid, answer: ans };
        savePersonal(p);
        render();
    };
    global.mrReset = function () {
        try { localStorage.removeItem(KEY); localStorage.removeItem(KEY2); } catch (e) {}
        draft = { type: 'room', title: '', phase: 'cosmo' };
        screen = 'setup';
        render();
    };
    global.mrGoLifehack = function () {
        if (typeof openLifehackArticle === 'function') openLifehackArticle('lh-8');
    };
    global.mrGoCalc = function () {
        if (typeof switchDirectoryView === 'function') switchDirectoryView('calculator');
        if (typeof openSpecificCalc === 'function') openSpecificCalc('Онлайн Калькулятор Штукатурки');
    };
    global.renderMyRemont = function () {
        screen = 'hub';
        render();
        scrollTop();
    };
    global.openMyRemont = function () {
        if (typeof switchDirectoryView === 'function') switchDirectoryView('my-remont');
        else global.renderMyRemont();
    };
})(window);
