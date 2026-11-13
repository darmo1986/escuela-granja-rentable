"""Protege la migración de botones y su origen, sin llamadas a Amazon."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]


def cargar(nombre, ruta):
    spec = importlib.util.spec_from_file_location(nombre, RAIZ / ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


m = cargar('limpiar_destinos_tienda', '_fuentes/tienda/limpiar_destinos.py')
t = cargar('generador_destinos_tienda', '_fuentes/tienda/construir.py')


def antiguo(asin='B00P9EJLSO'):
    return ('<div class="t-acciones">\n'
            f'<a class="btn gold t-amazon" href="https://www.amazon.com/dp/{asin}?tag=granjarentabl-20" rel="sponsored nofollow noopener" target="_blank">Ver precio en Amazon<span class="sr"> (se abre en Amazon)</span></a>\n'
            f'<a class="btn sec t-resenas" href="https://www.amazon.com/product-reviews/{asin}?tag=granjarentabl-20" rel="nofollow sponsored noopener" target="_blank">Ver las reseñas en Amazon<span class="sr"> (se abre en Amazon)</span></a>\n'
            '</div>')


class DestinosTienda(unittest.TestCase):
    def test_conserva_principal_tag_y_contenido_ajeno(self):
        principal = m.Enlaces(antiguo()).enlaces[0]
        html = '<p>Texto editorial</p>' + antiguo() + '<img src="foto.jpg" alt="Foto">'
        limpio, n = m.limpiar(html)
        self.assertEqual(n, 1)
        self.assertEqual(m.Enlaces(limpio).enlaces, [principal])
        self.assertTrue(limpio.startswith('<p>Texto editorial</p>'))
        self.assertTrue(limpio.endswith('<img src="foto.jpg" alt="Foto">'))
        self.assertEqual(m.limpiar(limpio), (limpio, 0))

    def test_no_retira_si_asin_tag_host_o_atributos_no_coinciden(self):
        for viejo, nuevo in [
            ('/product-reviews/B00P9EJLSO', '/product-reviews/B016AFYT4Q'),
            ('tag=granjarentabl-20', 'tag=otro-20'),
            ('www.amazon.com', 'www.amazon.com.example.org'),
            ('rel="nofollow sponsored noopener"', 'rel="nofollow"'),
            ('class="btn gold t-amazon"', 'class="otro"'),
        ]:
            with self.subTest(nuevo=nuevo), self.assertRaises(ValueError):
                m.limpiar(antiguo().replace(viejo, nuevo))

    def test_no_omite_enlaces_fuera_del_patron_controlado(self):
        html = '<a href="https://www.amazon.com/product-reviews/B00P9EJLSO">Opiniones</a>'
        with self.assertRaises(ValueError):
            m.limpiar(html)

    def test_valida_todos_antes_de_escribir(self):
        with tempfile.TemporaryDirectory() as tmp:
            tienda = Path(tmp) / 'tienda'
            tienda.mkdir()
            primero = tienda / 'a.html'
            primero.write_text(antiguo())
            (tienda / 'z.html').write_text(antiguo().replace('/dp/B00P9EJLSO', '/dp/B016AFYT4Q'))
            with self.assertRaises(ValueError):
                m.procesar(Path(tmp))
            self.assertEqual(primero.read_text(), antiguo())

    def test_el_generador_no_reintroduce_segundo_destino(self):
        p = {'asin': 'B00P9EJLSO', 'url': 'https://www.amazon.com/dp/B00P9EJLSO?tag=granjarentabl-20'}
        html = t.botones_amazon(p)
        enlaces = m.Enlaces(html).enlaces
        self.assertEqual(len(enlaces), 1)
        self.assertEqual(enlaces[0]['href'], p['url'])
        self.assertEqual(m.limpiar(html), (html, 0))
        self.assertNotIn('product-reviews', html)


if __name__ == '__main__':
    unittest.main()
