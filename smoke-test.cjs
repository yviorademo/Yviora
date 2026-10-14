// Local smoke checks for the keychain catalog and theme preference.
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
const catalog = vm.runInContext('products', c);

assert.equal(catalog.length, 12);
assert.equal(c.inventory(), 0);
assert.deepEqual(Array.from(vm.runInContext('wishlist', c)), []);
assert.equal(storage.has('ym_demo_products'), false);
assert.equal(storage.has('ym_demo_cart'), false);
assert.equal(storage.get('yviora_catalog_v3'), 'done');
assert.deepEqual(Array.from(catalog, product => product.image), ['keychain_1.jpg','keychain_2.jpg','keychain_3.jpg','keychain_4.jpg','keychain_5.jpg','keychain_6.jpg','keychain_7.jpg','keychain_8.jpg','keychain_9.jpg','cap_1.jpg','cap_2.jpg','cap_3.jpg']);
assert.ok(Array.from(catalog).every(product => product.price === null && product.stock === null));
assert.equal(c.document.title, 'Yviora — Little Finds, Lovely Prices');
assert.match(elements.get('app').innerHTML, /Little finds to love/);
assert.match(elements.get('app').innerHTML, /keychain_1\.jpg/);
assert.doesNotMatch(elements.get('site-footer').innerHTML, /mahika/i);

c.location.hash = '#/shop';
c.render();
assert.match(elements.get('app').innerHTML, /12 finds/);
for (let i = 1; i <= 9; i++) assert.match(elements.get('app').innerHTML, new RegExp('keychain_' + i + '\\.jpg'));
assert.equal((elements.get('app').innerHTML.match(/class="product-card"/g) || []).length, 12);
assert.equal((elements.get('app').innerHTML.match(/Coming soon/g) || []).length, 24);
assert.doesNotMatch(elements.get('app').innerHTML, /₱0/);

c.location.hash = '#/shop?category=caps';
c.render();
assert.match(elements.get('app').innerHTML, /3 finds/);
for (let i = 1; i <= 3; i++) assert.match(elements.get('app').innerHTML, new RegExp('cap_' + i + '\\.jpg'));
c.location.hash = '#/product/strawberry-shortcake-keychain';
c.render();
assert.match(elements.get('app').innerHTML, /Strawberry Shortcake Keychain/);
assert.match(elements.get('app').innerHTML, /Price coming soon/);
assert.match(elements.get('app').innerHTML, /data-action="detail-add"[^>]*disabled/);
assert.equal(c.addToCart('strawberry-shortcake-keychain'), false);
assert.equal(c.inventory(), 0);

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
  c.location.hash = '#' + route;
  c.render();
  assert.ok(elements.get('app').innerHTML.includes(text), 'expected ' + route + ' to render ' + text);
}

c.toggleTheme();
assert.equal(c.document.documentElement.dataset.theme, 'dark');
assert.equal(elements.get('theme-toggle').attributes['aria-pressed'], 'true');
assert.equal(elements.get('theme-toggle').attributes['aria-label'], 'Switch to light mode');
assert.equal(JSON.parse(storage.get('yviora_theme')), 'dark');

const fresh = makeRuntime(storage);
assert.equal(fresh.context.document.documentElement.dataset.theme, 'dark');
assert.equal(vm.runInContext('products.length', fresh.context), 12);

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
for (let i = 1; i <= 9; i++) assert.ok(fs.existsSync(path.join(__dirname, 'keychain_' + i + '.jpg')), 'keychain_' + i + '.jpg should exist');

for (const file of ['cap_1.jpg','cap_2.jpg','cap_3.jpg']) assert.ok(fs.existsSync(path.join(__dirname,file)));
console.log('Storefront smoke checks passed: twelve products including nine keychains and three caps, pending price/stock handling, migration, product detail/cart availability, persistent dark mode, and responsive theme styles.');