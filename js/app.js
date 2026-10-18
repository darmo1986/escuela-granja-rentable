(function(){
const root=document.body.dataset.root||'';
const PK='gr_progreso',CK='gr_consent';
const prog=()=>{try{return JSON.parse(localStorage.getItem(PK))||{}}catch(e){return{}}};
const save=p=>{
  try{localStorage.setItem(PK,JSON.stringify(p));}catch(e){}
  const dentro=window.GRAuth&&GRAuth.usuario&&GRAuth.usuario();
  if(dentro&&GRAuth.guardarCurso)GRAuth.guardarCurso(p);
};
/* ── Consentimiento + publicidad (Adsterra o AdSense; nada sin key y sin «Aceptar») ── */
function smallBannerCfg(){
  const g=(window.GR&&window.GR.redes&&window.GR.redes.adsterra)||{};
  const key=String(g.bannerKey||'').trim();
  if(key)return {key:key,w:+g.w||320,h:+g.h||50};
  const mov=window.ADSTERRA&&window.ADSTERRA.banner&&window.ADSTERRA.banner.movil;
  const fallback=mov&&String(mov.key||'').trim();
  if(fallback)return {key:fallback,w:+mov.w||320,h:+mov.h||50};
  return null;
}
function adsterraHasKey(){
  if(smallBannerCfg())return true;
  const A=window.ADSTERRA||{};
  return ['banner','rect'].some(k=>{
    const o=A[k]; return !!(o&&((o.key&&String(o.key).trim())||(o.movil&&o.movil.key&&String(o.movil.key).trim())));
  });
}
function adsOn(){return !!(window.ads&&window.ads.activo===true);}
function adsRegionOk(){
  const list=window.ads&&window.ads.paises;
  if(!list||!list.length)return true;
  const pais=(document.documentElement.dataset.pais||'MX').toUpperCase();
  return list.indexOf(pais)!==-1;
}
function ocultarHuecos(){
  document.documentElement.classList.remove('ad-ok');
  document.querySelectorAll('.ad-inline').forEach(el=>el.remove());
}
if(!adsOn())ocultarHuecos();
function adsConfigured(){return adsOn()&&adsRegionOk()&&!!(window.ADSENSE_CLIENT||adsterraHasKey());}
function pickAdsterra(cfg,size){
  if(size==='banner')return smallBannerCfg();
  if(!cfg)return null;
  const desk=cfg.key&&String(cfg.key).trim()?{key:String(cfg.key).trim(),w:+cfg.w||300,h:+cfg.h||250}:null;
  return desk;
}
function markBannerGap(el){
  if(el.dataset.adFilled)return;
  el.dataset.adFilled='gap';
  const p=document.createElement('p');
  p.className='ad-gap';
  p.textContent='Publicidad no disponible.';
  el.appendChild(p);
}
/* Cada pieza va en su propio iframe para que atOptions no se pise.
   format iframe, params vacío: sin tema ni palabras clave.
   El dominio sale de ADSTERRA.host (config.js). */
function adsterraScriptHost(){
  const fallback='https://www.highrevenueformat.com';
  const raw=String((window.ADSTERRA&&window.ADSTERRA.host)||'').trim().replace(/\/+$/,'');
  return /^https:\/\/[a-z0-9.-]+$/i.test(raw)?raw:fallback;
}
function mountAdsterra(el,cfg){
  if(!adsOn())return;
  if(el.dataset.adFilled)return;
  el.dataset.adFilled='adsterra';
  const frame=document.createElement('iframe');
  frame.title='Publicidad';
  frame.setAttribute('scrolling','no');
  frame.setAttribute('loading','lazy');
  /* Origen opaco: sin allow-same-origin y sin allow-top-navigation*.
     El anuncio no puede tocar esta página ni cambiar su dirección. */
  frame.setAttribute('sandbox','allow-scripts allow-popups allow-popups-to-escape-sandbox');
  frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
  frame.style.cssText='width:'+cfg.w+'px;height:'+cfg.h+'px;max-width:100%;border:0;display:block;overflow:hidden';
  const key=cfg.key;
  frame.srcdoc='<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;overflow:hidden">'+
    '<script>atOptions={key:'+JSON.stringify(key)+',format:"iframe",height:'+cfg.h+',width:'+cfg.w+',params:{}};<\/script>'+
    '<script src="'+adsterraScriptHost()+'/'+encodeURIComponent(key)+'/invoke.js"><\/script>'+
    '</body></html>';
  el.appendChild(frame);
}
function loadAdsterra(){
  const narrow=window.matchMedia('(max-width:1099px)').matches;
  const seen={};
  document.querySelectorAll('.ad-slot[data-ad-size]').forEach(el=>{
    const size=el.dataset.adSize;
    if(narrow && size==='rect'){
      const box=el.closest('.ad-inline');
      if(box)box.remove();
      return;
    }
    if(seen[size]){
      const box=el.closest('.ad-inline');
      if(box)box.remove();
      return;
    }
    seen[size]=el;
  });
  const arm=el=>{
    const size=el.dataset.adSize;
    const cfg=pickAdsterra((window.ADSTERRA||{})[size],size);
    if(cfg)mountAdsterra(el,cfg);
    else if(size==='banner')markBannerGap(el);
  };
  /* El 300×250 es un lateral fijo. En una página corta el pie lo tapa
     (ad-rail-off) y no debe contarse una impresión. */
  if(!narrow && seen.rect){
    const rail=seen.rect.closest('.ad-inline');
    const foot=document.querySelector('.foot');
    if(rail){
      rail.classList.add('ad-rail');
      const showRect=hidden=>{
        rail.classList.toggle('ad-rail-off', !!hidden);
        if(hidden||seen.rect.dataset.adFilled)return;
        const cs=getComputedStyle(rail);
        if(cs.display==='none'||cs.visibility==='hidden')return;
        const r=rail.getBoundingClientRect();
        const vh=window.innerHeight||document.documentElement.clientHeight;
        const vw=window.innerWidth||document.documentElement.clientWidth;
        if(r.width<2||r.height<2||r.bottom<=0||r.right<=0||r.top>=vh||r.left>=vw)return;
        arm(seen.rect);
      };
      if(foot && 'IntersectionObserver' in window){
        new IntersectionObserver(entries=>{
          showRect(entries.some(e=>e.isIntersecting));
        }).observe(foot);
      }else{
        const covered=()=>{
          if(!foot)return false;
          const fr=foot.getBoundingClientRect();
          const vh=window.innerHeight||document.documentElement.clientHeight;
          return fr.top<vh && fr.bottom>0;
        };
        const sync=()=>showRect(covered());
        sync();
        if(foot){
          window.addEventListener('scroll', sync, {passive:true});
          window.addEventListener('resize', sync);
        }
      }
    }
  }
  const slots=seen.banner?[seen.banner]:[];
  if(!slots.length)return !!seen.rect;
  if(!('IntersectionObserver' in window)){slots.forEach(arm);return true;}
  const io=new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      if(!en.isIntersecting)return;
      io.unobserve(en.target);
      arm(en.target);
    });
  },{rootMargin:'200px 0px'});
  slots.forEach(el=>io.observe(el));
  return true;
}
function loadAdsense(){
  if(!adsOn())return false;
  if(!window.ADSENSE_CLIENT)return false;
  const slots=[...document.querySelectorAll('.ad-slot')].filter(d=>d.dataset.adSlot&&d.dataset.adSlot.indexOf('SLOT_')!==0);
  if(!slots.length)return false;
  const s=document.createElement('script');s.async=true;s.crossOrigin='anonymous';
  s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(window.ADSENSE_CLIENT);
  document.head.appendChild(s); document.documentElement.classList.add('ad-on');
  slots.forEach(d=>{
    if(d.dataset.adFilled)return;
    d.hidden=false;
    d.dataset.adFilled='adsense';
    const i=document.createElement('ins');i.className='adsbygoogle';i.style.display='block';
    i.dataset.adClient=window.ADSENSE_CLIENT;i.dataset.adSlot=d.dataset.adSlot;i.dataset.adFormat='auto';i.dataset.fullWidthResponsive='true';d.appendChild(i);
    (window.adsbygoogle=window.adsbygoogle||[]).push({});
  });
  return true;
}
/* Premium (PR #17) y consentimiento por zona (PR #16) se comprueban antes de cargar nada.
   gr_premium solo vale con gr_premium_hasta en el futuro. El hueco del anuncio no se borra:
   html.ad-off lo oculta y, si se muestra, el alto ya está reservado. */
