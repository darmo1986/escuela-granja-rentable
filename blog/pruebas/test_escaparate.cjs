'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const home = read('index.html');
const landing = read('recomendados.html');
const shop = read('tienda/index.html');
const ebooks = read('ebooks/index.html');
const catalogSize = JSON.parse(read('tienda/catalogo.json')).length;

for (const [name, html, expectedBooks] of [['portada', home, 4], ['recomendados', landing, 3]]) {
  const amazon = [...html.matchAll(/<a class="gr-venta-card"[^>]*>/g)].map(m => m[0]);
  const libros = [...html.matchAll(/<a class="gr-venta-card gr-venta-ebook"[^>]*>/g)].map(m => m[0]);
  assert.equal(amazon.length, 7, name + ': siete productos');
  assert.equal(libros.length, expectedBooks, name + ': ' + expectedBooks + ' ebooks');
  assert.equal(new Set(libros.map(a => a.match(/href="ebooks\/#([^"]+)"/)?.[1])).size, expectedBooks, name + ': destinos ebook distintos');
  assert.equal(new Set(amazon.map(a => a.match(/data-banner="([^"]+)"/)?.[1])).size, 7);
  for (const a of amazon) {
    assert.match(a, /data-banner="amazon-[a-z0-9]{10}"/);
    assert.match(a, /amazon\.com\/dp\/[A-Z0-9]{10}\?tag=granjarentabl-20&amp;language=es_US/);
    assert.match(a, /rel="sponsored noopener noreferrer"/);
  }
  for (const a of libros) {
    const id = a.match(/href="ebooks\/#([^"]+)"/)?.[1];
    assert.ok(id && ebooks.includes('id="' + id + '"'), 'ebook existente: ' + id);
    assert.match(a, /data-banner="ebook-[a-z-]+"/);
  }
  const cards = [...html.matchAll(/<a class="gr-venta-card(?: gr-venta-ebook)?"[^>]*>[\s\S]*?<\/a>/g)];
  assert.equal(cards.length, 7 + expectedBooks, name + ': total de tarjetas');
  for (const card of cards) {
    const image = card[0].match(/<img src="([^"]+)"/)?.[1];
    assert.ok(image && fs.existsSync(path.join(root, image)), 'foto local: ' + image);
  }
  assert.ok(html.includes('js/registro-banners.js'), 'registro de clics: ' + name);
}
assert.ok(home.includes('gr-ventas-busqueda') && home.includes('js/banners-ventas.js'));
assert.equal((shop.match(/id="t-rapida"/g) || []).length, 1, 'un único buscador rápido');
assert.ok(shop.includes('Buscar entre ' + catalogSize + ' productos'), 'el buscador indica el tamaño del catálogo');
assert.equal([...shop.matchAll(/ data-t-card data-cat=/g)].length, catalogSize);
assert.ok(shop.length < 360000 + 1900 * Math.max(0, catalogSize - 169), 'presupuesto de tamaño de la tienda por ficha añadida');
assert.ok(read('js/config.js').includes('activo: false'), 'Adsterra desactivado');
assert.ok(!read('js/app.js').includes('bauval.org'), 'sin script Adsterra');
assert.ok(read('js/site.js').includes('searchParams.set("language", "es_US")'));
assert.ok(read('tienda/imagenes-respaldo.js').includes('t-foto-vacia'));
assert.ok(read('js/banners-ventas.js').includes('gr-venta-sin-foto'));
console.log('Escaparate: 7 Amazon por página, 4 ebooks en portada y 3 en recomendados, imágenes, clics, fichas del catálogo, buscador, idioma y Adsterra comprobados.');
