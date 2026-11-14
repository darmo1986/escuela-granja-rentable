#!/usr/bin/env python3
"""Inventario documental de una salida HTML; no puntúa ni garantiza AdSense.

Uso: python3 auditar_adsense.py RAIZ_SITIO SALIDA_JSON
Ejecutar sobre una copia ya generada, nunca confundirla con producción.
"""
import argparse
from collections import Counter
from datetime import datetime, timezone
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET


class Documento(HTMLParser):
    VACIOS = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
    OMITIR = {'script', 'style', 'nav', 'header', 'footer', 'aside'}

    def __init__(self, html):
        super().__init__()
        self.pila = []
        self.texto = []
        self.titulo = []
        self.meta = {}
        self.canonica = ''
        self.enlaces = []
        self.ids = set()
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get('id'):
            self.ids.add(a['id'])
        if tag == 'meta' and a.get('name'):
            self.meta[a['name'].lower()] = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonica = a.get('href', '')
        if tag == 'a' and a.get('href'):
            self.enlaces.append(a['href'])
        if tag not in self.VACIOS:
            self.pila.append(tag)

    def handle_endtag(self, tag):
        if tag in self.pila:
            self.pila = self.pila[:len(self.pila) - 1 - self.pila[::-1].index(tag)]

    def handle_data(self, data):
        if 'title' in self.pila:
            self.titulo.append(data)
        if 'main' in self.pila and not self.OMITIR.intersection(self.pila):
            self.texto.append(data)


def auditar(raiz):
    urls = [e.text for e in ET.parse(raiz / 'sitemap.xml').getroot().findall('{*}url/{*}loc')]
    paginas = []
    arboles = {}
    errores = []
    for url in urls:
        u = urlsplit(url)
        if u.hostname != 'granjarentable.com':
            errores.append({'url': url, 'problema': 'Host ajeno en sitemap'})
            continue
        rel = unquote(u.path).lstrip('/')
        rel = rel + 'index.html' if not rel or rel.endswith('/') else rel
        ruta = raiz / rel
        if not ruta.is_file():
            errores.append({'url': url, 'problema': 'Archivo ausente en la salida'})
            continue
        html = ruta.read_text(encoding='utf-8')
        d = Documento(html)
        arboles[rel] = d
        texto = re.sub(r'\s+', ' ', ' '.join(d.texto)).strip()
        tipo = ('articulo' if rel.startswith('blog/') and re.search(r'"@type"\s*:\s*"(?:Article|BlogPosting)"', html)
                else 'ficha' if rel.startswith('tienda/p/') else 'otra')
        paginas.append({'url': url, 'archivo': rel, 'tipo': tipo,
                        'titulo': ''.join(d.titulo).strip(), 'palabras_main': len(texto.split()),
                        'descripcion': bool(d.meta.get('description')), 'robots': d.meta.get('robots', ''),
                        'canonica': d.canonica, 'enlaces_amazon': sum('amazon.com/' in x for x in d.enlaces),
                        'huella_main': sha256(texto.encode()).hexdigest()})
    for rel, d in arboles.items():
        for href in d.enlaces:
            u = urlsplit(href)
            if ((u.netloc and u.hostname != 'granjarentable.com')
                    or (u.scheme and u.scheme not in ('http', 'https'))):
                continue
            p = ((raiz / unquote(u.path).lstrip('/')) if u.netloc or u.path.startswith('/')
                 else (raiz / rel).parent / unquote(u.path) if u.path else raiz / rel).resolve()
            if not p.is_relative_to(raiz.resolve()):
                errores.append({'archivo': rel, 'enlace': href, 'problema': 'Sale de la raíz'})
                continue
            if p.is_dir():
                p /= 'index.html'
            if not p.is_file():
                errores.append({'archivo': rel, 'enlace': href, 'problema': 'Destino interno ausente'})
            elif u.fragment and p.suffix == '.html':
                destino = arboles.get(p.relative_to(raiz).as_posix()) or Documento(p.read_text())
                if unquote(u.fragment) not in destino.ids:
                    errores.append({'archivo': rel, 'enlace': href, 'problema': 'Ancla ausente'})
    return {'fecha_utc': datetime.now(timezone.utc).isoformat(),
            'alcance': 'Copia de código generada; sin comprobación HTTP de cada URL ni acceso a AdSense.',
            'criterio': 'Recuentos e incidencias técnicas, no una evaluación automática de calidad ni de aprobación.',
            'resumen': {'urls_sitemap': len(urls), 'paginas_revisadas': len(paginas),
                        'tipos': dict(Counter(p['tipo'] for p in paginas)), 'errores_tecnicos': len(errores)},
            'paginas': paginas, 'errores': errores}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('raiz', type=Path)
    parser.add_argument('salida', type=Path)
    args = parser.parse_args()
    informe = auditar(args.raiz.resolve())
    args.salida.write_text(json.dumps(informe, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(informe['resumen'], ensure_ascii=False))
