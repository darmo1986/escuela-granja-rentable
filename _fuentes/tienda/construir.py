# -*- coding: utf-8 -*-
"""Genera la tienda de afiliados de Amazon (HTML estático, sin precios).

Lee catalogo-origen.csv y escribe tienda/, tienda.html y el bloque del sitemap.
No publica la web. Uso: python3 _fuentes/tienda/construir.py
"""
import csv
import json
import re
import shutil
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from textos import CLAVES, NOMBRE_PUBLICO, SECCIONES  # noqa: E402
from pulir import AVISO_FICHA, AVISO_VET, EXCLUIR, FUSION, REDIR_FIJAS, VET_CATS, preparar, problemas_de_texto  # noqa: E402

SITIO = "https://granjarentable.com"
AVISO = ("Como afiliado de Amazon, Granja Rentable gana comisiones por compras que cumplan los requisitos. "
         "La compra se hace en Amazon, no en esta web.")
SOLO_SI_UNICOS = {"B092W338NC", "B0H5J3F9XD", "B0G6RSQ4XX", "B0DKN6TZB6"}
VERSION = "20261110d"


def esc(texto):
    return (str(texto)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;"))


def normalizar(texto):
    t = unicodedata.normalize("NFD", str(texto))
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", t).strip().lower()


def slugify(texto):
    t = normalizar(texto)
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:72].strip("-") or "producto"


def frases(texto):
    texto = re.sub(r"\s+", " ", (texto or "").strip())
    if not texto:
        return []
    return [p.strip() for p in re.split(r"(?<=[.!?])\s+", texto) if p.strip()]


def partir(texto):
    explicacion, recomendacion = [], []
    for frase in frases(texto):
        if recomendacion or re.match(r"^(La|Lo|Las|Los)\s+recomendamos\b", frase) or re.match(r"^(Ojo|Nota)\s*:", frase):
            recomendacion.append(frase)
        else:
            explicacion.append(frase)
    return explicacion, recomendacion


def nombre_cat(csv_nombre):
    return NOMBRE_PUBLICO.get(csv_nombre, csv_nombre)


def ld(obj):
    raw = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    return raw.replace("<", "\\u003c")


def bloque(html, inicio, fin):
    i = html.find(inicio)
    if i < 0:
        raise SystemExit(f"No encuentro {inicio}")
    j = html.find(fin, i)
    if j < 0:
        raise SystemExit(f"No cierra {inicio}")
    return html[i:j + len(fin)]


def raiz_de(rel):
    return "../" * rel.count("/")


def prefijar(html, raiz):
    def una(m):
        url = m.group(1)
        if url.startswith(("http://", "https://", "mailto:", "#", "tel:")):
            return m.group(0)
        return f'href="{raiz}{url}"'
    return re.sub(r'href="([^"]*)"', una, html)


def menu_de(raiz):
    menu = (RAIZ / "blog" / "plantillas" / "menu.html").read_text(encoding="utf-8")
    menu = menu.replace("@@RAIZ@@", raiz).replace(' aria-current="page"', "")
    return menu.replace('data-nav="tienda"', 'data-nav="tienda" aria-current="page"', 1).strip("\n")


def pie_de(raiz):
    pie = (RAIZ / "blog" / "plantillas" / "pie-sitio.html").read_text(encoding="utf-8")
    return pie.replace("@@RAIZ@@", raiz).strip("\n")


def banner_ebooks(raiz):
    """La tienda ya no vende ebooks. Un enlace lleva a /ebooks/."""
    return f'<aside class="t-ebooks-banner">\n<a href="{raiz}ebooks/">Nuestros ebooks a 3 USD →</a>\n</aside>'


def stripe_js():
    src = (RAIZ / "ebooks" / "index.html").read_text(encoding="utf-8")
    m = re.search(r"<script>\s*\(function \(\) \{[\s\S]*?data-stripe-ebook[\s\S]*?</script>", src)
    if not m:
        raise SystemExit("No encuentro el script de Stripe de los ebooks")
    return m.group(0)


def cargar():
    ruta = Path(__file__).resolve().parent / "catalogo-origen.csv"
    with ruta.open(newline="", encoding="utf-8") as fh:
        filas = list(csv.DictReader(fh))
    if len(filas) != 171:
        raise SystemExit(f"El CSV tiene {len(filas)} filas, no 171")
    por_cat = defaultdict(list)
    for fila in filas:
        por_cat[fila["categoria"].strip()].append(fila)
    quedan, excluidos = [], []
    for fila in filas:
        asin = fila["ASIN"].strip()
        cat = fila["categoria"].strip()
        if asin in EXCLUIR:
            excluidos.append({
                "asin": asin,
                "categoria": cat,
                "motivo": f"duplicado de {EXCLUIR[asin]}: mismas estrellas y reseñas; se queda el otro",
            })
            continue
        if asin in SOLO_SI_UNICOS and len(por_cat[cat]) != 1:
            excluidos.append({
                "asin": asin,
                "categoria": cat,
                "motivo": "4,2 estrellas y no es el único de su categoría",
            })
            continue
        if "tag=granjarentabl-20" not in fila["url_afiliado"] or "amazon.com" not in fila["url_afiliado"]:
            raise SystemExit(f"Enlace de afiliado raro en {asin}")
        quedan.append(fila)
    return quedan, excluidos, por_cat


