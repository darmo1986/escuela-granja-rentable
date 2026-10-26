/* Genera enfermedades.html y enfermedades/<id>.html desde articulos.json.
   node _fuentes/enfermedades/construir.js
   No publica nada: solo escribe HTML estático.
   La fuente vive en _fuentes para que GitHub Pages no sirva las notas internas. */
var fs = require("fs");
var path = require("path");

var SRC = __dirname;
var ROOT = path.join(SRC, "..", "..");
var DIR = path.join(ROOT, "enfermedades");
var data = JSON.parse(fs.readFileSync(path.join(SRC, "articulos.json"), "utf8"));
var calc = fs.readFileSync(path.join(ROOT, "calculadora.html"), "utf8");
var SITIO = "https://granjarentable.com";
var CREDITO = data.creditoImagen;

function slice(html, start, end) {
  var i = html.indexOf(start);
  var j = html.indexOf(end, i);
  if (i < 0 || j < 0) throw new Error("No encuentro " + start);
  return html.slice(i, j + end.length);
}

var CABECERA = slice(calc, '<a class="skip"', "</header>") + '\n<p id="ref-note" class="ref-note" hidden></p>\n';
CABECERA = CABECERA.replace(/<a href="tienda\.html#salud">[\s\S]*?<\/a>\s*/g, "");
var PIE = slice(calc, "<footer", "</footer>") + "\n" + slice(calc, '<a class="wa-float"', "</a>");

function relativize(html, root) {
  if (!root) return html;
  return html.replace(/(\s(?:href|src)=")(?!https?:|mailto:|#|\/\/)([^"]*)/g, function (_, pre, url) {
    return pre + root + url;
  });
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function palabras(texto) {
  var t = String(texto || "").trim();
  if (!t) return 0;
  return t.split(/\s+/).length;
}

function textoDe(art) {
  return [
    art.titulo, art.resumen, art.todo,
    (art.reconocer || []).join(" "),
    (art.contagio || []).join(" "),
    (art.prevenir || []).join(" "),
    (art.natural || []).join(" "),
    (art.veterinario || []).join(" ")
  ].join(" ");
}

function minutosDe(art) {
  if (art.minutos) return art.minutos;
  return Math.max(1, Math.round(palabras(textoDe(art)) / 200));
}

function porId(id) {
  var i;
  for (i = 0; i < data.articulos.length; i++) if (data.articulos[i].id === id) return data.articulos[i];
  return null;
}

function catDe(id) {
  var i;
  for (i = 0; i < data.categorias.length; i++) if (data.categorias[i].id === id) return data.categorias[i];
  return null;
}

function etiNombre(id) {
  var i;
  for (i = 0; i < data.etiquetas.length; i++) if (data.etiquetas[i].id === id) return data.etiquetas[i].nombre;
  return id;
}

function sintomasDe(id) {
  return data.sintomas.filter(function (s) { return s.articulos.indexOf(id) !== -1; });
}

function lista(items) {
  if (!items || !items.length) return "";
  return "<ul>\n" + items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("\n") + "\n</ul>\n";
}

function figuras(art, root) {
  return (art.imagenes || []).map(function (img) {
    var credito = img.credito || CREDITO;
    return '<figure class="enf-fig">\n<div class="enf-ph" role="img" aria-label="' + esc(img.alt) + '"><p class="enf-ph-kicker">Ilustración</p><p>' + esc(img.alt) + "</p></div>\n<figcaption>Texto alternativo: " + esc(img.alt) + "<br>Crédito: " + esc(credito) + "</figcaption>\n</figure>\n";
  }).join("");
}

function textoOficial() {
  return "Avisa hoy a los servicios oficiales. En España, el MAPA o la oficina de sanidad animal de tu comunidad. En México, SENASICA. En Colombia, el ICA. En Perú, SENASA. No des remedios caseros, no muevas las aves a otra granja y no esperes a confirmarlo en casa. Ante un ave enferma, llama al veterinario.";
}

