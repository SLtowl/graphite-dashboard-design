import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// UI verification is optional. Opening the examples or using the CSS needs no Node/npm.
assert.ok(Number(process.versions.node.split('.')[0]) >= 20, 'UI tests require Node.js 20 or newer.');
const browserArgument = process.argv.slice(2).find(value => value.startsWith('--browser='));
assert.ok(process.argv.slice(2).every(value => /^--browser=(chromium|firefox|webkit)$/.test(value)), 'Use --browser=chromium, firefox or webkit.');
const browserName = browserArgument?.split('=')[1] ?? process.env.GD_BROWSER ?? 'chromium';
assert.ok(['chromium', 'firefox', 'webkit'].includes(browserName), 'GD_BROWSER must be chromium, firefox or webkit.');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = resolve(root, 'test-results', browserName);
const widths = [320, 390, 600, 601, 1024, 1440];

async function loadPlaywright() {
  // Explicit local overrides support an already installed runtime; remote modules are never imported.
  const specifier = process.env.GD_PLAYWRIGHT_MODULE ?? 'playwright';
  if (specifier !== 'playwright') assert.equal(new URL(specifier).protocol, 'file:', 'GD_PLAYWRIGHT_MODULE must be a local file URL.');
  try { return await import(specifier); }
  catch (error) { throw new Error('Playwright is unavailable. Run npm ci, then npx playwright install chromium (or the selected engine).', { cause: error }); }
}

async function localServer() {
  const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png' };
  const server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const target = resolve(root, `.${pathname}`);
      const allowedRoot = pathname.startsWith('/examples/') || pathname.startsWith('/assets/');
      if (!allowedRoot || !target.startsWith(`${root}${sep}`) || !['GET', 'HEAD'].includes(request.method) || !mime[extname(target)]) {
        response.writeHead(404).end(); return;
      }
      const bytes = await readFile(target);
      response.writeHead(200, { 'Content-Type': mime[extname(target)], 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolveListen, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListen); });
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

