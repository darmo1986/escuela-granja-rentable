# -*- coding: utf-8 -*-
"""Aplica guías, metas, datos estructurados, migas, sitemap y CSS crítico."""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

import seo_g4
import seo_guias_1
import seo_guias_2
import seo_guias_resto
from seo_motor import (
    DATE,
    ROOT,
    SITE,
    article_ld,
    esc,
    json_script,
    related_nav,
    set_canonical,
    set_title_desc,
    words,
    write_guides,
)

GUIDES = [
    seo_guias_1.G1,
    seo_guias_2.G2,
    seo_guias_2.G3,
    seo_g4.G4,
    seo_guias_resto.G5,
    seo_guias_resto.G6,
    seo_guias_resto.G7,
    seo_guias_resto.G8,
    seo_guias_resto.G9,
    seo_guias_resto.G10,
    seo_guias_resto.G11,
    seo_guias_resto.G12,
    seo_guias_resto.G13,
    seo_guias_resto.G14,
]

# Título y descripción únicos. None = no tocar esa parte.
META = {
    "index.html": (
        "Avicultura en español: curso gratis | Granja Rentable",
        "Curso gratis de pollos y gallinas, guías y calculadora para Latinoamérica y España. El precio de la tienda depende de tu país.",
    ),
    "lecciones/l01.html": (
        "L01. Cómo empezar tu granja | Granja Rentable",
        "Antes de comprar pollitos, elige carne, huevos o genética. Lección gratis del curso de Granja Rentable.",
    ),
    "lecciones/l02.html": (
        "L02. Espacio para las aves | Granja Rentable",
        "Metros, cama y tipo de granja según el presupuesto. Lección gratis antes de comprar las aves.",
    ),
    "lecciones/l03.html": (
        "L03. Qué incubadora necesitas | Granja Rentable",
        "Qué máquina conviene y por qué el huevo fértil manda más que la capacidad del catálogo.",
    ),
    "lecciones/l04a.html": (
        "L04A. Arranque del pollo de engorde | Granja Rentable",
        "Temperatura, alimento y manejo de los primeros días del pollo de engorde, con la lección en video.",
    ),
    "lecciones/l04b.html": (
        "L04B. Bioseguridad en el engorde | Granja Rentable",
        "Amoníaco, depredadores y cuándo llamar al veterinario en el lote de engorde. Sin dosis.",
    ),
    "lecciones/l05a.html": (
        "L05A. De la pollita a la puesta | Granja Rentable",
        "Temario de la pollita hasta el primer huevo. El video de esta lección todavía no está publicado.",
    ),
    "lecciones/l05b.html": (
        "L05B. Huevo, cama y plagas | Granja Rentable",
        "Temario de producción, huevo, cama y plagas. El video de esta lección todavía no está publicado.",
    ),
    "lecciones/l05c.html": (
        "L05C. Salud y cuentas de puesta | Granja Rentable",
        "Temario de enfermedades, vacunas, equipo y cuentas. El video todavía no está publicado.",
    ),
    "lecciones/l06a.html": (
        "L06A. El gallo y la fertilidad | Granja Rentable",
        "Temario del gallo, el sexado y la fertilidad. El video de esta lección todavía no está publicado.",
    ),
    "lecciones/l06b.html": (
        "L06B. Elegir reproductores | Granja Rentable",
        "Temario de genética fácil y selección. El video de esta lección todavía no está publicado.",
    ),
    "lecciones/l06c.html": (
        "L06C. Cría, razas y venta | Granja Rentable",
        "Temario de sistemas de cría, consanguinidad y razas. El video todavía no está publicado.",
    ),
    "l05a/index.html": ("L05A. Pollita a la puesta | Curso", None),
    "l05b/index.html": ("L05B. Huevo, cama y plagas | Curso", None),
    "l05c/index.html": ("L05C. Salud y cuentas | Curso", None),
    "l06a/index.html": ("L06A. Gallo y fertilidad | Curso", None),
    "l06b/index.html": ("L06B. Elegir reproductores | Curso", None),
    "l06c/index.html": ("L06C. Cría, razas y venta | Curso", None),
    "producto/incubadora-wonegg-48.html": (
        "Incubadora WONEGG 48 | Granja Rentable",
        "Incubadora que enviamos a Estados Unidos: 110V y volteo automático. Con huevo de gallina caben unos 40.",
    ),
    "producto/suplemento.html": (
        "Vitaminas para pollitos | Granja Rentable",
        "Vitaminas y electrolitos en polvo. Todavía buscamos quién lo envíe desde Estados Unidos.",
    ),
    "afiliados.html": (
        None,
        "Lista de espera de afiliados de Granja Rentable. Hoy una compra no deja comisión: el cobro no está conectado.",
    ),
    "afiliados-condiciones.html": (
        None,
        "Condiciones de la lista de espera de afiliados. El seguimiento del cobro todavía no genera comisión.",
    ),
    "guias.html": (
        "Guías de gallinas y pollos | Granja Rentable",
        "Guías para criar ponedoras, engordar pollos, incubar y leer la salud del lote. Latinoamérica y España.",
    ),
    "recomendados.html": ("Página movida | Granja Rentable", None),
    "recomendados/index.html": ("Recomendados movidos | Granja Rentable", None),
}

