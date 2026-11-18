/* Gestión de Gallinas · Granja Rentable. Datos en localStorage. */
const KEY="gr_gallinas_v1";
let DB=null, editId=null;
const $=id=>document.getElementById(id);
const hoyISO=()=>new Date().toISOString().slice(0,10);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function vacia(){return {aves:[],lineas:[{nombre:"Línea 1",color:"#d32f2f"}],puestas:[],pienso:[],movs:[],vacunas:[],notasArbol:[]};}
function cargar(){try{DB=JSON.parse(localStorage.getItem(KEY))||"null";}catch(e){DB=null;}if(!DB||!DB.aves)DB=vacia();}
function guardar(){localStorage.setItem(KEY,JSON.stringify(DB));}

/* ---------- utilidades ---------- */
const ave=id=>DB.aves.find(a=>a.id===id);
const razaDe=n=>RAZAS.find(r=>r[0]===n);
const linDe=n=>DB.lineas.find(l=>l.nombre===n);
function edad(a){if(!a.fnac)return {t:"—",sem:0};const d=(Date.now()-new Date(a.fnac+"T12:00").getTime())/864e5;const sem=d/7;
  let et=d<140?"pollita":(d<=365?"ponedora joven":"adulta");return {t:et+" · "+(sem<8?Math.floor(d)+" días":Math.floor(sem)+" sem"),sem,dias:d};}
function huevosAve(id,ini,fin){return DB.puestas.filter(p=>p.ave===id&&(!ini||p.f>=ini)&&(!fin||p.f<=fin)).reduce((s,p)=>s+(+p.n||0),0);}
function huevosTotal(ini,fin){return DB.puestas.filter(p=>(!ini||p.f>=ini)&&(!fin||p.f<=fin)).reduce((s,p)=>s+(+p.n||0),0);}
function mesISO(){return hoyISO().slice(0,7);} function ano(){return hoyISO().slice(0,4);}
function mediaRaza(n){const r=razaDe(n);return r?+r[1]:200;}
function tieneEnfermedad(a){return (a.notas||[]).some(n=>/enferm|virus|moquillo|coccidi|parás|parasi|resfri|viruela|newcastle|marek/i.test(n.t||""));}
function fotoHTML(a,cls){return a.foto?'<img class="'+(cls||"foto")+'" src="'+a.foto+'">':"";}

/* ---------- pestañas ---------- */
document.querySelectorAll("nav#tabs button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav#tabs button").forEach(x=>x.classList.remove("act"));document.querySelectorAll(".sec").forEach(x=>x.classList.remove("act"));b.classList.add("act");$("s-"+b.dataset.s).classList.add("act");window.scrollTo(0,0);});

/* ---------- aves ---------- */
function rellenarSelects(){
  $("f-raza").innerHTML=RAZAS.map(r=>'<option>'+esc(r[0])+"</option>").join("");
  const L=DB.lineas.map(l=>'<option>'+esc(l.nombre)+"</option>").join("");
  $("f-linea").innerHTML=L;
  const G=DB.aves.filter(a=>a.sexo==="gallo").map(a=>'<option value="'+a.id+'">Nº '+esc(a.numero)+"</option>").join("");
  const H=DB.aves.filter(a=>a.sexo==="gallina").map(a=>'<option value="'+a.id+'">Nº '+esc(a.numero)+"</option>").join("");
  $("f-padre").innerHTML='<option value="">— No sé / no está —</option>'+G;
  $("f-madre").innerHTML='<option value="">— No sé / no está —</option>'+H;
  $("a-padre").innerHTML='<option value="">—</option>'+G; $("a-madre").innerHTML='<option value="">—</option>'+H;
  const T=DB.aves.map(a=>'<option value="'+a.id+'">Nº '+esc(a.numero)+" ("+esc(a.raza)+")</option>").join("");
  $("arb-sel").innerHTML=T||'<option value="">(aún no hay aves)</option>';
  $("c-gallo").innerHTML=G||'<option value="">(no hay gallos)</option>';
  $("c-gallina").innerHTML=H||'<option value="">(no hay gallinas)</option>';
  $("v-ave").innerHTML=T||'<option value="">—</option>';
}
function fotoReducida(file,cb){const img=new Image();const rd=new FileReader();
  rd.onload=e=>{img.onload=()=>{const M=640;let w=img.width,h=img.height;const k=Math.min(1,M/Math.max(w,h));w=Math.round(w*k);h=Math.round(h*k);
    const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);cb(c.toDataURL("image/jpeg",0.7));};img.src=e.target.result;};
  rd.readAsDataURL(file);}
