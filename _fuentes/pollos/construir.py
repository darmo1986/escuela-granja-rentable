#!/usr/bin/env python3
"""Construye las fichas de pollo de engorde.

Lee _fuentes/pollos/fichas/<slug>.md (texto aprobado) y _fuentes/pollos/medios.json.
Escribe pollos/<slug>.html, pollos-engorde.html, el enlace en razas.html
y las URLs del sitemap. No reescribe razas/<slug>.html ni la tienda.

Uso: python3 _fuentes/pollos/construir.py
"""
from __future__ import annotations

import html as html_lib
import importlib.util
import json
import re
import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
FUENTE = Path(__file__).resolve().parent
SITIO = "https://granjarentable.com"
ORDEN = [
    "ross-708",
    "cobb-500",
    "arbor-acres-plus",
    "indian-river",
    "hubbard-efficiency-plus",
    "hubbard-redbro-ja57",
    "sasso",
    "kuroiler",
    "rowan-ranger",
    "freedom-ranger",
    "label-rouge",
    "campero-ue",
    "campero-inta",
]
PROHIBIDA = "broiler-blanco-comercial-foto.webp"
ENLACE_MD = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
PARRAFO_POLLOS = (
    '<p><a href="pollos-engorde.html">Pollos de engorde</a>: trece fichas '
    "(Ross 708, Cobb 500, Arbor Acres Plus, Indian River, Hubbard Efficiency Plus, "
    "Hubbard Redbro, Sasso, Kuroiler, Rowan Range, Freedom Ranger, Label Rouge, "
    "Campero UE y Campero INTA).</p>\n"
)
DESC_INDICE = (
    "Trece fichas de pollos de engorde, del Ross 708 al Campero INTA: "
    "peso, conversión y granja, con la fuente de cada cifra."
)


def cargar_razas():
    ruta = RAIZ / "_fuentes" / "razas" / "construir.py"
    spec = importlib.util.spec_from_file_location("construir_razas", ruta)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def limpiar_url(url):
    url = url.replace("\\", "").strip()
    partes = urlsplit(url)
    pares = [
        (k, v)
        for k, v in parse_qsl(partes.query, keep_blank_values=True)
        if not k.lower().startswith("utm_")
    ]
    query = urlencode(pares, safe=":/")
    return urlunsplit((partes.scheme, partes.netloc, partes.path, query, partes.fragment))


