/* Búsqueda local sobre el índice público generado con el blog. */
(function () {
  'use strict';
  var form = document.querySelector('[data-blog-buscar]');
  var source = document.querySelector('[data-blog-indice]');
  var listing = document.querySelector('[data-blog-listado]');
  var results = document.querySelector('[data-blog-resultados]');
  if (!form || !source || !listing || !results) return;
  var entries;
  try { entries = JSON.parse(source.textContent); } catch (error) { return; }
  if (!Array.isArray(entries) || !entries.length) return;
  var input = form.querySelector('input');
  var clear = form.querySelector('[data-blog-limpiar]');
  var status = form.querySelector('[data-blog-estado]');
  function normalize(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  entries = entries.map(function (entry) {
    return { data: entry, search: normalize(entry.titulo + ' ' + entry.descripcion + ' ' + entry.categoria) };
  });
  function saveQuery() {
    try {
      var url = new URL(window.location.href);
      var query = input.value.trim();
      if (query) url.searchParams.set('q', query);
      else url.searchParams.delete('q');
      if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url.href);
    } catch (error) { /* La búsqueda sigue funcionando si el navegador impide actualizar la URL. */ }
  }
  function restoreQuery() {
    try { input.value = new URL(window.location.href).searchParams.get('q') || ''; }
    catch (error) { input.value = ''; }
    search();
  }
  function search() {
    var term = normalize(input.value);
    results.replaceChildren();
    if (!term) {
      listing.hidden = false;
      results.hidden = true;
      status.textContent = '';
      return;
    }
    var words = term.split(/\s+/);
    var matches = entries.filter(function (entry) {
      return words.every(function (word) { return entry.search.indexOf(word) !== -1; });
    });
    listing.hidden = true;
    results.hidden = false;
    status.textContent = matches.length + (matches.length === 1 ? ' artículo encontrado' : ' artículos encontrados') + ' en todo el blog.';
    if (!matches.length) {
      var empty = document.createElement('p');
      empty.textContent = 'No hay coincidencias. Prueba con menos palabras o vuelve al listado.';
      results.appendChild(empty);
      return;
    }
    matches.forEach(function (entry) {
      var article = document.createElement('article');
      article.className = 'panel blog-resultado';
      var category = document.createElement('p');
      category.className = 'kicker';
      category.textContent = entry.data.categoria;
      var heading = document.createElement('h2');
      var link = document.createElement('a');
      link.href = entry.data.href;
      link.textContent = entry.data.titulo;
      heading.appendChild(link);
      var description = document.createElement('p');
      description.textContent = entry.data.descripcion;
      article.appendChild(category);
      article.appendChild(heading);
      article.appendChild(description);
      results.appendChild(article);
    });
  }
  form.addEventListener('submit', function (event) { event.preventDefault(); search(); saveQuery(); });
  input.addEventListener('input', function () { search(); saveQuery(); });
  clear.addEventListener('click', function () { input.value = ''; search(); saveQuery(); input.focus(); });
  window.addEventListener('popstate', restoreQuery);
  restoreQuery();
  form.hidden = false;
})();