function guardarAve(){
  const num=$("f-num").value.trim();if(!num){alert("Ponle el número, que es su nombre en la app.");return;}
  const fn=(cb)=>{const a=editId?ave(editId):{id:"a"+Date.now(),notas:[]};
    Object.assign(a,{numero:num,sexo:$("f-sexo").value,raza:$("f-raza").value,linea:$("f-linea").value,
      anilla:$("f-anilla").value.trim(),fnac:$("f-fnac").value,padre:$("f-padre").value||null,madre:$("f-madre").value||null});
    if(cb)cb(a);
    const nt=$("f-nota").value.trim();if(nt){a.notas=a.notas||[];a.notas.push({f:hoyISO(),t:nt});}
    if(!editId)DB.aves.push(a);guardar();editId=null;limpiarFormAve();refrescar();
    alert("Ave Nº "+num+" guardada.");};
  const f=$("f-foto").files[0];
  if(f)fotoReducida(f,url=>fn(a=>{a.foto=url;}));else fn(null);
}
function limpiarFormAve(){$("f-num").value="";$("f-anilla").value="";$("f-fnac").value="";$("f-nota").value="";$("f-foto").value="";$("tFormAve").textContent="Añadir ave nueva";$("btnCancAve").style.display="none";}
function cancelarEdAve(){editId=null;limpiarFormAve();}
function editarAve(id){const a=ave(id);if(!a)return;editId=id;$("f-num").value=a.numero;$("f-sexo").value=a.sexo;$("f-raza").value=a.raza;$("f-linea").value=a.linea||"";$("f-anilla").value=a.anilla||"";$("f-fnac").value=a.fnac||"";$("f-padre").value=a.padre||"";$("f-madre").value=a.madre||"";$("f-nota").value="";$("tFormAve").textContent="Editar ave Nº "+a.numero;$("btnCancAve").style.display="";window.scrollTo(0,document.querySelector("#tFormAve").offsetTop-60);}
function borrarAve(id){const a=ave(id);if(!a)return;if(!confirm("¿Borrar el ave Nº "+a.numero+" y sus huevos apuntados?"))return;
  DB.aves=DB.aves.filter(x=>x.id!==id);DB.puestas=DB.puestas.filter(p=>p.ave!==id);
  DB.aves.forEach(x=>{if(x.padre===id)x.padre=null;if(x.madre===id)x.madre=null;});guardar();refrescar();}
