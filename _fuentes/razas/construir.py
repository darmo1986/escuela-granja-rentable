#!/usr/bin/env python3
"""Construye las fichas de raza: razas/<slug>.html, el bloque de razas.html y el sitemap.

Fuentes: _fuentes/razas/fichas/<slug>.md (texto aprobado) y _fuentes/razas/medios.json
(foto, vídeo, alt y crédito). Medios en img/razas/<slug>.webp (o el archivo indicado en el campo "foto" de medios.json), <slug>.mp4 y <slug>-poster.webp.
Uso: python3 _fuentes/razas/construir.py
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
FUENTE = Path(__file__).resolve().parent
SITIO = "https://granjarentable.com"
PLANTILLA = RAIZ / "enfermedades" / "coriza.html"
PROHIBIDO = re.compile(r"\b(dosis|mg/kg|ml/l|antibi[oó]tico|inyect)", re.I)
FECHA_DEFECTO = "2026-11-10"  # fecha de publicación de las 20 fichas originales
FECHA_HUB = "2026-11-27"  # última actualización de razas.html (38 fichas)
# Banner del ebook que llevan las fichas publicadas tras el H1 (antes solo a mano).
BANNER_EBOOK = ('<div class="anuncios-arriba" data-anuncios-arriba>\n'
    '<aside class="banner-ebook banner-compacto" data-banner-ebook data-banner="ebook-empezar" data-banner-puesto="compacto"><a class="banner-ebook-ficha" href="../ebooks/?utm_source=granjarentable&amp;utm_medium=banner&amp;utm_campaign=ebook-empezar#guia-empezar"><div class="banner-ebook-marca"><img src="../img/logo-oscuro.svg" alt="" width="36" height="36" loading="lazy" decoding="async"><span>Granja Rentable</span></div><img class="banner-ebook-ilustracion" src="../img/banners/banner-empezar.webp" srcset="../img/banners/banner-empezar-360.webp 360w, ../img/banners/banner-empezar-720.webp 720w, ../img/banners/banner-empezar-1200.webp 1200w" sizes="96px" alt="Ilustración: granjero echando grano a gallinas y pollitos delante de un gallinero de madera" width="600" height="469" fetchpriority="high" decoding="async"><div class="banner-ebook-texto"><p class="banner-ebook-titulo">Empieza tu granja con buen pie</p><p class="banner-ebook-guia">Ebook en PDF: Guía para empezar tu granja</p><p class="banner-ebook-precio">3 USD</p><span class="banner-ebook-cta">Compra ya</span></div></a></aside>\n'
    '</div>')
BANNER_BLOQUE = BANNER_EBOOK + "\n" * 9  # 8 líneas en blanco tras el banner, como en las fichas publicadas


def foto_nombre(medio, slug):
    """Nombre del archivo de la foto principal: el campo "foto" de medios.json o <slug>.webp."""
    return medio.get("foto", f"{slug}.webp")


def esc(t):
    return html.escape(t, quote=True)


def frontmatter(texto):
    m = re.match(r"^---\n(.*?)\n---\n", texto, re.S)
    if not m:
        raise SystemExit("Falta frontmatter")
    datos = {}
    for linea in m.group(1).splitlines():
        k, _, v = linea.partition(":")
        datos[k.strip()] = v.strip().strip('"')
    return datos, texto[m.end():]


def en_linea(t):
    t = esc(t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", t)
    t = re.sub(r"(https?://[^\s<]+?)(?=[\s<]|$|\s:)",
               lambda m: f'<a href="{m.group(1)}" rel="nofollow noopener">{m.group(1)}</a>', t)
    return t


def md_a_html(cuerpo):
    out, lista, parrafo = [], None, []

    def cerrar():
        nonlocal lista
        if parrafo:
            out.append("<p>" + en_linea(" ".join(parrafo)) + "</p>")
            parrafo.clear()
        if lista:
            out.append(f"</{lista}>")
            lista = None

    for linea in cuerpo.splitlines():
        s = linea.strip()
        if not s:
            cerrar()
            continue
        if s.startswith("# "):
            cerrar()
            continue  # el H1 lo pone la plantilla
        if s.startswith("### "):
            cerrar(); out.append(f"<h3>{en_linea(s[4:])}</h3>"); continue
        if s.startswith("## "):
            cerrar(); out.append(f"<h2>{en_linea(s[3:])}</h2>"); continue
        if s.startswith("> "):
            cerrar(); out.append(f'<p class="fine">{en_linea(s[2:])}</p>'); continue
        m = re.match(r"^(\d+)\.\s+(.*)", s)
        if m or s.startswith("- "):
            if parrafo:
                out.append("<p>" + en_linea(" ".join(parrafo)) + "</p>"); parrafo.clear()
            tipo = "ol" if m else "ul"
            if lista != tipo:
                if lista:
                    out.append(f"</{lista}>")
                out.append(f"<{tipo}>"); lista = tipo
            out.append(f"<li>{en_linea(m.group(2) if m else s[2:])}</li>")
            continue
        if lista:
            out.append(f"</{lista}>"); lista = None
        parrafo.append(s)
    cerrar()
    return "\n".join(out)


def credito_html(c, que="Foto"):
    if c.get("envato"):
        return f"{que}: Envato Elements (licencia de uso)."
    lic = c["licencia"]
    if c.get("licencia_url"):
        lic = f'<a href="{c["licencia_url"]}" rel="license noopener">{esc(lic)}</a>'
    else:
        lic = esc(lic)
    nota = f", {esc(c['nota'])}" if c.get("nota") else ""
    if "flickr.com" in c["fuente"]:
        origen = "Flickr"
    elif "commons.wikimedia.org" in c["fuente"]:
        origen = "Wikimedia Commons"
    else:
        origen = c["fuente"].split("/")[2].removeprefix("www.")
    return f'{que}: {esc(c["autor"])}, {lic}, vía <a href="{c["fuente"]}" rel="noopener">{origen}</a>{nota}.'


def intro(cuerpo):
    for bloque in re.split(r"\n\s*\n", cuerpo):
        b = bloque.strip()
        if b and not b.startswith("#"):
            return " ".join(b.split())
    return ""


def meta_desc(texto, maximo=155):
    if len(texto) <= maximo:
        return texto
    corte = texto[:maximo]
    punto = corte.rfind(". ")
    if punto > 80:
        return corte[:punto + 1]
    return corte[:corte.rfind(" ")].rstrip(",;:") + "…"


def piezas_plantilla():
    t = PLANTILLA.read_text(encoding="utf-8")
    cabecera = t[t.index('<body data-root="../">'):t.index('<main id="contenido">')]
    pie = t[t.index("</main>") + len("</main>"):]
    pie = pie.replace('<script src="../js/enfermedades.js"></script>\n', "")
    cabecera = cabecera.replace(' aria-current="page"', "")
    head_fijo = t[t.index('<meta name="theme-color"'):t.index('<script type="application/ld+json">')]
    return head_fijo, cabecera, pie


def pagina(slug, datos, cuerpo, medio, dims, piezas):
    head_fijo, cabecera, pie = piezas
    nombre = medio["nombre"]
    # h1/titulo/headline pueden sobreescribirse en medios.json (p. ej. New Hampshire,
    # cuyo título publicado no es el que daría la regla general).
    h1 = medio.get("h1") or (nombre if nombre.lower().startswith("gallina") else f"Gallina {nombre}")
    url = f"{SITIO}/razas/{slug}.html"
    titulo = medio.get("titulo") or f"{h1}: puesta, peso y carácter | Granja Rentable"
    fecha = datos.get("fecha") or FECHA_DEFECTO
    desc = meta_desc(intro(cuerpo))
    img_abs = f"{SITIO}/img/razas/{foto_nombre(medio, slug)}.webp"
    w, h = dims
    ld = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": medio.get("headline") or f"{h1}: ficha de raza", "description": desc, "inLanguage": "es",
        "image": img_abs, "datePublished": fecha, "dateModified": fecha,
        "mainEntityOfPage": url,
        "author": {"@type": "Organization", "name": "Granja Rentable", "url": SITIO + "/"},
        "publisher": {"@type": "Organization", "name": "Granja Rentable", "url": SITIO + "/"},
    }
    migas = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITIO + "/"},
        {"@type": "ListItem", "position": 2, "name": "Razas de gallinas", "item": SITIO + "/razas.html"},
        {"@type": "ListItem", "position": 3, "name": nombre, "item": url}]}
    foto = (f'<figure class="enf-fig raza-foto">\n<img src="../img/razas/{foto_nombre(medio, slug)}.webp" width="{w}" height="{h}" '
            f'alt="{esc(medio["alt"])}" fetchpriority="high" style="width:100%;height:auto;border-radius:12px">\n'
            f'<figcaption>{credito_html(medio["credito"])}</figcaption>\n</figure>')
    video = ""
    if medio.get("video"):
        video = (f'<h2>Vídeo de la {esc(nombre)}</h2>\n<figure class="enf-fig raza-video">\n'
                 f'<video controls muted playsinline preload="none" width="1280" height="720" '
                 f'poster="../img/razas/{slug}-poster.webp" aria-label="{esc(medio["video_alt"])}" '
                 f'style="width:100%;height:auto;border-radius:12px;background:#000">\n'
                 f'<source src="../img/razas/{slug}.mp4" type="video/mp4">\n</video>\n'
                 f'<figcaption>{esc(medio["video_alt"])}. {credito_html(medio["video_credito"], "Vídeo")}</figcaption>\n</figure>')
    texto = md_a_html(cuerpo)
    # Anuncio antes de «Aptitud», como en las fichas publicadas.
    texto = texto.replace("<h2>Aptitud</h2>",
        "\n\n\n\n\n" + '<div class="anuncio-tercio" data-anuncio-tercio></div><h2>Aptitud</h2>', 1)
    texto = re.sub(r"(<h2>Aptitud</h2>\n<p>.*?</p>)", r"\1\n\n\n", texto, count=1, flags=re.S)
    # el vídeo va justo antes de «Seis apartados» (o antes de Fuentes si no existe);
    # el enlace a YouTube va justo después del vídeo (o con su propio H2 si no hay vídeo local)
    marca = "<h2>Seis apartados de la raza</h2>"
    bloque_video = ""
    if video:
        bloque_video = video
    if medio.get("youtube"):
        y = medio["youtube"]
        yt = (f'<p>También puedes ver nuestro vídeo sobre esta raza en YouTube: '
              f'<a href="https://www.youtube.com/watch?v={y["id"]}">{esc(y["titulo"])}</a>.</p>')
        if bloque_video:
            bloque_video = bloque_video + "\n" + yt
        else:
            corto = nombre.split(" (")[0]
            bloque_video = f'<h2>Vídeo de la {esc(corto)}</h2>\n' + yt
    if bloque_video:
        texto = texto.replace(marca, bloque_video + "\n" + marca, 1) if marca in texto else texto + "\n" + bloque_video
    botones = '<a class="btn sec" href="../criaderos.html">Dónde conseguirla</a> <a class="btn sec" href="../razas.html">Ver todas las razas</a>'
    if medio.get("test"):
        botones += ' <a class="btn sec" href="../test-razas.html">Hacer el test</a>'
    botones += ' <a class="btn gold" href="../curso.html">Ir al curso gratis</a>'
    pagina_html = f"""<!doctype html>
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
<meta property="og:image:width" content="{w}">
<meta property="og:image:height" content="{h}">
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
<link rel="stylesheet" href="../css/ofertas.css?v=20261112">
</head>
{cabecera}<main id="contenido">
<nav class="enf-migas" aria-label="Ruta"><ol>
<li><a href="../index.html">Inicio</a></li>
<li><a href="../razas.html">Razas</a></li>
<li aria-current="page">{esc(nombre)}</li>
</ol></nav>
<article class="enf-lectura raza-ficha">
<h1>{esc(h1)}</h1>
{BANNER_BLOQUE}{foto}
{texto}
<section class="panel" aria-labelledby="prepara-tu-lote">
<h2 id="prepara-tu-lote">Prepara tu lote antes de comprar aves</h2>
<p>Después de comparar la raza, organiza la instalación y el manejo de tu granja.</p>
<ul>
<li><a href="../guia-espacio.html">Planifica el espacio y el alojamiento</a> según las aves que vas a mantener.</li>
<li><a href="../blog/agua-gallinas-ponedoras-bebederos.html">Revisa el suministro de agua y los bebederos</a> antes de instalar el lote.</li>
<li>Si buscas producir huevos, <a href="../blog/cuanto-cuesta-producir-docena-huevos.html">calcula el coste de tu docena</a> con los datos de tu granja.</li>
</ul>
</section>
<p class="enf-aviso">Información orientativa sobre la raza. Para salud, vacunas o tratamientos, consulta a un veterinario.</p>
<p>{botones}</p>
</article>


