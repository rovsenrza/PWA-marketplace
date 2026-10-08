import { test, expect } from './fixtures';

/* One product cell everywhere (src/app/ui/product-cell.ts): the store's spine, the title that opens the product,
   the cart key, the heart; real clicks through data-action. */

const firstGoodsCell = '#product-grid .r-cell:has(.r-cell__cart)';

/* the motion layer plays a closing overlay out on a copy with the same id (data-lg-ghost) while the screen
   underneath slides back: wait until the copy is gone before tapping or counting overlays again */
async function closeProduct(app: import('@playwright/test').Page) {
  await app.evaluate(() => (window as any).closeProductModal());
  await expect(app.locator('[data-lg-ghost]')).toHaveCount(0);
}

/** Share of pixels of a colour on each edge of an element's screenshot, one pixel in from the edge. */
async function edgeShare(app: import('@playwright/test').Page, el: import('@playwright/test').Locator, rgb: [number, number, number]) {
  const png = await el.screenshot();
  return app.evaluate(async ({ b64, rgb: [r, g, b] }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const { data, width: w, height: h } = ctx.getImageData(0, 0, img.width, img.height);
    const near = (x: number, y: number) => {
      const i = (y * w + x) * 4;
      return Math.abs(data[i] - r) < 40 && Math.abs(data[i + 1] - g) < 40 && Math.abs(data[i + 2] - b) < 40;
    };
    const share = (pts: number[][]) => pts.filter(([x, y]) => near(x, y)).length / pts.length;
    const xs = Array.from({ length: w - 8 }, (_, i) => i + 4);
    const ys = Array.from({ length: h - 8 }, (_, i) => i + 4);
    return {
      top: share(xs.map((x) => [x, 1])), right: share(ys.map((y) => [w - 2, y])),
      bottom: share(xs.map((x) => [x, h - 2])), left: share(ys.map((y) => [1, y])),
    };
  }, { b64: png.toString('base64'), rgb });
}

