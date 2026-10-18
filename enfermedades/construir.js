/* Genera enfermedades.html y enfermedades/<id>.html desde articulos.json.
   node enfermedades/construir.js
   No publica nada: solo escribe HTML estático. */
var fs = require("fs");
var path = require("path");

var DIR = __dirname;
var ROOT = path.join(DIR, "..");
var data = JSON.parse(fs.readFileSync(path.join(DIR, "articulos.json"), "utf8"));
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
    return '<figure class="enf-fig">\n<div class="enf-ph" role="img" aria-label="' + esc(img.alt) + '"><p class="enf-ph-kicker">Imagen pendiente</p><p>' + esc(img.alt) + "</p></div>\n<figcaption>Texto alternativo: " + esc(img.alt) + "<br>Crédito: " + esc(credito) + "</figcaption>\n</figure>\n";
  }).join("");
}

function avisoOficial() {
  return '<aside class="enf-oficial"><p><strong>Declaración obligatoria.</strong> Avisa hoy a los servicios veterinarios oficiales. En España, la oficina de sanidad animal de tu comunidad. En otros países, el servicio público de sanidad animal. No des remedios caseros, no muevas las aves a otra granja y no esperes a confirmarlo en casa.</p></aside>\n';
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
  return '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>' + esc(opts.title) + '</title>\n<meta name="description" content="' + esc(opts.description) + '">\n<link rel="canonical" href="' + esc(canon) + '">\n<meta name="robots" content="index,follow">\n<meta property="og:url" content="' + esc(canon) + '">\n<meta property="og:type" content="' + (opts.article ? "article" : "website") + '">\n<meta property="og:title" content="' + esc(opts.title) + '">\n<meta property="og:description" content="' + esc(opts.description) + '">\n<meta property="og:image" content="' + SITIO + '/img/logo.jpg">\n<meta property="og:locale" content="es_419">\n<meta property="og:image:alt" content="Logo de Granja Rentable">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="' + esc(opts.title) + '">\n<meta name="twitter:description" content="' + esc(opts.description) + '">\n<meta name="twitter:image" content="' + SITIO + '/img/logo.jpg">\n<meta name="theme-color" content="#1F5E2E">\n<link rel="icon" href="' + root + 'img/favicon.svg" type="image/svg+xml">\n<link rel="icon" href="' + root + 'img/favicon.png" sizes="64x64" type="image/png">\n<link rel="stylesheet" href="' + root + 'css/estilo.css">\n<script src="' + root + 'js/boot.js"></script>\n' + (opts.schema ? '<script type="application/ld+json">\n' + opts.schema + "\n</script>\n" : "") + "</head>\n";
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

function ficha(art) {
  var root = "../";
  var cat = catDe(art.categoria);
  var mins = minutosDe(art);
  var tags = (art.etiquetas || []).map(function (e) { return '<li>' + esc(etiNombre(e)) + "</li>"; }).join("");
  var rel = (art.relacionados || []).map(function (id) {
    var otro = porId(id);
    return '<li><a href="' + esc(id) + '.html">' + esc(otro.titulo) + "</a>" + (otro.estado === "borrador" ? " <span class=\"fine\">(borrador)</span>" : "") + "</li>";
  }).join("");
  var main = "";
  main += '<p class="kicker"><a href="../enfermedades.html">Enfermedades</a> · ' + esc(cat.nombre) + "</p>\n";
  main += "<h1>" + esc(art.titulo) + "</h1>\n";
  main += '<p class="enf-aviso">' + esc(data.aviso) + "</p>\n";
  if (art.declaracion) main += avisoOficial();
  if (art.estado === "borrador") main += '<p class="enf-todo"><strong>Borrador para revisar.</strong> ' + esc(art.todo) + "</p>\n";
  main += "<p>" + esc(art.resumen) + "</p>\n";
  main += '<p class="enf-meta">Lectura: ' + mins + " min · " + esc(art.actualizado) + "</p>\n";
  if (tags) main += '<ul class="badges">' + tags + "</ul>\n";
  main += anuncio("banner");
  main += '<article class="enf-lectura">\n';
  main += "<h2>Cómo reconocerla</h2>\n" + lista(art.reconocer) + figuras(art);
  main += "<h2>Cómo se contagia</h2>\n" + lista(art.contagio);
  main += "<h2>Cómo prevenirla</h2>\n" + lista(art.prevenir);
  if (art.declaracion) {
    main += "<h2>Sin remedios caseros</h2>\n" + avisoOficial();
    main += "<p>Esta ficha no trae soluciones naturales ni tratamientos de casa. En una enfermedad de declaración obligatoria eso se omite a propósito.</p>\n";
  } else if ((art.natural || []).length) {
    main += '<h2>Soluciones naturales de apoyo</h2>\n<aside class="enf-natural"><p><strong>Apoyo, no una cura.</strong> Lo de abajo no sustituye al veterinario y no promete curar.</p></aside>\n' + lista(art.natural);
  }
  main += "<h2>Cuándo ir al veterinario</h2>\n" + lista(art.veterinario);
  if (rel) main += "<h2>Fichas relacionadas</h2>\n<ul>\n" + rel + "</ul>\n";
  main += '<aside class="enf-cta panel">\n<h2>Seguir aprendiendo</h2>\n<p>El curso gratis recorre el manejo del gallinero. El canal de YouTube es @GranjaRentable. Ninguno de los dos sustituye al veterinario.</p>\n<p class="enf-cta-acciones"><a class="btn gold" href="' + root + 'curso.html">Ir al curso</a> <a class="btn sec" href="https://www.youtube.com/@GranjaRentable">Ver el canal</a></p>\n</aside>\n';
  main += '<p class="enf-aviso">' + esc(data.aviso) + "</p>\n";
  main += "</article>\n";
  return pagina({
    root: root,
    path: "/enfermedades/" + art.id + ".html",
    title: art.metaTitulo,
    description: art.metaDescripcion,
    article: true,
    schema: schemaArticulo(art),
    main: main
  });
}

function tarjeta(art) {
  var cat = catDe(art.categoria);
  var sints = sintomasDe(art.id);
  var busca = [
    art.titulo, art.resumen, cat.nombre, art.todo || "",
    (art.etiquetas || []).map(etiNombre).join(" "),
    sints.map(function (s) { return s.texto; }).join(" ")
  ].join(" ");
  var tags = (art.etiquetas || []).map(function (e) { return '<li>' + esc(etiNombre(e)) + "</li>"; }).join("");
  return '<article class="enf-card panel" data-enf="' + esc(art.id) + '" data-categoria="' + esc(art.categoria) + '" data-etiquetas="' + esc((art.etiquetas || []).join(" ")) + '" data-sintomas="' + esc(sints.map(function (s) { return s.id; }).join(" ")) + '" data-busca="' + esc(busca) + '">\n' +
    '<p class="enf-meta">' + esc(cat.nombre) + " · " + minutosDe(art) + " min" + (art.estado === "borrador" ? " · Borrador" : "") + (art.declaracion ? " · Declaración obligatoria" : "") + "</p>\n" +
    "<h3><a href=\"enfermedades/" + esc(art.id) + ".html\">" + esc(art.titulo) + "</a></h3>\n" +
    "<p>" + esc(art.resumen) + "</p>\n" +
    (tags ? '<ul class="badges">' + tags + "</ul>\n" : "") +
    "</article>\n";
}

function indice() {
  var bloques = data.categorias.map(function (cat) {
    var cards = data.articulos.filter(function (a) { return a.categoria === cat.id; }).map(tarjeta).join("");
    return '<section class="enf-bloque" data-cat-bloque="' + esc(cat.id) + '">\n<h2>' + esc(cat.nombre) + "</h2>\n<p class=\"fine\">" + esc(cat.nota) + "</p>\n<div class=\"enf-grid\">\n" + cards + "</div>\n</section>\n";
  }).join("");
  var sintomas = data.sintomas.map(function (s) {
    return '<button type="button" class="btn sec" data-sintoma="' + esc(s.id) + '"' + (s.oficial ? ' data-oficial="1"' : "") + ">" + esc(s.texto) + "</button>";
  }).join("\n");
  var etiquetas = data.etiquetas.map(function (e) {
    return '<button type="button" class="btn sec" data-etiqueta="' + esc(e.id) + '">' + esc(e.nombre) + "</button>";
  }).join("\n");
  var categorias = data.categorias.map(function (c) {
    return '<button type="button" class="btn sec" data-categoria="' + esc(c.id) + '">' + esc(c.nombre.replace(" de declaración obligatoria", "")) + "</button>";
  }).join("\n");
  var schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Enfermedades de gallinas y pollos",
    description: "Guía orientativa para reconocer problemas frecuentes de gallinas y pollitos. No sustituye al veterinario.",
    inLanguage: "es",
    url: SITIO + "/enfermedades.html",
    isPartOf: { "@type": "WebSite", name: "Granja Rentable", url: SITIO + "/" }
  }, null, 2);
  var main = "";
  main += '<section class="page-hero">\n<p class="kicker">Para aprender</p>\n<h1>Enfermedades de gallinas y pollos</h1>\n<p>Una guía por temas: respiratorias, víricas graves, parásitos, digestivas, carencias, puesta, patas y pollitos. Tres fichas están redactadas. El resto lleva TODO y espera la revisión del dueño.</p>\n<p class="enf-aviso">' + esc(data.aviso) + "</p>\n</section>\n";
  main += anuncio("banner");
  main += '<section class="panel enf-buscador" aria-labelledby="enf-que">\n<h2 id="enf-que">¿Qué le pasa a mi gallina?</h2>\n<p>Elige un signo. Te enseña las fichas que más se acercan. No es un diagnóstico.</p>\n<div class="enf-filtros" id="enf-sintomas">\n' + sintomas + '\n</div>\n<p id="enf-oficial" class="enf-oficial" hidden>Si ves muertes repentinas o muchas aves enfermas a la vez, avisa hoy a sanidad animal. No es un caso para remedios de casa. Las fichas de gripe aviar y Newcastle lo explican.</p>\n<label class="enf-label" for="enf-buscar">Buscar</label>\n<input id="enf-buscar" class="enf-buscar" type="search" placeholder="Cara hinchada, ácaro, pollito…" autocomplete="off">\n<div class="enf-filtros" id="enf-etiquetas">\n' + etiquetas + '\n</div>\n<div class="enf-filtros" id="enf-categorias">\n' + categorias + '\n</div>\n<p><button type="button" class="btn sec" id="enf-limpiar">Ver todas</button> <span id="enf-cuenta" class="fine"></span></p>\n</section>\n';
  main += bloques;
  return pagina({
    root: "",
    path: "/enfermedades.html",
    title: "Enfermedades de gallinas y pollos | Granja Rentable",
    description: "Guía orientativa de enfermedades de gallinas y pollitos: síntomas, prevención y cuándo ir al veterinario. Sin dosis. Gripe aviar y Newcastle se declaran.",
    schema: schema,
    main: main,
    extra: '<script src="js/enfermedades.js"></script>\n'
  });
}