LESSONS = [
    ("l01", "Cómo empezar: carne, huevos o genética", "Elegir un solo camino antes de comprar aves."),
    ("l02", "Espacio y tipo de granja", "Metros, cama y tipo de explotación según el presupuesto."),
    ("l03", "La incubadora", "Qué máquina hace falta y cómo dependen de ella la temperatura y el volteo."),
    ("l04a", "Pollos de engorde: arranque", "Preparación, temperatura, alimento y manejo de la primera parte."),
    ("l04b", "Pollos de engorde: bioseguridad", "Amoníaco, depredadores, enfermedades y cuándo avisar al veterinario."),
]

REL = {
    "lecciones/l01.html": [
        ("Cómo criar gallinas ponedoras", "guias/criar-gallinas-ponedoras.html"),
        ("Negocio de pollos", "guias/negocio-pollos-rentable.html"),
        ("Razas de ponedoras", "guias/razas-gallinas-ponedoras.html"),
        ("Guía para elegir camino", "guia-empezar.html"),
    ],
    "lecciones/l02.html": [
        ("Espacio por ave", "guia-espacio.html"),
        ("Gallinero para ponedoras", "guias/gallinero-para-ponedoras.html"),
        ("Pollos por metro", "guias/pollos-por-metro.html"),
        ("Lección L04A", "lecciones/l04a.html"),
    ],
    "lecciones/l03.html": [
        ("Incubar huevos de gallina", "guias/incubar-huevos-de-gallina.html"),
        ("Incubadora y días", "guia-incubadora.html"),
        ("Gallinas por gallo", "guias/gallinas-por-gallo.html"),
        ("Primeros días del pollito", "guias/primeros-dias-pollito.html"),
    ],
    "lecciones/l04a.html": [
        ("En cuántos días salen", "guias/pollos-engorde-dias.html"),
        ("Pollitos de un día", "guias/primeros-dias-pollito.html"),
        ("Pollos por metro", "guias/pollos-por-metro.html"),
        ("Lección L04B", "lecciones/l04b.html"),
    ],
    "lecciones/l04b.html": [
        ("Qué mirar si se enferman", "guias/enfermedades-gallinas-que-mirar.html"),
        ("Coccidiosis", "enfermedades/coccidiosis.html"),
        ("En cuántos días salen", "guias/pollos-engorde-dias.html"),
        ("Lección L04A", "lecciones/l04a.html"),
    ],
    "lecciones/l05a.html": [
        ("Cómo criar ponedoras", "guias/criar-gallinas-ponedoras.html"),
        ("Horas de luz", "guias/luz-gallinas-ponedoras.html"),
        ("Alimento por etapas", "guias/alimento-gallinas-ponedoras.html"),
    ],
    "lecciones/l05b.html": [
        ("Cuánto come una gallina", "guias/cuanto-come-una-gallina.html"),
        ("Agua", "guias/agua-para-gallinas.html"),
        ("Gallinero", "guias/gallinero-para-ponedoras.html"),
    ],
    "lecciones/l05c.html": [
        ("Qué mirar si se enferman", "guias/enfermedades-gallinas-que-mirar.html"),
        ("Negocio de pollos", "guias/negocio-pollos-rentable.html"),
        ("Curso", "curso.html"),
    ],
    "lecciones/l06a.html": [
        ("Gallinas por gallo", "guias/gallinas-por-gallo.html"),
        ("Incubar huevos", "guias/incubar-huevos-de-gallina.html"),
        ("Lección L01", "lecciones/l01.html"),
    ],
    "lecciones/l06b.html": [
        ("Razas de ponedoras", "guias/razas-gallinas-ponedoras.html"),
        ("Lección L01", "lecciones/l01.html"),
        ("Calculadora", "calculadora.html"),
    ],
    "lecciones/l06c.html": [
        ("Razas de ponedoras", "guias/razas-gallinas-ponedoras.html"),
        ("Negocio de pollos", "guias/negocio-pollos-rentable.html"),
        ("Lección L01", "lecciones/l01.html"),
    ],
    "guia-empezar.html": [
        ("Cómo criar ponedoras", "guias/criar-gallinas-ponedoras.html"),
        ("Negocio de pollos", "guias/negocio-pollos-rentable.html"),
        ("En cuántos días salen", "guias/pollos-engorde-dias.html"),
        ("Lección L01", "lecciones/l01.html"),
    ],
    "guia-espacio.html": [
        ("Gallinero para ponedoras", "guias/gallinero-para-ponedoras.html"),
        ("Pollos por metro", "guias/pollos-por-metro.html"),
        ("Lección L02", "lecciones/l02.html"),
        ("Criar ponedoras", "guias/criar-gallinas-ponedoras.html"),
    ],
    "guia-incubadora.html": [
        ("Incubar huevos de gallina", "guias/incubar-huevos-de-gallina.html"),
        ("Gallinas por gallo", "guias/gallinas-por-gallo.html"),
        ("Lección L03", "lecciones/l03.html"),
        ("Primeros días", "guias/primeros-dias-pollito.html"),
    ],
    "enfermedades/coccidiosis.html": [
        ("Qué mirar si se enferman", "guias/enfermedades-gallinas-que-mirar.html"),
        ("Coriza infecciosa", "enfermedades/coriza.html"),
        ("Ácaro rojo", "enfermedades/acaro-rojo.html"),
        ("Pollitos de un día", "guias/primeros-dias-pollito.html"),
    ],
    "enfermedades/coriza.html": [
        ("Qué mirar si se enferman", "guias/enfermedades-gallinas-que-mirar.html"),
        ("Coccidiosis", "enfermedades/coccidiosis.html"),
        ("Ácaro rojo", "enfermedades/acaro-rojo.html"),
        ("Criar ponedoras", "guias/criar-gallinas-ponedoras.html"),
    ],
    "enfermedades/acaro-rojo.html": [
        ("Qué mirar si se enferman", "guias/enfermedades-gallinas-que-mirar.html"),
        ("Coccidiosis", "enfermedades/coccidiosis.html"),
        ("Coriza", "enfermedades/coriza.html"),
        ("Gallinero", "guias/gallinero-para-ponedoras.html"),
    ],
    "enfermedades.html": [
        ("Qué mirar antes de llamar", "guias/enfermedades-gallinas-que-mirar.html"),
        ("Coccidiosis", "enfermedades/coccidiosis.html"),
        ("Coriza", "enfermedades/coriza.html"),
        ("Ácaro rojo", "enfermedades/acaro-rojo.html"),
    ],
}


