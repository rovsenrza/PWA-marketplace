import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { test, expect } from './fixtures';
import { demoUrl, qrSvg } from '../../src/app/vendor/demo-qr';

/* The page around the app: the desktop stage (a column with the QR code of the demo link beside the phone frame),
   the frame that fits the window, the browser bar colour on a dark launch, the fonts in the service worker's cache. */

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../../dist');
const qrChunk = /\/assets\/demo-qr-[^/]+\.js$/;

/** Collects the requests for the QR library chunk and the page errors of a page. */
function watch(page: Page) {
  const chunks: string[] = [];
  const errors: string[] = [];
  page.on('request', (r) => { if (qrChunk.test(new URL(r.url()).pathname)) chunks.push(r.url()); });
  page.on('pageerror', (e) => errors.push(e.message));
  return { chunks, errors };
}

async function open(page: Page, path = '/index.html') {
  await page.addInitScript(() => localStorage.setItem('pwa_install_dismissed', String(Date.now())));
  await page.goto(path); // resolves on `load`, after the module scripts have run
}

const box = async (page: Page, selector: string) => (await page.locator(selector).boundingBox())!;

test.describe('wide window, 1280 x 800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the column beside a frame that fits the window, and a code of the page address without the hash', async ({ page, baseURL }) => {
    const { chunks, errors } = watch(page);
    await open(page, '/index.html#cart');
    await expect(page.locator('.stage-copy')).toBeVisible();
    await expect(page.locator('.stage-mark')).toHaveText('СуперАпп');
    await expect(page.locator('.stage-tag')).toHaveText('Больше, чем покупки');
    await expect(page.locator('.stage-qr__cap')).toHaveText('Откройте на телефоне');

    /* the code: drawn from the address with the hash cut off, by the same generator as the unit tests cover */
    await expect(page.locator('#stage-qr svg')).toBeVisible();
    const expected = new URL('/index.html', baseURL).href;
    expect(demoUrl(page.url())).toBe(expected);
    const drawn = await page.locator('#stage-qr path').getAttribute('d');
    expect(drawn).toBe(/ d="([^"]+)"/.exec(qrSvg(expected, ''))![1]);
    expect(chunks).toHaveLength(1);

    /* the frame is whole inside the window (a laptop is shorter than the 844px phone) and keeps its proportions */
    const frame = await box(page, '#phone-container');
    expect(frame.y).toBeGreaterThanOrEqual(0);
    expect(frame.y + frame.height).toBeLessThanOrEqual(800);
    expect(frame.width / frame.height).toBeCloseTo(400 / 844, 2);

    /* and the column stands on the same top and bottom edges as the frame */
    const copy = await box(page, '.stage-copy');
    expect(copy.y).toBeCloseTo(frame.y, 0);
    expect(copy.height).toBeCloseTo(frame.height, 0);
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('phone-container')!).borderRadius)).toBe('0px');
    expect(errors).toEqual([]);
  });
});

test.describe('window below 1024px', () => {
  for (const [width, height] of [[402, 874], [900, 700], [1023, 800]]) {
    test(`${width} x ${height}: no column and no QR library, the frame fits`, async ({ page }) => {
      const { chunks, errors } = watch(page);
      await page.setViewportSize({ width, height });
      await open(page);
      await expect(page.locator('.stage-copy')).toBeHidden();
      await expect(page.locator('.stage-qr')).toBeHidden();
      expect(chunks).toEqual([]);
      const frame = await box(page, '#phone-container');
      if (width <= 720) {
        expect([frame.x, frame.y, frame.width, frame.height]).toEqual([0, 0, width, height]); // full-bleed on a phone
      } else {
        expect(frame.y).toBeGreaterThanOrEqual(0);
        expect(frame.y + frame.height).toBeLessThanOrEqual(height);
        expect(frame.width / frame.height).toBeCloseTo(400 / 844, 2);
      }
      expect(errors).toEqual([]);
    });
  }

  test('widening the window brings the column and the code, once', async ({ page }) => {
    const { chunks, errors } = watch(page);
    await page.setViewportSize({ width: 900, height: 700 });
    await open(page);
    expect(chunks).toEqual([]);
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.locator('#stage-qr svg')).toBeVisible();
    await expect(page.locator('.stage-copy')).toBeVisible();
    await page.setViewportSize({ width: 900, height: 700 });
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('.stage-copy')).toBeVisible();
    expect(chunks).toHaveLength(1);
    expect(errors).toEqual([]);
  });
});

test('a dark launch: the browser bar and the page behind the app take the dark paper', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ui-theme', 'dark'));
  await open(page);
  /* the app used to write the white colour over it at startup (setAppUi) */
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#121211');
  expect(await page.evaluate(() => [document.documentElement, document.body].map((el) => getComputedStyle(el).backgroundColor)))
    .toEqual(['rgb(18, 18, 17)', 'rgb(18, 18, 17)']);
});

test('service worker: the self-hosted shell fonts are precached, and the files exist', () => {
  const sw = readFileSync(resolve(dist, 'sw.js'), 'utf8');
  const precache: string[] = JSON.parse(sw.match(/const PRECACHE = (\[[\s\S]*?\]);/)![1]);
  for (const face of ['google-sans-cyrillic', 'google-sans-latin', 'google-sans-latin-ext']) {
    expect(precache, face).toContain(`./fonts/${face}.woff2`);
    expect(existsSync(resolve(dist, 'fonts', `${face}.woff2`)), face).toBe(true);
  }
});