function avisoGripe() {
  return '<aside class="enf-oficial"><p><strong>Declaración obligatoria. Gripe aviar.</strong> La gripe aviar es una zoonosis: puede pasar a las personas. No toques aves muertas sin guantes y no te las lleves a casa. ' + textoOficial() + "</p></aside>\n";
}

function avisoNewcastle() {
  return '<aside class="enf-oficial"><p><strong>Declaración obligatoria. Newcastle.</strong> Puede causar conjuntivitis en las personas que la manipulan. No toques aves muertas sin guantes y no te las lleves a casa. ' + textoOficial() + "</p></aside>\n";
}

function avisoOficial(art) {
  if (art && art.id === "newcastle") return avisoNewcastle();
  return avisoGripe();
}

function validar() {
  var ids = {};
  var dosis = /\d+(?:[.,]\d+)?\s*(?:mg|ml|mcg|µg|ui|g\/l|cc)\b/i;
  var farmaco = /\b(?:ivermectina|amoxicilina|enrofloxacina|doxiciclina|toltrazuril|sulfadimidina)\b/i;
  data.articulos.forEach(function (art) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(art.id)) throw new Error("id raro " + art.id);
    if (ids[art.id]) throw new Error("id repetido " + art.id);
    ids[art.id] = true;
    if (!catDe(art.categoria)) throw new Error("categoría " + art.categoria);
    if (!art.metaTitulo || !art.metaDescripcion) throw new Error("faltan metas " + art.id);
    if (art.metaDescripcion.length > 170) throw new Error("meta larga " + art.id + " " + art.metaDescripcion.length);
    if (dosis.test(textoDe(art)) || farmaco.test(textoDe(art))) throw new Error("posible dosis o fármaco en " + art.id);
    (art.etiquetas || []).forEach(function (e) {
      if (!data.etiquetas.some(function (x) { return x.id === e; })) throw new Error("etiqueta " + e);
    });
    if (art.declaracion) {
      if ((art.natural || []).length) throw new Error(art.id + " es de declaración y no puede llevar remedios");
      if ((art.etiquetas || []).indexOf("natural") !== -1) throw new Error(art.id + " no lleva la etiqueta natural");
    }
    if (art.estado === "borrador" && !art.todo) throw new Error("falta TODO " + art.id);
    if (art.estado === "completo") {
      ["reconocer", "contagio", "prevenir", "veterinario"].forEach(function (k) {
        if (!art[k] || art[k].length < 2) throw new Error(art.id + " incompleto en " + k);
      });
      if (!art.imagenes || !art.imagenes.length) throw new Error("faltan imágenes " + art.id);
    }
    (art.imagenes || []).forEach(function (img) {
      if (!img.alt) throw new Error("falta alt " + art.id);
      if (img.src || img.url) throw new Error("no se admiten imágenes enlazadas en " + art.id);
    });
    (art.relacionados || []).forEach(function (r) {
      if (!data.articulos.some(function (a) { return a.id === r; })) throw new Error("relacionado " + r);
    });
  });
  data.sintomas.forEach(function (s) {
    s.articulos.forEach(function (id) {
      if (!ids[id]) throw new Error("síntoma " + s.id + " apunta a " + id);
    });
  });
}

function head(opts) {
  var root = opts.root;
  var canon = SITIO + opts.path;
  return '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + esc(opts.title) + '</title>\n<meta name="description" content="' + esc(opts.description) + '">\n<link rel="canonical" href="' + esc(canon) + '">\n<meta name="robots" content="' + (opts.robots || "index,follow") + '">\n<meta property="og:url" content="' + esc(canon) + '">\n<meta property="og:type" content="' + (opts.article ? "article" : "website") + '">\n<meta property="og:title" content="' + esc(opts.title) + '">\n<meta property="og:description" content="' + esc(opts.description) + '">\n<meta property="og:image" content="' + SITIO + '/img/logo.jpg">\n<meta property="og:locale" content="es_419">\n<meta property="og:image:alt" content="Logo de Granja Rentable">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + esc(opts.title) + '">\n<meta name="twitter:description" content="' + esc(opts.description) + '">\n<meta name="twitter:image" content="' + SITIO + '/img/logo.jpg">\n<meta name="theme-color" content="#1F5E2E">\n<link rel="icon" href="' + root + 'img/favicon.svg" type="image/svg+xml">\n<link rel="icon" href="' + root + 'img/favicon.png" sizes="64x64" type="image/png">\n<link rel="stylesheet" href="' + root + 'css/estilo.css">\n<script src="' + root + 'js/boot.js"></script>\n' + (opts.schema ? '<script type="application/ld+json">\n' + opts.schema + "\n</script>\n" : "") + "</head>\n";
}

