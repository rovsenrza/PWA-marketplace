/* Калькуляторы ремонта.
   Плитка и ламинат (раскладка), штукатурка по шагам, смета ремонта по комнатам.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */



// === ЛОГИКА КАЛЬКУЛЯТОРОВ ===
function openSpecificCalc(title) {
    document.getElementById('subview-calculator').classList.add('hidden');
    document.getElementById('subview-specific-calc').classList.remove('hidden');
    document.getElementById('specific-calc-title').innerText = title;
    document.getElementById('main-scroll-container').scrollTop = 0;
    
    const tileBlock = document.getElementById('calc-content-tile');
    const lamBlock = document.getElementById('calc-content-laminate');
    const placeholderBlock = document.getElementById('calc-content-placeholder');
    
    const plasterBlock = document.getElementById('calc-content-plaster');
    const repairBlock = document.getElementById('calc-content-repair');
    
    if (tileBlock) tileBlock.classList.add('hidden');
    if (lamBlock) lamBlock.classList.add('hidden');
    if (plasterBlock) plasterBlock.classList.add('hidden');
    if (repairBlock) repairBlock.classList.add('hidden');
    if (placeholderBlock) placeholderBlock.classList.add('hidden');

    if (title === 'Онлайн Калькулятор Плитки') {
        if (tileBlock) tileBlock.classList.remove('hidden');
    } else if (title === 'Онлайн Калькулятор Ламинат') {
        if (lamBlock) lamBlock.classList.remove('hidden');
    } else if (title === 'Онлайн Калькулятор Штукатурки') {
        if (plasterBlock) plasterBlock.classList.remove('hidden');
        if (typeof pcInit === 'function') pcInit();
    } else if (title === 'Онлайн Калькулятор Расчет Работы Ремонта') {
        if (repairBlock) repairBlock.classList.remove('hidden');
        if (typeof rcInit === 'function') rcInit();
    } else {
        if (placeholderBlock) placeholderBlock.classList.remove('hidden');
    }
}


function backToCalcList() {
    document.getElementById('subview-specific-calc').classList.add('hidden');
    document.getElementById('subview-calculator').classList.remove('hidden');
    document.getElementById('main-scroll-container').scrollTop = 0;
}


// === ПЛИТКА ===
function switchTileCalcTab(tab) {
    ['floor', 'walls', 'apron'].forEach(t => {
        const btn = document.getElementById('calc-tab-' + t);
        if(t === tab) btn.className = 'flex-1 py-1.5 text-[11px] font-bold rounded-lg bg-white text-[#1e6091] shadow-sm transition-all';
        else btn.className = 'flex-1 py-1.5 text-[11px] font-bold rounded-lg text-slate-400 transition-all';
    });
    
    if (tab === 'walls') {
        document.getElementById('tc-room-l').value = 5; document.getElementById('tc-room-w').value = 2.5; 
        document.getElementById('tc-tile-l').value = 30; document.getElementById('tc-tile-w').value = 20;
    } else if (tab === 'apron') {
        document.getElementById('tc-room-l').value = 3; document.getElementById('tc-room-w').value = 0.6; 
        document.getElementById('tc-tile-l').value = 20; document.getElementById('tc-tile-w').value = 10;
    } else {
        document.getElementById('tc-room-l').value = 3; document.getElementById('tc-room-w').value = 2;
        document.getElementById('tc-tile-l').value = 60; document.getElementById('tc-tile-w').value = 60;
    }
    document.getElementById('tc-results-block').classList.add('hidden');
}


function selectTileMethod(method) {
    document.getElementById('tc-lay-method').value = method;
    const activeCls = 'lay-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-[#1e6091] bg-[#1e6091]/5 text-[#1e6091] transition-all';
    const inactiveCls = 'lay-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-transparent bg-white text-slate-500 shadow-sm transition-all hover:border-slate-200';

    ['straight', 'offset', 'diagonal'].forEach(m => {
        const btn = document.getElementById('lay-' + m);
        if (btn) btn.className = (m === method) ? activeCls : inactiveCls;
    });

    const resInput = document.getElementById('tc-reserve');
    if (method === 'straight') resInput.value = '5';
    else if (method === 'offset') resInput.value = '10';
    else if (method === 'diagonal') resInput.value = '15';

    if (!document.getElementById('tc-results-block').classList.contains('hidden')) calculateTile();
}


function calculateTile() {
    const rL = parseFloat(document.getElementById('tc-room-l').value) || 0;
    const rW = parseFloat(document.getElementById('tc-room-w').value) || 0;
    const tL = parseFloat(document.getElementById('tc-tile-l').value) || 0;
    const tW = parseFloat(document.getElementById('tc-tile-w').value) || 0;
    const gap = parseFloat(document.getElementById('tc-gap').value) || 0;
    const res = parseFloat(document.getElementById('tc-reserve').value) || 0;
    const pack = parseFloat(document.getElementById('tc-pack').value) || 1;
    const method = document.getElementById('tc-lay-method').value;

    if (rL === 0 || rW === 0 || tL === 0 || tW === 0) return;

    const area = rL * rW;
    const tL_m = (tL * 10 + gap) / 1000;
    const tW_m = (tW * 10 + gap) / 1000;
    
    const baseCount = Math.ceil(area / (tL_m * tW_m)); 
    const totalCount = Math.ceil(baseCount * (1 + (res / 100))); 
    const packsCount = Math.ceil(totalCount / pack);

    document.getElementById('tc-res-area').innerText = area.toFixed(2) + ' м²';
    document.getElementById('tc-res-count').innerText = baseCount + ' шт';
    document.getElementById('tc-res-total').innerText = totalCount + ' шт';
    document.getElementById('tc-res-packs').innerText = packsCount + ' упаковок';

    drawGrid('tc-scheme-canvas', rL, rW, tL*10, tW*10, gap, method, false);

    document.getElementById('tc-results-block').classList.remove('hidden');
    setTimeout(() => { document.getElementById('main-scroll-container').scrollBy({ top: 400, behavior: 'smooth' }); }, 100);
}


