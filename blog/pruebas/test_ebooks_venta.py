#!/usr/bin/env python3
"""La página de ebooks deja los cuatro precios en USD y el consentimiento sin marcar."""
import re
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
PAGINA = RAIZ / "ebooks" / "index.html"
MENU = RAIZ / "blog" / "plantillas" / "menu.html"


class EbooksVenta(unittest.TestCase):
    def setUp(self):
        html = PAGINA.read_text(encoding="utf-8")
        self.html = html.split("<script>", 1)[0]
        self.menu = MENU.read_text(encoding="utf-8")

    def test_cuatro_precios_siguen_en_dos_dolares(self):
        self.assertEqual(len(re.findall(r'<p class="precio">2,00 USD</p>', self.html)), 3)
        self.assertEqual(len(re.findall(r"<strong>2,00 USD</strong>", self.html)), 3)
        ponedoras = self.html.split('id="alimenta-ponedoras"', 1)[1].split("</section>", 1)[0]
        self.assertIn('<p class="precio">3,00 USD</p>', ponedoras)
        self.assertIn("<strong>3,00 USD</strong>", ponedoras)
        self.assertNotIn("2,00 USD", ponedoras)
        self.assertNotIn("5,00 USD", self.html)
        self.assertNotIn("€", self.html)
        self.assertNotIn("euros", self.html.lower().replace("no lo pasamos a euros", "").replace("no pasa a euros", ""))

    def test_espana_no_cambia_la_moneda(self):
        self.assertIn("Si eliges España, el importe sigue en USD", self.html)
        self.assertIn("Este importe no pasa a euros.", self.html)
        self.assertIn("tipo general del IGIC (7 %)", self.html)

    def test_consentimiento_visible_y_sin_marcar(self):
        self.assertEqual(len(re.findall(r"<fieldset class=\"ebook-consent\">", self.html)), 4)
        self.assertEqual(len(re.findall(r'data-ebook-check="[^"]+"', self.html)), 4)
        self.assertIsNone(re.search(r'data-ebook-check="[^"]+"[^>]*\schecked', self.html))
        self.assertIn(
            "Solicito que el contenido digital se entregue inmediatamente y reconozco que perderé mi derecho de desistimiento cuando comience la descarga.",
            self.html,
        )
        self.assertEqual(self.html.count("condiciones de venta"), 4)

    def test_el_pago_sigue_siendo_el_de_los_cuatro(self):
        claves = re.findall(r'data-stripe-ebook="([^"]+)"', self.html)
        self.assertEqual(claves, ["pienso-hacer", "pienso-elegir", "guia-empezar", "alimenta-ponedoras"])
        self.assertNotIn('data-stripe-ebook="gallinas"', self.html)
        self.assertNotIn("Gallinas —", self.html)

    def test_ebooks_entra_en_el_menu_visible(self):
        enlace = re.search(r'<a[^>]*data-nav="ebooks"[^>]*>', self.menu)
        self.assertIsNotNone(enlace)
        self.assertNotIn("nav-extra", enlace.group(0))
        self.assertIn('href="@@RAIZ@@ebooks/"', enlace.group(0))


if __name__ == "__main__":
    unittest.main()
