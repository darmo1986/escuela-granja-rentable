"""Valida los recorridos de alimentación sin enviar métricas ni peticiones."""
import importlib.util
import re
import subprocess
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
from comprobar_piloto import Enlaces

RAIZ = Path(__file__).resolve().parents[2]
VIDEO = 'youtube/alimentacion.html'
ETIQUETA = 'blog/leer-etiqueta-pienso-aves.html'
ALMACEN = 'blog/almacenar-pienso-gallinas.html'
PIENSO = 'tienda/c/pienso/index.html'
RECIPIENTES = 'tienda/c/almacenaje-de-pienso/index.html'
RUTAS = [VIDEO, ETIQUETA, ALMACEN, PIENSO, RECIPIENTES]

def cargar(nombre, ruta):
    spec = importlib.util.spec_from_file_location(nombre, RAIZ / ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo

def normalizar(origen, href):
    url = urlsplit(urljoin('https://granjarentable.com/' + origen, href))
    if url.scheme not in {'http', 'https'} or url.netloc != 'granjarentable.com':
        return None
    ruta = unquote(url.path).lstrip('/') or 'index.html'
    if ruta.endswith('/'):
        ruta += 'index.html'
    return ruta, unquote(url.fragment)

g = cargar('blog_alimentacion', 'blog/generar.py')
t = cargar('tienda_alimentacion', '_fuentes/tienda/construir.py')
errores, construidos, _ = g.planificar(RAIZ)
assert not errores, errores
documentos = {r: construidos.get(r, (RAIZ/r).read_text()) for r in RUTAS}
arboles = {r: Enlaces(html) for r,html in documentos.items()}
aristas = [(VIDEO,ETIQUETA),(VIDEO,ALMACEN),(VIDEO,PIENSO),(VIDEO,RECIPIENTES),
           (ETIQUETA,VIDEO),(ETIQUETA,PIENSO),(ALMACEN,VIDEO),(ALMACEN,RECIPIENTES),
           (PIENSO,ETIQUETA),(PIENSO,ALMACEN),(PIENSO,VIDEO),(RECIPIENTES,ALMACEN),(RECIPIENTES,VIDEO)]
for origen,destino in aristas:
    assert any(normalizar(origen,a['href']) == (destino,'') for a in arboles[origen].enlaces), (origen,destino)
enlaces = 0
for rel,arbol in arboles.items():
    for a in arbol.enlaces:
        d = normalizar(rel,a['href'])
        if not d:
            continue
        destino,ancla = d
        assert destino in construidos or (RAIZ/destino).is_file(), (rel,a['href'])
        html = construidos.get(destino)
        if html is None:
            html = (RAIZ/destino).read_text()
        assert not ancla or ancla in Enlaces(html).ids, (rel,a['href'])
        enlaces += 1
    if rel.startswith('tienda/'):
        antes = subprocess.check_output(['git','show','HEAD:'+rel],cwd=RAIZ,text=True)
        def comerciales(html):
            return [a for a in Enlaces(html).enlaces if 'amazon.com/dp/' in a['href']]
        assert comerciales(antes) == comerciales(documentos[rel]), rel
assert t.orientacion_alimentacion('Comederos','../../../') == ''
assert t.orientacion_alimentacion('Almacenaje de pienso','../../../') == ''
assert documentos[PIENSO].count('data-orientacion-alimentacion') == 1
grupo = [p for p in t.armar(t.cargar()[0]) if p['categoria']=='Pienso']
medicados = [p for p in grupo if 'medicad' in p['titulo'].lower()]
assert medicados and all(p['vet'] for p in medicados), 'Se conservan los avisos de los piensos etiquetados como medicados'
assert 't-vet' in documentos[PIENSO]
assert len(re.findall(r'<h1\b',documentos[VIDEO])) == 1
print(f'APTO: {len(RUTAS)} páginas, {len(aristas)} conexiones, {enlaces} enlaces internos y destinos comerciales intactos.')