def en_linea(t, esc):
    enlaces = []

    def guardar(m):
        enlaces.append((m.group(1), limpiar_url(m.group(2))))
        return f"\x00{len(enlaces) - 1}\x00"

    t = ENLACE_MD.sub(guardar, t)
    t = esc(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", t)

    def poner(m):
        texto, url = enlaces[int(m.group(1))]
        return f'<a href="{esc(url)}" rel="nofollow noopener">{esc(texto)}</a>'

    return re.sub(r"\x00(\d+)\x00", poner, t)


def es_separador(linea):
    resto = linea.strip().strip("|").replace("|", "")
    return bool(resto) and set(resto) <= set("-: ")


def celdas(linea):
    return [c.strip() for c in linea.strip().strip("|").split("|")]


def preparar_cuerpo(cuerpo):
    # El texto aprobado escapa un guion de la fuente de Label Rouge. En la ficha es un enlace.
    return re.sub(r"(?m)^\\- ", "- ", cuerpo)


def md_a_html(cuerpo, esc):
    cuerpo = preparar_cuerpo(cuerpo)
    out, lista, parrafo = [], None, []
    tabla = False

    def cerrar():
        nonlocal lista, tabla
        if parrafo:
            out.append("<p>" + en_linea(" ".join(parrafo), esc) + "</p>")
            parrafo.clear()
        if lista:
            out.append(f"</{lista}>")
            lista = None
        if tabla:
            out.append("</tbody>\n</table>\n</div>")
            tabla = False

    for linea in cuerpo.splitlines():
        s = linea.strip()
        if not s:
            cerrar()
            continue
        if s.startswith("# "):
            cerrar()
            continue
        if s.startswith("|"):
            if parrafo:
                out.append("<p>" + en_linea(" ".join(parrafo), esc) + "</p>")
                parrafo.clear()
            if lista:
                out.append(f"</{lista}>")
                lista = None
            if es_separador(s):
                continue
            if not tabla:
                heads = "".join(f"<th>{en_linea(c, esc)}</th>" for c in celdas(s))
                out.append('<div class="tabla">\n<table>\n<thead>\n<tr>' + heads + "</tr>\n</thead>\n<tbody>")
                tabla = True
                continue
            cols = "".join(f"<td>{en_linea(c, esc)}</td>" for c in celdas(s))
            out.append("<tr>" + cols + "</tr>")
            continue
        if s.startswith("### "):
            cerrar()
            out.append(f"<h3>{en_linea(s[4:], esc)}</h3>")
            continue
        if s.startswith("## "):
            cerrar()
            out.append(f"<h2>{en_linea(s[3:], esc)}</h2>")
            continue
        if s.startswith("> "):
            cerrar()
            out.append(f'<p class="fine">{en_linea(s[2:], esc)}</p>')
            continue
        m = re.match(r"^(\d+)\.\s+(.*)", s)
        if m or s.startswith("- "):
            if parrafo:
                out.append("<p>" + en_linea(" ".join(parrafo), esc) + "</p>")
                parrafo.clear()
            if tabla:
                out.append("</tbody>\n</table>\n</div>")
                tabla = False
            tipo = "ol" if m else "ul"
            if lista != tipo:
                if lista:
                    out.append(f"</{lista}>")
                out.append(f"<{tipo}>")
                lista = tipo
            out.append(f"<li>{en_linea(m.group(2) if m else s[2:], esc)}</li>")
            continue
        if lista:
            out.append(f"</{lista}>")
            lista = None
        if tabla:
            out.append("</tbody>\n</table>\n</div>")
            tabla = False
        parrafo.append(s)
    cerrar()
    return "\n".join(out)


def rutas_foto(slug):
    base = f"img/pollos/{slug}"
    return {
        "foto": f"{base}.webp",
        "foto800": f"{base}-800.webp",
        "foto_og": f"{base}-og.webp",
    }


def leyenda(medio, credito_html):
    if medio.get("ilustrativa"):
        return "Imagen ilustrativa."
    return credito_html(medio["credito"])


def etiqueta_img(src, src800, w, h, alt, esc, prioridad):
    return (
        f'<img src="{src}" srcset="{src800} 800w, {src} {w}w" '
        f'sizes="(max-width: 720px) 100vw, 720px" width="{w}" height="{h}" '
        f'alt="{esc(alt)}"{prioridad} decoding="async" '
        f'style="width:100%;height:auto;border-radius:12px">'
    )


def figura(slug, medio, dims, credito_html, esc):
    rutas = rutas_foto(slug)
    w, h = dims[rutas["foto"]]
    return (
        f'<figure class="enf-fig raza-foto">\n'
        + etiqueta_img(f'../{rutas["foto"]}', f'../{rutas["foto800"]}', w, h, medio["alt"], esc, ' fetchpriority="high"')
        + f"\n<figcaption>{leyenda(medio, credito_html)}</figcaption>\n</figure>"
    )


def pagina(slug, cuerpo, medio, dims, piezas, razas):
    head_fijo, cabecera, pie = piezas
    esc = razas.esc
    h1 = medio["h1"]
    nombre = medio["nombre"]
    url = f"{SITIO}/pollos/{slug}.html"
    titulo = f"{h1}: peso, conversión y manejo | Granja Rentable"
    desc = razas.meta_desc(razas.intro(cuerpo))
    rutas = rutas_foto(slug)
    img_abs = f"{SITIO}/{rutas['foto_og']}"
    ld = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": f"{h1}: ficha de pollo de engorde",
        "description": desc, "inLanguage": "es",
        "image": img_abs, "datePublished": "2026-11-10", "dateModified": "2026-11-10",
        "mainEntityOfPage": url,
        "author": {"@type": "Organization", "name": "Granja Rentable", "url": SITIO + "/"},
        "publisher": {"@type": "Organization", "name": "Granja Rentable", "url": SITIO + "/"},
    }
    migas = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITIO + "/"},
        {"@type": "ListItem", "position": 2, "name": "Razas de gallinas", "item": SITIO + "/razas.html"},
        {"@type": "ListItem", "position": 3, "name": "Pollos de engorde", "item": SITIO + "/pollos-engorde.html"},
        {"@type": "ListItem", "position": 4, "name": nombre, "item": url},
    ]}
    texto = md_a_html(cuerpo, esc)
    pie = pie.replace(
        '<li><a href="../razas.html">Líneas de aves</a></li>',
        '<li><a href="../razas.html">Líneas de aves</a></li>\n'
        '<li><a href="../pollos-engorde.html">Pollos de engorde</a></li>',
        1,
    )
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(titulo)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{url}">
<meta name="robots" content="index,follow">
<meta property="og:url" content="{url}">
<meta property="og:type" content="article">
<meta property="og:title" content="{esc(titulo)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{img_abs}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="es_419">
<meta property="og:image:alt" content="{esc(medio["alt"])}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(titulo)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{img_abs}">
{head_fijo}<script type="application/ld+json">
{json.dumps(ld, ensure_ascii=False, indent=2)}
</script>
<script type="application/ld+json">
{json.dumps(migas, ensure_ascii=False)}
</script>
</head>
{cabecera}<main id="contenido">
<nav class="enf-migas" aria-label="Ruta"><ol>
<li><a href="../index.html">Inicio</a></li>
<li><a href="../razas.html">Razas</a></li>
<li><a href="../pollos-engorde.html">Pollos de engorde</a></li>
<li aria-current="page">{esc(nombre)}</li>
</ol></nav>
<article class="enf-lectura raza-ficha">
<h1>{esc(h1)}</h1>
{figura(slug, medio, dims, razas.credito_html, esc)}
{texto}
<p class="enf-aviso">Información orientativa sobre la línea. Para salud, vacunas o tratamientos, consulta a un veterinario.</p>
<p><a class="btn sec" href="../pollos-engorde.html">Ver los pollos de engorde</a> <a class="btn gold" href="../curso.html">Ir al curso gratis</a></p>
</article>
</main>{pie}"""


def extracto(texto, meta_desc):
    return meta_desc(re.sub(r"\s*\[\d+\]", "", texto), 140)


def tarjetas(fichas, medios, dims, razas):
    html = []
    for slug in ORDEN:
        m = medios[slug]
        rutas = rutas_foto(slug)
        w, h = dims[rutas["foto"]]
        html.append(
            f'<article class="raza">\n<div class="raza-media"><figure>\n'
            f'<a href="pollos/{slug}.html">'
            + etiqueta_img(rutas["foto"], rutas["foto800"], w, h, m["alt"], razas.esc, " loading=\"lazy\"")
            + f"</a>\n<figcaption>{leyenda(m, razas.credito_html)}</figcaption>\n</figure></div>\n"
            f'<div class="raza-body">\n<h3><a href="pollos/{slug}.html">{razas.esc(m["nombre"])}</a></h3>\n'
            f"<p>{razas.esc(extracto(razas.intro(fichas[slug]), razas.meta_desc))}</p>\n"
            f'<p class="fine"><a href="pollos/{slug}.html">Ver la ficha</a></p>\n</div>\n</article>'
        )
    return "\n".join(html)


def indice(razas_html, fichas, medios, dims, razas):
    titulo = "Pollos de engorde: trece fichas | Granja Rentable"
    desc = DESC_INDICE
    if len(desc) > 160:
        raise SystemExit(f"descripción del índice demasiado larga ({len(desc)})")
    url = f"{SITIO}/pollos-engorde.html"
    html = razas_html
    titulo_viejo = "Razas de gallinas y líneas de aves | Granja Rentable"
    desc_vieja = ("Fichas de 20 razas de gallinas (Leghorn, Sussex, Brahma, Marans, Castellana negra…) "
                  "y de las líneas ISA Brown, Lohmann, Hy-Line, Ross 308 y Cobb 500.")
    if html.count(titulo_viejo) != 3 or html.count(desc_vieja) != 3:
        raise SystemExit("la cabecera de razas.html no tiene las 3 repeticiones de título y descripción")
    html = html.replace(titulo_viejo, titulo).replace(desc_vieja, desc)
    html = html.replace(f"{SITIO}/razas.html", url)
    if html.count(url) < 2:
        raise SystemExit("no se sustituyó la canónica del índice")
    migas = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITIO + "/"},
        {"@type": "ListItem", "position": 2, "name": "Razas de gallinas", "item": SITIO + "/razas.html"},
        {"@type": "ListItem", "position": 3, "name": "Pollos de engorde", "item": url},
    ]}
    lista = {"@context": "https://schema.org", "@type": "ItemList", "name": "Pollos de engorde",
             "itemListElement": [
                 {"@type": "ListItem", "position": i + 1, "name": medios[slug]["nombre"],
                  "url": f"{SITIO}/pollos/{slug}.html"}
                 for i, slug in enumerate(ORDEN)]}
    html = html.replace(
        "</head>",
        "<script type=\"application/ld+json\">\n"
        + json.dumps(lista, ensure_ascii=False, indent=2)
        + "\n</script>\n<script type=\"application/ld+json\">\n"
        + json.dumps(migas, ensure_ascii=False)
        + "\n</script>\n</head>",
        1,
    )
    main = f"""<main id="contenido">
