#!/usr/bin/env python3
"""Comprueba la tanda 1 sobre el HTML público del repo.

    python3 tools/verificar-calidad.py

Falla si un título se repite, si una meta description sale de 120–155
(salvo tienda.html, bloqueado por regla), si falta el canonical o no es
absoluto, si una redirección interna no apunta a la canonical de su destino,
si falta og:image (salvo tienda.html) o si el sitemap incluye una URL noindex.
"""
import importlib.util
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
SITIO = "https://granjarentable.com"
EXENTA = "tienda.html"
SALTAR = ("blog/plantillas/", "blog/pruebas/")


def cargar_sitemap():
    ruta = Path(__file__).with_name("comprobar_sitemap.py")
    spec = importlib.util.spec_from_file_location("comprobar_sitemap", ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


def paginas():
    for ruta in sorted(RAIZ.rglob("*.html")):
        rel = ruta.relative_to(RAIZ).as_posix()
        if rel.startswith("_") or "/_" in rel or rel.startswith(SALTAR):
            continue
        yield rel, ruta


def titulo_de(texto):
    encontrado = re.search(r"<title>(.*?)</title>", texto, re.S)
    if not encontrado:
        return ""
    return re.sub(r"\s+", " ", encontrado.group(1)).strip()


def descripcion_de(texto):
    encontrado = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', texto, re.I)
    return encontrado.group(1) if encontrado else ""


def canonicals(texto):
    return re.findall(r'<link\s+rel="canonical"\s+href="([^"]*)"', texto, re.I)


def og_images(texto):
    return re.findall(r'<meta\s+property="og:image"\s+content="([^"]*)"', texto, re.I)


def destino_refresh(rel, texto):
    encontrado = re.search(r'http-equiv="refresh"[^>]*content="[^"]*url=([^"\']+)"', texto, re.I)
    if not encontrado:
        return None
    url = encontrado.group(1)
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return ((RAIZ / rel).parent / url).resolve().relative_to(RAIZ).as_posix()


def enlaces_rotos(rel, texto):
    rotos = []
    for href in re.findall(r'<a\s[^>]*href="([^"]+)"', texto, re.I):
        if href.startswith(("#", "mailto:", "tel:", "javascript:", "data:")):
            continue
        if href.startswith("http://") or href.startswith("https://"):
            if not href.startswith(SITIO):
                continue
            ruta = href[len(SITIO):]
        else:
            ruta = href
        ruta = ruta.split("#", 1)[0].split("?", 1)[0]
        if ruta in ("", "/"):
            candidato = RAIZ / "index.html"
        elif ruta.startswith("/"):
            candidato = RAIZ / ruta.lstrip("/")
        else:
            candidato = (RAIZ / rel).parent / ruta
        if ruta.endswith("/"):
            candidato = candidato / "index.html"
        try:
            candidato = candidato.resolve()
        except OSError:
            rotos.append(href)
            continue
        if not str(candidato).startswith(str(RAIZ.resolve())):
            continue
        if candidato.suffix == "" and (candidato / "index.html").is_file():
            continue
        if not candidato.is_file():
            # Acepta /tienda/ si existe tienda/index.html
            if (candidato / "index.html").is_file():
                continue
            rotos.append(href)
    return rotos


def main():
    fallos = []
    avisos = []
    textos = {}
    titulos = {}
    descripciones = {}
    for rel, ruta in paginas():
        texto = ruta.read_text(encoding="utf-8")
        textos[rel] = texto
        titulos.setdefault(titulo_de(texto), []).append(rel)
        descripciones.setdefault(descripcion_de(texto), []).append(rel)

    for titulo, rels in titulos.items():
        if not titulo:
            fallos.append("Sin <title>: " + ", ".join(rels))
        elif len(rels) > 1:
            fallos.append(f"Título repetido {titulo!r}: {', '.join(rels)}")

    for desc, rels in descripciones.items():
        if len(rels) > 1:
            fallos.append(f"Descripción repetida: {', '.join(rels)}")

    for rel, texto in textos.items():
        desc = descripcion_de(texto)
        if rel == EXENTA:
            avisos.append(f"{rel}: descripción de {len(desc)} caracteres, bloqueado por regla (no se edita el archivo).")
        elif not (120 <= len(desc) <= 155):
            fallos.append(f"{rel}: descripción de {len(desc)} caracteres (hace falta 120–155).")

        cans = canonicals(texto)
        if len(cans) != 1:
            fallos.append(f"{rel}: {len(cans)} canonical.")
        else:
            can = cans[0]
            if not can.startswith(SITIO) or can.startswith("http://") or "www." in can:
                fallos.append(f"{rel}: canonical incorrecto {can}")
        ogs = og_images(texto)
        if rel == EXENTA:
            if not ogs:
                avisos.append(f"{rel}: sin og:image, bloqueado por regla.")
        elif len(ogs) != 1 or not ogs[0].startswith(SITIO):
            fallos.append(f"{rel}: og:image {ogs or 'ausente'}")

        for href in enlaces_rotos(rel, texto):
            fallos.append(f"{rel}: enlace interno roto {href}")

    for rel, texto in textos.items():
        destino = destino_refresh(rel, texto)
        if not destino or destino.startswith("http"):
            continue
        if destino not in textos:
            fallos.append(f"{rel}: la redirección {destino} no es una página del repo.")
            continue
        origen = canonicals(texto)
        meta = canonicals(textos[destino])
        if origen and meta and origen[0] != meta[0]:
            fallos.append(f"{rel}: canonical {origen[0]} no es la de {destino} ({meta[0]}).")

    locs, noindex = cargar_sitemap().urls_noindex(RAIZ)
    for fallo in noindex:
        fallos.append("sitemap: " + fallo)

    print(f"Páginas: {len(textos)}. Sitemap: {len(locs)} URLs.")
    if avisos:
        print("Avisos:")
        for aviso in avisos:
            print(" - " + aviso)
    if fallos:
        print(f"Fallos: {len(fallos)}")
        for fallo in fallos:
            print(" - " + fallo)
        return 1
    print("Calidad: títulos únicos, descripciones en rango, canonical, og:image y sitemap sin noindex.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
