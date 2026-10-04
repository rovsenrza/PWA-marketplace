/* Обратная связь.
   Окно выбора канала связи с командой приложения.
   Классический скрипт: функции глобальные (их вызывает разметка). Только объявления —
   код, который выполняется при загрузке, живёт в boot.js и идёт последним. */

/* Доп. функции приложения.
   Обратная связь, ассистент (UI), рекомендации и категории, калькуляторы ремонта, агентства.
   Классический скрипт (не модуль): функции глобальные, их вызывают inline-обработчики разметки.
   Сборка: плагин legacy-scripts в vite.config.ts (минификация без переименования, хэш в имени). */

    function openFeedbackModal() {
        const m = document.getElementById('feedback-modal');
        if (!m) return;
        m.classList.remove('hidden');
        m.classList.add('flex');
    }

function closeFeedbackModal() {
    const m = document.getElementById('feedback-modal');
    if (!m) return;
    m.classList.add('hidden');
    m.classList.remove('flex');
}

function openFeedbackChannel(kind) {
    const url = (typeof FEEDBACK_LINKS !== 'undefined' && FEEDBACK_LINKS[kind]) ? FEEDBACK_LINKS[kind] : '';
    if (!url) return;
    window.open(url, '_blank');
}
