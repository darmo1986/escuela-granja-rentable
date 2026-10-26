#!/usr/bin/env python3
"""Falla si sitemap.xml incluye una URL cuya página es noindex.

Sirve para la tanda de calidad y para repetir el control a mano:
    python3 tools/comprobar_sitemap.py
"""
import re
import sys
from pathlib import Path

SITIO = "https://granjarentable.com"


def candidatos(url):
    ruta = url.split("?", 1)[0].strip()
    if not ruta.startswith(SITIO):
        return []
    rel = ruta[len(SITIO):]
    if rel in ("", "/"):
        return ["index.html"]
    rel = rel.lstrip("/")
    if rel.endswith("/"):
        base = rel.rstrip("/")
        return [rel + "index.html", base + ".html"]
    opciones = [rel]
    if not rel.endswith(".html"):
        opciones.append(rel + "/index.html")
        opciones.append(rel + ".html")
    return opciones


def urls_noindex(raiz):
    raiz = Path(raiz)
    texto = (raiz / "sitemap.xml").read_text(encoding="utf-8")
    locs = re.findall(r"<loc>\s*([^<]+?)\s*</loc>", texto)
    fallos = []
    for url in locs:
        encontrado = None
        for candidato in candidatos(url):
            archivo = raiz / candidato
            if archivo.is_file():
                encontrado = archivo
                break
        if encontrado is None:
            fallos.append(f"{url}: no hay archivo en el repo")
            continue
        html = encontrado.read_text(encoding="utf-8", errors="replace")
        meta = re.search(r'<meta\s+name=["\']robots["\']\s+content=["\']([^"\']*)["\']', html, re.I)
        if meta and "noindex" in meta.group(1).lower():
            fallos.append(f"{url}: noindex ({meta.group(1)}) en {encontrado.relative_to(raiz)}")
    return locs, fallos


def main(argv=None):
    raiz = Path(__file__).resolve().parents[1]
    if argv and argv[0:1]:
        raiz = Path(argv[0])
    locs, fallos = urls_noindex(raiz)
    if fallos:
        print("El sitemap incluye URLs noindex o sin archivo:", file=sys.stderr)
        for fallo in fallos:
            print(" - " + fallo, file=sys.stderr)
        return 1
    print(f"sitemap: {len(locs)} URLs, ninguna es noindex.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