// === ЛАМИНАТ ===
function selectLaminateMethod(method) {
    document.getElementById('lc-lay-method').value = method;
    const activeCls = 'lay-lam-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-[#1e6091] bg-[#1e6091]/5 text-[#1e6091] transition-all';
    const inactiveCls = 'lay-lam-btn flex flex-col items-center justify-center p-2 rounded-xl border-2 border-transparent bg-white text-slate-500 shadow-sm transition-all hover:border-slate-200';

    ['straight', 'diagonal', 'half', 'third'].forEach(m => {
        const btn = document.getElementById('lay-lam-' + m);
        if (btn) btn.className = (m === method) ? activeCls : inactiveCls;
    });

    const resInput = document.getElementById('lc-reserve');
    if (method === 'straight') resInput.value = '5';
    else if (method === 'diagonal') resInput.value = '15';
    else if (method === 'half') resInput.value = '7';
    else if (method === 'third') resInput.value = '10';

    if (!document.getElementById('lc-results-block').classList.contains('hidden')) calculateLaminate();
}


function calculateLaminate() {
    const rL = parseFloat(document.getElementById('lc-room-l').value) || 0;
    const rW = parseFloat(document.getElementById('lc-room-w').value) || 0;
    const lL = parseFloat(document.getElementById('lc-tile-l').value) || 0;
    const lW = parseFloat(document.getElementById('lc-tile-w').value) || 0;
    const res = parseFloat(document.getElementById('lc-reserve').value) || 0;
    const pack = parseFloat(document.getElementById('lc-pack').value) || 1;
    const method = document.getElementById('lc-lay-method').value;
    const gap = parseFloat(document.getElementById('lc-gap').value) || 0;

    if (rL === 0 || rW === 0 || lL === 0 || lW === 0) return;

    // Площадь комнаты (с учетом отступов от стен)
    const L_m = rL - (gap * 2 / 1000);
    const W_m = rW - (gap * 2 / 1000);
    const area = (L_m > 0 && W_m > 0) ? (L_m * W_m) : 0;
    
    const panelArea = (lL * lW) / 1000000;
    
    const baseCount = Math.ceil(area / panelArea); 
    const totalCount = Math.ceil(baseCount * (1 + (res / 100))); 
    const packsCount = Math.ceil(totalCount / pack);

    document.getElementById('lc-res-area').innerText = area.toFixed(2) + ' м²';
    document.getElementById('lc-res-count').innerText = baseCount + ' шт';
    document.getElementById('lc-res-total').innerText = totalCount + ' шт';
    document.getElementById('lc-res-packs').innerText = packsCount + ' упаковок';

    // Для ламината зазор между досками = 0
    drawGrid('lc-scheme-canvas', L_m, W_m, lL, lW, 0, method, true);

    document.getElementById('lc-results-block').classList.remove('hidden');
    setTimeout(() => { document.getElementById('main-scroll-container').scrollBy({ top: 400, behavior: 'smooth' }); }, 100);
}


// === КАЛЬКУЛЯТОР ШТУКАТУРКИ (СтройКальк, синяя тема) ===
let pcStep = 1;

let pcMethod = 'room';

let pcMixId = 'gips';

const PC_MIXES = [
    { id: 'gips', name: 'Гипсовая, 8,5 кг/м² на 10 мм', cons: 8.5, short: 'Гипсовая' },
    { id: 'cement', name: 'Цементная, 16 кг/м² на 10 мм', cons: 16, short: 'Цементная' },
    { id: 'lime', name: 'Цементно-известковая, 14 кг/м² на 10 мм', cons: 14, short: 'Цементно-известковая' },
    { id: 'facade', name: 'Фасадная, 15 кг/м² на 10 мм', cons: 15, short: 'Фасадная' }
];


function pcN(id) {
    const el = document.getElementById(id);
    return el ? (parseFloat(String(el.value).replace(',', '.')) || 0) : 0;
}

function pcRu(n, d) {
    if (n == null || isNaN(n)) return '—';
    return n.toLocaleString('ru-RU', { maximumFractionDigits: d, minimumFractionDigits: d === 0 ? 0 : undefined });
}

function pcRub(n) {
    return Math.round(n).toLocaleString('ru-RU') + ' ₽';
}

function pcWallLengths() {
    const L = pcN('pc-len'), W = pcN('pc-wid');
    const longS = Math.max(L, W), shortS = Math.min(L, W);
    const mode = (document.getElementById('pc-walls') || {}).value || '4';
    if (mode === '1L') return [longS];
    if (mode === '1S') return [shortS];
    if (mode === '2L') return [longS, longS];
    if (mode === '2S') return [shortS, shortS];
    return [L, L, W, W];
}

function pcBeaconM(wallLens, step, height) {
    const st = step > 0 ? step : 1.2;
    const lines = wallLens.reduce((s, len) => s + Math.floor(len / st) + 2, 0);
    return { lines, meters: lines * height };
}

function pcCompute() {
    const H = pcMethod === 'room' ? pcN('pc-h') : pcN('pc-h2');
    const extra = pcMethod === 'room' ? pcN('pc-extra') : 0;
    let walls, peri, gross;
    if (pcMethod === 'room') {
        walls = pcWallLengths();
        peri = walls.reduce((s, x) => s + x, 0);
        gross = peri * H + extra;
    } else {
        peri = pcN('pc-peri');
        gross = pcN('pc-area-gross');
        const side = peri > 0 ? peri / 4 : 0;
        walls = side ? [side, side, side, side] : [];
    }
    const winN = pcN('pc-win-n'), doorN = pcN('pc-door-n');
    const openings = winN * pcN('pc-win-a') + doorN * pcN('pc-door-a');
    const net = Math.max(0, gross - openings);
    const thick = pcN('pc-thick');
    const mixRes = pcN('pc-mix-res') / 100;
    const cons = pcN('pc-cons');
    const bagKg = pcN('pc-bag') || 30;
    const mixKg = net * cons * (thick / 10) * (1 + mixRes);
    const bags = mixKg > 0 ? Math.ceil(mixKg / bagKg) : 0;
    const mixCost = bags * pcN('pc-price-bag');
    const primL = net * pcN('pc-prim-r');
    const primCost = primL * pcN('pc-price-prim');
    const beacons = pcBeaconM(walls, pcN('pc-beacon-step'), H);
    const beaconCost = beacons.meters * pcN('pc-price-beacon');
    const meshPct = pcN('pc-mesh-pct') / 100;
    const meshM2 = net * meshPct;
    const meshCost = meshM2 * pcN('pc-price-mesh');
    const openCnt = winN + doorN;
    const cornersM = openCnt * pcN('pc-open-h') * 2;
    const cornerCost = cornersM * pcN('pc-price-corner');
    const workCost = net * pcN('pc-price-work');
    const deliv = pcN('pc-price-deliv');
    const materials = mixCost + primCost + beaconCost + meshCost + cornerCost;
    const sub = materials + workCost + deliv;
    const budgetPct = pcN('pc-budget-res');
    const reserve = sub * (budgetPct / 100);
    const total = sub + reserve;
    const mix = PC_MIXES.find(m => m.id === pcMixId) || PC_MIXES[0];
    const scheme = pcMethod === 'room' ? 'По размерам помещения' : 'По площади стен';
    return {
        scheme, peri, H, gross, openings, net, thick, mixKg, bags, bagKg, mixCost, mix,
        primL, primCost, beacons, beaconCost, meshM2, meshCost, meshPct, cornersM, cornerCost, openCnt,
        workCost, deliv, materials, reserve, budgetPct, total, winN, doorN, extra
    };
}

