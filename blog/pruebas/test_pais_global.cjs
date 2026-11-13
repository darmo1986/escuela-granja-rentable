const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'../..');
const countries=['MX','US','CO','PE','ES','AR','VE','EC','DO','CL','PY','UY','BO','GT','HN','SV','NI','CR','PA'];
function cls(active=false){const set=new Set(active?['is-active']:[]);return {contains:k=>set.has(k),add:k=>set.add(k),toggle(k,b){b?set.add(k):set.delete(k);}};}
function el(active=false){return {classList:cls(active),attrs:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(){},matches(){return false}};}
for(const country of countries){
 const events={},slides=[el(true),el(),el(),el()],dots=slides.map(()=>el()),pause=el(),prev=el(),next=el();
 const hero={classList:cls(),matches:()=>false,addEventListener(){},querySelectorAll:s=>s==='[data-slide]'?slides:dots,querySelector:s=>s==='[data-hero-prev]'?prev:s==='[data-hero-next]'?next:pause};
 const context={document:{hidden:false,documentElement:{dataset:{pais:country}},querySelector:()=>hero,addEventListener(){}},window:{matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener:(name,f)=>events[name]=f},setTimeout:()=>1,clearTimeout(){}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'js/hero.js'),'utf8'),context);
 assert(slides[0].classList.contains('is-active'));next.onclick();assert(slides[1].classList.contains('is-active'));events['gr-pais']({detail:country});assert(slides[0].classList.contains('is-active'));assert.equal(dots[0].attrs['aria-current'],'true');
}
const source=fs.readFileSync(path.join(root,'js/site.js'),'utf8');const body=source.slice(source.indexOf('  function applyPais('),source.indexOf('  document.querySelectorAll(".js-pais").forEach(function (sel) {\n    sel.addEventListener'));
const names=Object.fromEntries(countries.map(c=>[c,{nombre:c}]));const ctx={pais:'ES',PAISES:names,valid:c=>names[c]?c:'MX',document:{documentElement:{dataset:{}},querySelectorAll:()=>[],getElementById:()=>null},localStorage:{setItem(){}},window:{dispatchEvent(){}},CustomEvent:function(n,o){this.type=n;this.detail=o.detail},readRef:()=>'',applySkus(){throw Error('No debe filtrar contenido por país')},applyFeatured(){throw Error('No debe cambiar destacados por país')},writeProductJsonLd(){throw Error('No debe cambiar datos de recursos por país')}};
vm.runInNewContext(body,ctx);countries.forEach(c=>{ctx.applyPais(c,true);assert.equal(ctx.document.documentElement.dataset.pais,c)});
console.log('19 países: Razas inicial y al cambiar país; el selector no ejecuta filtros regionales de contenido.');
