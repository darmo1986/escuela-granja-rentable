/* Genera las fichas estáticas de /tienda/p/<slug>/.
   Uso: node tienda/build-fichas.js
   El HTML inicial lleva nombre, precio, imagen, plazo y CTA.
   tienda.js solo actualiza el país, el carrito y el pago. */
"use strict";

var fs = require("fs");
var path = require("path");
var vm = require("vm");

var raiz = path.join(__dirname, "..");
var codigo = fs.readFileSync(path.join(__dirname, "catalogo.js"), "utf8");
var sandbox = { window: {} };
vm.runInNewContext(codigo, sandbox);
var CAT = sandbox.window.GR_TIENDA_CATALOGO;

var CATS = {
  bebederos: "Bebederos",
  comederos: "Comederos",
  incubacion: "Incubación",
  crianza: "Crianza y calor",
  gallinero: "Gallinero y cercas",
  mallas: "Mallas y huerto",
  proteccion: "Protección"
};

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
  });
}

function fotoReal(p) {
  var src = (p.imagenes && p.imagenes[0]) || p.imagen_local || "";
  if (!src) return false;
  var abs = path.join(__dirname, src);
  if (!fs.existsSync(abs)) return false;
  return /foto del producto/i.test(String(p.imagen_local_nota || ""));
}

function srcWeb(p) {
  var src = (p.imagenes && p.imagenes[0]) || p.imagen_local || "";
  if (!src) return "";
  if (src.indexOf("../img/") === 0) return "../../../img/" + src.slice("../img/".length);
  return src;
}

function srcAbsoluta(p) {
  var src = (p.imagenes && p.imagenes[0]) || p.imagen_local || "";
  if (!src) return "https://granjarentable.com/img/logo.jpg";
  var rel = src.indexOf("../img/") === 0 ? src.slice(3) : src.replace(/^\.\//, "");
  return "https://granjarentable.com/" + rel.replace(/^\/+/, "");
}

function dinero(valor, moneda) {
  try {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: moneda }).format(valor);
  } catch (e) {
    return valor + " " + moneda;
  }
}

function metaDe(p) {
  var t = String(p.descripcion_corta || p.nombre).replace(/\s+/g, " ").trim();
  if (t.length > 150) t = t.slice(0, 147).replace(/\s+\S*$/, "") + "…";
  return t;
}

function lista(items, etiqueta) {
  if (!items || !items.length) return "";
  var lis = items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("");
  var tag = etiqueta === "ol" ? "ol" : "ul";
  return "<" + tag + ">" + lis + "</" + tag + ">";
}

function precios(p) {
  var orden = ["MX", "ES", "US"];
  return orden.map(function (code) {
    var d = p.paises && p.paises[code];
    if (!d || !d.disponible) return "";
    var nombre = (CAT.paises[code] && CAT.paises[code].nombre) || code;
    var nota = d.nota ? " " + d.nota : "";
    return '<li data-pais="' + code + '"><strong>' + esc(nombre) + ":</strong> " +
      esc(dinero(d.precio, d.moneda)) + " · plazo estimado " + esc(d.dias_envio) + "." +
      esc(nota) + "</li>";
  }).join("");
}

