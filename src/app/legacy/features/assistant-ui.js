/* Умный помощник: интерфейс.
   Лист помощника, подсказки-чипсы, сообщения, карточки результатов (движок — assistant.js).
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */


var ASSISTANT_CHIPS = [
    'Мне нужна штукатурка и расходные материалы',
    'Кровать 2×2 м за 20–30 тыс. и матрас',
    'Кухня до 200 тысяч'
];


function assistantEsc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
}


function openAssistant() {
    var sheet = document.getElementById('assistant-sheet');
    var tab = document.getElementById('assistant-side-tab');
    if (!sheet) return;
    sheet.classList.remove('hidden');
    sheet.classList.add('flex');
    if (tab) tab.hidden = true;
    var thread = document.getElementById('assistant-thread');
    if (thread && !thread.dataset.ready) {
        thread.dataset.ready = '1';
        appendAssistantBot('Здравствуйте. Опишите задачу — подберу товары из каталога всех магазинов. Можно указать размер, бюджет и материалы.');
        renderAssistantChips();
    }
    setTimeout(function () {
        var inp = document.getElementById('assistant-input');
        if (inp) inp.focus();
    }, 200);
}


function closeAssistant() {
    var sheet = document.getElementById('assistant-sheet');
    var tab = document.getElementById('assistant-side-tab');
    if (sheet) {
        sheet.classList.add('hidden');
        sheet.classList.remove('flex');
    }
    if (tab) tab.hidden = false;
}


function renderAssistantChips() {
    var wrap = document.getElementById('assistant-chips');
    if (!wrap) return;
    wrap.innerHTML = ASSISTANT_CHIPS.map(function (t) {
        return '<button type="button" class="shrink-0 text-[11px] font-semibold text-[#1e6091] bg-[#e8f1f8] px-3 py-1.5 rounded-full" onclick="assistantFillChip(this)">' + assistantEsc(t) + '</button>';
    }).join('');
}


function assistantFillChip(btn) {
    var inp = document.getElementById('assistant-input');
    if (!inp || !btn) return;
    inp.value = btn.textContent;
    sendAssistantQuery();
}


function appendAssistantUser(text) {
    var thread = document.getElementById('assistant-thread');
    if (!thread) return;
    var d = document.createElement('div');
    d.className = 'as-msg as-msg-user rounded-2xl rounded-tr-md px-3 py-2 text-[13px] leading-relaxed';
    d.textContent = text;
    thread.appendChild(d);
    thread.scrollTop = thread.scrollHeight;
}


function appendAssistantBot(text) {
    var thread = document.getElementById('assistant-thread');
    if (!thread) return;
    var d = document.createElement('div');
    d.className = 'as-msg as-msg-bot rounded-2xl rounded-tl-md px-3 py-2 text-[13px] leading-relaxed';
    d.textContent = text;
    thread.appendChild(d);
    thread.scrollTop = thread.scrollHeight;
}


function assistantOpenProduct(id) {
    var pm = document.getElementById('product-modal');
    if (pm) pm.style.zIndex = '150';
    if (typeof openProductModal === 'function') openProductModal(id);
}


function assistantOpenLifehack(id) {
    closeAssistant();
    if (typeof openLifehackArticle === 'function') openLifehackArticle(id);
}


function renderAssistantResults(res) {
    var thread = document.getElementById('assistant-thread');
    if (!thread || !res) return;
    var products = res.products || [];
    var hacks = res.lifehacks || [];
    if (products.length) {
        var wrap = document.createElement('div');
        wrap.className = 'space-y-2';
        products.forEach(function (p) {
            var traits = (window.AssistantAI && AssistantAI.traits) ? AssistantAI.traits(p) : (p.category || '');
            var card = document.createElement('button');
            card.type = 'button';
            card.className = 'as-prod-card w-full text-left bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex gap-3 p-2';
            card.onclick = function () { assistantOpenProduct(p.id); };
            card.innerHTML =
                '<img src="' + assistantEsc(p.image || '') + '" alt="" class="w-[72px] h-[72px] object-cover rounded-xl bg-slate-100 shrink-0">' +
                '<div class="min-w-0 flex-1 py-0.5">' +
                '<p class="text-[13px] font-bold text-slate-900 line-clamp-2 leading-snug">' + assistantEsc(p.title) + '</p>' +
                '<p class="text-[14px] font-extrabold text-[#1e6091] mt-0.5">' + assistantEsc(p.price) + '</p>' +
                '<p class="text-[11px] text-slate-400 mt-0.5">' + assistantEsc(p.store || '') + '</p>' +
                (traits ? '<p class="text-[11px] text-slate-500 mt-0.5 line-clamp-2">' + assistantEsc(traits) + '</p>' : '') +
                '</div>';
            wrap.appendChild(card);
        });
        thread.appendChild(wrap);
    }
    if (hacks.length) {
        hacks.forEach(function (h) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'as-msg as-msg-bot w-full text-left rounded-2xl px-3 py-2 text-[12px]';
            b.innerHTML = '<span class="text-[10px] font-bold uppercase text-[#1e6091]">Лайфхак</span><p class="font-semibold mt-0.5">' + assistantEsc(h.title) + '</p>';
            b.onclick = function () { assistantOpenLifehack(h.id); };
            thread.appendChild(b);
        });
    }
    thread.scrollTop = thread.scrollHeight;
}


function sendAssistantQuery(e) {
    if (e) e.preventDefault();
    var inp = document.getElementById('assistant-input');
    var text = inp ? String(inp.value || '').trim() : '';
    if (!text) return false;
    if (inp) inp.value = '';
    appendAssistantUser(text);
    var ctx = {
        products: (typeof productsDb !== 'undefined' ? productsDb : window.productsDb) || {},
        lifehacks: (typeof lifehacksDb !== 'undefined' ? lifehacksDb : window.lifehacksDb) || []
    };
    var run = (window.AssistantAI && AssistantAI.ask)
        ? AssistantAI.ask(text, ctx)
        : Promise.resolve({ message: 'Помощник загружается. Обновите страницу.', products: [], lifehacks: [] });
    run.then(function (res) {
        appendAssistantBot(res.message || 'Готово.');
        renderAssistantResults(res);
    });
    return false;
}