function fichaHTML(a,conBotones){
  const e=edad(a),L=linDe(a.linea),col=L?L.color:"#999",r=razaDe(a.raza);
  const m=huevosAve(a.id,ano()+"-01-01",null),ms=huevosAve(a.id,mesISO()+"-01",null);
  let h='<div class="ficha"><span class="num">Nº '+esc(a.numero)+"</span> ";
  h+='<span class="anilla" style="background:'+col+'" title="Color de anilla: '+esc(a.linea||"")+'">◍</span> ';
  h+='<span class="dot" style="background:'+col+'"></span> <b>'+esc(a.linea||"")+'</b> · anilla '+esc(a.anilla||"—");
  h+=" · "+(a.sexo==="gallo"?"🐓 gallo":"🐔 gallina")+" · "+esc(a.raza)+" · "+e.t+"<br>";
  if(r)h+='<span style="font-size:13px;color:var(--gris)">Raza: '+r[1]+' huevos/año · pico de puesta: semana '+r[3]+"</span><br>";
  h+=fotoHTML(a);
  if(a.padre||a.madre)h+="<div>Padre: <b>"+(a.padre&&ave(a.padre)?"Nº "+esc(ave(a.padre).numero):"—")+"</b> · Madre: <b>"+(a.madre&&ave(a.madre)?"Nº "+esc(ave(a.madre).numero):"—")+"</b></div>";
  if(a.sexo==="gallina")h+="<div>🥚 Este mes: <b>"+ms+"</b> · Este año: <b>"+m+"</b></div>";
  (a.notas||[]).forEach((n,i)=>{h+='<div class="aviso">📝 '+esc(n.f||"")+" — "+esc(n.t)+' <button class="btn peq dan" onclick="borrarNotaAve(\''+a.id+"',"+i+')\">quitar</button></div>';});
  if(conBotones)h+='<button class="btn peq sec" onclick="editarAve(\''+a.id+'\')">Editar</button> <button class="btn peq sec" onclick="addNotaAve(\''+a.id+'\')">+ nota</button> <button class="btn peq dan" onclick="borrarAve(\''+a.id+'\')">Borrar</button>';
  return h+"</div>";
}
function listarAves(){$("listaAves").innerHTML=DB.aves.length?DB.aves.slice().sort((a,b)=>+a.numero-+b.numero).map(a=>fichaHTML(a,true)).join(""):'<div class="card">Aún no hay aves. Añade la primera abajo 👇</div>';}
function addNotaAve(id){const t=prompt("Nota para el ave Nº "+ave(id).numero+" (ej: enfermedad y fecha, carácter…):");if(!t)return;ave(id).notas=ave(id).notas||[];ave(id).notas.push({f:hoyISO(),t});guardar();refrescar();}
function borrarNotaAve(id,i){ave(id).notas.splice(i,1);guardar();refrescar();}
function guardarLinea(){const n=$("n-linea").value.trim();if(!n){alert("Ponle un nombre a la línea.");return;}
  if(linDe(n)){alert("Esa línea ya existe.");return;}DB.lineas.push({nombre:n,color:$("n-color").value});$("n-linea").value="";guardar();refrescar();}
function borrarLinea(n){if(DB.aves.some(a=>a.linea===n)){alert("Hay aves con esa línea, no se puede borrar.");return;}DB.lineas=DB.lineas.filter(l=>l.nombre!==n);guardar();refrescar();}
function listarLineas(){$("listaLineas").innerHTML=DB.lineas.map(l=>'<div class="aviso"><span class="dot" style="background:'+l.color+'"></span> <b>'+esc(l.nombre)+"</b> · "+DB.aves.filter(a=>a.linea===l.nombre).length+' aves <button class="btn peq dan" onclick="borrarLinea(\''+esc(l.nombre)+'\')">quitar</button></div>').join("")||"(sin líneas)";}

/* ---------- copia ---------- */
function descargarCopia(){const b=new Blob([JSON.stringify(DB,null,1)],{type:"application/json"});const u=URL.createObjectURL(b);
  const l=document.createElement("a");l.href=u;l.download="gallinas-copia-"+hoyISO()+".json";l.click();URL.revokeObjectURL(u);}
$("imp").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{const d=JSON.parse(r.result);if(!d.aves)throw 0;DB=d;guardar();refrescar();alert("Copia recuperada: "+d.aves.length+" aves.");}catch(_){alert("Ese archivo no es una copia válida.");}};r.readAsText(f);});

