/* Prueba de regresión del escaparate: sin navegador ni conexión a Amazon. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const home = read('index.html');
const shop = read('tienda/index.html');
const ebooks = read('ebooks/index.html');
const config = read('js/config.js');
const app = read('js/app.js');
const site = read('js/site.js');
const js = read('js/escaparate.js');

const amazon = [...home.matchAll(/<a class="gr-venta-card"[^>]*>/g)].map(m => m[0]);
const libros = [...home.matchAll(/<a class="gr-venta-card gr-venta-ebook"[^>]*>/g)].map(m => m[0]);
assert.equal(amazon.length, 7, 'deben existir siete banners a Amazon');
assert.equal(libros.length, 3, 'deben existir tres banners de ebooks');
assert.equal(new Set(amazon.map(x => x.match(/data-banner="([^"]+)"/)?.[1])).size, 7);
for (const a of amazon) {
  assert.match(a, /data-venta-grupo="(alimentacion|incubacion|seguridad)"/);
  assert.match(a, /data-banner="amazon-[a-z0-9]{10}"/);
  assert.match(a, /https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]{10}\?tag=granjarentabl-20&amp;language=es_US/);
  assert.match(a, /rel="sponsored noopener noreferrer"/);
}
for (const a of libros) {
  const id = a.match(/href="ebooks\/#([^"]+)"/)?.[1];
  assert.ok(id, 'debe tener enlace de ebook');
  assert.match(a, /data-banner="ebook-[a-z-]+"/);
  assert.ok(ebooks.includes('id="' + id + '"'), 'el ebook enlazado debe existir: ' + id);
}
const cardHtml = [...home.matchAll(/<a class="gr-venta-card(?: gr-venta-ebook)?"[^>]*>[\s\S]*?<\/a>/g)].map(m => m[0]);
assert.equal(cardHtml.length, 10);
for (const card of cardHtml) {
  const image = card.match(/<img src="([^"]+)"/)?.[1];
  assert.ok(image, 'todos los banners tienen ilustración');
  assert.ok(fs.existsSync(path.join(root, image)), 'imagen de banner ausente: ' + image);
}
assert.ok(home.includes('data-ventas-herramientas'));
assert.ok(home.includes('data-ventas-pais'));
assert.ok(home.includes('js/escaparate.js'));
assert.ok(js.includes('aria-pressed'));
assert.ok(home.includes('href="#ofertas-granja"'));
assert.ok(shop.includes('t-busqueda-rapida'));
assert.equal([...shop.matchAll(/ data-t-card data-cat=/g)].length, 169);
assert.ok(shop.length < 360000, 'la tienda no debe crecer de nuevo hasta 370 KB');
assert.ok(config.includes('activo: false'), 'Adsterra debe seguir desactivado');
assert.ok(!app.includes('bauval.org'), 'sin carga de código Adsterra');
assert.ok(site.includes('u.searchParams.set("language", "es_US")'));
assert.ok(read('tienda/imagenes-respaldo.js').includes('t-foto-vacia'));
console.log('OK: 7 Amazon, 3 ebooks, 169 fichas, imágenes, tienda rápida, idioma, seguimiento y sin Adsterra.');
