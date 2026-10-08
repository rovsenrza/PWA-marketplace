import { StorageKeys } from '../../../shared/storage/keys';
import { readJSON, writeJSON } from '../../../shared/storage/local-store';
import { html } from '../../../shared/ui/html';
import { registerActions } from '../../../shared/ui/actions';
import { exposeToLegacy } from '../../../shared/legacy/expose';

const accepted = () => readJSON<{ agreement: boolean; cookies: boolean } | null>(StorageKeys.consent, null);
function showConsent(): boolean {
  const saved = accepted();
  if (saved?.agreement && saved.cookies) return false;
  const box = document.getElementById('onb-slides-container');
  if (!box) return false;
  box.innerHTML = html`<section class="r-consent"><h2>Перед началом</h2><p>Каталоги местных магазинов, товары и связь с менеджерами в одном приложении.</p><label><input id="consent-agreement" type="checkbox">Я принимаю пользовательское соглашение</label><button type="button" class="r-chip" data-action="consent-document" data-document="agreement">Прочитать соглашение</button><label><input id="consent-cookies" type="checkbox">Я согласен с использованием cookies и локального хранилища</label><button type="button" class="r-chip" data-action="consent-document" data-document="cookies">О cookies и хранении данных</button></section>`.value;
  document.getElementById('onb-dots-container')?.classList.add('hidden');
  const next = document.querySelector<HTMLButtonElement>('#onb-footer > button');
  if (next) { next.disabled = true; next.textContent = 'Начать'; }
  box.addEventListener('change', updateGate);
  return true;
}
function updateGate() {
  const checked = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.checked;
  const next = document.querySelector<HTMLButtonElement>('#onb-footer > button');
  if (next) next.disabled = !(checked('consent-agreement') && checked('consent-cookies'));
}
function acceptConsent(): boolean {
  if (!document.getElementById('consent-agreement')) return false;
  if (!(document.getElementById('consent-agreement') as HTMLInputElement).checked || !(document.getElementById('consent-cookies') as HTMLInputElement).checked) return false;
  writeJSON(StorageKeys.consent, { agreement: true, cookies: true, acceptedAt: new Date().toISOString(), version: 1 });
  return true;
}
registerActions({
  'consent-document': (el) => {
    document.getElementById('consent-sheet')?.remove();
    const sheet = document.createElement('section');
    sheet.id = 'consent-sheet'; sheet.className = 'r-consent-sheet'; sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-modal', 'true'); sheet.setAttribute('aria-labelledby', 'consent-title');
    sheet.innerHTML = html`<h2 id="consent-title">Проект соглашения</h2><p>${el.dataset.document === 'cookies' ? 'Приложение использует cookies и локальное хранилище браузера для настроек, корзины и избранного. Данные сохраняются на этом устройстве. Очистить их можно в настройках браузера.' : 'Приложение показывает каталоги местных магазинов и помогает связаться с менеджерами. Приложение не принимает платежи: цену, наличие, доставку и оплату согласуют напрямую с магазином. Корзина и настройки сохраняются на вашем устройстве.'}</p><p>Это проект текста для демонстрации. Окончательное соглашение предоставляет владелец приложения.</p><button type="button" class="r-btn r-btn--ink" data-action="consent-document-close">Закрыть</button>`.value;
    document.getElementById('screen-onboarding')?.append(sheet); sheet.querySelector('button')?.focus();
  },
  'consent-document-close': () => { document.getElementById('consent-sheet')?.remove(); document.querySelector<HTMLButtonElement>('[data-action="consent-document"]')?.focus(); },
});
exposeToLegacy({ showConsent, acceptConsent });
