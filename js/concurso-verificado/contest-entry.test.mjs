import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {initVerifiedContest} from './contest-entry.mjs';
import {mountVerifiedContest} from './contest-view.mjs';

class Element{
  constructor(ownerDocument){this.ownerDocument=ownerDocument;this._text='';this.children=[];this.handlers=new Map();this.dataset={};this.attrs={};this.style={};}
  replaceChildren(...nodes){this.children=nodes;this._text='';}
  set textContent(v){this._text=v;this.children=[];}
  get textContent(){return this._text+this.children.map(n=>n.textContent).join(' ');}
  append(...nodes){this.children.push(...nodes);}
  appendChild(node){this.append(node);}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){this.handlers.set(k,fn);}
  removeEventListener(k,fn){if(this.handlers.get(k)===fn)this.handlers.delete(k);}
  focus(){}
}
const fake=flag=>{
  const elements=new Map();
  const doc={createElement:()=>new Element(doc),getElementById:id=>{
    if(!elements.has(id))elements.set(id,new Element(doc));
    return elements.get(id);
  }};
  doc.body=new Element(doc);doc.body.dataset.concursoVerificado=flag;
  return doc;
};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const good={status:'open',period:'2026-11-01',rows:[]};
const setup=(flag='on',options={})=>{
  const doc=fake(flag),play=doc.getElementById('concurso-verificado-juego');
  const rank=doc.getElementById('concurso-verificado-ranking'),retry=doc.getElementById('concurso-verificado-recargar');
  let callback,tracked={session:0,rank:0,mount:0,unmount:0,unsub:0};
  const client={auth:{
    getSession:async()=>{tracked.session++;return options.session || {data:{session:null}}},
    onAuthStateChange(fn){callback=fn;return {data:{subscription:{unsubscribe(){tracked.unsub++}}}}}
  },rpc:async(name)=>{
    if(name==='concurso_verificado_ranking'){tracked.rank++;return {data:options.data||good,error:options.error};}
    return {data:{name}};
  }};
  let latestMount;
  const entry=initVerifiedContest({document:doc,client,mountGame:o=>{
    tracked.mount++;latestMount=o;return {unmount(){tracked.unmount++}};
  },defer:setImmediate,cancelDeferred:clearImmediate});
  return {doc,play,rank,retry,entry,tracked,emit:(...args)=>callback(...args),mount:()=>latestMount};
};

test('flag off never reads session, ranking or mounts a verified game',async()=>{
 const v=setup('off');await flush();
 assert.equal(v.entry,null);
 assert.deepEqual(v.tracked,{session:0,rank:0,mount:0,unmount:0,unsub:0});
});
test('open ranking and guest show login; sign-in mounts one game, completion refreshes, sign-out removes it',async()=>{
 const v=setup();await flush();
 assert.match(v.play.textContent,/Inicia sesión/);
 assert.match(v.rank.textContent,/no hay marcas verificadas/);
 assert.equal(v.tracked.mount,0);
 v.emit('SIGNED_IN',{user:{id:'fictitious-q1'}});await flush();
 assert.equal(v.tracked.mount,1);
 v.emit('TOKEN_REFRESHED',{user:{id:'fictitious-q1'}});await flush();
 assert.equal(v.tracked.mount,1);
 const mount=v.mount();
 mount.onFinished();await flush();assert.equal(v.tracked.rank,2);
 v.emit('SIGNED_OUT',null);await flush();
 assert.equal(v.tracked.unmount,1);
 assert.match(v.play.textContent,/Inicia sesión/);
 assert.equal((await mount.rpc('concurso_verificado_empezar')).error.message,'contest_login_required');
 v.entry.destroy();assert.equal(v.tracked.unsub,1);
 assert.equal(v.retry.handlers.has('click'),false);
});
test('closed or initial transport failure never mount the verified game even with a session',async()=>{
 for(const opts of [{data:{status:'closed',rows:[]}}, {error:{code:'timeout'}}]) {
   const v=setup('on',{...opts,session:{data:{session:{user:{id:'fictitious-q2'}}}}});await flush();
   assert.equal(v.tracked.mount,0);
   assert.match(v.play.textContent,/no está abierto|No se pudo comprobar/);
   v.entry.destroy();
 }
});
test('unmount prevents a previously outstanding RPC from restoring a stale game or timer',async()=>{
 const doc=fake('on'),root=doc.getElementById('concurso-verificado-juego');
 let reply, ticks=0;
 const game=mountVerifiedContest({root,rpc:()=>new Promise(ok=>{reply=ok}),setTick:()=>{ticks++}});
 const host=root.children[2],btn=host.children[1];const pending=btn.handlers.get('click')();
 game.unmount();assert.equal(root.children.length,0);
 reply({data:{status:'ready',attempt_id:'fictitious'}});await flush();
 reply({data:{status:'question',total:100,position:1,prompt:'Pregunta ficticia',category:'fixture',choices:['1','2','3','4'],
  deadline:'2026-11-23T00:00:30Z',server_now:'2026-11-23T00:00:00Z'}});
 await pending;assert.equal(root.children.length,0);assert.equal(ticks,0);
});
test('inline activation separates legacy read/write; a failed verified import cannot re-enable legacy writes',async()=>{
 const html=await readFile(new URL('../../concurso.html',import.meta.url),'utf8');
 assert.match(html,/<body data-concurso-verificado="off">/);
 const published=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(t=>t.includes('function guardarResultado'));
 assert.ok(published);
 for(const flag of ['on','off']){
   const doc=fake(flag);let reads=0,creates=0,writes=0,imports=0;
   const client={auth:{getSession:async()=>({data:{session:null}})},from(){return {insert:async()=>{writes++;return {}}}}};
   const ctx={document:doc,window:{supabase:{createClient(){creates++;return client}}},localStorage:{getItem:()=>null,setItem(){}},
     fetch:async()=>{reads++;return {ok:true,json:async()=>[]};},
     loadModule:async()=>{imports++;throw Error('fixture offline');}};
   vm.runInNewContext(published.replace('import("./js/concurso-verificado/contest-entry.mjs")','loadModule()'),ctx);
   await flush();
   ctx.sesion={user:{id:'fixture-dev',email:'fiction@example.test'}};
   ctx.guardarResultado(99,1);await flush();
   if(flag==='on'){
     assert.equal(doc.getElementById('concurso-ranking-legado').hidden,true);
     assert.equal(doc.getElementById('concurso-verificado').hidden,false);
     assert.match(doc.getElementById('final-guardado').textContent,/No cuenta para el premio/);
     assert.match(doc.getElementById('concurso-verificado-juego').textContent,/modo práctica/);
     assert.deepEqual({creates,reads,writes,imports},{creates:1,reads:0,writes:0,imports:1});
   } else {
     assert.deepEqual({creates,reads,writes,imports},{creates:1,reads:2,writes:1,imports:0});
   }
 }
});
