const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'js/site.js'), 'utf8');
const analytics = source.slice(source.indexOf('/* === Panel: registro de visitas'));
const sql = fs.readFileSync(path.join(root, 'supabase/migrations/20261020193000_panel.sql'), 'utf8');
const allowedChannels = sql.match(/canal in \(([^)]+)\)/)[1].match(/'([^']+)'/g).map(value => value.slice(1, -1));

function track(attributes, options = {}) {
  const requests = [];
  let click;
  const element = {
    disabled: !!options.disabled,
    href: options.href || '',
    getAttribute: name => attributes[name] || null,
    hasAttribute: name => Object.hasOwn(attributes, name),
    classList: {contains: name => (options.classes || []).includes(name)}
  };
  const document = {
    readyState: 'complete', referrer: '',
    querySelector: () => options.missingConsent ? null : {checked: !!options.checked},
    addEventListener(name, handler) {if (name === 'click') click = handler;}
  };
  vm.runInNewContext(analytics, {
    document, location: {pathname: '/ebooks/', hostname: 'granjarentable.com'},
    window: {GR: {comunidad: {supabaseUrl: 'https://test.invalid', supabaseAnonKey: 'test'}, formEndpoint: 'https://forms.invalid'}},
    localStorage: {getItem() {return 'MX';}}, URL, URLSearchParams,
    navigator: {sendBeacon(url, data) {requests.push({url, data});}},
    fetch(url, options) {requests.push({url, data: JSON.parse(options.body)}); return Promise.resolve();}
  });
  click({target: {closest: selector => {
    if (attributes['data-stripe-ebook'] && !selector.includes('button')) return null;
    return element;
  }}});
  const intentions = requests.filter(request => request.url.endsWith('/intenciones_compra'));
  for (const request of intentions) assert(allowedChannels.includes(request.data.canal));
  return {requests, intentions};
}

for (const product of ['guia-empezar', 'alimenta-ponedoras', 'pienso-hacer', 'pienso-elegir']) {
  const result = track({'data-stripe-ebook': product}, {checked: true});
  assert.equal(result.intentions.length, 1);
  assert.equal(result.intentions[0].data.producto, product);
  assert.equal(result.intentions[0].data.canal, 'tienda');
  assert(!result.requests.some(request => request.url.includes('forms.invalid')));
}
for (const options of [{}, {checked: true, disabled: true}, {missingConsent: true}]) {
  assert.equal(track({'data-stripe-ebook': 'guia-empezar'}, options).intentions.length, 0);
}
const link = track({'data-checkout': '', 'data-producto': 'Guía'});
assert.equal(link.intentions.length, 1);
assert.equal(link.intentions[0].data.canal, 'tienda');
const whatsapp = track({}, {href: 'https://wa.me/123?text=Me%20interesa%3A%20Guia'});
assert.equal(whatsapp.intentions[0].data.canal, 'whatsapp');
assert.equal(whatsapp.intentions[0].data.producto, 'Guia');
assert.equal(track({}, {href: 'https://example.com/'}).intentions.length, 0);
console.log('Intenciones comprobadas con los canales del esquema SQL y los cuatro ebooks.');