def root_prefix(html: str) -> str:
    m = re.search(r'data-root="([^"]*)"', html)
    return m.group(1) if m else ""


def lastmod(rel: str) -> str:
    try:
        out = subprocess.check_output(
            ["git", "log", "-1", "--format=%cs", "--", rel],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
        if out:
            return out
    except subprocess.CalledProcessError:
        pass
    return DATE


def ignorar(path: Path) -> bool:
    rel = path.relative_to(ROOT).as_posix()
    return rel.startswith(("blog/plantillas/", "blog/pruebas/"))


def public_url(rel: Path) -> str:
    if rel.name == "index.html":
        parent = rel.parent.as_posix()
        if parent == ".":
            return SITE + "/"
        return SITE + "/" + parent + "/"
    return SITE + "/" + rel.as_posix()


def inject_css(html: str, crit: str) -> str:
    if "gr-crit" in html:
        return html

    def repl(m):
        href = m.group(1)
        return (
            f'<style id="gr-crit">{crit}</style>\n'
            f'<link rel="preload" href="{href}" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">\n'
            f'<noscript><link rel="stylesheet" href="{href}"></noscript>'
        )

    return re.sub(
        r'<link rel="stylesheet" href="([^"]*estilo\.css(?:\?v=\d+)?)">',
        repl,
        html,
        count=1,
    )


def add_footer(html: str) -> str:
    parts = html.split('<footer class="foot">', 1)
    if len(parts) != 2:
        return html
    head, rest = parts
    if "guias.html" in rest[:2500]:
        return html

    def repl(m):
        prefix = m.group(1) or ""
        return (
            m.group(0)
            + f'\n<li><a href="{prefix}guias.html">Guías</a></li>'
            + f'\n<li><a href="{prefix}calculadora.html">Calculadora</a></li>'
            + f'\n<li><a href="{prefix}enfermedades.html">Enfermedades</a></li>'
            + f'\n<li><a href="{prefix}faq.html">Preguntas frecuentes</a></li>'
        )

    rest2, n = re.subn(
        r'<li><a href="((?:\.\./)*)curso\.html">Curso</a></li>',
        repl,
        rest,
        count=1,
    )
    if n != 1:
        return html
    return head + '<footer class="foot">' + rest2


def defer_scripts(html: str) -> str:
    def repl(m):
        src = m.group(1)
        if "boot.js" in src or "defer" in m.group(0):
            return m.group(0)
        return f'<script src="{src}" defer></script>'

    return re.sub(r'<script src="([^"]+)"></script>', repl, html)


def lazy_images(html: str) -> str:
    def repl(m):
        tag = m.group(0)
        if "loading=" in tag or "fetchpriority=" in tag or "logo-" in tag:
            return tag
        return tag[:-1] + ' loading="lazy">'

    return re.sub(r"<img\b[^>]*>", repl, html)


def fix_redirect_canonical(path: Path, html: str) -> str:
    if 'http-equiv="refresh"' not in html:
        return html
    m = re.search(r"url=([^\"']+)", html)
    if not m:
        return html
    dest = m.group(1).split("?")[0].split("#")[0]
    target = (path.parent / dest).resolve()
    try:
        rel = target.relative_to(ROOT)
    except ValueError:
        return html
    url = public_url(rel)
    if 'rel="canonical"' in html:
        html = re.sub(
            r'(<link rel="canonical" href=").*?(")',
            lambda mm: mm.group(1) + url + mm.group(2),
            html,
            count=1,
        )
    return html


def crumb_html(prefix: str, items):
    """items: (name, href or None). href is site-root relative."""
    lis = []
    for i, (name, href) in enumerate(items):
        if href and i != len(items) - 1:
            lis.append(f'<li><a href="{prefix}{href}">{esc(name)}</a></li>')
        else:
            lis.append(f'<li aria-current="page">{esc(name)}</li>')
    return '<nav class="migas" aria-label="Migas de pan"><ol>' + "".join(lis) + "</ol></nav>"


def crumb_ld(items_abs):
    graph = []
    for i, (name, url) in enumerate(items_abs, 1):
        node = {"@type": "ListItem", "position": i, "name": name}
        if url:
            node["item"] = url
        graph.append(node)
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": graph}


def insert_main(html: str, snippet: str) -> str:
    return html.replace('<main id="contenido">', '<main id="contenido">\n' + snippet, 1)


def partes_curso():
    return [
        {
            "@type": "LearningResource",
            "learningResourceType": "Lesson",
            "name": name,
            "description": desc,
            "url": f"{SITE}/lecciones/{code}.html",
            "isAccessibleForFree": True,
            "inLanguage": "es",
        }
        for code, name, desc in LESSONS
    ]


def asegurar_curso(html: str) -> str:
    """Añade las lecciones publicadas al Course que ya trae la página."""
    if "hasPart" in html:
        return html

    def repl(m):
        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError:
            return m.group(0)
        if data.get("@type") != "Course":
            return m.group(0)
        data["@id"] = SITE + "/curso.html#curso"
        data["hasPart"] = partes_curso()
        return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "</script>"

    return re.sub(
        r'<script type="application/ld\+json">(\{.*?\})</script>',
        repl,
        html,
        flags=re.S,
    )


def asegurar_ficha(html: str) -> str:
    """Autor persona e imagen en el Article de las fichas publicadas."""

    def repl(m):
        try:
            data = json.loads(m.group(1))
        except json.JSONDecodeError:
            return m.group(0)
        if data.get("@type") != "Article":
            return m.group(0)
        data["author"] = {
            "@type": "Person",
            "name": "Juan Pablo González García",
            "url": SITE + "/",
        }
        data["image"] = SITE + "/img/logo.jpg"
        return '<script type="application/ld+json">' + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "</script>"

    return re.sub(
        r'<script type="application/ld\+json">(.*?)</script>',
        repl,
        html,
        flags=re.S,
    )


def marcar_noindex(rel: str) -> None:
    path = ROOT / rel
    html = path.read_text(encoding="utf-8")
    if 'name="robots"' in html:
        html = re.sub(
            r'<meta name="robots" content="[^"]*"',
            '<meta name="robots" content="noindex,follow"',
            html,
            count=1,
        )
    else:
        html = html.replace(
            "</title>",
            '</title>\n<meta name="robots" content="noindex,follow">',
            1,
        )
    path.write_text(html, encoding="utf-8")


def insert_before_main_end(html: str, snippet: str) -> str:
    idx = html.rfind("</main>")
    if idx < 0:
        return html
    return html[:idx] + snippet + "\n" + html[idx:]


def ensure_head_ld(html: str, blocks) -> str:
    if not blocks:
        return html
    return html.replace("</head>", "\n".join(blocks) + "\n</head>", 1)


def patch_file(path: Path, crit: str) -> str:
    rel = path.relative_to(ROOT).as_posix()
    html = path.read_text(encoding="utf-8")
    title, desc = META.get(rel, (None, None))
    if title or desc:
        cur_title = re.search(r"<title>(.*?)</title>", html, re.S)
        cur_desc = re.search(r'<meta name="description" content="(.*?)"', html, re.S)
        html = set_title_desc(
            html,
            title or (cur_title.group(1).strip() if cur_title else "Granja Rentable"),
            desc if desc is not None else (cur_desc.group(1) if cur_desc else ""),
        )
        if desc is None and not cur_desc:
            # set_title_desc may have inserted an empty description; drop it
            html = html.replace('<meta name="description" content="">\n', "")
    html = fix_redirect_canonical(path, html)
    html = inject_css(html, crit)
    html = add_footer(html)
    html = defer_scripts(html)
    html = lazy_images(html)

    prefix = root_prefix(html)
    blocks = []
    if rel in LESSON_IDS and "BreadcrumbList" not in html and "enf-migas" not in html and 'class="migas"' not in html:
        code = rel.split("/")[-1].replace(".html", "").upper()
        found = [n for i, n, _d in LESSONS if i == LESSON_IDS[rel]]
        name = found[0] if found else code
        html = insert_main(
            html,
            crumb_html(prefix, [("Inicio", "index.html"), ("Curso", "curso.html"), (code, None)]),
        )
        blocks.append(json_script(crumb_ld([
            ("Inicio", SITE + "/"),
            ("Curso", SITE + "/curso.html"),
            (name, SITE + "/" + rel),
        ])))
    if rel in ("guia-empezar.html", "guia-espacio.html", "guia-incubadora.html", "guias.html") and 'class="migas"' not in html:
        label = {"guia-empezar.html": "Elegir camino", "guia-espacio.html": "Espacio", "guia-incubadora.html": "Incubadora", "guias.html": "Guías"}[rel]
        html = insert_main(html, crumb_html("", [("Inicio", "index.html"), (label, None)]))
        blocks.append(json_script(crumb_ld([
            ("Inicio", SITE + "/"),
            (label, SITE + "/" + rel),
        ])))
    if rel in REL and 'class="relacionadas"' not in html:
        html = insert_before_main_end(html, related_nav(REL[rel], prefix))
    if rel == "curso.html":
        html = asegurar_curso(html)
    if rel == "curso.html" and '"@type":"Course"' not in html and '"@type": "Course"' not in html:
        course = {
            "@context": "https://schema.org",
            "@type": "Course",
            "@id": SITE + "/curso.html#curso",
            "name": "Curso de avicultura gratis",
            "description": "Lecciones en español para criar pollos y gallinas: decisión, espacio, incubadora y engorde.",
            "provider": {"@type": "Organization", "name": "Granja Rentable", "url": SITE + "/"},
            "inLanguage": "es",
            "isAccessibleForFree": True,
            "url": SITE + "/curso.html",
            "hasPart": [
                {
                    "@type": "LearningResource",
                    "learningResourceType": "Lesson",
                    "name": name,
                    "description": desc,
                    "url": f"{SITE}/lecciones/{code}.html",
                    "isAccessibleForFree": True,
                    "inLanguage": "es",
                }
                for code, name, desc in LESSONS
            ],
        }
        blocks.append(json_script(course))
    if rel in LESSON_IDS and "LearningResource" not in html and any(i == LESSON_IDS[rel] for i, _n, _d in LESSONS):
        code = LESSON_IDS[rel]
        name, desc = next((n, d) for i, n, d in LESSONS if i == code)
        blocks.append(json_script({
            "@context": "https://schema.org",
            "@type": "LearningResource",
            "learningResourceType": "Lesson",
            "name": name,
            "description": desc,
            "url": SITE + "/" + rel,
            "inLanguage": "es",
            "isAccessibleForFree": True,
            "isPartOf": {"@id": SITE + "/curso.html#curso"},
        }))
    if rel in ("enfermedades/coccidiosis.html", "enfermedades/coriza.html", "enfermedades/acaro-rojo.html"):
        html = asegurar_ficha(html)
    if rel in ("enfermedades/coccidiosis.html", "enfermedades/coriza.html", "enfermedades/acaro-rojo.html") and "BreadcrumbList" not in html:
        h1 = re.search(r"<h1>(.*?)</h1>", html, re.S)
        label = re.sub(r"<[^>]+>", "", h1.group(1)).strip() if h1 else "Ficha"
        blocks.append(json_script(crumb_ld([
            ("Inicio", SITE + "/"),
            ("Enfermedades", SITE + "/enfermedades.html"),
            (label, SITE + "/" + rel),
        ])))
    if rel == "app.html" and "SoftwareApplication" not in html:
        blocks.append(json_script({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Registro de pollos",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Android",
            "description": "App para anotar lotes de pollos. Todavía no está publicada en Google Play. Hay una prueba cerrada con cupo limitado.",
            "inLanguage": "es",
            "url": SITE + "/app.html",
            "author": {"@type": "Person", "name": "Juan Pablo González García"},
            "publisher": {"@type": "Organization", "name": "Granja Rentable", "url": SITE + "/"},
        }))
    if rel == "index.html" and "founder" not in html:
        html = html.replace(
            '"sameAs":',
            '"founder":{"@type":"Person","name":"Juan Pablo González García"},"sameAs":',
            1,
        )
    html = ensure_head_ld(html, blocks)
    path.write_text(html, encoding="utf-8")
    return rel


LESSON_IDS = {f"lecciones/{code}.html": code for code, _n, _d in LESSONS}
# unpublished lessons still get breadcrumbs and related links
for code in ("l05a", "l05b", "l05c", "l06a", "l06b", "l06c"):
    LESSON_IDS[f"lecciones/{code}.html"] = code


def expand_old_guides():
    extras = {
        "guia-empezar.html": """
<h2>Cómo decidir sin comprar de más</h2>
<p>Escribe en un papel tres números que sí puedes medir esta semana: metros útiles, horas al día y dinero que puedes tener quieto en alimento durante un mes. Si el alimento se acaba a la mitad, el lote no «se pone al día» la semana siguiente. La <a href="https://www.fao.org/4/Y4628E/y4628e03.htm">guía de producción de huevo de la FAO</a> sitúa el alimento en cerca del 75 % del costo de producción. Esa proporción no es tu precio: es el motivo para no abrir tres negocios a la vez.</p>
<p>El engorde devuelve el dinero en pocas semanas si el pollo sale y alguien lo compra. La puesta devuelve poco cada día durante meses. La genética casi no devuelve hasta que vendes ave o huevo fértil, y pide anotar padres. Si no vas a anotar, no empieces por genética. Si no tienes comprador, no empieces por cien pollos. La <a href="guias/negocio-pollos-rentable.html">guía del negocio</a> explica la cuenta sin prometer ganancia, y la <a href="calculadora.html">calculadora</a> usa tus precios.</p>
<p>Un lote chico, de una sola edad, enseña más que una mezcla de pollitos, gallinas cluecas y un gallo nuevo. Cuando ese lote cierre, decides si repites. La app <a href="app.html">Registro de pollos</a> sirve para no perder bajas y fechas; sigue en prueba.</p>
""",
        "guia-espacio.html": """
<h2>Una cuenta con las cifras de la lección</h2>
<p>La <a href="lecciones/l02.html">L02</a> no pide adivinar. Para ponedoras de patio anota 0,28 a 0,37 m² dentro y cerca de 0,93 m² fuera, con un nido cada 4 o 5 gallinas. Diez gallinas, en el extremo alto de dentro, son unos 3,7 m² de piso útil, no de techo inclinado donde no se paran. Fuera, cerca de 9 m² de parque. Si tu patio mide menos, no «caben igual»: caben menos aves.</p>
<p>En engorde, la L04A, que cita a Cobb, habla de unos 30 kg/m² en nave abierta. Un pollo de 2,5 kg son cerca de 12 por m². Diez metros cuadrados útiles son unos 120 pollos, no 200. El campero pide al menos 1 m² de parque y 56 días o más. Es la norma de la UE que se aplica en España. En México, Colombia, Perú y el resto de Latinoamérica no rige: consulta la norma de tu país (SENASICA, ICA, SENASA…). Esas cuentas están desarrolladas en <a href="guias/pollos-por-metro.html">pollos por metro</a> y el galpón de ponedoras, en <a href="guias/gallinero-para-ponedoras.html">el gallinero</a>.</p>
<p>Deja un rincón para apartar un ave coja o picoteada. La L02 da ejemplos de enfermería según el tamaño del lote. No hace falta una segunda nave: hace falta que el enfermo no compita por el mismo bebedero. Y anota los metros reales en la <a href="calculadora.html">calculadora</a> antes de encargar los pollitos.</p>
""",
        "guia-incubadora.html": """
<h2>La máquina no sustituye el manejo</h2>
<p>Elegir capacidad es solo el primer paso. Los 21 días de la gallina, la temperatura y la humedad están explicados, con Mississippi State y la FAO, en <a href="guias/incubar-huevos-de-gallina.html">cómo incubar huevos de gallina</a>. Ahí también está por qué un huevo de comer, sin gallo, no nace. La relación de gallos está en <a href="guias/gallinas-por-gallo.html">cuántas gallinas por gallo</a>.</p>
<p>Si la ficha dice 24 o 48 huevos, cuenta huevo de gallina de tamaño normal, no la cifra del cartón. En la tienda, la 24Egg Dual avisa unos 16 a 18, y la WONEGG 48 unos 40. Cargar de más tapa el aire del centro. Cuando nazcan, el pollito no se queda en la máquina: pasa a la criadora, como cuenta <a href="guias/primeros-dias-pollito.html">primeros días</a>.</p>
<p>La <a href="calculadoras.html">calculadora de fecha</a> suma los días y no promete el nacimiento. Los pollitos que sí sequen vivos se anotan en la <a href="calculadora.html">calculadora de rentabilidad</a> y, si entras a la prueba, en la app <a href="app.html">Registro de pollos</a>.</p>
""",
    }
    for name, extra in extras.items():
        path = ROOT / name
        html = path.read_text(encoding="utf-8")
        if "Cómo decidir sin comprar" in html or "Una cuenta con las cifras" in html or "La máquina no sustituye" in html:
            continue
        needle = '<p class="split">'
        if needle not in html:
            continue
        html = html.replace(needle, extra + needle, 1)
        path.write_text(html, encoding="utf-8")


def write_guias_index():
    path = ROOT / "guias.html"
    html = path.read_text(encoding="utf-8")
    cards = [
        ("guia-empezar.html", "Carne, huevos o genética", "Un solo camino al empezar. Sale de la lección L01."),
        ("guia-espacio.html", "Espacio por ave", "Metros de la lección L02, con una cuenta para no apretar el lote."),
        ("guia-incubadora.html", "Incubadora y días", "Qué máquina y cuántos días. El proceso de 21 días está en otra guía."),
    ]
    for g in GUIDES:
        cards.append((f"guias/{g['slug']}.html", g["h1"], g["description"]))
    bits = []
    for href, title, text in cards:
        bits.append(f"<article>\n<h2><a href=\"{href}\">{esc(title)}</a></h2>\n<p>{esc(text)}</p>\n</article>")
    block = '<div class="guia-list">\n' + "\n".join(bits) + "\n</div>"
    html2, n = re.subn(r'<div class="guia-list">.*?</div>', block, html, count=1, flags=re.S)
    if n != 1:
        raise SystemExit("no encontré guia-list")
    html2 = html2.replace(
        "Textos cortos a partir de las lecciones ya publicadas. Cada una enlaza el video y, si aplica, un producto de la tienda.",
        "Guías para criar, incubar y llevar la cuenta. Las largas están en /guias/. Las tres primeras salen de las lecciones.",
    )
    path.write_text(html2, encoding="utf-8")


def write_home_teaser():
    path = ROOT / "index.html"
    html = path.read_text(encoding="utf-8")
    if 'href="guias.html"' in html.split("<footer")[0]:
        return
    teaser = """<section class="block">
<h2>Guías para buscar menos y anotar más</h2>
<p>Ponedoras, alimento, días de engorde, incubación y qué mirar si un ave se enferma. Sin precios inventados: la cuenta va en la calculadora.</p>
<p class="split"><a class="btn gold" href="guias/criar-gallinas-ponedoras.html">Criar ponedoras</a> <a class="btn sec" href="guias/pollos-engorde-dias.html">Días de engorde</a> <a class="btn sec" href="guias.html">Todas las guías</a></p>
</section>
"""
    needle = '<a class="calc-teaser"'
    html = html.replace(needle, teaser + needle, 1)
    path.write_text(html, encoding="utf-8")


def write_404():
    path = ROOT / "404.html"
    html = path.read_text(encoding="utf-8")
    if "guias.html" in html:
        return
    html = html.replace(
        '<p class="lead">El enlace no existe o cambió. Puedes seguir con el curso gratis, ver la tienda o escribirnos por WhatsApp.</p>\n<p class="split"><a class="btn gold" href="curso.html">Curso gratis</a> <a class="btn sec" href="tienda.html">Tienda</a> <a class="btn sec" href="https://wa.me/34656267726">WhatsApp</a></p>',
        """<p class="lead">Ese enlace no está. Prueba con el curso, las guías, la calculadora o la app.</p>
<ul>
<li><a href="curso.html">Curso gratis</a></li>
<li><a href="guias.html">Guías de gallinas y pollos</a></li>
<li><a href="calculadora.html">Calculadora de rentabilidad</a></li>
<li><a href="enfermedades.html">Enfermedades</a></li>
<li><a href="app.html">Registro de pollos</a></li>
<li><a href="faq.html">Preguntas frecuentes</a></li>
<li><a href="preguntas.html">Reto de preguntas</a></li>
<li><a href="tienda.html">Tienda</a></li>
</ul>
<p class="split"><a class="btn gold" href="index.html">Ir al inicio</a> <a class="btn sec" href="https://wa.me/34656267726">WhatsApp</a></p>""",
    )
    path.write_text(html, encoding="utf-8")


def write_sitemap():
    urls = []
    for path in sorted(ROOT.rglob("*.html")):
        if any(part.startswith(".") for part in path.parts) or ignorar(path):
            continue
        rel = path.relative_to(ROOT).as_posix()
        if rel == "404.html":
            continue
        text = path.read_text(encoding="utf-8")
        robots = re.search(r'name="robots" content="([^"]*)"', text)
        if robots and "noindex" in robots.group(1):
            continue
        urls.append((public_url(path.relative_to(ROOT)), lastmod(rel)))
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for loc, mod in urls:
        lines.append("  <url>")
        lines.append(f"    <loc>{loc}</loc>")
        lines.append(f"    <lastmod>{mod}</lastmod>")
        lines.append("  </url>")
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return len(urls)


def patch_config_and_home():
    cfg = ROOT / "_config.yml"
    text = cfg.read_text(encoding="utf-8")
    if "google_site_verification" not in text:
        text += """
# Verificación de buscadores. Pega solo el valor del atributo content.
# Vacío = la portada no publica la meta. No hace falta tocar el DNS.
google_site_verification: ""
bing_site_verification: ""
"""
    for item in ("SEO_PALABRAS_CLAVE.md", "SEO_PASOS_PABLO.md", "tools"):
        if item not in text:
            text = text.replace("exclude:\n", f"exclude:\n  - {item}\n", 1)
    cfg.write_text(text, encoding="utf-8")

    path = ROOT / "index.html"
    html = path.read_text(encoding="utf-8")
    if not html.startswith("---"):
        html = "---\n---\n" + html
    snippet = """{% if site.google_site_verification and site.google_site_verification != "" %}
<meta name="google-site-verification" content="{{ site.google_site_verification | escape }}">
{% endif %}
{% if site.bing_site_verification and site.bing_site_verification != "" %}
<meta name="msvalidate.01" content="{{ site.bing_site_verification | escape }}">
{% endif %}
"""
    html = html.replace(
        '{% if site.google_site_verification != blank %}',
        '{% if site.google_site_verification and site.google_site_verification != "" %}',
    )
    html = html.replace(
        '{% if site.bing_site_verification != blank %}',
        '{% if site.bing_site_verification and site.bing_site_verification != "" %}',
    )
    if "google-site-verification" not in html:
        html = html.replace(
            '<meta name="viewport" content="width=device-width,initial-scale=1">\n',
            '<meta name="viewport" content="width=device-width,initial-scale=1">\n' + snippet,
            1,
        )
    path.write_text(html, encoding="utf-8")


def audit():
    problems = []
    titles = {}
    descs = {}
    for path in sorted(ROOT.rglob("*.html")):
        rel = path.relative_to(ROOT).as_posix()
        if any(p.startswith(".") for p in path.parts) or ignorar(path):
            continue
        text = path.read_text(encoding="utf-8")
        title = re.search(r"<title>(.*?)</title>", text, re.S)
        title = re.sub(r"\s+", " ", title.group(1)).strip() if title else ""
        desc_m = re.search(r'<meta name="description" content="(.*?)"', text, re.S)
        desc = desc_m.group(1) if desc_m else ""
        robots = re.search(r'name="robots" content="([^"]*)"', text)
        noindex = bool(robots and "noindex" in robots.group(1))
        if len(title) > 60:
            problems.append(f"title {len(title)} {rel}")
        if desc and len(desc) > 150:
            problems.append(f"desc {len(desc)} {rel}")
        if not noindex:
            if not desc:
                problems.append(f"sin desc {rel}")
            titles.setdefault(title, []).append(rel)
            if desc:
                descs.setdefault(desc, []).append(rel)
            h1 = re.findall(r"<h1[\s>]", text)
            if len(h1) != 1:
                problems.append(f"h1 {len(h1)} {rel}")
            if "https://granjarentable.com" not in text:
                problems.append(f"canon {rel}")
            if 'lang="es"' not in text:
                problems.append(f"lang {rel}")
            imgs = re.findall(r"<img\b[^>]*>", text)
            for img in imgs:
                if "alt=" not in img:
                    problems.append(f"alt {rel}")
                    break
    for t, files in titles.items():
        if len(files) > 1:
            problems.append("dup title " + str(files))
    for d, files in descs.items():
        if len(files) > 1:
            problems.append("dup desc " + str(files))
    return problems


def main():
    counts = write_guides(GUIDES)
    print("guias", counts)
    css_path = ROOT / "css" / "estilo.css"
    css = css_path.read_text(encoding="utf-8")
    extra = """
.migas ol { display: flex; flex-wrap: wrap; gap: 6px 0; list-style: none; margin: 0 0 12px; padding: 0; font-weight: 750; }
.migas li { display: inline-flex; align-items: center; }
.migas li + li::before { content: "›"; margin: 0 6px; color: var(--muted); }
.migas a { text-decoration: none; }
.relacionadas ul { margin: .2em 0 .8em; padding-left: 1.2rem; }
"""
    if ".migas ol" not in css:
        css_path.write_text(css + extra, encoding="utf-8")
        css = css_path.read_text(encoding="utf-8")
    crit_lines = css.splitlines(True)[:337]
    crit = "".join(crit_lines) + extra
    expand_old_guides()
    write_guias_index()
    write_home_teaser()
    write_404()
    for path in sorted(ROOT.rglob("*.html")):
        if any(p.startswith(".") for p in path.parts) or ignorar(path):
            continue
        patch_file(path, crit)
    # metas of guias index and home are applied in patch_file after teaser
    for rel in ("examen-final.html", "afiliados-condiciones.html"):
        marcar_noindex(rel)
    n = write_sitemap()
    patch_config_and_home()
    # front matter is added after patch; re-apply nothing else
    problems = audit()
    print("sitemap", n)
    print("problemas", len(problems))
    for p in problems:
        print(" -", p)
    if problems:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