function scripts(root, extra) {
  return '<script src="' + root + 'js/config.js"></script>\n<script src="' + root + 'js/app.js"></script>\n<script src="' + root + 'js/catalogo.js"></script>\n<script src="' + root + 'js/site.js"></script>\n' + (extra || "");
}

function anuncio(tipo) {
  return '<aside class="ad-inline" data-ad-size="' + tipo + '"><p class="ad-label">Publicidad</p><div class="ad-slot" data-ad-slot="' + tipo + '" data-ad-size="' + tipo + '"></div></aside>\n';
}

function pagina(opts) {
  var root = opts.root;
  return head(opts) + '<body data-root="' + root + '">\n' + relativize(CABECERA, root) + '<main id="contenido">\n' + opts.main + anuncio("rect") + "</main>\n" + relativize(PIE, root) + "\n" + scripts(root, opts.extra) + "</body>\n</html>\n";
}

function schemaArticulo(art) {
  var url = SITIO + "/enfermedades/" + art.id + ".html";
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: art.titulo,
    description: art.metaDescripcion,
    inLanguage: "es",
    datePublished: art.fecha,
    dateModified: art.actualizado,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Granja Rentable", url: SITIO + "/" },
    publisher: { "@type": "Organization", name: "Granja Rentable", url: SITIO + "/" }
  }, null, 2);
}

var ICONOS = {
  respiratorias: '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M5 16h5l2.2-5 3.2 10 2.4-5H27"/></svg>',
  viricas: '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" d="M16 5 28 27H4z"/><path fill="currentColor" d="M15 13h2v7h-2zm0 9h2v2h-2z"/></svg>',
  parasitarias: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="4" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16 8V4M16 28v-4M8 16H4M28 16h-4M10 10 7 7M22 22l3 3M22 10l3-3M10 22l-3 3"/></svg>',
  digestivas: '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" d="M12 6h6a6 6 0 0 1 0 12h-2a5 5 0 0 0 0 10"/></svg>',
  carencias: '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 5c2 6-2 8-2 13a6 6 0 1 0 8 0c0-5-4-7-2-13-2 3-4 3-4 0z"/></svg>',
  puesta: '<svg viewBox="0 0 32 32" aria-hidden="true"><ellipse cx="16" cy="18" rx="8" ry="10" fill="none" stroke="currentColor" stroke-width="2.2"/></svg>',
  patas: '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="M10 26c0-6 2-8 6-8s6 2 6 8M12 14v4M16 12v6M20 14v4"/></svg>',
  pollitos: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="15" cy="16" r="7" fill="none" stroke="currentColor" stroke-width="2.2"/><path fill="currentColor" d="M21 15h5l-5 3zM13 12.5h2.2V15H13z"/></svg>'
};

function menuDe(cat) {
  return cat.menu || cat.nombre;
}

function elegirDescripcion(opciones, contexto) {
  for (var i = 0; i < opciones.length; i++) {
    if (opciones[i].length >= 120 && opciones[i].length <= 155) return opciones[i];
  }
  throw new Error("descripción fuera de 120-155: " + contexto);
}