function pcInit() {
    pcStep = 1;
    pcMethod = 'room';
    pcMixId = 'gips';
    const list = document.getElementById('pc-mix-list');
    if (list && !list.dataset.ready) {
        list.innerHTML = PC_MIXES.map(m => `
            <button type="button" id="pc-mix-${m.id}" onclick="pcSetMix('${m.id}')" class="w-full text-left p-3 rounded-xl border-2 ${m.id === 'gips' ? 'border-[#1e6091] bg-[#1e6091]/5' : 'border-slate-100'}">
                <p class="font-bold text-[12px]">${escHtml(m.name)}</p>
            </button>`).join('');
        list.dataset.ready = '1';
    }
    pcSetMethod('room');
    pcSetMix('gips');
    pcGoStep(1);
    pcLive();
}

function pcReset() {
    const vals = {
        'pc-len': 6, 'pc-wid': 3, 'pc-h': 2.8, 'pc-extra': 0, 'pc-open-h': 2,
        'pc-area-gross': 50.4, 'pc-peri': 18, 'pc-h2': 2.8,
        'pc-win-n': 1, 'pc-win-a': 1.8, 'pc-door-n': 1, 'pc-door-a': 2.1, 'pc-thick': 15, 'pc-mix-res': 10,
        'pc-cons': 8.5, 'pc-bag': 30, 'pc-prim-r': 0.15, 'pc-beacon-step': 1.2, 'pc-mesh-pct': 0, 'pc-budget-res': 5,
        'pc-price-bag': 420, 'pc-price-prim': 90, 'pc-price-beacon': 35, 'pc-price-mesh': 80, 'pc-price-corner': 55, 'pc-price-work': 550, 'pc-price-deliv': 2500
    };
    Object.keys(vals).forEach(id => { const el = document.getElementById(id); if (el) el.value = vals[id]; });
    const w = document.getElementById('pc-walls'); if (w) w.value = '4';
    pcInit();
    if (typeof showSmsToast === 'function') showSmsToast('Параметры сброшены');
}

function pcSetMethod(m) {
    pcMethod = m;
    const room = document.getElementById('pc-method-room');
    const area = document.getElementById('pc-method-area');
    if (room) room.className = 'w-full text-left p-3.5 rounded-2xl border-2 relative ' + (m === 'room' ? 'border-[#1e6091] bg-[#1e6091]/5' : 'border-slate-100 bg-white');
    if (area) area.className = 'w-full text-left p-3.5 rounded-2xl border-2 relative ' + (m === 'area' ? 'border-[#1e6091] bg-[#1e6091]/5' : 'border-slate-100 bg-white');
    if (room) {
        let mark = room.querySelector('.pc-check');
        if (m === 'room') {
            if (!mark) { mark = document.createElement('span'); mark.className = 'pc-check absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1e6091] text-white text-[10px] flex items-center justify-center'; mark.textContent = '✓'; room.appendChild(mark); }
        } else if (mark) mark.remove();
    }
    if (area) {
        let mark = area.querySelector('.pc-check');
        if (m === 'area') {
            if (!mark) { mark = document.createElement('span'); mark.className = 'pc-check absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1e6091] text-white text-[10px] flex items-center justify-center'; mark.textContent = '✓'; area.appendChild(mark); }
        } else if (mark) mark.remove();
    }
    const boxR = document.getElementById('pc-box-room');
    const boxA = document.getElementById('pc-box-area');
    if (boxR) boxR.classList.toggle('hidden', m !== 'room');
    if (boxA) boxA.classList.toggle('hidden', m !== 'area');
    pcLive();
}

function pcSetMix(id) {
    pcMixId = id;
    const mix = PC_MIXES.find(x => x.id === id);
    if (mix) {
        const c = document.getElementById('pc-cons');
        if (c) c.value = mix.cons;
    }
    PC_MIXES.forEach(m => {
        const btn = document.getElementById('pc-mix-' + m.id);
        if (btn) btn.className = 'w-full text-left p-3 rounded-xl border-2 ' + (m.id === id ? 'border-[#1e6091] bg-[#1e6091]/5' : 'border-slate-100');
    });
    pcLive();
}

function pcGoStep(n) {
    if (n < 1 || n > 5) return;
    pcStep = n;
    for (let i = 1; i <= 5; i++) {
        const p = document.getElementById('pc-step-' + i);
        const t = document.getElementById('pc-tab-' + i);
        if (p) p.classList.toggle('hidden', i !== n);
        if (t) {
            const on = i === n;
            t.className = 'pc-tab w-full min-w-0 py-1 px-0 rounded-md text-center ' + (on ? 'border-b-2 border-[#1e6091] bg-[#1e6091]/10' : '');
            const num = t.querySelector('span:first-child');
            const labSpan = t.querySelector('span:last-child');
            if (num) num.className = 'block text-[11px] font-extrabold leading-none ' + (on ? 'text-[#1e6091]' : 'text-slate-400');
            if (labSpan) labSpan.className = 'block text-[8px] font-bold leading-tight mt-0.5 ' + (on ? 'text-slate-800' : 'text-slate-400');
        }
    }
    const pct = n * 20;
    const bar = document.getElementById('pc-progress');
    const lab = document.getElementById('pc-step-label');
    const pctEl = document.getElementById('pc-step-pct');
    if (bar) bar.style.width = pct + '%';
    if (lab) lab.textContent = 'Шаг ' + n + ' из 5';
    if (pctEl) pctEl.textContent = pct + '%';
    const back = document.getElementById('pc-btn-back');
    const next = document.getElementById('pc-btn-next');
    if (back) back.classList.toggle('hidden', n === 1);
    if (next) {
        next.classList.toggle('hidden', n === 5);
        next.textContent = 'Далее';
    }
    if (n === 5) pcRenderResults();
    const sc = document.getElementById('main-scroll-container');
    if (sc) sc.scrollTop = 0;
}