function bloqueLegal() {
  return [
    "<h2>Quién te vende</h2>",
    "<p>Te vende Juan Pablo González García (NIF 78701119H), titular de Granja Rentable. The Honey Trading es un nombre comercial del mismo titular. <strong class=\"t-pendiente\">[PENDIENTE: confirmar si The Honey Trading aparece en el cobro de todos los productos de la tienda o solo en la incubadora]</strong></p>",
    "<h2>Precio, plazo y aduana</h2>",
    "<p>El precio y el plazo son estimados. El producto se envía directamente desde el proveedor. Pueden existir impuestos, tasas o gestión aduanera no incluidos. <strong class=\"t-pendiente\">[PENDIENTE: confirmar por país si el precio incluye IVA o aranceles]</strong> <strong class=\"t-pendiente\">[PENDIENTE: confirmar quién figura como importador en cada país]</strong></p>",
    "<h2>Desistimiento, devolución y garantía</h2>",
    "<p>Tienes 14 días naturales desde que recibes el producto para comunicar el desistimiento, sin dar motivo. El reembolso, incluidos los gastos de entrega ordinaria, se hace como máximo en 14 días desde esa comunicación. Podemos retener el reembolso hasta recibir el bien o una prueba de que lo has enviado. El coste de la devolución lo asumes tú; te lo decimos antes de que envíes el paquete.</p>",
    "<p>La devolución se envía a la dirección del almacén del proveedor. Esa dirección te la facilitamos cuando nos comunicas el desistimiento, escribiendo a <a href=\"mailto:ventas@granjarentable.com\">ventas@granjarentable.com</a>. Quien responde ante ti del reembolso y de la garantía legal de conformidad es Granja Rentable, no el proveedor. <strong class=\"t-pendiente\">[PENDIENTE: plazos de garantía legal por país]</strong></p>",
    "<p><a href=\"../../../condiciones-venta.html\">Condiciones de venta</a></p>"
  ].join("\n");
}

function ficha(p) {
  var real = fotoReal(p);
  var web = srcWeb(p);
  var alt = real ? p.nombre : "Imagen orientativa. No es una foto de este producto.";
  var media = web
    ? '<img src="' + esc(web) + '" alt="' + esc(alt) + '" width="760" height="570">' +
      (real ? "" : '<p class="t-nota-foto"><strong>Imagen orientativa.</strong> No es una foto de este producto.</p>')
    : '<div class="t-sin-foto t-sin-foto-grande">Próximamente</div>';
  var compra = real
    ? '<p class="t-precio t-precio-grande" id="ficha-precio">Precio estimado según tu país</p>' +
      '<p class="t-envio" id="ficha-envio">Plazo estimado en la lista de países.</p>' +
      '<p id="ficha-aviso" class="note" hidden></p>' +
      '<div id="ficha-acciones">' +
      '<button type="button" class="btn gold" data-cart-buy="' + esc(p.slug) + '">Comprar ahora</button>' +
      '<button type="button" class="btn cart-add cart-add-ficha" data-cart-add="' + esc(p.slug) + '">Añadir al carrito</button>' +
      "</div>"
    : '<p class="t-pronto"><strong>Próximamente</strong></p><p>No está a la venta: no hay una foto real de este producto. No se puede añadir al carrito.</p>';
  var desc = metaDe(p);
  var titulo = p.nombre + " · Tienda Granja Rentable";
  var canon = "https://granjarentable.com/tienda/p/" + p.slug + "/";
  var og = srcAbsoluta(p);
  return '<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="google-adsense-account" content="ca-pub-5311145772953700">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<script src="../../../js/boot.js?v=202610184"></script>\n' +
    '<link rel="icon" type="image/png" href="../../../img/favicon.png">\n' +
    '<link rel="stylesheet" href="../../../css/estilo.css?v=202610184">\n' +
    '<link rel="stylesheet" href="../../tienda.css">\n' +
    "<title>" + esc(titulo) + "</title>\n" +
    '<meta name="description" content="' + esc(desc) + '">\n' +
    '<link rel="canonical" href="' + canon + '">\n' +
    '<meta property="og:type" content="product">\n' +
    '<meta property="og:title" content="' + esc(p.nombre) + '">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:url" content="' + canon + '">\n' +
    '<meta property="og:image" content="' + esc(og) + '">\n' +
    "</head>\n<body data-root=\"../../../\">\n" +
    '<header class="site-head"><div class="wrap head-in">' +
    '<a class="brand" href="../../../index.html"><span class="brand-mark"><img src="../../../img/logo.jpg" alt="Granja Rentable" width="46" height="46"></span><span class="brand-name">Granja Rentable</span></a>' +
    '<nav class="main-nav" aria-label="Principal"><a href="../../../index.html">Inicio</a> <a href="../../">Tienda</a> <a href="../../../curso.html">Curso</a> <a href="../../../blog/">Blog</a></nav>' +
    "</div></header>\n<main class=\"wrap\">\n" +
    '<p id="tienda-volver"><a href="../../">← Volver a la tienda</a> · <span class="t-pais-chip" id="tienda-pais">Tu país…</span></p>\n' +
    '<p class="t-pais-manual"><label for="tienda-pais-select">¿No es tu país? Elige el tuyo:</label> ' +
    '<select id="tienda-pais-select" aria-label="Elegir país de la tienda">' +
    '<option value="MX">México</option><option value="ES">España</option><option value="US">Estados Unidos</option>' +
    '<option value="CO">Colombia (no disponible)</option><option value="AR">Argentina (no disponible)</option>' +
    '<option value="PE">Perú (no disponible)</option><option value="CL">Chile (no disponible)</option>' +
    "</select></p>\n" +
    '<article id="tienda-ficha" data-estatica="1" data-slug="' + esc(p.slug) + '">\n' +
    '<p class="pdp-cat">' + esc(CATS[p.categoria] || p.categoria) + " · Tienda Granja Rentable</p>\n" +
    "<h1>" + esc(p.nombre) + "</h1>\n" +
    '<p class="t-rating">' + esc(Number(p.rating).toFixed(1).replace(".", ",")) + " de nota media · " + esc(p.pedidos) + " vendidos</p>\n" +
    '<div class="pdp-grid"><div class="pdp-media">' + media + '</div><div class="pdp-buy">' + compra +
    '<ul class="t-precios-pais">' + precios(p) + "</ul></div></div>\n" +
    '<div class="pdp-copy"><p>' + esc(p.descripcion) + "</p>\n" +
    (p.incluye && p.incluye.length ? "<h2>Qué incluye</h2>" + lista(p.incluye) : "") +
    (p.utilidades && p.utilidades.length ? "<h2>Para qué puede servir</h2>" + lista(p.utilidades) : "") +
    (p.como_se_usa && p.como_se_usa.length ? "<h2>Cómo se usa</h2>" + lista(p.como_se_usa, "ol") : "") +
    bloqueLegal() + "</div>\n</article>\n</main>\n" +
    '<footer class="foot"><div class="wrap"><p>Juan Pablo González García · NIF 78701119H · Calle Juan Rumeu García 6 bajo · 38008 Santa Cruz de Tenerife · <a href="mailto:ventas@granjarentable.com">ventas@granjarentable.com</a></p>' +
    '<p><a href="../../../aviso-legal.html">Aviso legal</a> · <a href="../../../privacidad.html">Privacidad</a> · <a href="../../../cookies.html">Cookies</a> · <a href="../../../condiciones-venta.html">Condiciones de venta</a></p></div></footer>\n' +
    '<script src="../../../js/config.js?v=202610184"></script>\n' +
    '<script src="../../catalogo.js"></script>\n<script src="../../tienda.js"></script>\n<script src="../../carrito.js"></script>\n' +
    '<script src="../../../js/site.js?v=202610184"></script>\n</body>\n</html>\n';
}

