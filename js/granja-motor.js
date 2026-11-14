(function(root){
  'use strict';
  const DAY=86400000, HOUR=DAY/24;
  const breeds={brown:{name:'Ponedoras marrones',price:18,lay:.85,feed:.12,resilience:.9},leghorn:{name:'Leghorn',price:20,lay:.9,feed:.11,resilience:.85},sussex:{name:'Sussex',price:24,lay:.65,feed:.14,resilience:1.1}};
  const prices={egg:.25,feed:.48,water:.02,clean:2,care:8,fence:[35,80,150],roof:95,scarecrow:18,dog:90,guard:150,expand:75,storage:[45,110],access:25,footbath:12};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  // Edades y curva ficticias para el juego; no son una garantía biológica.
  const difficulties={facil:300,normal:180,dificil:80};
  const lifecycle={purchaseAge:145,start:150,peak:210,decline:450,end:1650};
  function ageFactor(age){if(age<lifecycle.start||age>=lifecycle.end)return 0;if(age<lifecycle.peak)return (age-lifecycle.start)/(lifecycle.peak-lifecycle.start);if(age<lifecycle.decline)return 1;return (lifecycle.end-age)/(lifecycle.end-lifecycle.decline);}
  function lifeStage(h){return h.age<lifecycle.peak?'joven':h.age<lifecycle.decline?'adulta':'vieja';}
  function retired(h){return h.age>=lifecycle.end;}
  function productionStatus(s,h){
    const factor=ageFactor(h.age),eggsPerDay=h.count*breeds[h.breed].lay*factor*h.health/100*(h.isolated?.65:1);
    if(retired(h))return {reason:'age',message:'Fin de puesta por edad: puedes vender este lote o conservarlo; seguirá necesitando alimento y agua.',eggsPerDay:0};
    if(h.age<lifecycle.start)return {reason:'young',message:'Pollitas próximas al inicio de puesta.',eggsPerDay:0};
    if(s.water<=0)return {reason:'water',message:'Puesta detenida por falta de agua; no es fin de puesta por edad.',eggsPerDay:0};
    if(s.feed<=0)return {reason:'feed',message:'Puesta detenida por falta de alimento; no es fin de puesta por edad.',eggsPerDay:0};
    if(h.health<99)return {reason:'health',message:'Puesta reducida por salud; puede recuperarse con los cuidados.',eggsPerDay};
    return {reason:'laying',message:lifeStage(h)==='vieja'?'Puesta descendente por edad.':lifeStage(h)==='joven'?'La puesta está aumentando.':'Etapa adulta de buena producción.',eggsPerDay};
  }
  // Sin aves, el final automático llega cuando caja y huevos vendibles valen cero.
  // Un saldo insuficiente para recomprar se avisa sin forzar el final.
  function isBankrupt(s){return count(s)===0&&farmValue(s).total<=1e-8;}
  function henSaleValue(h){return breeds[h.breed].price*.45*clamp(1-(h.age-180)/1200,.15,1)*h.health/100;}
  function farmValue(s){const birds=s.hens.reduce((sum,h)=>sum+h.count*henSaleValue(h),0),eggs=(s.eggs+Math.floor(s.nest))*s.eggPrice;return {cash:s.money,birds,eggs,total:s.money+birds+eggs};}
  function fresh(now=Date.now(),difficulty='normal'){if(!Object.hasOwn(difficulties,difficulty))difficulty='normal';return {version:1,difficulty,last:now,hour:0,day:0,money:difficulties[difficulty],feed:12,water:25,hygiene:95,eggs:0,eggLots:[],eggPrice:.25,nest:0,nestLots:[],capacity:10,hens:[{breed:'brown',count:4,age:lifecycle.purchaseAge,health:100,quarantine:0,isolated:false}],upgrades:{fence:0,roof:false,storage:0,access:false,footbath:0},defenders:[],pending:null,visitorPending:false,doorClosed:false,paused:false,income:0,expenses:0,seed:104729,log:['Empiezas con cuatro pollitas próximas a la puesta y '+difficulties[difficulty]+' € de juego.'],missed:0};}
  function log(s,t){s.log.unshift('Día '+s.day+': '+t);s.log=s.log.slice(0,12);}
  function count(s){return s.hens.reduce((n,h)=>n+h.count,0);}
  function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
  function spend(s,n){if(!Number.isFinite(n)||n<0||s.money+1e-8<n)return false;s.money-=n;s.expenses+=n;return true;}
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
    const needed=s.hens.reduce((n,h)=>n+breeds[h.breed].feed*h.count/24,0),water=count(s)*.24/24;
    const fed=needed===0?1:Math.min(1,s.feed/needed),watered=water===0?1:Math.min(1,s.water/water);
    s.feed=Math.max(0,s.feed-needed);s.water=Math.max(0,s.water-water);
    for(const h of s.hens){
      const wasRetired=retired(h);
      h.age+=1/24;h.quarantine=Math.max(0,(h.quarantine||0)-1/24);
      const deficit=(1-fed)*2+(1-watered)*3+(s.hygiene<45?(45-s.hygiene)/100:0);
      h.health=clamp(h.health+(deficit? -deficit/breeds[h.breed].resilience:.12),0,100);
      if(!wasRetired&&retired(h))log(s,breeds[h.breed].name+': fin de puesta por edad. Puedes vender el lote o conservarlo con sus cuidados.');
      addNest(s,h.count*breeds[h.breed].lay*ageFactor(h.age)*(h.health/100)*Math.min(fed,watered)*(h.isolated?.65:1)/24);
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
    if(type==='pause'){s.paused=!s.paused;s.last=Date.now();return s.paused?'Granja pausada: no transcurre tiempo ni hay pérdidas durante la ausencia.':'Granja activa: vuelve el reloj ×3.';}
    if(type==='closeDoor'){s.doorClosed=true;return 'Puerta cerrada: la próxima visita queda fuera. No necesitas contratar un guardián para rechazarla.';}
    if(type==='collect'){prepareNest(s);const n=Math.min(Math.floor(s.nest+1e-9),Math.max(0,eggCapacity(s)-s.eggs));if(!n)return 'No hay huevos enteros o el almacén está lleno.';collectNest(s,n);return 'Has recogido '+n+' huevos.';}
    if(type==='sellEggs'){if(!s.eggs)return 'No tienes huevos recogidos.';const n=s.eggs*s.eggPrice;s.money+=n;s.income+=n;s.eggLots=[];s.eggs=0;return 'Venta de huevos: '+n.toFixed(2)+' € de juego.';}
    if(type==='feed'||type==='water'){const amount=type==='feed'?10:20;if(!spend(s,amount*prices[type]))return 'Saldo insuficiente.';s[type]+=amount;return type==='feed'?'Compraste 10 kg de alimento.':'Repusiste 20 litros de agua.';}
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
      if(!Object.hasOwn(difficulties,s.difficulty))s.difficulty='normal';
      if(s.nestLots!==undefined&&(!Array.isArray(s.nestLots)||s.nestLots.some(l=>!Number.isFinite(l.count)||l.count<=0||!Number.isFinite(l.day)||l.day<0||l.day>s.day)))return fresh(now);
      prepareNest(s);syncEggs(s);s.log=s.log.filter(t=>typeof t==='string').slice(0,12);if(s.last>now)s.last=now;return s;
    }catch(_){return fresh(now);}
  }
  const api={DAY,HOUR,breeds,prices,difficulties,lifecycle,ageFactor,lifeStage,retired,productionStatus,isBankrupt,henSaleValue,farmValue,fresh,advance,action,restore,count,threats,eggCapacity};if(typeof module==='object'&&module.exports)module.exports=api;else root.GranjaMotor=api;
})(typeof globalThis==='object'?globalThis:this);

