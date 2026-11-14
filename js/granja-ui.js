(function(){
  'use strict';
  const M=window.GranjaMotor, $=id=>document.getElementById(id), euro=n=>n.toLocaleString('es-ES',{style:'currency',currency:'EUR'});
  let mode='real',state,saveOK=true;
  function key(){return 'gr-simulador-v1-'+mode;}
  function load(){try{state=M.restore(localStorage.getItem(key()));}catch(_){state=M.fresh();saveOK=false;}if(mode==='real')M.advance(state);paint();}
  function save(){try{localStorage.setItem(key(),JSON.stringify(state));saveOK=true;}catch(_){saveOK=false;}$('save-status').textContent=saveOK?'Partida guardada en este navegador.':'No se pudo guardar: esta partida se perderá al cerrar. Permite el almacenamiento para conservarla.';}
  function paint(){
    const n=M.count(state),health=n?state.hens.reduce((a,h)=>a+h.health*h.count,0)/n:0;
    $('money').textContent=euro(state.money);$('day').textContent='Día '+state.day+' · '+state.hour%24+':00';$('birds').textContent=n+' / '+state.capacity;
    $('egg-count').textContent=state.eggs+' / '+M.eggCapacity(state)+' guardados · '+Math.floor(state.nest)+' en nidos';$('egg-price').textContent=euro(state.eggPrice);$('sell-eggs').textContent='Vender huevos · '+euro(state.eggPrice)+'/ud.';$('feed-count').textContent=state.feed.toFixed(1)+' kg';$('water-count').textContent=state.water.toFixed(1)+' L';$('pause').textContent=state.paused?'Reanudar la granja':'Pausar la granja';
    $('hygiene').value=state.hygiene;$('hygiene-label').textContent=Math.round(state.hygiene)+' %';$('health').value=health;$('health-label').textContent=Math.round(health)+' %';
    $('balance').textContent='Ingresos '+euro(state.income)+' · Gastos '+euro(state.expenses)+' · Resultado '+euro(state.income-state.expenses)+' (sin valorar aves e instalaciones).';
    $('flock').replaceChildren();state.hens.forEach((h,i)=>{const row=document.createElement('li');row.textContent=h.count+' × '+M.breeds[h.breed].name+' · '+Math.floor(h.age)+' días · salud '+Math.round(h.health)+' %'+(h.quarantine>0?' · en observación':'')+' ';const b=document.createElement('button');b.type='button';b.dataset.action='sellHen';b.dataset.value=i;b.textContent='Vender una';row.append(b);const iso=document.createElement('button');iso.type='button';iso.dataset.action='isolate';iso.dataset.value=i;iso.textContent=h.isolated?'Reunir lote':'Aislar lote';row.append(iso);$('flock').append(row);});
    if(!n){const li=document.createElement('li');li.textContent='No quedan aves. Puedes comprar otra gallina o reiniciar la partida.';$('flock').append(li);}
    $('yard').replaceChildren();for(let i=0;i<Math.min(n,24);i++){const hen=document.createElement('span');hen.textContent='🐔';hen.setAttribute('aria-hidden','true');hen.style.setProperty('--i',i);$('yard').append(hen);}
    $('yard').setAttribute('aria-label','Gallinero con '+n+' gallinas');
    $('fence-state').textContent='Malla '+state.upgrades.fence+'/3';$('roof-state').textContent=state.upgrades.roof?'Cubierta instalada':'Sin cubierta';
    document.querySelectorAll('[data-upgrade]').forEach(el=>{const k=el.dataset.upgrade,owned=k==='fence'?state.upgrades.fence===3:k==='storage'?state.upgrades.storage===2:['roof','access'].includes(k)&&state.upgrades[k],price=k==='fence'?M.prices.fence[state.upgrades.fence]:k==='storage'?M.prices.storage[state.upgrades.storage]:M.prices[k];el.disabled=Boolean(owned);el.textContent=owned?'Instalado':euro(price)+' · Comprar';});
    $('defenders').textContent=state.defenders.length?state.defenders.map(d=>({scarecrow:'Espantapájaros',dog:'Perro',guard:'Guardián'}[d.type])+': '+Math.round(d.health)+' % resistencia').join(' · '):'Todavía no tienes defensores.';
    $('storage-status').textContent=['Sin almacén: 24 huevos, 2 días de conservación simulada.','Almacén protegido: 100 huevos, 4 días; reduce pérdidas por plagas.','Almacén refrigerado: 180 huevos, 10 días; electricidad 0,40 €/día.'][state.upgrades.storage];
    $('egg-lots').textContent=state.eggLots.length?state.eggLots.map(l=>l.count+' huevos de hace '+(state.day-l.day)+' días').join(' · '):'Sin lotes guardados.';
    $('log').replaceChildren();state.log.forEach(t=>{const li=document.createElement('li');li.textContent=t;$('log').append(li);});
    $('practice-turn').hidden=mode!=='practice';$('practice-turn').disabled=state.paused;$('clock-description').textContent=state.paused?'Granja pausada: sin consumo, envejecimiento ni amenazas mientras no estás.':mode==='real'?'Reloj ×3: ocho horas reales equivalen a un día de granja. Máximo tres días simulados por ausencia.':'Práctica independiente: avanza un día cuando quieras. No modifica tu partida en tiempo real.';
    $('real-mode').setAttribute('aria-pressed',String(mode==='real'));$('practice-mode').setAttribute('aria-pressed',String(mode==='practice'));save();
  }
  document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.action){if(mode==='real')M.advance(state);$('message').textContent=M.action(state,b.dataset.action,b.dataset.value);paint();}});
  $('real-mode').onclick=()=>{save();mode='real';load();};$('practice-mode').onclick=()=>{save();mode='practice';load();};
  $('practice-turn').onclick=()=>{M.advance(state,state.last+M.DAY/3);state.last=Date.now();$('message').textContent='Ha transcurrido un día de práctica. Revisa los nidos y las reservas.';paint();};
  $('reset').onclick=()=>{if(window.confirm('¿Borrar solo la partida '+(mode==='real'?'en tiempo real':'de práctica')+' y empezar de nuevo?')){state=M.fresh();$('message').textContent='Nueva partida creada.';paint();}};
  load();setInterval(()=>{if(mode==='real'){M.advance(state);paint();}},30000);window.addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&mode==='real'){M.advance(state);paint();}});
})();
