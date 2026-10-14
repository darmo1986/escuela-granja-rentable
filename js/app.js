(function(){
const root=document.body.dataset.root||'';
const PK='gr_progreso',CK='gr_consent';
const prog=()=>{try{return JSON.parse(localStorage.getItem(PK))||{}}catch(e){return{}}};
const save=p=>localStorage.setItem(PK,JSON.stringify(p));
/* ── Consentimiento + publicidad (Adsterra o AdSense; nada sin key y sin «Aceptar») ── */
const SLOT_MAP={SLOT_INICIO:'inicio',SLOT_LECCION_TEST:'lecciones',SLOT_FINAL:'final'};
function adsterraHasKey(){
  const A=window.ADSTERRA||{};
  return ['inicio','lecciones','final'].some(k=>{
    const o=A[k]; return !!(o&&((o.key&&String(o.key).trim())||(o.movil&&o.movil.key&&String(o.movil.key).trim())));
  });
}
function adsConfigured(){return !!(window.ADSENSE_CLIENT||adsterraHasKey());}
function pickAdsterra(cfg){
  if(!cfg)return null;
  const narrow=window.matchMedia('(max-width:640px)').matches;
  const desk=cfg.key&&String(cfg.key).trim()?{key:String(cfg.key).trim(),w:+cfg.w||728,h:+cfg.h||90}:null;
  const mov=cfg.movil&&cfg.movil.key&&String(cfg.movil.key).trim()?{key:String(cfg.movil.key).trim(),w:+cfg.movil.w||320,h:+cfg.movil.h||50}:null;
  if(narrow)return mov||desk;
  return desk||mov;
}
/* Banner oficial Adsterra (atOptions + invoke.js). Un hueco = un banner aislado. Solo format iframe. */
function injectAdsterra(el,cfg){
  const key=cfg.key,w=cfg.w,h=cfg.h;
  el.style.minHeight=h+'px';
  const conf=document.createElement('script');
  conf.type='text/javascript';
  conf.textContent='atOptions = {\'key\':'+JSON.stringify(key)+',\'format\':\'iframe\',\'height\':'+h+',\'width\':'+w+',\'params\':{}};';
  const inv=document.createElement('script');
  inv.type='text/javascript';
  inv.src='//www.highperformanceformat.com/'+encodeURIComponent(key)+'/invoke.js';
  el.appendChild(conf);
  el.appendChild(inv);
}
function revealAd(d){
  d.hidden=false;
  d.removeAttribute('aria-hidden');
  const prev=d.previousElementSibling;
  if(prev&&prev.classList.contains('ad-label')) prev.hidden=false;
}
function loadAdsterra(){
  const A=window.ADSTERRA||{};
  let any=false;
  document.querySelectorAll('.ad-slot').forEach(d=>{
    if(d.dataset.adFilled)return;
    const name=SLOT_MAP[d.dataset.adSlot];
    const cfg=pickAdsterra(A[name]);
    if(!cfg)return;
    d.dataset.adFilled='adsterra';
    injectAdsterra(d,cfg);
    revealAd(d);
    any=true;
  });
  if(any)document.documentElement.classList.add('ad-on');
  return any;
}
function loadAdsense(){
  if(!window.ADSENSE_CLIENT)return false;
  const slots=[...document.querySelectorAll('.ad-slot')].filter(d=>d.dataset.adSlot&&d.dataset.adSlot.indexOf('SLOT_')!==0);
  if(!slots.length)return false;
  const s=document.createElement('script');s.async=true;s.crossOrigin='anonymous';
  s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(window.ADSENSE_CLIENT);
  document.head.appendChild(s); document.documentElement.classList.add('ad-on');
  slots.forEach(d=>{
    if(d.dataset.adFilled)return;
    d.dataset.adFilled='adsense';
    const i=document.createElement('ins');i.className='adsbygoogle';i.style.display='block';
    i.dataset.adClient=window.ADSENSE_CLIENT;i.dataset.adSlot=d.dataset.adSlot;i.dataset.adFormat='auto';i.dataset.fullWidthResponsive='true';d.appendChild(i);
    (window.adsbygoogle=window.adsbygoogle||[]).push({});
    revealAd(d);
  });
  return true;
}
function loadAds(){
  if(window.__adsLoaded)return; window.__adsLoaded=1;
  /* Si hay Adsterra con key, gana frente a AdSense. */
  if(adsterraHasKey()){loadAdsterra();return;}
  loadAdsense();
}
function banner(){
  if(!adsConfigured())return;
  if(document.getElementById('cookie-banner'))return;
  const b=document.createElement('div');b.id='cookie-banner';b.setAttribute('role','dialog');
  b.innerHTML='<strong>🍪 Cookies</strong><p style="margin:.3em 0">Usamos cookies de publicidad (Adsterra y/o Google AdSense) para mostrar anuncios (que pueden ser personalizados) y así mantener el curso gratis. Solo se activan si aceptas. <a href="'+root+'cookies.html">Más información</a></p><div class="row"><button class="btn" data-c="si">Aceptar</button><button class="btn sec" data-c="no">Rechazar</button></div>';
  b.addEventListener('click',e=>{const c=e.target.dataset.c;if(!c)return;localStorage.setItem(CK,c);b.remove();if(c==='si')loadAds();else if(window.__adsLoaded)location.reload();});
  document.body.appendChild(b);
}
const c=localStorage.getItem(CK); if(c==='si')loadAds(); else if(!c)banner();
document.querySelectorAll('[data-cookie-config]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();localStorage.removeItem(CK);if(!adsConfigured())alert('Ahora mismo este sitio no usa cookies publicitarias.');banner();}));
/* ── Progreso, lecciones nuevas (L05A–L06C) y tests ── */
const passed=id=>!!(prog()[id]&&prog()[id].aprobado);
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const VIDEO_RE=/^[a-z0-9_-]+\.mp4$/i;
const EXAM_RE=/^[a-z0-9_-]+\.json$/i;
const ID_RE=/^[a-z0-9]+$/;

function paintProgress(){
  const lis=[...document.querySelectorAll('.lesson.ok')];
  if(!lis.length)return;
  let n=0,next=null;
  lis.forEach((li,i)=>{const id=li.dataset.id,st=li.querySelector('.st');
    if(passed(id)){n++;li.classList.add('done');st.textContent='✔ '+prog()[id].mejor+' pts';}
    else if(i>0&&!passed(lis[i-1].dataset.id)){li.classList.add('locked');st.textContent='🔒';const a=li.querySelector('a');if(a){a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.title='Aprueba antes la lección anterior';}}
    else if(!next)next=li;
  });
  const tot=lis.length;
  const bar=document.getElementById('pbar'),txt=document.getElementById('ptxt');
  if(bar)bar.style.width=(100*n/tot)+'%';
  if(txt)txt.textContent='Progreso: '+n+' de '+tot+' lecciones aprobadas'+(passed('final')?' · Examen final aprobado 🎓':'');
  const fb=document.getElementById('finalbtn');
  if(fb&&n<tot){fb.textContent='🔒 Examen final (aprueba todas las lecciones)';fb.removeAttribute('href');fb.classList.add('dis');}
  const b=document.getElementById('continuar');
  if(!b)return;
  if(n&&next){const a=next.querySelector('a');b.textContent='Continuar: '+next.querySelector('.code').textContent;if(a)b.href=a.getAttribute('href');}
  else if(n===tot){b.textContent=passed('final')?'¡Curso completado! 🎓':'Ir al examen final';b.href='examen-final.html';}
}
function paintLocks(){
  const req=document.querySelector('[data-requires]');
  if(!req||!req.dataset.requires)return;
  const need=req.dataset.requires.split(' ').filter(Boolean);
  if(need.some(id=>!passed(id))){
    const msg=req.querySelector('.lock-msg'); if(msg) msg.hidden=false;
    req.querySelectorAll('.lockable').forEach(e=>{e.remove();});
  }
}
function bindQuizzes(scope){
  (scope||document).querySelectorAll('.quiz').forEach(q=>{
    if(q.dataset.bound)return;
    q.dataset.bound='1';
    const w=q.querySelector('.qwrap'),pass=+q.dataset.pass,key=q.dataset.key;
    if(!w||!q.dataset.exam)return;
    fetch(q.dataset.exam).then(r=>{if(!r.ok)throw new Error('exam');return r.json();}).then(ex=>{
      function render(){
        const qs=shuf(ex.preguntas.map(x=>({...x,ops:shuf(x.opciones.map((t,i)=>({t,ok:i===x.correcta})))})));
        const prev=prog()[key];
        w.innerHTML=(prev?'<p>Tu mejor nota: <strong>'+prev.mejor+'/'+qs.length+'</strong>'+(prev.aprobado?' ✔ aprobado':'')+'</p>':'')+
          qs.map((x,n)=>'<div class="q"><p>'+(n+1)+'. '+esc(x.pregunta)+'</p>'+x.ops.map((o,k)=>'<label><input type="radio" name="'+key+n+'" value="'+k+'">'+esc(o.t)+'</label>').join('')+'<div class="exp" hidden>'+esc(x.explicacion||'')+'</div></div>').join('')+
          '<div class="res"></div><button class="btn corr">Corregir</button>';
        w.querySelector('.corr').onclick=()=>{
          const blocks=[...w.querySelectorAll('.q')];const sin=blocks.filter(b=>!b.querySelector('input:checked')).length;
          if(sin&&!confirm('Te faltan '+sin+' preguntas por responder. ¿Corregir igualmente?'))return;
          let ok=0;blocks.forEach((b,n)=>{const ops=qs[n].ops,ch=b.querySelector('input:checked');b.querySelectorAll('input').forEach(i=>{i.disabled=true;if(ops[+i.value].ok)i.parentNode.classList.add('right');});
            if(ch&&ops[+ch.value].ok)ok++;else{if(ch)ch.parentNode.classList.add('wrong');b.querySelector('.exp').hidden=false;}});
          const ap=ok>=pass,pr=prog(),o=pr[key]||{mejor:0,aprobado:false};o.mejor=Math.max(o.mejor,ok);o.aprobado=o.aprobado||ap;o.fecha=new Date().toISOString();pr[key]=o;save(pr);
          const r=w.querySelector('.res');r.className='res result '+(ap?'pass':'fail');
          r.innerHTML=(ap?'🎉 ¡Aprobado! ':'Casi… ')+ok+' de '+blocks.length+' aciertos (necesitas '+pass+'). '+(ap?'':'Repasa las explicaciones de las falladas y vuelve a intentarlo.')+'<br><button class="btn retry" style="margin-top:8px">Repetir test</button>';
          r.querySelector('.retry').onclick=()=>{render();q.scrollIntoView();};
          w.querySelector('.corr').remove();r.scrollIntoView({behavior:'smooth',block:'center'});
        };
      }
      render();
    }).catch(()=>{w.textContent='No se pudo cargar el test. Revisa tu conexión.';});
  });
}
async function cursoWeb(){
  if(window.__cursoWeb)return window.__cursoWeb;
  try{
    const r=await fetch(root+'data/curso-web.json');
    if(!r.ok)throw new Error('curso');
    window.__cursoWeb=await r.json();
  }catch(e){window.__cursoWeb=null;}
  return window.__cursoWeb;
}
function promoteLesson(li,L){
  const withExam=!!(L.examen&&EXAM_RE.test(L.examen));
  li.classList.remove('soon');
  li.classList.add(withExam?'ok':'play');
  const row=li.querySelector('.lrow');
  if(row&&row.tagName!=='A'){
    const a=document.createElement('a');
    a.className='lrow';
    a.href=root+'leccion.html?id='+encodeURIComponent(L.id);
    while(row.firstChild)a.appendChild(row.firstChild);
    row.replaceWith(a);
  }
  const st=li.querySelector('.st');
  if(st&&!withExam)st.textContent='Video';
  const dur=li.querySelector('.dur');
  if(dur)dur.textContent=L.minutos?(L.minutos+' min'):'Video';
  const more=li.querySelector('.card-more p');
  if(more&&L.descripcion)more.textContent=L.descripcion;
}
async function promoteFromJson(){
  const list=document.querySelector('ul.lessons');
  if(!list)return;
  const data=await cursoWeb();
  if(!data||!Array.isArray(data.lecciones))return;
  data.lecciones.forEach(L=>{
    if(L.estado!=='disponible'||!VIDEO_RE.test(L.video||'')||!ID_RE.test(L.id||''))return;
    const li=list.querySelector('.lesson.soon[data-id="'+L.id+'"]');
    if(li)promoteLesson(li,L);
  });
}
async function renderDynamicLesson(){
  const host=document.getElementById('leccion-dyn');
  if(!host)return;
  const id=new URLSearchParams(location.search).get('id')||'';
  const data=await cursoWeb();
  if(!data||!ID_RE.test(id)){host.innerHTML='<p>No encontramos esa lección. <a href="'+root+'curso.html">Volver al curso</a>.</p>';return;}
  const lessons=data.lecciones||[];
  const idx=lessons.findIndex(x=>x.id===id);
  const L=idx>=0?lessons[idx]:null;
  if(!L){host.innerHTML='<p>No encontramos esa lección. <a href="'+root+'curso.html">Volver al curso</a>.</p>';return;}
  const ready=L.estado==='disponible'&&VIDEO_RE.test(L.video||'');
  const withExam=!!(L.examen&&EXAM_RE.test(L.examen));
  const prev=withExam?lessons.slice(0,idx).filter(x=>x.estado==='disponible'&&x.examen&&EXAM_RE.test(x.examen)).map(x=>x.id):[];
  if(prev.length)host.dataset.requires=prev.join(' ');
  const base=String(data.videoBaseUrl||'videos/').replace(/^\/+/,'');
  let html='<p class="crumb"><a href="'+root+'curso.html">Curso</a> › '+esc(L.codigo||'')+'</p>';
  html+='<h1><span class="code">'+esc(L.codigo||'')+'</span> '+esc(L.titulo||'')+'</h1>';
  html+='<div class="lock-msg" hidden>Esta lección se abre cuando apruebes las anteriores. <a href="'+root+'curso.html">Ver tu progreso</a>.</div>';
  if(!ready){
    html+='<p>Próximamente. El video todavía no está publicado.</p>';
    host.innerHTML=html;
    return;
  }
  html+='<div class="video lockable"><video controls preload="metadata" playsinline poster="'+root+'img/logo.jpg" src="'+esc(root+base+L.video)+'"></video></div>';
  if(L.descripcion)html+='<section class="texto lockable"><h2>De qué trata</h2><p>'+esc(L.descripcion)+'</p></section>';
  if(withExam){
    html+='<section class="quiz lockable" data-exam="'+esc(root+'data/examenes/'+L.examen)+'" data-pass="10" data-key="'+esc(L.id)+'"><h2>Test de la lección</h2><p>Apruebas con 10 aciertos.</p><div class="qwrap">Cargando test…</div></section>';
  }
  host.innerHTML=html;
  const t=document.querySelector('title');
  if(t)t.textContent=(L.codigo?L.codigo+': ':'')+(L.titulo||'Lección')+' | Curso Granja Rentable';
}
paintProgress();
paintLocks();
bindQuizzes();
(async function(){
  await promoteFromJson();
  paintProgress();
  await renderDynamicLesson();
  paintLocks();
  bindQuizzes();
})();
})();
