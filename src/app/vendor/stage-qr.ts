/**
 * The QR code on the desktop stage: a module script next to the stage markup in index.html. It fills #stage-qr with
 * the demo link, so someone who opened the prototype on a laptop can carry it to a phone.
 *
 * On a phone, in an installed app and in a narrow window it does nothing and downloads nothing: the code is built by
 * demo-qr.ts together with the QR library, a chunk that is imported only once the stage is on screen (and, if the
 * window is widened later, at that moment). STAGE is the query that range/stage.css uses to show the left column.
 */
const STAGE = '(min-width: 1024px) and (not (display-mode: standalone))';

export function mountStageQr(): void {
  const slot = document.getElementById('stage-qr');
  const figure = slot?.closest<HTMLElement>('.stage-qr');
  /* a code for file:// or about: opens nothing on a phone */
  if (!slot || !figure || !/^https?:$/.test(location.protocol)) return;
  const wide = matchMedia(STAGE);
  const mount = (): void => {
    if (!wide.matches) return;
    wide.removeEventListener('change', mount);
    import('./demo-qr').then(({ demoUrl, qrSvg }) => {
      slot.innerHTML = qrSvg(demoUrl(location.href), 'QR-код со ссылкой на это демо');
      figure.hidden = false;
    }).catch(() => { /* offline and the chunk was never cached: the stage simply has no code */ });
  };
  wide.addEventListener('change', mount);
  mount();
}

mountStageQr();
