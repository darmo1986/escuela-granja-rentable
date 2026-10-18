#!/usr/bin/env python3
"""Pruebas del generador de Artículos. No publican nada en el sitio."""
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("generar", RAIZ / "blog" / "generar.py")
generar = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generar)


def webp(ruta, ancho, alto):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", (ancho, alto), "#1F5E2E").save(ruta, "WEBP")


def base(tmp):
    tmp = Path(tmp)
    shutil.copytree(RAIZ / "blog" / "plantillas", tmp / "blog" / "plantillas")
    (tmp / "_articulos").mkdir(parents=True)
    (tmp / "data").mkdir()
    (tmp / "data" / "catalogo.json").write_text(json.dumps([{
        "id": "incubadora-24egg-dual",
        "nombre": "Incubadora automática 24Egg Dual",
        "alt": "Incubadora automática 24Egg Dual",
        "imagen": "img/productos/incubadora-24egg-dual.webp",
        "resumen": "Voltea los huevos sola.",
    }]), encoding="utf-8")
    (tmp / "producto").mkdir()
    (tmp / "producto" / "incubadora-24egg-dual.html").write_text("<html></html>", encoding="utf-8")
    (tmp / "lecciones").mkdir()
    (tmp / "lecciones" / "l03.html").write_text(
        "<h1><span class=\"code\">L03</span> La incubadora</h1>", encoding="utf-8")
    (tmp / "sitemap.xml").write_text(
        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
        "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n"
        "<url><loc>https://granjarentable.com/</loc></url>\n"
        "</urlset>\n", encoding="utf-8")
    (tmp / "index.html").write_text(
        "<nav id=\"site-nav\" class=\"nav\" aria-label=\"Principal\">\n"
        "<a href=\"curso.html\">Curso</a>\n</nav>\n"
        "<div class=\"shop-links\"><a class=\"btn sec\" href=\"curso.html\">Curso gratis</a></div>\n"
        "<p class=\"foot-brand\">Sitio</p>\n<ul><li><a href=\"tienda.html\">Tienda</a></li></ul>\n",
        encoding="utf-8")
    return tmp


def post(tmp, nombre, **cambios):
    datos = {
        "titulo": "Texto de prueba de incubación",
        "descripcion": "Una frase de prueba para el generador de artículos.",
        "categoria": "incubacion",
        "fecha": "2026-11-02",
        "borrador": "false",
        "leccion": "l03",
        "producto": "incubadora-24egg-dual",
        "imagen": "img/blog/prueba.webp",
        "imagen_alt": "Dibujo de un huevo al trasluz con un punto oscuro en el centro",
        "imagen_og": "img/blog/prueba-og.webp",
        "fuentes": ["Lección L03"],
    }
    cuerpo = cambios.pop("_cuerpo", "Párrafo de prueba, sin HTML.\n\n## Apartado\n\n- Una idea.")
    datos.update(cambios)
    if datos.get("imagen") and not (tmp / datos["imagen"]).is_file() and str(datos["imagen"]).startswith("img/"):
        webp(tmp / datos["imagen"], 1200, 675)
    if datos.get("imagen_og") and not (tmp / datos["imagen_og"]).is_file() and str(datos["imagen_og"]).startswith("img/"):
        webp(tmp / datos["imagen_og"], 1200, 630)
    lineas = ["---"]
    for clave, valor in datos.items():
        if clave == "fuentes":
            lineas.append("fuentes:")
            for item in valor:
                lineas.append(f'  - "{item}"')
        elif isinstance(valor, bool):
            lineas.append(f"{clave}: {'true' if valor else 'false'}")
        else:
            lineas.append(f"{clave}: {valor if clave in ('categoria', 'fecha', 'borrador', 'leccion', 'producto') else json.dumps(valor, ensure_ascii=False)}")
    lineas.append("---")
    lineas.append("")
    lineas.append(cuerpo)
    (tmp / "_articulos" / nombre).write_text("\n".join(lineas) + "\n", encoding="utf-8")


