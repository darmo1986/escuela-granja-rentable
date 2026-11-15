(function () {
  'use strict';
  const input = document.getElementById('faq-query');
  const items = Array.from(document.querySelectorAll('details.faq-item'));
  const normalize = text => text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const entries = items.map(item => ({item, text: normalize(item.textContent)}));
  function filter() {
    const terms = normalize(input.value).trim().split(/\s+/).filter(Boolean);
    let count = 0;
    for (const {item, text} of entries) {
      item.hidden = !terms.every(term => text.includes(term));
      if (!item.hidden) count++;
    }
    document.getElementById('faq-status').textContent = !terms.length ? '' : count ? count + ' de ' + items.length + ' preguntas' : 'Sin coincidencias. Prueba con menos palabras.';
  }
  function openTarget() {
    const item = document.getElementById(location.hash.slice(1));
    if (!items.includes(item)) return;
    input.value = ''; filter(); item.open = true;
    item.scrollIntoView({block:'start'});
  }
  document.getElementById('faq-filtro').hidden = false;
  document.getElementById('faq-reset').onclick = () => {input.value = ''; filter(); input.focus();};
  input.addEventListener('input', filter);
  window.addEventListener('hashchange', openTarget);
  document.querySelector('.faq-temas').addEventListener('click', event => {
    if (event.target.hash === location.hash) openTarget();
  });
  openTarget();
})();