function descEnPreparacion(titulo) {
  return elegirDescripcion([
    "Ficha de " + titulo + " en preparación. Todavía no está publicada en Granja Rentable: información orientativa, sin dosis.",
    "Ficha de " + titulo + " en preparación en Granja Rentable. Todavía no está publicada. Información orientativa, sin dosis.",
    titulo + ": ficha en preparación en Granja Rentable. Todavía no está publicada. Información orientativa, sin dosis.",
    "Ficha de " + titulo + " en preparación en Granja Rentable. Todavía no está publicada. Información orientativa, sin dosis ni tratamiento."
  ], titulo);
}

function descCategoria(cat, listas) {
  var nombre = menuDe(cat);
  var estado = listas.length
    ? (listas.length === 1 ? "hay 1 ficha redactada" : "hay " + listas.length + " fichas redactadas")
    : "las fichas se publicarán cuando estén revisadas";
  return elegirDescripcion([
    "Categoría " + nombre + " de enfermedades de gallinas y pollos en Granja Rentable: " + estado + ". Información orientativa, sin dosis.",
    nombre + " en Granja Rentable: " + estado + ". Enfermedades de gallinas y pollos, información orientativa y sin dosis.",
    "Enfermedades, categoría " + nombre + ": " + estado + ". Información orientativa de Granja Rentable, sin dosis."
  ], nombre);
}

function publicados() {
  return data.articulos.filter(function (a) { return a.estado === "completo"; });
}
function deCategoria(id) {
  return data.articulos.filter(function (a) { return a.categoria === id; });
}

function textoCuenta(id) {
  var lista = deCategoria(id);
  var listas = lista.filter(function (a) { return a.estado === "completo"; }).length;
  var pronto = lista.length - listas;
  if (!lista.length) return "Próximamente";
  if (!listas) return (lista.length === 1 ? "1 ficha" : lista.length + " fichas") + " · próximamente";
  if (!pronto) return listas === 1 ? "1 ficha" : listas + " fichas";
  return listas + (listas === 1 ? " lista" : " listas") + " · " + pronto + " próximamente";
}

function migas(items) {
  return '<nav class="enf-migas" aria-label="Ruta"><ol>\n' + items.map(function (item, i) {
    var ultimo = i === items.length - 1;
    if (ultimo || !item.href) return '<li aria-current="page">' + esc(item.texto) + "</li>";
    return '<li><a href="' + esc(item.href) + '">' + esc(item.texto) + "</a></li>";
  }).join("\n") + "\n</ol></nav>\n";
}

function subnav(activo, prefijo) {
  var enlaces = data.categorias.map(function (cat) {
    var n = deCategoria(cat.id).filter(function (a) { return a.estado === "completo"; }).length;
    var actual = cat.id === activo ? ' aria-current="page"' : "";
    return '<li><a href="' + esc(prefijo + cat.id) + '.html"' + actual + "><span>" + esc(menuDe(cat)) + '</span><span class="enf-sub-n">' + n + "</span></a></li>";
  }).join("\n");
  return '<details class="enf-sub" open>\n<summary>Categorías</summary>\n<ul class="enf-sub-lista">\n' + enlaces + "\n</ul>\n</details>\n";
}

function zona(activo, prefijo, cuerpo) {
  return '<div class="enf-zona">\n' + subnav(activo, prefijo) + '<div class="enf-zona-main">\n' + cuerpo + "</div>\n</div>\n";
}

function vecinos(art) {
  var lista = deCategoria(art.categoria).filter(function (a) { return a.estado === "completo"; });
  var i = 0;
  for (; i < lista.length; i++) if (lista[i].id === art.id) break;
  var prev = lista[i - 1];
  var next = lista[i + 1];
  if (!prev && !next) return "";
  function lado(otro, rel, etiqueta) {
    if (!otro) return "<span></span>";
    var extra = otro.estado === "borrador" ? " · próximamente" : "";
    return '<a rel="' + rel + '" href="' + esc(otro.id) + '.html"><span class="fine">' + etiqueta + '</span><strong>' + esc(otro.titulo) + extra + "</strong></a>";
  }
  return '<nav class="enf-vecinos" aria-label="Fichas de esta categoría">\n' + lado(prev, "prev", "Anterior") + "\n" + lado(next, "next", "Siguiente") + "\n</nav>\n";
}

