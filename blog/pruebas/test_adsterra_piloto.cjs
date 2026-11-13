const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../js/app.js'),'utf8').split('/* ── Progreso,')[0]+'\nwindow.testAds={decidirAnuncios,loadAds,paginaSinAnuncios};})();';
function run({consent,oldConsent,premium=false,active=true,configured=true,lazy=false,path='/blog/guia.html'}={}){
 const nodes=[],store=new Map(),events={},observers=[];if(consent)store.set('gr_adsterra_consent_v1',consent);if(oldConsent)store.set('gr_consent','si');
 class El{constructor(tag){this.tag=tag;this.dataset={};this.attrs={};this.children=[];this.textContent='';this.style={};this.isConnected=true;}append(...xs){this.children.push(...xs);nodes.push(...xs);}appendChild(x){this.append(x);}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}remove(){this.isConnected=false;const i=nodes.indexOf(this);if(i>=0)nodes.splice(i,1);}addEventListener(){}querySelector(){return null;}querySelectorAll(){return [];} }
 const article=new El('article');article.textContent='a'.repeat(2000);
 const doc={body:new El('body'),documentElement:{dataset:{ads:'libre'},classList:{add(){},remove(){}},getAttribute(){return null;}},createElement:t=>new El(t),getElementById:id=>nodes.find(n=>n.id===id),querySelector:s=>s==='main .post-body'?article:s==='[data-adsterra-pilot]'?nodes.find(n=>n.dataset.adsterraPilot):null,querySelectorAll:s=>s.includes('data-adsterra-pilot')?nodes.filter(n=>n.dataset.adsterraPilot):[]};doc.body.dataset.root='';
 const win={ads:{activo:active,adsterraPilot:configured},GR_esPremium:()=>premium,addEventListener(name,fn){(events[name]??=[]).push(fn);},removeEventListener(){}};
 const ctx={window:win,document:doc,location:{pathname:path,search:'',reload(){}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},sessionStorage:{getItem(){return null},removeItem(){}},setTimeout(){},Date,URLSearchParams,alert(){}};if(lazy){
  win.IntersectionObserver=function(){};
  ctx.IntersectionObserver=function(callback){this.callback=callback;this.observe=()=>{};this.disconnected=false;this.disconnect=()=>{this.disconnected=true;};observers.push(this);};
 }
 vm.runInNewContext(source,ctx);
 return {nodes,article,win,store,observers,storage(){for(const fn of events.storage||[])fn({key:'gr_adsterra_consent_v1'});}};
}
for(const args of [{},{oldConsent:true},{consent:'no'},{consent:'si',premium:true},{consent:'si',active:false},{consent:'si',path:'/privacidad.html'}]){const s=run(args);assert.equal(s.article.children.length,0,JSON.stringify(args));}
let s=run({consent:'si'});assert.equal(s.article.children.length,1);let box=s.article.children[0],frame=box.children[1];assert.equal(frame.attrs.sandbox,'allow-scripts');assert.equal(frame.attrs.referrerpolicy,'no-referrer');assert.match(frame.srcdoc,/bauval.org\/22\/4c10efc097372233b52ed4f05e0a6ab8/);assert.equal(frame.width,'300');assert.equal(frame.height,'250');s.win.testAds.loadAds();assert.equal(s.article.children.length,1);s.win.GR_quitarAnuncios();assert.equal(s.nodes.filter(n=>n.dataset.adsterraPilot).length,0);
for(const args of [{consent:'si',lazy:true},{consent:'si',lazy:true,configured:false}]){
 const state=run(args);
 if(args.configured===false){assert.equal(state.article.children.length,0);continue;}
 const frame=state.article.children[0].children[1];
 state.win.GR_quitarAnuncios();
 assert.equal(state.observers[0].disconnected,true);
 // A queued observer callback must remain harmless even after disconnect().
 state.observers[0].callback([{isIntersecting:true}]);
 assert.equal(frame.srcdoc,undefined);
}
for(const lazy of [true,false])for(const consent of ['no',null]){
 const state=run({consent:'si',lazy});
 const frame=state.article.children[0].children[1];
 if(consent)state.store.set('gr_adsterra_consent_v1',consent);else state.store.delete('gr_adsterra_consent_v1');
 state.storage();
 assert.equal(state.nodes.filter(n=>n.dataset.adsterraPilot).length,0);
 if(lazy){
  assert.equal(state.observers[0].disconnected,true);
  state.observers[0].callback([{isIntersecting:true}]);
  assert.equal(frame.srcdoc,undefined);
 }
}
{
 const state=run({consent:'si',lazy:true});
 const frame=state.article.children[0].children[1];
 state.win.ads.adsterraPilot=false;
 state.observers[0].callback([{isIntersecting:true}]);
 assert.equal(frame.srcdoc,undefined);
}
console.log('PASS: queued callbacks after removal, cross-tab withdrawal, lazy disabled configuration; fresh consent required even outside EU; old consent ignored; reject/off/premium/legal excluded; one 300x250; scripts-only sandbox; withdrawal removes iframe. Browser rendering remains unverified.');
