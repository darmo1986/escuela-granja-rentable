#!/usr/bin/env python3
"""Genera el HTML de Artículos y escribe el menú desde blog/plantillas/.

No publica borradores ni un post sin foto. Si un Markdown está mal, sale
con error y no toca ningún HTML. La Action no guarda esa salida en main:
compila _site/ y publica solo eso.

Los textos viven en _articulos/. Esa carpeta empieza por _ y Jekyll no la
copia. El generador tampoco escribe ahí, ni en blog/plantillas/, ni en
blog/pruebas/. Si existe .nojekyll, se niega a correr.
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

SITIO = "https://granjarentable.com"
AUTOR = "Juan Pablo González García"
EDITOR = "Granja Rentable"
LOGO = SITIO + "/img/logo.jpg"
OG_BLOG = SITIO + "/img/og/blog.jpg"
OG_BLOG_ALT = "Artículos de avicultura de Granja Rentable"
POR_PAGINA = 12
MINIMO_CATEGORIA = 3
ANCHO_FOTO = 1200
ALTO_FOTO = 675
ANCHO_OG = 1200
ALTO_OG = 630
MARCA_PAGINA = "<!-- pagina-generada: blog -->"
# La portada responsive (-400 y -800) se genera aparte y se guarda en el repo.
# Si no está, el HTML sigue usando la foto original de 1200 px.
RAIZ_FS = None
SIZES_FICHA = "(min-width: 720px) 672px, calc(100vw - 48px)"
SIZES_TARJETA = "(min-width: 980px) 360px, (min-width: 640px) 46vw, calc(100vw - 48px)"

CLAVES = {
    "titulo", "titulo_seo", "descripcion", "categoria", "fecha", "leccion",
    "producto", "imagen", "imagen_alt", "imagen_og", "video", "red",
    "fuentes", "borrador", "guia", "actualizado",
}
CATEGORIAS = (
    ("ponedoras", "Gallinas ponedoras", "gallinas-ponedoras", "empezar"),
    ("engorde", "Pollos de engorde", "pollos-de-engorde", "espacio"),
    ("incubacion", "Incubación", "incubacion", "incubadora"),
    ("salud", "Salud", "salud", "espacio"),
    ("alimentacion", "Alimentación", "alimentacion", "empezar"),
)
CATS = {c[0]: {"nombre": c[1], "slug": c[2], "guia": c[3]} for c in CATEGORIAS}
SLUGS_CAT = {c[2] for c in CATEGORIAS}
GUIAS = {
    "empezar": (
        "guia-empezar.html",
        "Carne, huevos o genética",
        "Un solo camino al empezar, y el alimento como la mayor parte del costo. Sale de L01.",
    ),
    "espacio": (
        "guia-espacio.html",
        "Espacio por ave",
        "Patio, suelo, pollos de engorde y campero con las cifras de L02, y la calculadora al lado.",
    ),
    "incubadora": (
        "guia-incubadora.html",
        "Incubadora y días",
        "21, 17 y 28 días según L03, y las fichas de la 24Egg Dual y la WONEGG 48.",
    ),
}
MESES = (
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
)
# Sin exigir el punto: «Amazon», «eBay» y «campid» también cuentan.
PROHIBIDO = re.compile(
    r"(?<![a-z0-9])(?:amazon|ebay|amzn|campid)(?![a-z0-9])"
    r"|mercadolibre|mercadolivre|mercado\s+libre|mercado\s+livre",
    re.I,
)
VOCABULARIO = re.compile(r"pollos?\s+de\s+carne|broilers?", re.I)
RESERVADOS = SLUGS_CAT | {"index", "pagina"}
CARPETA_POSTS = "_articulos"
MAX_TITULO = 60
MAX_DESCRIPCION = 150
SUFIJO_TITULO = " | Granja Rentable"
VERSION_ACTIVOS = "202610184"
# Las páginas de Premium (#17) hablan por Messenger. El generador no les vuelve a poner WhatsApp.
SIN_WHATSAPP = {"premium.html", "condiciones-premium.html"}
CLAVES_HERRAMIENTAS = {"calculadora", "enfermedades", "juegos"}


class Fallo(Exception):
    pass


def esc(texto):
    return (str(texto)
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("@@", "&#64;&#64;"))


def raiz_de(rel):
    return "../" * rel.count("/")


def clave_nav(rel):
    rel = rel.replace("\\", "/")
    if rel.startswith("blog/"):
        return "articulos"
    base = rel.split("/")[-1]
    carpeta = rel.split("/")[0] if "/" in rel else ""
    if carpeta == "producto" or base == "tienda.html":
        return "tienda"
    if carpeta == "lecciones" or base in ("curso.html", "examen-final.html", "leccion.html"):
        return "curso"
    if base == "calculadora.html":
        return "calculadora"
    if base == "enfermedades.html" or carpeta == "enfermedades":
        return "enfermedades"
    if base == "juegos.html":
        return "juegos"
    if base == "app.html":
        return "app"
    if base == "afiliados.html":
        return "afiliados"
    if base == "registro.html":
        return "registro"
    return None


def medida_webp(ruta):
    data = Path(ruta).read_bytes()
    if len(data) < 16 or data[0:4] != b"RIFF" or data[8:12] != b"WEBP":
        return None
    i = 12
    while i + 8 <= len(data):
        tag = data[i:i + 4]
        size = int.from_bytes(data[i + 4:i + 8], "little")
        payload = data[i + 8:i + 8 + size]
        if tag == b"VP8X" and len(payload) >= 10:
            ancho = 1 + int.from_bytes(payload[4:7], "little")
            alto = 1 + int.from_bytes(payload[7:10], "little")
            return ancho, alto
        if tag == b"VP8 " and len(payload) >= 10 and payload[3:6] == b"\x9d\x01\x2a":
            ancho = int.from_bytes(payload[6:8], "little") & 0x3FFF
            alto = int.from_bytes(payload[8:10], "little") & 0x3FFF
            return ancho, alto
        if tag == b"VP8L" and len(payload) >= 5 and payload[0] == 0x2F:
            bits = int.from_bytes(payload[1:5], "little")
            ancho = (bits & 0x3FFF) + 1
            alto = ((bits >> 14) & 0x3FFF) + 1
            return ancho, alto
        i += 8 + size + (size & 1)
    return None


def sin_comentario(valor):
    if valor.startswith('"') or valor.startswith("'"):
        return valor
    if "#" in valor:
        return valor.split("#", 1)[0].strip()
    return valor


def quitar_comillas(valor):
    valor = sin_comentario(valor).strip()
    if len(valor) >= 2 and valor[0] == valor[-1] and valor[0] in "\"'":
        cuerpo = valor[1:-1]
        return cuerpo.replace('\\"', '"').replace("\\'", "'").replace("\\n", "\n")
    return valor


def a_bool(valor, origen, clave):
    texto = str(valor).strip().lower()
    if texto in ("true", "si", "sí", "yes"):
        return True
    if texto in ("false", "no"):
        return False
    raise Fallo(f"{origen}: {clave} tiene que ser true o false.")


def a_fecha(valor, origen, clave):
    try:
        return date.fromisoformat(str(valor).strip())
    except ValueError as exc:
        raise Fallo(f"{origen}: {clave} tiene que ser AAAA-MM-DD.") from exc


def parsear_frontmatter(texto, origen):
    if texto.startswith("\ufeff"):
        texto = texto[1:]
    if not texto.startswith("---\n"):
        raise Fallo(f"{origen}: el archivo tiene que empezar con --- y los datos del post.")
    resto = texto[4:]
    fin = resto.find("\n---")
    if fin < 0:
        raise Fallo(f"{origen}: falta el --- que cierra los datos del post.")
    bloque = resto[:fin]
    cuerpo = resto[fin + 4:]
    if cuerpo.startswith("\n"):
        cuerpo = cuerpo[1:]
    datos = {}
    lineas = bloque.split("\n")
    i = 0
    while i < len(lineas):
        linea = lineas[i]
        if not linea.strip() or linea.strip().startswith("#"):
            i += 1
            continue
        if linea[0] in " \t":
            raise Fallo(f"{origen}: hay una línea mal indentada en los datos: {linea.strip()[:80]}")
        if ":" not in linea:
            raise Fallo(f"{origen}: no entiendo esta línea de los datos: {linea.strip()[:80]}")
        clave, valor = linea.split(":", 1)
        clave = clave.strip()
        valor = valor.strip()
        if clave in datos:
            raise Fallo(f"{origen}: la clave {clave} está repetida.")
        if clave not in CLAVES:
            raise Fallo(f"{origen}: la clave «{clave}» no se usa. Revisa el README del blog.")
        if valor == "":
            items = []
            j = i + 1
            while j < len(lineas):
                siguiente = lineas[j]
                if not siguiente.strip() or siguiente.strip().startswith("#"):
                    j += 1
                    continue
                if siguiente.startswith("  - ") or siguiente.startswith("\t- "):
                    items.append(quitar_comillas(siguiente.strip()[2:]))
                    j += 1
                    continue
                break
            datos[clave] = items if items else ""
            i = j
            continue
        datos[clave] = quitar_comillas(valor)
        i += 1
    return datos, cuerpo


def texto_prohibido(texto):
    return bool(PROHIBIDO.search(str(texto)))


def marca_reservada(texto):
    return "@@" in str(texto)


def host_de(url):
    try:
        return (urlparse(url).hostname or "").lower().removeprefix("www.")
    except ValueError:
        return ""


def enlace_rechazado(url):
    bajo = url.lower()
    if "\\" in url or "@@" in url:
        return True
    if bajo.startswith(("javascript:", "data:", "//")):
        return True
    # http:host o https:host, sin las dos barras, no es una ruta del sitio.
    if re.match(r"^https?:(?!//)", bajo):
        return True
    return False


def enlace(texto, url, origen, errores):
    url = url.strip()
    if texto_prohibido(url) or texto_prohibido(texto):
        errores.append(f"{origen}: no enlaces Amazon, eBay, Mercado Libre ni campid. Solo la tienda propia y el curso.")
        return esc(texto)
    if enlace_rechazado(url):
        errores.append(f"{origen}: el enlace no es válido. Usa https:// con dos barras, o una ruta del sitio.")
        return esc(texto)
    if url.startswith(("http://", "https://")):
        host = host_de(url)
        if host != "granjarentable.com":
            return f'<a href="{esc(url)}" rel="noopener nofollow" target="_blank">{esc(texto)}</a>'
    return f'<a href="{esc(url)}">{esc(texto)}</a>'


def en_linea(texto, origen, errores):
    partes = []
    pos = 0
    patron = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*")
    for coincidencia in patron.finditer(texto):
        partes.append(esc(texto[pos:coincidencia.start()]))
        if coincidencia.group(1) is not None:
            partes.append(enlace(coincidencia.group(1), coincidencia.group(2), origen, errores))
        elif coincidencia.group(3) is not None:
            partes.append("<strong>" + esc(coincidencia.group(3)) + "</strong>")
        else:
            partes.append("<em>" + esc(coincidencia.group(4)) + "</em>")
        pos = coincidencia.end()
    partes.append(esc(texto[pos:]))
    return "".join(partes)


def es_separador(linea):
    celdas = [c.strip() for c in linea.strip().strip("|").split("|")]
    return bool(celdas) and all(re.fullmatch(r":?-{3,}:?", c) for c in celdas)


def celdas_de(linea):
    return [c.strip() for c in linea.strip().strip("|").split("|")]


def markdown_a_html(texto, origen, errores):
    if marca_reservada(texto):
        errores.append(f"{origen}: el texto lleva una marca reservada. Quítale las arrobas dobles.")
    if VOCABULARIO.search(texto):
        errores.append(f"{origen}: escribe «pollos de engorde», no «pollo de carne» ni «broiler».")
    if texto_prohibido(texto):
        errores.append(f"{origen}: el texto nombra Amazon, eBay, Mercado Libre o campid. Solo se enlaza la tienda propia y el curso.")
    lineas = texto.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    html = []
    i = 0
    while i < len(lineas):
        linea = lineas[i]
        if not linea.strip():
            i += 1
            continue
        if linea.startswith("# "):
            errores.append(f"{origen}: el título del artículo va en los datos, no como # en el texto.")
            i += 1
            continue
        if linea.startswith("### "):
            html.append("<h3>" + en_linea(linea[4:].strip(), origen, errores) + "</h3>")
            i += 1
            continue
        if linea.startswith("## "):
            html.append("<h2>" + en_linea(linea[3:].strip(), origen, errores) + "</h2>")
            i += 1
            continue
        if linea.lstrip().startswith(("- ", "* ")):
            items = []
            while i < len(lineas) and lineas[i].lstrip().startswith(("- ", "* ")):
                items.append(en_linea(lineas[i].lstrip()[2:].strip(), origen, errores))
                i += 1
            html.append("<ul class=\"steps\">\n" + "".join(f"<li>{item}</li>\n" for item in items) + "</ul>")
            continue
        if "|" in linea and i + 1 < len(lineas) and es_separador(lineas[i + 1]):
            cabecera = celdas_de(linea)
            i += 2
            filas = []
            while i < len(lineas) and "|" in lineas[i] and lineas[i].strip():
                filas.append(celdas_de(lineas[i]))
                i += 1
            thead = "".join(f"<th>{en_linea(c, origen, errores)}</th>" for c in cabecera)
            cuerpo = []
            for fila in filas:
                cuerpo.append("<tr>" + "".join(f"<td>{en_linea(c, origen, errores)}</td>" for c in fila) + "</tr>")
            html.append("<div class=\"tabla\"><table>\n<thead><tr>" + thead + "</tr></thead>\n<tbody>\n"
                        + "\n".join(cuerpo) + "\n</tbody></table></div>")
            continue
        buf = [linea.strip()]
        i += 1
        while i < len(lineas) and lineas[i].strip():
            siguiente = lineas[i]
            if siguiente.startswith("#") or siguiente.lstrip().startswith(("- ", "* ")):
                break
            if "|" in siguiente and i + 1 < len(lineas) and es_separador(lineas[i + 1]):
                break
            buf.append(siguiente.strip())
            i += 1
        html.append("<p>" + en_linea(" ".join(buf), origen, errores) + "</p>")
    salida = "\n".join(html)
    return salida.replace("{{", "&#123;&#123;").replace("{%", "&#123;%")


def cargar_catalogo(raiz):
    ruta = raiz / "data" / "catalogo.json"
    if not ruta.is_file():
        return {}
    datos = json.loads(ruta.read_text(encoding="utf-8"))
    return {item["id"]: item for item in datos if "id" in item}


def titulo_leccion(raiz, codigo):
    ruta = raiz / "lecciones" / f"{codigo}.html"
    if not ruta.is_file():
        return None
    coincidencia = re.search(r"<h1>(.*?)</h1>", ruta.read_text(encoding="utf-8"), re.S)
    if not coincidencia:
        return None
    texto = re.sub(r"<[^>]+>", "", coincidencia.group(1))
    return re.sub(r"\s+", " ", texto).strip()


def revisar_imagen(raiz, rel, ancho, alto, origen, etiqueta):
    if not rel or ".." in rel.split("/") or not re.fullmatch(r"img/blog/[a-z0-9_-]+\.webp", rel):
        raise Fallo(f"{origen}: {etiqueta} tiene que ser un archivo img/blog/nombre.webp (sin mayúsculas ni carpetas raras).")
    ruta = raiz / rel
    if not ruta.is_file():
        raise Fallo(f"{origen}: no está el archivo {rel}.")
    medida = medida_webp(ruta)
    if medida != (ancho, alto):
        visto = f"{medida[0]}×{medida[1]}" if medida else "no es un webp válido"
        raise Fallo(f"{origen}: {etiqueta} ({rel}) mide {visto} y tiene que medir {ancho}×{alto}.")


def cargar_posts(raiz, incluir_borradores):
    carpeta = raiz / CARPETA_POSTS
    errores = []
    posts = []
    if not carpeta.is_dir():
        return posts, errores
    catalogo = cargar_catalogo(raiz)
    vistos = set()
    for ruta in sorted(carpeta.glob("*.md")):
        origen = f"{CARPETA_POSTS}/{ruta.name}"
        try:
            datos, cuerpo = parsear_frontmatter(ruta.read_text(encoding="utf-8"), origen)
        except Fallo as exc:
            errores.append(str(exc))
            continue
        except UnicodeError:
            errores.append(f"{origen}: el archivo no está en UTF-8.")
            continue
        try:
            post = normalizar(raiz, ruta, datos, cuerpo, origen, catalogo, incluir_borradores)
        except Fallo as exc:
            errores.append(str(exc))
            continue
        if post["slug"] in vistos:
            errores.append(f"{origen}: ya hay otro post con la dirección {post['slug']}.")
            continue
        vistos.add(post["slug"])
        posts.append(post)
    return posts, errores


def campo(datos, clave):
    valor = datos.get(clave, "")
    if isinstance(valor, list):
        return valor
    return str(valor).strip()


def exigir_largo(texto, maximo, origen, nombre):
    if len(texto) > maximo:
        raise Fallo(f"{origen}: {nombre} tiene {len(texto)} caracteres. El máximo es {maximo}.")


def exigir_limpio(texto, origen, nombre):
    if not str(texto).strip():
        return
    if marca_reservada(texto):
        raise Fallo(f"{origen}: {nombre} lleva una marca reservada. Quítale las arrobas dobles.")
    if texto_prohibido(texto):
        raise Fallo(f"{origen}: {nombre} nombra Amazon, eBay, Mercado Libre o campid. No se publica.")
    if VOCABULARIO.search(str(texto)):
        raise Fallo(f"{origen}: escribe «pollos de engorde», no «pollo de carne» ni «broiler».")


def normalizar(raiz, ruta, datos, cuerpo, origen, catalogo, incluir_borradores):
    nombre = ruta.stem
    coincidencia = re.fullmatch(r"(\d{4}-\d{2}-\d{2})-(.+)", nombre)
    slug = coincidencia.group(2) if coincidencia else nombre
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug) or slug in RESERVADOS or slug.startswith("pagina-"):
        raise Fallo(f"{origen}: el nombre del archivo no vale como dirección ({slug}).")
    titulo = campo(datos, "titulo")
    if not titulo:
        raise Fallo(f"{origen}: falta el titulo.")
    titulo_seo = campo(datos, "titulo_seo") or titulo
    descripcion = campo(datos, "descripcion")
    if not descripcion:
        raise Fallo(f"{origen}: falta la descripcion.")
    exigir_largo(titulo, MAX_TITULO, origen, "el titulo")
    exigir_largo(titulo_seo, MAX_TITULO, origen, "el titulo")
    exigir_largo(descripcion, MAX_DESCRIPCION, origen, "la descripcion")
    exigir_limpio(titulo, origen, "el titulo")
    exigir_limpio(titulo_seo, origen, "el titulo")
    exigir_limpio(descripcion, origen, "la descripcion")
    cat = campo(datos, "categoria")
    if cat not in CATS:
        raise Fallo(f"{origen}: categoria tiene que ser ponedoras, engorde, incubacion, salud o alimentacion.")
    if "fecha" not in datos or not str(datos.get("fecha", "")).strip():
        raise Fallo(f"{origen}: falta la fecha.")
    fecha = a_fecha(datos["fecha"], origen, "fecha")
    actualizado = fecha
    if str(datos.get("actualizado", "")).strip():
        actualizado = a_fecha(datos["actualizado"], origen, "actualizado")
    if "borrador" in datos and str(datos.get("borrador", "")).strip() != "":
        borrador = a_bool(datos["borrador"], origen, "borrador")
    else:
        borrador = True
    guia = campo(datos, "guia") or CATS[cat]["guia"]
    if guia not in GUIAS:
        raise Fallo(f"{origen}: guia tiene que ser empezar, espacio o incubadora.")
    leccion = campo(datos, "leccion").lower()
    if leccion and not titulo_leccion(raiz, leccion):
        raise Fallo(f"{origen}: no existe la lección {leccion}.")
    producto = campo(datos, "producto")
    if producto and (producto not in catalogo or not (raiz / "producto" / f"{producto}.html").is_file()):
        raise Fallo(f"{origen}: producto tiene que ser una ficha de producto/ que esté en el catálogo.")
    video = campo(datos, "video")
    if video and not re.fullmatch(r"[A-Za-z0-9_-]{6,20}", video):
        raise Fallo(f"{origen}: video tiene que ser el id de YouTube, sin la dirección completa.")
    red = campo(datos, "red")
    if red:
        exigir_limpio(red, origen, "red")
        if enlace_rechazado(red) or not red.startswith("https://") or host_de(red) in ("",):
            raise Fallo(f"{origen}: red tiene que ser un enlace https (o dejarse vacío).")
    fuentes = datos.get("fuentes", "")
    if fuentes == "":
        fuentes = []
    if not isinstance(fuentes, list) or not all(isinstance(x, str) and x.strip() for x in fuentes):
        raise Fallo(f"{origen}: fuentes es una lista de textos.")
    for fuente in fuentes:
        exigir_limpio(fuente, origen, "fuentes")
    imagen = campo(datos, "imagen")
    imagen_og = campo(datos, "imagen_og")
    imagen_alt = campo(datos, "imagen_alt")
    exigir_limpio(imagen_alt, origen, "imagen_alt")
    se_publica = (not borrador) or incluir_borradores
    if imagen or se_publica:
        if not imagen:
            raise Fallo(f"{origen}: sin imagen no se publica. Sube un webp de {ANCHO_FOTO}×{ALTO_FOTO} a img/blog/.")
        revisar_imagen(raiz, imagen, ANCHO_FOTO, ALTO_FOTO, origen, "imagen")
        if not imagen_og:
            raise Fallo(f"{origen}: falta imagen_og, el webp de {ANCHO_OG}×{ALTO_OG} para redes.")
        revisar_imagen(raiz, imagen_og, ANCHO_OG, ALTO_OG, origen, "imagen_og")
        if len(imagen_alt) < 20 or "pendiente" in imagen_alt.lower():
            raise Fallo(f"{origen}: imagen_alt tiene que describir la foto (más de unas palabras, nunca «pendiente»).")
    errores_md = []
    html = markdown_a_html(cuerpo, origen, errores_md)
    if errores_md:
        raise Fallo(" ".join(errores_md))
    return {
        "origen": origen,
        "slug": slug,
        "titulo": titulo,
        "titulo_seo": titulo_seo,
        "descripcion": descripcion,
        "categoria": cat,
        "fecha": fecha,
        "actualizado": actualizado,
        "borrador": borrador,
        "guia": guia,
        "leccion": leccion,
        "producto": producto,
        "imagen": imagen,
        "imagen_og": imagen_og,
        "imagen_alt": imagen_alt,
        "video": video,
        "red": red,
        "fuentes": [x.strip() for x in fuentes],
        "html": html,
        "publicar": not borrador,
    }


def fecha_larga(dia):
    return f"{dia.day} de {MESES[dia.month - 1]} de {dia.year}"


def json_seguro(obj):
    texto = json.dumps(obj, ensure_ascii=False, separators=(",", ":"))
    return texto.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


def titulo_visible(base):
    """El <title> no pasa de 60. El sufijo solo entra si cabe entero."""
    base = str(base).rstrip()
    if len(base) + len(SUFIJO_TITULO) <= MAX_TITULO:
        return base + SUFIJO_TITULO
    return base


def poner_actual(menu, clave):
    menu = menu.replace(' aria-current="page"', "")
    if not clave:
        return menu
    menu = menu.replace(f'data-nav="{clave}"', f'data-nav="{clave}" aria-current="page"', 1)
    if clave in CLAVES_HERRAMIENTAS:
        menu = menu.replace('data-nav="herramientas"', 'data-nav="herramientas" aria-current="page"', 1)
    return menu


def menu_listo(plantilla, raiz, clave):
    return poner_actual(plantilla.replace("@@RAIZ@@", raiz), clave)


def asegurar_portada(html, hay_posts):
    coincidencia = re.search(r'(<div class="shop-links">)(.*?)(</div>)', html, re.S)
    if not coincidencia:
        return html
    bloque = coincidencia.group(2)
    if not hay_posts:
        bloque = re.sub(r'\n?<a class="btn sec" href="blog/">Artículos</a>', "", bloque, count=1)
        return html[:coincidencia.start(2)] + bloque + html[coincidencia.end(2):]
    if 'href="blog/"' in bloque:
        return html
    extra = '\n<a class="btn sec" href="blog/">Artículos</a>'
    if 'href="curso.html">Curso gratis</a>' in bloque:
        bloque = bloque.replace('href="curso.html">Curso gratis</a>', 'href="curso.html">Curso gratis</a>' + extra, 1)
    else:
        bloque = extra + bloque
    return html[:coincidencia.start(2)] + bloque + html[coincidencia.end(2):]


def menu_segun_posts(menu, hay_posts):
    if hay_posts:
        return menu
    return re.sub(r'\n?<a data-nav="articulos"[\s\S]*?</a>', "", menu, count=1)


def pie_segun_posts(pie, hay_posts):
    if hay_posts:
        return pie
    return re.sub(r'\n?<li><a href="@@RAIZ@@blog/">Artículos</a></li>', "", pie, count=1)


def pagina_sin_whatsapp(rel):
    return rel.replace("\\", "/") in SIN_WHATSAPP


def quitar_whatsapp_nav(menu):
    return re.sub(r'\n?<a class="nav-wa"[\s\S]*?</a>', "", menu, count=1)


def conservar_messenger(menu, original):
    encontrado = re.search(
        r'<a\b[^>]*(?:data-social="messenger"|m\.me/)[^>]*>[\s\S]*?</a>',
        original)
    if not encontrado:
        return menu
    enlace = encontrado.group(0)
    if "m.me/" in menu or 'data-social="messenger"' in menu:
        return menu
    if "<!-- menu:fin -->" in menu:
        return menu.replace("<!-- menu:fin -->", enlace + "\n<!-- menu:fin -->", 1)
    return menu + "\n" + enlace


def limpiar_whatsapp(html):
    html = quitar_whatsapp_nav(html)
    html = re.sub(r'\n?<a class="wa-float"[\s\S]*?</a>', "", html, count=1)
    html = re.sub(
        r'\n?<li>\s*<a[^>]*data-social="whatsapp"[^>]*>[\s\S]*?</a>\s*</li>',
        "", html, count=1)
    return html


def poner_version(html):
    for nombre in (
            "css/estilo.css", "css/blog.css", "js/boot.js", "js/blog.js",
            "js/site.js", "js/app.js", "js/config.js"):
        html = re.sub(
            rf'((?:href|src)="[^"]*?{re.escape(nombre)})(?:\?v=\d+)?"',
            rf'\1?v={VERSION_ACTIVOS}"',
            html)
    return html


def aplicar_menu(html, rel, menu_html, pie_html, hay_posts):
    if 'id="site-nav"' not in html:
        return poner_version(html), False
    raiz = raiz_de(rel)
    menu = menu_listo(menu_html, raiz, clave_nav(rel))
    if pagina_sin_whatsapp(rel):
        menu = conservar_messenger(quitar_whatsapp_nav(menu), html)
    pie = pie_html.replace("@@RAIZ@@", raiz)
    if "<!-- menu:inicio -->" in html and "<!-- menu:fin -->" in html:
        html = re.sub(r"<!-- menu:inicio -->.*?<!-- menu:fin -->", lambda _: menu, html, count=1, flags=re.S)
    else:
        html, n = re.subn(
            r'(<nav id="site-nav" class="nav" aria-label="Principal">).*?(</nav>)',
            lambda m: m.group(1) + "\n" + menu + m.group(2),
            html, count=1, flags=re.S)
        if n != 1:
            raise Fallo(f"{rel}: tiene el menú, pero no pude sustituirlo.")
    if "<!-- pie-sitio:inicio -->" in html and "<!-- pie-sitio:fin -->" in html:
        html = re.sub(r"<!-- pie-sitio:inicio -->.*?<!-- pie-sitio:fin -->", lambda _: pie, html, count=1, flags=re.S)
    else:
        html, n = re.subn(
            r'(<p class="foot-brand">Sitio</p>\s*)<ul>.*?</ul>',
            lambda m: m.group(1) + pie,
            html, count=1, flags=re.S)
        if n != 1:
            raise Fallo(f"{rel}: tiene menú y no encontré la lista Sitio del pie.")
    if rel == "index.html":
        html = asegurar_portada(html, hay_posts)
    if pagina_sin_whatsapp(rel):
        html = limpiar_whatsapp(html)
    return poner_version(html), True


def anuncios_activos(raiz):
    """True solo si js/config.js deja window.ads.activo en true.

    Con false, o si falta el archivo, el blog no pinta huecos ni carga anuncios.
    """
    ruta = Path(raiz) / "js" / "config.js"
    try:
        texto = ruta.read_text(encoding="utf-8")
    except OSError:
        return False
    coincidencia = re.search(r"window\.ads\s*=\s*\{([^}]*)\}", texto)
    if not coincidencia:
        return False
    return re.search(r"\bactivo\s*:\s*true\b", coincidencia.group(1)) is not None


def anuncio(tamano, activo):
    if not activo:
        return ""
    return (f'<aside class="ad-inline" data-ad-size="{tamano}"><p class="ad-label">Publicidad</p>'
            f'<div class="ad-slot" data-ad-slot="{tamano}" data-ad-size="{tamano}"></div></aside>')


def variantes_portada(imagen):
    if RAIZ_FS is None or not str(imagen).endswith(".webp"):
        return None
    stem = str(imagen)[:-5]
    if (RAIZ_FS / f"{stem}-400.webp").is_file() and (RAIZ_FS / f"{stem}-800.webp").is_file():
        return stem
    return None


def etiqueta_foto(raiz, imagen, alt, prioritaria, sizes):
    stem = variantes_portada(imagen)
    if not stem:
        return f'<img src="{esc(raiz + imagen)}" alt="{esc(alt)}" width="1200" height="675">'
    carga = 'fetchpriority="high" decoding="async"' if prioritaria else 'loading="lazy" decoding="async"'
    return (f'<img src="{esc(raiz + stem)}-800.webp" '
            f'srcset="{esc(raiz + stem)}-400.webp 400w, {esc(raiz + stem)}-800.webp 800w" '
            f'sizes="{sizes}" alt="{esc(alt)}" width="800" height="450" {carga}>')


def tarjeta(post, raiz, prioritaria=False):
    foto = etiqueta_foto(raiz, post["imagen"], post["imagen_alt"], prioritaria, SIZES_TARJETA)
    return f'''<article class="pcard">
<a class="pcard-media post-media" href="{esc(post["slug"])}.html">{foto}</a>
<div class="pcard-body">
<p class="pcard-cat">{esc(CATS[post["categoria"]]["nombre"])}</p>
<h3><a href="{esc(post["slug"])}.html">{esc(post["titulo"])}</a></h3>
<p class="post-meta">{("Basado en la lección " + esc(post["leccion"].upper()) + " · ") if post["leccion"] else ""}Lectura corta</p>
<p>{esc(post["descripcion"])}</p>
<a class="post-more" href="{esc(post["slug"])}.html">Leer artículo →</a>
</div>
</article>'''


def categorias_nav(actual):
    enlaces = ['<a href="index.html"' + (' aria-current="page"' if actual == "" else "") + '>Todos</a>']
    for clave, meta in ((c[0], CATS[c[0]]) for c in CATEGORIAS):
        marca = ' aria-current="page"' if actual == clave else ""
        enlaces.append(f'<a href="{esc(meta["slug"])}.html"{marca}>{esc(meta["nombre"])}</a>')
    return '<nav class="cats" aria-label="Categorías del blog">\n' + "\n".join(enlaces) + "\n</nav>"


def bloque_guias(raiz):
    piezas = []
    for clave in ("empezar", "espacio", "incubadora"):
        href, titulo, texto = GUIAS[clave]
        piezas.append(f"<article><h2><a href=\"{esc(raiz + href)}\">{esc(titulo)}</a></h2><p>{esc(texto)}</p></article>")
    return ("<section class=\"blog-guias\">\n<p class=\"kicker\">Para empezar</p>\n<h2>Guías fijas</h2>\n"
            "<p>Las guías no cambian de sitio. Los artículos las enlazan.</p>\n<div class=\"guia-list\">\n"
            + "\n".join(piezas) + "\n</div>\n</section>")


def bloque_curso(raiz):
    return ("<section class=\"panel panel-shop\">\n<h2>¿Quieres aprenderlo con video?</h2>\n"
            "<p>El curso es gratis y va paso a paso. Las herramientas que usamos están en nuestra tienda.</p>\n"
            f"<p class=\"split\"><a class=\"btn gold\" href=\"{esc(raiz)}curso.html\">Empezar el curso gratis</a> "
            f"<a class=\"btn sec\" href=\"{esc(raiz)}tienda.html\">Ver la tienda</a></p>\n</section>")


def relacionados(post, publicados):
    misma = [p for p in publicados if p["slug"] != post["slug"] and p["categoria"] == post["categoria"]]
    otros = [p for p in publicados if p["slug"] != post["slug"] and p["categoria"] != post["categoria"]]
    return (misma + otros)[:3]


def html_post(post, publicados, catalogo, raiz_sitio, activo):
    raiz = "../"
    migas = (f'<p class="crumbs"><a href="{raiz}index.html">Inicio</a> › '
             f'<a href="index.html">Artículos</a> › '
             f'<a href="{esc(CATS[post["categoria"]]["slug"])}.html">{esc(CATS[post["categoria"]]["nombre"])}</a></p>')
    meta = fecha_larga(post["fecha"]) + " · " + esc(AUTOR)
    if post["leccion"]:
        meta += f' · Basado en la lección <a href="{raiz}lecciones/{esc(post["leccion"])}.html">{esc(post["leccion"].upper())}</a>'
    cabeza = (f'<header class="page-hero post-head">\n{migas}\n'
              f'<p class="kicker">{esc(CATS[post["categoria"]]["nombre"])}</p>\n'
              f'<h1>{esc(post["titulo"])}</h1>\n<p class="post-meta">{meta}</p>\n</header>')
    foto = ('<figure class="post-foto">'
            + etiqueta_foto(raiz, post["imagen"], post["imagen_alt"], True, SIZES_FICHA)
            + '</figure>')
    guia_href, guia_titulo, _ = GUIAS[post["guia"]]
    guia = (f'<p>La guía fija de este tema es <a href="{raiz}{esc(guia_href)}">{esc(guia_titulo)}</a>.</p>')
    fuentes = ""
    if post["fuentes"]:
        fuentes = '<p class="fuentes"><strong>Fuentes:</strong> ' + " ".join(esc(f) for f in post["fuentes"]) + "</p>"
    red = ""
    if post["red"]:
        red = ('<p class="post-meta">Este texto sale de <a href="' + esc(post["red"])
               + '" rel="noopener nofollow" target="_blank">la publicación en redes</a>.</p>')
    video = ""
    if post["video"]:
        video = (f'<h2>Video</h2>\n<button class="yt-facade" type="button" data-yt="{esc(post["video"])}">'
                 'Ver el video (se carga al pulsar)</button>')
    cajas = []
    if post["leccion"]:
        nombre = titulo_leccion(raiz_sitio, post["leccion"]) or post["leccion"].upper()
        cajas.append('<section class="panel">\n<h3>Aprende la lección completa</h3>\n'
                     f'<p>{esc(nombre if nombre.endswith(".") else nombre + ".")} Es gratis.</p>\n'
                     f'<a class="btn gold" href="{raiz}lecciones/{esc(post["leccion"])}.html">Ver la lección {esc(post["leccion"].upper())}</a>\n'
                     '</section>')
    if post["producto"]:
        ficha = catalogo[post["producto"]]
        nota = " El precio y si hay envío salen en la ficha, según tu país."
        if post["producto"] == "incubadora-24egg-dual":
            nota += " En Estados Unidos, la ficha muestra la WONEGG 48."
        cajas.append('<section class="panel panel-shop">\n<h3>En nuestra tienda</h3>\n'
                     f'<div class="media-mini"><img src="{esc(raiz + ficha["imagen"])}" alt="{esc(ficha.get("alt") or ficha["nombre"])}" width="84" height="84">'
                     f'<p>{esc(ficha["nombre"])}. {esc(ficha.get("resumen") or "")}{esc(nota)}</p></div>\n'
                     f'<a class="btn sec" href="{raiz}producto/{esc(post["producto"])}.html">Ver la ficha</a>\n</section>')
    cta = ""
    if cajas:
        cta = '<div class="post-cta">\n' + "\n".join(cajas) + "\n</div>"
    cerca = relacionados(post, publicados)
    bloque_cerca = ""
    if cerca:
        bloque_cerca = ('<section>\n<p class="kicker">Sigue leyendo</p>\n<h2>Artículos relacionados</h2>\n<div class="pgrid">\n'
                        + "\n".join(tarjeta(p, raiz) for p in cerca) + "\n</div>\n</section>")
    return (cabeza + "\n" + anuncio("banner", activo) + "\n" + foto + "\n"
            + '<div class="panel prose post-body">\n' + post["html"] + "\n" + video + "\n" + guia + "\n" + red + "\n" + fuentes
            + "\n</div>\n" + cta + "\n" + bloque_cerca + "\n" + anuncio("rect", activo))


def listado(posts, pagina, total_paginas):
    inicio = (pagina - 1) * POR_PAGINA
    corte = posts[inicio:inicio + POR_PAGINA]
    if not corte:
        return '<p class="blog-vacio">Todavía no hay artículos publicados. Cada texto se revisa antes de salir aquí.</p>'
    html = '<div class="pgrid">\n' + "\n".join(tarjeta(p, "../", i == 0) for i, p in enumerate(corte)) + "\n</div>"
    if total_paginas > 1:
        enlaces = []
        if pagina > 1:
            anterior = "index.html" if pagina == 2 else f"pagina-{pagina - 1}.html"
            enlaces.append(f'<a class="btn sec" href="{anterior}">Artículos anteriores</a>')
        if pagina < total_paginas:
            enlaces.append(f'<a class="btn sec" href="pagina-{pagina + 1}.html">Ver más artículos</a>')
        html += '\n<p class="split">' + " ".join(enlaces) + "</p>"
    return html


def envolver(shell, rel, titulo, descripcion, canonical, robots, og_type, og_image, og_alt, extra, contenido, menu_html, pie_html):
    raiz = raiz_de(rel)
    menu = menu_listo(menu_html, raiz, clave_nav(rel))
    pie = pie_html.replace("@@RAIZ@@", raiz)
    pagina = MARCA_PAGINA + "\n" + shell
    cambios = {
        "@@MENU@@": menu,
        "@@PIE@@": pie,
        "@@RAIZ@@": raiz,
        "@@TITULO@@": esc(titulo),
        "@@DESCRIPCION@@": esc(descripcion),
        "@@CANONICAL@@": esc(canonical),
        "@@ROBOTS@@": robots,
        "@@OG_TYPE@@": og_type,
        "@@OG_IMAGE@@": esc(og_image),
        "@@OG_ALT@@": esc(og_alt),
        "@@AUTOR@@": esc(AUTOR),
        "@@EXTRA_HEAD@@": extra,
        "@@CONTENIDO@@": contenido,
    }
    for clave, valor in cambios.items():
        if clave == "@@CONTENIDO@@":
            continue
        pagina = pagina.replace(clave, valor)
    pagina = pagina.replace("@@CONTENIDO@@", contenido, 1)
    if "@@" in pagina:
        raise Fallo("Quedó un hueco sin rellenar en la plantilla de la página.")
    pagina = pagina.replace("{{", "&#123;&#123;").replace("{%", "&#123;%")
    if "Imagen pendiente" in pagina or 'class="ph"' in pagina:
        raise Fallo("La página salió con un hueco de imagen. No se publica.")
    return poner_version(pagina)


def ld_blog():
    return '<script type="application/ld+json">' + json_seguro({
        "@context": "https://schema.org",
        "@type": "Blog",
        "name": "Artículos de avicultura | Granja Rentable",
        "url": SITIO + "/blog/",
        "inLanguage": "es-419",
        "author": {"@type": "Person", "name": AUTOR},
        "publisher": {"@type": "Organization", "name": EDITOR, "logo": LOGO},
    }) + "</script>"


def ld_articulo(post, canonical):
    articulo = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post["titulo"],
        "description": post["descripcion"],
        "image": SITIO + "/" + post["imagen_og"],
        "datePublished": post["fecha"].isoformat(),
        "dateModified": post["actualizado"].isoformat(),
        "inLanguage": "es-419",
        "author": {"@type": "Person", "name": AUTOR},
        "publisher": {
            "@type": "Organization",
            "name": EDITOR,
            "logo": {"@type": "ImageObject", "url": LOGO},
        },
        "mainEntityOfPage": canonical,
        "articleSection": CATS[post["categoria"]]["nombre"],
    }
    migas = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITIO + "/"},
            {"@type": "ListItem", "position": 2, "name": "Artículos", "item": SITIO + "/blog/"},
            {"@type": "ListItem", "position": 3, "name": CATS[post["categoria"]]["nombre"],
             "item": SITIO + "/blog/" + CATS[post["categoria"]]["slug"] + ".html"},
        ],
    }
    return ('<script type="application/ld+json">' + json_seguro(articulo) + "</script>\n"
            + '<script type="application/ld+json">' + json_seguro(migas) + "</script>")


def ld_categoria(meta):
    migas = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITIO + "/"},
            {"@type": "ListItem", "position": 2, "name": "Artículos", "item": SITIO + "/blog/"},
            {"@type": "ListItem", "position": 3, "name": meta["nombre"],
             "item": SITIO + "/blog/" + meta["slug"] + ".html"},
        ],
    }
    return '<script type="application/ld+json">' + json_seguro(migas) + "</script>"


def paginas_html(raiz):
    for ruta in raiz.rglob("*.html"):
        rel = ruta.relative_to(raiz).as_posix()
        if rel.startswith(("_", "blog/plantillas/", "blog/pruebas/", "blog/posts/", f"{CARPETA_POSTS}/")):
            continue
        if "/_" in rel:
            continue
        if rel.startswith("blog/") and ruta.name.endswith(".html"):
            continue
        yield rel, ruta


def html_es_noindex(html):
    encontrado = re.search(r'<meta\s+name=["\']robots["\']\s+content=["\']([^"\']*)["\']', html or "", re.I)
    return bool(encontrado and "noindex" in encontrado.group(1).lower())


def rel_de_loc(loc):
    ruta = loc.replace(SITIO, "", 1).split("?", 1)[0]
    if ruta in ("", "/"):
        return "index.html"
    if ruta.rstrip("/") == "/blog":
        return "blog/index.html"
    rel = ruta.lstrip("/")
    if rel.endswith("/"):
        return rel + "index.html"
    return rel


def actualizar_sitemap(texto, entradas, raiz=None):
    texto = re.sub(r"\s*<url>\s*<loc>https://granjarentable.com/blog[^<]*</loc>.*?</url>", "", texto, flags=re.S)
    if raiz is not None:
        def quitar_noindex(coincidencia):
            loc = re.search(r"<loc>([^<]+)</loc>", coincidencia.group(0))
            if not loc:
                return coincidencia.group(0)
            archivo = Path(raiz) / rel_de_loc(loc.group(1).strip())
            if archivo.is_file() and html_es_noindex(archivo.read_text(encoding="utf-8", errors="replace")):
                return ""
            return coincidencia.group(0)
        texto = re.sub(r"\s*<url>\s*<loc>.*?</url>", quitar_noindex, texto, flags=re.S)
    bloque = []
    for loc, lastmod in entradas:
        if lastmod:
            bloque.append(f"<url><loc>{loc}</loc><lastmod>{lastmod}</lastmod></url>")
        else:
            bloque.append(f"<url><loc>{loc}</loc></url>")
    if "</urlset>" not in texto:
        raise Fallo("sitemap.xml no tiene </urlset>.")
    extra = ("\n" + "\n".join(bloque) + "\n") if bloque else "\n"
    return texto.replace("</urlset>", extra + "</urlset>")


def planificar(raiz, incluir_borradores=False):
    global RAIZ_FS
    raiz = Path(raiz)
    RAIZ_FS = raiz
    if (raiz / ".nojekyll").exists():
        return ["Hay un .nojekyll en la raíz. Quítalo: si sigue ahí, Pages puede copiar las fuentes. La web sale solo de la Action, con _site/."], {}, []
    errores = []
    posts, errores_posts = cargar_posts(raiz, incluir_borradores)
    errores.extend(errores_posts)
    if errores:
        return errores, {}, []
    publicados = [p for p in posts if p["publicar"] or incluir_borradores]
    publicados.sort(key=lambda p: (p["fecha"], p["slug"]), reverse=True)
    activo = anuncios_activos(raiz)
    try:
        menu_html = (raiz / "blog" / "plantillas" / "menu.html").read_text(encoding="utf-8")
        pie_html = (raiz / "blog" / "plantillas" / "pie-sitio.html").read_text(encoding="utf-8")
        shell = (raiz / "blog" / "plantillas" / "pagina.html").read_text(encoding="utf-8")
    except OSError as exc:
        return [f"No pude leer las plantillas del blog: {exc}"], {}, []
    if "@@RAIZ@@blog/" not in menu_html or "Artículos" not in menu_html:
        return ["La plantilla del menú no incluye Artículos."], {}, []
    hay_posts = bool(publicados)
    menu_html = menu_segun_posts(menu_html, hay_posts)
    pie_html = pie_segun_posts(pie_html, hay_posts)
    archivos = {}
    try:
        for rel, ruta in paginas_html(raiz):
            nuevo, _ = aplicar_menu(ruta.read_text(encoding="utf-8"), rel, menu_html, pie_html, hay_posts)
            archivos[rel] = nuevo
    except Fallo as exc:
        return [str(exc)], {}, []
    catalogo = cargar_catalogo(raiz)
    def metas_indice(numero):
        titulo = "Artículos de avicultura para tu granja | Granja Rentable"
        descripcion = ("Artículos cortos sobre gallinas ponedoras, pollos de engorde, incubación, salud y alimentación, "
                       "sacados de las lecciones del curso gratis.")
        if numero > 1:
            titulo = f"Artículos de avicultura, página {numero} | Granja Rentable"
            descripcion = (f"Página {numero} de los artículos de avicultura de Granja Rentable: gallinas ponedoras, "
                           "pollos de engorde, incubación, salud y alimentación del curso gratis.")
        return titulo, descripcion

    og_portada = OG_BLOG
    paginas_indice = max(1, (len(publicados) + POR_PAGINA - 1) // POR_PAGINA) if publicados else 1
    for numero in range(1, paginas_indice + 1):
        rel = "blog/index.html" if numero == 1 else f"blog/pagina-{numero}.html"
        canonical = SITIO + "/blog/" if numero == 1 else SITIO + f"/blog/pagina-{numero}.html"
        hero = ('<section class="page-hero">\n<p class="kicker">Artículos</p>\n<h1>Artículos de avicultura</h1>\n'
                "<p>Textos cortos y prácticos para tu granja. Cada uno sale de una lección del curso gratis y dice de dónde vienen sus datos.</p>\n"
                "</section>")
        contenido = "\n".join(parte for parte in [
            hero,
            anuncio("banner", activo),
            categorias_nav(""),
            listado(publicados, numero, paginas_indice),
            bloque_guias("../"),
            bloque_curso("../"),
            anuncio("rect", activo),
        ] if parte)
        titulo_blog, descripcion_blog = metas_indice(numero)
        archivos[rel] = envolver(
            shell, rel, titulo_blog, descripcion_blog, canonical,
            "index,follow" if hay_posts else "noindex,follow", "website",
            og_portada, OG_BLOG_ALT, ld_blog(), contenido, menu_html, pie_html)
    for clave, meta in ((c[0], CATS[c[0]]) for c in CATEGORIAS):
        grupo = [p for p in publicados if p["categoria"] == clave]
        indexable = len(grupo) >= MINIMO_CATEGORIA
        rel = f"blog/{meta['slug']}.html"
        canonical = SITIO + "/blog/" + meta["slug"] + ".html"
        titulo = f"{meta['nombre']} | Artículos | Granja Rentable"
        visible = f"Artículos de {meta['nombre'].lower()} para granjas pequeñas, sacados de las lecciones del curso gratis."
        descripcion = visible + " Textos cortos de Granja Rentable."
        if len(descripcion) < 120:
            descripcion = visible + " Textos cortos, ya en Granja Rentable."
        if len(descripcion) > 155:
            descripcion = visible[:-1] + " de Granja Rentable."
        hero = (f'<section class="page-hero">\n<p class="crumbs"><a href="../index.html">Inicio</a> › <a href="index.html">Artículos</a></p>\n'
                f'<p class="kicker">Artículos</p>\n<h1>{esc(meta["nombre"])}</h1>\n'
                f'<p>{esc(visible)}</p>\n</section>')
        if grupo:
            rejilla = '<div class="pgrid">\n' + "\n".join(tarjeta(p, "../", i == 0) for i, p in enumerate(grupo)) + "\n</div>"
        else:
            rejilla = '<p class="blog-vacio">Todavía no hay artículos publicados en esta categoría.</p>'
        contenido = "\n".join(parte for parte in [
            hero, anuncio("banner", activo), categorias_nav(clave), rejilla,
            bloque_guias("../"), bloque_curso("../"), anuncio("rect", activo),
        ] if parte)
        archivos[rel] = envolver(
            shell, rel, titulo, descripcion, canonical,
            "index,follow" if indexable else "noindex,follow",
            "website", og_portada, OG_BLOG_ALT, ld_categoria(meta),
            contenido, menu_html, pie_html)
    for post in publicados:
        rel = f"blog/{post['slug']}.html"
        canonical = SITIO + "/blog/" + post["slug"] + ".html"
        titulo = titulo_visible(post["titulo_seo"])
        extra = ld_articulo(post, canonical)
        archivos[rel] = envolver(
            shell, rel, titulo, post["descripcion"], canonical, "index,follow", "article",
            OG_BLOG, OG_BLOG_ALT, extra,
            html_post(post, publicados, catalogo, raiz, activo), menu_html, pie_html)
    entradas = []
    if publicados:
        entradas.append((SITIO + "/blog/", max(p["actualizado"] for p in publicados).isoformat()))
    for numero in range(2, paginas_indice + 1):
        entradas.append((SITIO + f"/blog/pagina-{numero}.html", None))
    for clave in (c[0] for c in CATEGORIAS):
        grupo = [p for p in publicados if p["categoria"] == clave]
        if len(grupo) >= MINIMO_CATEGORIA:
            entradas.append((SITIO + "/blog/" + CATS[clave]["slug"] + ".html",
                             max(p["actualizado"] for p in grupo).isoformat()))
    for post in publicados:
        entradas.append((SITIO + "/blog/" + post["slug"] + ".html", post["actualizado"].isoformat()))
    for loc, _lastmod in entradas:
        rel = rel_de_loc(loc)
        if html_es_noindex(archivos.get(rel, "")):
            errores.append(f"sitemap: {loc} es noindex y no puede publicarse.")
    sitemap = raiz / "sitemap.xml"
    if errores:
        return errores, {}, []
    if sitemap.is_file():
        archivos["sitemap.xml"] = actualizar_sitemap(sitemap.read_text(encoding="utf-8"), entradas, raiz)
    else:
        errores.append("No está sitemap.xml.")
    borrar = []
    blog = raiz / "blog"
    if blog.is_dir():
        for ruta in blog.glob("*.html"):
            rel = f"blog/{ruta.name}"
            if rel not in archivos:
                texto = ruta.read_text(encoding="utf-8", errors="replace")
                if MARCA_PAGINA in texto:
                    borrar.append(rel)
    for rel in list(archivos):
        if rel.startswith(("blog/posts/", "blog/plantillas/", "blog/pruebas/", f"{CARPETA_POSTS}/", "_")) or "/_" in rel:
            errores.append(f"El generador iba a escribir en una carpeta excluida: {rel}")
    return errores, archivos, borrar


def escribir(raiz, archivos, borrar):
    raiz = Path(raiz)
    for rel, texto in archivos.items():
        destino = raiz / rel
        if destino.is_file() and destino.read_text(encoding="utf-8") == texto:
            continue
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(texto, encoding="utf-8")
    for rel in borrar:
        ruta = raiz / rel
        if ruta.is_file():
            ruta.unlink()


def generar(raiz, incluir_borradores=False):
    errores, archivos, borrar = planificar(raiz, incluir_borradores=incluir_borradores)
    if errores:
        return errores
    escribir(raiz, archivos, borrar)
    return []


def main(argv):
    if os.environ.get("GITHUB_ACTIONS") and "--incluir-borradores" in argv:
        print("La Action no publica borradores.", file=sys.stderr)
        return 1
    incluir = "--incluir-borradores" in argv
    raiz = Path(__file__).resolve().parents[1]
    errores = generar(raiz, incluir_borradores=incluir)
    if errores:
        for error in errores:
            print(error, file=sys.stderr)
        print("No se escribió nada.", file=sys.stderr)
        return 1
    print("Listo. Los borradores no salen en la web ni en el sitemap.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
