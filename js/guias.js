/* Biblioteca local con búsquedas que se pueden guardar y compartir. */
(function () {
  'use strict';
  var input = document.getElementById('buscar-guia');
  if (!input) return;
  var cards = Array.from(document.querySelectorAll('[data-guide]'));
  var clear = document.querySelector('[data-guias-limpiar]');
  function normalizar(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
  var entries = cards.map(function(card){return{card:card,text:normalizar(card.textContent)};});
  function filtrar() {
    var words = normalizar(input.value).split(/\s+/).filter(Boolean), count = 0;
    entries.forEach(function(entry){var match=words.every(function(word){return entry.text.indexOf(word)!==-1;});entry.card.hidden=!match;if(match)count++;});
    document.getElementById('resultado-guias').textContent=count+(count===1?' guía disponible':' guías disponibles');
    document.getElementById('sin-guias').hidden=count!==0;
  }
  function guardar() {
    try{var url=new URL(location.href),q=input.value.trim();if(q)url.searchParams.set('q',q);else url.searchParams.delete('q');history.replaceState(history.state,'',url.href);}catch(error){}
  }
  function restaurar() {try{input.value=(new URL(location.href).searchParams.get('q')||'').slice(0,120);}catch(error){input.value='';}filtrar();}
  input.addEventListener('input',function(){filtrar();guardar();});
  if(clear){clear.hidden=false;clear.addEventListener('click',function(){input.value='';filtrar();guardar();input.focus();});}
  window.addEventListener('popstate',restaurar);
  restaurar();
})();
