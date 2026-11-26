// Contract checks for the actual inline script, with a minimal DOM adapter.
// This does not replace visual browser QA and does not make network requests.
const vm = require('node:vm');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fixture = JSON.parse(fs.readFileSync(0, 'utf8'));
const events = () => ({ handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; } });
const sectionMap = new Map();
const links = fixture.sections.map(s => {
  const cards = s.cards.map(c => ({
    name: c.name, hidden: false,
    querySelectorAll() { return c.fields.map(textContent => ({ textContent })); }
  }));
  sectionMap.set(s.id, {
    hidden: false, dataset: { region: s.region || '' }, cards,
    querySelectorAll() { return cards; }
  });
  return { ...events(), hash: '#' + s.id, textContent: s.name,
    setAttribute() {}, removeAttribute() {} };
});
const search = { ...events(), value: '', focus() {} };
const picker = { ...events(), value: '', options: [{ value: '' }], add(option) { this.options.push(option); } };
const status = { textContent: '' };
const window = events();
const location = { hash: '' };
const document = {
  querySelectorAll(selector) { assert.equal(selector, '.tablon nav a'); return links; },
  querySelector(selector) { assert.equal(selector, '.tablon'); return { classList: { add() {} } }; },
  getElementById(id) {
    return ({ buscar: search, 'selector-pais': picker, resultados: status })[id] || sectionMap.get(id);
  }
};
function Option(text, value) { this.text = text; this.value = value; }
const context = vm.createContext({ document, window, location, Option });
vm.runInContext(fixture.script, context);
const visibleSections = () => links.filter(l => !sectionMap.get(l.hash.slice(1)).hidden).map(l => l.textContent);
const visibleCards = () => [...sectionMap.values()].filter(s => !s.hidden).flatMap(s => s.cards.filter(c => !c.hidden).map(c => c.name));
function query(text) { search.value = text; search.handlers.input(); }
function select(id) { picker.value = '#' + id; picker.handlers.change(); window.handlers.hashchange(); }
assert.equal(picker.options.length, 19);
for (const section of fixture.sections) {
  select(section.id);
  assert.deepEqual(visibleSections(), [section.name]);
  assert.equal(visibleCards().length, section.cards.length);
  assert.match(status.textContent, new RegExp(section.cards.length + ' fichas?'));
}
select('belice');
assert.deepEqual(visibleCards(), ['Quality Poultry Hatchery']);
select('nicaragua');
assert.deepEqual(visibleCards(), ['La Granja de Mili']);
const central = ['Belice','Guatemala','Honduras','El Salvador','Nicaragua','Costa Rica','Panamá'].sort();
for (const text of ['Centroamérica', 'centroamerica', 'america central']) {
  query(text);
  assert.deepEqual(visibleSections().sort(), central);
  assert.equal(visibleCards().length, 15);
  assert.equal(picker.value, '');
}
query('Nicaragua ponedoras');
assert.deepEqual(visibleCards(), ['La Granja de Mili']);
query('Friesen');
assert.deepEqual(visibleCards(), ['Quality Poultry Hatchery']);
query('Centroamérica Tatumbla');
assert.deepEqual(visibleCards(), ['Incubadora El Junquillo S. de R.L.']);
query('zzzzzzsinresultado');
assert.deepEqual(visibleCards(), []);
assert.match(status.textContent, /Sin resultados/);
query('');
assert.deepEqual(visibleSections(), ['Nicaragua']);
query('  Nicaragua  ponedoras  ');
assert.deepEqual(visibleCards(), ['La Granja de Mili']);
select('belice');
assert.equal(search.value, '');
assert.deepEqual(visibleCards(), ['Quality Poultry Hatchery']);
console.log('Filtros: 18 países, 3 búsquedas regionales, 15 fichas de Centroamérica, alias, combinación, vacío y cambio de selección correctos.');
