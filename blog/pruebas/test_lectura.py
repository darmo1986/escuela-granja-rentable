"""Navegación y novedades que se generan junto al contenido público."""
import importlib.util
import re
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("generar_lectura", Path(__file__).resolve().parents[1] / "generar.py")
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)


class Lectura(unittest.TestCase):
    def test_anclas_repetidas_tildes_y_entidades(self):
        cuerpo, indice = g.indice_articulo('<h2>Agua y ventilación</h2><p>Texto</p><h3>Qué &amp; cómo</h3><h2>Agua y ventilación</h2>')
        ids = re.findall(r'id="([^"]+)"', cuerpo)
        self.assertEqual(ids, ['apartado-agua-y-ventilacion', 'apartado-que-como', 'apartado-agua-y-ventilacion-2'])
        self.assertEqual(len(set(ids)), 3)
        for ancla in ids:
            self.assertIn(f'href="#{ancla}"', indice)
        self.assertIn('Qué &amp; cómo', indice)
        self.assertNotIn('&amp;amp;', indice)
        self.assertIn('post-indice-nivel-3', indice)

    def test_no_colisiona_con_anclas_existentes(self):
        cuerpo, _ = g.indice_articulo('<p id="apartado-agua">X</p><h2>Agua</h2><h2>Pienso</h2>')
        self.assertIn('id="apartado-agua-2"', cuerpo)

    def test_no_agrega_indice_a_texto_sin_apartados(self):
        self.assertEqual(g.indice_articulo('<p>Texto</p>'), ('<p>Texto</p>', ''))
        self.assertEqual(g.indice_articulo('<h2>Único apartado</h2>')[1], '')

    def test_tiempo_estimado_usa_texto_y_minimo(self):
        self.assertEqual(g.minutos_lectura(''), 1)
        self.assertEqual(g.minutos_lectura('<p>' + 'palabra ' * 201 + '</p>'), 2)

    def entrada(self, slug, **extra):
        p = dict(slug=slug, titulo='Título ' + slug, descripcion='Una descripción', categoria='gallos',
                 publicar=True, noindex=False, html='<h2>Agua</h2><p>Texto</p>', imagen='img/blog/foto.webp',
                 imagen_alt='Gallo doméstico de perfil', imagen_800='')
        p.update(extra)
        return p

    def test_portada_excluye_borradores_noindex_y_limita_tarjetas(self):
        pagina = '<main><!-- inicio-articulos:inicio -->Viejo<!-- inicio-articulos:fin --></main>'
        posts = [self.entrada('borrador', publicar=False), self.entrada('retirado', noindex=True)]
        posts += [self.entrada(str(n)) for n in range(5)]
        salida = g.actualizar_portada(pagina, posts)
        self.assertNotIn('Viejo', salida)
        self.assertEqual(salida.count('class="gr-article"'), 3)
        self.assertNotIn('blog/borrador.html', salida)
        self.assertNotIn('blog/retirado.html', salida)
        self.assertIn('blog/0.html', salida)
        self.assertNotIn('blog/3.html', salida)
        self.assertEqual(g.actualizar_portada(salida, posts), salida)

    def test_portada_sin_marcadores_se_conserva(self):
        self.assertEqual(g.actualizar_portada('<main>Texto</main>', [self.entrada('uno')]), '<main>Texto</main>')

    def test_texto_de_portada_se_escapa(self):
        p = self.entrada('uno', titulo='<script>mal</script>')
        salida = g.actualizar_portada('<!-- inicio-articulos:inicio --><!-- inicio-articulos:fin -->', [p])
        self.assertNotIn('<script>mal', salida)
        self.assertIn('&lt;script&gt;', salida)

    def test_renueva_activos_de_los_buscadores_y_portada(self):
        for path in ['js/hero.js','css/inicio.css','js/blog-buscar.js','css/blog-buscar.css','js/fichas-buscar.js']:
            version = g.VERSION_PORTADA if path in {'js/hero.js','css/inicio.css'} else g.VERSION_BUSCADOR if path in {'js/blog-buscar.js','css/blog-buscar.css'} else g.VERSION_ACTIVOS
            self.assertIn(f'{path}?v={version}', g.poner_version(f'<script src="{path}?v=antiguo"></script>'))


if __name__ == '__main__':
    unittest.main()
