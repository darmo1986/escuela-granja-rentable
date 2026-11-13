#!/usr/bin/env python3
"""Retira botones de reseñas heredados sin regenerar textos ni imágenes de tienda.

Solo se elimina el botón si el mismo bloque conserva un botón al mismo ASIN,
con el tag autorizado. Valida todos los archivos antes de escribir ninguno.
No consulta Amazon ni publica el sitio.
"""
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

TAG = 'granjarentabl-20'
BLOQUE = re.compile(r'(<div class="t-acciones">)(.*?)(</div>)', re.S)
ANCLA = re.compile(r'<a\b[^>]*>.*?</a>', re.S)


class Enlaces(HTMLParser):
    def __init__(self, texto):
        super().__init__()
        self.enlaces = []
        self.feed(texto)

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            self.enlaces.append(dict(attrs))


def asin_autorizado(attrs, tipo):
    url = urlsplit(attrs.get('href', ''))
    m = re.fullmatch(r'/' + tipo + r'/([A-Z0-9]{10})/?', url.path)
    if (url.scheme != 'https' or url.netloc != 'www.amazon.com' or not m
            or parse_qs(url.query).get('tag') != [TAG]
            or not {'sponsored', 'nofollow', 'noopener'}.issubset(attrs.get('rel', '').split())
            or attrs.get('target') != '_blank'):
        raise ValueError('Botón heredado o principal con destino/permisos inesperados')
    return m.group(1)


def limpiar(html):
    retirados = 0

    def bloque(m):
        nonlocal retirados
        contenido = m.group(2)
        enlaces = Enlaces(contenido).enlaces
        principales = [a for a in enlaces if 't-amazon' in a.get('class', '').split()]
        antiguos = [a for a in enlaces if 't-resenas' in a.get('class', '').split()]
        if not antiguos:
            return m.group(0)
        if len(principales) != 1 or len(antiguos) != 1:
            raise ValueError('El bloque heredado no tiene un principal y una reseña')
        if asin_autorizado(principales[0], 'dp') != asin_autorizado(antiguos[0], 'product-reviews'):
            raise ValueError('El botón principal y la reseña apuntan a ASIN distintos')

        def ancla(a):
            attrs = Enlaces(a.group(0)).enlaces[0]
            if 't-resenas' in attrs.get('class', '').split():
                return ''
            return a.group(0)

        retirados += 1
        return m.group(1) + ANCLA.sub(ancla, contenido) + m.group(3)

    resultado = BLOQUE.sub(bloque, html)
    for a in Enlaces(resultado).enlaces:
        url = urlsplit(a.get('href', ''))
        if url.hostname in {'www.amazon.com', 'amazon.com'} and url.path.startswith('/product-reviews/'):
            raise ValueError('Queda un enlace de reseñas fuera del patrón seguro')
    return resultado, retirados


def procesar(raiz):
    cambios = []
    total = 0
    for ruta in sorted((Path(raiz) / 'tienda').rglob('*.html')):
        original = ruta.read_text(encoding='utf-8')
        try:
            nuevo, retirados = limpiar(original)
        except ValueError as e:
            raise ValueError(f'{ruta.relative_to(raiz)}: {e}') from e
        if nuevo != original:
            cambios.append((ruta, nuevo))
            total += retirados
    for ruta, nuevo in cambios:
        ruta.write_text(nuevo, encoding='utf-8')
    return len(cambios), total


if __name__ == '__main__':
    paginas, botones = procesar(Path(__file__).resolve().parents[2])
    print(f'Tienda: {botones} botones heredados retirados en {paginas} páginas; se conserva el destino de producto.')
