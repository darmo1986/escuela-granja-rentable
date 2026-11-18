#!/usr/bin/env python3
"""Comprueba las imágenes locales de la tienda antes del despliegue.

Uso: python3 scripts/verificar-imagenes-tienda.py
Solo biblioteca estándar. Sale con código 1 si hay archivos ausentes o vacíos.
"""
from html.parser import HTMLParser
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "tienda" / "index.html"

class Images(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []
        self.in_card = False
        self.depth = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "article" and "t-card" in a.get("class", "").split():
            self.in_card = True
            self.depth = 1
        elif self.in_card and tag == "article":
            self.depth += 1
        if self.in_card and tag == "img" and "t-foto" not in a.get("class", ""):
            src = a.get("src", "")
            if src.startswith("../img/productos/"):
                self.images.append(src)

    def handle_endtag(self, tag):
        if self.in_card and tag == "article":
            self.depth -= 1
            if self.depth <= 0:
                self.in_card = False

def main():
    parser = Images()
    parser.feed(PAGE.read_text(encoding="utf-8"))
    missing = []
    empty = []
    for src in parser.images:
        target = (PAGE.parent / src).resolve()
        if not target.is_relative_to(ROOT):
            missing.append(src + " (fuera del repositorio)")
        elif not target.is_file():
            missing.append(src)
        elif target.stat().st_size == 0:
            empty.append(src)
    duplicate = sorted({src for src in parser.images if parser.images.count(src) > 1})
    print(f"Imágenes revisadas: {len(parser.images)}; ausentes: {len(missing)}; vacías: {len(empty)}; rutas duplicadas: {len(duplicate)}")
    for label, paths in (("AUSENTE", missing), ("VACÍA", empty), ("DUPLICADA", duplicate)):
        for src in paths:
            print(f"{label}: {src}")
    return int(bool(missing or empty or duplicate or not parser.images))

if __name__ == "__main__":
    sys.exit(main())