def armar(filas):
    secciones = {cat: (sid, titulo) for sid, titulo, cats in SECCIONES for cat in cats}
    if set(secciones) != set(CLAVES):
        raise SystemExit("SECCIONES y CLAVES no cubren las mismas categorías")
    for origen, destino in FUSION.items():
        if destino not in secciones:
            raise SystemExit(f"La fusión {origen} → {destino} no existe")
    productos = []
    slugs = {}
    fallos = []
    for fila in filas:
        asin = fila["ASIN"].strip()
        origen = fila["categoria"].strip()
        cat_csv = FUSION.get(origen, origen)
        if cat_csv not in secciones:
            raise SystemExit(f"Categoría sin sección: {cat_csv}")
        cat = nombre_cat(cat_csv)
        texto = preparar(fila)
        vet = texto["vet"] or cat_csv in VET_CATS
        explicacion = sin_valoracion(texto["explicacion"])
        recomendacion = sin_valoracion(texto["recomendacion"])
        fallos.extend(problemas_de_texto(
            asin, texto["titulo"], explicacion, recomendacion, vet))
        base = slugify(texto["titulo"])
        slug = base
        n = 2
        while slug in slugs:
            slug = f"{base}-{n}"
            n += 1
        slugs[slug] = asin
        sid, seccion = secciones[cat_csv]
        productos.append({
            "asin": asin,
            "slug": slug,
            "titulo": texto["titulo"],
            "nombre": re.sub(r"\s+", " ", fila["nombre"]).strip(),
            "categoria_csv": cat_csv,
            "categoria_origen": origen,
            "categoria": cat,
            "categoria_slug": slugify(cat),
            "seccion_id": sid,
            "seccion": seccion,
            "url": fila["url_afiliado"].strip(),
            "explicacion": explicacion,
            "recomendacion": recomendacion,
            "imagen": texto.get("imagen") or "",
            "origen": texto["origen"],
            "claves": (CLAVES[cat_csv] + " " + CLAVES.get(origen, "")).strip(),
            "unico_42": asin in SOLO_SI_UNICOS,
            "vet": vet,
            "aviso_vet": vet or asin in AVISO_FICHA,
        })
    if fallos:
        raise SystemExit("\n".join(fallos[:40]))
    productos.sort(key=lambda p: p["titulo"].casefold())
    return productos


_CITA_VALORACION = re.compile(r"estrella|reseñ|valorad|valoraci|★", re.I)


def sin_valoracion(frases):
    return [f for f in frases if f and not _CITA_VALORACION.search(f)]


def seccion_texto(atributo, titulo, frases):
    if not frases:
        return ""
    return (
        f'<section class="t-bloque" {atributo}>\n'
        f"<h2>{esc(titulo)}</h2>\n"
        f"{ps(frases)}\n"
        f"</section>"
    )


def boton_amazon(p):
    return (
        f'<a class="btn gold t-amazon" href="{esc(p["url"])}" rel="sponsored nofollow noopener" target="_blank">'
        f'Ver precio en Amazon<span class="sr"> (se abre en Amazon)</span></a>'
    )


def boton_resenas(p):
    href = f"https://www.amazon.com/dp/{p['asin']}?tag=granjarentabl-20"
    return (
        f'<a class="btn sec t-resenas" href="{esc(href)}" rel="sponsored nofollow noopener" target="_blank">'
        f'Ver las reseñas en Amazon<span class="sr"> (se abre en Amazon)</span></a>'
    )


def botones_amazon(p):
    return f'<div class="t-acciones">\n{boton_amazon(p)}\n{boton_resenas(p)}\n</div>'


def html_descripcion_larga(texto):
    """Pinta ## y ### si hay texto. Vacío no añade nada a la página."""
    texto = (texto or "").strip()
    if not texto:
        return ""
    bloques = []
    parrafo = []

    def volcar():
        if parrafo:
            bloques.append("<p>" + esc(" ".join(parrafo)) + "</p>")
            parrafo.clear()

    for linea in texto.splitlines():
        linea = linea.strip()
        if linea.startswith("### "):
            volcar()
            bloques.append(f"<h3>{esc(linea[4:].strip())}</h3>")
        elif linea.startswith("## "):
            volcar()
            bloques.append(f"<h2>{esc(linea[3:].strip())}</h2>")
        elif not linea:
            volcar()
        else:
            parrafo.append(linea)
    volcar()
    if not bloques:
        return ""
    return '<section class="t-larga" data-descripcion-larga>\n' + "\n".join(bloques) + "\n</section>"


def ps(frases_lista):
    return "\n".join(f"<p>{esc(f)}</p>" for f in frases_lista)


def data_q(p):
    blob = " ".join([
        p["titulo"], p["categoria"], p["seccion"], p["nombre"], p["claves"], p["asin"],
        " ".join(p["explicacion"]), " ".join(p["recomendacion"]),
    ])
    return esc(normalizar(blob))


def figura_imagen(p, raiz):
    if not p.get("imagen"):
        return ""
    return (
        f'<figure class="t-foto"><img src="{raiz}{esc(p["imagen"])}" '
        f'alt="{esc(p["titulo"])}" loading="lazy">'
        f"<figcaption>Ilustración generada con IA</figcaption></figure>"
    )


