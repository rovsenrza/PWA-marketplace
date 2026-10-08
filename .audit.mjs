import { chromium } from 'playwright';
const [out, port, schemes='light,dark'] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'chrome' });
const AUDIT = () => {
  const bad = { size: {}, weight: {}, shadow: {}, border: {} };
  const key = (el) => { let k = el.tagName.toLowerCase(); if (el.id) k += '#' + el.id; else if (el.classList.length) k += '.' + [...el.classList].slice(0, 3).join('.'); const p = el.parentElement; return (p && p.id ? '#' + p.id + ' > ' : '') + k; };
  const root = document.getElementById('phone-container');
  for (const el of root.querySelectorAll('*')) {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || ['::after'].some(() => false);
    if (hasText && parseFloat(cs.fontSize) > 18.01) bad.size[key(el) + ' ' + cs.fontSize] = 1;
    if (hasText && parseInt(cs.fontWeight) > 600) bad.weight[key(el) + ' ' + cs.fontWeight] = 1;
    if (cs.boxShadow !== 'none') bad.shadow[key(el)] = 1;
    const bw = ['Top','Right','Bottom','Left'].some(s => parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none');
    if (bw && !(el.matches('input[type=checkbox],input[type=radio],.animate-spin'))) bad.border[key(el)] = 1;
  }
  const grids = [...root.querySelectorAll('.r-grid')].filter(g => g.offsetParent).map(g => { const c = getComputedStyle(g); return c.columnGap + '/' + c.rowGap; });
  return { size: Object.keys(bad.size), weight: Object.keys(bad.weight), shadow: Object.keys(bad.shadow), border: Object.keys(bad.border), grids: [...new Set(grids)] };
};
const report = {};
for (const scheme of schemes.split(',')) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, colorScheme: scheme });
  await p.addInitScript(() => { localStorage.setItem('pwa_install_dismissed', String(Date.now())); });
  await p.goto(`http://localhost:${port}/index.html`); await p.waitForFunction(() => typeof window.switchTab === 'function');
  await p.evaluate(() => { document.getElementById('screen-onboarding').style.display = 'none'; });
  await p.waitForTimeout(600);
  const shot = async (name, full = false) => { await p.waitForTimeout(350); await p.screenshot({ path: `${out}/${scheme}-${name}.png`, fullPage: full }); report[`${scheme}-${name}`] = await p.evaluate(AUDIT); };
  const steps = [
    ['home', async () => { await p.evaluate(() => switchTab('catalog')); }],
    ['home2', async () => { await p.evaluate(() => document.getElementById('main-scroll-container').scrollTo(0, 700)); }],
    ['catalog', async () => { await p.evaluate(() => { document.getElementById('main-scroll-container').scrollTo(0, 0); switchTab('directory'); }); }],
    ['shops', async () => { await p.evaluate(() => switchDirectoryView('shops')); }],
    ['lifehacks', async () => { await p.evaluate(() => { backToDirectory(); switchDirectoryView('lifehacks'); }); }],
    ['spectech', async () => { await p.evaluate(() => { backToDirectory(); switchDirectoryView('spectech'); }); }],
    ['catgoods', async () => { await p.evaluate(() => { backToDirectory(); switchTab('catalog'); openCategoryProducts('стройматериалы', 'Стройматериалы'); }); }],
    ['product', async () => { await p.evaluate(() => { const id = Object.keys(productsDb).find(k => productsDb[k].status === 'published' && productsDb[k].oldPrice) || Object.keys(productsDb)[0]; openProductModal(id); }); }],
    ['cart', async () => { await p.evaluate(() => { closeProductModal && closeProductModal(); const ids = Object.keys(productsDb).filter(k => productsDb[k].status === 'published').slice(0, 4); ids.forEach(i => window.addToCart ? addToCart(i) : 0); switchTab('cart'); }); }],
    ['fav', async () => { await p.evaluate(() => switchTab('favorites')); }],
    ['profile', async () => { await p.evaluate(() => switchTab('profile')); }],
    ['sf-postroyka', async () => { await p.evaluate(() => { switchTab('catalog'); openStorefront('Постройка'); }); }],
    ['sf-driada', async () => { await p.evaluate(() => { history.back(); }); await p.waitForTimeout(300); await p.evaluate(() => openStorefront('Кухни Дриада')); }],
    ['sf-dom', async () => { await p.evaluate(() => { history.back(); }); await p.waitForTimeout(300); await p.evaluate(() => openStorefront('Любимый Дом')); }],
  ];
  for (const [n, f] of steps) { try { await f(); await shot(n); } catch (e) { report[`${scheme}-${n}`] = { error: String(e).slice(0, 200) }; } }
  await p.close();
}
console.log(JSON.stringify(report, null, 1));
await b.close();
