#!/usr/bin/env python3
"""Comprueba el sitio construido antes de subir el artefacto a Pages."""
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


class Destacados(HTMLParser):
    def __init__(self):
        super().__init__()
        self.primero = None

    def handle_starttag(self, tag, attrs):
        datos = dict(attrs)
        if self.primero is None and tag == 'a' and 'data-slide' in datos:
            self.primero = datos


class EnlacesAmazon(HTMLParser):
    def __init__(self):
        super().__init__()
        self.heredados = []

    def handle_starttag(self, tag, attrs):
        if tag != 'a':
            return
        href = dict(attrs).get('href', '')
        url = urlsplit(href)
        if url.hostname in {'www.amazon.com', 'amazon.com'} and url.path.startswith('/product-reviews/'):
            self.heredados.append(href)


def verificar_salida(destino, version, posts, categorias):
    destino = Path(destino)
    errores = []
    index = destino / 'index.html'
    if not index.is_file():
        return ['Falta index.html en el sitio construido.']
    html = index.read_text(encoding='utf-8')
    lector = Destacados()
    lector.feed(html)
    primero = lector.primero or {}
    if primero.get('href') != 'razas.html' or 'is-active' not in primero.get('class', '').split():
        errores.append('Razas debe ser el primer destacado y estar activo al inicio.')
    visibles = [p for p in posts if p.get('publicar') and not p.get('noindex')]
    recientes = re.search(r'<section[^>]*aria-labelledby="recientes-titulo"[^>]*>(.*?)</section>', html, re.S)
    tarjetas = re.findall(r'class="gr-article"', recientes.group(1)) if recientes else []
    if len(tarjetas) != min(3, len(visibles)):
        errores.append('La portada no contiene las novedades regeneradas.')
    paginas = [index]
    for post in posts:
        if not post.get('publicar'):
            continue
        pagina = destino / 'blog' / (post['slug'] + '.html')
        if not pagina.is_file():
            errores.append('Falta el artículo publicado: ' + post['slug'])
        else:
            paginas.append(pagina)
    for slug in categorias:
        if not (destino / 'blog' / (slug + '.html')).is_file():
            errores.append('Falta la categoría: ' + slug)
    for pagina in paginas:
        texto = pagina.read_text(encoding='utf-8')
        for asset in ['config', 'app', 'site']:
            if not re.search(r'js/' + asset + r'\.js\?v=' + re.escape(version) + r'["\']', texto):
                errores.append(str(pagina.relative_to(destino)) + ': versión común ausente en ' + asset + '.js')
    for pagina in (destino / 'tienda').rglob('*.html'):
        enlaces = EnlacesAmazon()
        enlaces.feed(pagina.read_text(encoding='utf-8'))
        if enlaces.heredados:
            errores.append(str(pagina.relative_to(destino)) + ': quedan destinos product-reviews heredados')
    for privado in ['_articulos', '_fuentes', 'blog/plantillas', 'blog/pruebas', 'blog/generar.py', 'blog/verificar_publicacion.py']:
        if (destino / privado).exists():
            errores.append('El sitio construido contiene una fuente interna: ' + privado)
    return errores


def main():
    from generar import VERSION_ACTIVOS, CATEGORIAS, cargar_posts
    raiz = Path(__file__).resolve().parents[1]
    posts, errores = cargar_posts(raiz, False)
    if not errores:
        errores = verificar_salida(raiz / (sys.argv[1] if len(sys.argv) > 1 else '_site'), VERSION_ACTIVOS, posts, [c[2] for c in CATEGORIAS])
    if errores:
        print('\n'.join(errores), file=sys.stderr)
        return 1
    print('Sitio construido verificado: artículos, categorías, novedades, Razas inicial, versiones y exclusión de fuentes.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
