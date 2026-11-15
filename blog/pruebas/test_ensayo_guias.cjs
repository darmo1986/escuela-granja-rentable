const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const app = read('js/app.js').split('/* ── Progreso,')[0] + '\n})();';
const registro = read('js/registro-banners.js');
const guias = [
  ['/blog/empezar-con-10-gallinas-ponedoras.html','Alimentación de diez gallinas ponedoras'],
  ['/blog/cuanto-cuesta-producir-docena-huevos.html','Calcula el consumo de agua']
];
const config = {
  desde:'2020-01-01T00:00:00Z', hasta:'2090-01-01T00:00:00Z',
  final:{key:'a'.repeat(32),src:'https://ads.invalid/fin'},
  interior:{key:'b'.repeat(32),src:'https://ads.invalid/medio'}
};
function simular({ruta = guias[0][0], ensayo = config, azar = 0.75, ancho = 340, consentimiento = 'si',
                  premium = false, sinCorte = false, almacen = new Map(), registroPrimero = false} = {}) {
  const posiciones = [], observadores = [], enviados = [], eventos = {}, local = almacen;
  const localStorage = {getItem:k=>local.get(k), setItem:(k,v)=>local.set(k,v), removeItem:k=>local.delete(k)};
  if (consentimiento) local.set('gr_adsterra_consent_v1',consentimiento);
  function nodo(tag) {
    return {tag,dataset:{},style:{},attrs:{},children:[],textContent:'',isConnected:true,
      setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];},
      append(...n){this.children.push(...n);},appendChild(n){this.append(n);},
      insertAdjacentElement(pos,n){posiciones.push({ancla:this,pos,n});},
      addEventListener(){},remove(){this.isConnected=false;},querySelector(){return null;},
      getBoundingClientRect(){return {width:ancho};}};
  }
  const articulo=nodo('article'), cuerpo=nodo('body');
  articulo.textContent='contenido '.repeat(200);
  const html=read(guias.find(g=>g[0]===ruta)?.[0].slice(1) || guias[0][0].slice(1));
  const titulos=Array.from(html.matchAll(/<h2\b[^>]*>([^<]+)<\/h2>/g),m=>Object.assign(nodo('h2'),{textContent:m[1]}));
  articulo.querySelectorAll=()=>sinCorte ? [] : titulos;
  function observar(tipo,fn){(eventos[tipo] ||= []).push(fn);}
  function emitir(evento){for(const fn of eventos[evento.type] || [])fn(evento);}
  const doc={body:cuerpo,documentElement:{dataset:{},getAttribute(){return null;},classList:{add(){},remove(){}}},
    getElementById(){return null;},createElement:nodo,querySelectorAll(){return [];},
    querySelector(s){
      if(s==='main .post-body')return articulo;
      if(s==='[data-lectura-ensayo]')return titulos.find(h=>h.dataset.lecturaEnsayo);
      if(s==='[data-adsterra-pilot]')return posiciones.find(x=>x.n.isConnected)?.n;
      if(s==='[data-ensayo-guias]')return posiciones.find(x=>x.n.isConnected && x.n.dataset.ensayoGuias)?.n;
      return null;
    },addEventListener:observar,dispatchEvent:emitir};
  function IntersectionObserver(cb){
    this.observe=e=>{this.nodo=e;};this.disconnect=()=>{this.cerrado=true;};this.callback=cb;observadores.push(this);
  }
  const location=new URL(ruta,'https://granjarentable.com');
  location.reload=()=>{};
  const win={ads:{activo:true,adsterraPilot:true,ensayoGuias:ensayo},GR_esPremium:()=>premium,
    GR:{formEndpoint:'https://script.google.com/macros/s/test/exec'},IntersectionObserver,addEventListener:observar};
  const azarMock=Object.create(Math);azarMock.random=()=>azar;
  const ctx={window:win,document:doc,localStorage,sessionStorage:{getItem(){},removeItem(){}},location,URL,URLSearchParams,
    Blob,Event,Math:azarMock,Date,IntersectionObserver,setTimeout(){},navigator:{sendBeacon(_url,cuerpo){enviados.push(cuerpo);return true;}}};
  for(const src of (registroPrimero ? [registro,app] : [app,registro]))vm.runInNewContext(src,ctx);
  return {win,posiciones,observadores,enviados,emitir,local,articulo,
    eventos:async()=>Promise.all(enviados.map(async blob=>new URLSearchParams(await blob.text()).get('banner')))};
}
(async()=>{
  for(const [ruta,titulo] of guias) {
    for(const [azar,grupo] of [[0.1,'final'],[0.9,'interior']]){
      for(const registroPrimero of [false,true]){
        const s=simular({ruta,azar,registroPrimero});
        assert.equal(s.posiciones.length,1);
        const {n,ancla,pos}=s.posiciones[0];
        assert.equal(n.dataset.ensayoGuias,grupo);
        assert.equal(n.children[1].src,config[grupo].src);
        if(grupo==='final'){assert.equal(ancla,s.articulo);assert.equal(pos,'beforeend');}
        else {assert(ancla.textContent.endsWith(titulo));assert.equal(pos,'beforebegin');}
        s.emitir({type:'gr-ensayo-guias'});
        const obs=s.observadores[0];assert(obs.nodo.dataset.lecturaEnsayo);
        obs.callback([{isIntersecting:true,intersectionRatio:1}]);assert(obs.cerrado);
        for(const href of ['https://granjarentable.com/ebooks/','https://www.amazon.com/dp/example','https://granjarentable.com/tienda/']){
          const link={href,closest:sel=>sel==='a[href]'||sel==='main'?link:null};
          s.emitir({type:'click',target:link});
        }
        assert.deepEqual(await s.eventos(),['visita','lectura','ebooks','amazon','tienda'].map(e=>'guias-'+grupo+'-'+e));
        const repetida=simular({ruta,almacen:s.local,azar:1-azar});
        assert.equal(repetida.posiciones[0].n.dataset.ensayoGuias,grupo);
      }
    }
  }
  for(const args of [{ensayo:null},{ensayo:{...config,hasta:'2020-02-01T00:00:00Z'}},{sinCorte:true},
    {ensayo:{...config,final:config.interior}},{ruta:'/blog/otra-guia.html'}]){
    const s=simular(args);assert.equal(s.posiciones.length,1);assert.equal(s.posiciones[0].n.dataset.ensayoGuias,undefined);
    assert.deepEqual(await s.eventos(),[]);
  }
  for(const args of [{premium:true},{consentimiento:'no'},{ancho:285},{ruta:'/juegos.html'}]){
    const s=simular(args);assert.equal(s.posiciones.length,0);assert.deepEqual(await s.eventos(),[]);
  }
  const s=simular();s.local.set('gr_adsterra_consent_v1','no');s.emitir({type:'storage',key:'gr_adsterra_consent_v1'});
  assert(!s.local.has('gr_ensayo_guias'));
  s.observadores[0].callback([{isIntersecting:true,intersectionRatio:1}]);
  assert.deepEqual(await s.eventos(),['guias-interior-visita']);
  console.log('OK: dos guías, dos posiciones, una unidad, asignación estable, exclusiones, métricas y retirada.');
})().catch(e=>{console.error(e);process.exitCode=1;});