</main>{pie}"""
    return pagina_html.replace("</body>",
        '<script defer src="../js/ofertas.js?v=20261117banners"></script>\n<script defer src="../js/registro-banners.js?v=20261117banners"></script>\n</body>', 1)


FILTRO_RAZAS = [["puesta","Orientadas a la puesta"],["carne","Orientadas a carne"],["doble","Doble propósito"],["color","Huevos azules o verdes"],["video","Con vídeo"]]

def datos_catalogo(cuerpo, con_video):
    partes = dict(re.findall(r"^## ([^\n]+)\n+([^\n]+)", cuerpo, re.M))
    origen = partes.get("Origen") or partes.get("Origen e historia", "")
    aptitud = partes.get("Aptitud") or partes.get("Para qué sirve", "")
    color = partes.get("Color del huevo") or partes.get("Puesta", "")
    puesta = partes.get("Puesta anual", "")
    texto = re.sub(r"\[\d+\]", "", " ".join((origen, aptitud, color, puesta)))
    apt = aptitud.lower()
    tags = set()
    if re.search(r"^huevo[.:]|^ponedora\b|sobre todo huevo|uso principal en huevos?|sobre todo por (?:la puesta|su huevo)|acento en el huevo", apt):
        tags.add("puesta")
    if re.search(r"^carne[.:]|sobre todo carne|principalmente carne|acento en la carne|uso principal en carne|orientada a la carne|destaca como ave de carne", apt):
        tags.add("carne")
    if re.search(r"doble (?:propósito|aptitud)|principalmente carne.+también huevo", apt):
        tags.add("doble")
    if re.search(r"\b(?:azul(?:es)?|verd(?:e|es)|oliva)\b", color.lower()):
        tags.add("color")
    if con_video:
        tags.add("video")
    return " ".join(texto.split()), [tag for tag, _ in FILTRO_RAZAS if tag in tags]


def buscador_y_indice(items, ejemplo, etiqueta):
    filtros = "<label class=\"fichas-filtro\" for=\"filtrar-ficha\">Filtrar por<select id=\"filtrar-ficha\" data-fichas-filtro aria-controls=\"lista-fichas\"><option value=\"\">Todas las razas</option><option value=\"puesta\">Orientadas a la puesta</option><option value=\"carne\">Orientadas a carne</option><option value=\"doble\">Doble propósito</option><option value=\"color\">Huevos azules o verdes</option><option value=\"video\">Con vídeo</option></select></label>"
    enlaces = "\n".join(f'<li><a href="{esc(ruta)}">{esc(nombre)}</a></li>' for ruta, nombre in items)
    return f"""<form class="panel fichas-buscador" role="search" aria-label="Buscar fichas por nombre o características" data-fichas-buscar hidden>