def tarjeta(p, raiz, nivel):
    href = f"{raiz}tienda/p/{p['slug']}/"
    cat_href = f"{raiz}tienda/c/{p['categoria_slug']}/"
    foto = figura_imagen(p, raiz)
    foto = f"{foto}\n" if foto else ""
    return f'''<article class="t-card" data-t-card data-cat="{esc(p["categoria_slug"])}" data-sec="{esc(p["seccion_id"])}" data-q="{data_q(p)}">
<div class="t-marca"><span>{esc(p["categoria"])}</span></div>
{foto}<{nivel}><a href="{href}">{esc(p["titulo"])}</a></{nivel}>
{f'<p class="t-por-que">{esc(" ".join(p["recomendacion"]))}</p>' if p["recomendacion"] else ""}
{botones_amazon(p)}
<p><a href="{cat_href}">{esc(p["categoria"])}</a></p>
</article>'''


def migas(items):
    datos = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i, "name": nombre, "item": url}
            for i, (nombre, url) in enumerate(items, start=1)
        ],
    }
    return datos


def lista(nombre, productos):
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": nombre,
        "numberOfItems": len(productos),
        "itemListElement": [
            {"@type": "ListItem", "position": i, "name": p["titulo"],
             "url": f"{SITIO}/tienda/p/{p['slug']}/"}
            for i, p in enumerate(productos, start=1)
        ],
    }


def pagina(rel, titulo, descripcion, canonical, cuerpo, datos_ld, con_stripe=False):
    raiz = raiz_de(rel)
    index_html = (RAIZ / "index.html").read_text(encoding="utf-8")
    pais = bloque(index_html, '<label class="pais-bar">', "</label>")
    acciones = prefijar(bloque(index_html, '<div class="top-actions">', "</div>"), raiz)
    wa = prefijar(bloque(index_html, '<a class="wa-float"', "</a>"), raiz)
    scripts_ld = "\n".join(
        f'<script type="application/ld+json">{ld(obj)}</script>' for obj in datos_ld
    )
    stripe = stripe_js() + "\n" if con_stripe else ""
    # /tienda/ sigue recibiendo anclas y vueltas de pago de los ebooks.
    redir_ebooks = ""
    if rel == "tienda/index.html":
        redir_ebooks = """<script>
(function () {
  var q = location.search;
  var h = location.hash;
  var ids = {"#ebooks":"","#pienso-hacer":"#pienso-hacer","#pienso-elegir":"#pienso-elegir","#guia-empezar":"#guia-empezar","#alimenta-ponedoras":"#alimenta-ponedoras","#gallinas":"#gallinas"};
  var pago = /(?:^|[?&])stripe_(?:session|cancelado)=/.test(q);
  if (pago || Object.prototype.hasOwnProperty.call(ids, h)) location.replace("/ebooks/" + q + (ids[h] || ""));
})();
</script>
"""
    html = f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(titulo)}</title>
<meta name="description" content="{esc(descripcion)}">
<link rel="canonical" href="{esc(canonical)}">
{redir_ebooks}<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:title" content="{esc(titulo)}">
<meta property="og:description" content="{esc(descripcion)}">
<meta property="og:url" content="{esc(canonical)}">
<meta property="og:image" content="{SITIO}/img/logo.jpg">
<meta property="og:locale" content="es_419">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(titulo)}">
<meta name="twitter:description" content="{esc(descripcion)}">
<meta name="twitter:image" content="{SITIO}/img/logo.jpg">
<meta name="theme-color" content="#1F5E2E">
<link rel="icon" href="{raiz}favicon.ico">
<link rel="icon" href="{raiz}img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="{raiz}img/favicon.png" sizes="64x64" type="image/png">
<link rel="stylesheet" href="{raiz}css/estilo.css?v=20261110d">
<link rel="stylesheet" href="{raiz}tienda/tienda.css?v={VERSION}">
<script src="{raiz}js/boot.js?v=20261110d"></script>
{scripts_ld}
</head>
<body data-root="{raiz}">
<a class="skip" href="#contenido">Saltar al contenido</a>
<header class="top">
<div class="bar wrap">
<a class="brand" href="{raiz}index.html"><span class="brand-mark"><img class="logo-for-dark" src="{raiz}img/logo-claro.svg" alt="" width="44" height="44"><img class="logo-for-light" src="{raiz}img/logo-oscuro.svg" alt="" width="44" height="44"></span><span class="brand-name">Granja Rentable</span></a>
{acciones}
{pais}
<nav id="site-nav" class="nav" aria-label="Principal">
{menu_de(raiz)}
</nav>
</div>
</header>
<p id="ref-note" class="ref-note" hidden></p>
<main id="contenido">
{cuerpo}
</main>
{stripe}<footer class="foot">
<div class="wrap foot-grid">
<div>
<p class="foot-brand">Granja Rentable</p>
<p>Juan Pablo González García<br>NIF 78701119H<br>Calle Juan Rumeu García 6 bajo<br>38008 Santa Cruz de Tenerife, España</p>
<p><!--email_off--><a href="mailto:ventas@granjarentable.com">ventas@granjarentable.com</a><!--/email_off--></p>
</div>
<div>
<p class="foot-brand">Sitio</p>
{pie_de(raiz)}
</div>
<div>
<p class="foot-brand">Ayuda y legal</p>
<ul>
<li><a data-social="whatsapp" href="https://wa.me/34656267726?text=Hola%2C%20escribo%20desde%20el%20sitio%20de%20Granja%20Rentable">WhatsApp +34 656 267 726</a></li>
<li><a data-social="youtube" href="https://www.youtube.com/@GranjaRentable">YouTube</a></li>
<li><a data-social="facebook" href="https://www.facebook.com/GranjaRentable">Facebook</a></li>
<li><a href="{raiz}aviso-legal.html">Aviso legal</a></li>
<li><a href="{raiz}privacidad.html">Privacidad</a></li>
<li><a href="{raiz}cookies.html">Cookies</a></li>
<li><a href="{raiz}condiciones-venta.html">Condiciones de venta</a></li>
<li><a href="{raiz}afiliados-condiciones.html">Condiciones de afiliados</a></li>
<li><a href="#" data-cookie-config>Configurar cookies</a></li>
</ul>
</div>
</div>
<p class="copy wrap">© 2026 Granja Rentable.</p>
</footer>
{wa}
<script src="{raiz}js/config.js?v=20261110d"></script>
<script src="{raiz}js/catalogo.js"></script>
<script src="{raiz}js/app.js?v=20261110d"></script>
<script src="{raiz}js/site.js?v=20261110d"></script>
<script defer src="{raiz}tienda/tienda.js?v={VERSION}"></script>
</body>
</html>
'''
    destino = RAIZ / rel
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(html, encoding="utf-8")


def recortar(texto, limite=158):
    texto = re.sub(r"\s+", " ", texto).strip()
    if len(texto) <= limite:
        return texto
    return texto[:limite].rsplit(" ", 1)[0].rstrip(".,;") + "…"


def cuerpo_portada(productos, raiz):
    chips = ['<button type="button" class="t-chip" data-t-filtro="todas" aria-pressed="true">Todas</button>']
    por_sec = defaultdict(list)
    for p in productos:
        por_sec[p["seccion_id"]].append(p)
    cats_orden = []
    for sid, titulo, cats in SECCIONES:
        vistos = []
        for cat_csv in cats:
            grupo = [p for p in por_sec[sid] if p["categoria_csv"] == cat_csv]
            if not grupo:
                continue
            vistos.append((cat_csv, grupo))
            cat = nombre_cat(cat_csv)
            chips.append(
                f'<button type="button" class="t-chip" data-t-filtro="{esc(slugify(cat))}" aria-pressed="false">{esc(cat)} ({len(grupo)})</button>'
            )
        cats_orden.append((sid, titulo, vistos))
    bloques = []
    for sid, titulo, grupos in cats_orden:
        if not grupos:
            continue
        partes = [f'<section class="t-seccion" id="{esc(sid)}" data-t-bloque>', f"<h2>{esc(titulo)}</h2>"]
        for cat_csv, grupo in grupos:
            cat = nombre_cat(cat_csv)
            cslug = slugify(cat)
            cards = "\n".join(tarjeta(p, raiz, "h3") for p in grupo)
            partes.append(
                f'''<section class="t-cat" id="c-{esc(cslug)}" data-t-bloque>
