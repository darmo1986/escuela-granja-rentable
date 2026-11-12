"""Comprobaciones del índice público del buscador del blog."""
import importlib.util
import json
import re
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("generar_buscar", Path(__file__).resolve().parents[1] / "generar.py")
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)


def entrada(slug="pollitos", **extra):
    datos = dict(slug=slug, titulo="Alimentación de pollitos", descripcion="Compara etiquetas", categoria="alimentacion", publicar=True, noindex=False)
    datos.update(extra)
    return datos


class Buscador(unittest.TestCase):
    def indice(self, html):
        bloque = re.search(r'<script type="application/json" data-blog-indice>(.*?)</script>', html, re.S)
        return json.loads(bloque.group(1))

    def test_excluye_borradores_y_noindex(self):
        html = g.buscador_blog([entrada(), entrada("borrador", publicar=False), entrada("retirado", noindex=True)])
        self.assertEqual([p["href"] for p in self.indice(html)], ["/blog/pollitos.html"])

    def test_incluye_categorias_y_descripciones(self):
        html = g.buscador_blog([entrada(), entrada("incubar", categoria="incubacion")])
        self.assertEqual([p["categoria"] for p in self.indice(html)], ["Alimentación", "Incubación"])
        self.assertEqual(self.indice(html)[0]["descripcion"], "Compara etiquetas")

    def test_texto_no_cierra_el_script(self):
        titulo = "</script><b>Texto</b>"
        html = g.buscador_blog([entrada(titulo=titulo)])
        self.assertEqual(self.indice(html)[0]["titulo"], titulo)
        self.assertNotIn("</script><b>", html)
        self.assertIn("data-blog-buscar hidden", html)

    def test_sin_publicos_no_hay_controles(self):
        self.assertEqual(g.buscador_blog([]), "")
        self.assertEqual(g.buscador_blog([entrada(publicar=False)]), "")


if __name__ == "__main__":
    unittest.main()