/* ---------- puesta ---------- */
function puestaUI(){$("hoy").textContent=hoyISO().split("-").reverse().join("/");
  const gs=DB.aves.filter(a=>a.sexo==="gallina");
  $("puestaHoy").innerHTML=gs.length?gs.map(a=>{const ex=(DB.puestas.find(p=>p.ave===a.id&&p.f===hoyISO())||{}).n||"";
    return '<label>Nº '+esc(a.numero)+" ("+esc(a.raza)+')</label><input type="number" min="0" max="3" data-ave="'+a.id+'" value="'+ex+'" placeholder="0">';}).join(""):"(primero añade gallinas en 🐔 Aves)";}
function guardarPuesta(){document.querySelectorAll("#puestaHoy input").forEach(i=>{const v=i.value===""?null:+i.value;
    DB.puestas=DB.puestas.filter(p=>!(p.ave===i.dataset.ave&&p.f===hoyISO()));
    if(v!==null&&v>=0)DB.puestas.push({ave:i.dataset.ave,f:hoyISO(),n:v});});
  guardar();refrescar();alert("Huevos de hoy guardados.");}
function puestaStats(){
  const iniM=mesISO()+"-01",iniA=ano()+"-01-01";
  $("kpiGranja").innerHTML="<div><b>"+huevosTotal(hoyISO(),hoyISO())+"</b>hoy</div><div><b>"+huevosTotal(iniM,null)+"</b>este mes</div><div><b>"+huevosTotal(iniA,null)+"</b>este año</div><div><b>"+DB.aves.filter(a=>a.sexo==="gallina").length+"</b>gallinas</div>";
  const gs=DB.aves.filter(a=>a.sexo==="gallina");
  $("tablaPuesta").innerHTML=gs.length?"<table><tr><th>Gallina</th><th>Mes</th><th>Año</th><th>Raza: huevos/año</th></tr>"+gs.map(a=>"<tr><td><b>Nº "+esc(a.numero)+"</b></td><td>"+huevosAve(a.id,iniM,null)+"</td><td>"+huevosAve(a.id,iniA,null)+"</td><td>"+esc(a.raza)+"</td></tr>").join("")+"</table>":"(sin gallinas)";
  const porEt={};gs.forEach(a=>{const e=edad(a).sem<20?"pollita":(edad(a).dias<=365?"ponedora joven":"adulta");(porEt[e]=porEt[e]||[]).push({a,h:huevosAve(a.id,iniM,null)});});
  $("rankEtapas").innerHTML=Object.keys(porEt).length?Object.keys(porEt).map(e=>{const l=porEt[e].sort((x,y)=>y.h-x.h).slice(0,3);
    return "<b>"+e+":</b> "+l.map((x,i)=>["🥇","🥈","🥉"][i]+" Nº "+esc(x.a.numero)+" ("+x.h+")").join(" · ");}).join("<br>"):"(apunta huevos para ver el ranking)";
  const porR={};gs.forEach(a=>{(porR[a.raza]=porR[a.raza]||[]).push({a,h:huevosAve(a.id,iniA,null)});});
  $("rankRazas").innerHTML=Object.keys(porR).length?Object.keys(porR).map(r=>{const l=porR[r].sort((x,y)=>y.h-x.h).slice(0,3);
    return "<b>"+esc(r)+":</b> "+l.map((x,i)=>["🥇","🥈","🥉"][i]+" Nº "+esc(x.a.numero)+" ("+x.h+" huevos este año)").join(" · ");}).join("<br>"):"(sin datos)";
  $("vsRaza").innerHTML=gs.length?gs.map(a=>{const esp=Math.round(mediaRaza(a.raza)/12),real=huevosAve(a.id,iniM,null),d=real-esp;
    const pc=esp?Math.round(real/esp*100):0;
    return '<div>Nº '+esc(a.numero)+" ("+esc(a.raza)+"): este mes <b>"+real+"</b> · media de su raza este mes: "+esp+" → "+(d>=0?'<b style="color:var(--v)">▲ por encima (+'+d+", "+pc+'%)</b>':'<b style="color:var(--rojo)">▼ por debajo ('+d+", "+pc+"%)</b>")+'<div class="bar"><i style="width:'+Math.min(100,pc)+'"></i></div></div>';}).join(""):"(sin gallinas)";
}