function ficha(art) {
  var root = "../";
  var cat = catDe(art.categoria);
  var mins = minutosDe(art);
  var tags = (art.etiquetas || []).map(function (e) { return '<li>' + esc(etiNombre(e)) + "</li>"; }).join("");
  var rel = (art.relacionados || []).map(function (id) {
    var otro = porId(id);
    if (!otro) return "";
    if (otro.estado !== "completo") return "<li>" + esc(otro.titulo) + " <span class=\"fine\">(próximamente)</span></li>";
    return '<li><a href="' + esc(id) + '.html">' + esc(otro.titulo) + "</a></li>";
  }).join("");
  if (art.estado !== "completo") {
    var corto = "<h1>" + esc(art.titulo) + "</h1>\n" +
      '<p class="enf-aviso">' + esc(data.aviso) + "</p>\n" +
      (art.declaracion ? avisoOficial(art) : "") +
      "<p><strong>Próximamente.</strong> Esta ficha todavía no está publicada.</p>\n";
    var mainCorto = migas([
      { href: root + "index.html", texto: "Inicio" },
      { href: root + "enfermedades.html", texto: "Enfermedades" },
      { href: "categoria/" + cat.id + ".html", texto: menuDe(cat) },
      { texto: art.titulo }
    ]) + zona(cat.id, "categoria/", corto);
    return pagina({
      root: root,
      path: "/enfermedades/" + art.id + ".html",
      title: art.titulo + " | Enfermedades | Granja Rentable",
      description: descEnPreparacion(art.titulo),
      robots: "noindex,follow",
      main: mainCorto,
      extra: '<script src="' + root + 'js/enfermedades.js"></script>\n'
    });
  }
  var cuerpo = "";
  cuerpo += "<h1>" + esc(art.titulo) + "</h1>\n";
  cuerpo += '<p class="enf-aviso">' + esc(data.aviso) + "</p>\n";
  if (art.declaracion) cuerpo += avisoOficial(art);
  cuerpo += "<p>" + esc(art.resumen) + "</p>\n";
  cuerpo += '<p class="enf-meta">Lectura: ' + mins + " min · " + esc(art.actualizado) + "</p>\n";
  if (tags) cuerpo += '<ul class="badges">' + tags + "</ul>\n";
  cuerpo += anuncio("banner");
  cuerpo += '<article class="enf-lectura">\n';
  cuerpo += "<h2>Cómo reconocerla</h2>\n" + lista(art.reconocer) + figuras(art);
  cuerpo += "<h2>Cómo se contagia</h2>\n" + lista(art.contagio);
  cuerpo += "<h2>Cómo prevenirla</h2>\n" + lista(art.prevenir);
  if (art.declaracion) {
    cuerpo += "<h2>Sin remedios caseros</h2>\n" + avisoOficial(art);
    cuerpo += "<p>Esta ficha no trae soluciones naturales ni tratamientos de casa. En una enfermedad de declaración obligatoria eso se omite a propósito.</p>\n";
  } else if ((art.natural || []).length) {
    cuerpo += '<h2>Soluciones naturales de apoyo</h2>\n<aside class="enf-natural"><p><strong>Apoyo, no una cura.</strong> Lo de abajo no sustituye al veterinario y no promete curar.</p></aside>\n' + lista(art.natural);
  }
  cuerpo += "<h2>Cuándo ir al veterinario</h2>\n" + lista(art.veterinario);
  if (rel) cuerpo += "<h2>Fichas relacionadas</h2>\n<ul>\n" + rel + "</ul>\n";
  cuerpo += vecinos(art);
  cuerpo += '<aside class="enf-cta panel">\n<h2>Seguir aprendiendo</h2>\n<p>El curso gratis recorre el manejo del gallinero. El canal de YouTube es @GranjaRentable. Ninguno de los dos sustituye al veterinario.</p>\n<p class="enf-cta-acciones"><a class="btn gold" href="' + root + 'curso.html">Ir al curso</a> <a class="btn sec" href="https://www.youtube.com/@GranjaRentable">Ver el canal</a></p>\n</aside>\n';
  cuerpo += '<p class="enf-aviso">' + esc(data.aviso) + "</p>\n";
  cuerpo += "</article>\n";
  var main = migas([
    { href: root + "index.html", texto: "Inicio" },
    { href: root + "enfermedades.html", texto: "Enfermedades" },
    { href: "categoria/" + cat.id + ".html", texto: menuDe(cat) },
    { texto: art.titulo }
  ]) + zona(cat.id, "categoria/", cuerpo);
  return pagina({
    root: root,
    path: "/enfermedades/" + art.id + ".html",
    title: art.metaTitulo,
    description: art.metaDescripcion,
    article: true,
    schema: schemaArticulo(art),
    main: main,
    extra: '<script src="' + root + 'js/enfermedades.js"></script>\n'
  });
}

