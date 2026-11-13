#!/usr/bin/env python3
"""Valida el recorrido publicado/preparado y la persistencia en su generador."""
import importlib.util
import json
from pathlib import Path
from comprobar_piloto import Enlaces, destino

RAIZ = Path(__file__).resolve().parents[2]
ASINS = {'B00TXW0UQK', 'B00TXX20GW', 'B07MQW8MQK'}
GUIA = 'tsr/tsr-comederos-antirratas.html'
COMPARATIVA = 'comparativas/comparativa-comederos-pedal-antirratas.html'
ARTICULO = 'blog/reducir-desperdicio-pienso.html'
HOJA = 'hoja-registro-puesta.html'


def comprobar():
    errores = []
    spec = importlib.util.spec_from_file_location('tienda_comederos', RAIZ / '_fuentes/tienda/construir.py')
    tienda = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(tienda)
    productos = {p['asin']: p for p in tienda.armar(tienda.cargar()[0]) if p['asin'] in ASINS}
    catalogo = {p['asin']: p for p in json.loads((RAIZ / 'tienda/catalogo.json').read_text())}
    if productos.keys() != ASINS:
        raise ValueError('Faltan productos del recorrido en el origen')
    fichas = {asin: f"tienda/p/{p['slug']}/index.html" for asin, p in productos.items()}
    rutas = [GUIA, COMPARATIVA, ARTICULO, HOJA] + list(fichas.values())
    documentos = {rel: (RAIZ / rel).read_text() for rel in rutas}
    arboles = {rel: Enlaces(html) for rel, html in documentos.items()}

    def conecta(origen, objetivo):
        return any(destino(RAIZ / origen, a['href']) == (RAIZ / objetivo, '') for a in arboles[origen].enlaces)

    for origen, objetivo in [(GUIA, COMPARATIVA), (COMPARATIVA, GUIA),
                            (ARTICULO, GUIA), (GUIA, ARTICULO), (ARTICULO, HOJA)] + [
            par for ficha in fichas.values() for par in [(COMPARATIVA, ficha),
                (ficha, COMPARATIVA), (ficha, GUIA), (ficha, ARTICULO), (ficha, HOJA)]]:
        if not conecta(origen, objetivo):
            errores.append(f'Recorrido incompleto: {origen} → {objetivo}')
    for rel, arbol in arboles.items():
        for a in arbol.enlaces:
            d = destino(RAIZ / rel, a['href'])
            if d:
                archivo, ancla = d
                if not archivo.is_file() or (ancla and ancla not in Enlaces(archivo.read_text()).ids):
                    errores.append(f'{rel}: destino inexistente {a["href"]}')
    for asin, rel in fichas.items():
        p = productos[asin]
        html = documentos[rel]
        bloque = tienda.guia_comederos(p, '../../../')
        if html.count('data-guia-comederos') != 1 or bloque not in html:
            errores.append(f'{rel}: bloque ausente, duplicado o distinto del generador')
        elif html.index('data-guia-comederos') > html.index('class="t-compra"'):
            errores.append(f'{rel}: criterios después del botón comercial')
        for campo, titulo in [('explicacion', 'Qué es y para qué sirve'), ('recomendacion', 'Por qué lo recomendamos')]:
            if tienda.seccion_texto('data-' + campo, titulo, p[campo]) not in html:
                errores.append(f'{rel}: texto distinto del origen en {campo}')
            if catalogo[asin][campo] != p[campo]:
                errores.append(f'{rel}: catálogo distinto del origen en {campo}')
    if tienda.guia_comederos({'asin': 'OTRO'}, '../../../'):
        errores.append('El bloque se añade fuera de los tres ASIN previstos')
    fuente = (RAIZ / '_articulos/2026-11-07-reducir-desperdicio-pienso.md').read_text()
    if '../' + GUIA not in fuente or '../' + COMPARATIVA not in fuente:
        errores.append('Faltan los enlaces en el Markdown fuente')
    print(json.dumps({'paginas': len(rutas), 'enlaces_revisados': sum(len(a.enlaces) for a in arboles.values()),
                      'fichas': len(fichas), 'errores': errores}, ensure_ascii=False, indent=2))
    return bool(errores)


if __name__ == '__main__':
    raise SystemExit(comprobar())