/* ---------- árbol ---------- */
function nodoHTML(id,cls){const a=ave(id);if(!a)return '<span class="nodo">?</span>';
  const L=linDe(a.linea);
  return '<span class="nodo '+(cls||"")+'" onclick="elegirArbol(\''+id+'\')"><span class="n">Nº '+esc(a.numero)+'</span><br><span class="dot" style="background:'+(L?L.color:"#999")+'"></span> '+esc(a.anilla||"s/n")+"<br>"+(a.sexo==="gallo"?"🐓":"🐔")+" "+esc(a.raza)+"</span>";}
function hijosDe(id){return DB.aves.filter(a=>a.padre===id||a.madre===id);}
function elegirArbol(id){$("arb-sel").value=id;verArbol();}
function verArbol(){const id=$("arb-sel").value;if(!id||!ave(id)){$("dibujoArbol").innerHTML="(elige un ave)";$("fichaArbol").innerHTML="";return;}
  const a=ave(id);let h="";
  const ab=(x)=>{if(!x)return "";const p=x.padre?ave(x.padre):null,m=x.madre?ave(x.madre):null;if(!p&&!m)return "";
    return '<div class="gen"><div class="etq">padres</div>'+nodoHTML(x.padre)+nodoHTML(x.madre)+"</div>";};
  const ab2=(x)=>{const ps=[x.padre&&ave(x.padre),x.madre&&ave(x.madre)].filter(Boolean);let s="";
    ps.forEach(p=>{const gp=p.padre?ave(p.padre):null,gm=p.madre?ave(p.madre):null;if(gp||gm)s+='<div class="gen"><div class="etq">abuelos de Nº '+esc(p.numero)+"</div>"+nodoHTML(p.padre)+nodoHTML(p.madre)+"</div>";});return s;};
  h+=ab2(a)+ab(a);
  h+='<div class="gen"><div class="etq">esta ave</div>'+nodoHTML(id,"sel")+"</div>";
  const hj=hijosDe(id);
  if(hj.length){h+='<div class="gen"><div class="etq">hijos</div>'+hj.map(x=>nodoHTML(x.id,"hijo")).join("")+"</div>";
    const ni=[];hj.forEach(x=>hijosDe(x.id).forEach(n=>ni.push(n)));
    if(ni.length)h+='<div class="gen"><div class="etq">nietos</div>'+ni.map(x=>nodoHTML(x.id,"hijo")).join("")+"</div>";}
  else h+='<div class="gen" style="color:var(--gris)">(sin hijos registrados)</div>';
  $("dibujoArbol").innerHTML=h;$("fichaArbol").innerHTML=fichaHTML(a,false);
  $("a-padre").value=a.padre||"";$("a-madre").value=a.madre||"";
  listarNotasArbol();}
function asignarPadres(){const id=$("arb-sel").value;if(!id)return;const a=ave(id);
  a.padre=$("a-padre").value||null;a.madre=$("a-madre").value||null;guardar();verArbol();refrescarSinArbol();alert("Padres guardados.");}
function hijoDe(){const id=$("arb-sel").value;if(!id)return;const a=ave(id);
  const num=prompt("Número del hijo nuevo (será su nombre):");if(!num)return;
  const sexo=confirm("Aceptar = gallina · Cancelar = gallo")?"gallina":"gallo";
  const n={id:"a"+Date.now(),numero:num,sexo,raza:a.raza,linea:a.linea,anilla:"",fnac:hoyISO(),notas:[]};
  if(a.sexo==="gallo")n.padre=id;else n.madre=id;
  DB.aves.push(n);guardar();refrescar();elegirArbol(n.id);alert("Hijo Nº "+num+" añadido al árbol.");}
