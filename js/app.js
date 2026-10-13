(function(){
const root=document.body.dataset.root||'';
const PK='gr_progreso',CK='gr_consent';
const prog=()=>{try{return JSON.parse(localStorage.getItem(PK))||{}}catch(e){return{}}};
const save=p=>localStorage.setItem(PK,JSON.stringify(p));
/* ── Consentimiento + AdSense (no carga nada sin ID y sin «Aceptar») ── */
function loadAds(){
  if(!window.ADSENSE_CLIENT||window.__adsLoaded)return; window.__adsLoaded=1;
  const s=document.createElement('script');s.async=true;s.crossOrigin='anonymous';
  s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(window.ADSENSE_CLIENT);
  document.head.appendChild(s); document.documentElement.classList.add('ad-on');
  document.querySelectorAll('.ad-slot').forEach(d=>{const i=document.createElement('ins');i.className='adsbygoogle';i.style.display='block';
    i.dataset.adClient=window.ADSENSE_CLIENT;i.dataset.adSlot=d.dataset.adSlot;i.dataset.adFormat='auto';i.dataset.fullWidthResponsive='true';d.appendChild(i);
    (window.adsbygoogle=window.adsbygoogle||[]).push({});});
}
function banner(){
  if(!window.ADSENSE_CLIENT)return; // sin publicidad no hacen falta cookies de terceros
  if(document.getElementById('cookie-banner'))return;
  const b=document.createElement('div');b.id='cookie-banner';b.setAttribute('role','dialog');
  b.innerHTML='<strong>🍪 Cookies</strong><p style="margin:.3em 0">Usamos cookies de Google AdSense para mostrar anuncios (que pueden ser personalizados) y así mantener el curso gratis. Solo se activan si aceptas. <a href="'+root+'cookies.html">Más información</a></p><div class="row"><button class="btn" data-c="si">Aceptar</button><button class="btn sec" data-c="no">Rechazar</button></div>';
  b.addEventListener('click',e=>{const c=e.target.dataset.c;if(!c)return;localStorage.setItem(CK,c);b.remove();if(c==='si')loadAds();else if(window.__adsLoaded)location.reload();});
  document.body.appendChild(b);
}
const c=localStorage.getItem(CK); if(c==='si')loadAds(); else if(!c)banner();
document.querySelectorAll('[data-cookie-config]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();localStorage.removeItem(CK);if(!window.ADSENSE_CLIENT)alert('Ahora mismo este sitio no usa cookies publicitarias.');banner();}));
/* ── Progreso y bloqueo en portada ── */
const p=prog(); const lis=[...document.querySelectorAll('.lesson.ok')];
const passed=id=>!!(p[id]&&p[id].aprobado);
if(lis.length){let n=0,next=null;lis.forEach((li,i)=>{const id=li.dataset.id,st=li.querySelector('.st');
   if(passed(id)){n++;li.classList.add('done');st.textContent='✔ '+p[id].mejor+' pts';}
   else if(i>0&&!passed(lis[i-1].dataset.id)){li.classList.add('locked');st.textContent='🔒';const a=li.querySelector('a');a.removeAttribute('href');a.setAttribute('aria-disabled','true');a.title='Aprueba antes la lección anterior';}
   else if(!next)next=li;});
  const tot=lis.length;document.getElementById('pbar').style.width=(100*n/tot)+'%';
  document.getElementById('ptxt').textContent='Progreso: '+n+' de '+tot+' lecciones aprobadas'+(passed('final')?' · Examen final aprobado 🎓':'');
  const fb=document.getElementById('finalbtn');if(fb&&n<tot){fb.textContent='🔒 Examen final (aprueba todas las lecciones)';fb.removeAttribute('href');fb.classList.add('dis');}
  const b=document.getElementById('continuar');if(n&&next){b.textContent='Continuar: '+next.querySelector('.code').textContent;b.href=next.querySelector('a').getAttribute('href');}else if(n===tot){b.textContent=passed('final')?'¡Curso completado! 🎓':'Ir al examen final';b.href='examen-final.html';}}
/* ── Bloqueo en lección / examen final ── */
const req=document.querySelector('[data-requires]');
if(req){const need=req.dataset.requires.split(' ').filter(Boolean);
  if(need.some(id=>!passed(id))){req.querySelector('.lock-msg').hidden=false;req.querySelectorAll('.lockable').forEach(e=>{e.remove();});}}
/* ── Test ── */
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const esc=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
document.querySelectorAll('.quiz').forEach(q=>{
  const w=q.querySelector('.qwrap'),pass=+q.dataset.pass,key=q.dataset.key;
  fetch(q.dataset.exam).then(r=>r.json()).then(ex=>{
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
})();
