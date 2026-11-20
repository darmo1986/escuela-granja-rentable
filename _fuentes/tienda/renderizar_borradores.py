"""Renderiza la revisión de la ampliación; nunca modifica el catálogo público."""
import csv
import html
import json
from pathlib import Path
from urllib.parse import urlsplit, parse_qs

BASE = Path(__file__).resolve().parent
DESTINO = BASE / 'borradores-20261114'


def renderizar():
    datos = json.loads((DESTINO / 'fichas.json').read_text(encoding='utf-8'))
    productos = datos['productos']
    with (BASE / 'catalogo-origen.csv').open(encoding='utf-8-sig', newline='') as archivo:
        publicados = {fila['ASIN'] for fila in csv.DictReader(archivo)}
    vistos = set()
    bloques = []
    esc = html.escape
    for p in productos:
        asin = p['asin']
        assert asin not in vistos and asin not in publicados, f'ASIN duplicado: {asin}'
        vistos.add(asin)
        enlace = urlsplit(p['url_afiliado'])
        assert enlace.scheme == 'https' and enlace.netloc == 'www.amazon.com'
        assert enlace.path == f'/dp/{asin}'
        assert parse_qs(enlace.query) == {'tag': ['granjarentabl-20']}
        assert p['publicable'] is False and p['pendientes']
        imagen = (DESTINO / p['imagen']).resolve()
        assert imagen.is_relative_to(DESTINO.resolve()) and imagen.is_file()
        secciones = []
        for clave, titulo in [('destacados', 'Lo que más gusta del diseño'),
                              ('comprobar', 'Antes de elegirlo'),
                              ('consejos', 'Consejos de uso')]:
            assert p[clave]
            elementos = ''.join(f'<li>{esc(x)}</li>' for x in p[clave])
            secciones.append(f'<h3>{titulo}</h3><ul>{elementos}</ul>')
        bloques.append(f'''<article id="{asin}">
<figure><img src="{esc(p['imagen'])}" alt="{esc(p['titulo_seo'])}" width="1000" height="1000" loading="lazy"><figcaption>{esc(p['pie_imagen'])}</figcaption></figure>
<div class="texto"><p class="categoria">{esc(p['categoria'])}</p>
<h2>{esc(p['titulo_seo'])}</h2><p class="asin">ASIN {asin}</p>
<p>{esc(p['descripcion'])}</p><h3>Por qué lo preseleccionamos</h3><p>{esc(p['por_que'])}</p>
{''.join(secciones)}
<p class="nota">Selección editorial por características; no resume opiniones de compradores ni una prueba física.</p>
<a class="boton" href="{esc(p['url_afiliado'])}" rel="sponsored noopener" target="_blank">Comprobar variante y disponibilidad en Amazon</a>
<p><a href="{esc(p['referencia_producto'])}" rel="noopener" target="_blank">Referencia comercial utilizada</a></p>
<details><summary>Pendiente antes de publicar</summary><ul>{''.join(f'<li>{esc(x)}</li>' for x in p['pendientes'])}</ul></details></div></article>''')
    assert len(productos) == 7
    navegacion = ''.join(f'<a href="#{p["asin"]}">{esc(p["titulo_seo"])}</a>' for p in productos)
    documento = f'''<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Revisión de siete nuevas fichas · Granja Rentable</title>
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#f5f3ed;color:#203c2d;font:17px/1.6 system-ui,sans-serif}}header,main,footer{{max-width:1180px;margin:auto;padding:26px}}header{{padding-top:50px}}h1{{font-size:clamp(2rem,5vw,3.4rem);line-height:1.12;margin:.4em 0}}h2{{font-size:1.7rem;line-height:1.25}}h3{{font-size:1.1rem;margin:24px 0 6px}}p{{margin:10px 0}}a{{color:#256345;overflow-wrap:anywhere}}nav{{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}}nav a{{border:1px solid #b9c6ba;padding:8px 12px;border-radius:20px;text-decoration:none;font-size:.84rem}}article{{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:30px;background:white;border:1px solid #dce1d7;border-radius:22px;padding:24px;margin-bottom:32px;scroll-margin-top:20px}}figure{{margin:0}}img{{width:100%;height:auto;border-radius:14px}}figcaption,.nota,.asin{{font-size:.82rem;color:#536259}}.categoria{{font-size:.83rem;text-transform:uppercase;letter-spacing:.05em;color:#58724e}}.aviso{{border-left:4px solid #a6741f;background:#fff7df;padding:15px 20px;border-radius:6px}}.boton{{display:inline-block;margin-top:18px;padding:13px 18px;border-radius:12px;background:#204d36;color:white;text-decoration:none}}a:focus-visible,summary:focus-visible{{outline:3px solid #b3750b;outline-offset:4px}}ul{{padding-left:22px}}details{{border-top:1px solid #ddd;padding-top:12px;margin-top:20px}}summary{{cursor:pointer}}@media(max-width:760px){{header,main,footer{{padding:18px}}article{{grid-template-columns:1fr;padding:16px;gap:10px}}figure{{max-width:500px;margin:auto}}}}
</style></head><body><header><p>GRANJA RENTABLE · REVISIÓN 14/11/2026</p><h1>Siete fichas nuevas, preparadas para revisar</h1>
<p class="aviso">Borradores: todavía no forman parte del catálogo de 169 productos. Falta confirmar valoración, variante y disponibilidad actual en Amazon antes de incorporarlos.</p>
<p>Como afiliado de Amazon, Granja Rentable gana comisiones por compras que cumplan los requisitos. La compra se realiza en Amazon.</p>
<nav aria-label="Ir a una ficha">{navegacion}</nav></header><main>{''.join(bloques)}</main><footer><p>Imágenes ilustrativas generadas con IA a partir de referencias comerciales reales. Esta revisión no muestra precios ni valoraciones como datos actuales.</p></footer></body></html>'''
    (DESTINO / 'index.html').write_text(documento, encoding='utf-8')
    print(f'{len(productos)} borradores válidos; enlaces e imágenes presentes; catálogo público intacto.')


if __name__ == '__main__':
    renderizar()
