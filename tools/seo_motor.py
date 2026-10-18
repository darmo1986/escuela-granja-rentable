# -*- coding: utf-8 -*-
"""Construye las guías nuevas y aplica el arreglo SEO del sitio.

Se ejecuta a mano desde la raíz del repo. No forma parte del sitio publicado:
Jekyll lo excluye en _config.yml.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://granjarentable.com"
DATE = "2026-10-18"

AUTHOR = {
    "@type": "Person",
    "name": "Juan Pablo González García",
    "url": SITE + "/",
}
PUBLISHER = {
    "@type": "Organization",
    "name": "Granja Rentable",
    "url": SITE + "/",
    "logo": {"@type": "ImageObject", "url": SITE + "/img/logo.jpg"},
}


def words(html: str) -> int:
    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("&nbsp;", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return len(text.split()) if text else 0


def esc(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def prefix_urls(html: str, prefix: str) -> str:
    if not prefix:
        return html

    def repl(m):
        attr, url = m.group(1), m.group(2)
        if url.startswith(("http://", "https://", "#", "mailto:", "data:", "//", "/")):
            return m.group(0)
        if url.startswith("../") or url.startswith(prefix):
            return m.group(0)
        return f'{attr}="{prefix}{url}"'

    return re.sub(r'(href|src)="([^"]*)"', repl, html)


def load_shell():
    raw = (ROOT / "guia-empezar.html").read_text(encoding="utf-8")
    head, rest = raw.split('<main id="contenido">', 1)
    foot = "<footer class=\"foot\">" + rest.split('<footer class="foot">', 1)[1]
    return head, foot


def set_title_desc(html: str, title: str, desc: str) -> str:
    html = re.sub(r"<title>.*?</title>", f"<title>{esc(title)}</title>", html, count=1, flags=re.S)

    def put(attr_pat, value):
        nonlocal html
        html2, n = re.subn(
            attr_pat,
            lambda m: m.group(1) + esc(value) + m.group(2),
            html,
        )
        html = html2
        return n

    if put(r'(<meta name="description" content=").*?(")', desc) == 0:
        html = html.replace(
            "<title>",
            f'<meta name="description" content="{esc(desc)}">\n<title>',
            1,
        )
    put(r'(<meta property="og:title" content=").*?(")', title)
    put(r'(<meta property="og:description" content=").*?(")', desc)
    put(r'(<meta name="twitter:title" content=").*?(")', title)
    put(r'(<meta name="twitter:description" content=").*?(")', desc)
    return html


def set_canonical(html: str, url: str) -> str:
    if 'rel="canonical"' in html:
        html = re.sub(r'(<link rel="canonical" href=").*?(")', lambda m: m.group(1) + url + m.group(2), html, count=1)
    else:
        html = html.replace("</title>", f'</title>\n<link rel="canonical" href="{url}">', 1)
    if 'property="og:url"' in html:
        html = re.sub(r'(<meta property="og:url" content=").*?(")', lambda m: m.group(1) + url + m.group(2), html, count=1)
    else:
        html = html.replace('property="og:locale"', f'property="og:url" content="{url}">\n<meta property="og:locale"', 1)
    if 'property="og:type"' in html:
        html = re.sub(
            r'(<meta property="og:type" content=").*?(")',
            lambda m: m.group(1) + "article" + m.group(2),
            html,
            count=1,
        )
    return html


def json_script(obj) -> str:
    raw = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    raw = raw.replace("<", "\\u003c")
    return '<script type="application/ld+json">' + raw + "</script>"


def crumbs(items):
    """items: list of (name, url or None)."""
    lis = []
    graph = []
    for i, (name, url) in enumerate(items, 1):
        if url and i != len(items):
            lis.append(f'<li><a href="{url}">{esc(name)}</a></li>')
        else:
            lis.append(f'<li aria-current="page">{esc(name)}</li>')
        node = {"@type": "ListItem", "position": i, "name": name}
        if url:
            node["item"] = url if url.startswith("http") else None
        graph.append({k: v for k, v in node.items() if v is not None or k != "item"})
        if url and url.startswith("http"):
            graph[-1]["item"] = url
    nav = '<nav class="migas" aria-label="Migas de pan"><ol>' + "".join(lis) + "</ol></nav>"
    data = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": graph}
    return nav, data


def faq_block(pairs):
    html = []
    entities = []
    for q, a in pairs:
        html.append(f'<section class="faq-item"><h2>{q}</h2><p>{a}</p></section>')
        entities.append({
            "@type": "Question",
            "name": re.sub(r"<[^>]+>", "", q),
            "acceptedAnswer": {"@type": "Answer", "text": re.sub(r"<[^>]+>", "", a)},
        })
    data = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": entities}
    return "\n".join(html), data


def article_ld(title, desc, url):
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": desc,
        "inLanguage": "es",
        "datePublished": DATE,
        "dateModified": DATE,
        "mainEntityOfPage": url,
        "image": SITE + "/img/logo.jpg",
        "author": AUTHOR,
        "publisher": PUBLISHER,
    }


def related_nav(links, prefix):
    lis = "".join(f'<li><a href="{prefix}{href}">{esc(name)}</a></li>' for name, href in links)
    return (
        '<nav class="relacionadas panel" aria-label="Sigue con esto">'
        "<h2>Sigue con esto</h2><ul>"
        + lis
        + "</ul>"
        f'<p class="split"><a class="btn gold" href="{prefix}calculadora.html">Calculadora de rentabilidad</a> '
        f'<a class="btn sec" href="{prefix}app.html">App Registro de pollos</a> '
        f'<a class="btn sec" href="{prefix}curso.html">Curso gratis</a></p></nav>'
    )


def build_guide(shell, g):
    head, foot = shell
    head = prefix_urls(head, "../")
    foot = prefix_urls(foot, "../")
    head = head.replace('data-root=""', 'data-root="../"', 1)
    url = f"{SITE}/guias/{g['slug']}.html"
    title = g["title"]
    desc = g["description"]
    assert len(title) <= 60, (g["slug"], len(title), title)
    assert len(desc) <= 150, (g["slug"], len(desc), desc)
    head = set_title_desc(head, title, desc)
    head = set_canonical(head, url)
    crumbs_html, crumbs_ld = crumbs([
        ("Inicio", SITE + "/"),
        ("Guías", SITE + "/guias.html"),
        (g["crumb"], url),
    ])
    # visible crumbs use relative links
    crumbs_html = (
        '<nav class="migas" aria-label="Migas de pan"><ol>'
        '<li><a href="../index.html">Inicio</a></li>'
        '<li><a href="../guias.html">Guías</a></li>'
        f'<li aria-current="page">{esc(g["crumb"])}</li>'
        "</ol></nav>"
    )
    faq_html, faq_ld = faq_block(g["faq"])
    blocks = [json_script(article_ld(title, desc, url)), json_script(crumbs_ld), json_script(faq_ld)]
    if g.get("howto"):
        blocks.append(json_script(g["howto"]))
    head = head.replace("</head>", "\n".join(blocks) + "\n</head>", 1)
    body = f"""<main id="contenido">
{crumbs_html}
<article class="panel prose guia">
<p class="kicker">Guía</p>
<h1>{g["h1"]}</h1>
{g["html"]}
<h2>Preguntas frecuentes</h2>
{faq_html}
<h2>Fuentes</h2>
{g["fuentes"]}
</article>
{related_nav(g["relacionadas"], "../")}
</main>
"""
    n = words(g["html"] + faq_html + g["fuentes"])
    if not 1200 <= n <= 2000:
        raise SystemExit(f"{g['slug']}: {n} palabras (hace falta entre 1200 y 2000)")
    return head + body + foot, n


def write_guides(guides):
    shell = load_shell()
    out = ROOT / "guias"
    out.mkdir(exist_ok=True)
    counts = {}
    for g in guides:
        html, n = build_guide(shell, g)
        (out / f"{g['slug']}.html").write_text(html, encoding="utf-8")
        counts[g["slug"]] = n
    return counts