function listarNotasArbol(){$("notasArbol").innerHTML=(DB.notasArbol||[]).map((n,i)=>'<div class="aviso">📝 '+esc(n.f||"")+" — "+esc(n.t)+' <button class="btn peq dan" onclick="DB.notasArbol.splice('+i+',1);guardar();listarNotasArbol();">quitar</button></div>').join("")||"(sin notas)";}
function addNotaArbol(){const t=$("nuevaNotaArbol").value.trim();if(!t)return;DB.notasArbol=DB.notasArbol||[];DB.notasArbol.push({f:hoyISO(),t});$("nuevaNotaArbol").value="";guardar();listarNotasArbol();}

/* ---------- cría ---------- */
function antepasados(id,gen){const a=ave(id);if(!a)return new Set();const s=new Set();
  [a.padre,a.madre].forEach(p=>{if(p){s.add(p);if(gen>1)antepasados(p,gen-1).forEach(x=>s.add(x));}});return s;}
function parentesco(g1,g2){const A=ave(g1),B=ave(g2);if(!A||!B)return {mal:true,txt:"Elige gallo y gallina."};
  if(g1===g2)return {mal:true,txt:"Es la misma ave."};
  if(A.padre===g2||A.madre===g2||B.padre===g1||B.madre===g1)return {mal:true,txt:"⛔ Uno es padre/madre del otro. NO recomendado: cruce entre padre e hija (o madre e hijo)."};
  const hp=A.padre&&A.padre===B.padre;
  if(hp&&(A.madre&&A.madre===B.madre))return {mal:true,txt:"⛔ Son hermanos (mismo padre y madre). NO recomendado: consanguinidad alta."};
  if((A.padre&&A.padre===B.padre)||(A.madre&&A.madre===B.madre))return {mal:true,txt:"⛔ Son medios hermanos (comparten padre o madre). NO recomendado."};
  const a1=antepasados(g1,2),a2=antepasados(g2,2);const com=[...a1].filter(x=>a2.has(x));
  if(com.length){const n=com.map(x=>{const v=ave(x);return v?"Nº "+v.numero:"?";}).join(", ");
    return {mal:true,txt:"⛔ Tienen abuelos en común ("+esc(n)+"). NO recomendado: son primos o parientes cercanos."};}
  return {mal:false,txt:"✅ Sin parentesco cercano: padres, hermanos ni abuelos en común. Cruce aceptable."};}
function probarCruce(){const r=parentesco($("c-gallo").value,$("c-gallina").value);
  $("resCruce").innerHTML='<div class="'+(r.mal?"peligro":"ok")+'">'+r.txt+"</div>";}
function criaRankings(){
  const ini=new Date();ini.setDate(ini.getDate()-90);const iniS=ini.toISOString().slice(0,10);
  const gs=DB.aves.filter(a=>a.sexo==="gallina").map(a=>{const h=huevosAve(a.id,iniS,null);const esp=mediaRaza(a.raza)*90/365;
    return {a,h,pc:esp?Math.round(h/esp*100):0,enf:tieneEnfermedad(a)};}).sort((x,y)=>y.h-x.h);
  $("topGallinas").innerHTML=gs.length?gs.slice(0,5).map((x,i)=>"<div>"+["🥇","🥈","🥉","4º","5º"][i]+" <b>Nº "+esc(x.a.numero)+"</b> ("+esc(x.a.raza)+"): "+x.h+" huevos en 90 días ("+x.pc+"% de su raza)"+(x.enf?' · ⚠️ con notas de enfermedad (mírala antes de criar)':" · ✅ sana")+"</div>").join(""):"(apunta puesta para verlo)";
  const ms=DB.aves.filter(a=>a.sexo==="gallo").map(g=>{const hem=DB.aves.filter(x=>x.sexo==="gallina"&&(x.linea===g.linea||x.padre===g.id||hijosDe(g.id).some(h=>h.madre===x.id)));
    const hs=hem.map(x=>huevosAve(x.id,iniS,null));const md=hs.length?Math.round(hs.reduce((s,v)=>s+v,0)/hs.length):null;
    return {g,md,n:hem.length};}).sort((x,y)=>(y.md||-1)-(x.md||-1));
  $("topGallos").innerHTML=ms.length?ms.slice(0,5).map((x,i)=>"<div>"+["🥇","🥈","🥉","4º","5º"][i]+" <b>Nº "+esc(x.g.numero)+"</b> (línea "+esc(x.g.linea||"—")+"): "+(x.md===null?"sin datos aún de su línea":"media de su línea "+x.md+" huevos/90 días en "+x.n+" gallinas")+"</div>").join(""):"(aún no hay gallos)";
}

