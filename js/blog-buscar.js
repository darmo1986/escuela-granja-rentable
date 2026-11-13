/* Búsqueda local: temas compartibles y vocabulario habitual de la granja. */
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
  var ignored = new Set('a al de del el la las los mi mis tu tus un una unos unas como que para por'.split(' '));
  // Estos grupos amplían vocabulario de búsqueda; no equiparan recomendaciones.
  // Se conservan negaciones y cifras: «no ponen» y «10 gallinas» son consultas distintas.
  var vocabulary = [
    ['comida','comer','alimento','alimentos','alimentar','alimentacion','pienso','balanceado'],
    ['precio','precios','coste','costes','costo','costos','cuesta'],
    ['gallinero','gallineros','galpon','galpones'],
    ['beber','bebida','bebedero','bebederos','agua']
  ];
  function terms(value) {
    var all = normalize(value).split(/\s+/).filter(Boolean);
    return Array.from(new Set(all.filter(function(word){ return !ignored.has(word); })));
  }
  function alternatives(word) {
    return vocabulary.find(function(group){return group.indexOf(word)!==-1;}) || [word];
  }
  function contains(text, word) {
    return alternatives(word).some(function(other){
      if (/^\d+$/.test(other) || other==='no' || other==='sin') return text.split(' ').indexOf(other)!==-1;
      return text.indexOf(other)!==-1;
    });
  }
  function element(tag, text, cls) {
    var node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  entries = entries.map(function (entry, index) {
    return { data: entry, index: index, title: normalize(entry.titulo), category: normalize(entry.categoria), search: normalize(entry.titulo + ' ' + entry.descripcion + ' ' + entry.categoria) };
  });
  var categories = Array.from(new Set(entries.map(function(entry){return entry.data.categoria;}))).sort(function(a,b){return a.localeCompare(b,'es');});
  var filter = element('select');
  filter.id = 'buscar-articulo-tema';
  filter.setAttribute('aria-controls', 'resultados-articulos');
  var option = element('option','Todos los temas'); option.value=''; filter.appendChild(option);
  categories.forEach(function(category){
    var option = element('option',category); option.value=category; filter.appendChild(option);
  });
  filter.value = '';
  var label = element('label', 'Filtrar por tema', 'blog-buscador-tema');
  label.setAttribute('for',filter.id); label.appendChild(filter); form.appendChild(label); form.appendChild(status);
  input.maxLength = 120;
  function saveQuery() {
    try {
      var url = new URL(window.location.href);
      var query = input.value.trim();
      if (query) url.searchParams.set('q', query);
      else url.searchParams.delete('q');
      if (filter.value) url.searchParams.set('tema',filter.value);
      else url.searchParams.delete('tema');
      if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url.href);
    } catch (error) { /* La búsqueda funciona aunque el navegador impida cambiar la URL. */ }
  }
  function restoreQuery() {
    try {
      var url = new URL(window.location.href);
      input.value = (url.searchParams.get('q') || '').slice(0,120);
      var category = url.searchParams.get('tema') || '';
      filter.value = categories.indexOf(category)!==-1 ? category : '';
    } catch (error) { input.value=''; filter.value=''; }
    search();
  }
  function broaden(words, candidates) {
    var choices = [];
    if (words.length > 1) words.forEach(function(word){
      var count = candidates.filter(function(entry){return contains(entry.search,word);}).length;
      if (count) choices.push({word:word,count:count});
    });
    choices.sort(function(a,b){return b.count-a.count;});
    if (choices.length) {
      results.appendChild(element('p','Puedes probar con una búsqueda más amplia:'));
      var suggestions = element('div',undefined,'blog-buscar-sugerencias');
      choices.slice(0,3).forEach(function(choice){
        var button = element('button',choice.word+' ('+choice.count+')','btn sec');
        button.type='button';
        button.addEventListener('click',function(){input.value=choice.word;search();saveQuery();input.focus();});
        suggestions.appendChild(button);
      });
      results.appendChild(suggestions);
    }
    if (filter.value) {
      var all = element('button','Buscar en todos los temas','btn sec');all.type='button';
      all.addEventListener('click',function(){filter.value='';search();saveQuery();input.focus();});
      results.appendChild(all);
    }
    var guides = element('p');var link=element('a','Explorar las guías prácticas');link.href='../guias.html';
    guides.appendChild(link);results.appendChild(guides);
  }
  function search() {
    var term = normalize(input.value), words = terms(input.value);
    results.replaceChildren();
    if (!words.length && !filter.value) {
      listing.hidden=false;results.hidden=true;
      status.textContent=term?'Escribe un tema concreto, por ejemplo: pollitos, puesta o pienso.':'';
      return;
    }
    var candidates = entries.filter(function(entry){return !filter.value || entry.data.categoria===filter.value;});
    var matches = candidates.filter(function(entry){return words.every(function(word){return contains(entry.search,word);});});
    function relevance(entry) {
      var score = entry.title===term?1000:term && entry.title.indexOf(term)!==-1?200:0;
      words.forEach(function(word){
        if(entry.title.split(' ').indexOf(word)!==-1) score+=30;
        else if(entry.title.indexOf(word)!==-1) score+=15;
        else if(contains(entry.title,word)) score+=8;
        if(contains(entry.category,word)) score+=5;
      });
      return score;
    }
    matches.sort(function(a,b){return relevance(b)-relevance(a)||a.index-b.index;});
    listing.hidden=true;results.hidden=false;
    status.textContent=matches.length+(matches.length===1?' artículo encontrado':' artículos encontrados')+(filter.value?' en '+filter.value+'.':' en todo el blog.');
    if (!matches.length) {
      results.appendChild(element('p','No encontramos artículos con esa combinación. Prueba con menos palabras o cambia el tema.'));
      broaden(words,candidates);return;
    }
    matches.forEach(function(entry){
      var article=element('article',undefined,'panel blog-resultado');
      var category=element('p',entry.data.categoria,'kicker');
      var heading=element('h2'),link=element('a',entry.data.titulo);link.href=entry.data.href;heading.appendChild(link);
      article.appendChild(category);article.appendChild(heading);article.appendChild(element('p',entry.data.descripcion));
      results.appendChild(article);
    });
  }
  form.addEventListener('submit',function(event){event.preventDefault();search();saveQuery();});
  input.addEventListener('input',function(){search();saveQuery();});
  filter.addEventListener('change',function(){search();saveQuery();});
  clear.addEventListener('click',function(){input.value='';filter.value='';search();saveQuery();input.focus();});
  window.addEventListener('popstate',restoreQuery);
  restoreQuery();form.hidden=false;
})();
