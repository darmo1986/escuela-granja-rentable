#!/usr/bin/env python3
"""Construye las fichas de pollo de engorde.

Lee _fuentes/pollos/fichas/<slug>.md y _fuentes/pollos/medios.json.
Escribe pollos/<slug>.html, pollos-engorde.html, el enlace en razas.html
y las URLs del sitemap. No reescribe razas/<slug>.html ni otras secciones.

Uso: python3 _fuentes/pollos/construir.py
"""
from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

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
]
BLANCOS = ORDEN[:5]
MARCAS_PIE = re.compile(r"Ross|Cobb|Hubbard|Arbor|Indian", re.I)
PROHIBIDA = "broiler-blanco-comercial-foto.webp"


def cargar_razas():
    ruta = RAIZ / "_fuentes" / "razas" / "construir.py"
    spec = importlib.util.spec_from_file_location("construir_razas", ruta)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def medios_de(datos):
    perfiles = datos.get("perfiles", {})
    out = {}
    for slug, ficha in datos["fichas"].items():
        base = dict(perfiles.get(ficha.get("perfil"), {}))
        base.update({k: v for k, v in ficha.items() if k != "perfil"})
        out[slug] = base
    return out


def es_separador(linea):
    resto = linea.strip().strip("|").replace("|", "")
    return bool(resto) and set(resto) <= set("-: ")


def celdas(linea):
    return [c.strip() for c in linea.strip().strip("|").split("|")]


def md_a_html(cuerpo, en_linea):
    out, lista, parrafo = [], None, []
    tabla = False

    def cerrar():
        nonlocal lista, tabla
        if parrafo:
            out.append("<p>" + en_linea(" ".join(parrafo)) + "</p>")
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
                out.append("<p>" + en_linea(" ".join(parrafo)) + "</p>")
                parrafo.clear()
            if lista:
                out.append(f"</{lista}>")
                lista = None
            if es_separador(s):
                continue
            if not tabla:
                heads = "".join(f"<th>{en_linea(c)}</th>" for c in celdas(s))
                out.append('<div class="tabla">\n<table>\n<thead>\n<tr>' + heads + "</tr>\n</thead>\n<tbody>")
                tabla = True
                continue
            cols = "".join(f"<td>{en_linea(c)}</td>" for c in celdas(s))
            out.append("<tr>" + cols + "</tr>")
            continue
        if s.startswith("### "):
            cerrar()
            out.append(f"<h3>{en_linea(s[4:])}</h3>")
            continue
        if s.startswith("## "):
            cerrar()
            out.append(f"<h2>{en_linea(s[3:])}</h2>")
            continue
        if s.startswith("> "):
            cerrar()
            out.append(f'<p class="fine">{en_linea(s[2:])}</p>')
            continue
        m = re.match(r"^(\d+)\.\s+(.*)", s)
        if m or s.startswith("- "):
            if parrafo:
                out.append("<p>" + en_linea(" ".join(parrafo)) + "</p>")
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
            out.append(f"<li>{en_linea(m.group(2) if m else s[2:])}</li>")
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


def figura(medio, credito_html, esc, segunda=False):
    foto = medio["foto2" if segunda else "foto"]
    alt = medio["alt2" if segunda else "alt"]
    w = medio["w2" if segunda else "w"]
    h = medio["h2" if segunda else "h"]
    credito = medio["credito2" if segunda else "credito"]
    pie = "" if segunda else medio.get("pie", "")
    leyenda = credito_html(credito)
    if pie:
        leyenda = esc(pie) + ". " + leyenda
    prioridad = "" if segunda else ' fetchpriority="high"'
    return (
        f'<figure class="enf-fig raza-foto">\n'
        f'<img src="../{foto}" width="{w}" height="{h}" alt="{esc(alt)}"{prioridad} '
        f'style="width:100%;height:auto;border-radius:12px">\n'
        f"<figcaption>{leyenda}</figcaption>\n</figure>"
    )


