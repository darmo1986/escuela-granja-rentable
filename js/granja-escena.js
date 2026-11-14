(function(root){
  'use strict';
  const limit=40;
  const birdSVG='<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><ellipse class="bird-shadow" cx="32" cy="56" rx="19" ry="4"/><g class="bird-figure"><path class="bird-tail" d="M19 35Q3 17 8 39L21 46Z"/><ellipse class="bird-body" cx="30" cy="39" rx="20" ry="15"/><path class="bird-wing" d="M20 34Q40 28 38 44Q25 48 20 34"/><path class="bird-leg" d="M25 51v7m0-1-6 2m20-8v7m0-1 5 2"/><g class="bird-head"><path fill="#bd4339" d="M39 20q-3-9 2-9l4 5q4-8 7-4l-1 10"/><ellipse class="bird-body" cx="45" cy="26" rx="11" ry="12"/><path fill="#e9ab3d" d="m54 24 9 5-10 3z"/><circle fill="#20382e" cx="49" cy="23" r="2"/><path fill="#bd4339" d="M49 35q5 9 8 0"/></g></g></svg>';
  const farmerSVG='<svg viewBox="0 0 42 72" aria-hidden="true"><ellipse cx="21" cy="68" rx="16" ry="3" fill="#396849" opacity=".2"/><path d="m14 49-2 17m16-17 3 17" stroke="#33445b" stroke-width="7" stroke-linecap="round"/><path d="M12 29h18l5 23H8z" fill="#297074"/><path d="m12 31-7 15m25-15 7 15" stroke="#e0a171" stroke-width="6" stroke-linecap="round"/><circle cx="21" cy="20" r="11" fill="#e7b186"/><path d="M6 17h30M12 15l3-10h13l4 10" stroke="#80562d" stroke-width="5" stroke-linejoin="round"/><path d="M17 36h8v12h-8z" fill="#e3c490"/></svg>';
  function layoutBirds(state,M){
    const result=[];
    state.hens.forEach((h,lot)=>{for(let i=0;i<h.count&&result.length<limit;i++)result.push({lot,ordinal:i,stage:M.lifeStage(h),breed:h.breed,health:h.health,isolated:Boolean(h.isolated||h.quarantine>0)});});
    return result;
  }
  function create(yard,options){
    const doc=yard.ownerDocument||document, birds=new Map(),lotIds=new WeakMap(),stations=new Map();let sequence=0,state,M,selected=null,selectedRef=null,frame=0,animationTimer,feedbackTimer,moving=true,placing=false,stationSelected=null,layout={};
    const make=(tag,className,text)=>{const el=doc.createElement(tag);el.className=className;if(text!==undefined)el.textContent=text;return el;};
    yard.replaceChildren();yard.setAttribute('role','group');yard.setAttribute('aria-label','Corral interactivo. Selecciona una gallina o utiliza sus instalaciones.');
    const sky=make('div','scene-sky');sky.setAttribute('aria-hidden','true');sky.append(make('div','scene-sun'),make('div','scene-cloud cloud-one'),make('div','scene-cloud cloud-two'));
    const coop=make('div','scene-coop');coop.setAttribute('aria-hidden','true');coop.append(make('div','coop-roof'),make('div','coop-wall'),make('div','coop-door'),make('div','coop-window'));
    const cropField=make('button','scene-crop-field');cropField.type='button';cropField.hidden=true;cropField.append(make('span','scene-crop-plants','🌱 🌱 🌱'),make('span','scene-crop-label','Tu cultivo'));cropField.addEventListener('click',()=>options.onAction('showCrops'));
    const cropMill=make('button','scene-crop-mill','⚙️');cropMill.type='button';cropMill.hidden=true;cropMill.title='Abrir máquina de pienso';cropMill.setAttribute('aria-label','Abrir máquina de pienso');cropMill.addEventListener('click',()=>options.onAction('showCrops'));
    const fence=make('div','scene-fence');fence.setAttribute('aria-hidden','true');
    const stage=make('div','scene-birds');
    const farmer=make('div','scene-farmer');farmer.innerHTML=farmerSVG;farmer.setAttribute('aria-hidden','true');
    const tools=make('div','scene-tools');
    const station=(key,className,label,action,icon,value)=>{const b=make('button','scene-station '+className);b.type='button';b.dataset.station=key;const image=make('span','station-icon',icon);image.setAttribute('aria-hidden','true');b.append(image,make('span','station-label',label));b.addEventListener('click',()=>{if(placing){stationSelected=key;refreshPlacement();}else options.onAction(action,value);});b.addEventListener('keydown',event=>{if(!placing||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();stationSelected=key;const pos=layout[key];commitPosition(key,pos.x+(event.key==='ArrowRight'?4:event.key==='ArrowLeft'?-4:0),pos.y+(event.key==='ArrowDown'?4:event.key==='ArrowUp'?-4:0));});tools.append(b);stations.set(key,b);return b;};
    station('feeder-0','scene-feeder','Elegir alimento','showFood','🌾');station('waterer-0','scene-water','Reponer agua · 0,40 €','water','💧');const nest=station('nest','scene-nest','Recoger nidos · 0','collect','🥚');
    const footbath=station('footbath','scene-footbath','Pediluvio · 12 €','upgrade','👢','footbath'),cleaner=station('clean','scene-clean','Cambiar cama · 2 €','clean','🧹');
    const defenders=make('div','scene-defenders'),threat=make('div','scene-threat');threat.hidden=true;threat.setAttribute('role','status');
    const toast=make('div','scene-feedback');toast.setAttribute('aria-hidden','true');
    const status=make('p','scene-status','Selecciona una gallina para conocer su etapa y salud.');status.id='scene-selection';status.setAttribute('role','status');
    const selectedActions=make('div','scene-selected-actions');
    const sell=make('button','scene-sell','Vender una de este lote'),isolate=make('button','scene-isolate','Aislar lote');sell.type=isolate.type='button';selectedActions.hidden=true;selectedActions.append(sell,isolate);
    sell.addEventListener('click',()=>{if(selected!==null)options.onAction('sellHen',selected);});
    isolate.addEventListener('click',()=>{if(selected!==null)options.onAction('isolate',selected);});
    const toolbar=make('div','scene-toolbar'),motion=make('button','scene-motion','Detener movimiento');motion.type='button';motion.setAttribute('aria-pressed','false');motion.addEventListener('click',()=>{moving=!moving;motion.textContent=moving?'Detener movimiento':'Activar movimiento';motion.setAttribute('aria-pressed',String(!moving));yard.classList.toggle('scene-still',!moving);});
    const placement=make('button','scene-placement','Colocar / mover');placement.type='button';placement.setAttribute('aria-pressed','false');placement.addEventListener('click',()=>{placing=!placing;stationSelected=null;refreshPlacement();});toolbar.append(make('span','scene-count',''),placement,motion);
    yard.append(sky,coop,cropField,cropMill,fence,stage,farmer,tools,defenders,threat,toast,toolbar);
    yard.addEventListener('click',event=>{if(!placing||!stationSelected||event.target.closest('button'))return;const box=yard.getBoundingClientRect();commitPosition(stationSelected,(event.clientX-box.left)/box.width*100,(event.clientY-box.top)/box.height*100);});
    function refreshPlacement(){yard.classList.toggle('scene-placing',placing);placement.setAttribute('aria-pressed',String(placing));placement.textContent=placing?'Terminar de colocar':'Colocar / mover';stations.forEach((b,k)=>b.classList.toggle('station-selected',placing&&k===stationSelected));if(placing)status.textContent=stationSelected?'Toca una zona del suelo para colocar. También puedes mover con las flechas del teclado.':'Elige un comedero, bebedero, nidal o utensilio para moverlo. La cantidad de equipos afecta al acceso; la posición organiza tu corral.';}
    function defaultPosition(key){if(key==='nest')return {x:51,y:25};if(key==='footbath')return {x:14,y:36};if(key==='clean')return {x:86,y:36};const n=Number(key.split('-')[1])||0;return {x:key.startsWith('feeder')?14+n%4*19:86-n%4*19,y:78-Math.floor(n/4)*13};}
    function renderPositions(){stations.forEach((b,key)=>{const fallback=defaultPosition(key),p=layout[key];if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))layout[key]=fallback;else layout[key]={x:Math.max(14,Math.min(86,p.x)),y:Math.max(24,Math.min(82,p.y))};b.style.left=layout[key].x+'%';b.style.top=layout[key].y+'%';});}
    function commitPosition(key,x,y){layout[key]={x:Math.max(14,Math.min(86,x)),y:Math.max(24,Math.min(82,y))};renderPositions();if(options.onLayout)options.onLayout(JSON.parse(JSON.stringify(layout)));status.textContent='Instalación colocada. Puedes elegir otra o terminar de colocar.';}
    yard.insertAdjacentElement('afterend',status);status.insertAdjacentElement('afterend',selectedActions);
    const mq=root.matchMedia?root.matchMedia('(prefers-reduced-motion: reduce)'):null;
    const setReduced=()=>{if(mq&&mq.matches){moving=false;motion.textContent='Activar movimiento';motion.setAttribute('aria-pressed','true');yard.classList.add('scene-still');}};setReduced();if(mq&&mq.addEventListener)mq.addEventListener('change',setReduced);
    function selectedInfo(){
      selected=selectedRef?state.hens.indexOf(selectedRef):null;if(selected===-1)selected=null;const h=selected!==null&&state.hens[selected];selectedActions.hidden=!h;if(!h){selected=null;status.textContent='Selecciona una gallina para conocer su etapa y salud.';return;}
      status.textContent=M.breeds[h.breed].name+' · '+M.lifeStage(h)+' · '+Math.floor(h.age)+' días · salud '+Math.round(h.health)+' %. '+M.productionStatus(state,h).message;
      isolate.textContent=h.isolated?'Reunir lote':'Aislar lote';sell.disabled=isolate.disabled=M.isBankrupt(state);
      birds.forEach(item=>item.el.setAttribute('aria-pressed',String(item.lot===selected)));
    }
    function place(item,index,total){
      const columns=total>24?5:total>12?5:4,rows=Math.ceil(total/columns),col=index%columns,row=Math.floor(index/columns);
      const jitter=((frame+index*3)%5-2)*2.1;
      item.el.style.left=(9+col*(78/Math.max(1,columns-1))+jitter)+'%';
      item.el.style.top=(31+row*(42/Math.max(1,rows-1))+((frame*3+index)%5-2))+'%';
      item.el.style.zIndex=String(20+row);item.el.style.setProperty('--step-delay',(-index*.41)+'s');
      item.el.style.setProperty('--face',(frame+index)%4===0?-1:1);
    }
    function update(next,motor){
      state=next;M=motor;layout={};if(state.sceneLayout&&typeof state.sceneLayout==='object')Object.entries(state.sceneLayout).slice(0,20).forEach(([k,v])=>{if(/^(feeder-[0-7]|waterer-[0-7]|nest|footbath|clean)$/.test(k)&&v&&Number.isFinite(v.x)&&Number.isFinite(v.y))layout[k]={x:v.x,y:v.y};});for(const kind of ['feeder','waterer']){const count=Math.min(8,Math.max(1,Number(state.facilities&&state.facilities[kind])||1));for(let i=1;i<count;i++){const key=kind+'-'+i;if(!stations.has(key))station(key,kind==='feeder'?'scene-feeder':'scene-water',kind==='feeder'?'Elegir alimento':'Reponer agua · 0,40 €',kind==='feeder'?'showFood':'water',kind==='feeder'?'🌾':'💧');}for(let i=count;i<8;i++){const key=kind+'-'+i;if(stations.has(key)){stations.get(key).remove();stations.delete(key);}}}renderPositions();const nextBirds=layoutBirds(state,M),wanted=new Set();
      nextBirds.forEach((bird,index)=>{
        const h=state.hens[bird.lot];if(!lotIds.has(h))lotIds.set(h,++sequence);const key=lotIds.get(h)+'-'+bird.ordinal;wanted.add(key);
        let item=birds.get(key);
        if(!item){const b=make('button','scene-bird scene-arriving');b.type='button';b.innerHTML=birdSVG;const health=make('span','bird-health');health.setAttribute('aria-hidden','true');b.append(health);item={el:b,lot:bird.lot};b.addEventListener('click',()=>{selected=item.lot;selectedRef=state.hens[selected];selectedInfo();if(options.onSelect)options.onSelect(selected);});stage.append(b);birds.set(key,item);}
        item.lot=bird.lot;item.el.className='scene-bird stage-'+bird.stage+' breed-'+bird.breed+(bird.health<45?' bird-unwell':'')+(bird.isolated?' bird-observed':'');
        item.el.setAttribute('aria-label',M.breeds[h.breed].name+', '+bird.stage+', salud '+Math.round(bird.health)+' %. Seleccionar ave '+(index+1));
        item.el.style.setProperty('--health',Math.round(bird.health)+'%');item.el.title=M.breeds[h.breed].name+' · '+bird.stage+' · '+Math.round(bird.health)+' % salud';place(item,index,nextBirds.length);
      });
      birds.forEach((item,key)=>{if(!wanted.has(key)){item.el.remove();birds.delete(key);}});
      yard.classList.toggle('scene-paused',Boolean(state.paused||M.isBankrupt(state)));yard.classList.toggle('scene-alert',Boolean(state.pending));yard.classList.toggle('scene-crowded',nextBirds.length>24);yard.classList.toggle('scene-roofed',Boolean(state.upgrades.roof));yard.dataset.fence=state.upgrades.fence;
      if(M.cropStatus){const crop=M.cropStatus(state),names={corn:'Maíz',oats:'Avena'};cropField.hidden=!crop.owned;cropMill.hidden=!crop.mill;cropField.classList.toggle('crop-ready',crop.ready);cropField.classList.toggle('crop-growing',Boolean(crop.active&&!crop.ready));cropField.firstChild.textContent=crop.active?(crop.ready?(crop.active.type==='corn'?'🌽 🌽 🌽':'🌾 🌾 🌾'):'🌱 🌱 🌱'):'▦ ▦ ▦';cropField.lastChild.textContent=crop.active?names[crop.active.type]+(crop.ready?' listo':' creciendo'):crop.plots+' parcelas libres';cropField.setAttribute('aria-label','Abrir cultivos: '+cropField.lastChild.textContent);}
      toolbar.firstChild.textContent=nextBirds.length+' aves en tu corral'+(state.paused?' · en pausa':'');
      stations.forEach((b,k)=>{if(k.startsWith('feeder'))b.classList.toggle('station-empty',state.feed+(state.youngFeed||0)<=0);if(k.startsWith('waterer'))b.classList.toggle('station-empty',state.water<=0);});nest.lastChild.textContent='Recoger nidos · '+Math.floor(state.nest);nest.classList.toggle('station-ready',Math.floor(state.nest)>0);
      const stopped=M.isBankrupt(state);stations.forEach(b=>b.disabled=stopped);placement.disabled=stopped;footbath.classList.toggle('station-active',state.upgrades.footbath>0);footbath.lastChild.textContent=state.upgrades.footbath>0?'Mantener pediluvio · 12 €':'Instalar pediluvio · 12 €';defenders.replaceChildren();state.defenders.forEach(d=>{const el=make('div','scene-defender '+(d.health<=0?'defender-inactive':''));const names={dog:'Perro',guard:'Vigilante',scarecrow:'Espantapájaros'};el.textContent={dog:'🐕',guard:'🧑‍🌾',scarecrow:'🌾'}[d.type];el.title=names[d.type]+' · resistencia '+Math.round(d.health)+' %';el.setAttribute('role','img');el.setAttribute('aria-label',el.title);defenders.append(el);});threat.hidden=!state.pending;if(state.pending){threat.className='scene-threat threat-'+state.pending.type;threat.textContent=(state.pending.type==='ground'?'🦊 Amenaza terrestre avisada':'🦅 Amenaza aérea avisada');}if(!placing)selectedInfo();else refreshPlacement();
    }
    function feedback(type,message,value){
      if(type==='install'&&value&&state.facilities&&!/insuficiente|máximo/i.test(message)){placing=true;stationSelected=value+'-'+(state.facilities[value]-1);refreshPlacement();}
      toast.textContent=message;toast.classList.add('scene-feedback-visible');if(!/insuficiente|no hay|no tienes|terminada|desconocid|no necesita|máximo|amplía/i.test(message))yard.dataset.activity=type;
      clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{toast.classList.remove('scene-feedback-visible');delete yard.dataset.activity;},2200);
    }
    animationTimer=setInterval(()=>{if(!state||state.paused||M.isBankrupt(state)||!moving||doc.hidden)return;frame++;let i=0;birds.forEach(item=>place(item,i++,birds.size));},2600);
    return {update,feedback,destroy(){clearInterval(animationTimer);clearTimeout(feedbackTimer);if(mq&&mq.removeEventListener)mq.removeEventListener('change',setReduced);status.remove();selectedActions.remove();yard.replaceChildren();}};
  }
  const api={create,layoutBirds};if(typeof module==='object'&&module.exports)module.exports=api;else root.GranjaEscena=api;
})(typeof globalThis==='object'?globalThis:this);