await test(`Graphite UI: ${browserName}`, async t => {
  await mkdir(artifacts, { recursive: true });
  const playwright = await loadPlaywright();
  const { server, origin } = await localServer();
  let browser;
  try {
    browser = await playwright[browserName].launch({
      headless: true,
      timeout: 30000,
      ...(process.env.GD_BROWSER_EXECUTABLE ? { executablePath: process.env.GD_BROWSER_EXECUTABLE } : {}),
    });
    t.diagnostic(`Runtime: ${browserName} ${browser.version()}. Screenshots: test-results/${browserName}/`);

    async function withPage(name, width, callback, options = {}) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce', ...options });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const errors = [], external = [], failed = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('requestfailed', request => failed.push(new URL(request.url()).pathname));
      page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${new URL(response.url()).pathname}`); });
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) { external.push(url.origin); await route.abort(); }
        else await route.continue();
      });
      try {
        await callback(page);
        assert.deepEqual(errors, [], `${name}: browser errors`);
        assert.deepEqual(failed, [], `${name}: failed resources`);
        assert.deepEqual(external, [], `${name}: external requests`);
      } catch (error) {
        await page.screenshot({ path: resolve(artifacts, `${name}-failure.png`), fullPage: true }).catch(() => {});
        throw error;
      } finally { await context.close(); }
    }

    async function open(page, sample = 'states') {
      await page.goto(`${origin}/examples/${sample === 'style' ? 'index' : 'states'}.html`);
      await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 6000, polling: 100 });
      await page.waitForFunction(() => [...document.fonts].some(font => font.family.replaceAll('"', '') === 'Instrument Sans' && font.status === 'loaded'));
    }

    async function screenshot(page, name) {
      await page.screenshot({ path: resolve(artifacts, `${name}.png`), fullPage: true, animations: 'disabled' });
    }

    for (const sample of ['style', 'states']) {
      for (const width of widths) {
        await t.test(`${sample}: fit and font at ${width}px`, () => withPage(`${sample}-${width}`, width, async page => {
          await open(page, sample);
          const measurement = await page.evaluate(() => ({
            language: document.documentElement.lang,
            width: document.documentElement.clientWidth,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            family: getComputedStyle(document.querySelector('.gd-theme')).fontFamily,
            controls: [...document.querySelectorAll('button, a.gd-button, input, select, .gd-metric dd')].filter(element => element.getClientRects().length).map(element => {
              const rect = element.getBoundingClientRect();
              return { id: element.id || element.textContent.trim().slice(0, 30), left: rect.left, right: rect.right };
            }),
            labels: [...document.querySelectorAll('svg text')].map(element => parseFloat(getComputedStyle(element).fontSize) * element.getScreenCTM().a),
          }));
          assert.equal(measurement.language, 'en');
          assert.ok(measurement.family.includes('Instrument Sans'));
          assert.ok(measurement.overflow <= 1, `Page overflow: ${measurement.overflow}px`);
          assert.deepEqual(measurement.controls.filter(item => item.left < -1 || item.right > measurement.width + 1), [], 'Controls and values must fit their viewport');
          assert.ok(measurement.labels.every(size => size >= 11.9), 'Chart labels must not shrink below 12 screen pixels');
          if (sample === 'style') {
            const footerGap = await page.locator('.demo-footer').evaluate(footer => {
              const text = footer.querySelector('p').getBoundingClientRect();
              const link = footer.querySelector('a').getBoundingClientRect();
              return Math.max(link.left - text.right, link.top - text.bottom);
            });
            assert.ok(footerGap >= 19, `Footer text and action need at least 20px separation, received ${footerGap}px`);
            const tableScroll = await page.locator('.demo-table .gd-table-wrap').evaluate(region => ({
              overflowing: region.scrollWidth > region.clientWidth + 1,
              hintVisible: !document.getElementById('table-scroll-hint').hidden,
              description: region.getAttribute('aria-describedby'),
            }));
            assert.equal(tableScroll.hintVisible, tableScroll.overflowing, 'Only an overflowing table needs a visible scroll hint');
            assert.equal(tableScroll.description, tableScroll.overflowing ? 'table-scroll-hint' : null);
          }
          await screenshot(page, `${sample}-${width}`);
        }));
      }
    }

    await t.test('style sample: keyboard selection and selected appearance', () => withPage('selection', 1440, async page => {
      await open(page, 'style');
      const choices = page.locator('.demo-options button');
      const firstStyle = await choices.nth(0).evaluate(element => getComputedStyle(element).boxShadow);
      await choices.nth(1).focus();
      await page.keyboard.press('Space');
      assert.equal(await choices.nth(1).getAttribute('aria-pressed'), 'true');
      assert.equal(await choices.nth(0).getAttribute('aria-pressed'), 'false');
      assert.equal(await choices.nth(1).evaluate(element => getComputedStyle(element).boxShadow), firstStyle);
      const focus = await choices.nth(1).evaluate(element => ({ visible: element.matches(':focus-visible'), width: getComputedStyle(element).outlineWidth }));
      assert.ok(focus.visible && parseFloat(focus.width) >= 2, 'Keyboard focus must have a visible outline');
      await choices.nth(0).click();
      assert.equal(await choices.nth(0).getAttribute('aria-pressed'), 'true');
      await screenshot(page, 'selection-keyboard');
    }));

    await t.test('gallery: materials, density and long exact numbers', () => withPage('materials-density', 1440, async page => {
      await open(page);
      const surfaces = await page.locator('#workbench-shell, #controls-panel, #details-panel').evaluateAll(elements => elements.map(element => {
        const style = getComputedStyle(element);
        return { fill: style.backgroundColor, image: style.backgroundImage, shadow: style.boxShadow };
      }));
      assert.equal(surfaces.length, 3);
      assert.ok(new Set(surfaces.map(surface => `${surface.fill} ${surface.image}`)).size >= 3, 'Shell, working area and inspector need distinct materials');
      assert.ok(surfaces.every(surface => surface.shadow !== 'none'), 'Materials retain depth without backdrop blur');
      async function dimensions() {
        return page.evaluate(() => {
          const row = document.querySelector('#service-rows tr');
          const field = document.querySelector('#report-name');
          return { row: row.getBoundingClientRect().height, field: field.getBoundingClientRect().height, font: getComputedStyle(field).fontSize, number: getComputedStyle(document.querySelector('#long-value')).fontSize };
        });
      }
      const comfortable = await dimensions();
      await page.locator('#density-toggle').click();
      assert.equal(await page.locator('#density-toggle').getAttribute('aria-pressed'), 'true');
      const compact = await dimensions();
      assert.ok(compact.row < comfortable.row, 'Compact mode reduces table row spacing');
      assert.ok(compact.field <= comfortable.field);
      assert.equal(compact.font, comfortable.font, 'Compact mode must not shrink body text');
      assert.equal(compact.number, comfortable.number, 'Compact mode must not shrink metrics');
      await screenshot(page, 'density-compact');
      await page.locator('#density-toggle').click();
      assert.deepEqual(await dimensions(), comfortable, 'Density switch is reversible');
      await page.setViewportSize({ width: 320, height: 900 });
      const number = await page.locator('#long-value').evaluate(element => ({
        width: element.clientWidth, scroll: element.scrollWidth, tab: element.tabIndex,
        overflow: getComputedStyle(element).overflowX, font: getComputedStyle(element).fontSize,
      }));
      assert.ok(number.scroll > number.width, 'Long number fixture must exercise overflow');
      assert.ok(number.tab >= 0 && ['auto', 'scroll'].includes(number.overflow), 'Full value stays keyboard-scrollable');
      assert.ok(parseFloat(number.font) >= 22, 'Long values must not be made tiny');
      await page.locator('#long-value').focus();
      await page.keyboard.press('ArrowRight');
      await page.waitForFunction(() => document.querySelector('#long-value').scrollLeft > 0);
      await screenshot(page, 'long-number-mobile');
    }));

    for (const width of [320, 390, 1440]) {
      await t.test(`gallery: opened select and keyboard at ${width}px`, () => withPage(`menu-${width}`, width, async page => {
        await open(page);
        const select = page.locator('#workspace-select');
        const customized = await page.evaluate(() => CSS.supports('appearance', 'base-select'));
        await select.click();
        if (customized) {
          await page.waitForFunction(() => document.querySelector('#workspace-select').matches(':open'));
          const popup = await select.evaluate(element => {
            const style = getComputedStyle(element, '::picker(select)');
            return { radius: style.borderRadius, image: style.backgroundImage, overflow: style.overflowY, width: parseFloat(style.width), viewport: innerWidth,
              options: [...element.options].filter(option => option.getClientRects().length).map(option => ({ left: option.getBoundingClientRect().left, right: option.getBoundingClientRect().right })) };
          });
          assert.ok(parseFloat(popup.radius) >= 10 && popup.image !== 'none', 'Opened picker must be styled');
          assert.ok(['auto', 'scroll'].includes(popup.overflow), 'Long option list must scroll');
          assert.ok(popup.width <= popup.viewport, 'Open picker width must fit the viewport');
          assert.ok(popup.options.every(option => option.left >= 0 && option.right <= popup.viewport), 'Open options must not extend outside the viewport');
          await screenshot(page, `menu-open-${width}`);
        } else t.diagnostic(`${browserName}: base-select unavailable; native semantics tested, native popup is not visual parity.`);
        await page.keyboard.press('Escape');
        assert.equal(await select.inputValue(), 'all');
        await select.focus();
        if (customized) await page.keyboard.press('Space');
        await page.keyboard.press('Home');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press(customized ? 'Enter' : 'Tab');
        assert.equal(await select.inputValue(), 'design');
        assert.match(await page.locator('#workspace-summary').innerText(), /design/i);
        assert.ok(await select.locator('option[value="archived"]').evaluate(element => element.disabled));
        await select.focus();
        if (customized) await page.keyboard.press('Space');
        await page.keyboard.press('End');
        await page.keyboard.press(customized ? 'Enter' : 'Tab');
        assert.equal(await select.inputValue(), 'enablement', 'Keyboard navigation skips the final disabled option');
        await select.selectOption('design');
        await select.click();
        await page.locator('h1').click();
        assert.equal(await select.inputValue(), 'design', 'Outside dismissal preserves selection');
      }));
    }

    await t.test('gallery: validation, editing invalidates saved state, modal focus', () => withPage('form-dialog', 390, async page => {
      await open(page);
      async function closeDialog(action) {
        // Native close dispatch can follow open=false. Observe completion before
        // checking the app's focus restoration; never force focus in the test.
        await page.locator('#review-dialog').evaluate(dialog => {
          dialog.dataset.testCloseObserved = 'false';
          dialog.addEventListener('close', () => { dialog.dataset.testCloseObserved = 'true'; }, { once: true });
        });
        await action();
        await page.waitForFunction(() => document.querySelector('#review-dialog').dataset.testCloseObserved === 'true', null, { timeout: 2000 });
      }
      const field = page.locator('#report-name');
      assert.ok(await page.locator('#publish-report').isDisabled());
      await field.fill('x');
      await page.locator('#save-report').click();
      assert.equal(await field.getAttribute('aria-invalid'), 'true');
      assert.ok(await page.locator('#report-error').isVisible());
      assert.ok((await field.getAttribute('aria-describedby')).split(/\s+/).includes('report-error'));
      await screenshot(page, 'field-error');
      for (const invalid of ['   ', 'x'.repeat(81)]) {
        await field.fill(invalid);
        await page.locator('#save-report').click();
        assert.equal(await field.getAttribute('aria-invalid'), 'true');
        assert.ok(await page.locator('#publish-report').isDisabled());
      }
      await field.fill('Weekly reliability');
      await page.locator('#save-report').click();
      assert.notEqual(await field.getAttribute('aria-invalid'), 'true');
      assert.ok(await page.locator('#publish-report').isEnabled());
      await page.locator('#density-toggle').click();
      assert.ok(await page.locator('#publish-report').isEnabled(), 'Density preserves the saved view');
      await page.locator('#publish-report').click();
      assert.equal(await page.locator('#dialog-name').innerText(), 'Weekly reliability');
      await closeDialog(() => page.keyboard.press('Escape'));
      assert.equal(await page.evaluate(() => document.activeElement.id), 'publish-report');
      await field.fill('');
      assert.ok(await page.locator('#publish-report').isDisabled(), 'Changing saved input invalidates publish action');
      await page.locator('#open-dialog').click();
      assert.ok(await page.locator('#review-dialog').isVisible());
      assert.ok(await page.evaluate(() => document.querySelector('#review-dialog').contains(document.activeElement)), 'Opening moves focus into the dialog');
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        assert.ok(await page.evaluate(() => document.querySelector('#review-dialog').contains(document.activeElement)), 'Modal traps Tab focus');
      }
      await page.keyboard.press('Shift+Tab');
      assert.ok(await page.evaluate(() => document.querySelector('#review-dialog').contains(document.activeElement)), 'Modal traps reverse Tab focus');
      const bounds = await page.locator('#review-dialog').boundingBox();
      assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391, 'Dialog fits mobile viewport');
      await screenshot(page, 'dialog-mobile');
      await closeDialog(() => page.keyboard.press('Escape'));
      assert.ok(await page.locator('#review-dialog').isHidden());
      assert.equal(await page.evaluate(() => document.activeElement.id), 'open-dialog');
      await page.locator('#open-dialog').click();
      await closeDialog(() => page.locator('#close-dialog').click());
      assert.equal(await page.evaluate(() => document.activeElement.id), 'open-dialog');
    }));

    await t.test('gallery: empty results, reset, loading and data states', () => withPage('data-states', 1024, async page => {
      await open(page);
      const count = await page.locator('#service-rows tr:visible').count();
      assert.ok(count > 0);
      await page.locator('#service-search').fill('nonexistent-service-9381');
      assert.ok(await page.locator('#empty-results').isVisible());
      assert.equal(await page.locator('#service-rows tr:visible').count(), 0);
      await screenshot(page, 'empty-results');
      await page.locator('#reset-search').click();
      assert.equal(await page.locator('#service-search').inputValue(), '');
      assert.equal(await page.locator('#service-rows tr:visible').count(), count);
      await page.locator('#service-search').fill('Core');
      const filteredCount = await page.locator('#service-rows tr:visible').count();
      assert.ok(filteredCount > 0 && filteredCount < count);
      await page.locator('#density-toggle').click();
      assert.equal(await page.locator('#service-search').inputValue(), 'Core', 'Density preserves the filter');
      assert.equal(await page.locator('#service-rows tr:visible').count(), filteredCount);
      await page.locator('#service-search').fill('');
      await page.locator('#reload-data').click();
      assert.equal(await page.locator('#loading-region').getAttribute('aria-busy'), 'true');
      assert.ok(await page.locator('#reload-data').isDisabled());
      await screenshot(page, 'loading');
      await page.waitForFunction(() => document.querySelector('#loading-region').getAttribute('aria-busy') === 'false');
      assert.ok(await page.locator('#reload-data').isEnabled());
      assert.ok((await page.locator('#load-status').innerText()).trim().length > 0);
      const titles = new Set();
      for (const state of ['current', 'stale', 'partial', 'denied', 'error']) {
        await page.locator('#data-state').selectOption(state);
        titles.add(await page.locator('#state-title').innerText());
        assert.ok((await page.locator('#state-detail').innerText()).trim().length > 12);
        if (state === 'partial') {
          assert.match(await page.locator('#state-detail').innerText(), /\b\d{2}:\d{2} UTC\b/, 'Partial data retains a sample timestamp');
          assert.match(await page.locator('#state-coverage').innerText(), /2 of 3/, 'Partial data identifies its coverage');
        }
        if (state === 'denied') assert.ok(await page.locator('#reload-data').isDisabled(), 'Refresh cannot grant missing permissions');
        if (['denied', 'error'].includes(state)) assert.ok(!/^\s*0(?:[.,]0+)?\s*$/.test(await page.locator('#state-value').innerText()), 'Unknown data must not appear as zero');
        await screenshot(page, `data-${state}`);
      }
      assert.equal(titles.size, 5, 'Data states need distinct explanations');
      await page.locator('#retry-data').click();
      await page.waitForFunction(() => document.querySelector('#data-state').value === 'current');
    }));

    await t.test('CSS: isolation, inherited tokens and reduced motion', () => withPage('css-contract', 1024, async page => {
      await page.goto(`${origin}/examples/index.html`);
      // A controlled fixture tests the CSS contract without relying on demo-specific styles.
      await page.setContent(`<link rel="stylesheet" href="${origin}/assets/graphite.css"><button id="outside" class="gd-button">Outside</button><section class="gd-theme"><button id="inside" class="gd-button">Inside</button><section class="gd-panel" id="token-panel">Panel</section><select id="token-select" class="gd-input"><option>One</option></select></section>`);
      await page.waitForFunction(() => document.fonts.status === 'loaded', null, { timeout: 6000, polling: 100 });
      const contract = await page.evaluate(() => {
        const outside = getComputedStyle(document.querySelector('#outside'));
        const inside = getComputedStyle(document.querySelector('#inside'));
        return { outsideRadius: outside.borderRadius, insideRadius: inside.borderRadius, outsideFont: outside.fontFamily, insideFont: inside.fontFamily, transition: inside.transitionDuration };
      });
      assert.notEqual(contract.outsideRadius, contract.insideRadius, 'Class styles must not escape .gd-theme');
      assert.ok(!contract.outsideFont.includes('Instrument Sans') && contract.insideFont.includes('Instrument Sans'));
      assert.equal(contract.transition, '0s', 'Reduced motion removes optional control transitions');
      await page.locator('.gd-theme').evaluate(element => {
        element.style.setProperty('--gd-text', 'rgb(220, 220, 220)');
        element.style.setProperty('--gd-surface', 'rgb(19, 19, 19)');
        element.style.setProperty('--gd-radius-control', '14px');
        element.style.setProperty('--gd-material-overlay', 'linear-gradient(rgb(26, 26, 26), rgb(18, 18, 18))');
      });
      const overridden = await page.evaluate(() => ({
        color: getComputedStyle(document.querySelector('#inside')).color,
        radius: getComputedStyle(document.querySelector('#inside')).borderRadius,
        surface: getComputedStyle(document.querySelector('#token-panel')).backgroundColor,
        menuColor: CSS.supports('appearance', 'base-select') ? getComputedStyle(document.querySelector('#token-select'), '::picker(select)').color : null,
        menuMaterial: CSS.supports('appearance', 'base-select') ? getComputedStyle(document.querySelector('#token-select'), '::picker(select)').backgroundImage : null,
      }));
      assert.equal(overridden.color, 'rgb(220, 220, 220)');
      assert.equal(overridden.radius, '14px');
      assert.equal(overridden.surface, 'rgb(19, 19, 19)');
      if (overridden.menuColor) assert.equal(overridden.menuColor, 'rgb(220, 220, 220)');
      if (overridden.menuMaterial) assert.equal(overridden.menuMaterial, 'linear-gradient(rgb(26, 26, 26), rgb(18, 18, 18))');
    }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolveClose => server.close(resolveClose));
  }
});