/* ---------- gestión ---------- */
function guardarPienso(){const kg=+$("p-kg").value,cu=+$("p-coste").value;if(!kg&&!cu){alert("Pon kilos o coste.");return;}
  DB.pienso.push({f:$("p-fecha").value||hoyISO(),kg:kg||0,c:cu||0,n:$("p-nota").value.trim()});$("p-kg").value="";$("p-coste").value="";$("p-nota").value="";guardar();refrescar();alert("Pienso guardado.");}
function guardarMov(){const e=+$("m-eur").value;if(!e){alert("Pon los euros.");return;}
  DB.movs.push({t:$("m-tipo").value,f:$("m-fecha").value||hoyISO(),e,c:$("m-con").value.trim(),n:$("m-nota").value.trim()});
  $("m-eur").value="";$("m-con").value="";$("m-nota").value="";guardar();refrescar();alert("Apunte guardado.");}
function borrarMov(i){DB.movs.splice(i,1);guardar();refrescar();}
function borrarPienso(i){DB.pienso.splice(i,1);guardar();refrescar();}
function gestionStats(){
  const gp=DB.pienso.reduce((s,p)=>s+(+p.c||0),0),kg=DB.pienso.reduce((s,p)=>s+(+p.kg||0),0);
  const gg=DB.movs.filter(m=>m.t==="gasto").reduce((s,m)=>s+(+m.e||0),0);
  const gi=DB.movs.filter(m=>m.t==="ingreso").reduce((s,m)=>s+(+m.e||0),0);
  const tot=gp+gg,hue=huevosTotal(null,null),bal=gi-tot;
  $("kpiGest").innerHTML="<div><b>"+gp.toFixed(2)+" €</b>pienso ("+kg+" kg)</div><div><b>"+gg.toFixed(2)+" €</b>otros gastos</div><div><b>"+gi.toFixed(2)+" €</b>ingresos</div><div><b>"+bal.toFixed(2)+" €</b>balance</div>";
  $("kpiCoste").innerHTML="<div><b>"+(hue?(tot/hue).toFixed(2)+" €":"—")+"</b>coste por huevo</div><div><b>"+hue+"</b>huevos totales</div><div><b>"+tot.toFixed(2)+" €</b>gasto total</div>";
  $("txtCoste").innerHTML=bal>=0?'<div class="ok">✅ El gallinero <b>se paga solo</b>: entran '+gi.toFixed(2)+' € y salen '+tot.toFixed(2)+' €.</div>':'<div class="aviso">⚠️ Aún no se paga solo: entran '+gi.toFixed(2)+' € y salen '+tot.toFixed(2)+' €. Faltan '+(-bal).toFixed(2)+' €.</div>';
  const lm=DB.movs.slice().sort((a,b)=>b.f.localeCompare(a.f)).slice(0,20);
  $("listaMov").innerHTML="<h3>Últimos apuntes (con sus notas)</h3>"+(lm.length?"<table><tr><th>Fecha</th><th>Concepto</th><th>€</th><th></th></tr>"+DB.movs.map((m,i)=>({m,i})).sort((a,b)=>b.m.f.localeCompare(a.m.f)).slice(0,20).map(x=>"<tr><td>"+esc(x.m.f)+"</td><td>"+(x.m.t==="gasto"?"🔻":"💚")+" "+esc(x.m.c||"")+(x.m.n?" <i>("+esc(x.m.n)+")</i>":"")+"</td><td>"+(+x.m.e).toFixed(2)+"</td><td><button class='btn peq dan' onclick='borrarMov("+x.i+")'>x</button></td></tr>").join("")+"</table>":"(sin apuntes)")+
   (DB.pienso.length?"<h3>Pienso</h3><table><tr><th>Fecha</th><th>Kg</th><th>€</th><th>Nota</th><th></th></tr>"+DB.pienso.map((p,i)=>({p,i})).sort((a,b)=>b.p.f.localeCompare(a.p.f)).map(x=>"<tr><td>"+esc(x.p.f)+"</td><td>"+x.p.kg+"</td><td>"+(+x.p.c).toFixed(2)+"</td><td>"+esc(x.p.n||"")+"</td><td><button class='btn peq dan' onclick='borrarPienso("+x.i+")'>x</button></td></tr>").join("")+"</table>":"");
}