function tarjeta(art, href) {
  var cat = catDe(art.categoria);
  var sints = sintomasDe(art.id);
  var busca = [
    art.titulo, art.estado === "completo" ? art.resumen : "", cat.nombre, menuDe(cat),
    (art.etiquetas || []).map(etiNombre).join(" "),
    sints.map(function (s) { return s.texto; }).join(" ")
  ].join(" ");
  var tags = (art.etiquetas || []).map(function (e) { return '<li>' + esc(etiNombre(e)) + "</li>"; }).join("");
  var estado = art.estado === "borrador" ? " · Próximamente" : "";
  var obliga = art.declaracion ? " · Declaración obligatoria" : "";
  return '<article class="enf-card panel" data-enf="' + esc(art.id) + '" data-categoria="' + esc(art.categoria) + '" data-etiquetas="' + esc((art.etiquetas || []).join(" ")) + '" data-sintomas="' + esc(sints.map(function (s) { return s.id; }).join(" ")) + '" data-busca="' + esc(busca) + '">\n' +
    '<p class="enf-meta">' + esc(menuDe(cat)) + " · " + minutosDe(art) + " min" + estado + obliga + "</p>\n" +
    "<h3>" + (art.estado === "completo" ? "<a href=\"" + esc(href) + "\">" + esc(art.titulo) + "</a>" : esc(art.titulo)) + "</h3>\n" +
    "<p>" + (art.estado === "completo" ? esc(art.resumen) : "Se publicará cuando esté revisada.") + "</p>\n" +
    (tags ? '<ul class="badges">' + tags + "</ul>\n" : "") +
    "</article>\n";
}

