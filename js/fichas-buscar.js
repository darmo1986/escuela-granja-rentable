/* Filtro local de fichas. Sin peticiones ni recogida de búsquedas. */
(function () {
  'use strict';
  var form = document.querySelector('[data-fichas-buscar]');
  var grid = document.querySelector('[data-fichas-lista]');
  if (!form || !grid) return;
  var input = form.querySelector('input');
  var clear = form.querySelector('[data-fichas-limpiar]');
  var status = form.querySelector('[role="status"]');
  var empty = form.querySelector('[data-fichas-vacio]');
  var cards = Array.from(grid.children).filter(function (card) { return card.classList.contains('raza'); });
  function normalize(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  var entries = cards.map(function (card) {
    var heading = card.querySelector('h3');
    var description = card.querySelector('.raza-body > p');
    var name = normalize(heading ? heading.textContent : '');
    return { card: card, name: name.replace(/\s+/g, ''), search: normalize(name + ' ' + (description ? description.textContent : '')) };
  });
  function saveQuery() {
    try {
      var url = new URL(window.location.href);
      var query = input.value.trim();
      if (query) url.searchParams.set('q', query);
      else url.searchParams.delete('q');
      if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url.href);
    } catch (error) { /* El filtro sigue disponible si el navegador impide modificar la URL. */ }
  }
  function restoreQuery() {
    try { input.value = (new URL(window.location.href).searchParams.get('q') || '').slice(0,120); }
    catch (error) { input.value = ''; }
    filter();
  }
  function filter() {
    var term = normalize(input.value);
    var words = term ? term.split(/\s+/) : [];
    var visible = 0;
    entries.forEach(function (entry) {
      var match = !term || words.every(function (word) { return entry.search.indexOf(word) !== -1; }) || entry.name.indexOf(term.replace(/\s+/g, '')) !== -1;
      entry.card.hidden = !match;
      if (match) visible += 1;
    });
    status.textContent = visible + ' de ' + cards.length + ' fichas';
    empty.hidden = visible !== 0;
  }
  input.maxLength = 120;
  form.addEventListener('submit', function (event) { event.preventDefault(); filter(); saveQuery(); });
  input.addEventListener('input', function () { filter(); saveQuery(); });
  clear.addEventListener('click', function () { input.value = ''; filter(); saveQuery(); input.focus(); });
  window.addEventListener('popstate', restoreQuery);
  restoreQuery();
  form.hidden = false;
})();