def bloque_video(medio, credito_html, esc):
    if not medio.get("video"):
        return ""
    return (
        f'<h2>{esc(medio["video_titulo"])}</h2>\n'
        f'<figure class="enf-fig raza-video">\n'
        f'<video controls muted playsinline preload="none" width="{medio["vw"]}" height="{medio["vh"]}" '
        f'poster="../{medio["poster"]}" aria-label="{esc(medio["video_alt"])}" '
        f'style="width:100%;height:auto;border-radius:12px;background:#000">\n'
        f'<source src="../{medio["video"]}" type="video/mp4">\n</video>\n'
        f'<figcaption>{esc(medio["video_alt"])}. {credito_html(medio["video_credito"], "Vídeo")}</figcaption>\n'
        f"</figure>"
    )


def pagina(slug, cuerpo, medio, piezas, razas):
    head_fijo, cabecera, pie = piezas
    esc = razas.esc
    h1 = medio["h1"]
    nombre = medio["nombre"]
    url = f"{SITIO}/pollos/{slug}.html"
    titulo = f"{h1}: peso, conversión y manejo | Granja Rentable"
    desc = razas.meta_desc(razas.intro(cuerpo))
    img_abs = f"{SITIO}/{medio['foto']}"
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
    fotos = figura(medio, razas.credito_html, esc)
    if medio.get("foto2"):
        fotos += "\n" + figura(medio, razas.credito_html, esc, segunda=True)
    video = bloque_video(medio, razas.credito_html, esc)
    texto = md_a_html(cuerpo, razas.en_linea)
    if video:
        marca = "<h2>Carácter</h2>"
        texto = texto.replace(marca, video + "\n" + marca, 1) if marca in texto else texto + "\n" + video
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
{fotos}
{texto}
<section class="panel" aria-labelledby="prepara-tu-lote">
<h2 id="prepara-tu-lote">Del objetivo de la línea a las cuentas de tu lote</h2>
<p>Usa la ficha como punto de partida y prepara el seguimiento de tu propia granja.</p>
<ul>
<li><a href="../blog/alimentacion-pollos-engorde-fases.html">Revisa la alimentación de los pollos de engorde por fases</a> y el programa del proveedor de tus aves.</li>
<li><a href="../calculadora.html">Prepara el presupuesto en la calculadora</a> con tus precios y cantidades.</li>
<li><a href="../app.html">Registra tu lote de pollos</a> para llevar el seguimiento de tu producción.</li>
</ul>
</section>
<p class="enf-aviso">Información orientativa sobre la línea. Para salud, vacunas o tratamientos, consulta a un veterinario.</p>
<p><a class="btn sec" href="../pollos-engorde.html">Ver los pollos de engorde</a> <a class="btn gold" href="../curso.html">Ir al curso gratis</a></p>
</article>
</main>{pie}"""


def extracto(texto, meta_desc):
    return meta_desc(re.sub(r"\s*\[\d+\]", "", texto), 140)


def tarjetas(fichas, medios, razas):
    html = []
    for slug in ORDEN:
        m = medios[slug]
        extra = " · con vídeo" if m.get("video") else ""
        pie = razas.credito_html(m["credito"])
        if m.get("pie"):
            pie = razas.esc(m["pie"]) + ". " + pie
        html.append(
            f'<article class="raza">\n<div class="raza-media"><figure>\n'
            f'<a href="pollos/{slug}.html"><img src="{m["foto"]}" width="{m["w"]}" height="{m["h"]}" '
            f'loading="lazy" alt="{razas.esc(m["alt"])}"></a>\n'
            f"<figcaption>{pie}</figcaption>\n</figure></div>\n"
            f'<div class="raza-body">\n<h3><a href="pollos/{slug}.html">{razas.esc(m["nombre"])}</a></h3>\n'
            f"<p>{razas.esc(extracto(razas.intro(fichas[slug]), razas.meta_desc))}</p>\n"
            f'<p class="fine"><a href="pollos/{slug}.html">Ver la ficha{extra}</a></p>\n</div>\n</article>'
        )
    return "\n".join(html)


def indice(razas_html, fichas, medios, razas):
    titulo = "Pollos de engorde: ocho fichas | Granja Rentable"
    desc = ("Ross 708, Cobb 500, Arbor Acres Plus, Indian River, Hubbard, Sasso y Kuroiler: "
            "peso, conversión y granja, con la fuente de cada cifra.")
    if len(desc) > 160:
        raise SystemExit(f"descripción del índice demasiado larga ({len(desc)})")
    url = f"{SITIO}/pollos-engorde.html"
    html = razas_html
    titulo_actual = re.search(r"<title>(.*?)</title>", html, re.S)
    descripcion_actual = re.search(r'<meta name="description" content="([^"]+)">', html)
    if not titulo_actual or not descripcion_actual:
        raise SystemExit("faltan título o descripción en razas.html")
    titulo_viejo = titulo_actual.group(1)
    desc_vieja = descripcion_actual.group(1)
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
<p>Ocho fichas con los días, el peso, la conversión y el tipo de granja que salen de las guías de las casas de genética o de los estudios citados. Si no hay una cifra fiable, la ficha lo dice y no se inventa otra.</p>
<p>En las cinco fichas de broiler blanco, la foto y el vídeo son de un pollo de engorde blanco de tipo comercial (imagen ilustrativa). No corresponden a la línea concreta.</p>
<p class="split"><a class="btn sec" href="razas.html#razas-gallinas">Razas de gallinas</a> <a class="btn sec" href="razas.html#gallos">Gallos y reproducción</a> <a class="btn gold" href="curso.html">Ir al curso gratis</a></p>
</section>
<aside class="ad-inline" data-ad-size="banner"><p class="ad-label">Publicidad</p><div class="ad-slot" data-ad-slot="banner" data-ad-size="banner"></div></aside>
{razas.buscador_y_indice([(f"pollos/{slug}.html", medios[slug]["nombre"]) for slug in ORDEN], "Cobb 500", "Ir directamente a una línea de pollos")}
<div id="lista-fichas" class="raza-grid" data-fichas-lista>
{tarjetas(fichas, medios, razas)}
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
    parrafo = ('<p><a href="pollos-engorde.html">Pollos de engorde</a>: ocho fichas '
               "(Ross 708, Cobb 500, Arbor Acres Plus, Indian River, Hubbard Efficiency Plus, "
               "Hubbard Redbro, Sasso y Kuroiler).</p>\n")
    ancla = '<p><a href="#razas-gallinas">Ir a las 20 fichas de razas de gallinas</a>.</p>\n'
    if parrafo not in texto:
        if ancla not in texto:
            raise SystemExit("razas.html no tiene el enlace a las 20 fichas")
        texto = texto.replace(ancla, ancla + parrafo, 1)
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


def comprobar(medios, fichas):
    errores = []
    if list(medios) != ORDEN and set(medios) != set(ORDEN):
        errores.append("medios y orden no coinciden")
    if set(medios) != set(ORDEN):
        errores.append(f"slugs: {sorted(set(medios) ^ set(ORDEN))}")
    prohibida = list(RAIZ.rglob(PROHIBIDA))
    if prohibida:
        errores.append("se coló " + ", ".join(str(p.relative_to(RAIZ)) for p in prohibida))
    for slug in ORDEN:
        m = medios[slug]
        html = (RAIZ / "pollos" / f"{slug}.html").read_text(encoding="utf-8")
        if PROHIBIDA in html:
            errores.append(f"{slug}: usa la foto descartada")
        if "ChatGPT" in html or "no publicar" in html.lower() or "borrador para qc" in html.lower():
            errores.append(f"{slug}: queda texto interno")
        if "Sin dato" in fichas[slug] and "Sin dato" not in html:
            errores.append(f"{slug}: se perdió un «sin dato»")
        main = html.split("<main", 1)[1].split("</main>", 1)[0]
        if f'src="../{m["foto"]}"' not in main:
            errores.append(f"{slug}: falta la foto {m['foto']}")
        if m.get("foto2") and f'src="../{m["foto2"]}"' not in main:
            errores.append(f"{slug}: falta la segunda foto")
        if slug in BLANCOS:
            for fig in re.findall(r"<figure class=\"enf-fig raza-foto\">.*?</figure>", main, flags=re.S):
                if MARCAS_PIE.search(fig):
                    errores.append(f"{slug}: el pie de la foto nombra la línea")
                if "Pollo de engorde blanco de tipo comercial (imagen ilustrativa)" not in fig:
                    errores.append(f"{slug}: falta el pie de la foto")
            video = re.search(r"<figure class=\"enf-fig raza-video\">.*?</figure>", main, flags=re.S)
            if not video or MARCAS_PIE.search(video.group(0)):
                errores.append(f"{slug}: el vídeo nombra la línea o no está")
            if video and "no corresponde a la línea concreta" not in video.group(0):
                errores.append(f"{slug}: falta el pie del vídeo")
        if m.get("video"):
            if not re.search(r"<video controls muted playsinline preload=\"none\"", main):
                errores.append(f"{slug}: el vídeo no lleva los atributos de las razas")
            if f'poster="../{m["poster"]}"' not in main or f'src="../{m["video"]}"' not in main:
                errores.append(f"{slug}: falta el vídeo o el póster")
            if not (RAIZ / m["video"]).is_file() or not (RAIZ / m["poster"]).is_file():
                errores.append(f"{slug}: falta el archivo de vídeo o el póster")
        else:
            if "<video" in main:
                errores.append(f"{slug}: tiene vídeo sin ficha de medios")
        if not (RAIZ / m["foto"]).is_file():
            errores.append(f"{slug}: no está el archivo de la foto")
        if '"@type": "Article"' not in html or '"@type": "BreadcrumbList"' not in html:
            errores.append(f"{slug}: falta JSON-LD")
    indice = (RAIZ / "pollos-engorde.html").read_text(encoding="utf-8")
    if PROHIBIDA in indice:
        errores.append("el índice usa la foto descartada")
    for slug in ORDEN:
        if f"pollos/{slug}.html" not in indice:
            errores.append(f"el índice no enlaza {slug}")
    razas_html = (RAIZ / "razas.html").read_text(encoding="utf-8")
    if 'href="pollos-engorde.html"' not in razas_html:
        errores.append("razas.html no enlaza el índice")
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
    medios = medios_de(datos)
    fichas = {}
    for slug in ORDEN:
        ruta = FUENTE / "fichas" / f"{slug}.md"
        if not ruta.is_file():
            raise SystemExit(f"falta la ficha {slug}")
        if slug not in medios:
            raise SystemExit(f"{slug} sin medios")
        fichas[slug] = ruta.read_text(encoding="utf-8")
        if fichas[slug].lstrip().startswith("# ") is False:
            raise SystemExit(f"{slug}: la ficha no tiene H1")
    piezas = razas.piezas_plantilla()
    (RAIZ / "pollos").mkdir(exist_ok=True)
    for slug in ORDEN:
        (RAIZ / "pollos" / f"{slug}.html").write_text(
            pagina(slug, fichas[slug], medios[slug], piezas, razas), encoding="utf-8")
    hub = RAIZ / "razas.html"
    hub.write_text(enlazar_razas(hub.read_text(encoding="utf-8")), encoding="utf-8")
    (RAIZ / "pollos-engorde.html").write_text(
        indice(hub.read_text(encoding="utf-8"), fichas, medios, razas), encoding="utf-8")
    actualizar_sitemap()
    comprobar(medios, fichas)
    print(f"{len(ORDEN)} fichas de pollo")


if __name__ == "__main__":
    main()
