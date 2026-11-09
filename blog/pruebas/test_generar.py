#!/usr/bin/env python3
"""Pruebas del generador de Artículos. No publican nada en el sitio."""
import importlib.util
import json
import re
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
        if clave in ("fuentes", "relacionados"):
            lineas.append(f"{clave}:")
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
        self.assertNotIn("https://granjarentable.com/blog/", sitemap)
        self.assertNotIn("ovoscopia", sitemap)
        self.assertNotIn("incubacion.html", sitemap)
        self.assertIn('content="noindex,follow"', indice)
        cat = (self.tmp / "blog" / "incubacion.html").read_text(encoding="utf-8")
        self.assertIn('content="noindex,follow"', cat)
        menu = (self.tmp / "index.html").read_text(encoding="utf-8")
        self.assertNotIn(">Artículos<", menu)
        self.assertNotIn('href="blog/"', menu)
        self.assertIn(">Calculadoras<", menu)
        self.assertIn("css/estilo.css?v=20261109b", indice)
        self.assertIn("js/boot.js?v=20261109b", indice)
        self.assertIn("css/blog.css?v=20261109b", indice)
        self.assertIn("js/blog.js?v=20261109b", indice)
        self.assertIn("js/config.js?v=20261109b", indice)
        self.assertIn("js/app.js?v=20261109b", indice)
        self.assertIn("js/site.js?v=20261109b", indice)
        self.assertIn("<!-- menu:inicio -->", menu)
        self.assertIn('id="nav-herramientas"', menu)
        self.assertIn(">Herramientas<", menu)
        self.assertIn(">Calculadora de rentabilidad<", menu)
        self.assertIn(">Mi cuenta<", menu)
        self.assertNotIn("ad-inline", indice)
        self.assertNotIn("highperformanceformat", indice)
        self.assertNotIn("adsbygoogle", indice)

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
        self.assertNotIn("Juan Pablo González<br>", html)
        self.assertIn('"@type":"Person"', html.replace(" ", ""))
        self.assertIn('"name":"JuanPabloGonzálezGarcía"', html.replace(" ", ""))
        indice = (self.tmp / "blog" / "index.html").read_text(encoding="utf-8")
        self.assertIn("<p>Juan Pablo González García<br>", indice)
        self.assertIn('"author":{"@type":"Person","name":"JuanPabloGonzálezGarcía"}', indice.replace(" ", ""))
        self.assertIn("Granja Rentable", html)
        self.assertIn("BreadcrumbList", html)
        self.assertIn("<lastmod>2026-11-02</lastmod>", (self.tmp / "sitemap.xml").read_text(encoding="utf-8"))
        self.assertIn('content="1200"', html)
        self.assertIn('content="630"', html)
        self.assertIn(">Artículos<", (self.tmp / "index.html").read_text(encoding="utf-8"))
        self.assertIn("https://granjarentable.com/blog/", (self.tmp / "sitemap.xml").read_text(encoding="utf-8"))

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
             _cuerpo="Compralo en https://www.ebay.com/itm/1")
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
             titulo_seo="Oferta eBay de la semana")
        errores = generar.generar(self.tmp)
        self.assertTrue(any("eBay" in e for e in errores))
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

    def test_anuncios_siguen_el_interruptor(self):
        post(self.tmp, "2026-11-02-anuncio.md", borrador="false")
        (self.tmp / "js").mkdir()
        (self.tmp / "js" / "config.js").write_text("window.ads = { activo: false };\n", encoding="utf-8")
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "blog" / "anuncio.html").read_text(encoding="utf-8")
        indice = (self.tmp / "blog" / "index.html").read_text(encoding="utf-8")
        for pagina in (html, indice):
            self.assertNotIn("ad-inline", pagina)
            self.assertNotIn("highperformanceformat", pagina)
            self.assertNotIn("highrevenueformat", pagina)
            self.assertNotIn("adsbygoogle", pagina)
            self.assertNotIn("adsterra", pagina.lower())
        (self.tmp / "js" / "config.js").write_text("window.ads = { activo: true };\n", encoding="utf-8")
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "blog" / "anuncio.html").read_text(encoding="utf-8")
        self.assertIn('data-ad-size="banner"', html)
        self.assertIn('data-ad-size="rect"', html)
        self.assertNotIn("highperformanceformat", html)
        self.assertNotIn("highrevenueformat", html)
        self.assertNotIn("adsterra", html.lower())

    def test_titulo_final_no_pasa_de_60(self):
        largo = "Ovoscopia: cómo revisar los huevos en la incubadora"
        self.assertGreater(len(largo) + len(generar.SUFIJO_TITULO), 60)
        self.assertLessEqual(len(largo), 60)
        post(self.tmp, "2026-11-02-largo-title.md", borrador="false", titulo=largo, titulo_seo=largo)
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "blog" / "largo-title.html").read_text(encoding="utf-8")
        titulo = html.split("<title>", 1)[1].split("</title>", 1)[0]
        self.assertEqual(titulo, largo)
        self.assertNotIn("Granja Rentable</title>", html.split("<title>", 1)[1][:80])
        self.assertLessEqual(len(titulo), 60)
        corto = "Huevos al trasluz"
        post(self.tmp, "2026-11-02-corto-title.md", borrador="false", titulo=corto, titulo_seo=corto,
             imagen="img/blog/corto.webp", imagen_og="img/blog/corto-og.webp")
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "blog" / "corto-title.html").read_text(encoding="utf-8")
        titulo = html.split("<title>", 1)[1].split("</title>", 1)[0]
        self.assertEqual(titulo, corto + " | Granja Rentable")
        self.assertLessEqual(len(titulo), 60)

    def test_premium_no_recupera_whatsapp(self):
        (self.tmp / "premium.html").write_text(
            '<link rel="stylesheet" href="css/estilo.css">\n'
            '<script src="js/boot.js"></script>\n'
            '<script src="js/config.js"></script>\n'
            '<script src="js/app.js?v=1"></script>\n'
            '<script src="js/site.js"></script>\n'
            '<nav id="site-nav" class="nav" aria-label="Principal">\n'
            '<a data-social="messenger" href="https://m.me/PENDIENTE"><span class="nav-label">Messenger</span></a>\n'
            '</nav>\n'
            '<p class="foot-brand">Sitio</p>\n<ul><li><a href="tienda.html">Tienda</a></li></ul>\n'
            '<li><a data-social="whatsapp" href="https://wa.me/34656267726">WhatsApp</a></li>\n'
            '<a class="wa-float" href="https://wa.me/34656267726">WhatsApp</a>\n',
            encoding="utf-8")
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "premium.html").read_text(encoding="utf-8")
        self.assertIn("Messenger", html)
        self.assertIn("m.me/PENDIENTE", html)
        self.assertNotIn("WhatsApp", html)
        self.assertNotIn("wa.me", html)
        self.assertNotIn("wa-float", html)
        self.assertIn("css/estilo.css?v=20261109b", html)
        self.assertIn("js/boot.js?v=20261109b", html)
        self.assertIn("js/config.js?v=20261109b", html)
        self.assertIn("js/app.js?v=20261109b", html)
        self.assertIn("js/site.js?v=20261109b", html)
        self.assertNotIn("js/app.js?v=1", html)

    def test_herramientas_marca_la_pagina_activa(self):
        (self.tmp / "calculadora.html").write_text(
            '<nav id="site-nav" class="nav" aria-label="Principal"><a href="curso.html">Curso</a></nav>\n'
            '<p class="foot-brand">Sitio</p>\n<ul><li><a href="tienda.html">Tienda</a></li></ul>\n',
            encoding="utf-8")
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "calculadora.html").read_text(encoding="utf-8")
        self.assertIn('data-nav="herramientas" aria-current="page"', html)
        self.assertIn('data-nav="calculadora" aria-current="page"', html)

    def test_relacionados_elegidos_y_fecha_de_revision(self):
        post(self.tmp, "2026-11-02-alfa.md", titulo="Artículo alfa de incubación",
             titulo_seo="Artículo alfa de incubación",
             relacionados=["beta-prueba"])
        post(self.tmp, "2026-11-03-beta-prueba.md", titulo="Artículo beta de incubación",
             titulo_seo="Artículo beta de incubación", fecha="2026-11-03", actualizado="2026-11-08",
             imagen="img/blog/beta.webp", imagen_og="img/blog/beta-og.webp",
             leccion="", producto="")
        post(self.tmp, "2026-11-04-gamma.md", titulo="Artículo gamma de incubación",
             titulo_seo="Artículo gamma de incubación", fecha="2026-11-04",
             imagen="img/blog/gamma.webp", imagen_og="img/blog/gamma-og.webp",
             categoria="ponedoras")
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "blog" / "alfa.html").read_text(encoding="utf-8")
        self.assertLess(html.find("beta-prueba.html"), html.find("gamma.html"))
        beta = (self.tmp / "blog" / "beta-prueba.html").read_text(encoding="utf-8")
        self.assertIn("Revisado el 8 de noviembre de 2026", beta)
        post(self.tmp, "2026-11-05-roto.md", titulo="Artículo roto de incubación",
             titulo_seo="Artículo roto de incubación", relacionados=["no-existe"],
             imagen="img/blog/roto.webp", imagen_og="img/blog/roto-og.webp")
        errores = generar.generar(self.tmp)
        self.assertTrue(errores)
        self.assertIn("no-existe", errores[0])

    def test_titulo_aprobado_y_autor_del_post(self):
        titulo = "Agua para gallinas ponedoras: cuánto beben, qué bebedero elegir y cómo mantenerlo limpio"
        self.assertGreater(len(titulo), 60)
        self.assertLessEqual(len(titulo), 100)
        post(self.tmp, "2026-11-09-agua-gallinas-ponedoras-bebederos.md", borrador="false",
             titulo=titulo, titulo_seo=titulo, fecha="2026-11-09",
             autor="Equipo editorial de Granja Rentable",
             leccion="", producto="",
             _cuerpo="Visita [**www.granjarentable.com**](https://www.granjarentable.com) y la [guía](https://www.merckvetmanual.com/poultry/nutrition-and-management-poultry/nutritional-requirements-of-poultry).")
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "blog" / "agua-gallinas-ponedoras-bebederos.html").read_text(encoding="utf-8")
        self.assertIn(f"<title>{titulo}</title>", html)
        self.assertIn("9 de noviembre de 2026 · Equipo editorial de Granja Rentable", html)
        self.assertIn('"name":"Equipo editorial de Granja Rentable"', html)
        self.assertIn('<a href="https://www.granjarentable.com"><strong>www.granjarentable.com</strong></a>', html)
        self.assertIn('href="https://www.merckvetmanual.com/poultry/nutrition-and-management-poultry/nutritional-requirements-of-poultry" rel="noopener nofollow"', html)
        self.assertIn("Juan Pablo González García", html)
        post(self.tmp, "2026-11-02-otro-largo.md", borrador="false", titulo="T" * 61,
             imagen="img/blog/otro.webp", imagen_og="img/blog/otro-og.webp")
        errores = generar.generar(self.tmp)
        self.assertTrue(any("61 caracteres" in e and "60" in e for e in errores))

    def test_lista_numerada_faq_noindex_y_scripts(self):
        post(self.tmp, "2026-11-09-pasos.md", borrador="false", leccion="", producto="",
             noindex=True,
             _cuerpo="## Preguntas frecuentes\n\n### ¿Hay que limpiar el bebedero?\n\nSí, cuando se vea sucio.\n\n## Pasos\n\n1. Vacía el agua.\n\n2. Lava el recipiente.\n")
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "blog" / "pasos.html").read_text(encoding="utf-8")
        self.assertIn('<ol class="steps">', html)
        self.assertIn("<li>Vacía el agua.</li>", html)
        self.assertIn("<li>Lava el recipiente.</li>", html)
        self.assertIn('"@type":"FAQPage"', html)
        self.assertIn("¿Hay que limpiar el bebedero?", html)
        self.assertIn('content="noindex,follow"', html)
        self.assertIn("js/app.js?v=20261109b", html)
        self.assertIn("js/site.js?v=20261109b", html)
        self.assertNotIn("catalogo.js", html)
        self.assertIn("quienes-somos.html#equipo-editorial", html)
        sitemap = (self.tmp / "sitemap.xml").read_text(encoding="utf-8")
        self.assertNotIn("https://granjarentable.com/blog/pasos.html", sitemap)
        self.assertIn("https://granjarentable.com/blog/", sitemap)
        indice = (self.tmp / "blog" / "index.html").read_text(encoding="utf-8")
        self.assertNotIn("pasos.html", indice)
        cat = (self.tmp / "blog" / "incubacion.html").read_text(encoding="utf-8")
        self.assertNotIn("pasos.html", cat)

    def test_sin_adsense_y_banner_que_permanece(self):
        post(self.tmp, "2026-11-09-banner.md", borrador="false", leccion="", producto="",
             categoria="incubacion", titulo="Artículo con banner de incubación",
             titulo_seo="Artículo con banner de incubación")
        (self.tmp / "js").mkdir(exist_ok=True)
        (self.tmp / "js" / "config.js").write_text(
            'window.ads = { activo: false, amazonTag: "" };\n', encoding="utf-8")
        (self.tmp / "index.html").write_text(
            "<head><title>Inicio</title></head><body><main><p>Hola</p></main></body>",
            encoding="utf-8")
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "blog" / "banner.html").read_text(encoding="utf-8")
        self.assertEqual(html.count("data-banner-ebook"), 1)
        self.assertIn('data-banner="ebook-empezar"', html)
        self.assertIn("Guía para empezar tu granja", html)
        self.assertIn("Compra ya", html)
        self.assertIn("3 USD", html)
        self.assertIn("Empieza tu granja con buen pie", html)
        self.assertNotIn("Empieza tu granja sin errores", html)
        self.assertRegex(html, r'<div class="banner-ebook-marca"><img src="[^"]*img/logo-oscuro\.svg" alt=""[^>]*><span>Granja Rentable</span>')
        self.assertIn('class="banner-ebook-marca"', html)
        self.assertIn("img/logo-oscuro.svg", html)
        self.assertIn("img/banners/banner-empezar.webp", html)
        self.assertIn('<div class="banner-ebook-texto">', html)
        self.assertNotIn('<span class="banner-ebook-texto">', html)
        self.assertRegex(html, r'class="banner-ebook-ilustracion"[^>]*alt="Ilustración: [^"]+"')
        self.assertIn('loading="lazy"', html)
        self.assertIn("ebooks/?utm_source=granjarentable&amp;utm_medium=banner&amp;utm_campaign=ebook-empezar#guia-empezar", html)
        self.assertEqual(html.count("js/registro-banners.js"), 1)
        self.assertNotIn("adsbygoogle.js", html)
        self.assertNotIn("data-banner-amazon", html)
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "blog" / "banner.html").read_text(encoding="utf-8")
        self.assertEqual(html.count("data-banner-ebook"), 1)
        self.assertEqual(html.count("js/registro-banners.js"), 1)
        self.assertEqual(html.count("utm_campaign=ebook-empezar"), 1)
        self.assertNotIn("adsbygoogle.js", html)
        (self.tmp / "js" / "config.js").write_text(
            'window.ads = { activo: true, amazonTag: "" };\n', encoding="utf-8")
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "blog" / "banner.html").read_text(encoding="utf-8")
        self.assertNotIn("adsbygoogle.js", html)
        self.assertNotIn("ca-pub-5311145772953700", html)
        self.assertEqual(html.count("data-banner-ebook"), 1)
        self.assertNotIn("data-banner-amazon", html)
        (self.tmp / "js" / "config.js").write_text(
            'window.ads = { activo: true, amazonTag: "test-20" };\n', encoding="utf-8")
        self.assertEqual(generar.generar(self.tmp), [])
        html = (self.tmp / "blog" / "banner.html").read_text(encoding="utf-8")
        self.assertNotIn("adsbygoogle.js", html)
        self.assertEqual(html.count("data-banner-amazon"), 1)
        self.assertIn('data-banner="amazon-incubacion"', html)
        amazon = html.split("banner-amazon", 1)[1]
        self.assertNotIn("utm_", amazon)
        self.assertIn("Enlace de afiliado", html)
        self.assertIn("tag=test-20", html)
        self.assertIn('rel="sponsored nofollow noopener"', html)
        self.assertEqual(html.count("js/registro-banners.js"), 1)
        portada = (self.tmp / "index.html").read_text(encoding="utf-8")
        self.assertIn("Pack de ebooks de Granja Rentable", portada)
        self.assertNotIn("adsbygoogle.js", portada)
        self.assertNotIn("ca-pub-5311145772953700", portada)
        self.assertIn('data-banner="ebook-pack"', portada)
        self.assertIn("desde 3 USD", portada)
        self.assertIn("Guías prácticas para tu granja", portada)
        self.assertNotIn("Empieza tu granja", portada)
        self.assertIn('img/logo-oscuro.svg" alt=""', portada)
        self.assertIn("Compra ya", portada)
        self.assertIn("utm_campaign=ebook-pack", portada)
        self.assertEqual(portada.count("js/registro-banners.js"), 1)
        paginas = []
        for ruta in self.tmp.rglob("*.html"):
            rel = ruta.relative_to(self.tmp).as_posix()
            if rel.startswith(("blog/plantillas/", "blog/pruebas/")):
                continue
            texto = ruta.read_text(encoding="utf-8")
            if "banner-ebook" not in texto and "banner-amazon" not in texto:
                continue
            paginas.append(rel)
            self.assertEqual(texto.count("js/registro-banners.js"), 1, rel)
            self.assertNotIn("adsbygoogle", texto, rel)
            for aside in re.findall(r"<aside class=\"banner-(?:ebook|amazon)\"[^>]*>", texto):
                self.assertIn("data-banner=\"", aside, rel)
        self.assertIn("blog/banner.html", paginas)
        self.assertIn("index.html", paginas)
        clave, _tema = generar.ebook_y_amazon(
            "blog/criar-codornices-desde-cero.html",
            {"slug": "criar-codornices-desde-cero", "categoria": "ponedoras"})
        self.assertEqual(clave, "pack")


class ConfiguracionReal(unittest.TestCase):
    """js/config.js del repositorio: Amazon como relleno detrás del ebook, sin redes de anuncios."""

    def test_amazon_con_etiqueta_y_anuncios_apagados(self):
        self.assertEqual(generar.etiqueta_amazon(RAIZ), "granjarentabl-20")
        self.assertFalse(generar.anuncios_activos(RAIZ))
        config = (RAIZ / "js" / "config.js").read_text(encoding="utf-8").lower()
        self.assertNotIn("adsbygoogle", config)
        self.assertNotIn("adsterra", config)

    def test_hueco_amazon_va_detras_del_ebook(self):
        html = (RAIZ / "blog" / "incubacion-dia-a-dia.html").read_text(encoding="utf-8")
        self.assertEqual(html.count("data-banner-ebook"), 1)
        self.assertEqual(html.count("data-banner-amazon"), 1)
        self.assertLess(html.index("data-banner-ebook"), html.index("data-banner-amazon"))
        self.assertIn("tag=granjarentabl-20", html)
        self.assertIn('rel="sponsored nofollow noopener"', html)
        self.assertNotIn("adsbygoogle", html)
        self.assertNotIn("adsterra", html.lower())


if __name__ == "__main__":
    unittest.main()