<h3><a href="{raiz}tienda/c/{cslug}/">{esc(cat)}</a></h3>
<div class="t-grid">
{cards}
</div>
</section>'''
            )
        partes.append("</section>")
        bloques.append("\n".join(partes))
    return f'''<p class="crumb"><a href="{raiz}index.html">Inicio</a> · Tienda</p>
<header class="t-hero">
<p class="kicker">Tienda</p>
<h1>Tienda de Granja Rentable</h1>
<p class="t-lead">Material de avicultura enlazado a Amazon. No hay carrito: el botón abre Amazon.</p>
<p class="t-aviso"><strong>{esc(AVISO)}</strong></p>
</header>
{banner_ebooks(raiz)}
<section id="amazon" aria-labelledby="amazon-titulo">
<h2 id="amazon-titulo">Material en Amazon</h2>
<p class="t-nota">No publicamos el precio: cambia y Amazon pide verlo en su ficha.</p>
<div class="t-filtros">
<div class="t-buscar">
<label class="t-buscar-etq" for="t-buscar">Buscar</label>
<input id="t-buscar" data-t-buscar type="search" placeholder="Nombre, categoría o palabra clave" autocomplete="off">
</div>
<div class="t-chips" role="group" aria-label="Filtrar por categoría">
{"".join(chips)}
</div>
<p class="t-cuenta" data-t-cuenta aria-live="polite">{len(productos)} productos</p>
</div>
<p class="t-vacio" data-t-vacio hidden>Ningún producto coincide con esa búsqueda.</p>
{"".join(bloques)}
</section>'''


def cuerpo_categoria(cat, grupo, productos, raiz):
    otros = []
    for sid, _titulo, cats in SECCIONES:
        if sid != grupo[0]["seccion_id"]:
            continue
        for cat_csv in cats:
            nombre = nombre_cat(cat_csv)
            if nombre == cat:
                otros.append(f'<a class="t-chip" href="{raiz}tienda/c/{slugify(nombre)}/" aria-current="page">{esc(nombre)}</a>')
            elif any(p["categoria_csv"] == cat_csv for p in productos):
                otros.append(f'<a class="t-chip" href="{raiz}tienda/c/{slugify(nombre)}/">{esc(nombre)}</a>')
    cards = "\n".join(tarjeta(p, raiz, "h2") for p in grupo)
    aviso_cat = f'<p class="t-vet">{esc(AVISO_VET)}</p>' if cat in VET_CATS or cat == "Pienso" else ""
    return f'''<p class="crumb"><a href="{raiz}index.html">Inicio</a> · <a href="{raiz}tienda/">Tienda</a> · {esc(cat)}</p>