function pcLive() {
    if (pcStep === 5) pcRenderResults();
}

function pcFocusStep(step, msg) {
    pcGoStep(step);
    if (msg && typeof showSmsToast === 'function') showSmsToast(msg);
}

function pcPrintEstimate() {
    window.print();
}

function pcArt(id) {
    const files = { area: 'pc-area.png', mix: 'pc-mix.png', volume: 'pc-volume.png', primer: 'pc-primer.png', beacons: 'pc-beacons.png', total: 'pc-total.png' };
    const src = 'pc-arts/' + (files[id] || '');
    return `<img src="${src}" alt="" class="w-[88px] h-[88px] object-contain mx-auto mb-1 pointer-events-none">`;
}

function pcRenderResults() {
    const r = pcCompute();
    const cards = document.getElementById('pc-result-cards');
    if (!cards) return;
    const items = [
        { step: 2, title: 'Площадь штукатурки', val: pcRu(r.net, 1) + ' м²', sub: 'проёмы ' + pcRu(r.openings, 1) + ' м², брутто ' + pcRu(r.gross, 1) + ' м²', art: 'area' },
        { step: 3, title: 'Штукатурная смесь', val: r.bags + ' шт.', sub: pcRu(r.mixKg, 0) + ' кг, ' + r.bagKg + ' кг/меш.', art: 'mix' },
        { step: 2, title: 'Объём слоя', val: pcRu(r.net * (r.thick / 1000), 1) + ' м³', sub: 'средний слой ' + r.thick + ' мм', art: 'volume' },
        { step: 3, title: 'Грунтовка', val: pcRu(r.primL, 1) + ' л', sub: 'по площади стен', art: 'primer' },
        { step: 3, title: 'Маяки и уголки', val: pcRu(r.beacons.meters, 1) + ' / ' + pcRu(r.cornersM, 1) + ' м', sub: r.beacons.lines + ' линий маяков', art: 'beacons' },
        { step: 4, title: 'Результат', val: pcRub(r.total), sub: 'с резервом бюджета', art: 'total', hl: true }
    ];
    cards.innerHTML = items.map(c => `
        <button type="button" onclick="pcFocusStep(${c.step}, '${escJsArg(c.title)}')" class="text-center rounded-2xl border p-3 ${c.hl ? 'border-[#1e6091] bg-[#e8f1f8]' : 'border-slate-200 bg-white'}">
            ${pcArt(c.art)}
            <p class="text-[10px] font-bold text-slate-800">${escHtml(c.title)}</p>
            <p class="text-[16px] font-bold">${c.val}</p>
            <p class="text-[10px] text-slate-400 mt-0.5">${c.sub}</p>
        </button>`).join('');
    const sum = document.getElementById('pc-summary-cards');
    const sItems = [
        { t: 'Проёмы', v: pcRu(r.openings, 1) + ' м²', s: 2 },
        { t: 'Сетка', v: r.meshPct > 0 ? pcRu(r.meshM2, 1) + ' м²' : '—', s: 3 },
        { t: 'Материалы', v: pcRub(r.materials), s: 4 },
        { t: 'Работы', v: pcRub(r.workCost), s: 4 },
        { t: 'Доставка', v: pcRub(r.deliv), s: 4 },
        { t: 'Резерв', v: pcRub(r.reserve), s: 4 }
    ];
    if (sum) sum.innerHTML = sItems.map(x => `
        <button type="button" onclick="pcFocusStep(${x.s}, '${x.t}')" class="text-left rounded-xl border border-slate-200 p-2.5 bg-white">
            <p class="text-[10px] font-bold text-slate-500">${x.t}</p>
            <p class="text-[14px] font-bold">${x.v}</p>
        </button>`).join('');
    const body = document.getElementById('pc-estimate-body');
    const rows = [
        { name: 'Схема расчёта', vol: r.scheme, cost: '—', com: pcRu(r.peri, 1) + ' пог. м × ' + pcRu(r.H, 1) + ' м', s: 1 },
        { name: 'Площадь стен брутто', vol: pcRu(r.gross, 1) + ' м²', cost: '—', com: 'до вычета окон и дверей', s: 2 },
        { name: 'Проёмы', vol: pcRu(r.openings, 1) + ' м²', cost: '—', com: r.winN + ' шт. окон, ' + r.doorN + ' шт. дверей', s: 2 },
        { name: 'Площадь штукатурки', vol: pcRu(r.net, 1) + ' м²', cost: '—', com: 'после вычета проёмов', s: 2 },
        { name: 'Объём слоя', vol: pcRu(r.net * (r.thick / 1000), 1) + ' м³', cost: '—', com: 'средняя толщина ' + r.thick + ' мм', s: 2 },
        { name: 'Штукатурная смесь', vol: pcRu(r.mixKg, 0) + ' кг, ' + r.bags + ' шт. меш.', cost: pcRub(r.mixCost), com: r.mix.short + ', ' + r.mix.cons + ' кг/м² на 10 мм, запас ' + pcN('pc-mix-res') + '%', s: 3 },
        { name: 'Грунтовка', vol: pcRu(r.primL, 0) + ' л', cost: pcRub(r.primCost), com: pcN('pc-prim-r') + ' л/м²', s: 3 },
        { name: 'Маяки', vol: pcRu(r.beacons.meters, 1) + ' пог. м', cost: pcRub(r.beaconCost), com: r.beacons.lines + ' линий, шаг ' + pcN('pc-beacon-step') + ' м', s: 3 },
        { name: 'Армирующая сетка', vol: r.meshPct > 0 ? pcRu(r.meshM2, 1) + ' м²' : '—', cost: pcRub(r.meshCost), com: Math.round(r.meshPct * 100) + '% площади', s: 3 },
        { name: 'Уголки проёмов', vol: pcRu(r.cornersM, 1) + ' пог. м', cost: pcRub(r.cornerCost), com: r.openCnt + ' шт. проёмов × ' + pcN('pc-open-h') + ' м × 2', s: 3 },
        { name: 'Работа', vol: pcRu(r.net, 1) + ' м²', cost: pcRub(r.workCost), com: pcN('pc-price-work') + ' ₽/м²', s: 4 },
        { name: 'Доставка', vol: '—', cost: pcRub(r.deliv), com: 'доставка смеси и комплектующих', s: 4 },
        { name: 'Резерв бюджета', vol: pcN('pc-budget-res') + '%', cost: pcRub(r.reserve), com: 'резерв на уточнения и добор', s: 4 }
    ];
    if (body) body.innerHTML = rows.map(row => `
        <tr onclick="pcFocusStep(${row.s}, '${escJsArg(row.name)}')" class="border-t border-slate-100 cursor-pointer hover:bg-blue-50">
            <td class="p-2">${escHtml(row.name)}</td>
            <td class="p-2 font-bold">${row.vol}</td>
            <td class="p-2">${row.cost}</td>
            <td class="p-2 text-slate-500">${row.com}</td>
        </tr>`).join('');
}


