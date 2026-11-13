/* Flujos de búsqueda, enlaces y accesibilidad sin servicios externos. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'../..');
const source=file=>fs.readFileSync(path.join(root,'js',file),'utf8');
class E {
 constructor(){this.children=[];this.textContent='';this.hidden=false;this.value='';this.events={};this.attrs={};}
 appendChild(e){this.children.push(e);} replaceChildren(){this.children=[];}
 addEventListener(k,f){this.events[k]=f;} setAttribute(k,v){this.attrs[k]=v;}
 focus(){this.focused=true;} select(){this.selected=true;}
}
function win(url){const w={location:{href:url},events:{},history:{state:{keep:1}},addEventListener(k,f){this.events[k]=f;}};
 w.history.replaceState=function(state,title,value){this.state=state;w.location.href=value;};return w;}

function search(){
 const form=new E(),input=new E(),clear=new E(),status=new E(),index=new E(),listing=new E(),results=new E();
 form.querySelector=s=>s==='input'?input:s==='[data-blog-limpiar]'?clear:status;
 index.textContent=JSON.stringify([
  {titulo:'Organiza tu granja',descripcion:'Revisa agua y pienso',categoria:'Manejo',href:'/blog/granja.html'},
  {titulo:'Agua',descripcion:'Guía de bebida',categoria:'Cuidados',href:'/blog/agua.html'},
  {titulo:'Agua para pollitos',descripcion:'Guía para criar',categoria:'Pollitos',href:'/blog/pollitos.html'}]);
 const nodes={'[data-blog-buscar]':form,'[data-blog-indice]':index,'[data-blog-listado]':listing,'[data-blog-resultados]':results};
 const w=win('https://granjarentable.com/blog/?pais=MX&q=agua#contenido');
 vm.runInNewContext(source('blog-buscar.js'),{window:w,URL,document:{querySelector:s=>nodes[s],createElement:()=>new E()}});
 assert.equal(results.children[0].children[1].children[0].href,'/blog/agua.html');
 assert.equal(results.children[1].children[1].children[0].href,'/blog/pollitos.html');
 input.value='ÁGUA pollitos';input.events.input();assert.equal(results.children.length,1);
 assert.equal(new URL(w.location.href).searchParams.get('pais'),'MX');
 assert.equal(new URL(w.location.href).hash,'#contenido');
 clear.events.click();assert.equal(listing.hidden,false);assert.equal(new URL(w.location.href).searchParams.has('q'),false);
}

function fichas(){
 const input=new E(),clear=new E(),status=new E(),empty=new E(),form=new E();
 const names=['Sedosa (Silkie)','Cobb 500','Andaluza azul'];
 const descriptions=['Gallina ornamental suave','Broiler blanco rápido','Huevo blanco y doble propósito'];
 const cards=names.map((name,i)=>({hidden:false,classList:{contains:k=>k==='raza'},querySelector:s=>({textContent:s==='h3'?name:descriptions[i]})}));
 form.querySelector=s=>s==='input'?input:s==='[data-fichas-limpiar]'?clear:s==='[role="status"]'?status:empty;
 const w=win('https://granjarentable.com/razas.html?pais=CO&q=silkie#razas-gallinas');
 vm.runInNewContext(source('fichas-buscar.js'),{window:w,URL,document:{querySelector:s=>s==='[data-fichas-buscar]'?form:{children:cards}}});
 assert.deepEqual(cards.map(c=>c.hidden),[false,true,true]);
 input.value='blanco';input.events.input();assert.equal(status.textContent,'2 de 3 fichas');
 assert.equal(new URL(w.location.href).searchParams.get('pais'),'CO');assert.equal(new URL(w.location.href).hash,'#razas-gallinas');
 w.location.href='https://granjarentable.com/razas.html?q=cobb500';w.events.popstate();assert.deepEqual(cards.map(c=>c.hidden),[true,false,true]);
 clear.events.click();assert.equal(status.textContent,'3 de 3 fichas');assert(input.focused);
}

function hero(){
 const cls=(active=false)=>{const s=new Set(active?['is-active']:[]);return{contains:k=>s.has(k),add:k=>s.add(k),toggle(k,b){b?s.add(k):s.delete(k);}};};
 const el=(active=false)=>Object.assign(new E(),{classList:cls(active)});
 const slides=[el(true),el(),el(),el()],dots=slides.map(()=>el()),pause=el(),prev=el(),next=el(),events={};
 const motion={matches:true,addEventListener(k,f){events.motion=f;}};
 let timers=0;
 const container={classList:cls(),matches:()=>false,addEventListener(){},querySelectorAll:s=>s==='[data-slide]'?slides:dots,querySelector:s=>s==='[data-hero-prev]'?prev:s==='[data-hero-next]'?next:pause};
 vm.runInNewContext(source('hero.js'),{document:{hidden:false,querySelector:()=>container,addEventListener(){}},window:{matchMedia:()=>motion,addEventListener(k,f){events[k]=f;}},setTimeout:()=>++timers,clearTimeout(){}});
 assert.equal(pause.textContent,'Reanudar');assert.equal(timers,0);
 pause.onclick();assert.equal(pause.textContent,'Pausar');assert(timers>0);
 next.onclick();assert(slides[1].classList.contains('is-active'));
 events['gr-pais']();assert(slides[0].classList.contains('is-active'));
 pause.onclick();motion.matches=false;events.motion();assert.equal(pause.textContent,'Reanudar');
}

async function actions(){
 const container=new E(),copy=new E(),print=new E(),status=new E();
 container.querySelector=s=>s==='[data-post-imprimir]'?print:s==='[data-post-copiar]'?copy:status;
 let printed=0,copied='';
 const nav={clipboard:{writeText:async value=>{copied=value;}}};
 const doc={documentElement:{classList:{add(){},remove(){}}},querySelectorAll:()=>[],createElement:()=>new E(),querySelector:s=>s==='[data-post-acciones]'?container:{href:'https://granjarentable.com/blog/agua.html'}};
 vm.runInNewContext(source('blog.js'),{document:doc,navigator:nav,window:{print(){printed++;}},location:{hash:'#apartado-agua'}});
 await copy.events.click();assert.equal(copied,'https://granjarentable.com/blog/agua.html#apartado-agua');assert(status.textContent.includes('copiado'));
 print.events.click();assert.equal(printed,1);
 nav.clipboard.writeText=async()=>{throw Error('denied');};await copy.events.click();
 assert.equal(container.children.length,1);assert(container.children[0].selected);assert(container.children[0].readOnly);
 assert.equal(container.children[0].value,copied);assert(status.textContent.includes('seleccionado'));
}
(async()=>{search();fichas();hero();await actions();console.log('OK: relevancia, tildes, URL compartida, atrás, limpiar, movimiento reducido, Razas inicial, copiar y alternativa sin permiso, imprimir.');})().catch(e=>{console.error(e);process.exitCode=1;});
