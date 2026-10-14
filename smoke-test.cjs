// Local smoke checks for the empty-catalog storefront and theme preference.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

function makeRuntime(storage = new Map()) {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, {
      id, innerHTML: '', textContent: '', hidden: false, value: '', attributes: {}, dataset: {},
      classList: { values: new Set(), add(v) { this.values.add(v); }, remove(v) { this.values.delete(v); }, toggle(v) { this.values.has(v) ? this.values.delete(v) : this.values.add(v); }, contains(v) { return this.values.has(v); } },
      setAttribute(k, v) { this.attributes[k] = v; }, removeAttribute(k) { delete this.attributes[k]; },
      addEventListener() {}, focus() {},
    });
    return elements.get(id);
  };
  const location = { hash: '' };
  const document = {
    title: '', documentElement: { dataset: {} },
    getElementById: get,
    addEventListener() {},
    querySelectorAll() { return []; },
  };
  const window = { shopShowCount: 12, addEventListener() {}, scrollTo() {} };
  const context = {
    console, document, window, location, URLSearchParams, Intl, Date, Math,
    confirm: () => true,
    setTimeout: () => 0,
    clearTimeout() {},
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); },
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'app.js' });
  return { context, elements, storage };
}

const oldProducts = [{ id: 'old-demo-item', name: 'Old sample item' }];
const storage = new Map([
  ['ym_demo_products', JSON.stringify(oldProducts)],
  ['ym_demo_cart', JSON.stringify([{ id: 'old-demo-item', qty: 2 }])],
  ['ym_demo_wishlist', JSON.stringify(['old-demo-item'])],
  ['ym_demo_coupon', JSON.stringify('HELLO10')],
]);
const { context: c, elements } = makeRuntime(storage);

assert.equal(vm.runInContext('products.length', c), 0);
assert.equal(c.inventory(), 0);
assert.deepEqual(Array.from(vm.runInContext('wishlist', c)), []);
assert.equal(storage.has('ym_demo_products'), false);
assert.equal(storage.has('ym_demo_cart'), false);
assert.equal(storage.get('yviora_empty_catalog_v1'), 'done');
assert.equal(c.document.title, 'Yviora — Little Finds, Lovely Prices');
assert.match(elements.get('app').innerHTML, /We are refreshing our collection/);
assert.doesNotMatch(elements.get('app').innerHTML, /product-card|sample product/i);
assert.doesNotMatch(elements.get('site-footer').innerHTML, /mahika/i);

c.location.hash = '#/shop?category=jewelry&q=pearl&sort=low';
c.render();
assert.match(elements.get('app').innerHTML, /0 finds/);
assert.match(elements.get('app').innerHTML, /No products are listed right now/);
assert.doesNotMatch(elements.get('app').innerHTML, /product-card/);

for (const [route, text] of [
  ['/cart', 'Your bag is taking a little break'],
  ['/checkout', 'Your sample bag is empty'],
  ['/wishlist', 'A little wish list'],
  ['/about', 'Our mission'],
  ['/contact', 'Contact form demo'],
  ['/faq', 'Frequently asked questions'],
  ['/policy/returns', 'Template — confirm before publishing'],
  ['/account', 'Account access is not connected'],
  ['/admin', 'Demo admin only'],
]) {
  c.location.hash = `#${route}`;
  c.render();
  assert.ok(elements.get('app').innerHTML.includes(text), `expected ${route} to render ${text}`);
}

c.toggleTheme();
assert.equal(c.document.documentElement.dataset.theme, 'dark');
assert.equal(elements.get('theme-toggle').attributes['aria-pressed'], 'true');
assert.equal(elements.get('theme-toggle').attributes['aria-label'], 'Switch to light mode');
assert.equal(JSON.parse(storage.get('yviora_theme')), 'dark');

const fresh = makeRuntime(storage);
assert.equal(fresh.context.document.documentElement.dataset.theme, 'dark');
assert.equal(vm.runInContext('products.length', fresh.context), 0);

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
const readme = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
assert.match(html, /id="theme-toggle"/);
assert.match(html, /href="#\/contact">Contact/);
assert.doesNotMatch(html + readme, /Mahika/i);
assert.match(css, /:root\[data-theme="dark"\]/);
assert.match(css, /@media\(max-width:760px\)/);
assert.match(css, /\.hero-visual/);
assert.match(css, /prefers-reduced-motion/);

console.log('Storefront smoke checks passed: empty catalog and stale-data cleanup, shop/cart/checkout/wishlist empty states, informational routes, persistent dark mode, and responsive theme styles.');