test('home: the grid and the rail are product cells, each with its store\'s spine in the store\'s ink', async ({ app }) => {
  const grid = app.locator('#product-grid .r-cell');
  expect(await grid.count()).toBeGreaterThan(4);
  expect(await app.locator('#recommendations-container .r-cell').count()).toBeGreaterThan(2);
  const cell = grid.first();
  await expect(cell.locator('.r-spine')).toBeVisible();
  const r = await cell.evaluate((c: HTMLElement) => {
    const spine = c.querySelector<HTMLElement>('.r-cell__spine')!;
    const hex = /--spine:(#[0-9A-F]{6})/.exec(c.getAttribute('style') ?? '')![1];
    const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ');
    return { store: (eval('productsDb') as Record<string, { store: string }>)[c.dataset.product!].store, named: spine.dataset.store, text: spine.textContent, rgb, bg: getComputedStyle(spine).backgroundColor };
  });
  expect(r.named).toBe(r.store);
  expect(r.text).toBe(r.store);
  expect(r.bg).toBe(`rgb(${r.rgb})`);
});

test('tapping the title or the photo opens the product; the heart and the cart key do not', async ({ app }) => {
  const cell = app.locator(firstGoodsCell).first();
  const id = await cell.getAttribute('data-product');
  await cell.locator('.r-cell__open').click();
  await expect(app.locator('#product-modal')).toBeVisible();
  expect(await app.evaluate(() => (window as any).currentProductId)).toBe(id);
  await closeProduct(app);

  /* the title's layer covers the whole cell: a tap on the photo opens the product too */
  const media = (await cell.locator('.r-cell__media').boundingBox())!;
  await app.mouse.click(media.x + media.width / 3, media.y + media.height * 0.75);
  await expect(app.locator('#product-modal')).toBeVisible();
  expect(await app.evaluate(() => (window as any).currentProductId)).toBe(id);
  await closeProduct(app);

  await cell.locator('.r-cell__fav').click();
  await cell.locator('.r-cell__cart').click();
  await expect(app.locator('#product-modal')).toBeHidden();
});

test('keyboard focus on the title rings the whole cell, over the photo, keys and spine; taps still go through', async ({ app }) => {
  const cell = app.locator(firstGoodsCell).first();
  await cell.scrollIntoViewIfNeeded();
  await cell.locator('.r-cell__fav').focus();
  await app.keyboard.press('Tab');
  expect(await app.evaluate(() => {
    const a = document.activeElement!;
    return `${a.className} ${a.matches(':focus-visible')}`;
  })).toBe('r-cell__open true');
  /* Orange 021 (#FE5000) on every edge of the cell, the corners under the heart, the cart key and the spine included */
  const ring = await edgeShare(app, cell, [254, 80, 0]);
  for (const side of ['top', 'right', 'bottom', 'left'] as const) expect(ring[side], side).toBeGreaterThan(0.95);
  /* the ring's layer lets taps through: the heart is still the top element at its centre… */
  expect(await cell.evaluate((c) => {
    const r = c.querySelector('.r-cell__fav')!.getBoundingClientRect();
    return !!document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.r-cell__fav');
  })).toBe(true);
  /* …and a tap on the photo still opens the product while the title has focus */
  const media = (await cell.locator('.r-cell__media').boundingBox())!;
  await app.mouse.click(media.x + media.width / 3, media.y + media.height * 0.7);
  await expect(app.locator('#product-modal')).toBeVisible();
});

test('pressing a cell tones its body at once, without scaling it; pressing a key does not', async ({ app }) => {
  const cell = app.locator(firstGoodsCell).first();
  await cell.scrollIntoViewIfNeeded();
  const body = cell.locator('.r-cell__body');
  const tone = () => body.evaluate((b) => getComputedStyle(b).backgroundColor);
  /* the sunk token (n2) as the browser resolves it */
  const sunk = await cell.evaluate((c) => {
    const probe = document.createElement('i');
    probe.style.background = 'var(--r-sunk)';
    c.append(probe);
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  });
  const rest = await tone();
  expect(rest).not.toBe(sunk);

  const fav = (await cell.locator('.r-cell__fav').boundingBox())!;
  await app.mouse.move(fav.x + fav.width / 2, fav.y + fav.height / 2);
  await app.mouse.down();
  expect(await tone()).toBe(rest);
  await app.mouse.up();

  const media = (await cell.locator('.r-cell__media').boundingBox())!;
  await app.mouse.move(media.x + media.width / 3, media.y + media.height * 0.7);
  await app.mouse.down();
  expect(await tone()).toBe(sunk);
  expect(await cell.evaluate((c) => getComputedStyle(c).transform)).toBe('none');
  await app.mouse.up();
  await expect(app.locator('#product-modal')).toBeVisible();
});

test('a long single word in a title breaks inside its two lines at 360px instead of being cut', async ({ app }) => {
  await app.setViewportSize({ width: 360, height: 780 });
  const id = await app.evaluate(() => {
    const p = (Object.values(eval('productsDb')) as any[]).find((x) => x.status === 'published' && x.category !== 'недвижимость');
    p.title = 'Гидроизоляционный';
    (window as any).renderProductGrid();
    return p.id as string;
  });
  const title = app.locator(`#product-grid .r-cell[data-product="${id}"] .r-cell__open`);
  await expect(title).toHaveText('Гидроизоляционный');
  const box = await title.evaluate((b) => ({ scroll: b.scrollWidth, client: b.clientWidth, height: b.getBoundingClientRect().height }));
  expect(box.scroll).toBeLessThanOrEqual(box.client);
  expect(box.height).toBeLessThanOrEqual(36);
});

test('Enter on the cart key or the heart keeps focus on that key after the grid redraws', async ({ app }) => {
  const cell = app.locator(firstGoodsCell).first();
  const id = (await cell.getAttribute('data-product'))!;
  const focused = () => app.evaluate(() => {
    const a = document.activeElement as HTMLElement;
    return { key: a.className, product: a.dataset.product, inGrid: !!a.closest('#product-grid'), pressed: a.getAttribute('aria-pressed') };
  });
  await cell.locator('.r-cell__cart').focus();
  await app.keyboard.press('Enter');
  await expect(app.locator('#cart-badge')).toHaveText('1');
  expect(await focused()).toEqual({ key: 'r-cell__cart is-on', product: id, inGrid: true, pressed: null });
  await cell.locator('.r-cell__fav').focus();
  await app.keyboard.press('Enter');
  await expect(app.locator(`#product-grid .r-cell[data-product="${id}"] .r-cell__fav`)).toHaveAttribute('aria-pressed', 'true');
  expect(await focused()).toEqual({ key: 'r-cell__fav', product: id, inGrid: true, pressed: 'true' });
});

test('the cart key: in the cart it turns ink with a check, and the tab badge counts it', async ({ app }) => {
  const cell = app.locator(firstGoodsCell).first();
  const id = (await cell.getAttribute('data-product'))!;
  await expect(cell.locator('.r-cell__cart')).toHaveAttribute('aria-label', 'В корзину');
  await cell.locator('.r-cell__cart').click();
  await expect(app.locator('#cart-badge')).toHaveText('1');
  const key = app.locator(`#product-grid .r-cell[data-product="${id}"] .r-cell__cart`);
  await expect(key).toHaveClass(/\bis-on\b/);
  await expect(key).toHaveAttribute('aria-label', 'В корзине');
  expect(await app.evaluate((pid) => (window as any).cartHasProduct(pid), id)).toBe(true);
  /* in the cart the key is ink (#111110 in the light theme), out of it orange */
  expect(await key.evaluate((b) => getComputedStyle(b).backgroundColor)).toBe('rgb(17, 17, 16)');
});

test('the heart: aria-pressed follows favourites, «очистить» included', async ({ app }) => {
  const cell = app.locator('#recommendations-container .r-cell').first();
  const id = (await cell.getAttribute('data-product'))!;
  await cell.locator('.r-cell__fav').click();
  await expect(app.locator(`#recommendations-container .r-cell[data-product="${id}"] .r-cell__fav`)).toHaveAttribute('aria-pressed', 'true');
  expect(await app.evaluate(() => eval('state').favorites)).toEqual([id]);
  await app.evaluate(() => (window as any).clearAllFavorites());
  await expect(app.locator('.r-cell__fav[aria-pressed="true"]')).toHaveCount(0);
});

test('cells nobody redraws (a lifehack estimate) still follow the cart and favourites', async ({ app }) => {
  await app.evaluate(() => {
    const w = window as any;
    const item = (eval('lifehacksDb') as any[]).find((x) => x.estimate?.lines?.length);
    w.switchTab('directory'); w.switchDirectoryView('lifehacks'); w.openLifehackArticle(item.id);
  });
  const cell = app.locator('#lh-article-estimate .r-cell').first();
  await expect(cell).toBeVisible();
  /* the line's quantity and remark sit under the title, with no stray separator ('· стены' → 'стены') */
  await expect(cell.locator('.r-cell__note')).toBeVisible();
  await expect(cell.locator('.r-cell__note')).not.toHaveText(/^\s*·/);
  const id = (await cell.getAttribute('data-product'))!;
  await app.evaluate((pid) => { (window as any).addToCart(pid); (window as any).toggleFavorite(pid); }, id);
  await expect(cell.locator('.r-cell__cart')).toHaveClass(/\bis-on\b/);
  await expect(cell.locator('.r-cell__fav')).toHaveAttribute('aria-pressed', 'true');
});

test('tapping a spine opens that store: the storefront when the app has one, else the showcase', async ({ app }) => {
  /* the storefront entry point, when it exists, gets the store and the spine it grows from */
  await app.evaluate(() => { const w = window as any; w.__opened = null; w.openStorefront = (name: string, from: Element) => { w.__opened = [name, from.className]; }; });
  const spine = app.locator('#product-grid .r-cell__spine').first();
  const store = (await spine.getAttribute('data-store'))!;
  await spine.click();
  expect(await app.evaluate(() => (window as any).__opened)).toEqual([store, 'r-spine r-cell__spine']);

  /* without it: the old showcase of the same store */
  await app.evaluate(() => { delete (window as any).openStorefront; });
  await spine.click();
  await expect(app.locator('#shop-catalog-modal')).toBeVisible();
  await expect(app.locator('#shop-catalog-title')).toHaveText(store);
});

test('a spine in «Похожие» on the product page opens the store over the product page', async ({ app }) => {
  await app.evaluate(() => { delete (window as any).openStorefront; (window as any).openProductModal('prod-4'); });
  const spine = app.locator('#pm-similar .r-cell__spine').first();
  await expect(spine).toBeVisible();
  const store = (await spine.getAttribute('data-store'))!;
  await spine.click();
  await expect(app.locator('#shop-catalog-title')).toHaveText(store);
  /* the showcase ends on top (it slides in): the point in the middle of the screen belongs to it */
  await expect.poll(() => app.evaluate(() => {
    const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    return !!hit && !!hit.closest('#shop-catalog-modal');
  })).toBe(true);
});

test('the home search still narrows the grid; an odd number of cells left ends on paper, not on a grey hole', async ({ app }) => {
  const shown = app.locator('#product-grid .r-cell:visible');
  const total = await shown.count();
  /* the search matches the cell's text, the store on its spine included; take a query that leaves an odd count */
  let query = '';
  let n = 0;
  for (const q of ['дриада', 'плитка', 'краска', 'кухня', 'кровать', 'стол']) {
    await app.fill('#search-input', q);
    n = await shown.count();
    if (n % 2) { query = q; break; }
  }
  expect(n % 2, 'a query that leaves an odd number of cells').toBe(1);
  expect(n).toBeLessThan(total);
  for (const text of await shown.allInnerTexts()) expect(text.toLowerCase()).toContain(query);
  /* the slot beside the last cell shown is the grid's own ground: paper, like the cells */
  await shown.last().scrollIntoViewIfNeeded();
  const last = (await shown.last().boundingBox())!;
  const slot = await app.evaluate(([x, y]) => {
    const hit = document.elementFromPoint(x, y) as HTMLElement;
    return { id: hit.id, bg: getComputedStyle(hit).backgroundColor, paper: getComputedStyle(document.querySelector('.r-cell')!).backgroundColor };
  }, [last.x + last.width * 1.5, last.y + last.height / 2]);
  expect(slot.id).toBe('product-grid');
  expect(slot.bg).toBe(slot.paper);
  await app.fill('#search-input', '');
  await expect(app.locator('#product-grid .r-cell.hidden')).toHaveCount(0);
});

test('a 360px screen: nothing on home overflows sideways, long store names end in «…» on the spine', async ({ app }) => {
  await app.setViewportSize({ width: 360, height: 780 });
  await app.evaluate(() => (window as any).renderProductGrid());
  const o = await app.evaluate(() => {
    const doc = document.documentElement;
    const main = document.getElementById('main-scroll-container')!;
    return { doc: doc.scrollWidth - doc.clientWidth, main: main.scrollWidth - main.clientWidth };
  });
  expect(o).toEqual({ doc: 0, main: 0 });
  const long = app.locator('#product-grid .r-cell__spine[data-store="Строительные материалы ТЦ ДОМ"]').first();
  await long.scrollIntoViewIfNeeded();
  const fit = await long.evaluate((s) => {
    const span = s.querySelector('span')!;
    const cell = s.closest('.r-cell')!.getBoundingClientRect();
    const box = s.getBoundingClientRect();
    return { inside: box.left >= cell.left - 0.5 && box.right <= cell.right + 0.5, cut: span.scrollWidth > span.clientWidth, ellipsis: getComputedStyle(span).textOverflow };
  });
  expect(fit).toEqual({ inside: true, cut: true, ellipsis: 'ellipsis' });
});