// === КАЛЬКУЛЯТОР РЕМОНТА (stk-svoydom, синяя тема) ===
let rcType = 'apt';

let rcUid = 1;

let rcData = { groups: [], extras: [], area: 50 };


function rcMoney(n) {
    return (Number(n) || 0).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' руб';
}

function rcWalls(area) { return Math.round(area * 2.4 * 10) / 10; }

function rcTpl() {
    return {
        apt: {
            areaLabel: 'Площадь квартиры (м²)', resultTitle: 'Детализация стоимости ремонта квартиры', area: 50,
            groups: [
                { name: 'Демонтажные работы', items: [
                    { t: 'Демонтаж старых покрытий (полы, стены)', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 300, q: 50, from: 'area' },
                    { t: 'Демонтаж сантехники', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 1500, q: 3, hint: 'Унитаз, раковина, ванна/душевая' }
                ]},
                { name: 'Черновые работы', items: [
                    { t: 'Выравнивание стен штукатуркой', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 800, q: 120, from: 'walls' },
                    { t: 'Стяжка пола цементная', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 600, q: 50, from: 'area' },
                    { t: 'Шпаклевка стен под покраску', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 400, q: 120, from: 'walls' }
                ]},
                { name: 'Электромонтажные работы', items: [
                    { t: 'Разводка электрики', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 2500, q: 15 },
                    { t: 'Установка щитка', pl: 'Цена (руб)', ql: 'Количество', p: 15000, q: 1 }
                ]},
                { name: 'Сантехнические работы', items: [
                    { t: 'Разводка водопровода', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 3500, q: 5 },
                    { t: 'Разводка канализации', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 2400, q: 5 }
                ]},
                { name: 'Чистовая отделка', items: [
                    { t: 'Покраска стен', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 300, q: 120, from: 'walls' },
                    { t: 'Укладка ламината', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 500, q: 50, from: 'area' },
                    { t: 'Укладка плитки в санузле', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 1200, q: 10 },
                    { t: 'Установка межкомнатных дверей', pl: 'Цена за шт. (руб)', ql: 'Количество', p: 3000, q: 4 },
                    { t: 'Монтаж потолка (натяжной/ГКЛ)', pl: 'Цена за м² (руб)', ql: 'Площадь потолка (м²)', p: 800, q: 50, from: 'area' }
                ]}
            ]
        },
        new: {
            areaLabel: 'Площадь новостройки (м²)', resultTitle: 'Детализация стоимости ремонта новостройки', area: 50,
            groups: [
                { name: 'Подготовительные работы', items: [
                    { t: 'Грунтовка стен и потолков', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 510, q: 50, from: 'area' },
                    { t: 'Штукатурка стен по маякам', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 600, q: 120, from: 'walls' }
                ]},
                { name: 'Черновые работы', items: [
                    { t: 'Стяжка пола с утеплением', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 900, q: 50, from: 'area' },
                    { t: 'Шпаклевка стен под обои', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 400, q: 120, from: 'walls' }
                ]},
                { name: 'Электромонтажные работы', items: [
                    { t: 'Полная разводка электрики', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 2520, q: 20 },
                    { t: 'Установка распределительного щита', pl: 'Цена (руб)', ql: 'Количество', p: 18000, q: 1 }
                ]},
                { name: 'Сантехнические работы', items: [
                    { t: 'Разводка водопроводных труб', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 4800, q: 5 },
                    { t: 'Монтаж канализационных труб', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 3600, q: 5 }
                ]},
                { name: 'Чистовая отделка', items: [
                    { t: 'Поклейка обоев', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 450, q: 120, from: 'walls' },
                    { t: 'Укладка плитки в санузле', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 1800, q: 10 },
                    { t: 'Укладка ламината/паркета', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 700, q: 50, from: 'area' },
                    { t: 'Монтаж натяжных потолков', pl: 'Цена за м² (руб)', ql: 'Площадь потолка (м²)', p: 1200, q: 50, from: 'area' }
                ]}
            ]
        },
        house: {
            areaLabel: 'Площадь дома (м²)', resultTitle: 'Детализация стоимости ремонта частного дома', area: 150,
            groups: [
                { name: 'Наружные работы', items: [
                    { t: 'Утепление фасада (пенопласт+штукатурка)', pl: 'Цена за м² (руб)', ql: 'Площадь фасада (м²)', p: 2400, q: 150, from: 'area' },
                    { t: 'Монтаж водосточной системы', pl: 'Цена за п.м. (руб)', ql: 'Длина (м)', p: 2000, q: 30 }
                ]},
                { name: 'Внутренние работы', items: [
                    { t: 'Штукатурка стен по маякам', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 1400, q: 150, from: 'area' },
                    { t: 'Стяжка пола с утеплением', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 600, q: 150, from: 'area' }
                ]},
                { name: 'Коммуникации', items: [
                    { t: 'Разводка электрики по дому', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 3500, q: 30 },
                    { t: 'Монтаж отопительной системы', pl: 'Цена за м² (руб)', ql: 'Площадь дома (м²)', p: 1000, q: 150, from: 'area' },
                    { t: 'Разводка водопровода', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 3600, q: 10 }
                ]},
                { name: 'Чистовая отделка', items: [
                    { t: 'Покраска стен', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 700, q: 150, from: 'area' },
                    { t: 'Укладка плитки в санузлах', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 1750, q: 20 },
                    { t: 'Установка межкомнатных дверей', pl: 'Цена за шт. (руб)', ql: 'Количество', p: 8000, q: 5 },
                    { t: 'Монтаж лестницы', pl: 'Цена (руб)', ql: 'Количество', p: 50000, q: 1 }
                ]}
            ]
        },
        comm: {
            areaLabel: 'Площадь помещения (м²)', resultTitle: 'Детализация стоимости коммерческого ремонта', area: 80,
            groups: [
                { name: 'Демонтажные работы', items: [
                    { t: 'Демонтаж перегородок и конструкций', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 500, q: 80, from: 'area' }
                ]},
                { name: 'Черновые работы', items: [
                    { t: 'Возведение перегородок (ГКЛ)', pl: 'Цена за м² (руб)', ql: 'Площадь (м²)', p: 750, q: 80, from: 'area' },
                    { t: 'Стяжка пола промышленная', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 800, q: 80, from: 'area' }
                ]},
                { name: 'Электромонтажные работы', items: [
                    { t: 'Разводка электрики (офисный стандарт)', pl: 'Цена за точку (руб)', ql: 'Количество точек', p: 2750, q: 20 },
                    { t: 'Монтаж щита учета', pl: 'Цена (руб)', ql: 'Количество', p: 25000, q: 1 }
                ]},
                { name: 'Отделочные работы', items: [
                    { t: 'Покраска стен (офисная)', pl: 'Цена за м² (руб)', ql: 'Площадь стен (м²)', p: 700, q: 100 },
                    { t: 'Напольные покрытия (линолеум коммерческий)', pl: 'Цена за м² (руб)', ql: 'Площадь пола (м²)', p: 600, q: 80, from: 'area' },
                    { t: 'Подвесные потолки (Армстронг)', pl: 'Цена за м² (руб)', ql: 'Площадь потолка (м²)', p: 900, q: 80, from: 'area' },
                    { t: 'Освещение (светильники LED)', pl: 'Цена за шт. (руб)', ql: 'Количество', p: 1500, q: 30 }
                ]}
            ]
        }
    };
}