function indice() {
  var sintomas = data.sintomas.map(function (s) {
    return '<button type="button" class="btn sec" data-sintoma="' + esc(s.id) + '"' + (s.oficial ? ' data-oficial="1"' : "") + ">" + esc(s.texto) + "</button>";
  }).join("\n");
  var etiquetas = data.etiquetas.map(function (e) {
    return '<button type="button" class="btn sec" data-etiqueta="' + esc(e.id) + '">' + esc(e.nombre) + "</button>";
  }).join("\n");
  var resultados = publicados().map(function (art) {
    return tarjeta(art, "enfermedades/" + art.id + ".html");
  }).join("");
  var cats = data.categorias.map(function (cat) {
    return '<a class="enf-cat" data-cat="' + esc(cat.id) + '" href="enfermedades/categoria/' + esc(cat.id) + '.html"><span class="enf-cat-ico">' + ICONOS[cat.id] + '</span><span><strong>' + esc(menuDe(cat)) + '</strong><span class="fine">' + esc(textoCuenta(cat.id)) + "</span></span></a>";
  }).join("\n");
  var schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Enfermedades de gallinas y pollos",
    description: "Zona para reconocer problemas frecuentes de gallinas y pollitos. No sustituye al veterinario.",
    inLanguage: "es",
    url: SITIO + "/enfermedades.html",
    isPartOf: { "@type": "WebSite", name: "Granja Rentable", url: SITIO + "/" }
  }, null, 2);
  var cuerpo = "";
  cuerpo += '<section class="panel enf-buscador" aria-labelledby="enf-que">\n<h2 id="enf-que">¿Qué le pasa a mi gallina?</h2>\n<p>Elige un signo o escribe una palabra. Salen las fichas que más se acercan. No es un diagnóstico.</p>\n<div class="enf-filtros" id="enf-sintomas">\n' + sintomas + '\n</div>\n<p id="enf-oficial" class="enf-oficial" hidden>Si ves muertes repentinas o muchas aves enfermas a la vez, avisa hoy a sanidad animal. No es un caso para remedios de casa. Las fichas de gripe aviar y Newcastle lo explican.</p>\n<label class="enf-label" for="enf-buscar">Buscar</label>\n<input id="enf-buscar" class="enf-buscar" type="search" placeholder="Cara hinchada, ácaro, pollito…" autocomplete="off">\n<div class="enf-filtros" id="enf-etiquetas">\n' + etiquetas + '\n</div>\n<p><button type="button" class="btn sec" id="enf-limpiar">Limpiar búsqueda</button> <span id="enf-cuenta" class="fine"></span></p>\n</section>\n';
  cuerpo += '<div id="enf-resultados" class="enf-grid" hidden>\n' + resultados + "</div>\n";
  cuerpo += "<h2>Las ocho categorías</h2>\n<p class=\"fine\">Cada una tiene su página. Tres fichas están redactadas: coriza, coccidiosis y ácaro rojo. El resto dice próximamente.</p>\n";
  cuerpo += '<div class="enf-cats">\n' + cats + "\n</div>\n";
  var main = migas([
    { href: "index.html", texto: "Inicio" },
    { texto: "Enfermedades" }
  ]);
  main += '<header class="page-hero">\n<p class="kicker">Zona de enfermedades</p>\n<h1>Enfermedades de gallinas y pollos</h1>\n<p>Empieza por el signo que ves y, si prefieres, entra por una categoría. Ante un ave enferma, llama al veterinario.</p>\n<p class="enf-aviso">' + esc(data.aviso) + "</p>\n</header>\n";
  main += zona("", "enfermedades/categoria/", cuerpo);
  return pagina({
    root: "",
    path: "/enfermedades.html",
    title: "Enfermedades de gallinas y pollos | Granja Rentable",
    description: "Zona orientativa de enfermedades de gallinas y pollitos. Busca por síntoma o entra en una de las ocho categorías. Sin dosis.",
    schema: schema,
    main: main,
    extra: '<script src="js/enfermedades.js"></script>\n'
  });
}

function paginaCategoria(cat) {
  var lista = deCategoria(cat.id);
  var listas = lista.filter(function (a) { return a.estado === "completo"; });
  var cuerpo = "";
  cuerpo += "<h1>" + esc(cat.nombre) + "</h1>\n";
  cuerpo += "<p>" + esc(cat.nota) + "</p>\n";
  cuerpo += '<p class="enf-aviso">' + esc(data.aviso) + "</p>\n";
  if (cat.id === "viricas") cuerpo += avisoGripe() + avisoNewcastle();
  if (!listas.length) cuerpo += "<p><strong>Próximamente.</strong> Las fichas de esta categoría todavía no están publicadas.</p>\n";
  cuerpo += '<div class="enf-grid">\n' + lista.map(function (art) {
    return tarjeta(art, "../" + art.id + ".html");
  }).join("") + "</div>\n";
  var main = migas([
    { href: "../../index.html", texto: "Inicio" },
    { href: "../../enfermedades.html", texto: "Enfermedades" },
    { texto: menuDe(cat) }
  ]) + zona(cat.id, "", cuerpo);
  return pagina({
    root: "../../",
    path: "/enfermedades/categoria/" + cat.id + ".html",
    title: menuDe(cat) + " | Enfermedades | Granja Rentable",
    description: descCategoria(cat, listas),
    schema: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: cat.nombre,
      description: cat.nota,
      inLanguage: "es",
      url: SITIO + "/enfermedades/categoria/" + cat.id + ".html",
      isPartOf: { "@type": "WebSite", name: "Granja Rentable", url: SITIO + "/" }
    }, null, 2),
    robots: listas.length ? "index,follow" : "noindex,follow",
    main: main,
    extra: '<script src="../../js/enfermedades.js"></script>\n'
  });
}

