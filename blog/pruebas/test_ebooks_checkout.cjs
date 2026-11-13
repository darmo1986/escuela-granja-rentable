const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'ebooks/index.html'), 'utf8');
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
const products = ['pienso-hacer', 'pienso-elegir', 'guia-empezar', 'alimenta-ponedoras'];
function setup() {
  const requests = [];
  const elements = {};
  for (const product of products) {
    elements[product] = {
      box: {checked: false, getAttribute: () => product, addEventListener(event, fn) {this[event] = fn;}},
      button: {disabled: true, getAttribute: () => product, addEventListener(event, fn) {this[event] = fn;}},
      message: {textContent: ''}
    };
  }
  const location = {search: '', href: ''};
  const document = {
    querySelectorAll(selector) {return products.map(product => elements[product][selector === '[data-ebook-check]' ? 'box' : 'button']);},
    querySelector(selector) {
      const product = selector.match(/="(.*?)"/)[1];
      const type = selector.includes('data-ebook-check') ? 'box' : selector.includes('data-stripe-ebook') ? 'button' : 'message';
      return elements[product][type];
    }
  };
  vm.runInNewContext(script, {
    document, window: {location}, URLSearchParams, Date,
    localStorage: {setItem() {}}, sessionStorage: {setItem() {}},
    fetch(url, options) {return new Promise((resolve, reject) => requests.push({data: JSON.parse(options.body), resolve, reject}));}
  });
  return {elements, requests, location};
}
const settle = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const {elements, requests, location} = setup();
  const first = elements[products[0]], second = elements[products[1]];
  assert(products.every(product => elements[product].button.disabled));
  first.button.click();
  assert.equal(requests.length, 0);
  first.box.checked = second.box.checked = true;
  first.box.change();
  first.button.click();
  first.button.click();
  second.button.click();
  assert.equal(requests.length, 1);
  assert(products.every(product => elements[product].button.disabled));
  first.box.checked = false;
  first.box.change();
  assert(first.button.disabled && second.button.disabled);
  requests[0].reject(new Error('offline'));
  await settle();
  assert(first.button.disabled);
  assert.equal(second.button.disabled, false);
  second.button.click();
  assert.equal(requests.length, 2);
  assert.equal(requests[1].data.producto, products[1]);
  requests[1].resolve({json: () => Promise.resolve({error: 'checkout_failed'})});
  await settle();
  assert.equal(second.button.disabled, false);
  second.button.click();
  requests[2].resolve({json: () => Promise.resolve({url: 'https://checkout.stripe.com/test'})});
  await settle();
  assert.equal(location.href, 'https://checkout.stripe.com/test');
  assert(products.every(product => elements[product].button.disabled));
  console.log('Checkout comprobado con solicitudes simuladas, concurrencia, fallos y reintento.');
})().catch(error => {console.error(error);process.exitCode = 1;});
