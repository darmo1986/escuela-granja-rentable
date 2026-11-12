#!/usr/bin/env python3
"""Construye las fichas de raza: razas/<slug>.html, el bloque de razas.html y el sitemap.

Fuentes: _fuentes/razas/fichas/<slug>.md (texto aprobado) y _fuentes/razas/medios.json
(foto, vídeo, alt y crédito). Medios en img/razas/<slug>.webp, <slug>.mp4 y <slug>-poster.webp.
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
    return f'{que}: {esc(c["autor"])}, {lic}, vía <a href="{c["fuente"]}" rel="noopener">Wikimedia Commons</a>{nota}.'


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
    h1 = nombre if nombre.lower().startswith("gallina") else f"Gallina {nombre}"
    url = f"{SITIO}/razas/{slug}.html"
    titulo = f"{h1}: puesta, peso y carácter | Granja Rentable"
    desc = meta_desc(intro(cuerpo))
    img_abs = f"{SITIO}/img/razas/{slug}.webp"
    w, h = dims
    ld = {
        "@context": "https://schema.org", "@type": "Article",
        "headline": f"{h1}: ficha de raza", "description": desc, "inLanguage": "es",
        "image": img_abs, "datePublished": "2026-11-10", "dateModified": "2026-11-10",
        "mainEntityOfPage": url,
        "author": {"@type": "Organization", "name": "Granja Rentable", "url": SITIO + "/"},
        "publisher": {"@type": "Organization", "name": "Granja Rentable", "url": SITIO + "/"},
    }
    migas = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITIO + "/"},
        {"@type": "ListItem", "position": 2, "name": "Razas de gallinas", "item": SITIO + "/razas.html"},
        {"@type": "ListItem", "position": 3, "name": nombre, "item": url}]}
    foto = (f'<figure class="enf-fig raza-foto">\n<img src="../img/razas/{slug}.webp" width="{w}" height="{h}" '
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
    # el vídeo va justo antes de «Seis apartados» (o antes de Fuentes si no existe)
    if video:
        marca = "<h2>Seis apartados de la raza</h2>"
        texto = texto.replace(marca, video + "\n" + marca, 1) if marca in texto else texto + "\n" + video
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
<li aria-current="page">{esc(nombre)}</li>
</ol></nav>
<article class="enf-lectura raza-ficha">
<h1>{esc(h1)}</h1>
{foto}
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
<p><a class="btn sec" href="../razas.html">Ver todas las razas</a> <a class="btn gold" href="../curso.html">Ir al curso gratis</a></p>
</article>
</main>{pie}"""


def bloque_hub(fichas, medios, dims):
    tarjetas = []
    for slug, datos, cuerpo in sorted(fichas, key=lambda f: medios[f[0]]["nombre"].lower()):
        m = medios[slug]
        w, h = dims[slug]
        extra = " · con vídeo" if m.get("video") else ""
        tarjetas.append(
            f'<article class="raza">\n<div class="raza-media"><figure>\n'
            f'<a href="razas/{slug}.html"><img src="img/razas/{slug}.webp" width="{w}" height="{h}" loading="lazy" alt="{esc(m["alt"])}"></a>\n'
            f'<figcaption>{credito_html(m["credito"])}</figcaption>\n</figure></div>\n'
            f'<div class="raza-body">\n<h3><a href="razas/{slug}.html">{esc(m["nombre"])}</a></h3>\n'
            f'<p>{esc(meta_desc(intro(cuerpo), 140))}</p>\n'
            f'<p class="fine"><a href="razas/{slug}.html">Ver la ficha{extra}</a></p>\n</div>\n</article>')
    return ('<!-- razas:inicio -->\n<section id="razas-gallinas">\n<h2>Razas de gallinas: 20 fichas</h2>\n'
            '<p>Origen, aptitud, peso, puesta, color del huevo, carácter y clima de cada raza, con sus fuentes. '
            'Las características son tendencias de raza, no garantías para cada ave.</p>\n'
            '<div class="raza-grid">\n' + "\n".join(tarjetas) + '\n</div>\n</section>\n<!-- razas:fin -->')


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
        img = RAIZ / "img" / "razas" / f"{slug}.webp"
        if not img.is_file():
            errores.append(f"{slug}: falta {img.name}")
        if medios[slug].get("video"):
            for n in (f"{slug}.mp4", f"{slug}-poster.webp"):
                if not (RAIZ / "img" / "razas" / n).is_file():
                    errores.append(f"{slug}: falta {n}")
        fichas.append((slug, datos, cuerpo))
    if errores:
        print("\n".join(errores)); sys.exit(1)
    dims = {s: Image.open(RAIZ / "img" / "razas" / f"{s}.webp").size for s, _, _ in fichas}
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
    nuevas = "\n".join(f"<url><loc>{SITIO}/razas/{slug}.html</loc><lastmod>2026-11-10</lastmod></url>" for slug, _, _ in fichas)
    s = s.replace(f"<url><loc>{SITIO}/razas.html</loc><lastmod>2026-11-01</lastmod></url>",
                  f"<url><loc>{SITIO}/razas.html</loc><lastmod>2026-11-10</lastmod></url>")
    s = re.sub(r"(<url><loc>https://granjarentable.com/razas.html</loc>.*?</url>)", lambda m: m.group(1) + "\n" + nuevas, s, count=1)
    sm.write_text(s, encoding="utf-8")
    print(f"{len(fichas)} fichas")


if __name__ == "__main__":
    main()
