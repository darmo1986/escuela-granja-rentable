#!/usr/bin/env python3
"""Valida el recorrido guía ↔ comparativa ↔ fichas de puertas."""
import importlib.util
import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from comprobar_piloto import Enlaces, destino

RAIZ = Path(__file__).resolve().parents[2]
ASINS = {"B07G9MPCKT", "B0CWXWX52L"}
GUIA = "blog/corral-anti-depredadores.html"
FUENTE_GUIA = "_articulos/2026-11-17-corral-anti-depredadores.md"
COMPARATIVA = "comparativas/puertas.html"


def comprobar():
    errores = []
    spec = importlib.util.spec_from_file_location(
        "tienda_puertas", RAIZ / "_fuentes/tienda/construir.py")
    tienda = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(tienda)
    productos = {p["asin"]: p for p in tienda.armar(tienda.cargar()[0])
                 if p["asin"] in ASINS}
    if productos.keys() != ASINS:
        raise ValueError("Faltan las dos puertas del recorrido en el origen")
    fichas = {asin: f"tienda/p/{p['slug']}/index.html"
              for asin, p in productos.items()}
    rutas = [GUIA, COMPARATIVA] + list(fichas.values())
    documentos = {rel: (RAIZ / rel).read_text() for rel in rutas}
    arboles = {rel: Enlaces(html) for rel, html in documentos.items()}

    def conecta(origen, objetivo):
        return any(destino(RAIZ / origen, a["href"]) == (RAIZ / objetivo, "")
                   for a in arboles[origen].enlaces)

    pares = [(GUIA, COMPARATIVA), (COMPARATIVA, GUIA)]
    pares += [par for ficha in fichas.values()
              for par in ((COMPARATIVA, ficha), (ficha, COMPARATIVA),
                          (ficha, GUIA))]
    for origen, objetivo in pares:
        if not conecta(origen, objetivo):
            errores.append(f"Recorrido incompleto: {origen} → {objetivo}")

    for rel, arbol in arboles.items():
        for a in arbol.enlaces:
            url = urlsplit(a["href"])
            if url.hostname and "amazon" in url.hostname:
                rels = set(a.get("rel", "").split())
                if (url.hostname != "www.amazon.com"
                        or parse_qs(url.query).get("tag") != ["granjarentabl-20"]
                        or not {"sponsored", "nofollow", "noopener"}.issubset(rels)):
                    errores.append(f"{rel}: enlace Amazon no válido: {a['href']}")
            local = destino(RAIZ / rel, a["href"])
            if local:
                archivo, ancla = local
                if not archivo.is_file():
                    errores.append(f"{rel}: destino inexistente: {a['href']}")
                elif ancla and ancla not in Enlaces(archivo.read_text()).ids:
                    errores.append(f"{rel}: ancla inexistente: {a['href']}")

    for asin, rel in fichas.items():
        html = documentos[rel]
        bloque = tienda.guia_puertas(productos[asin], "../../../")
        if html.count("data-guia-puertas") != 1 or bloque not in html:
            errores.append(f"{rel}: bloque ausente, duplicado o distinto del generador")
        elif html.index("data-guia-puertas") > html.index('class="t-compra"'):
            errores.append(f"{rel}: la ayuda aparece después de la compra")
    if tienda.guia_puertas({"asin": "OTRO"}, "../../../"):
        errores.append("El bloque invade productos fuera de las dos fichas")
    fuente = (RAIZ / FUENTE_GUIA).read_text()
    if "../comparativas/puertas.html" not in fuente:
        errores.append("El enlace de la guía falta en su Markdown fuente")

    print(json.dumps({
        "paginas": len(rutas),
        "enlaces_revisados": sum(len(a.enlaces) for a in arboles.values()),
        "recorrido": "guía ↔ comparativa ↔ dos fichas",
        "errores": errores,
    }, ensure_ascii=False, indent=2))
    return bool(errores)


if __name__ == "__main__":
    raise SystemExit(comprobar())
