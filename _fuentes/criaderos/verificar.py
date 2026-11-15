"""Comprueba los datos, las 81 fichas previas y los filtros reales del navegador.

python _fuentes/criaderos/verificar.py [--browser]
El modo navegador solo sirve archivos locales. No compra ni contacta proveedores.
"""
import argparse
from collections import Counter
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
import json
from pathlib import Path
import re
import shutil
import subprocess
from threading import Thread
from urllib.parse import urlsplit

from lxml import html as dom
from actualizar import CENTRAL_AMERICA, PAGE, ROOT, key, load_entries, update

BASE = '8c2a54548b695a7e94518d9d3a4417e58b105c4f'


def check_static():
    source = PAGE.read_text()
    entries = load_entries()
    tree = dom.fromstring(source)
    old = subprocess.check_output(['git', 'show', BASE + ':criaderos.html'], cwd=ROOT, text=True)
    old_cards = re.findall(r'<article\b.*?</article>', old, re.S)
    assert len(old_cards) == 81
    assert all(source.count(card) == 1 for card in old_cards), 'Ficha previa alterada o duplicada'
    cards = tree.xpath('//main//article')
    assert len(cards) == 131
    new = tree.xpath('//article[@data-lote="20261115"]')
    assert len(new) == 50
    identities = [(key(c.getparent().getparent().findtext('h2')), key(c.findtext('h3'))) for c in cards]
    assert len(set(identities)) == 131, 'Nombre y país duplicados'
    old_names = {key(dom.fromstring(c).findtext('h3')) for c in old_cards}
    assert not old_names.intersection(key(e['name']) for e in entries), 'Alta con nombre ya existente'
    ids = tree.xpath('//@id')
    assert len(ids) == len(set(ids)), 'IDs duplicados'
    assert update(source, entries) == source, 'La generación no es idempotente'
    assert len({e['country'] for e in entries}) == 16
    assert Counter(e['country'] for e in entries).keys() >= CENTRAL_AMERICA
    # Each country has exactly one link, one section and all its cards in it.
    country_links = tree.xpath('//nav[@aria-label="Países"]/a')
    assert len(country_links) == 18
    assert len({a.get('href') for a in country_links}) == 18
    for link in country_links:
        section = tree.get_element_by_id(link.get('href')[1:])
        assert section.findtext('h2') == link.text
        assert section.xpath('.//article')
        if link.text in CENTRAL_AMERICA:
            assert section.get('data-region') == 'Centroamérica America Central'
    for e in entries:
        card = tree.get_element_by_id('proveedor-' + key(e['name']))
        assert card.findtext('h3') == e['name']
        assert card.getparent().getparent().findtext('h2') == e['country']
        links = card.xpath('.//p[@class="revision"]/a[starts-with(@href,"https://")]')
        assert [link.get('href') for link in links] == e['sources']
        assert card.xpath('.//time/@datetime') == [e['reviewed']]
        assert all(link.get('aria-label') for link in links)
    domains = [urlsplit(e['sources'][0]).netloc.removeprefix('www.') for e in entries]
    assert len(domains) == len(set(domains)), 'Revisar identidad del proveedor en dominio repetido'
    print('Datos: 50 altas, 131 fichas, 81 anteriores intactas, 18 países, 7 países centroamericanos.')
    print('Fuentes, fechas, IDs, ubicación por país y regeneración: correctos.')


def check_browser():
    from playwright.sync_api import sync_playwright

    class QuietHandler(SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}'
    shots = Path('/tmp/criaderos-50-qa')
    shots.mkdir(exist_ok=True)
    try:
        with sync_playwright() as p:
            chromium = shutil.which('chromium')
            browser = p.chromium.launch(headless=True, executable_path=chromium, args=['--no-sandbox'])
            for width in [1280, 390, 320]:
                page = browser.new_page(viewport={'width': width, 'height': 900})
                errors = []
                page.on('pageerror', lambda error: errors.append(str(error)))
                # No external requests: this is a local UI check, not a live traffic test.
                page.route('**/*', lambda route: route.continue_() if route.request.url.startswith(base)
                           else route.abort())
                page.goto(base + '/criaderos.html', wait_until='networkidle')
                assert page.locator('#selector-pais option').count() == 19
                assert page.locator('article[data-lote="20261115"]').count() == 50
                for country_id, name in [('belice', 'Quality Poultry Hatchery'),
                                         ('nicaragua', 'La Granja de Mili')]:
                    if width < 700:
                        page.locator('#selector-pais').select_option('#' + country_id)
                    else:
                        page.locator('nav[aria-label="Países"] a[href="#' + country_id + '"]').click()
                    page.wait_for_function('(id) => !document.getElementById(id).hidden', arg=country_id)
                    assert page.locator('section:visible article:visible h3').all_text_contents() == [name]
                for query in ['Centroamérica', 'centroamerica', 'america central']:
                    page.locator('#buscar').fill(query)
                    visible = page.locator('section:visible h2').all_text_contents()
                    assert set(visible) == CENTRAL_AMERICA, (query, visible)
                    assert page.locator('section:visible article:visible').count() == 15
                page.locator('#buscar').fill('Nicaragua ponedoras')
                assert page.locator('section:visible article:visible h3').all_text_contents() == ['La Granja de Mili']
                page.locator('#buscar').fill('Friesen')
                assert page.locator('section:visible article:visible h3').all_text_contents() == ['Quality Poultry Hatchery']
                page.locator('#buscar').fill('zzzzzzsinresultado')
                assert page.locator('section:visible').count() == 0
                assert 'Sin resultados' in page.locator('#resultados').inner_text()
                page.locator('#buscar').fill('')
                assert page.locator('#nicaragua').is_visible()
                page.locator('#buscar').fill('Centroamérica')
                page.screenshot(path=str(shots / f'centroamerica-{width}.png'), full_page=True)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Desborde a {width}px'
                assert not errors, errors
                page.close()
                print(f'Navegador {width}px: selección, búsqueda regional/sin tildes, combinación, alias y vacío correctos.')
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


def check_filters():
    tree = dom.fromstring(PAGE.read_text())
    fixture = {'sections': [], 'script': next(s.text for s in tree.xpath('//script[not(@src)]')
                                               if s.text and 'function renderDirectory' in s.text)}
    for section in tree.xpath('//main/section'):
        data = dict(id=section.get('id'), name=section.findtext('h2'),
                    region=section.get('data-region', ''), cards=[])
        for card in section.xpath('.//article'):
            fields = card.xpath('.//h3 | .//div[@class="etiquetas"]/span | .//p[not(@class="revision")] | .//dd')
            data['cards'].append(dict(name=card.findtext('h3'), fields=[f.text_content() for f in fields]))
        fixture['sections'].append(data)
    subprocess.run(['node', str(Path(__file__).with_name('filtros.cjs'))],
                   input=json.dumps(fixture), text=True, check=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--browser', action='store_true')
    args = parser.parse_args()
    check_static()
    check_filters()
    if args.browser:
        check_browser()
