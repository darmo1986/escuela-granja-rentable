"""Añade/actualiza este lote sin regenerar ni modificar las fichas anteriores.

Fuente editorial: ampliacion-20261115.json. No descarga fuentes, no contacta
proveedores, no publica y no introduce llamadas de red en el navegador.
"""
import argparse
from collections import defaultdict
from datetime import date
from html import escape
import json
from pathlib import Path
import re
import unicodedata
from urllib.parse import quote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
DATA = Path(__file__).with_name('ampliacion-20261115.json')
PAGE = ROOT / 'criaderos.html'
CENTRAL_AMERICA = {'Belice', 'Guatemala', 'Honduras', 'El Salvador',
                   'Nicaragua', 'Costa Rica', 'Panamá'}
INTRO = '''<p id="verificacion-documental"><strong>Qué comprobamos:</strong> identidad, país y oferta en la web del proveedor, del fabricante o en un registro oficial. Las nuevas fichas indican su fuente y fecha de revisión documental. Esta revisión no certifica la sanidad de las aves, las existencias, la fertilidad ni la entrega. Confirma esos datos y la documentación del lote antes de comprar. Los enlaces de esta ampliación no son de afiliación.</p>
<p id="ayuda-centroamerica">También puedes buscar <strong>Centroamérica</strong> para ver las opciones de Belice, Guatemala, Honduras, El Salvador, Nicaragua, Costa Rica y Panamá. Los proveedores de otros países no implican que puedan exportar aves o huevos a tu país.</p>'''


def key(text):
    ascii_text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', '-', ascii_text).strip('-')


def load_entries():
    entries = json.loads(DATA.read_text())
    if len(entries) != 50:
        raise ValueError('Este lote debe contener exactamente 50 altas')
    for field in ['name']:
        if len({key(e[field]) for e in entries}) != len(entries):
            raise ValueError(f'Duplicados en {field}')
    for e in entries:
        if e['verification'] != 'documental' or e['contacted']:
            raise ValueError('Este lote solo permite verificación documental sin contacto')
        date.fromisoformat(e['reviewed'])
        if not e['evidence'] or not e['location'] or not e['sources']:
            raise ValueError('Falta evidencia, ubicación o fuente')
        if any(urlsplit(u).scheme != 'https' or not urlsplit(u).netloc for u in e['sources']):
            raise ValueError('Se requieren fuentes HTTPS')
    return entries


def render_card(e):
    esc = escape
    tags = ''.join(f'<span>{esc(t)}</span>' for t in e['tags'])
    sources = ' · '.join(f'<a href="{esc(u, quote=True)}" aria-label="'
                         f'{"Fuente documental" if i == 0 else "Fuente complementaria"} de {esc(e["name"], quote=True)}">'
                         f'{"Fuente documental" if i == 0 else "Fuente complementaria"}'
                         f'</a>'
                         for i, u in enumerate(e['sources']))
    correction = 'mailto:ventas@granjarentable.com?subject=' + quote(
        f'Corrección del directorio: {e["name"]} ({e["country"]})')
    formatted = date.fromisoformat(e['reviewed']).strftime('%d/%m/%Y')
    return (f'<article id="proveedor-{key(e["name"])}" data-lote="20261115">'
            f'<h3>{esc(e["name"])}</h3><div class="etiquetas">{tags}</div>'
            f'<p>{esc(e["description"])}</p><dl class="datos">'
            f'<dt>Ubicación</dt><dd>{esc(e["location"])}, {esc(e["country"])}</dd>'
            f'<dt>Tipo de proveedor</dt><dd>{esc(e["kind"])}</dd>'
            f'<dt>Pedido mínimo o formato</dt><dd>Consultar al proveedor</dd>'
            f'<dt>Entrega de aves o huevos</dt><dd>Confirmar con el proveedor; no se presume envío internacional</dd>'
            f'</dl><p class="revision">{sources}</p>'
            f'<p class="revision">Verificación documental: '
            f'<time datetime="{e["reviewed"]}">{formatted}</time> · '
            f'<a href="{esc(correction, quote=True)}">Avisar de un cambio</a></p></article>')


def update(html, entries):
    groups = defaultdict(list)
    for e in entries:
        groups[e['country']].append(e)
    # Only the blocks marked for this batch may be replaced on later runs.
    for country, records in groups.items():
        marker = key(country)
        start = f'<!-- criaderos-20261115:{marker}:inicio -->'
        end = f'<!-- criaderos-20261115:{marker}:fin -->'
        block = start + '\n' + '\n'.join(render_card(e) for e in records) + '\n' + end
        if start in html:
            html = re.sub(re.escape(start) + r'.*?' + re.escape(end), lambda _: block,
                          html, count=1, flags=re.S)
            continue
        sections = list(re.finditer(r'<section\b[^>]*>.*?</section>', html, re.S))
        section = next((m for m in sections if re.search(
            r'<h2[^>]*>\s*' + re.escape(escape(country)) + r'\s*</h2>', m[0])), None)
        if section:
            old = section[0]
            new, n = re.subn(r'</div>\s*</section>$', lambda _: block + '</div></section>', old)
            if n != 1:
                raise ValueError(f'No se reconoce el contenedor de {country}; revisar manualmente')
            html = html[:section.start()] + new + html[section.end():]
        else:
            if country not in {'Belice', 'Nicaragua'}:
                raise ValueError(f'País inesperado: {country}')
            section_html = (f'<section id="{marker}"><h2>{escape(country)}</h2>'
                            f'<div class="fichas">{block}</div></section>\n')
            html = html.replace('<footer>', section_html + '<footer>', 1)
            nav_pattern = r'(<nav aria-label="Países">.*?)(</nav>)'
            html, n = re.subn(nav_pattern, lambda m: m[1] +
                f'<a href="#{marker}">{escape(country)}</a>' + m[2], html, count=1, flags=re.S)
            if n != 1:
                raise ValueError('No se reconoce el selector de países')
    if 'id="verificacion-documental"' not in html:
        anchor = '<label for="buscar">'
        if anchor not in html:
            raise ValueError('No se reconoce la introducción')
        html = html.replace(anchor, INTRO + '\n' + anchor, 1)
    # Same region for existing AND new cards: searching Central America must
    # include old entries, not just those added by this batch.
    for country in CENTRAL_AMERICA:
        pattern = r'(<section\b)([^>]*>\s*<h2[^>]*>' + re.escape(escape(country)) + r'</h2>)'
        html = re.sub(pattern, lambda m: m[0] if 'data-region=' in m[2] else
                      m[1] + ' data-region="Centroamérica America Central"' + m[2], html, count=1)
    old = 'const content = normalize([link.textContent, ...fields.map(field => field.textContent)].join(" "));'
    new = 'const content = normalize([link.textContent, section.dataset.region || "", ...fields.map(field => field.textContent)].join(" "));'
    if old in html:
        html = html.replace(old, new, 1)
    elif new not in html:
        raise ValueError('Ha cambiado el buscador; integrar la región manualmente')
    return html


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true', help='Falla si el HTML no coincide con los datos')
    args = parser.parse_args()
    before = PAGE.read_text()
    after = update(before, load_entries())
    if args.check:
        if before != after:
            raise SystemExit('Directorio desactualizado: ejecutar python _fuentes/criaderos/actualizar.py')
        print('Directorio actualizado; regeneración idempotente')
    else:
        PAGE.write_text(after)
        print('Lote de 50 fichas actualizado en criaderos.html')


if __name__ == '__main__':
    main()
