import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('verificador', Path(__file__).resolve().parents[1] / 'verificar_publicacion.py')
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)


class Publicacion(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.raiz = Path(self.tmp.name)
        self.activos = ''.join(f'<script src="js/{x}.js?v=prueba"></script>' for x in ['config','app','site'])
        self.home = '<a href="curso.html" data-inicio-curso>Empezar el curso gratis</a><section aria-labelledby="recientes-titulo"><article class="gr-article">Nuevo</article></section>' + self.activos
        (self.raiz / 'index.html').write_text(self.home)
        (self.raiz / 'blog').mkdir()
        (self.raiz / 'blog/tema.html').write_text(self.activos)
        (self.raiz / 'blog/gallos.html').write_text('Categoría')
        self.posts = [{'slug':'tema','publicar':True}]

    def tearDown(self):
        self.tmp.cleanup()

    def errores(self):
        return v.verificar_salida(self.raiz, 'prueba', self.posts, ['gallos'])

    def test_salida_valida(self):
        self.assertEqual(self.errores(), [])

    def test_rechaza_portada_sin_generar(self):
        (self.raiz / 'index.html').write_text('<a href="razas.html" data-slide class="is-active">Razas</a><script src="js/site.js"></script>')
        errores = self.errores()
        self.assertTrue(any('novedades' in e for e in errores))
        self.assertTrue(any('versión común' in e for e in errores))

    def test_rechaza_articulo_o_categoria_ausente(self):
        (self.raiz / 'blog/tema.html').unlink()
        (self.raiz / 'blog/gallos.html').unlink()
        self.assertEqual(len(self.errores()), 2)

    def test_rechaza_fuentes_internas_publicadas(self):
        (self.raiz / '_fuentes').mkdir()
        self.assertTrue(any('fuente interna' in e for e in self.errores()))

    def test_rechaza_resenas_heredadas_en_la_tienda_construida(self):
        tienda = self.raiz / 'tienda/p/modelo'
        tienda.mkdir(parents=True)
        pagina = tienda / 'index.html'
        pagina.write_text('<a href="https://www.amazon.com/product-reviews/B00P9EJLSO?tag=granjarentabl-20">Amazon</a>')
        self.assertTrue(any('product-reviews' in e for e in self.errores()))
        pagina.write_text('<a href="https://www.amazon.com/dp/B00P9EJLSO?tag=granjarentabl-20">Amazon</a>')
        self.assertEqual(self.errores(), [])

    def test_rechaza_accion_principal_ajena_al_curso(self):
        (self.raiz / 'index.html').write_text(self.home.replace('href="curso.html"', 'href="razas.html"'))
        self.assertTrue(any('acción principal' in e for e in self.errores()))

    def test_rechaza_promocion_antes_del_curso(self):
        (self.raiz / 'index.html').write_text('<section data-promo-carousel></section>' + self.home)
        self.assertTrue(any('acción principal' in e for e in self.errores()))

    def test_rechaza_inicio_rotativo(self):
        (self.raiz / 'index.html').write_text('<section data-hero>' + self.home + '</section>')
        self.assertTrue(any('acción principal' in e for e in self.errores()))


if __name__ == '__main__':
    unittest.main()
