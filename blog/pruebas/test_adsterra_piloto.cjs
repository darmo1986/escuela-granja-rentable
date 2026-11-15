const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../js/app.js'),'utf8').split('/* ── Progreso,')[0]+'\nwindow.testAds={decidirAnuncios,loadAds,paginaSinAnuncios};})();';
function run({consent,oldConsent,premium=false,active=true,configured=true,lazy=false,board=false,path='/blog/guia.html'}={}){
 const nodes=[],store=new Map(),events={},observers=[];if(consent)store.set('gr_adsterra_consent_v1',consent);if(oldConsent)store.set('gr_consent','si');
 class El{constructor(tag){this.tag=tag;this.dataset={};this.attrs={};this.children=[];this.textContent='';this.style={};this.isConnected=true;}append(...xs){this.children.push(...xs);nodes.push(...xs);}insertAdjacentElement(_,x){this.append(x);}appendChild(x){this.append(x);}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}remove(){this.isConnected=false;const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1);}addEventListener(){}querySelector(){return null;}querySelectorAll(){return [];} }
 let reloadCount=0;const home=new El('main'),homeTools=new El('section'),bulletin=new El('section');home.querySelector=s=>s==='.gr-tools'?homeTools:null;
 const article=new El('article');article.textContent='a'.repeat(2000);
 const doc={body:new El('body'),documentElement:{dataset:{ads:'libre'},classList:{add(){},remove(){}},getAttribute(){return null;}},createElement:t=>new El(t),getElementById:id=>nodes.find(n=>n.id===id),querySelector:s=>s==='[data-tablon-publicidad]'&&board?bulletin:s==='main.home-renovada'&&path==='/'?home:s==='main .post-body'?article:s==='[data-adsterra-pilot]'?nodes.find(n=>n.dataset.adsterraPilot):null,querySelectorAll:s=>s.includes('data-adsterra-pilot')?nodes.filter(n=>n.dataset.adsterraPilot):[]};doc.body.dataset.root='';
 const win={ads:{activo:active,adsterraPilot:configured},GR_esPremium:()=>premium,addEventListener(name,fn){(events[name]??=[]).push(fn);},removeEventListener(){}};
 const ctx={window:win,document:doc,location:{pathname:path,search:'',reload(){reloadCount++;}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},sessionStorage:{getItem(){return null},removeItem(){}},setTimeout(){},Date,URLSearchParams,alert(){}};if(lazy){
  win.IntersectionObserver=function(){};
  ctx.IntersectionObserver=function(callback){this.callback=callback;this.observe=()=>{};this.disconnected=false;this.disconnect=()=>{this.disconnected=true;};observers.push(this);};
 }
 vm.runInNewContext(source,ctx);
 return {home,homeTools,board:bulletin,reloads:()=>reloadCount,nodes,article,win,store,observers,storage(){for(const fn of events.storage||[])fn({key:'gr_adsterra_consent_v1'});}};
}
for(const args of [{},{oldConsent:true},{consent:'no'},{consent:'si',premium:true},{consent:'si',active:false},{consent:'si',path:'/privacidad.html'}]){const s=run(args);assert.equal(s.article.children.length,0,JSON.stringify(args));}
let s=run({consent:'si'}),box=s.article.children[0];
assert.equal(s.article.children.length,1);
assert.equal(box.children[1].tag,'script');
assert.equal(box.children[1].src,'https://bauval.org/22/4c10efc097372233b52ed4f05e0a6ab8');
assert.equal(s.nodes.some(n=>n.tag==='iframe'),false);
assert.deepEqual([s.win.atOptions.width,s.win.atOptions.height,s.win.atOptions.format],[300,250,'iframe']);
s.win.testAds.decidirAnuncios();s.win.testAds.loadAds();
assert.equal(s.article.children.length,1);
s.store.set('gr_adsterra_consent_v1','no');s.storage();
assert.equal(s.nodes.some(n=>n.dataset.adsterraPilot),false);assert.equal(s.reloads(),1);
const home=run({path:'/',consent:'si'});assert.equal(home.homeTools.children.length,1);assert.equal(home.home.children.length,0);
const board=run({path:'/',consent:'si',board:true});assert.equal(board.board.children.length,1);assert.equal(board.homeTools.children.length,0);
for(const opts of [{configured:false},{path:'/cuenta.html'},{active:false},{premium:true}]){const t=run({consent:'si',...opts});assert.equal(t.nodes.some(n=>n.tag==='script'),false);}
const revoked=run({consent:'si'});revoked.win.GR_quitarAnuncios();assert.equal(revoked.reloads(),1);
console.log('Banner directo comprobado: consentimiento, Premium, rutas excluidas, retirada, una inserción y prioridad en portada.');