<nav class="enf-migas" aria-label="Ruta"><ol>
<li><a href="index.html">Inicio</a></li>
<li><a href="razas.html">Razas</a></li>
<li aria-current="page">Pollos de engorde</li>
</ol></nav>
<section class="page-hero">
<p class="kicker">Pollos</p>
<h1>Pollos de engorde</h1>
<p>Trece fichas con los días, el peso, la conversión y el tipo de granja que salen de las guías de las casas de genética, de la normativa o de los estudios citados.</p>
<p>Las imágenes generadas llevan el rótulo «Imagen ilustrativa». Las de Hubbard Redbro y Sasso indican el autor y la licencia.</p>
<p class="split"><a class="btn sec" href="razas.html">Ver las razas de gallinas</a> <a class="btn gold" href="curso.html">Ir al curso gratis</a></p>
</section>
<aside class="ad-inline" data-ad-size="banner"><p class="ad-label">Publicidad</p><div class="ad-slot" data-ad-slot="banner" data-ad-size="banner"></div></aside>
<div class="raza-grid">
{tarjetas(fichas, medios, dims, razas)}
</div>
</main>"""
    html, n = re.subn(r"<main id=\"contenido\">.*?</main>", lambda _: main, html, count=1, flags=re.S)
    if n != 1:
        raise SystemExit("no se pudo sustituir el contenido del índice")
    html = html.replace(
        '<li><a href="pollos-engorde.html">Pollos de engorde</a></li>',
        '<li><a href="pollos-engorde.html" aria-current="page">Pollos de engorde</a></li>',
        1,
    )
    return html


def enlazar_razas(texto):
    texto, n = re.subn(
        r'<p><a href="pollos-engorde.html">Pollos de engorde</a>:.*?</p>\n',
        PARRAFO_POLLOS,
        texto,
        count=1,
    )
    if n != 1:
        ancla = '<p><a href="#razas-gallinas">Ir a las 20 fichas de razas de gallinas</a>.</p>\n'
        if ancla not in texto:
            raise SystemExit("razas.html no tiene el enlace a los pollos ni a las 20 fichas")
        texto = texto.replace(ancla, ancla + PARRAFO_POLLOS, 1)
    pie = '<li><a href="razas.html">Líneas de aves</a></li>'
    extra = pie + '\n<li><a href="pollos-engorde.html">Pollos de engorde</a></li>'
    if '<li><a href="pollos-engorde.html">Pollos de engorde</a></li>' not in texto:
        if pie not in texto:
            raise SystemExit("razas.html no tiene el enlace del pie a las líneas")
        texto = texto.replace(pie, extra, 1)
    return texto


def actualizar_sitemap():
    sm = RAIZ / "sitemap.xml"
    s = sm.read_text(encoding="utf-8")
    s = re.sub(r"\n<url><loc>https://granjarentable.com/pollos-engorde\.html</loc>.*?</url>", "", s)
    s = re.sub(r"\n<url><loc>https://granjarentable.com/pollos/[^<]*</loc>.*?</url>", "", s)
    ancla = "<url><loc>https://granjarentable.com/razas/wyandotte.html</loc><lastmod>2026-11-10</lastmod></url>"
    if ancla not in s:
        raise SystemExit("sitemap sin el ancla de wyandotte")
    bloque = "\n".join(
        [f"<url><loc>{SITIO}/pollos-engorde.html</loc><lastmod>2026-11-10</lastmod></url>"]
        + [f"<url><loc>{SITIO}/pollos/{slug}.html</loc><lastmod>2026-11-10</lastmod></url>" for slug in ORDEN]
    )
    sm.write_text(s.replace(ancla, ancla + "\n" + bloque, 1), encoding="utf-8")


def fragmentos(md):
    out = []
    for linea in preparar_cuerpo(md).splitlines():
        s = linea.strip()
        if not s or s.startswith("#") or es_separador(s):
            continue
        if s.startswith("|"):
            out.extend(c for c in celdas(s) if c)
            continue
        s = re.sub(r"^-\s+", "", s)
        s = re.sub(r"^\d+\.\s+", "", s)
        s = ENLACE_MD.sub(r"\1", s)
        s = s.replace("\\", "")
        if s:
            out.append(re.sub(r"\s+", " ", s))
    return out


def plano(html):
    texto = re.sub(r"<[^>]+>", "", html)
    texto = html_lib.unescape(texto)
    return re.sub(r"\s+", " ", texto)


def comprobar(medios, fichas, dims):
    errores = []
    if set(medios) != set(ORDEN):
        errores.append(f"slugs: {sorted(set(medios) ^ set(ORDEN))}")
    prohibida = list(RAIZ.rglob(PROHIBIDA))
    if prohibida:
        errores.append("se coló " + ", ".join(str(p.relative_to(RAIZ)) for p in prohibida))
    for slug in ORDEN:
        m = medios[slug]
        rutas = rutas_foto(slug)
        html = (RAIZ / "pollos" / f"{slug}.html").read_text(encoding="utf-8")
        main = html.split("<main", 1)[1].split("</main>", 1)[0]
        if PROHIBIDA in html or "ChatGPT" in html or "utm_source" in html:
            errores.append(f"{slug}: queda una marca interna o un parámetro de campaña")
        if re.search(r"pendiente|sin dato", html, re.I):
            errores.append(f"{slug}: aparece «pendiente» o «sin dato»")
        if "<video" in main:
            errores.append(f"{slug}: la ficha nueva no lleva vídeo")
        for rel in (rutas["foto"], rutas["foto800"], rutas["foto_og"]):
            if not (RAIZ / rel).is_file():
                errores.append(f"{slug}: falta {rel}")
            if f"{rel}" not in html and rel != rutas["foto800"]:
                pass
        if f'src="../{rutas["foto"]}"' not in main:
            errores.append(f"{slug}: falta la foto en la ficha")
        if f'srcset="../{rutas["foto800"]} 800w, ../{rutas["foto"]} {dims[rutas["foto"]][0]}w"' not in main:
            errores.append(f"{slug}: falta la versión de 800 px")
        if f"{SITIO}/{rutas['foto_og']}" not in html:
            errores.append(f"{slug}: falta la imagen og")
        if 'property="og:image:width" content="1200"' not in html:
            errores.append(f"{slug}: la imagen og no declara 1200×630")
        fig = re.search(r'<figure class="enf-fig raza-foto">.*?</figure>', main, flags=re.S)
        if not fig:
            errores.append(f"{slug}: falta la figura")
        else:
            pie = fig.group(0)
            if m.get("ilustrativa"):
                if "<figcaption>Imagen ilustrativa.</figcaption>" not in pie:
                    errores.append(f"{slug}: el pie no es «Imagen ilustrativa»")
                if "Wikimedia" in pie or "Envato" in pie or "CC BY" in pie:
                    errores.append(f"{slug}: la imagen generada lleva crédito de foto real")
            else:
                if m["credito"]["autor"] not in pie or m["credito"]["licencia"] not in pie:
                    errores.append(f"{slug}: falta el crédito de autor o la licencia")
                if "Imagen ilustrativa" in pie:
                    errores.append(f"{slug}: la foto real no debe rotularse como ilustrativa")
        if '"@type": "Article"' not in html or '"@type": "BreadcrumbList"' not in html:
            errores.append(f"{slug}: falta JSON-LD")
        if "pollos-engorde.html" not in html:
            errores.append(f"{slug}: se rompió el enlace al índice")
        if slug == "hubbard-redbro-ja57" and re.search(r"JA57|ja57", plano(main)):
            errores.append("redbro: el texto mezcla la JA57")
        visible = plano(main)
        for trozo in fragmentos(fichas[slug]):
            if trozo not in visible:
                errores.append(f"{slug}: falta texto aprobado: {trozo[:90]}")
                break
        if "<h2>Fuentes</h2>" not in main:
            errores.append(f"{slug}: faltan las fuentes")
        enlaces = re.findall(r'href="(https?://[^"]+)"', main)
        if not enlaces:
            errores.append(f"{slug}: las fuentes no son enlaces")
        for href in enlaces:
            if "\\" in href or "utm_" in href or not href.startswith("http"):
                errores.append(f"{slug}: enlace mal formado {href}")
    indice_html = (RAIZ / "pollos-engorde.html").read_text(encoding="utf-8")
    if "ocho fichas" in indice_html.lower() or "Imagen ilustrativa" not in indice_html:
        errores.append("el índice no refleja las trece fichas o el rótulo de las imágenes")
    if '"@type": "ItemList"' not in indice_html:
        errores.append("el índice no tiene JSON-LD de la lista")
    for slug in ORDEN:
        if f"pollos/{slug}.html" not in indice_html:
            errores.append(f"el índice no enlaza {slug}")
        if f'href="pollos-engorde.html"' not in indice_html:
            errores.append("el índice perdió su URL")
            break
    razas_html = (RAIZ / "razas.html").read_text(encoding="utf-8")
    if 'href="pollos-engorde.html"' not in razas_html or "trece fichas" not in razas_html:
        errores.append("razas.html no enlaza las trece fichas")
    sm = (RAIZ / "sitemap.xml").read_text(encoding="utf-8")
    for slug in ["pollos-engorde"] + ORDEN:
        loc = f"{SITIO}/pollos-engorde.html" if slug == "pollos-engorde" else f"{SITIO}/pollos/{slug}.html"
        if f"<loc>{loc}</loc>" not in sm:
            errores.append(f"falta en el sitemap: {loc}")
    if errores:
        print("\n".join(errores))
        sys.exit(1)


def main():
    razas = cargar_razas()
    datos = json.loads((FUENTE / "medios.json").read_text(encoding="utf-8"))
    medios = datos["fichas"]
    fichas = {}
    dims = {}
    for slug in ORDEN:
        ruta = FUENTE / "fichas" / f"{slug}.md"
        if not ruta.is_file():
            raise SystemExit(f"falta la ficha {slug}")
        if slug not in medios:
            raise SystemExit(f"{slug} sin medios")
        fichas[slug] = ruta.read_text(encoding="utf-8")
        if not fichas[slug].lstrip().startswith("# "):
            raise SystemExit(f"{slug}: la ficha no tiene H1")
        for rel in rutas_foto(slug).values():
            archivo = RAIZ / rel
            if not archivo.is_file():
                raise SystemExit(f"falta {rel}")
            dims[rel] = Image.open(archivo).size
        og = dims[rutas_foto(slug)["foto_og"]]
        if og != (1200, 630):
            raise SystemExit(f"{slug}: la og mide {og}, hace falta 1200×630")
    piezas = razas.piezas_plantilla()
    (RAIZ / "pollos").mkdir(exist_ok=True)
    for slug in ORDEN:
        (RAIZ / "pollos" / f"{slug}.html").write_text(
            pagina(slug, fichas[slug], medios[slug], dims, piezas, razas), encoding="utf-8")
    hub = RAIZ / "razas.html"
    hub.write_text(enlazar_razas(hub.read_text(encoding="utf-8")), encoding="utf-8")
    (RAIZ / "pollos-engorde.html").write_text(
        indice(hub.read_text(encoding="utf-8"), fichas, medios, dims, razas), encoding="utf-8")
    actualizar_sitemap()
    comprobar(medios, fichas, dims)
    print(f"{len(ORDEN)} fichas de pollo")


if __name__ == "__main__":
    main()