function esPremiumLocal(){
  if (typeof window.GR_esPremium === 'function' && window.GR_esPremium()) return true;
  var u = window.GRAuth && window.GRAuth.usuarioActual;
  if (u && u.premium) {
    var fh = u.premiumHasta || u.premium_hasta;
    if (fh && Date.parse(fh) > Date.now()) return true;
  }
  return false;
}
window.esPremiumLocal = esPremiumLocal;
function quitarAnuncios(){
  document.documentElement.classList.add('ad-off');
  document.documentElement.classList.remove('ad-ok');
  var b = document.getElementById('cookie-banner');
  if (b) b.remove();
  var nota = document.getElementById('cookie-note');
  if (nota) nota.remove();
  window.__adsLoaded = 1;
}
window.GR_quitarAnuncios = quitarAnuncios;
function pedirDeNuevo(){
  try { return sessionStorage.getItem('gr_pedir_cookies')==='1'; } catch(e){ return false; }
}
function cerrarPregunta(){
  try { sessionStorage.removeItem('gr_pedir_cookies'); } catch(e){}
}
function loadAds(){
  if(!adsOn()||!adsRegionOk()){ocultarHuecos();return;}
  if(esPremiumLocal()){ quitarAnuncios(); return; }
  if(window.__adsLoaded)return; window.__adsLoaded=1;
  /* Si hay Adsterra con key, gana frente a AdSense. */
  if(adsterraHasKey()){loadAdsterra();return;}
  loadAdsense();
}
function consentimientoEstricto(){return document.documentElement.dataset.ads!=='libre';}
function banner(){
  if(!adsOn() || esPremiumLocal())return;
  if(!adsConfigured())return;
  if(document.getElementById('cookie-banner'))return;
  const b=document.createElement('div');b.id='cookie-banner';b.setAttribute('role','dialog');b.setAttribute('aria-labelledby','cookie-title');
  b.innerHTML='<strong id="cookie-title">Aviso de cookies</strong><p style="margin:.3em 0">Usamos cookies de publicidad (Adsterra y/o Google AdSense) para mostrar anuncios (que pueden ser personalizados) y así mantener el curso gratis. Solo se activan si aceptas y tu país es uno donde hay anuncios. La cuenta, si entras, se guarda aparte en este navegador y no depende de este aviso. <a href="'+root+'cookies.html">Política de cookies</a></p><div class="row"><button class="btn" data-c="si">Aceptar</button><button class="btn sec" data-c="no">Rechazar</button></div>';
  b.addEventListener('click',e=>{const c=e.target.dataset.c;if(!c)return;localStorage.setItem(CK,c);cerrarPregunta();b.remove();if(!adsOn()){ocultarHuecos();return;}if(c==='si'){document.documentElement.classList.add('ad-ok');loadAds();}else{document.documentElement.classList.remove('ad-ok');if(window.__adsLoaded)location.reload();}});
  document.body.appendChild(b);
}
/* Fuera de la UE el aviso va en el flujo de la página: no tapa el contenido. */
function notaLibre(){
  if(!adsOn() || esPremiumLocal() || !adsConfigured() || document.getElementById('cookie-note'))return;
  const n=document.createElement('aside');
  n.id='cookie-note';
  n.setAttribute('role','note');
  n.innerHTML='<span>Mostramos anuncios de Adsterra para mantener el curso gratis.</span> <a href="'+root+'cookies.html">Política de cookies</a> <button type="button" class="btn sec" data-c="no">Rechazar</button>';
  n.addEventListener('click',e=>{
    if(e.target.dataset.c!=='no')return;
    localStorage.setItem(CK,'no');
    cerrarPregunta();
    n.remove();
    document.documentElement.classList.remove('ad-ok');
    if(window.__adsLoaded)location.reload();
  });
  const main=document.querySelector('main');
  if(main)main.prepend(n); else document.body.prepend(n);
}
function abrirAviso(){
  if(!adsOn() || esPremiumLocal()){ quitarAnuncios(); return; }
  if(consentimientoEstricto())banner();
  else {document.documentElement.classList.add('ad-ok');loadAds();notaLibre();}
}
function decidirAnuncios(){
  if(!adsOn() || esPremiumLocal()){ quitarAnuncios(); return; }
  window.__adsLoaded = 0;
  document.documentElement.classList.remove('ad-off');
  var c = null;
  try { c = localStorage.getItem(CK); } catch (e) {}
  if(pedirDeNuevo()){ banner(); }
  else if(consentimientoEstricto()){
    if(c==='si'){ document.documentElement.classList.add('ad-ok'); loadAds(); }
    else if(!c) banner();
  } else if(c==='si'){
    document.documentElement.classList.add('ad-ok');
    loadAds();
  } else if(c!=='no') abrirAviso();
}
function sesionAbierta(){
  try { return !!localStorage.getItem('gr-auth'); } catch (e) { return false; }
}
function premiumConocido(){
  try { return localStorage.getItem('gr_premium_listo') === '1'; } catch (e) { return false; }
}
function esperaPago(){
  try {
    if (/[?&]premium=ok(?:&|$)/.test(location.search)) sessionStorage.setItem('gr_premium_espera', String(Date.now()));
    var t = Number(sessionStorage.getItem('gr_premium_espera') || 0);
    return t > 0 && Date.now() - t < 120000;
  } catch (e) { return false; }
}
function arrancarAnuncios(){
  if(!adsOn() || esPremiumLocal() || esperaPago()){ quitarAnuncios(); return; }
  var sesion = sesionAbierta();
  if (sesion && !premiumConocido()) quitarAnuncios();
  if (!sesion) { decidirAnuncios(); return; }
  if (premiumConocido()) { decidirAnuncios(); return; }
  var listo = false;
  function seguir(){
    if (!adsOn() || esPremiumLocal() || esperaPago()) { quitarAnuncios(); listo = true; return; }
    if (!premiumConocido() || listo) return;
    listo = true;
    decidirAnuncios();
  }
  window.addEventListener('gr-premium', seguir);
  setTimeout(function () {
    if (listo || esPremiumLocal() || esperaPago() || !adsOn()) return;
    listo = true;
    decidirAnuncios();
  }, 1500);
  setTimeout(function () {
    if (listo) return;
    listo = true;
    window.removeEventListener('gr-premium', seguir);
    if (!adsOn() || esPremiumLocal()) quitarAnuncios();
    else decidirAnuncios();
  }, 12000);
}
arrancarAnuncios();
document.querySelectorAll('[data-cookie-config]').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();
  if(esPremiumLocal()){alert('Con Premium esta web no carga anuncios.');return;}
  if(!adsOn()){alert('Ahora mismo este sitio no usa cookies publicitarias.');return;}
  localStorage.removeItem(CK);
  document.documentElement.classList.remove('ad-ok');
  try { sessionStorage.setItem('gr_pedir_cookies','1'); } catch(err){}
  if(window.__adsLoaded){location.reload();return;}
  if(!adsConfigured()){ alert('Ahora mismo este sitio no usa cookies publicitarias.'); return; }
  const prev=document.getElementById('cookie-banner');
  if(prev) prev.remove();
  const note=document.getElementById('cookie-note');
  if(note) note.remove();
  banner();
}));
/* ── Progreso, lecciones nuevas (L05A–L06C) y tests ── */
const passed=id=>!!(prog()[id]&&prog()[id].aprobado);
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const VIDEO_RE=/^[a-z0-9_-]+\.mp4$/i;
const EXAM_RE=/^[a-z0-9_-]+\.json$/i;
const ID_RE=/^[a-z0-9]+$/;

