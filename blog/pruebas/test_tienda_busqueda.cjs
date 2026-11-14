const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'tienda/index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'tienda/tienda.js'), 'utf8');
const decode = s => s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const datos = Array.from(html.matchAll(/data-t-card data-cat="([^"]+)" data-sec="[^"]+" data-q="([^"]+)"/g), m => ({cat:m[1], q:decode(m[2])}));
assert.equal(datos.length, 169);
function entorno(url = 'https://granjarentable.com/tienda/', conCategoria = true, sinHistorial = false) {
  function el() { return {value:'',hidden:false,listeners:{},addEventListener(n, fn){this.listeners[n]=fn;},focus(){this.focused=true;}}; }
  const cards = datos.map(d => ({hidden:false,getAttribute(n){return n === 'data-q' ? d.q : d.cat;}}));
  const caja = el(), categoria = el(), limpiar = el(), ampliar = el(), form = el(), vacio = el(), cuenta = el();
  categoria.options = [...new Set(['todas', ...datos.map(d=>d.cat)])].map(value=>({value}));
  const bloques = categoria.options.slice(1).map(o=>({hidden:false,querySelector(){return cards.find((c,i)=>!c.hidden && datos[i].cat===o.value);}}));
  const elements = {'[data-t-buscar]':caja,'[data-t-categoria]':conCategoria?categoria:null,'[data-t-limpiar]':limpiar,'[data-t-ampliar]':ampliar,'[data-t-form]':form,'[data-t-vacio]':vacio,'[data-t-cuenta]':cuenta};
  const win = {location:{href:url},history:{replaceState(a,b,next){if(sinHistorial)throw Error('bloqueado');win.location.href=new URL(next,win.location.href).href;}}};
  const doc = {querySelector:s=>elements[s]||null,querySelectorAll:s=>s==='[data-t-card]'?cards:s==='[data-t-bloque]'?bloques:[]};
  vm.runInNewContext(source, {document:doc,window:win,URL});
  return {caja,categoria,limpiar,ampliar,form,vacio,cuenta,win,bloques,
    buscar(q){caja.value=q;caja.listeners.input();},
    visibles(){return datos.filter((d,i)=>!cards[i].hidden);},
    filtrar(cat){categoria.value=cat;categoria.listeners.change();}};
}
let e=entorno();
assert.equal(e.visibles().length,169);
e.buscar('nidales'); const nidales=e.visibles().map(d=>d.q);
assert.ok(nidales.length>0);
for(const q of ['PONEDEROS','nidos','nidal']) {e.buscar(q);assert.deepEqual(e.visibles().map(d=>d.q),nidales);}
e.buscar('comedero para pollitos');
assert.ok(e.visibles().length>0);
assert.ok(e.visibles().length<169);
assert.ok(e.bloques.some(b=>b.hidden));
e.filtrar('malla-y-vallas');
assert.equal(e.visibles().length,0); assert.equal(e.vacio.hidden,false); assert.equal(e.ampliar.hidden,false);
e.ampliar.listeners.click(); assert.ok(e.visibles().length>0); assert.equal(e.caja.value,'comedero para pollitos');
e.limpiar.listeners.click(); assert.equal(e.visibles().length,169);assert.equal(e.categoria.value,'todas');assert.equal(e.caja.focused,true);
e.buscar('b00txw0uqk');assert.equal(e.visibles().length,1);
assert.match(e.cuenta.textContent,/1 de 169 productos/);
let prevenido=false;e.form.listeners.submit({preventDefault(){prevenido=true;}});assert.equal(prevenido,true);
e=entorno('https://granjarentable.com/tienda/?q=ponederos&cat=nidales-y-cama&utm_source=youtube#amazon');
assert.ok(e.visibles().length>0);assert.ok(e.visibles().every(d=>d.cat==='nidales-y-cama'));
e.buscar('NIDOS');assert.equal(new URL(e.win.location.href).searchParams.get('utm_source'),'youtube');
assert.equal(new URL(e.win.location.href).hash,'#amazon');
const compartida=entorno(e.win.location.href);assert.deepEqual(compartida.visibles(),e.visibles());
e=entorno('https://granjarentable.com/tienda/?cat=desconocida&q=b00txw0uqk');assert.equal(e.visibles().length,1);
e=entorno('https://granjarentable.com/tienda/c/comederos/?cat=desconocida&q=b00txw0uqk',false);assert.equal(e.visibles().length,1);
e=entorno(undefined,true,true);e.buscar('ponedero');assert.ok(e.visibles().length>0);
e.buscar('<script>alert(1)</script>');assert.equal(e.visibles().length,0);
console.log('Búsqueda tienda: sinónimos, plurales, filtros, vacío, recuperación, ASIN, formulario y enlaces compartibles correctos.');