class Generador(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp())
        base(self.tmp)

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def test_borrador_no_sale_y_el_menu_si(self):
        post(self.tmp, "2026-11-02-ovoscopia.md", borrador="true")
        errores = generar.generar(self.tmp)
        self.assertEqual(errores, [])
        self.assertFalse((self.tmp / "blog" / "ovoscopia.html").exists())
        indice = (self.tmp / "blog" / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("ovoscopia", indice.lower())
        self.assertIn("Todavía no hay artículos", indice)
        self.assertNotIn("Imagen pendiente", indice)
        sitemap = (self.tmp / "sitemap.xml").read_text(encoding="utf-8")
        self.assertIn("https://granjarentable.com/blog/", sitemap)
        self.assertNotIn("ovoscopia", sitemap)
        self.assertNotIn("incubacion.html", sitemap)
        cat = (self.tmp / "blog" / "incubacion.html").read_text(encoding="utf-8")
        self.assertIn('content="noindex,follow"', cat)
        menu = (self.tmp / "index.html").read_text(encoding="utf-8")
        self.assertIn(">Artículos<", menu)
        self.assertIn('href="blog/"', menu)
        self.assertIn(">Calculadoras<", menu)
        self.assertIn("<!-- menu:inicio -->", menu)

    def test_sin_borrador_cuenta_como_borrador(self):
        post(self.tmp, "2026-11-02-sin-clave.md")
        texto = (self.tmp / "_articulos" / "2026-11-02-sin-clave.md").read_text(encoding="utf-8")
        texto = "\n".join(linea for linea in texto.splitlines() if not linea.startswith("borrador:"))
        (self.tmp / "_articulos" / "2026-11-02-sin-clave.md").write_text(texto, encoding="utf-8")
        self.assertEqual(generar.generar(self.tmp), [])
        self.assertFalse((self.tmp / "blog" / "sin-clave.html").exists())

    def test_sin_imagen_no_escribe(self):
        post(self.tmp, "2026-11-02-sin-foto.md", imagen="", imagen_og="", borrador="false")
        (self.tmp / "blog" / "index.html").write_text("NO-TOCAR", encoding="utf-8")
        antes = (self.tmp / "_articulos" / "2026-11-02-sin-foto.md").read_text(encoding="utf-8")
        errores = generar.generar(self.tmp)
        self.assertTrue(errores)
        self.assertIn("sin imagen", errores[0].lower())
        self.assertEqual((self.tmp / "blog" / "index.html").read_text(encoding="utf-8"), "NO-TOCAR")
        self.assertEqual((self.tmp / "_articulos" / "2026-11-02-sin-foto.md").read_text(encoding="utf-8"), antes)

    def test_medida_mala_y_html_y_enlace(self):
        post(self.tmp, "2026-11-02-malo.md", borrador="false",
             _cuerpo='Mira <script>alert(1)</script> y [fuera](https://ejemplo.com/a) y [curso](../curso.html).')
        webp(self.tmp / "img" / "blog" / "prueba.webp", 800, 400)
        errores = generar.generar(self.tmp)
        self.assertTrue(any("1200×675" in e for e in errores))
        webp(self.tmp / "img" / "blog" / "prueba.webp", 1200, 675)
        errores = generar.generar(self.tmp)
        self.assertEqual(errores, [])
        html = (self.tmp / "blog" / "malo.html").read_text(encoding="utf-8")
        self.assertNotIn("<script>alert", html)
        self.assertIn("&lt;script&gt;", html)
        self.assertIn('href="https://ejemplo.com/a" rel="noopener nofollow"', html)
        self.assertIn('href="../curso.html"', html)
        self.assertNotIn('href="../curso.html" rel="noopener nofollow"', html)
        self.assertIn("Juan Pablo González García", html)
        self.assertIn('"@type":"Person"', html.replace(" ", ""))
        self.assertIn("Granja Rentable", html)
        self.assertIn("BreadcrumbList", html)
        self.assertIn("<lastmod>2026-11-02</lastmod>", (self.tmp / "sitemap.xml").read_text(encoding="utf-8"))
        self.assertIn('content="1200"', html)
        self.assertIn('content="630"', html)

    def test_tres_posts_indexan_la_categoria(self):
        for i, dia in enumerate(("2026-11-01", "2026-11-02", "2026-11-03"), start=1):
            post(self.tmp, f"{dia}-salud-{i}.md", categoria="salud", fecha=dia, borrador="false",
                 titulo=f"Tema de salud número {i} para la granja",
                 producto="", leccion="", imagen=f"img/blog/s{i}.webp", imagen_og=f"img/blog/s{i}-og.webp")
        self.assertEqual(generar.generar(self.tmp), [])
        salud = (self.tmp / "blog" / "salud.html").read_text(encoding="utf-8")
        self.assertIn('content="index,follow"', salud)
        sitemap = (self.tmp / "sitemap.xml").read_text(encoding="utf-8")
        self.assertIn("https://granjarentable.com/blog/salud.html", sitemap)
        self.assertNotIn("incubacion.html", sitemap)
        incub = (self.tmp / "blog" / "incubacion.html").read_text(encoding="utf-8")
        self.assertIn("noindex,follow", incub)

    def test_tienda_ajena_y_vocabulario_no_publican(self):
        post(self.tmp, "2026-11-02-amazon.md", borrador="false",
             _cuerpo="Compralo en https://www.amazon.com/dp/1")
        errores = generar.generar(self.tmp)
        self.assertTrue(errores)
        self.assertFalse((self.tmp / "blog" / "amazon.html").exists())
        post(self.tmp, "2026-11-02-amazon.md", borrador="false",
             _cuerpo="Los pollos de carne comen mucho.")
        errores = generar.generar(self.tmp)
        self.assertTrue(any("pollos de engorde" in e for e in errores))

    def test_markdown_roto_no_toca_el_html(self):
        (self.tmp / "_articulos" / "roto.md").write_text("sin datos\n", encoding="utf-8")
        (self.tmp / "blog" / "index.html").write_text("NO-TOCAR", encoding="utf-8")
        errores = generar.generar(self.tmp)
        self.assertTrue(errores)
        self.assertEqual((self.tmp / "blog" / "index.html").read_text(encoding="utf-8"), "NO-TOCAR")

    def test_no_escribe_en_posts(self):
        post(self.tmp, "2026-11-02-ok.md", borrador="false")
        antes = {p.name: p.read_text(encoding="utf-8") for p in (self.tmp / "_articulos").glob("*.md")}
        self.assertEqual(generar.generar(self.tmp), [])
        despues = {p.name: p.read_text(encoding="utf-8") for p in (self.tmp / "_articulos").glob("*.md")}
        self.assertEqual(antes, despues)
        self.assertTrue((self.tmp / "blog" / "ok.html").is_file())
        self.assertNotIn("_articulos", (self.tmp / "blog" / "ok.html").read_text(encoding="utf-8"))

    def test_nojekyll_no_escribe(self):
        (self.tmp / ".nojekyll").write_text("", encoding="utf-8")
        (self.tmp / "blog" / "index.html").write_text("NO-TOCAR", encoding="utf-8")
        post(self.tmp, "2026-11-02-ok.md", borrador="false")
        errores = generar.generar(self.tmp)
        self.assertTrue(errores)
        self.assertIn(".nojekyll", errores[0])
        self.assertEqual((self.tmp / "blog" / "index.html").read_text(encoding="utf-8"), "NO-TOCAR")

    def test_titulo_y_descripcion_largos(self):
        post(self.tmp, "2026-11-02-largo.md", borrador="false",
             titulo="T" * 61,
             descripcion="Una frase de prueba para el generador de artículos.")
        (self.tmp / "blog" / "index.html").write_text("NO-TOCAR", encoding="utf-8")
        errores = generar.generar(self.tmp)
        self.assertTrue(errores)
        self.assertIn("61 caracteres", errores[0])
        self.assertIn("60", errores[0])
        self.assertNotIn("T" * 61, errores[0])
        self.assertNotIn("Traceback", errores[0])
        self.assertEqual((self.tmp / "blog" / "index.html").read_text(encoding="utf-8"), "NO-TOCAR")
        post(self.tmp, "2026-11-02-largo.md", borrador="false",
             descripcion="D" * 151)
        errores = generar.generar(self.tmp)
        self.assertTrue(any("151 caracteres" in e and "150" in e for e in errores))
        self.assertTrue(all("D" * 20 not in e for e in errores))

    def test_marcas_y_enlaces_raros_no_dejan_rastro(self):
        post(self.tmp, "2026-11-02-marca.md", borrador="false",
             titulo_seo="@@RAIZ@@ secreto-unico")
        (self.tmp / "blog" / "index.html").write_text("NO-TOCAR", encoding="utf-8")
        errores = generar.generar(self.tmp)
        aviso = " ".join(errores)
        self.assertIn("marca reservada", aviso)
        self.assertNotIn("@@", aviso)
        self.assertNotIn("secreto-unico", aviso)
        self.assertNotIn("Traceback", aviso)
        self.assertEqual((self.tmp / "blog" / "index.html").read_text(encoding="utf-8"), "NO-TOCAR")
        post(self.tmp, "2026-11-02-marca.md", borrador="false",
             _cuerpo="Mira [raro](\\\\evil.test) y [otro](http:evil.test/x).")
        errores = generar.generar(self.tmp)
        self.assertTrue(any("no es válido" in e for e in errores))
        self.assertFalse(any("\\\\evil" in e or "http:evil" in e for e in errores))
        self.assertFalse((self.tmp / "blog" / "marca.html").exists())

    def test_tiendas_sin_punto_en_campos(self):
        (self.tmp / "blog" / "index.html").write_text("NO-TOCAR", encoding="utf-8")
        post(self.tmp, "2026-11-02-tienda.md", borrador="false",
             titulo_seo="Oferta Amazon de la semana")
        errores = generar.generar(self.tmp)
        self.assertTrue(any("Amazon" in e for e in errores))
        self.assertFalse(any("Oferta" in e for e in errores))
        post(self.tmp, "2026-11-02-tienda.md", borrador="false",
             imagen_alt="Foto de un huevo y un anuncio de eBay al fondo")
        errores = generar.generar(self.tmp)
        self.assertTrue(any("imagen_alt" in e for e in errores))
        post(self.tmp, "2026-11-02-tienda.md", borrador="false",
             fuentes=["nota interna campid 99"])
        errores = generar.generar(self.tmp)
        self.assertTrue(any("fuentes" in e for e in errores))
        self.assertEqual((self.tmp / "blog" / "index.html").read_text(encoding="utf-8"), "NO-TOCAR")


if __name__ == "__main__":
    unittest.main()
