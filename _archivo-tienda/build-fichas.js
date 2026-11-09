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

function campoPendiente(valor) {
  return esc(String(valor || "").trim());
}
function datosAlmacen(p) {
  var zonas = [];
  Object.keys(p.paises || {}).forEach(function (k) {
    var d = p.paises[k];
    var z = d && d.disponible ? String(d.origen_envio || "").trim() : "";
    if (z && z.toLowerCase() !== "internacional" && zonas.indexOf(z) === -1) zonas.push(z);
  });
  var nombre = p.vendedor && p.vendedor.nombre ? String(p.vendedor.nombre).trim() : "";
  return { zona: zonas.join(", "), vendedor: nombre };
}
function bloqueLegal(p) {
  return [
    "<h2>Quién te vende</h2>",
    "<p>Te vende Juan Pablo González García, persona física, NIF 78701119H, Calle Juan Rumeu García 6 bajo, 38008 Santa Cruz de Tenerife. El correo dahanitrading@gmail.com es solo un correo de contacto.</p><!-- [PENDIENTE PABLO: explicar qué es The Honey Trading y por qué aparece en el cobro] -->",
    "<h2>Precio, plazo e impuestos</h2>",
    "<p>El país de esta ficha sale de la IP. Si no podemos detectarlo, mostramos España y el precio lleva los impuestos incluidos. Puedes elegir otro país en el selector de esta página. En una compra desde Canarias se aplica el tipo general del IGIC, el 7 %, incluido en el precio. No es el IVA.</p>",
    "<!-- [PENDIENTE gestor: confirmar el tipo de IGIC por producto si no es el general del 7 %. Confirmar el impuesto fuera de Canarias.] -->",
    "<p>El producto se envía directamente desde el proveedor. Contacto: <a href=\"mailto:dahanitrading@gmail.com\">dahanitrading@gmail.com</a>, solo un correo.</p>",
    "<h2>Desistimiento, devolución y garantía</h2>",
    "<p>Tienes 14 días naturales desde que recibes el producto para comunicar el desistimiento, sin dar motivo. El reembolso lo hace Juan Pablo González García en un plazo de 14 días desde la prueba de envío.</p>",
    (function () {
      var alm = datosAlmacen(p);
      var dir = campoPendiente(p.devolucion_direccion);
      var coste = campoPendiente(p.devolucion_coste);
      var nota = "<!-- [PENDIENTE PABLO: dirección del almacén de devolución y coste estimado. Hueco en el catálogo: devolucion_direccion y devolucion_coste.";
      if (alm.vendedor) nota += " Vendedor guardado: " + alm.vendedor + ".";
      if (alm.zona) nota += " Zona de almacén en el catálogo: " + alm.zona + ".";
      nota += " Plazos de garantía legal por país, sin confirmar.] -->";
      if (dir && coste) {
        return "<p>Antes de comprar: la devolución se envía a " + dir + ". Coste estimado de la devolución: " + coste + ".</p>\n" + nota;
      }
      return "<p>Antes de comprar, escríbenos y te indicamos la dirección y el coste de la devolución.</p>\n" + nota;
    })(),
    "<p><a href=\"../../../condiciones-venta.html\">Condiciones de venta</a></p>"
  ].join("\n");
}

function textoNota(p) {
  var tiene = p.rating != null && p.rating !== "" && !isNaN(Number(p.rating));
  var bits = [];
  if (tiene) bits.push(Number(p.rating).toFixed(1).replace(".", ",") + " de nota media");
  if (p.pedidos) {
    var n = parseInt(String(p.pedidos).replace(/[^0-9]/g, ""), 10);
    bits.push(n === 1 ? "1 vendido" : String(p.pedidos) + " vendidos");
  }
  if (!bits.length) return "";
  return '<p class="t-rating">' + esc(bits.join(" · ")) + " en AliExpress</p>";
}

function ficha(p) {
  var real = fotoReal(p);
  var web = srcWeb(p);
  var rotulo = real ? "Foto del producto del proveedor" : "Imagen orientativa";
  var alt = real ? p.nombre : "Imagen orientativa. No es una foto de este producto.";
  var media = web
    ? '<img src="' + esc(web) + '" alt="' + esc(alt) + '" width="760" height="570">' +
      '<p class="t-nota-foto"><strong>' + esc(rotulo) + ".</strong>" +
      (real ? "" : " No es una foto de este producto.") + "</p>"
    : '<div class="t-sin-foto t-sin-foto-grande">' + esc(rotulo) + "</div>";
  var compra = '<p class="t-precio t-precio-grande" id="ficha-precio">Precio estimado según tu país</p>' +
    '<p class="t-envio" id="ficha-envio">Plazo estimado en la lista de países.</p>' +
    '<p id="ficha-aviso" class="note" hidden></p>' +
    '<div id="ficha-acciones">' +
    '<button type="button" class="btn gold" data-cart-buy="' + esc(p.slug) + '">Comprar ahora</button>' +
    '<button type="button" class="btn cart-add cart-add-ficha" data-cart-add="' + esc(p.slug) + '">Añadir al carrito</button>' +
    "</div>";
  var desc = metaDe(p);
  var titulo = p.nombre + " · Tienda Granja Rentable";
  var canon = "https://granjarentable.com/tienda/p/" + p.slug + "/";
  var og = srcAbsoluta(p);
  return '<!DOCTYPE html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n' +
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
    textoNota(p) + "\n" +
    '<div class="pdp-grid"><div class="pdp-media">' + media + '</div><div class="pdp-buy">' + compra +
    '<ul class="t-precios-pais">' + precios(p) + "</ul></div></div>\n" +
    '<div class="pdp-copy"><p>' + esc(p.descripcion) + "</p>\n" +
    (p.incluye && p.incluye.length ? "<h2>Qué incluye</h2>" + lista(p.incluye) : "") +
    (p.utilidades && p.utilidades.length ? "<h2>Para qué puede servir</h2>" + lista(p.utilidades) : "") +
    (p.como_se_usa && p.como_se_usa.length ? "<h2>Cómo se usa</h2>" + lista(p.como_se_usa, "ol") : "") +
    bloqueLegal(p) + "</div>\n</article>\n</main>\n" +
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
sitemap = sitemap.replace("<loc>https://granjarentable.com/ebooks</loc>", "<loc>https://granjarentable.com/ebooks/</loc>");
sitemap = sitemap.replace(/\s*<url>\s*<loc>https:\/\/granjarentable\.com\/tienda\/p\/[^<]+<\/loc>[\s\S]*?<\/url>/g, "");
asegurar("https://granjarentable.com/ebooks/");
asegurar("https://granjarentable.com/tienda/");
CAT.productos.forEach(function (p) {
  if (p.activo !== false) asegurar("https://granjarentable.com/tienda/p/" + p.slug + "/");
});
fs.writeFileSync(sitemapRuta, sitemap);
console.log("Fichas: " + CAT.productos.length);
