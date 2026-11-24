"""Comprueba la ronda de ventas: datos reales, precios intactos y anuncios apagados."""
import json
import re
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]


def texto(rel):
    return (RAIZ / rel).read_text(encoding="utf-8")


class VentasNivel(unittest.TestCase):
    def test_prueba_social_solo_con_fuente(self):
        portada = texto("index.html")
        self.assertIn("47,1 mil suscriptores y 343 vídeos", portada)
        self.assertIn("24 de noviembre de 2026", portada)
        self.assertIn("https://www.youtube.com/@GranjaRentable", portada)
        self.assertIn("No es una opinión de compradores.", portada)
        self.assertNotRegex(portada, r"\d+\s+clientes satisfechos")

    def test_barra_y_membresia_visibles(self):
        portada = texto("index.html")
        self.assertIn('class="gr-barra"', portada)
        self.assertLess(portada.find("Hazte miembro"), portada.find('class="gr-shortcuts"'))
        self.assertIn("2,99 €", portada)
        self.assertIn("La baja se hace en esa misma plataforma", portada)

    def test_ebooks_siguen_a_tres_dolares_y_declaran_el_cargo(self):
        html = texto("ebooks/index.html")
        self.assertEqual(len(re.findall(r'<p class="precio">3,00 USD</p>', html)), 5)
        self.assertIn("La tarjeta sigue cobrando 3,00 USD", html)
        datos = json.loads(re.search(
            r'<script type="application/ld\+json">(\{"@context":"https://schema.org","@graph":\[\{"@type":"Product".*?})</script>',
            html).group(1))
        ofertas = [n for n in datos["@graph"] if n["@type"] == "Product"]
        self.assertEqual(len(ofertas), 4)
        self.assertTrue(all(o["offers"]["price"] == "3.00" and o["offers"]["priceCurrency"] == "USD" for o in ofertas))

    def test_curso_enlaza_las_cinco_lecciones(self):
        html = texto("curso.html")
        self.assertEqual(html.count('id="continuar"'), 1)
        self.assertLess(html.find('id="continuar"'), html.find('data-anuncios-arriba'))
        for leccion in ("l01.html", "l02.html", "l03.html", "l04a.html", "l04b.html"):
            self.assertIn("https://granjarentable.com/lecciones/" + leccion, html)

    def test_l03_no_cobra_la_incubadora(self):
        html = texto("lecciones/l03.html")
        self.assertIn("Esta web no cobra la máquina", html)
        self.assertIn("B0793HHZ1L", html)

    def test_sitemap_sin_merch_duplicado(self):
        urls = re.findall(r"<loc>(.*?)</loc>", texto("sitemap.xml"))
        self.assertEqual(urls.count("https://granjarentable.com/tienda/merchandising/"), 1)
        self.assertEqual(urls.count("https://granjarentable.com/recomendados.html"), 1)

    def test_anuncios_siguen_apagados(self):
        config = texto("js/config.js")
        self.assertIn("activo: false", config)
        self.assertIn("adsterraPilot: false", config)
        self.assertIn('formEndpoint: "https://script.google.com/macros/s/AKfycbyeSZCE95DI1wdls0MiNoKdh92i8ve0GkkJHy4GAY3p4pWsBCRhs0hb3bmUMTV-Xw0Wzw/exec"', config)


if __name__ == "__main__":
    unittest.main()
