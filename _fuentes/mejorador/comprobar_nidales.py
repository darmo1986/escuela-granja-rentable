#!/usr/bin/env python3
"""Valida el recorrido guía ↔ comparativa ↔ ficha de nidales."""
import importlib.util
import json
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from comprobar_piloto import Enlaces, destino

RAIZ = Path(__file__).resolve().parents[2]
ASIN = "B0DLTMQJ77"
GUIA = "blog/problemas-gallinero-picaje-huevos-rotos-humedad.html"
FUENTE_GUIA = "_articulos/2026-11-09-problemas-gallinero-picaje-huevos-rotos-humedad.md"
ANCLA_GUIA = "apartado-2-huevos-rotos-dentro-del-nidal"
COMPARATIVA = "comparativas/nidales.html"


def comprobar():
    errores = []
    spec = importlib.util.spec_from_file_location(
        "tienda_nidales", RAIZ / "_fuentes/tienda/construir.py")
    tienda = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(tienda)
    productos = [p for p in tienda.armar(tienda.cargar()[0]) if p["asin"] == ASIN]
    if len(productos) != 1:
        raise ValueError("Falta la ficha enlazada por la comparativa de nidales")
    producto = productos[0]
    ficha = f"tienda/p/{producto['slug']}/index.html"
    rutas = [GUIA, COMPARATIVA, ficha]
    documentos = {rel: (RAIZ / rel).read_text() for rel in rutas}
    arboles = {rel: Enlaces(html) for rel, html in documentos.items()}

    def conecta(origen, objetivo, ancla=""):
        return any(destino(RAIZ / origen, a["href"]) == (RAIZ / objetivo, ancla)
                   for a in arboles[origen].enlaces)

    pares = [
        (GUIA, COMPARATIVA, ""),
        (COMPARATIVA, GUIA, ANCLA_GUIA),
        (COMPARATIVA, ficha, ""),
        (ficha, GUIA, ANCLA_GUIA),
        (ficha, COMPARATIVA, ""),
    ]
    for origen, objetivo, ancla in pares:
        if not conecta(origen, objetivo, ancla):
            errores.append(f"Recorrido incompleto: {origen} → {objetivo}#{ancla}")

    for rel, arbol in arboles.items():
        html = documentos[rel]
        if '<meta name="viewport"' not in html or '<link rel="canonical"' not in html:
            errores.append(f"{rel}: faltan metadatos básicos")
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

    bloque = tienda.guia_nidales(producto, "../../../")
    if documentos[ficha].count("data-guia-nidales") != 1 or bloque not in documentos[ficha]:
        errores.append(f"{ficha}: bloque ausente, duplicado o distinto del generador")
    elif documentos[ficha].index("data-guia-nidales") > documentos[ficha].index('class="t-compra"'):
        errores.append(f"{ficha}: la ayuda aparece después de la compra")
    if tienda.guia_nidales({"asin": "OTRO"}, "../../../"):
        errores.append("El bloque invade productos fuera de la ficha enlazada")
    fuente = (RAIZ / FUENTE_GUIA).read_text()
    if "../comparativas/nidales.html" not in fuente:
        errores.append("El enlace de la guía falta en su Markdown fuente")

    print(json.dumps({
        "paginas": len(rutas),
        "enlaces_revisados": sum(len(a.enlaces) for a in arboles.values()),
        "recorrido": "guía ↔ comparativa ↔ ficha",
        "errores": errores,
    }, ensure_ascii=False, indent=2))
    return bool(errores)


if __name__ == "__main__":
    raise SystemExit(comprobar())
