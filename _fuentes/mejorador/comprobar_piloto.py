#!/usr/bin/env python3
"""Comprueba el recorrido de bebederos sin publicar ni consultar servicios."""
import importlib.util
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit

RAIZ = Path(__file__).resolve().parents[2]
GUIA = "blog/agua-gallinas-ponedoras-bebederos.html"
COMPARATIVA = "comparativas/comparativa-bebederos-tetina-vs-colgante.html"
ASINS = {"B016AFYT4Q", "B07RB7GLJH", "B00P9EJLSO"}


class Enlaces(HTMLParser):
    def __init__(self, texto):
        super().__init__()
        self.enlaces = []
        self.ids = set()
        self.feed(texto)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        if tag == "a" and attrs.get("href"):
            self.enlaces.append(attrs)


def destino(origen, href):
    url = urlsplit(href)
    if url.scheme or url.netloc:
        return None
    ruta = unquote(url.path)
    archivo = (RAIZ / ruta.lstrip("/") if ruta.startswith("/")
               else origen.parent / ruta if ruta else origen).resolve()
    if archivo.is_dir():
        archivo /= "index.html"
    return archivo, unquote(url.fragment)


def comprobar():
    errores = []
    catalogo = json.loads((RAIZ / "tienda/catalogo.json").read_text())
    elegidos = [p for p in catalogo if p["asin"] in ASINS]
    if {p["asin"] for p in elegidos} != ASINS:
        errores.append("Falta uno de los tres ASIN del piloto en el catálogo.")
    fichas = [f"tienda/p/{p['slug']}/index.html" for p in elegidos]
    rutas = [GUIA, COMPARATIVA] + fichas
    documentos = {rel: (RAIZ / rel).read_text() for rel in rutas}
    arboles = {rel: Enlaces(html) for rel, html in documentos.items()}
    for rel, arbol in arboles.items():
        for a in arbol.enlaces:
            url = urlsplit(a["href"])
            if url.hostname and "amazon" in url.hostname:
                if (url.hostname != "www.amazon.com" or not url.path.startswith("/dp/")
                        or parse_qs(url.query).get("tag") != ["granjarentabl-20"]
                        or not {"sponsored", "nofollow", "noopener"}.issubset(a.get("rel", "").split())):
                    errores.append(f"{rel}: enlace Amazon no válido: {a['href']}")
            d = destino(RAIZ / rel, a["href"])
            if d:
                archivo, ancla = d
                if not archivo.is_file():
                    errores.append(f"{rel}: destino inexistente: {a['href']}")
                elif ancla and ancla not in Enlaces(archivo.read_text()).ids:
                    errores.append(f"{rel}: ancla inexistente: {a['href']}")

    def conecta(origen, objetivo):
        return any(destino(RAIZ / origen, a["href"]) == (RAIZ / objetivo, "")
                   for a in arboles[origen].enlaces)

    for origen, objetivo in [(GUIA, COMPARATIVA), (COMPARATIVA, GUIA)] + [
        par for ficha in fichas for par in [(COMPARATIVA, ficha), (ficha, GUIA), (ficha, COMPARATIVA)]
    ]:
        if not conecta(origen, objetivo):
            errores.append(f"Recorrido incompleto: {origen} → {objetivo}")
    spec = importlib.util.spec_from_file_location("construir_tienda", RAIZ / "_fuentes/tienda/construir.py")
    tienda = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(tienda)
    for p in elegidos:
        rel = f"tienda/p/{p['slug']}/index.html"
        if tienda.guia_bebederos(p, "../../../") not in documentos[rel]:
            errores.append(f"{rel}: el HTML no coincide con su generador.")
    if tienda.guia_bebederos({"asin": "OTRO"}, "../../../"):
        errores.append("La mejora invade productos fuera del piloto.")
    fuente = RAIZ / "_articulos/2026-11-09-agua-gallinas-ponedoras-bebederos.md"
    if "../" + COMPARATIVA not in fuente.read_text():
        errores.append("El enlace de la guía falta en el Markdown fuente.")
    print(json.dumps({"paginas": len(rutas), "enlaces_revisados": sum(len(a.enlaces) for a in arboles.values()),
                      "recorrido": "guía ↔ comparativa ↔ tres fichas", "errores": errores}, ensure_ascii=False, indent=2))
    return bool(errores)


if __name__ == "__main__":
    raise SystemExit(comprobar())
