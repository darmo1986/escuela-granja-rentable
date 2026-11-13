/* NODE_PATH=/tmp/asesoria-qa/node_modules node blog/pruebas/test_busqueda_temas.cjs */
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const fixture=[
 {titulo:'Alimentación de gallinas',descripcion:'Leer la etiqueta del pienso.',categoria:'Alimentación',href:'/blog/pienso.html'},
 {titulo:'Coste de criar 10 gallinas',descripcion:'Preparar las cuentas.',categoria:'Negocios',href:'/blog/diez.html'},
 {titulo:'Coste de criar 100 gallinas',descripcion:'Otros supuestos.',categoria:'Negocios',href:'/blog/cien.html'},
 {titulo:'Agua para pollitos',descripcion:'Limpieza de bebederos.',categoria:'Crianza',href:'/blog/agua.html'},
 {titulo:'Gallinas que no ponen',descripcion:'Revisar el manejo.',categoria:'Puesta',href:'/blog/no-ponen.html'},
 {titulo:'Gallinas y huevos económicos',descripcion:'Organizar la venta.',categoria:'Negocios',href:'/blog/huevos.html'}
];
const script=fs.readFileSync('js/blog-buscar.js','utf8');
function setup(url='https://granjarentable.com/blog/?pais=MX#contenido',entries=fixture){
 const dom=new JSDOM('<form data-blog-buscar hidden><input><button type="button" data-blog-limpiar>Volver</button><p data-blog-estado role="status"></p></form><div data-blog-listado>Listado sin JavaScript</div><div data-blog-resultados hidden></div><script data-blog-indice type="application/json"></script>',{url,runScripts:'outside-only'});
 const w=dom.window,d=w.document;d.querySelector('[data-blog-indice]').textContent=JSON.stringify(entries);w.eval(script);
 const input=d.querySelector('input'),filter=d.querySelector('select'),results=d.querySelector('[data-blog-resultados]');
 return {w,d,input,filter,results,dom,search(value){input.value=value;input.dispatchEvent(new w.Event('input'));},titles(){return [...results.querySelectorAll('h2')].map(n=>n.textContent)}};
}
let s=setup();
s.search('¿Cómo alimentar a mis gallinas?');assert.deepEqual(s.titles(),['Alimentación de gallinas']);
s.search('precio 10 gallinas');assert.deepEqual(s.titles(),['Coste de criar 10 gallinas']);
s.search('gallinas no');assert.deepEqual(s.titles(),['Gallinas que no ponen'],'Negations are not discarded or matched inside económicos');
s.search('ÁGUA pollitos');assert.deepEqual(s.titles(),['Agua para pollitos']);
s.filter.value='Negocios';s.filter.dispatchEvent(new s.w.Event('change'));assert.equal(s.titles().length,0);
assert(s.results.textContent.includes('Buscar en todos los temas'));
[...s.results.querySelectorAll('button')].find(b=>b.textContent==='Buscar en todos los temas').click();
assert.deepEqual(s.titles(),['Agua para pollitos']);
s.search('gallinas unicornio');assert.equal(s.titles().length,0);const broader=s.results.querySelector('.blog-buscar-sugerencias button');assert(broader);broader.click();assert(s.titles().length>0);assert.equal(s.input.value,'gallinas');
s.filter.value='Alimentación';s.filter.dispatchEvent(new s.w.Event('change'));
let url=new URL(s.w.location.href);assert.equal(url.searchParams.get('pais'),'MX');assert.equal(url.searchParams.get('tema'),'Alimentación');assert.equal(url.hash,'#contenido');
s.d.querySelector('[data-blog-limpiar]').click();assert(!s.d.querySelector('[data-blog-listado]').hidden);assert.equal(s.filter.value,'');assert.equal(new URL(s.w.location.href).searchParams.has('tema'),false);
s.w.history.replaceState(null,'','?q=precio&tema=Negocios');s.w.dispatchEvent(new s.w.PopStateEvent('popstate'));assert.equal(s.titles().length,2);assert.equal(s.filter.value,'Negocios');
s.w.history.replaceState(null,'','?tema=Inventado');s.w.dispatchEvent(new s.w.PopStateEvent('popstate'));assert.equal(s.filter.value,'');assert(!s.d.querySelector('[data-blog-listado]').hidden);
s.search('como de mis');assert(s.d.querySelector('[data-blog-estado]').textContent.includes('tema concreto'));assert(!s.d.querySelector('[data-blog-listado]').hidden);s.dom.window.close();
s=setup('https://granjarentable.com/blog/?tema=Crianza');assert.deepEqual(s.titles(),['Agua para pollitos']);s.dom.window.close();
s=setup('https://granjarentable.com/blog/?q=agua',[{titulo:'Agua <img src=x onerror=alert(1)>',descripcion:'<script>bad</script>',categoria:'Crianza',href:'/blog/agua.html'}]);assert.equal(s.results.querySelectorAll('img,script').length,0);s.dom.window.close();
s=setup(undefined,[]);assert(s.d.querySelector('[data-blog-buscar]').hidden);assert(!s.d.querySelector('[data-blog-listado]').hidden);s.dom.window.close();
for(const [url,expected] of [
 ['https://granjarentable.com/enlace/roto','https://granjarentable.com/blog/'],
 ['https://darmo1986.github.io/escuela-granja-rentable/enlace/roto','https://darmo1986.github.io/escuela-granja-rentable/blog/']
]){
 const dom=new JSDOM(fs.readFileSync('404.html','utf8'),{url,runScripts:'outside-only'});
 dom.window.eval(dom.window.document.querySelector('script').textContent);
 const form=dom.window.document.querySelector('form[role=search]');
 assert.equal(form.action,expected);assert.equal(form.method,'get');
 assert.equal(form.querySelector('input').name,'q');assert(form.querySelector('input').required);
 dom.window.close();
}
if(fs.existsSync('/tmp/granja-buscador-indice.json')){
 const actual=JSON.parse(fs.readFileSync('/tmp/granja-buscador-indice.json','utf8'));s=setup('https://granjarentable.com/blog/',actual);
 for(const phrase of ['comida gallinas','precio docena','galpón','codornices','gallos']){s.search(phrase);assert(s.titles().length>0,phrase+' finds public articles');}
 assert([...s.d.querySelectorAll('option')].length>1);s.dom.window.close();
 console.log('PASS: real generated index with '+actual.length+' public articles.');
}
console.log('PASS: synonyms, stop words, numbers, negations, categories, query/category restore and reset, URL preservation, useful empty states and literal rendering.');