<header class="t-hero">
<p class="kicker">Tienda</p>
<h1>{esc(cat)}</h1>
<p class="t-lead">{len(grupo)} productos. El precio se ve en Amazon.</p>
<p class="t-aviso"><strong>{esc(AVISO)}</strong></p>
{aviso_cat}
<p><a class="btn sec" href="{raiz}tienda/">Ver toda la tienda</a> <a class="btn sec" href="{raiz}ebooks/">Ebooks a 3,00 USD</a></p>
</header>
<div class="t-filtros">
<div class="t-buscar">
<label class="t-buscar-etq" for="t-buscar">Buscar en {esc(cat)}</label>
<input id="t-buscar" data-t-buscar type="search" placeholder="Nombre o palabra clave" autocomplete="off">
</div>
<div class="t-chips" aria-label="Categorías de esta sección">
{"".join(otros)}
</div>
<p class="t-cuenta" data-t-cuenta aria-live="polite">{len(grupo)} productos</p>
</div>
<p class="t-vacio" data-t-vacio hidden>Ningún producto de esta categoría coincide.</p>
<div class="t-grid" data-t-bloque>
{cards}
</div>'''


def guia_bebederos(p, raiz):
    """Conserva el recorrido del piloto al regenerar sus tres fichas."""
    if p["asin"] not in {"B016AFYT4Q", "B07RB7GLJH", "B00P9EJLSO"}:
        return ""
    return f'''<section class="t-bloque" data-guia-bebederos>
<h2>Antes de elegir tu bebedero</h2>
<p>Revisa el suministro y la limpieza en la <a href="{raiz}blog/agua-gallinas-ponedoras-bebederos.html">guía de agua y bebederos para gallinas</a>.
Para contrastar formatos y capacidades, consulta la <a href="{raiz}comparativas/comparativa-bebederos-tetina-vs-colgante.html">comparativa de tetinas, copas y bebederos colgantes</a>.</p>
</section>'''


def cuerpo_producto(p, vecinos, raiz):
    cat_href = f"{raiz}tienda/c/{p['categoria_slug']}/"
    relacionados = "\n".join(
        f'<li><a href="{raiz}tienda/p/{v["slug"]}/">{esc(v["titulo"])}</a></li>' for v in vecinos
    )
    extra = f'''<section class="t-bloque"><h2>También en {esc(p["categoria"])}</h2>
<ul class="t-relacionados">{relacionados}</ul></section>''' if relacionados else ""
    aviso = f'<p class="t-vet">{esc(AVISO_VET)}</p>' if p.get("aviso_vet") else ""
    titulo_que = "Qué es" if p["vet"] else "Qué es y para qué sirve"
    foto = figura_imagen(p, raiz)
    foto = f"{foto}\n" if foto else ""
    return f'''<p class="crumb"><a href="{raiz}index.html">Inicio</a> · <a href="{raiz}tienda/">Tienda</a> · <a href="{cat_href}">{esc(p["categoria"])}</a> · {esc(p["titulo"])}</p>
<article class="t-ficha">
<p class="kicker">{esc(p["categoria"])}</p>
<h1>{esc(p["titulo"])}</h1>
{foto}<div class="t-marca"><span>{esc(p["categoria"])}</span></div>
{aviso}
{seccion_texto("data-explicacion", titulo_que, p["explicacion"])}
{seccion_texto("data-recomendacion", "Por qué lo recomendamos", p["recomendacion"])}
{html_descripcion_larga(p.get("descripcion_larga"))}
{guia_bebederos(p, raiz)}
<section class="t-compra">
<p class="t-aviso"><strong>{esc(AVISO)}</strong></p>
{botones_amazon(p)}
</section>
<p><a href="{cat_href}">Más productos de {esc(p["categoria"])}</a></p>
<p><a href="{raiz}ebooks/">Ebooks de Granja Rentable, a 3,00 USD</a>. Esos sí se pagan en esta web.</p>
{extra}
</article>'''


def meta_producto(p):
    return recortar(" ".join(p["explicacion"][:2]) + " Precio en Amazon, no en esta web.")


def pagina_movida(rel, href, texto):
    html = f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tienda | Granja Rentable</title>
<meta name="robots" content="noindex,follow">
<link rel="canonical" href="{SITIO}{href}">
<meta http-equiv="refresh" content="0;url={href}">
</head>
<body>
<p>Esta página se ha movido a <a href="{href}">{esc(texto)}</a>.</p>
</body>
</html>
'''
    destino = RAIZ / rel
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(html, encoding="utf-8")


def pagina_redirect_tienda():
    """/tienda.html es el duplicado antiguo. Manda a /tienda/ o, si el ancla era un ebook, a /ebooks/."""
    html = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="favicon.ico">