function rcStamp(src) {
    const d = JSON.parse(JSON.stringify(src));
    d.groups.forEach(g => g.items.forEach(it => { it.id = rcUid++; }));
    d.extras = [];
    return d;
}

function rcInit() {
    rcEnsureBind();
    rcType = 'apt';
    rcLoadType('apt');
}

function rcReset() {
    rcLoadType(rcType);
    const res = document.getElementById('rc-results');
    if (res) res.classList.add('hidden');
    if (typeof showSmsToast === 'function') showSmsToast('Расчёт сброшен');
}

function rcLoadType(type) {
    rcType = type;
    rcData = rcStamp(rcTpl()[type]);
    const areaEl = document.getElementById('rc-area');
    const lab = document.getElementById('rc-area-label');
    if (areaEl) areaEl.value = rcData.area;
    if (lab) lab.textContent = rcData.areaLabel;
    ['apt', 'new', 'house', 'comm'].forEach(k => {
        const b = document.getElementById('rc-tab-' + k);
        if (!b) return;
        b.className = 'shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold ' + (k === type ? 'bg-[#1e6091] text-white' : 'bg-white border border-slate-200 text-slate-700');
    });
    rcRender();
}

function rcSetType(type) { rcLoadType(type); }

function rcOnArea() {
    const area = parseFloat(document.getElementById('rc-area').value) || 0;
    rcData.area = area;
    const walls = rcWalls(area);
    rcData.groups.forEach(g => g.items.forEach(it => {
        if (it.from === 'area') it.q = area;
        if (it.from === 'walls') it.q = walls;
    }));
    rcRender();
}

function rcCardHtml(it, kind, g, i) {
    const sum = (Number(it.p) || 0) * (Number(it.q) || 0);
    const key = kind + '-' + g + '-' + i;
    return `<div class="bg-white border border-slate-200 rounded-xl p-3 relative" style="border-left:4px solid #1e6091">
        <div class="flex items-start justify-between gap-2 pr-8">
            <input type="text" value="${String(it.t).replace(/"/g, '&quot;')}" oninput="rcRename('${kind}',${g},${i},this.value)" class="font-bold text-[13px] text-[#1e6091] bg-transparent w-full outline-none">
            <button type="button" data-rc-del="${kind},${g},${i}" class="absolute top-2 right-2 w-6 h-6 rounded bg-red-500 text-white text-sm font-bold leading-none">×</button>
        </div>
        ${it.hint ? `<p class="text-[10px] text-slate-400 mt-0.5">${it.hint}</p>` : ''}
        <div class="grid grid-cols-2 gap-2 mt-2">
            <div><label class="text-[10px] text-slate-500">${it.pl || 'Цена (руб)'}</label><input type="number" value="${it.p}" oninput="rcSet('${kind}',${g},${i},'p',this.value)" class="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs"></div>
            <div><label class="text-[10px] text-slate-500">${it.ql || 'Количество'}</label><input type="number" value="${it.q}" oninput="rcSet('${kind}',${g},${i},'q',this.value)" class="w-full border border-slate-200 rounded-lg px-2 py-2 text-xs"></div>
        </div>
        <div class="flex flex-col items-end mt-2 gap-1.5">
            <p id="rc-sum-${key}" class="text-[13px] font-extrabold text-[#1e6091]">${rcMoney(sum)}</p>
            <button type="button" data-rc-add="${kind},${g},${i}" class="bg-[#1e6091] text-white text-[12px] font-bold px-3 py-2 rounded-lg active:opacity-80">+ Добавить услугу</button>
        </div>
    </div>`;
}