function idsCertificado(){
  const data=window.__cursoWeb;
  if(data&&Array.isArray(data.lecciones)){
    const ids=data.lecciones.filter(L=>L&&L.estado==='disponible'&&L.examen&&EXAM_RE.test(L.examen)).map(L=>L.id);
    if(data.examenFinal&&data.examenFinal.estado==='disponible')ids.push('final');
    return ids;
  }
  const ids=[...document.querySelectorAll('.lesson.ok')].map(li=>li.dataset.id).filter(Boolean);
  if(ids.length&&(document.getElementById('finalbtn')||document.querySelector('[data-key="final"]')))ids.push('final');
  return ids;
}
function certificadoListo(){
  const ids=idsCertificado();
  return ids.length>0&&ids.every(passed);
}
function sesionCurso(){
  return !!(window.GRAuth&&GRAuth.usuario&&GRAuth.usuario());
}
function paintProgress(){
  const lis=[...document.querySelectorAll('.lesson.ok')];
  if(!lis.length)return;
  let n=0,next=null;
  lis.forEach(li=>{
    const id=li.dataset.id,st=li.querySelector('.st');
    li.classList.remove('locked');
    const a=li.querySelector('a');
    if(a){a.removeAttribute('aria-disabled');if(a.title==='Aprueba antes la lección anterior')a.removeAttribute('title');}
    if(passed(id)){n++;li.classList.add('done');if(st)st.textContent='✔ '+prog()[id].mejor+' pts';}
    else if(!next)next=li;
  });
  const tot=lis.length;
  const bar=document.getElementById('pbar'),txt=document.getElementById('ptxt');
  if(bar)bar.style.width=(tot?(100*n/tot):0)+'%';
  if(txt)txt.textContent='Progreso: '+n+' de '+tot+' lecciones aprobadas'+(passed('final')?' · Examen final aprobado':'');
  const fb=document.getElementById('finalbtn');
  if(fb){
    fb.classList.remove('dis');
    fb.textContent=certificadoListo()?'Ver el certificado':'Examen final';
    fb.setAttribute('href',certificadoListo()?'examen-final.html#certificado':'examen-final.html');
  }
  const b=document.getElementById('continuar');
  if(!b)return;
  if(n&&next){const a=next.querySelector('a');b.textContent='Continuar: '+next.querySelector('.code').textContent;if(a)b.href=a.getAttribute('href');}
  else if(n===tot){b.textContent=passed('final')?'Ver el certificado':'Ir al examen final';b.href=passed('final')?'examen-final.html#certificado':'examen-final.html';}
}
function paintLocks(){
  /* Las lecciones y el examen están abiertos. Aprobar un test no abre ni cierra nada. */
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
          asegurarCertificado();
          pintarCertificado();
          const r=w.querySelector('.res');r.className='res result '+(ap?'pass':'fail');
          const guarda=sesionCurso()?'':' Crea tu cuenta gratis para guardar tu progreso.';
          r.innerHTML=(ap?'🎉 ¡Aprobado! ':'Casi… ')+ok+' de '+blocks.length+' aciertos (necesitas '+pass+'). '+(ap?'Cuenta para el certificado. Las demás lecciones siguen abiertas.':'Repasa las explicaciones de las falladas y vuelve a intentarlo.')+guarda+'<br><button class="btn retry" style="margin-top:8px">Repetir test</button>';
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
function lessonMedia(enlace){
  const s=String(enlace||'').trim();
  if(!s||/[\s<>"']/.test(s))return null;
  if(/^videos\/[a-z0-9_-]+\.mp4$/i.test(s))return {kind:'file',src:root+s};
  if(/^[a-z0-9_-]+\.mp4$/i.test(s))return {kind:'file',src:root+'videos/'+s};
  const suelto=s.match(/^(?:youtube:|yt:)?([A-Za-z0-9_-]{11})$/);
  if(suelto)return {kind:'youtube',id:suelto[1]};
  let u;
  try{u=new URL(s);}catch(e){return null;}
  if(u.protocol!=='https:')return null;
  const host=u.hostname.replace(/^www\./,'');
  if(host==='youtu.be'){
    const id=u.pathname.replace(/^\//,'').split('/')[0];
    return /^[a-zA-Z0-9_-]{6,}$/.test(id)?{kind:'youtube',id}:null;
  }
  if(host==='youtube.com'||host==='youtube-nocookie.com'){
    const fromPath=(u.pathname.match(/\/(?:embed|shorts)\/([a-zA-Z0-9_-]{6,})/)||[])[1]||'';
    const id=u.searchParams.get('v')||fromPath;
    return /^[a-zA-Z0-9_-]{6,}$/.test(id)?{kind:'youtube',id}:null;
  }
  if(/\.mp4$/i.test(u.pathname))return {kind:'file',src:s};
  return null;
}
function fuenteLeccion(L){
  if(!L)return '';
  if(lessonMedia(L.enlace))return String(L.enlace).trim();
  if(lessonMedia(L.video))return String(L.video).trim();
  return '';
}
function paintLessonSlot(slot,enlace){
  const media=lessonMedia(enlace);
  if(!media){
    if(slot.querySelector('video,iframe,.yt-facade'))return;
    slot.textContent='';
    const p=document.createElement('p');
    p.className='ph video-soon';
    p.textContent='Próximamente';
    slot.appendChild(p);
    return;
  }
  if(media.kind==='youtube'){
    const b=document.createElement('button');
    b.type='button';
    b.className='yt-facade';
    b.textContent='Ver el video';
    const nota=document.createElement('p');
    nota.className='fine';
    nota.textContent='Se carga al pulsar, desde youtube-nocookie.com.';
    b.addEventListener('click',function(){
      const f=document.createElement('iframe');
      f.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(media.id)+'?rel=0';
      f.title='Video de la lección';
      f.allow='accelerometer; encrypted-media; picture-in-picture';
      f.allowFullscreen=true;
      f.loading='lazy';
      f.referrerPolicy='strict-origin-when-cross-origin';
      slot.replaceChildren(f);
    });
    slot.replaceChildren(b,nota);
    return;
  }
  const v=document.createElement('video');
  v.controls=true;
  v.playsInline=true;
  v.preload='none';
  v.poster=root+'img/logo.jpg';
  v.src=media.src;
  slot.replaceChildren(v);
}
async function promoteFromJson(){
  const list=document.querySelector('ul.lessons');
  if(!list)return;
  const data=await cursoWeb();
  if(!data||!Array.isArray(data.lecciones))return;
  data.lecciones.forEach(L=>{
    if(!fuenteLeccion(L)||!ID_RE.test(L.id||''))return;
    const li=list.querySelector('.lesson.soon[data-id="'+L.id+'"]');
    if(li)promoteLesson(li,L);
  });
}
async function mountLessonVideos(){
  const slots=[...document.querySelectorAll('[data-lesson-video]')];
  if(!slots.length)return;
  const data=await cursoWeb();
  if(!data||!Array.isArray(data.lecciones))return;
  const by={};
  data.lecciones.forEach(function(L){if(L&&L.id)by[L.id]=L;});
  slots.forEach(function(slot){
    const L=by[slot.getAttribute('data-lesson-video')]||null;
    const fuente=fuenteLeccion(L);
    if(!fuente&&slot.querySelector('video,iframe,.yt-facade'))return;
    paintLessonSlot(slot,fuente);
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
  const fuente=fuenteLeccion(L);
  const media=lessonMedia(fuente);
  const withExam=!!(L.examen&&EXAM_RE.test(L.examen));
  let html='<p class="crumb"><a href="'+root+'curso.html">Curso</a> › '+esc(L.codigo||'')+'</p>';
  html+='<h1><span class="code">'+esc(L.codigo||'')+'</span> '+esc(L.titulo||'')+'</h1>';
  if(media&&media.kind==='file'){
    html+='<div class="video lockable" data-lesson-video="'+esc(L.id)+'"><video controls playsinline preload="none" poster="'+esc(root+'img/logo.jpg')+'" src="'+esc(media.src)+'"></video></div>';
  }else if(media&&media.kind==='youtube'){
    html+='<div class="video lockable" data-lesson-video="'+esc(L.id)+'"><button type="button" class="yt-facade">Ver el video</button></div>';
  }else{
    html+='<div class="video lockable" data-lesson-video="'+esc(L.id)+'"><p class="ph video-soon">Próximamente</p></div>';
  }
  if(!media){
    if(L.descripcion)html+='<section class="texto"><h2>De qué trata</h2><p>'+esc(L.descripcion)+'</p></section>';
    host.innerHTML=html;
    return;
  }
  if(L.descripcion)html+='<section class="texto lockable"><h2>De qué trata</h2><p>'+esc(L.descripcion)+'</p></section>';
  if(withExam){
    html+='<section class="quiz" data-exam="'+esc(root+'data/examenes/'+L.examen)+'" data-pass="10" data-key="'+esc(L.id)+'"><h2>Test de la lección</h2><p>Apruebas con 10 aciertos. El test es para el certificado; la lección ya está abierta. Puedes repetirlo.</p><div class="qwrap">Cargando test…</div></section>';
  }
  host.innerHTML=html;
  const t=document.querySelector('title');
  if(t)t.textContent=(L.codigo?L.codigo+': ':'')+(L.titulo||'Lección')+' | Curso Granja Rentable';
}
async function mountFinalVideos(){
  const box=document.getElementById('videos-finales');
  if(!box)return;
  const data=await cursoWeb();
  const by={};
  ((data&&data.lecciones)||[]).forEach(function(L){if(L&&L.id)by[L.id]=L;});
  const base=String((data&&data.videoBaseUrl)||'videos/').replace(/^\/+/,'');
  box.querySelectorAll('.final-slot').forEach(function(slot){
    const L=by[slot.getAttribute('data-id')]||{};
    const name=String(L.videoFinal||'').trim();
    if(!VIDEO_RE.test(name)){
      slot.innerHTML='<p>Video final pendiente de aprobación. No hay archivo ni dirección.</p>';
      return;
    }
    slot.innerHTML='<video controls preload="metadata" playsinline poster="'+esc(root+'img/logo.jpg')+'" src="'+esc(root+base+name)+'"></video>';
  });
}
function fechaCurso(iso){
  try{return new Date(iso).toLocaleDateString('es',{day:'numeric',month:'long',year:'numeric'});}
  catch(e){return '';}
}
function asegurarCertificado(){
  if(!certificadoListo())return;
  const pr=prog();
  const prev=pr.certificado||{};
  const u=sesionCurso()?GRAuth.usuario():null;
  const nombre=(u&&u.nombre)||prev.nombre||'';
  const fecha=prev.fecha||new Date().toISOString();
  const guardado=!!u;
  if(prev.fecha===fecha&&prev.nombre===nombre&&!!prev.guardado===guardado)return;
  pr.certificado={fecha:fecha,nombre:nombre,guardado:guardado};
  save(pr);
}
function esPaginaCurso(){
  return /\/(?:curso|examen-final|leccion)(?:\.html)?$/.test(location.pathname)||/\/lecciones\//.test(location.pathname);
}
function pintarAvisoCuenta(){
  if(!esPaginaCurso())return;
  let el=document.getElementById('aviso-cuenta');
  if(!el){
    el=document.createElement('p');
    el.id='aviso-cuenta';
    el.className='aviso-cuenta';
    el.innerHTML='Crea tu cuenta gratis para guardar tu progreso. <button type="button">Crear cuenta</button>';
    const main=document.getElementById('contenido');
    if(!main)return;
    main.insertAdjacentElement('afterbegin',el);
    el.querySelector('button').addEventListener('click',function(){
      if(window.GRAuth&&GRAuth.abrir)GRAuth.abrir('registro');
    });
  }
  el.hidden=sesionCurso();
}
async function pintarCertificado(){
  const enCurso=document.querySelector('ul.lessons');
  const enExamen=document.querySelector('[data-key="final"]');
  if(!enCurso&&!enExamen)return;
  await cursoWeb();
  asegurarCertificado();
  let box=document.getElementById('certificado');
  if(!box){
    box=document.createElement('section');
    box.id='certificado';
    box.className='certificado';
    const ancla=document.querySelector('.final-link')||enExamen;
    if(ancla)ancla.insertAdjacentElement('afterend',box);
  }
  if(!certificadoListo()){box.hidden=true;return;}
  const pr=prog();
  const cert=pr.certificado||{};
  const u=sesionCurso()?GRAuth.usuario():null;
  const nombre=(u&&u.nombre)||cert.nombre||'';
  const cuando=cert.fecha?fechaCurso(cert.fecha):'';
  box.hidden=false;
  box.innerHTML='<h2>Certificado</h2>'+
    (u?'<p>Está guardado en tu cuenta.</p>':'<p>En este navegador ya está listo. Crea tu cuenta gratis para guardar tu progreso.</p>')+
    '<div class="cert-hoja"><p class="kicker">Granja Rentable</p><h3>Certificado del curso de avicultura</h3>'+
    '<p class="cert-nombre">'+(nombre?esc(nombre):'Alumno del curso gratis')+'</p>'+
    '<p>Aprobó los tests de las lecciones publicadas y el examen final.</p>'+
    '<p>Constancia de autoevaluación, sin verificación externa.</p>'+
    (cuando?'<p class="cert-fecha">'+esc(cuando)+'</p>':'')+
    '</div><p><button type="button" class="btn sec" id="cert-print">Imprimir</button></p>';
  const btn=document.getElementById('cert-print');
  if(btn)btn.addEventListener('click',function(){
    document.body.classList.add('imprimir-cert');
    window.print();
  });
}
window.addEventListener('afterprint',function(){document.body.classList.remove('imprimir-cert');});
window.addEventListener('gr-auth',function(){pintarAvisoCuenta();pintarCertificado();paintProgress();});
paintProgress();
paintLocks();
bindQuizzes();
pintarAvisoCuenta();
(async function(){
  await promoteFromJson();
  paintProgress();
  await renderDynamicLesson();
  await mountLessonVideos();
  await mountFinalVideos();
  paintLocks();
  bindQuizzes();
  pintarAvisoCuenta();
  await pintarCertificado();
  paintProgress();
})();
})();
