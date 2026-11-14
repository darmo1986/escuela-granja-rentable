(function(root){
  'use strict';
  const DAY=86400000, HOUR=DAY/24;
  const breeds={brown:{name:'Ponedoras marrones',price:18,lay:.85,feed:.12,resilience:.9},leghorn:{name:'Leghorn',price:20,lay:.9,feed:.11,resilience:.85},sussex:{name:'Sussex',price:24,lay:.65,feed:.14,resilience:1.1}};
  const prices={egg:.25,feed:.48,youngFeed:.60,calcium:1.50,feeder:12,waterer:10,water:.02,clean:2,care:8,fence:[35,80,150],roof:95,scarecrow:18,dog:90,guard:150,expand:75,storage:[45,110],access:25,footbath:12};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  // Agricultura: precios, rendimientos, receta y duración son reglas ficticias.
  const cropRules={land:250,mill:180,maxUpgrades:10,growHours:144,seedPack:10,seedPrice:{corn:4,oats:3},waterPerPlot:4,yieldPerPlot:8,recipe:{corn:3,oats:2,output:10,complementKg:5,layerCost:2.2,youngCost:2.6}};
  function freshCrops(){return {land:false,level:0,mill:false,seeds:{corn:0,oats:0},grain:{corn:0,oats:0},active:null};}
  function cropStatus(s){
    const c=s.crops||freshCrops(),plots=c.land?1+c.level:0,active=c.active;
    const hoursLeft=active?Math.max(0,active.readyHour-s.hour):0,r=cropRules.recipe;
    const hasGrain=c.grain.corn>=r.corn&&c.grain.oats>=r.oats;
    return {owned:c.land,level:c.level,plots,nextUpgradeCost:c.land&&c.level<cropRules.maxUpgrades?40+20*c.level:null,canImprove:c.land&&c.level<cropRules.maxUpgrades,mill:c.mill,seeds:{...c.seeds},grain:{...c.grain},active:active?{...active}:null,ready:Boolean(active&&hoursLeft===0),hoursLeft,daysLeft:Math.ceil(hoursLeft/24),yieldKg:active?active.yieldKg:plots*cropRules.yieldPerPlot,plantCost:{seeds:plots,water:plots*cropRules.waterPerPlot},canMill:{layer:c.mill&&hasGrain&&s.money+1e-8>=r.layerCost,young:c.mill&&hasGrain&&s.money+1e-8>=r.youngCost},recipe:{...r}};
  }
  function restoreCrops(raw,hour){
    const c=freshCrops();if(!raw||typeof raw!=='object')return c;
    c.land=raw.land===true;c.level=c.land&&Number.isInteger(raw.level)&&raw.level>=0&&raw.level<=cropRules.maxUpgrades?raw.level:0;c.mill=c.land&&raw.mill===true;
    for(const type of ['corn','oats']){if(Number.isSafeInteger(raw.seeds?.[type])&&raw.seeds[type]>=0)c.seeds[type]=raw.seeds[type];if(Number.isFinite(raw.grain?.[type])&&raw.grain[type]>=0)c.grain[type]=raw.grain[type];}
    const a=raw.active;if(c.land&&a&&Object.hasOwn(cropRules.seedPrice,a.type)&&Number.isInteger(a.startHour)&&a.startHour>=0&&a.startHour<=hour&&a.readyHour===a.startHour+cropRules.growHours&&Number.isInteger(a.plots)&&a.plots>=1&&a.plots<=1+c.level&&a.yieldKg===a.plots*cropRules.yieldPerPlot&&a.seedsUsed===a.plots&&a.waterUsed===a.plots*cropRules.waterPerPlot)c.active={type:a.type,startHour:a.startHour,readyHour:a.readyHour,plots:a.plots,yieldKg:a.yieldKg,seedsUsed:a.seedsUsed,waterUsed:a.waterUsed};
    return c;
  }
  function cropAction(s,type,value){
    if(!['buyLand','improveLand','buyMill','buySeed','plantCrop','harvestCrop','millFeed'].includes(type))return null;
    if(!s.crops)s.crops=freshCrops();const c=s.crops,status=cropStatus(s),r=cropRules.recipe;
    if(type==='buyLand'){if(c.land)return 'Ya tienes terreno de cultivo.';if(!spend(s,cropRules.land))return 'Saldo insuficiente para comprar terreno.';c.land=true;return 'Terreno comprado: una parcela de cultivo y hasta diez mejoras adicionales.';}
    if(type==='buySeed'){if(!Object.hasOwn(cropRules.seedPrice,value))return 'Semilla desconocida.';if(!spend(s,cropRules.seedPrice[value]))return 'Saldo insuficiente para semillas.';c.seeds[value]+=cropRules.seedPack;return 'Compraste diez unidades de semilla de '+(value==='corn'?'maíz.':'avena.');}
    if(!c.land)return 'Compra primero un terreno de cultivo.';
    if(type==='improveLand'){if(!status.canImprove)return 'El terreno ya tiene sus diez mejoras adicionales.';if(!spend(s,status.nextUpgradeCost))return 'Saldo insuficiente para ampliar el cultivo.';c.level++;return 'Mejora '+c.level+'/10: ahora puedes sembrar '+(1+c.level)+' parcelas. La siembra en curso conserva su rendimiento original.';}
    if(type==='buyMill'){if(c.mill)return 'Ya tienes la máquina de procesado.';if(!spend(s,cropRules.mill))return 'Saldo insuficiente para la máquina.';c.mill=true;return 'Máquina comprada: procesa maíz y avena junto con un complemento comprado. No sustituye la compra directa de pienso.';}
    if(type==='plantCrop'){
      if(!Object.hasOwn(cropRules.seedPrice,value))return 'Cultivo desconocido.';if(c.active)return 'Ya hay una siembra en curso: recoge la cosecha antes de sembrar otra.';
      const plots=status.plots,seeds=plots,water=plots*cropRules.waterPerPlot;if(c.seeds[value]<seeds)return 'Semillas insuficientes para sembrar todas las parcelas.';if(s.water+1e-8<water)return 'Agua insuficiente para el riego inicial.';
      c.seeds[value]-=seeds;s.water=Math.max(0,s.water-water);c.active={type:value,startHour:s.hour,readyHour:s.hour+cropRules.growHours,plots,yieldKg:plots*cropRules.yieldPerPlot,seedsUsed:seeds,waterUsed:water};
      return 'Siembra de '+(value==='corn'?'maíz':'avena')+' iniciada. Cosecha en seis días simulados: dos días reales con reloj ×3. El riego y las semillas ya están descontados.';
    }
    if(type==='harvestCrop'){if(!c.active)return 'No hay cultivo para cosechar.';if(!status.ready)return 'La cosecha aún no está lista: faltan '+status.hoursLeft+' horas simuladas.';const crop=c.active;c.grain[crop.type]+=crop.yieldKg;c.active=null;return 'Cosechaste '+crop.yieldKg+' kg de '+(crop.type==='corn'?'maíz.':'avena.')+' Necesitas ambas especies y la máquina para preparar pienso de juego con complemento comprado.';}
    if(type==='millFeed'){
      if(!['layer','young'].includes(value))return 'Destino de pienso desconocido.';if(!c.mill)return 'Necesitas comprar la máquina antes de procesar.';if(c.grain.corn<r.corn||c.grain.oats<r.oats)return 'Grano insuficiente: cada lote requiere '+r.corn+' kg de maíz y '+r.oats+' kg de avena.';
      const cost=value==='young'?r.youngCost:r.layerCost;if(!spend(s,cost))return 'Saldo insuficiente para el complemento comprado.';c.grain.corn-=r.corn;c.grain.oats-=r.oats;s[value==='young'?'youngFeed':'feed']+=r.output;
      return 'Preparaste '+r.output+' kg de pienso '+(value==='young'?'para jóvenes':'de ponedoras')+' con ambos granos y '+r.complementKg+' kg de complemento comprado por '+cost.toFixed(2)+' €. Receta abstracta de juego, no una fórmula de alimentación real.';
    }
    return null;
  }
  // Edades y curva ficticias para el juego; no son una garantía biológica.
  const difficulties={facil:300,normal:180,dificil:80};
  const lifecycle={purchaseAge:145,start:150,peak:210,decline:450,end:1650};
  function ageFactor(age){if(age<lifecycle.start||age>=lifecycle.end)return 0;if(age<lifecycle.peak)return (age-lifecycle.start)/(lifecycle.peak-lifecycle.start);if(age<lifecycle.decline)return 1;return (lifecycle.end-age)/(lifecycle.end-lifecycle.decline);}
  function lifeStage(h){return h.age<lifecycle.peak?'joven':h.age<lifecycle.decline?'adulta':'vieja';}
  function needsYoungFeed(h){return h.age<lifecycle.start;}
  function retired(h){return h.age>=lifecycle.end;}
  function equipmentAccess(s){const n=count(s),f=s.facilities||{feeder:1,waterer:1};return {feed:n?Math.min(1,f.feeder*6/n):1,water:n?Math.min(1,f.waterer*6/n):1};}
  function productionStatus(s,h){
    const factor=ageFactor(h.age),access=equipmentAccess(s),eggsPerDay=h.count*breeds[h.breed].lay*factor*h.health/100*(h.isolated?.65:1)*Math.min(access.feed,access.water)*(s.calcium<=0?.8:1);
    if(retired(h))return {reason:'age',message:'Fin de puesta por edad: puedes vender este lote o conservarlo; seguirá necesitando alimento y agua.',eggsPerDay:0};
    if(s.water<=0)return {reason:'water',message:'Puesta detenida por falta de agua; no es fin de puesta por edad.',eggsPerDay:0};
    if((needsYoungFeed(h)?s.youngFeed:s.feed)<=0)return {reason:'feed',message:needsYoungFeed(h)?'Falta pienso para jóvenes. Revisa la reserva del lote.':'Puesta detenida por falta de pienso de ponedoras; no es fin de puesta por edad.',eggsPerDay:0};
    if(access.feed<1||access.water<1)return {reason:'equipment',message:'Acceso insuficiente: cada comedero y bebedero atiende seis aves en el juego. Coloca más equipos.',eggsPerDay};
    if(h.age<lifecycle.start)return {reason:'young',message:'Pollitas próximas al inicio de puesta: consumen pienso para jóvenes.',eggsPerDay:0};
    if(s.calcium<=0)return {reason:'calcium',message:'Reserva de calcio agotada: se reduce la producción aprovechable en el juego.',eggsPerDay};
    if(h.health<99)return {reason:'health',message:'Puesta reducida por salud; puede recuperarse con los cuidados.',eggsPerDay};
    return {reason:'laying',message:lifeStage(h)==='vieja'?'Puesta descendente por edad.':lifeStage(h)==='joven'?'La puesta está aumentando.':'Etapa adulta de buena producción.',eggsPerDay};
  }
  // Sin aves, el final automático llega cuando caja y huevos vendibles valen cero.
  // Un saldo insuficiente para recomprar se avisa sin forzar el final.
  function isBankrupt(s){return count(s)===0&&farmValue(s).total<=1e-8;}
  function henSaleValue(h){return breeds[h.breed].price*.45*clamp(1-(h.age-180)/1200,.15,1)*h.health/100;}
  function farmValue(s){const birds=s.hens.reduce((sum,h)=>sum+h.count*henSaleValue(h),0),eggs=(s.eggs+Math.floor(s.nest))*s.eggPrice;return {cash:s.money,birds,eggs,total:s.money+birds+eggs};}
  function fresh(now=Date.now(),difficulty='normal'){if(!Object.hasOwn(difficulties,difficulty))difficulty='normal';return {version:1,difficulty,last:now,hour:0,day:0,money:difficulties[difficulty],feed:12,youngFeed:4,calcium:1,crops:freshCrops(),facilities:{feeder:1,waterer:1},water:25,hygiene:95,eggs:0,eggLots:[],eggPrice:.25,nest:0,nestLots:[],capacity:10,hens:[{breed:'brown',count:4,age:lifecycle.purchaseAge,health:100,quarantine:0,isolated:false}],upgrades:{fence:0,roof:false,storage:0,access:false,footbath:0},defenders:[],pending:null,visitorPending:false,doorClosed:false,paused:false,income:0,expenses:0,seed:104729,log:['Empiezas con cuatro pollitas próximas a la puesta y '+difficulties[difficulty]+' € de juego.'],missed:0};}
  function log(s,t){s.log.unshift('Día '+s.day+': '+t);s.log=s.log.slice(0,12);}
  function count(s){return s.hens.reduce((n,h)=>n+h.count,0);}
  function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
  function spend(s,n){if(!Number.isFinite(n)||n<0||s.money+1e-8<n)return false;s.money=Math.max(0,s.money-n);s.expenses+=n;return true;}
  function threats(s){let ground=.16*Math.pow(.48,s.upgrades.fence),air=.09*(s.upgrades.roof?.1:1);for(const d of s.defenders)if(d.health>0){const effect=d.health/100;ground*=1-effect*({dog:.3,guard:.5,scarecrow:.04}[d.type]);air*=1-effect*({dog:.12,guard:.08,scarecrow:.55}[d.type]);}return {ground:Math.max(.002,ground),air:Math.max(.001,air)};}
  function eggCapacity(s){return [24,100,180][s.upgrades.storage];}
  function syncEggs(s){s.eggs=s.eggLots.reduce((n,l)=>n+l.count,0);}
  function syncNest(s){s.nest=s.nestLots.reduce((n,l)=>n+l.count,0);}
  function prepareNest(s){
    // Los guardados v1 sin fecha de puesta se migran de forma conservadora.
    const total=Array.isArray(s.nestLots)?s.nestLots.reduce((n,l)=>n+l.count,0):-1;
    if(!Array.isArray(s.nestLots)||Math.abs(total-s.nest)>1e-7)s.nestLots=s.nest>0?[{count:s.nest,day:Math.max(0,s.day-2)}]:[];
  }
  function addNest(s,n){if(n<=0)return;const last=s.nestLots[s.nestLots.length-1];if(last&&last.day===s.day)last.count+=n;else s.nestLots.push({count:n,day:s.day});syncNest(s);}
  function removeNest(s,n){while(n>1e-10&&s.nestLots.length){const lot=s.nestLots[0],take=Math.min(lot.count,n);lot.count-=take;n-=take;if(lot.count<1e-10)s.nestLots.shift();}syncNest(s);}
  function collectNest(s,n){
    // Un huevo compuesto por fracciones de días distintos conserva la fecha
    // más antigua, nunca la fecha de recogida.
    for(let i=0;i<n;i++){const day=s.nestLots[0].day;removeNest(s,1);const last=s.eggLots[s.eggLots.length-1];if(last&&last.day===day)last.count++;else s.eggLots.push({count:1,day});}
    syncEggs(s);
  }
  function step(s){
    s.hour++;s.hygiene=clamp(s.hygiene-count(s)*.075,0,100);s.upgrades.footbath=Math.max(0,s.upgrades.footbath-1/72);
    const needed=s.hens.filter(h=>!needsYoungFeed(h)).reduce((n,h)=>n+breeds[h.breed].feed*h.count/24,0),youngNeeded=s.hens.filter(needsYoungFeed).reduce((n,h)=>n+breeds[h.breed].feed*h.count/24,0),water=count(s)*.24/24;
    const calciumNeeded=s.hens.reduce((n,h)=>n+(ageFactor(h.age)>0?h.count*.003/24:0),0);
    const access=equipmentAccess(s);
    const fedLayer=needed===0?1:Math.min(access.feed,s.feed/needed),fedYoung=youngNeeded===0?1:Math.min(access.feed,s.youngFeed/youngNeeded),watered=water===0?1:Math.min(access.water,s.water/water),mineral=calciumNeeded===0?1:Math.min(1,s.calcium/calciumNeeded);
    s.feed=Math.max(0,s.feed-needed*fedLayer);s.youngFeed=Math.max(0,s.youngFeed-youngNeeded*fedYoung);s.calcium=Math.max(0,s.calcium-calciumNeeded);s.water=Math.max(0,s.water-water*watered);
    for(const h of s.hens){
      const wasRetired=retired(h),wasYoung=needsYoungFeed(h),fed=needsYoungFeed(h)?fedYoung:fedLayer;
      h.age+=1/24;h.quarantine=Math.max(0,(h.quarantine||0)-1/24);
      if(wasYoung&&!needsYoungFeed(h))log(s,'El lote empieza la puesta: ahora consume pienso de ponedoras. Revisa esa reserva y el calcio.');
      const deficit=(1-fed)*2+(1-watered)*3+(s.hygiene<45?(45-s.hygiene)/100:0);
      h.health=clamp(h.health+(deficit? -deficit/breeds[h.breed].resilience:.12),0,100);
      if(!wasRetired&&retired(h))log(s,breeds[h.breed].name+': fin de puesta por edad. Puedes vender el lote o conservarlo con sus cuidados.');
      addNest(s,h.count*breeds[h.breed].lay*ageFactor(h.age)*(h.health/100)*Math.min(fed,watered)*(.8+.2*mineral)*(h.isolated?.65:1)/24);
    }
    if(s.hour%24===0){
      s.day++;s.eggPrice=Math.round((.19+random(s)*.15)*100)/100;
      const cost=s.defenders.reduce((n,d)=>n+(d.health>0?({dog:.6,guard:2,scarecrow:0}[d.type]):0),0)+(s.upgrades.storage===2?.4:0);
      if(cost&&!spend(s,cost)){s.defenders.forEach(d=>d.health=Math.max(0,d.health-20));if(s.upgrades.storage===2){s.upgrades.storage=1;log(s,'Sin saldo para electricidad: el refrigerador pasa a conservación sin frío.');}log(s,'Falta presupuesto de mantenimiento: baja la resistencia de tus defensores.');}
      const risk=threats(s);
      if(s.pending){const r=random(s);if(count(s)&&r<risk[s.pending.type]){const h=s.hens.find(h=>h.count>0);h.count--;log(s,s.pending.type==='ground'?'Una intrusión terrestre causó una baja por ataque, no por enfermedad.':'Un ataque aéreo causó una baja por trauma.');s.defenders.forEach(d=>d.health=Math.max(0,d.health-12));}else log(s,'La amenaza avisada no causó bajas. Las defensas reducen el riesgo, no garantizan el resultado.');s.pending=null;}
      if(random(s)<.35){s.pending={type:random(s)<.6?'ground':'air'};log(s,s.pending.type==='ground'?'Aviso: huellas junto al cercado. Refuerza la malla antes del próximo día.':'Aviso: aves rapaces en las cercanías. Revisa la protección aérea.');}
      const visitors=Boolean(s.visitorPending&&!s.doorClosed&&!s.upgrades.access&&!s.defenders.some(d=>d.type==='guard'&&d.health>25)),wild=random(s)<.2;
      if(s.visitorPending)log(s,visitors?'Un vecino entró sin control. Aumenta la exposición, pero no implica contagio seguro.':'La visita quedó fuera: la puerta, el control de acceso o el guardián evitaron la entrada.');
      s.visitorPending=random(s)<.25;s.doorClosed=false;if(s.visitorPending)log(s,'Aviso: un vecino quiere entrar mañana. Puedes cerrar la puerta o preparar control de acceso.');
      const diseaseRisk=.01+(s.hygiene<45?.12:0)+(visitors&&!s.upgrades.access?.07:0)+(wild&&!s.upgrades.roof?.06:0)+(s.upgrades.footbath>0?0:.02);
      if((visitors||wild)&&random(s)<diseaseRisk){const h=s.hens.find(h=>!h.isolated&&!h.quarantine);if(h){h.health=Math.max(0,h.health-15);log(s,'Posible problema sanitario tras exposición '+(visitors?'a visitantes':'a aves silvestres')+'. El riesgo es probabilístico: aísla y consulta.');}}
      const life=[2,4,10][s.upgrades.storage];let spoiled=0;s.eggLots=s.eggLots.filter(l=>{if(s.day-l.day>=life){spoiled+=l.count;return false;}return true;});if(spoiled)log(s,'Se retiraron '+spoiled+' huevos por deterioro según las reglas del juego.');
      if(s.upgrades.storage===0&&s.eggs&&random(s)<.15){const l=s.eggLots[0];if(l){l.count=Math.max(0,l.count-2);log(s,'Plagas dañaron parte de los huevos. El almacén protegido reduce estas pérdidas.');}}syncEggs(s);
      for(const h of s.hens)if(h.count&&h.health<8){h.count--;h.health=Math.max(15,h.health);log(s,'Una gallina no superó el deterioro de salud. Revisa agua, alimento e higiene.');}
      s.hens=s.hens.filter(h=>h.count>0);
      const beforeNest=s.nest;s.nestLots=s.nestLots.filter(l=>s.day-l.day<2);syncNest(s);if(beforeNest-s.nest>1e-7)log(s,'Se retiraron huevos del nido por antigüedad. Recogerlos no renueva su fecha de puesta.');
      if(s.nest>s.capacity*3){removeNest(s,s.nest-s.capacity*3);log(s,'Se perdieron huevos por no recogerlos.');}
    }
  }
  function advance(s,now=Date.now()){
    prepareNest(s);if(!Number.isFinite(now)||now<=s.last)return s;if(s.paused||isBankrupt(s)){s.last=now;return s;}
    const elapsed=(now-s.last)*3;const whole=Math.floor(elapsed/HOUR);const hours=Math.min(whole,72);
    if(whole>72){s.missed+=whole-72;log(s,'Ausencia larga: solo se simulan los últimos tres días de juego.');s.last=now-(elapsed%HOUR)/3;}
    else s.last+=hours*HOUR/3;
    for(let i=0;i<hours;i++){step(s);if(isBankrupt(s)){log(s,'Quiebra: no quedan aves, dinero ni huevos con valor de venta.');break;}}return s;
  }
  function action(s,type,value){
    if(isBankrupt(s))return 'Partida terminada por quiebra: no quedan aves, dinero ni huevos con valor de venta. Puedes reiniciar.';
    const cropResult=cropAction(s,type,value);if(cropResult!==null)return cropResult;
    if(type==='pause'){s.paused=!s.paused;s.last=Date.now();return s.paused?'Granja pausada: no transcurre tiempo ni hay pérdidas durante la ausencia.':'Granja activa: vuelve el reloj ×3.';}
    if(type==='closeDoor'){s.doorClosed=true;return 'Puerta cerrada: la próxima visita queda fuera. No necesitas contratar un guardián para rechazarla.';}
    if(type==='collect'){prepareNest(s);const n=Math.min(Math.floor(s.nest+1e-9),Math.max(0,eggCapacity(s)-s.eggs));if(!n)return 'No hay huevos enteros o el almacén está lleno.';collectNest(s,n);return 'Has recogido '+n+' huevos.';}
    if(type==='sellEggs'){if(!s.eggs)return 'No tienes huevos recogidos.';const n=s.eggs*s.eggPrice;s.money+=n;s.income+=n;s.eggLots=[];s.eggs=0;return 'Venta de huevos: '+n.toFixed(2)+' € de juego.';}
    if(type==='feed'){const young=value==='young',key=young?'youngFeed':'feed';if(!spend(s,10*prices[key]))return 'Saldo insuficiente.';s[key]+=10;return young?'Compraste 10 kg de pienso para jóvenes.':'Compraste 10 kg de pienso de ponedoras.';}
    if(type==='install'){if(!['feeder','waterer'].includes(value))return 'Equipo desconocido.';if(s.facilities[value]>=8)return 'Máximo ocho equipos de cada tipo.';if(!spend(s,prices[value]))return 'Saldo insuficiente.';s.facilities[value]++;return value==='feeder'?'Comedero añadido: seis aves más pueden acceder al pienso. Colócalo en el corral.':'Bebedero añadido: seis aves más pueden acceder al agua. Colócalo en el corral.';}
    if(type==='calcium'){if(!spend(s,prices.calcium))return 'Saldo insuficiente.';s.calcium+=1;return 'Compraste 1 kg de reserva de calcio. Los consumos son reglas ficticias del juego, no dosis reales.';}
    if(type==='water'){if(!spend(s,20*prices.water))return 'Saldo insuficiente.';s.water+=20;return 'Repusiste 20 litros de agua.';}
    if(type==='clean'){if(s.hygiene>99)return 'La cama ya está limpia.';if(!spend(s,prices.clean))return 'Saldo insuficiente.';s.hygiene=100;return 'Cama cambiada e instalación limpia.';}
    if(type==='care'){if(!s.hens.some(h=>h.health<99))return 'El lote no necesita recuperación.';if(!spend(s,prices.care))return 'Saldo insuficiente.';s.hens.forEach(h=>h.health=clamp(h.health+30,0,100));return 'Atención al lote: mejora su recuperación. No sustituye agua y comida.';}
    if(type==='buyHen'){const b=breeds[value];if(!b)return 'Raza desconocida.';if(count(s)>=s.capacity)return 'Amplía el gallinero antes de comprar más aves.';if(!spend(s,b.price))return 'Saldo insuficiente.';s.hens.push({breed:value,count:1,age:lifecycle.purchaseAge,health:100,quarantine:3,isolated:false});return 'Compraste una pollita '+b.name+' próxima a la puesta. Tres días de observación separados en el juego.';}
    if(type==='isolate'){const h=s.hens[Number(value)];if(!h)return 'Lote no disponible.';h.isolated=!h.isolated;return h.isolated?'Lote separado para observación. Revisa cuidados y consulta.':'Lote reunido. Comprueba antes su recuperación.';}
    if(type==='repair'){const n=s.defenders.filter(d=>d.health<100).length;if(!n)return 'Tus defensores están en buen estado.';if(!spend(s,n*5))return 'Saldo insuficiente.';s.defenders.forEach(d=>d.health=100);return 'Defensores recuperados. Coste: 5 € por defensor.';}
    if(type==='sellHen'){const i=Number(value),h=s.hens[i];if(!Number.isInteger(i)||!h||!h.count)return 'Lote no disponible.';const n=henSaleValue(h);h.count--;s.hens=s.hens.filter(h=>h.count);s.money+=n;s.income+=n;return 'Vendiste una gallina por '+n.toFixed(2)+' € de juego.';}
    if(type==='expand'){if(s.capacity>=40)return 'Capacidad máxima de esta versión: 40 aves.';if(!spend(s,prices.expand))return 'Saldo insuficiente.';s.capacity+=10;return 'Gallinero ampliado en diez plazas.';}
    if(type==='upgrade'){
      if(value==='fence'){if(s.upgrades.fence===3)return 'La malla ya está al máximo.';if(!spend(s,prices.fence[s.upgrades.fence]))return 'Saldo insuficiente.';s.upgrades.fence++;return 'Malla reforzada al nivel '+s.upgrades.fence+'.';}
      if(['scarecrow','dog','guard'].includes(value)){if(s.defenders.length>=9)return 'Máximo nueve defensores.';if(!spend(s,prices[value]))return 'Saldo insuficiente.';s.defenders.push({type:value,health:100});return 'Defensor añadido: puedes combinar varios. Su efecto depende de la resistencia.';}
      if(value==='storage'){if(s.upgrades.storage===2)return 'Almacén al máximo.';if(!spend(s,prices.storage[s.upgrades.storage]))return 'Saldo insuficiente.';s.upgrades.storage++;return 'Almacenamiento mejorado. Protección de plagas y conservación térmica son efectos distintos.';}
      if(value==='footbath'){if(!spend(s,prices.footbath))return 'Saldo insuficiente.';s.upgrades.footbath=1;return 'Pediluvio mantenido: efecto de juego durante tres días simulados.';}
      if(!['roof','access'].includes(value))return 'Mejora desconocida.';
      if(s.upgrades[value])return 'Ya tienes esa protección.';if(!spend(s,prices[value]))return 'Saldo insuficiente.';s.upgrades[value]=true;return 'Protección adquirida. Reduce el riesgo, pero no lo elimina.';
    }
    return 'Acción desconocida.';
  }
  function restore(raw,now=Date.now()){
    try{const s=JSON.parse(raw);if(s.version!==1||!Array.isArray(s.hens)||s.hens.length>80||!s.upgrades||!Array.isArray(s.log))return fresh(now);
      for(const k of ['last','hour','day','money','feed','water','hygiene','eggs','nest','capacity','income','expenses','seed','missed','eggPrice'])if(!Number.isFinite(s[k])||s[k]<0)return fresh(now);
      if(!Array.isArray(s.defenders)||s.defenders.length>9||s.defenders.some(d=>!['dog','guard','scarecrow'].includes(d.type)||!Number.isFinite(d.health)||d.health<0||d.health>100)||!Array.isArray(s.eggLots)||s.eggLots.some(l=>!Number.isInteger(l.count)||l.count<0||!Number.isFinite(l.day)||l.day<0||l.day>s.day)||![0,1,2].includes(s.upgrades.storage)||!Number.isFinite(s.upgrades.footbath)||typeof s.paused!=='boolean')return fresh(now);
      if(s.pending&&!['ground','air'].includes(s.pending.type))return fresh(now);
      if(s.capacity>40||s.hygiene>100||s.upgrades.fence<0||s.upgrades.fence>3||!Number.isInteger(s.upgrades.fence)||s.hens.some(h=>!breeds[h.breed]||!Number.isInteger(h.count)||h.count<1||!Number.isFinite(h.age)||h.age<0||!Number.isFinite(h.health)||h.health<0||h.health>100)||count(s)>s.capacity)return fresh(now);
      if(s.facilities===undefined)s.facilities={feeder:1,waterer:1};
      if(!s.facilities||!['feeder','waterer'].every(k=>Number.isInteger(s.facilities[k])&&s.facilities[k]>=0&&s.facilities[k]<=8))return fresh(now);
      if(s.youngFeed===undefined){const total=count(s),share=total?s.hens.filter(needsYoungFeed).reduce((n,h)=>n+h.count,0)/total:0;s.youngFeed=s.feed*share;s.feed-=s.youngFeed;}
      if(s.calcium===undefined)s.calcium=1;
      if(!Number.isFinite(s.youngFeed)||s.youngFeed<0||!Number.isFinite(s.calcium)||s.calcium<0)return fresh(now);
      if(s.sceneLayout!==undefined)s.sceneLayout=Object.fromEntries(Object.entries(s.sceneLayout&&typeof s.sceneLayout==='object'?s.sceneLayout:{}).filter(([k,v])=>/^(feeder-[0-7]|waterer-[0-7]|nest|footbath|clean)$/.test(k)&&v&&Number.isFinite(v.x)&&Number.isFinite(v.y)).slice(0,19).map(([k,v])=>[k,{x:clamp(v.x,14,86),y:clamp(v.y,24,82)}]));
      if(!Object.hasOwn(difficulties,s.difficulty))s.difficulty='normal';
      if(s.nestLots!==undefined&&(!Array.isArray(s.nestLots)||s.nestLots.some(l=>!Number.isFinite(l.count)||l.count<=0||!Number.isFinite(l.day)||l.day<0||l.day>s.day)))return fresh(now);
      s.crops=restoreCrops(s.crops,s.hour);
      prepareNest(s);syncEggs(s);s.log=s.log.filter(t=>typeof t==='string').slice(0,12);if(s.last>now)s.last=now;return s;
    }catch(_){return fresh(now);}
  }
  const api={DAY,HOUR,breeds,prices,cropRules,cropStatus,difficulties,lifecycle,ageFactor,lifeStage,needsYoungFeed,retired,productionStatus,equipmentAccess,isBankrupt,henSaleValue,farmValue,fresh,advance,action,restore,count,threats,eggCapacity};if(typeof module==='object'&&module.exports)module.exports=api;else root.GranjaMotor=api;
})(typeof globalThis==='object'?globalThis:this);

