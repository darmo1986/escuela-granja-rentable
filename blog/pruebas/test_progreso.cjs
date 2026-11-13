const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const s=fs.readFileSync(path.join(__dirname,'../../js/app.js'),'utf8');
function cls(){const set=new Set();return{add(...ks){ks.forEach(k=>set.add(k));},remove(...ks){ks.forEach(k=>set.delete(k));},contains:k=>set.has(k),toggle(k,on){on?set.add(k):set.delete(k);}};}
function element(text='',href){return{textContent:text,attrs:href?{href}:{},dataset:{},classList:cls(),style:{},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k]||null;},removeAttribute(k){delete this.attrs[k];},get href(){return this.attrs.href;},set href(v){this.attrs.href=v;}};}
const lessons=['l01','l02','l03'].map(id=>{const a=element('',id+'.html'),st=element(),code=element(id.toUpperCase());return{dataset:{id},classList:cls(),a,st,querySelector:sel=>sel==='a'?a:sel==='.st'?st:code};});
const final=element('Examen final','examen-final.html'),next=element('Empezar el curso gratis','lecciones/l01.html'),bar=element(),text=element(),message=element(),parts=[element(),element()];
let raw='{}',blocked=false,paused=0,quizBinds=0;
const video={pause(){paused++;}},frame=element('', '');frame.attrs.src='https://www.youtube-nocookie.com/embed/abcdefg';
const req={dataset:{requires:'l01'},querySelector:()=>message,querySelectorAll:sel=>sel==='.lockable'?parts:sel.includes('video')?[video]:[frame]};
const events={};const context={window:{GRAuth:{guardarCurso(){throw Error('offline');}},addEventListener(k,f){events[k]=f;}},document:{body:{dataset:{}},querySelectorAll:()=>lessons,querySelector:()=>req,getElementById:id=>({finalbtn:final,continuar:next,pbar:bar,ptxt:text})[id]},localStorage:{getItem(){return raw;},setItem(k,value){if(blocked)throw Error('denied');raw=value;}},bindQuizzes(){quizBinds++;}};
const prefix=s.slice(0,s.indexOf('/* ── Consentimiento')).replace('(function(){','');
const passed=s.slice(s.indexOf('const passed='),s.indexOf('const shuf='));
const funcs=s.slice(s.indexOf('function paintProgress()'),s.indexOf('function bindQuizzes('));
const listeners=s.slice(s.indexOf('function refrescarProgreso()'),s.indexOf('(async function(){',s.indexOf('function refrescarProgreso()')));
vm.runInNewContext(prefix+passed+funcs+listeners+'\nwindow.check={prog,save,paintProgress,paintLocks};',context);
const api=context.window.check;
api.paintProgress();assert.equal(lessons[0].a.href,'l01.html');assert.equal(lessons[1].a.href,undefined);assert(final.classList.contains('dis'));
raw=JSON.stringify({l01:{aprobado:true,mejor:10}});events['gr-progreso']();assert.equal(lessons[1].a.href,'l02.html');assert(!lessons[1].classList.contains('locked'));assert.equal(next.href,'l02.html');
raw=JSON.stringify(Object.fromEntries(lessons.map(l=>[l.dataset.id,{aprobado:true,mejor:10}])));events.storage({key:'gr_progreso'});assert.equal(final.href,'examen-final.html');assert(!final.classList.contains('dis'));assert.equal(final.getAttribute('aria-disabled'),null);assert.equal(bar.style.width,'100%');
raw='{}';events.storage({key:'gr_progreso'});assert.equal(final.href,undefined);assert.equal(next.href,'lecciones/l01.html');assert.equal(next.textContent,'Empezar el curso gratis');assert.equal(bar.style.width,'0%');assert(!lessons[0].classList.contains('done'));
raw=JSON.stringify({l02:{aprobado:true}});api.paintProgress();assert(lessons[2].classList.contains('locked'));
raw='{}';api.paintLocks();assert(parts.every(p=>p.hidden));assert.equal(message.hidden,false);assert.equal(frame.attrs.src,undefined);assert(paused>0);
raw=JSON.stringify({l01:{aprobado:true}});api.paintLocks();assert(parts.every(p=>!p.hidden));assert.equal(message.hidden,true);assert(frame.attrs.src.includes('youtube-nocookie'));
for(const invalid of ['null','42','[]','"texto"','roto']){raw=invalid;assert.equal(Object.keys(api.prog()).length,0);}
blocked=true;assert.equal(api.save({l01:{aprobado:true}}),false);assert(quizBinds>0);
console.log('OK: bloqueo y desbloqueo reversibles, sincronización de cuenta y otras pestañas, examen final, continuar, vídeo detenido, almacenamiento inválido o bloqueado.');
const site=fs.readFileSync(path.join(__dirname,'../../js/site.js'),'utf8');
const loader=site.slice(site.indexOf('(function cargarCuenta()'),site.indexOf('function writeProductJsonLd()'));
let loaded;
vm.runInNewContext(loader,{root:'../',URL,encodeURIComponent,window:{},document:{currentScript:{src:'https://granjarentable.com/js/site.js?v=version-compartida'},baseURI:'https://granjarentable.com/lecciones/l01.html',createElement:()=>({}),body:{appendChild(s){loaded=s.src;}}}});
assert.equal(loaded,'../js/auth.js?v=version-compartida');
console.log('OK: la cuenta recibe la misma versión que los recursos compartidos de la página.');