<label for="buscar-ficha">Buscar por nombre o características</label>
<div class="fichas-buscador-campos"><input id="buscar-ficha" type="search" placeholder="Por ejemplo: {esc(ejemplo)}" autocomplete="off" aria-controls="lista-fichas" aria-describedby="resultado-fichas"><button class="btn sec" type="button" data-fichas-limpiar>Mostrar todas</button></div>
{filtros}
<p id="resultado-fichas" role="status" aria-live="polite" aria-atomic="true"></p>
<p data-fichas-vacio hidden>No hay fichas que coincidan. Prueba con menos palabras o pulsa «Mostrar todas».</p>
</form>
<details class="panel ficha-indice">
<summary>{esc(etiqueta)}</summary>
<nav aria-label="{esc(etiqueta)}"><ul>
{enlaces}
</ul></nav>
</details>
"""


def bloque_hub(fichas, medios, dims):
    tarjetas = []
    for slug, datos, cuerpo in sorted(fichas, key=lambda f: medios[f[0]]["nombre"].lower()):
        m = medios[slug]
        w, h = dims[slug]
        extra = " · con vídeo" if m.get("video") else ""
        texto, etiquetas = datos_catalogo(cuerpo, m.get("video"))
        clases = " ".join(etiquetas)
        tarjetas.append(
            f'<article class="raza" data-fichas-texto="{esc(texto)}" data-fichas-etiquetas="{esc(clases)}">\n<div class="raza-media"><figure>\n'
            f'<a href="razas/{slug}.html"><img src="img/razas/{foto_nombre(m, slug)}.webp" width="{w}" height="{h}" loading="lazy" alt="{esc(m["alt"])}"></a>\n'
            f'<figcaption>{credito_html(m["credito"])}</figcaption>\n</figure></div>\n'
            f'<div class="raza-body">\n<h3><a href="razas/{slug}.html">{esc(m["nombre"])}</a></h3>\n'
            f'<p>{en_linea(meta_desc(intro(cuerpo), 140))}</p>\n'
            f'<p class="fine"><a href="razas/{slug}.html">Ver la ficha{extra}</a></p>\n</div>\n</article>')
    return ('<!-- razas:inicio -->\n<section id="razas-gallinas">\n\n\n\n\n\n<div class="anuncio-tercio" data-anuncio-tercio></div>'
            f'<h2>Razas de gallinas: {len(fichas)} fichas</h2>\n'
            '<p>Origen, aptitud, peso, puesta, color del huevo, carácter y clima de cada raza, con sus fuentes. '
            'Las características son tendencias de raza, no garantías para cada ave.</p>\n'
            + buscador_y_indice([(f"razas/{slug}.html", medios[slug]["nombre"]) for slug, _, _ in sorted(fichas, key=lambda f: medios[f[0]]["nombre"].lower())], "doble propósito", "Ir directamente a una raza")
            + '<div id="lista-fichas" class="raza-grid" data-fichas-lista>\n' + "\n".join(tarjetas) + '\n</div>\n</section>\n<!-- razas:fin -->')


def main():
    medios = json.loads((FUENTE / "medios.json").read_text(encoding="utf-8"))
    from PIL import Image
    fichas, errores = [], []
    for ruta in sorted((FUENTE / "fichas").glob("*.md")):
        datos, cuerpo = frontmatter(ruta.read_text(encoding="utf-8"))
        slug = datos["slug"]
        if slug not in medios:
            errores.append(f"{slug}: sin medios"); continue
        if PROHIBIDO.search(cuerpo):
            errores.append(f"{slug}: texto con dosis o tratamiento")
        if slug == "wyandotte" and re.search(r"dorad", cuerpo, re.I):
            errores.append("wyandotte: no se llama «dorada»")
        img = RAIZ / "img" / "razas" / foto_nombre(medios[slug], slug)
        if not img.is_file():
            errores.append(f"{slug}: falta {img.name}")
        if medios[slug].get("video"):
            for n in (f"{slug}.mp4", f"{slug}-poster.webp"):
                if not (RAIZ / "img" / "razas" / n).is_file():
                    errores.append(f"{slug}: falta {n}")
        fichas.append((slug, datos, cuerpo))
    if errores:
        print("\n".join(errores)); sys.exit(1)
    dims = {s: Image.open(RAIZ / "img" / "razas" / foto_nombre(medios[s], s)).size for s, _, _ in fichas}
    piezas = piezas_plantilla()
    (RAIZ / "razas").mkdir(exist_ok=True)
    for slug, datos, cuerpo in fichas:
        (RAIZ / "razas" / f"{slug}.html").write_text(pagina(slug, datos, cuerpo, medios[slug], dims[slug], piezas), encoding="utf-8")
    hub = RAIZ / "razas.html"
    t = hub.read_text(encoding="utf-8")
    bloque = bloque_hub(fichas, medios, dims)
    if "<!-- razas:inicio -->" in t:
        t = re.sub(r"<!-- razas:inicio -->.*?<!-- razas:fin -->", lambda _: bloque, t, flags=re.S)
    else:
        ancla = '<aside class="ad-inline" data-ad-size="rect">'
        i = t.rindex(ancla)
        t = t[:i] + bloque + "\n" + t[i:]
    hub.write_text(t, encoding="utf-8")
    sm = RAIZ / "sitemap.xml"
    s = sm.read_text(encoding="utf-8")
    s = re.sub(r"\s*<url><loc>https://granjarentable.com/razas/[^<]*</loc>.*?</url>", "", s)
    nuevas = "\n".join(f"<url><loc>{SITIO}/razas/{slug}.html</loc><lastmod>{datos.get('fecha') or FECHA_DEFECTO}</lastmod></url>" for slug, datos, _ in fichas)
    s = re.sub(r"(<url><loc>https://granjarentable.com/razas.html</loc><lastmod>)[^<]*(</lastmod></url>)",
               rf"\g<1>{FECHA_HUB}\g<2>", s, count=1)
    s = re.sub(r"(<url><loc>https://granjarentable.com/razas.html</loc>.*?</url>)", lambda m: m.group(1) + "\n" + nuevas, s, count=1)
    sm.write_text(s, encoding="utf-8")
    print(f"{len(fichas)} fichas")


if __name__ == "__main__":
    main()
