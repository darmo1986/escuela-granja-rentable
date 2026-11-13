#!/usr/bin/env python3
"""Cinco ebooks a 3,00 USD, el Premium a 29 €, y el consentimiento de los de tarjeta sin marcar."""
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

    def test_cinco_ebooks_a_tres_y_premium_a_29(self):
        self.assertIn("Cada ebook disponible cuesta 3,00 USD. Y si quieres ayuda personal, el asesoramiento Premium cuesta 29 € al mes.", self.html)
        self.assertIn('href="../premium.html"', self.html)
        self.assertNotIn("No hay portada", self.html)
        self.assertNotIn("guia-avicultura", self.html)
        self.assertNotIn("dado de alta", self.html)
        self.assertNotIn("Apps Script", self.html)
        self.assertIn("Próximamente. Todavía no está a la venta.", self.html)
        self.assertNotIn("Los cuatro", self.html)
        self.assertNotIn("los cuatro", self.html)
        self.assertEqual(len(re.findall(r'<p class="precio">3,00 USD</p>', self.html)), 5)
        self.assertEqual(len(re.findall(r"<strong>3,00 USD</strong>", self.html)), 5)
        self.assertEqual(len(re.findall(r'<p class="precio">29 €</p>', self.html)), 1)
        self.assertNotIn("2,00 USD", self.html)
        self.assertNotIn("5,00 USD", self.html)
        resto = self.html.replace("29 €", "").replace("en euros", "")
        self.assertNotIn("€", resto)

    def test_espana_no_cambia_la_moneda(self):
        self.assertIn("Si eliges España, el importe sigue en USD", self.html)
        self.assertIn("Este importe no pasa a euros.", self.html)
        self.assertIn("tipo general del IGIC (7 %)", self.html)

    def test_consentimiento_visible_y_sin_marcar(self):
        self.assertEqual(len(re.findall(r"<fieldset class=\"ebook-consent\">", self.html)), 5)
        self.assertEqual(len(re.findall(r'data-ebook-check="[^"]+"', self.html)), 4)
        self.assertIsNone(re.search(r'data-ebook-check="[^"]+"[^>]*\schecked', self.html))
        self.assertIn(
            "Solicito que el contenido digital se entregue inmediatamente y reconozco que perderé mi derecho de desistimiento cuando comience la descarga.",
            self.html,
        )
        self.assertEqual(self.html.count("condiciones de venta"), 5)

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
