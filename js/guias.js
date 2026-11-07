/* Búsqueda local: no envía consultas ni datos del visitante. */
(function () {
  var input = document.getElementById('buscar-guia');
  if (!input) return;
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-guide]'));
  function normalizar(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  input.addEventListener('input', function () {
    var words = normalizar(input.value).split(/\s+/).filter(Boolean);
    var count = 0;
    cards.forEach(function (card) {
      var text = normalizar(card.textContent);
      var match = words.every(function (word) { return text.indexOf(word) !== -1; });
      card.hidden = !match;
      if (match) count++;
    });
    document.getElementById('resultado-guias').textContent = count + (count === 1 ? ' guía disponible' : ' guías disponibles');
    document.getElementById('sin-guias').hidden = count !== 0;
  });
})();