function rcEnsureBind() {
    const root = document.getElementById('calc-content-repair');
    if (!root || root.dataset.rcBound) return;
    root.dataset.rcBound = '1';
    root.addEventListener('click', function(e) {
        const addBtn = e.target.closest('[data-rc-add]');
        if (addBtn) {
            e.preventDefault();
            const p = addBtn.getAttribute('data-rc-add').split(',');
            rcAddAfter(p[0], Number(p[1]), Number(p[2]));
            return;
        }
        const rm = e.target.closest('[data-rc-del]');
        if (rm) {
            e.preventDefault();
            const p = rm.getAttribute('data-rc-del').split(',');
            rcRemove(p[0], Number(p[1]), Number(p[2]));
        }
    });
}

function rcRender() {
    rcEnsureBind();
    const wrap = document.getElementById('rc-groups');
    if (!wrap) return;
    wrap.innerHTML = rcData.groups.map((g, gi) => `
        <div>
            <h6 class="text-[14px] font-bold text-[#1e6091] pb-1 mb-2 border-b border-[#1e6091]/40">${escHtml(g.name)}</h6>
            <div class="space-y-2">${g.items.map((it, ii) => rcCardHtml(it, 'work', gi, ii)).join('')}</div>
        </div>`).join('');
    const ex = document.getElementById('rc-extras');
    if (ex) ex.innerHTML = (rcData.extras || []).map((it, ii) => rcCardHtml(it, 'extra', 0, ii)).join('');
}

function rcItem(kind, g, i) {
    return kind === 'extra' ? rcData.extras[i] : rcData.groups[g].items[i];
}

function rcSet(kind, g, i, field, val) {
    const it = rcItem(kind, g, i);
    if (!it) return;
    it[field] = parseFloat(val) || 0;
    if (it.from) it.from = null;
    const el = document.getElementById('rc-sum-' + kind + '-' + g + '-' + i);
    if (el) el.textContent = rcMoney((Number(it.p) || 0) * (Number(it.q) || 0));
}

function rcRename(kind, g, i, val) {
    const it = rcItem(kind, g, i);
    if (it) it.t = val;
}

function rcRemove(kind, g, i) {
    if (kind === 'extra') rcData.extras.splice(i, 1);
    else rcData.groups[g].items.splice(i, 1);
    rcRender();
}

function rcNewItem() {
    return { id: rcUid++, t: 'Новая услуга', pl: 'Цена (руб)', ql: 'Количество', p: 0, q: 1 };
}

function rcAddAfter(kind, g, i) {
    if (kind === 'extra') rcData.extras.splice(i + 1, 0, rcNewItem());
    else {
        if (!rcData.groups[g]) return;
        rcData.groups[g].items.splice(i + 1, 0, rcNewItem());
    }
    rcRender();
    if (typeof showSmsToast === 'function') showSmsToast('Добавлена «Новая услуга»');
}

function rcAllItems() {
    const list = [];
    rcData.groups.forEach(g => g.items.forEach(it => list.push({ name: it.t, sum: (it.p || 0) * (it.q || 0), group: g.name })));
    rcData.extras.forEach(it => list.push({ name: it.t, sum: (it.p || 0) * (it.q || 0), group: 'Дополнительные услуги' }));
    return list;
}

function rcCalculate() {
    const items = rcAllItems().filter(x => x.sum > 0 || true);
    const mainSum = rcData.groups.reduce((s, g) => s + g.items.reduce((a, it) => a + (it.p || 0) * (it.q || 0), 0), 0);
    const extraSum = rcData.extras.reduce((s, it) => s + (it.p || 0) * (it.q || 0), 0);
    const total = mainSum + extraSum;
    const tpl = rcTpl()[rcType];
    const title = document.getElementById('rc-results-title');
    const body = document.getElementById('rc-results-body');
    const box = document.getElementById('rc-results');
    if (title) title.textContent = tpl.resultTitle;
    let html = '<p class="text-[13px] font-bold mb-2">Основные работы</p>';
    rcData.groups.forEach(g => {
        g.items.forEach(it => {
            html += `<button type="button" class="w-full flex justify-between gap-2 py-2 border-b border-dotted border-slate-200 text-[12px] text-left"><span>${it.t}</span><span class="font-semibold shrink-0">${rcMoney((it.p || 0) * (it.q || 0))}</span></button>`;
        });
    });
    html += `<div class="flex justify-between py-2 text-[12px] font-bold"><span>Итого по основным работам</span><span>${rcMoney(mainSum)}</span></div>`;
    if (rcData.extras.length) {
        html += '<p class="text-[13px] font-bold mt-3 mb-2">Дополнительные услуги</p>';
        rcData.extras.forEach(it => {
            html += `<button type="button" class="w-full flex justify-between gap-2 py-2 border-b border-dotted border-slate-200 text-[12px] text-left"><span>${it.t}</span><span class="font-semibold shrink-0">${rcMoney((it.p || 0) * (it.q || 0))}</span></button>`;
        });
        html += `<div class="flex justify-between py-2 text-[12px] font-bold"><span>Итого по доп. услугам</span><span>${rcMoney(extraSum)}</span></div>`;
    }
    html += `<div class="flex justify-between pt-3 text-[16px] font-extrabold text-[#1e6091]"><span>Итого:</span><span>${rcMoney(total)}</span></div>`;
    if (body) body.innerHTML = html;
    if (box) box.classList.remove('hidden');
    const sc = document.getElementById('main-scroll-container');
    if (sc) sc.scrollTo({ top: sc.scrollHeight, behavior: 'smooth' });
}


// === УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ОТРИСОВКИ СЕТКИ (Плитка + Ламинат) С ПОЛНОЙ НУМЕРАЦИЕЙ КАЖДОГО КУСОЧКА ===
function drawGrid(canvasId, rL, rW, tL_mm, tW_mm, gap_mm, method, isLaminate) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    canvas.innerHTML = '';
    
    const cWidth = canvas.clientWidth || 300;
    const cHeight = 280; // Комфортная высота для полной видимости цифр
    
    const roomW = rL * 1000; 
    const roomH = rW * 1000;
    
    const scale = Math.min((cWidth - 20) / roomW, (cHeight - 20) / roomH);
    
    const drawW = roomW * scale;
    const drawH = roomH * scale;
    const dTileW = tL_mm * scale;
    const dTileH = tW_mm * scale;
    const dGap = gap_mm * scale;

    const roomDiv = document.createElement('div');
    roomDiv.className = 'relative overflow-hidden bg-slate-100 shadow-inner';
    roomDiv.style.width = drawW + 'px';
    roomDiv.style.height = drawH + 'px';
    roomDiv.style.border = '2px solid #1e6091'; // Синие границы комнаты
    
    if (method !== 'diagonal') {
        // === ПРЯМЫЕ И ПАЛУБНЫЕ УКЛАДКИ ===
        let boardNum = 1;
        let remL = dTileW; 
        
        const rows = Math.ceil(drawH / (dTileH + dGap));
        
        for (let r = 0; r < rows; r++) {
            let x = 0;
            let y = r * (dTileH + dGap);
            
            if (method === 'half' || (method === 'offset' && !isLaminate)) {
                remL = (r % 2 === 0) ? dTileW : dTileW / 2;
                boardNum++; 
            } else if (method === 'third') {
                remL = dTileW - ((r % 3) * (dTileW / 3));
                boardNum++;
            } else if (method === 'offset' && isLaminate) {
                 remL = (r % 2 === 0) ? dTileW : dTileW / 2;
                 boardNum++; 
            }
            
            if (remL <= 0.1) remL = dTileW;

            while (x < drawW) {
                let w = Math.min(remL, drawW - x);
                
                let tile = document.createElement('div');
                tile.className = 'absolute bg-white border border-[#1e6091] overflow-hidden hover:bg-blue-50 transition-colors cursor-pointer';
                tile.style.left = x + 'px';
                tile.style.top = y + 'px';
                tile.style.width = w + 'px';
                tile.style.height = dTileH + 'px';
                
                if (isLaminate) {
                    let texture = document.createElement('div');
                    texture.className = 'w-[40%] h-[1px] bg-slate-200 absolute top-1/2 left-[30%] -translate-y-1/2 opacity-50 pointer-events-none';
                    tile.appendChild(texture);
                }
                
                // НУМЕРАЦИЯ КАЖДОЙ ПЛИТКИ И КУСОЧКА БЕЗ ПРОПУСКОВ
                let num = document.createElement('span');
                num.innerText = boardNum;
                num.className = 'absolute top-[2px] left-[4px] text-[9px] font-extrabold text-[#1e6091] leading-none pointer-events-none select-none z-10';
                tile.appendChild(num);
                
                roomDiv.appendChild(tile);
                x += w + dGap;
                
                if (w >= remL - 0.5) {
                    remL = dTileW;
                    boardNum++; 
                } else {
                    remL -= w;
                }
            }
        }
        canvas.appendChild(roomDiv);
    } else {
        // === ДИАГОНАЛЬНАЯ УКЛАДКА ===
        const innerDiv = document.createElement('div');
        innerDiv.style.position = 'absolute';
        
        const diag = Math.sqrt(drawW*drawW + drawH*drawH);
        innerDiv.style.width = diag + 'px';
        innerDiv.style.height = diag + 'px';
        innerDiv.style.left = -(diag - drawW) / 2 + 'px';
        innerDiv.style.top = -(diag - drawH) / 2 + 'px';
        innerDiv.style.transform = 'rotate(45deg)';
        
        const cols = Math.ceil(diag / (dTileW + dGap));
        const rows = Math.ceil(diag / (dTileH + dGap));
        
        let tilesToNumber = [];

        for (let r = -2; r < rows + 2; r++) {
            for (let c = -2; c < cols + 2; c++) {
                let lx = c * (dTileW + dGap);
                let ly = r * (dTileH + dGap);
                
                let tcx = lx + dTileW / 2;
                let tcy = ly + dTileH / 2;
                const a = 45 * Math.PI / 180;
                let dx = tcx - diag / 2;
                let dy = tcy - diag / 2;
                let rx = dx * Math.cos(a) - dy * Math.sin(a) + drawW / 2;
                let ry = dx * Math.sin(a) + dy * Math.cos(a) + drawH / 2;
                
                const tol = Math.max(dTileW, dTileH) / 1.5; 
                if (rx < -tol || rx > drawW + tol || ry < -tol || ry > drawH + tol) continue;

                let tile = document.createElement('div');
                tile.className = 'absolute bg-white border border-[#1e6091] overflow-hidden hover:bg-blue-50 transition-colors cursor-pointer';
                tile.style.left = lx + 'px';
                tile.style.top = ly + 'px';
                tile.style.width = dTileW + 'px';
                tile.style.height = dTileH + 'px';
                
                if (isLaminate) {
                    let texture = document.createElement('div');
                    texture.className = 'w-[40%] h-[1px] bg-slate-200 absolute top-1/2 left-[30%] -translate-y-1/2 opacity-50 pointer-events-none';
                    tile.appendChild(texture);
                }

                innerDiv.appendChild(tile);
                tilesToNumber.push({ el: tile, rx: rx, ry: ry });
            }
        }
        
        // Сортируем строго сверху-вниз, слева-направо
        tilesToNumber.sort((a, b) => {
            if (Math.abs(a.ry - b.ry) < (dTileH * 0.4)) return a.rx - b.rx; 
            return a.ry - b.ry; 
        });

        // Нумеруем абсолютно каждый видимый элемент диагонали
        let tileNumber = 1;
        tilesToNumber.forEach(t => {
            let num = document.createElement('span');
            num.innerText = tileNumber++;
            num.style.transform = 'rotate(-45deg)';
            num.style.transformOrigin = 'top left';
            num.className = 'absolute top-[6px] left-[5px] text-[9px] font-extrabold text-[#1e6091] leading-none pointer-events-none select-none z-10';
            t.el.appendChild(num);
        });

        roomDiv.appendChild(innerDiv);
        canvas.appendChild(roomDiv);
    }
    
    // Подпись схемы
    const label = document.getElementById(isLaminate ? 'lc-scheme-label' : 'tc-scheme-label');
    if(label) {
        if(method === 'straight') label.innerText = 'Схема: Прямая укладка';
        if(method === 'offset') label.innerText = 'Схема: Укладка со смещением';
        if(method === 'half') label.innerText = 'Схема: Палубная 1/2';
        if(method === 'third') label.innerText = 'Схема: Палубная 1/3';
        if(method === 'diagonal') label.innerText = 'Схема: Диагональ 45°';
    }
}
