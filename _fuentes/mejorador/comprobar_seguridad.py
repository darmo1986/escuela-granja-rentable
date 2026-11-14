"""Verifica el recorrido de seguridad sin llamar a servicios externos."""
import importlib.util
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit

RAIZ = Path(__file__).resolve().parents[2]
PAGINAS = ["blog/corral-anti-depredadores.html"] + [
    f"tienda/c/{slug}/index.html" for slug in
    ("malla-y-vallas", "puertas-automaticas-y-cierres", "almacenaje-de-pienso")
]

class Enlaces(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.enlaces = []
        self.feed(html)
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.enlaces.append(dict(attrs))

def cargar(nombre, archivo):
    spec = importlib.util.spec_from_file_location(nombre, RAIZ / archivo)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo

g = cargar("generar_seguridad", "blog/generar.py")
t = cargar("tienda_seguridad", "_fuentes/tienda/construir.py")
errores, construidos, _ = g.planificar(RAIZ)
assert not errores, errores
assert t.orientacion_seguridad("Comederos", "../../../") == ""
assert t.orientacion_seguridad("Pienso", "../../../") == ""
for categoria in ("Malla y vallas", "Puertas automáticas y cierres", "Almacenaje de pienso"):
    bloque = t.orientacion_seguridad(categoria, "../../../")
    assert bloque.count("data-orientacion-seguridad") == 1
    assert "blog/corral-anti-depredadores.html" in bloque

revisados = 0
for rel in PAGINAS:
    html = construidos.get(rel, (RAIZ / rel).read_text())
    if rel.startswith("tienda/"):
        assert html.count("data-orientacion-seguridad") == 1, rel
        anterior = subprocess.check_output(["git", "show", "HEAD:" + rel], cwd=RAIZ, text=True)
        def primarios(texto):
            return [a for a in Enlaces(texto).enlaces if "amazon.com/dp/" in a.get("href", "")]
        assert primarios(html) == primarios(anterior), f"Enlaces comerciales modificados: {rel}"
    for enlace in Enlaces(html).enlaces:
        href = enlace.get("href", "")
        u = urlsplit(urljoin("https://granjarentable.com/" + rel, href))
        if u.scheme not in {"http", "https"} or u.netloc != "granjarentable.com":
            continue
        destino = unquote(u.path).lstrip("/") or "index.html"
        if destino.endswith("/"):
            destino += "index.html"
        assert destino in construidos or (RAIZ / destino).is_file(), (rel, href)
        contenido = construidos.get(destino)
        if contenido is None:
            contenido = (RAIZ / destino).read_text()
        if u.fragment:
            assert re.search(r'id=[\"\x27]' + re.escape(unquote(u.fragment)) + r'[\"\x27]', contenido), (rel, href)
        revisados += 1
articulo = construidos[PAGINAS[0]]
for frase in ("es la inversión que más ataques evita", "un zorro no la rompe", "La mayoría de los ataques nocturnos"):
    assert frase not in articulo
assert "University of Maryland" in articulo and "Meyer Hatchery" in articulo
print(f"APTO: {len(PAGINAS)} páginas, {revisados} enlaces internos, tres categorías y destinos Amazon intactos.")