/* ---------- avisos ---------- */
function guardarVac(){const a=$("v-ave").value;if(!a){alert("Elige el ave.");return;}
  DB.vacunas.push({ave:a,t:$("v-tipo").value,n:$("v-nom").value.trim(),f:$("v-fecha").value||hoyISO(),p:$("v-prox").value||""});guardar();refrescar();alert("Aviso guardado.");}
function borrarVac(i){DB.vacunas.splice(i,1);guardar();refrescar();}
function avisosUI(){
  const H=hoyISO();const prox=new Date();prox.setDate(prox.getDate()+14);const lim=prox.toISOString().slice(0,10);
  let h="";
  DB.vacunas.filter(v=>v.p&&v.p<=lim).sort((a,b)=>a.p.localeCompare(b.p)).forEach(v=>{const a=ave(v.ave);
    h+='<div class="'+(v.p<H?"peligro":"aviso")+'">💉 <b>Nº '+(a?esc(a.numero):"?")+"</b> · "+esc(v.t)+": "+esc(v.n||"")+" → próxima: <b>"+esc(v.p)+"</b>"+(v.p<H?" (¡pasada!)":" (se acerca)")+"</div>";});
  DB.aves.filter(a=>{const e=edad(a);return e.dias>=105&&e.dias<140;}).forEach(a=>{
    h+='<div class="ok">🐣 La pollita <b>Nº '+esc(a.numero)+"</b> ("+esc(a.raza)+") empieza a poner pronto (tiene "+Math.floor(edad(a).sem)+" semanas).</div>";});
  $("listaAvisos").innerHTML='<div class="card"><h3>Lo que toca</h3>'+(h||"Todo en orden. Sin avisos.")+"</div>"+
   '<div class="card"><h3>Vacunas y desparasitaciones apuntadas</h3>'+((DB.vacunas||[]).map((v,i)=>{const a=ave(v.ave);
     return '<div class="aviso">💉 Nº '+(a?esc(a.numero):"?")+" · "+esc(v.t)+" "+esc(v.n||"")+" · hecha: "+esc(v.f)+" · próxima: "+esc(v.p||"—")+' <button class="btn peq dan" onclick="borrarVac('+i+')">quitar</button></div>';}).join("")||"(ninguna)")+"</div>";
}

/* ---------- refresco ---------- */
function refrescarSinArbol(){rellenarSelects();}
function refrescar(){rellenarSelects();listarAves();listarLineas();puestaUI();puestaStats();criaRankings();gestionStats();avisosUI();
  if($("arb-sel").value&&ave($("arb-sel").value))verArbol();else{const p=DB.aves[0];if(p){$("arb-sel").value=p.id;verArbol();}}
  $("p-fecha").value=hoyISO();$("m-fecha").value=hoyISO();}
cargar();$("p-fecha").value=hoyISO();$("m-fecha").value=hoyISO();refrescar();