function esNoindex(rel) {
  var file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) return true;
  var html = fs.readFileSync(file, "utf8");
  var m = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i);
  return !!(m && /noindex/i.test(m[1]));
}

function sitemap() {
  var file = path.join(ROOT, "sitemap.xml");
  var xml = fs.readFileSync(file, "utf8");
  xml = xml.replace(/\s*<url>\s*<loc>https:\/\/granjarentable\.com\/enfermedades(?:\/[^<]*)?\.html<\/loc>[\s\S]*?<\/url>/g, "");
  xml = xml.replace(/\s*<url>\s*<loc>https:\/\/granjarentable\.com\/(?:preguntas|cuenta)\.html<\/loc>[\s\S]*?<\/url>/g, "");
  var lineas = ['<url><loc>https://granjarentable.com/enfermedades.html</loc></url>']
    .concat(data.categorias.filter(function (c) {
      return deCategoria(c.id).some(function (a) { return a.estado === "completo"; });
    }).map(function (c) {
      return "<url><loc>https://granjarentable.com/enfermedades/categoria/" + c.id + ".html</loc></url>";
    }))
    .concat(publicados().map(function (a) {
      return "<url><loc>https://granjarentable.com/enfermedades/" + a.id + ".html</loc></url>";
    }));
  lineas = lineas.filter(function (linea) {
    var m = linea.match(/<loc>([^<]+)<\/loc>/);
    if (!m) return false;
    var rel = m[1].replace("https://granjarentable.com/", "");
    if (esNoindex(rel)) {
      console.error("sitemap: se omite porque es noindex: " + m[1]);
      return false;
    }
    return true;
  });
  if (!lineas.length) throw new Error("sitemap: no quedó ninguna URL de enfermedades indexable.");
  xml = xml.replace("</urlset>", lineas.join("\n") + "\n</urlset>");
  if (/<loc>https:\/\/granjarentable\.com\/enfermedades\/(?:bronquitis|carencias|digestivas|gripe-aviar|huevo-retenido|lombrices|marek|micoplasma|newcastle|piojos|pododermatitis|pollitos|prolapso|sarna-patas)\.html<\/loc>/.test(xml)) {
    throw new Error("sitemap: una ficha noindex de enfermedades volvió a entrar.");
  }
  fs.writeFileSync(file, xml);
}

validar();
fs.mkdirSync(path.join(DIR, "categoria"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "enfermedades.html"), indice());
data.categorias.forEach(function (cat) {
  fs.writeFileSync(path.join(DIR, "categoria", cat.id + ".html"), paginaCategoria(cat));
});
data.articulos.forEach(function (art) {
  fs.writeFileSync(path.join(DIR, art.id + ".html"), ficha(art));
});
fs.writeFileSync(path.join(DIR, "index.html"), '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>Enfermedades de gallinas y pollos | Granja Rentable</title>\n<link rel="canonical" href="https://granjarentable.com/enfermedades.html">\n<meta name="robots" content="noindex">\n<meta http-equiv="refresh" content="0; url=../enfermedades.html">\n<script>location.replace("../enfermedades.html"+location.search+location.hash);</script>\n</head>\n<body>\n<p><a href="../enfermedades.html">Enfermedades de gallinas y pollos</a></p>\n</body>\n</html>\n');
sitemap();
console.log("fichas", data.articulos.length);
data.articulos.forEach(function (a) {
  console.log((a.estado === "completo" ? "OK " : "TODO ") + a.id + " " + minutosDe(a) + " min");
});