function sitemap() {
  var file = path.join(ROOT, "sitemap.xml");
  var xml = fs.readFileSync(file, "utf8");
  xml = xml.replace(/\n<url><loc>https:\/\/granjarentable\.com\/enfermedades(?:\/[^<]*)?\.html<\/loc><\/url>/g, "");
  var urls = ['<url><loc>https://granjarentable.com/enfermedades.html</loc></url>']
    .concat(data.articulos.map(function (a) {
      return "<url><loc>https://granjarentable.com/enfermedades/" + a.id + ".html</loc></url>";
    })).join("\n");
  xml = xml.replace("</urlset>", urls + "\n</urlset>");
  fs.writeFileSync(file, xml);
}

validar();
fs.writeFileSync(path.join(ROOT, "enfermedades.html"), indice());
data.articulos.forEach(function (art) {
  fs.writeFileSync(path.join(DIR, art.id + ".html"), ficha(art));
});
fs.writeFileSync(path.join(DIR, "index.html"), '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>Enfermedades de gallinas y pollos | Granja Rentable</title>\n<link rel="canonical" href="https://granjarentable.com/enfermedades.html">\n<meta name="robots" content="noindex">\n<meta http-equiv="refresh" content="0; url=../enfermedades.html">\n<script>location.replace("../enfermedades.html"+location.search+location.hash);</script>\n</head>\n<body>\n<p><a href="../enfermedades.html">Enfermedades de gallinas y pollos</a></p>\n</body>\n</html>\n');
sitemap();
console.log("fichas", data.articulos.length);
data.articulos.forEach(function (a) {
  console.log((a.estado === "completo" ? "OK " : "TODO ") + a.id + " " + minutosDe(a) + " min");
});