var dirBase = path.join(__dirname, "p");
CAT.productos.forEach(function (p) {
  var dir = path.join(dirBase, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), ficha(p));
});

var sitemapRuta = path.join(raiz, "sitemap.xml");
var sitemap = fs.readFileSync(sitemapRuta, "utf8");
sitemap = sitemap.replace(/\s*<url>\s*<loc>https:\/\/granjarentable\.com\/tienda\.html<\/loc>[\s\S]*?<\/url>/g, "");
sitemap = sitemap.replace(/\s*<url>\s*<loc>https:\/\/granjarentable\.com\/producto\/[^<]+<\/loc>[\s\S]*?<\/url>/g, "");
function asegurar(loc) {
  if (sitemap.indexOf("<loc>" + loc + "</loc>") !== -1) return;
  sitemap = sitemap.replace("</urlset>", '<url><loc>' + loc + '</loc><lastmod>2026-11-01</lastmod></url>\n</urlset>');
}
asegurar("https://granjarentable.com/ebooks");
asegurar("https://granjarentable.com/tienda/");
CAT.productos.forEach(function (p) {
  asegurar("https://granjarentable.com/tienda/p/" + p.slug + "/");
});
fs.writeFileSync(sitemapRuta, sitemap);
console.log("Fichas: " + CAT.productos.length);