<title>Tienda · Granja Rentable</title>
<meta name="robots" content="noindex,follow">
<link rel="canonical" href="https://granjarentable.com/tienda/">
<script>
(function () {
  var q = location.search;
  var h = location.hash;
  var ids = {"#ebooks":"","#pienso-hacer":"#pienso-hacer","#pienso-elegir":"#pienso-elegir","#guia-empezar":"#guia-empezar","#alimenta-ponedoras":"#alimenta-ponedoras","#gallinas":"#gallinas"};
  var pago = /(?:^|[?&])stripe_(?:session|cancelado)=/.test(q);
  if (pago || Object.prototype.hasOwnProperty.call(ids, h)) location.replace("/ebooks/" + q + (ids[h] || ""));
  else location.replace("/tienda/" + q + h);
})();
</script>
<meta http-equiv="refresh" content="0;url=/tienda/">
</head>
<body>
<p>La tienda está en <a href="/tienda/">/tienda/</a>. Los ebooks, en <a href="/ebooks/">/ebooks/</a>.</p>
</body>
</html>
"""
    (RAIZ / "tienda.html").write_text(html, encoding="utf-8")


def escribir(productos):
    viejos = {}
    largas = {}
    ruta_cat = RAIZ / "tienda" / "catalogo.json"
    if ruta_cat.is_file():
        datos_previos = json.loads(ruta_cat.read_text(encoding="utf-8"))
        viejos = {item["asin"]: item["slug"] for item in datos_previos}
        for item in datos_previos:
            texto = item.get("descripcion_larga")
            if isinstance(texto, str) and texto.strip():
                largas[item["asin"]] = texto.strip()
    for p in productos:
        p["descripcion_larga"] = largas.get(p["asin"], "")
    viejo = RAIZ / "tienda" / "p"
    if viejo.exists():
        shutil.rmtree(viejo)
    por_cat = defaultdict(list)
    for p in productos:
        por_cat[p["categoria"]].append(p)
    visual = []
    for _sid, _titulo, cats in SECCIONES:
        for cat_csv in cats:
            visual.extend(p for p in productos if p["categoria_csv"] == cat_csv)
    portada = cuerpo_portada(visual, "../")
    titulo = "Tienda de avicultura | Granja Rentable"
    descripcion = recortar(
        "Material de avicultura enlazado a Amazon. La compra se hace en Amazon, no en esta web."
    )
    canon = f"{SITIO}/tienda/"
    datos = [
        migas([("Inicio", SITIO + "/"), ("Tienda", canon)]),
        lista("Tienda de Granja Rentable", visual),
    ]
    pagina("tienda/index.html", titulo, descripcion, canon, portada, datos, con_stripe=False)
    pagina_redirect_tienda()
    for cat, grupo in por_cat.items():
        cslug = grupo[0]["categoria_slug"]
        curl = f"{SITIO}/tienda/c/{cslug}/"
        ctitulo = f"{cat} | Tienda | Granja Rentable"
        cdesc = recortar(
            f"{cat}: {len(grupo)} productos de avicultura enlazados a Amazon. "
            "El precio se ve en Amazon, no en esta web."
        )
        datos_c = [
            migas([("Inicio", SITIO + "/"), ("Tienda", canon), (cat, curl)]),
            lista(cat, grupo),
        ]
        pagina(
            f"tienda/c/{cslug}/index.html", ctitulo, cdesc, curl,
            cuerpo_categoria(cat, grupo, productos, "../../../"), datos_c,
        )
    for p in productos:
        purl = f"{SITIO}/tienda/p/{p['slug']}/"
        vecinos = [v for v in por_cat[p["categoria"]] if v["asin"] != p["asin"]][:4]
        datos_p = [migas([
            ("Inicio", SITIO + "/"),
            ("Tienda", canon),
            (p["categoria"], f"{SITIO}/tienda/c/{p['categoria_slug']}/"),
            (p["titulo"], purl),
        ])]
        pagina(
            f"tienda/p/{p['slug']}/index.html",
            f"{p['titulo']} | Tienda | Granja Rentable",
            meta_producto(p),
            purl,
            cuerpo_producto(p, vecinos, "../../../"),
            datos_p,
        )
    por_asin = {p["asin"]: p for p in productos}
    for asin, slug_viejo in viejos.items():
        if asin in EXCLUIR:
            queda = EXCLUIR[asin]
            if queda in por_asin:
                href = f"/tienda/p/{por_asin[queda]['slug']}/"
                texto = por_asin[queda]["titulo"]
                if slug_viejo == por_asin[queda]["slug"]:
                    continue
            else:
                href = "/tienda/"
                texto = "la tienda"
            pagina_movida(f"tienda/p/{slug_viejo}/index.html", href, texto)
        elif asin in por_asin and slug_viejo != por_asin[asin]["slug"]:
            pagina_movida(
                f"tienda/p/{slug_viejo}/index.html",
                f"/tienda/p/{por_asin[asin]['slug']}/",
                por_asin[asin]["titulo"],
            )
    for origen, destino in FUSION.items():
        slug_viejo = slugify(nombre_cat(origen))
        slug_nuevo = slugify(nombre_cat(destino))
        if slug_viejo != slug_nuevo:
            pagina_movida(
                f"tienda/c/{slug_viejo}/index.html",
                f"/tienda/c/{slug_nuevo}/",
                nombre_cat(destino),
            )
    for slug_viejo, href in REDIR_FIJAS.items():
        if f"tienda/p/{slug_viejo}/" == href:
            continue
        pagina_movida(f"tienda/p/{slug_viejo}/index.html", href, "la ficha nueva")
    (RAIZ / "tienda" / "producto.html").write_text(
        """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Tienda | Granja Rentable</title>
