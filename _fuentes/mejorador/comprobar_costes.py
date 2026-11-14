"""Comprueba presupuesto, rutas y permanencia de las fórmulas existentes."""
import importlib.util
import re
import subprocess
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
from comprobar_piloto import Enlaces

RAIZ = Path(__file__).resolve().parents[2]
VIDEO = 'youtube/costes.html'
PRESUPUESTO = 'blog/costo-granja-avicola.html'
DOCENA = 'blog/cuanto-cuesta-producir-docena-huevos.html'
CALC = 'calculadora.html'
ENGORDE = 'blog/cuanto-cuesta-criar-100-pollos-engorde.html'
RUTAS = [VIDEO,PRESUPUESTO,DOCENA,CALC,ENGORDE]
spec = importlib.util.spec_from_file_location('generar_costes',RAIZ/'blog/generar.py')
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)
errores,construidos,_ = g.planificar(RAIZ)
assert not errores,errores
documentos = {r:construidos.get(r,(RAIZ/r).read_text()) for r in RUTAS}
arboles = {r:Enlaces(html) for r,html in documentos.items()}
def destino(origen,href):
    u = urlsplit(urljoin('https://granjarentable.com/'+origen,href))
    if u.scheme not in {'http','https'} or u.netloc!='granjarentable.com':
        return None
    rel = unquote(u.path).lstrip('/') or 'index.html'
    if rel.endswith('/'):
        rel += 'index.html'
    return rel,unquote(u.fragment)

aristas = [(VIDEO,PRESUPUESTO),(VIDEO,DOCENA),(VIDEO,CALC),(VIDEO,ENGORDE),
           (PRESUPUESTO,VIDEO),(PRESUPUESTO,DOCENA),(PRESUPUESTO,CALC),
           (PRESUPUESTO,ENGORDE),(DOCENA,VIDEO),(DOCENA,PRESUPUESTO),(DOCENA,CALC),
           (CALC,VIDEO),(CALC,PRESUPUESTO),(CALC,DOCENA)]
for origen,objetivo in aristas:
    assert any(destino(origen,a['href'])==(objetivo,'') for a in arboles[origen].enlaces),(origen,objetivo)
revisados = 0
for rel,arbol in arboles.items():
    assert len(re.findall(r'<h1\b',documentos[rel]))==1,rel
    for a in arbol.enlaces:
        d = destino(rel,a['href'])
        if not d:
            continue
        ruta,ancla = d
        assert ruta in construidos or (RAIZ/ruta).is_file(),(rel,a['href'])
        html = construidos.get(ruta)
        if html is None:
            html = (RAIZ/ruta).read_text()
        assert not ancla or ancla in Enlaces(html).ids,(rel,a['href'])
        revisados += 1
for frase in ('12-18 meses','840-1.305','vend[e] al doble','18-20 pollitos'):
    assert not re.search(frase,documentos[PRESUPUESTO]),frase
assert 'Wisconsin' in documentos[PRESUPUESTO] and 'Maryland' in documentos[PRESUPUESTO]
assert 'producto: incubadora-24egg-dual' not in (RAIZ/'_articulos/2026-10-27-costo-granja-avicola.md').read_text()
subprocess.run(['git','diff','--exit-code','HEAD','--','js/calculadora.js','js/calculadoras.js'],cwd=RAIZ,check=True,capture_output=True)
print(f'APTO: {len(RUTAS)} páginas, {len(aristas)} conexiones, {revisados} enlaces internos y cálculos JavaScript intactos.')