<meta name="robots" content="noindex,follow">
<link rel="canonical" href="https://granjarentable.com/tienda/">
<meta http-equiv="refresh" content="0;url=/tienda/">
</head>
<body>
<p>La tienda está en <a href="/tienda/">/tienda/</a>.</p>
</body>
</html>
""",
        encoding="utf-8",
    )
    publico = []
    for p in productos:
        item = {
            "asin": p["asin"],
            "slug": p["slug"],
            "titulo": p["titulo"],
            "categoria": p["categoria"],
            "categoria_slug": p["categoria_slug"],
            "seccion": p["seccion"],
            "descripcion_larga": p.get("descripcion_larga") or "",
            "url_afiliado": p["url"],
            "explicacion": p["explicacion"],
            "recomendacion": p["recomendacion"],
            "claves": p["claves"].split(),
        }
        if p.get("imagen"):
            item["imagen"] = p["imagen"]
        publico.append(item)
    (RAIZ / "tienda" / "catalogo.json").write_text(
        json.dumps(publico, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    urls = [canon]
    for cat, grupo in sorted(por_cat.items(), key=lambda kv: kv[0]):
        urls.append(f"{SITIO}/tienda/c/{grupo[0]['categoria_slug']}/")
    for p in sorted(productos, key=lambda x: x["slug"]):
        urls.append(f"{SITIO}/tienda/p/{p['slug']}/")
    ruta = RAIZ / "sitemap.xml"
    texto = ruta.read_text(encoding="utf-8")
    bloque_sm = "<!-- tienda-afiliados:inicio -->\n" + "\n".join(
        f"<url><loc>{u}</loc><lastmod>2026-11-10</lastmod></url>" for u in urls
    ) + "\n<!-- tienda-afiliados:fin -->"
    if "<!-- tienda-afiliados:inicio -->" in texto:
        texto = re.sub(
            r"<!-- tienda-afiliados:inicio -->.*?<!-- tienda-afiliados:fin -->",
            bloque_sm, texto, count=1, flags=re.S)
    else:
        texto = texto.replace("</urlset>", bloque_sm + "\n</urlset>")
    ruta.write_text(texto, encoding="utf-8")
    return urls


def comprobar(productos, urls, precios_decimales):
    errores = []
    paginas = [RAIZ / "tienda.html", RAIZ / "tienda" / "index.html"]
    paginas += list((RAIZ / "tienda" / "c").glob("*/index.html"))
    paginas += list((RAIZ / "tienda" / "p").glob("*/index.html"))
    asins = {p["asin"] for p in productos}
    vistos = set()
    for archivo in paginas:
        html = archivo.read_text(encoding="utf-8")
        rel = archivo.relative_to(RAIZ).as_posix()
        if "aggregateRating" in html or "adsterra" in html.lower() or "adsense" in html.lower():
            errores.append(f"{rel}: schema o anuncio no permitido")
        if re.search(r"trustap|aliexpress", html, re.I) or "carrito.js" in html:
            errores.append(f"{rel}: queda rastro de la tienda física")
        for precio in precios_decimales:
            if precio and precio in html:
                errores.append(f"{rel}: aparece el precio {precio}")
        for bloque_ld in re.findall(r'<script type="application/ld\+json">(.*?)</script>', html):
            datos = json.loads(bloque_ld)

            def walk(o):
                if isinstance(o, dict):
                    for k, v in o.items():
                        if k.lower() in {"aggregaterating", "offers", "price", "pricecurrency"}:
                            errores.append(f"{rel}: schema con {k}")
                        walk(v)
                elif isinstance(o, list):
                    for item in o:
                        walk(item)
            walk(datos)
        if 'content="noindex' in html:
            if 'rel="canonical"' not in html or 'http-equiv="refresh"' not in html:
                errores.append(f"{rel}: la redirección no tiene canónica")
            continue
        if 'content="index,follow"' not in html:
            errores.append(f"{rel}: no es indexable")
        if "Como afiliado de Amazon, Granja Rentable gana comisiones por compras que cumplan los requisitos" not in html:
            errores.append(f"{rel}: falta el aviso de afiliado")
        baja = html.lower()
        for frase in (
            "antes de publicar", "conviene revisar", "cambió de vendedor",
            "sin afirmar un resultado", "como indica el nombre",
            "el nombre lo describe", "en la granja se usa para",
            "no se paga en esta web",
        ):
            if frase in baja:
                errores.append(f"{rel}: texto prohibido «{frase}»")
        if "<p>UU.</p>" in html or "<p>según la ficha.</p>" in html:
            errores.append(f"{rel}: párrafo cortado")
        for tag in re.findall(r"<a\b[^>]*>", html):
            hm = re.search(r'href="([^"]*)"', tag)
            if not hm:
                continue
            href = hm.group(1)
            if href.startswith(("http://", "https://", "mailto:", "tel:")):
                if "amazon." in href:
                    if "amazon.com" not in href or "tag=granjarentabl-20" not in href:
                        errores.append(f"{rel}: Amazon sin tag {href}")
                    if "/product-reviews/" in href:
                        if 'rel="nofollow sponsored noopener"' not in tag or 'target="_blank"' not in tag:
                            errores.append(f"{rel}: rel de reseñas incorrecto")
                    elif 'rel="sponsored nofollow noopener"' not in tag or 'target="_blank"' not in tag:
                        errores.append(f"{rel}: rel o target incorrecto")
                    m_asin = re.search(r"/dp/([A-Z0-9]{10})", href)
                    if m_asin:
                        vistos.add(m_asin.group(1))
                continue
            base = href.split("#", 1)[0]
            ancla = href.split("#", 1)[1] if "#" in href else ""
            if not base or base.startswith(("mailto:", "tel:", "javascript:")):
                continue
            if base.startswith("/"):
                destino = RAIZ / base.lstrip("/")
            else:
                destino = (archivo.parent / base).resolve()
            if destino.is_dir():
                destino = destino / "index.html"
            if not destino.is_file():
                errores.append(f"{rel}: enlace roto {href}")
                continue
            if ancla and f'id="{ancla}"' not in destino.read_text(encoding="utf-8"):
                errores.append(f"{rel}: ancla rota {href}")
        if "/tienda/p/" in rel:
            def nfrases(atributo):
                coincidencias = re.findall(
                    rf'<section class="t-bloque" {atributo}>([\s\S]*?)</section>', html)
                if not coincidencias:
                    return 0
                return len(coincidencias[0].split("<p>")) - 1
            nexp, nrec = nfrases("data-explicacion"), nfrases("data-recomendacion")
            if nexp > 4 or nrec > 4:
                errores.append(f"{rel}: frases {nexp}/{nrec}")
            if "<h1>" not in html or 'rel="canonical"' not in html or "og:title" not in html:
                errores.append(f"{rel}: falta SEO")
            if "Ver precio en Amazon" not in html or "Ver las reseñas en Amazon" not in html:
                errores.append(f"{rel}: falta un botón de Amazon")
            if "t-sello" in html or "sello-recomendado-granja-rentable" in html:
                errores.append(f"{rel}: el sello no puede publicarse en esta rama")
            slug = rel.split("/")[2] if rel.startswith("tienda/p/") else ""
            producto = next((p for p in productos if p["slug"] == slug), None)
            tiene = bool(producto and (producto.get("descripcion_larga") or "").strip())
            pintada = "data-descripcion-larga" in html
            if tiene != pintada:
                errores.append(f"{rel}: la descripción larga no coincide con el catálogo")
            if f'href="{ "../../../ebooks/" }"' not in html and 'href="../../../ebooks/"' not in html:
                errores.append(f"{rel}: falta el enlace a ebooks")
    if vistos != asins:
        errores.append(f"ASINs enlazados {len(vistos)} frente a {len(asins)}")
    sitemap = (RAIZ / "sitemap.xml").read_text(encoding="utf-8")
    for url in urls:
        if f"<loc>{url}</loc>" not in sitemap:
            errores.append(f"Falta en el sitemap: {url}")
    if "tienda.html" in sitemap.split("tienda-afiliados:inicio")[-1].split("tienda-afiliados:fin")[0]:
        errores.append("tienda.html no debe estar en el sitemap")
    catalogo = json.loads((RAIZ / "tienda" / "catalogo.json").read_text(encoding="utf-8"))
    bruto = json.dumps(catalogo, ensure_ascii=False)
    if "precio_usd" in bruto or re.search(r"\$\s*\d", bruto):
        errores.append("El catálogo público lleva un precio")
    if any("descripcion_larga" not in item for item in catalogo):
        errores.append("Al catálogo le falta descripcion_larga")
    if any(clave in item for item in catalogo for clave in ("estrellas", "resenas", "valoracion_fecha")):
        errores.append("El catálogo público todavía lleva valoraciones")
    cita = re.compile(r"valorad|valoraci|estrella|★|ratingValue|Muy valorado", re.I)
    resen = re.compile(r"reseñ", re.I)
    rutas = [p for p in (RAIZ / "tienda").rglob("*") if p.suffix.lower() in {".html", ".css", ".js", ".json"}]
    rutas.append(RAIZ / "tienda.html")
    for ruta in rutas:
        texto = ruta.read_text(encoding="utf-8")
        if "t-sello" in texto or "sello-recomendado-granja-rentable" in texto:
            errores.append(f"El sello no puede publicarse en {ruta.relative_to(RAIZ)}")
        if cita.search(texto) or resen.search(texto.replace("Ver las reseñas en Amazon", "")):
            errores.append(f"Queda una valoración en {ruta.relative_to(RAIZ)}")
    muestra = html_descripcion_larga("## Qué incluye\n\nUna frase.\n\n### Detalle\n\nOtra.")
    if "<h2>Qué incluye</h2>" not in muestra or "<h3>Detalle</h3>" not in muestra or "<p>Una frase.</p>" not in muestra:
        errores.append("La descripción larga no pinta los subtítulos")
    if html_descripcion_larga("") or html_descripcion_larga("  \n"):
        errores.append("Una descripción vacía no debería pintar nada")
    return errores


def main():
    filas, excluidos, _por_cat = cargar()
    with (Path(__file__).resolve().parent / "catalogo-origen.csv").open(newline="", encoding="utf-8") as fh:
        origen = list(csv.DictReader(fh))
    precios = sorted({(f.get("precio_usd") or "").strip() for f in origen if "." in (f.get("precio_usd") or "")})
    productos = armar(filas)
    urls = escribir(productos)
    errores = comprobar(productos, urls, precios)
    escritos = [p for p in productos if p["origen"] == "escrito"]
    ampliados = [p for p in productos if p["origen"] == "catalogo+frase"]
    cats = sorted({p["categoria"] for p in productos})
    informe = {
        "productos_csv": 171,
        "productos_mostrados": len(productos),
        "categorias_mostradas": len(cats),
        "categorias": cats,
        "excluidos": excluidos,
        "mostrados_42": [p["asin"] for p in productos if p["unico_42"]],
        "textos_escritos": [
            {"asin": p["asin"], "titulo": p["titulo"], "explicacion": p["explicacion"], "recomendacion": p["recomendacion"]}
            for p in escritos
        ],
        "frases_anadidas": len(ampliados),
        "secciones": [titulo for _sid, titulo, _cats in SECCIONES],
    }
    (Path(__file__).resolve().parent / "informe.json").write_text(
        json.dumps(informe, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Productos {len(productos)} en {len(cats)} categorías. Excluidos: {len(excluidos)}. Textos escritos: {len(escritos)}. Frases añadidas: {len(ampliados)}.")
    if errores:
        print("\n".join(errores[:40]), file=sys.stderr)
        print(f"{len(errores)} errores", file=sys.stderr)
        return 1
    print("Comprobación interna: enlaces, tag y schema correctos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
