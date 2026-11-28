(function () {
"use strict";
const definitions = {
 huevos: [
  ["hembras","Hembras presentes","",1],["huevos","Huevos recogidos","",1],
  ["noAptos","Huevos no aptos","",1],["vendidos","Huevos vendidos","",1],
  ["pienso","Pienso consumido (g)","",1],["muestra","Aves pesadas (muestra del lote)","",1],["peso","Peso medio de la muestra (g)","",0.1]
 ],
 carne: [
  ["bajas","Bajas del día","",1],["salidas","Aves que salen del lote","",1],
  ["muestra","Aves pesadas","",1],["peso","Peso medio de la muestra (g)","",0.1],
  ["pienso","Pienso consumido (g)","",1]
 ]
};
const costItems = [
 ["costeAves","Compra de aves o huevos fértiles"],["costePienso","Pienso y suplementos"],
 ["costeMaterial","Materiales y equipo"],["costeReparacion","Reparaciones y mantenimiento"],
 ["costeCama","Cama y limpieza"],["costeVeterinario","Visitas y pruebas veterinarias"],
 ["costeSanidad","Medicamentos y bioseguridad"],["costeSuministros","Agua, luz y calefacción"],
 ["costeTransporte","Transporte"],["costeTrabajo","Mano de obra"],["costeOtros","Otros gastos"]
];
const extras = [["ingresos","Ingresos del día","",0.01],["gastos","Gastos sin desglosar","",0.01],
 ...costItems.map(([key,label])=>[key,label,"",0.01])];
const currencyOK = s => s === "EUR" || s === "USD";
const money = (n,c) => n == null ? "Sin datos" : currencyOK(c)
 ? new Intl.NumberFormat("es-ES",{style:"currency",currency:c,currencyDisplay:"code"}).format(n)
 : nice(n) + " (sin moneda)";
const birdKey = name => name.trim().toLocaleLowerCase("es").normalize("NFC");
const normalizeFind = s => birdKey(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const birdId = s => typeof s==="string" && /^[a-z0-9-]{8,80}$/.test(s);
const ringCode = s => typeof s==="string" && /^[A-Z0-9][A-Z0-9._-]{0,29}$/.test(s);
const sexes = {unknown:"Sin confirmar",female:"Hembra",male:"Macho"};
const tags = {color:"Color de anilla",code:"Código escrito",qr:"QR"};
const hasOwn = (o,k) => typeof k==="string" && Object.hasOwn(o,k);
const positiveAmount = n => n===null || (typeof n==="number" && Number.isFinite(n) && n>=0 && n<=MAX);
function cleanProfile(b, currency) {
 if(!b || !birdId(b.id) || typeof b.name!=="string" || !b.name.trim() || b.name.trim().length>60 ||
    !hasOwn(sexes,b.sex) || !hasOwn(tags,b.tag) || (b.birth!=="" && !validDate(b.birth)) ||
    typeof b.color!=="string" || b.color.trim().length>35 || (b.tag==="color" && !b.color.trim()) ||
    (b.code!=="" && !ringCode(b.code)) || (b.tag==="code" && !b.code) ||
    !positiveAmount(b.price) || !positiveAmount(b.value) || (!currency && (b.price!==null || b.value!==null)) ||
    typeof b.notes!=="string" || b.notes.length>500) throw Error("Revisa el nombre, la identificación, la fecha de nacimiento o el importe del ave.");
 return {id:b.id,name:b.name.trim(),sex:b.sex,birth:b.birth,tag:b.tag,color:b.color.trim(),code:b.code,price:b.price,value:b.value,notes:b.notes.trim()};
}
const fields = mode => [...definitions[mode], ...extras];
const MAX = 99999999;
const MAX_COPY_BYTES = 4 * 1024 * 1024;
const conflict = "No se guardó: otra pestaña ha cambiado este registro. Tus entradas siguen aquí. Anótalas antes de recargar.";
const nice = n => n == null ? "Sin datos" : n.toLocaleString("es-ES", {maximumFractionDigits:2});
const validDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && s >= "1900-01-01" && s <= "9999-12-31" && !isNaN(Date.parse(s+"T00:00:00Z")) && new Date(s+"T00:00:00Z").toISOString().slice(0,10) === s;
function today(d = new Date()) { return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-"); }
function empty(mode) { return {version:2, mode, active:"", lots:[]}; }
function validate(raw, mode) {
 if (!definitions[mode] || !raw || ![1,2].includes(raw.version) || raw.mode !== mode || !Array.isArray(raw.lots) || raw.lots.length > 200) throw Error("La copia no corresponde a este registro.");
 const ids = new Set(), allBirdIds=new Set();
 const lots = raw.lots.map(lot => {
  if (!lot || typeof lot.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(lot.id) || ids.has(lot.id) ||
      typeof lot.name !== "string" || !lot.name.trim() || lot.name.length > 60 || !validDate(lot.start) ||
      !Array.isArray(lot.rows) || lot.rows.length > 3660) throw Error("Hay un lote con datos no válidos.");
  ids.add(lot.id);
  const currency = lot.currency ?? null;
  if (currency !== null && !currencyOK(currency)) throw Error("Revisa la moneda del lote.");
  if (mode === "carne" && (!Number.isInteger(lot.initial) || lot.initial < 1 || lot.initial > MAX))
   throw Error("Indica cuántas aves había al iniciar el lote.");
  const profiles=lot.profiles===undefined?[]:lot.profiles;
  if(!Array.isArray(profiles) || profiles.length>5000) throw Error("Hay demasiadas fichas de aves en este lote.");
  const profileIds=new Set(), codes=new Set();
  const directory=profiles.map(rawProfile=>{
   const b=cleanProfile(rawProfile,currency);
   if(allBirdIds.has(b.id) || (b.code && codes.has(b.code))) throw Error("El identificador o el código escrito de un ave está repetido en el lote.");
   allBirdIds.add(b.id);profileIds.add(b.id);if(b.code)codes.add(b.code);
   return b;
  });
  const dates = new Set();
  const rows = lot.rows.map(row => {
   if (!row || !validDate(row.date) || row.date < lot.start || dates.has(row.date) ||
       typeof row.notes !== "string" || row.notes.length > 500) throw Error("Revisa las fechas o notas del registro.");
   dates.add(row.date);
   const health = row.health === undefined ? "" : row.health;
   if (typeof health !== "string" || health.length > 500) throw Error("Revisa la incidencia de salud del lote.");
   const birds = row.birds === undefined ? [] : row.birds;
   if (!Array.isArray(birds) || birds.length > 100) throw Error("Puedes anotar hasta 100 aves por fecha.");
   const seen = new Set();
   const individual = birds.map(b => {
    const health=b?.health===undefined?"":b.health;
    if (!b || !profileIds.has(b.id) ||
        typeof health !== "string" || health.length > 300 ||
        (b.weight !== null && (typeof b.weight !== "number" || !Number.isFinite(b.weight) || b.weight < 0.1 || b.weight > MAX)) ||
        (b.weight === null && !health.trim())) throw Error("Para cada ave, indica su nombre o anilla y un peso o una observación de salud.");
    const key = b.id;
    if (seen.has(key)) throw Error("No repitas el nombre o anilla de un ave el mismo día.");
    seen.add(key);
    return {id:b.id,weight:b.weight,health:health.trim()};
   });
   const clean = {date:row.date,notes:row.notes,health:health.trim(),birds:individual};
   for (const [key,label,,step] of fields(mode)) {
    const n = row[key] === undefined && (key.startsWith("coste") || (mode === "huevos" && ["muestra","peso"].includes(key))) ? null : row[key];
    if (n !== null && (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > MAX || (step === 1 && !Number.isInteger(n)))) throw Error("Revisa el dato: " + label + ".");
    clean[key] = n;
   }
   if (mode === "huevos" && clean.noAptos != null && (clean.huevos == null || clean.noAptos > clean.huevos))
    throw Error("Los huevos no aptos no pueden superar los recogidos.");
   if (Boolean(clean.muestra) !== Boolean(clean.peso))
    throw Error("Para registrar un pesaje, indica cuántas aves pesaste y su peso medio.");
   return clean;
  }).sort((a,b)=>a.date.localeCompare(b.date));
  if (mode === "carne") {
   let alive = lot.initial;
   for (const row of rows) {
    if (Math.max(row.muestra || 0,row.birds.filter(b=>b.weight!==null).length) > alive) throw Error("El tamaño de la muestra supera las aves del lote el " + row.date + ".");
    alive -= (row.bajas || 0) + (row.salidas || 0);
    if (alive < 0) throw Error("Las bajas y salidas superan las aves disponibles el " + row.date + ".");
   }
  }
  return {id:lot.id, name:lot.name.trim(), start:lot.start, currency, profiles:directory, ...(mode === "carne" ? {initial:lot.initial} : {}), rows};
 });
 if (raw.active && !ids.has(raw.active)) throw Error("El lote seleccionado no existe en la copia.");
 return {version:2, mode, active:raw.active || (lots[0] && lots[0].id) || "", lots};
}
function summarize(lot,mode) {
 const rows = lot.rows;
 const sum = (key, set = rows) => set.reduce((s,r)=>s+(r[key] || 0),0);
 const has = key => rows.some(r=>r[key] != null);
 const cent = key => rows.reduce((total,r)=>total + Math.round((r[key] || 0)*100),0);
 const costKeys = ["gastos",...costItems.map(([k])=>k)];
 const hasCosts = costKeys.some(has);
 const expenses = costKeys.reduce((acc,k)=>acc+cent(k),0);
 const income = cent("ingresos");
 const pesajes = rows.map(r=>{
  if (r.muestra > 0 && r.peso > 0) return {date:r.date,peso:r.peso,muestra:r.muestra,origin:"muestra manual"};
  const weights=(r.birds || []).map(b=>b.weight).filter(n=>n!==null);
  return weights.length ? {date:r.date,peso:weights.reduce((a,b)=>a+b,0)/weights.length,muestra:weights.length,origin:"pesajes individuales"} : null;
 }).filter(Boolean);
 const last = pesajes.at(-1), prev = pesajes.at(-2);
 const dias = last && prev ? (Date.parse(last.date)-Date.parse(prev.date))/86400000 : 0;
 const stats = {dias:rows.length, pienso:has("pienso") ? sum("pienso") / 1000 : null,
  ingresos:has("ingresos") ? income/100 : null, gastos:hasCosts ? expenses/100 : null,
  saldo:has("ingresos") || hasCosts ? (income-expenses)/100 : null,
  partidas:Object.fromEntries(costKeys.filter(has).map(k=>[k,cent(k)/100])),
  peso:last?.peso ?? null,muestra:last?.muestra ?? null,fechaPeso:last?.date ?? null,
  origenPeso:last?.origin ?? null,cambio:dias>0?(last.peso-prev.peso)/dias:null};
 if (mode === "huevos") {
  const rate = rows.filter(r=>r.hembras > 0 && r.huevos != null);
  const apt = rows.filter(r=>r.huevos != null && r.noAptos != null);
  const feed = apt.filter(r=>r.pienso != null);
  const aptos = set => sum("huevos",set)-sum("noAptos",set);
  return {...stats, huevos:has("huevos")?sum("huevos"):null, aptos:apt.length?aptos(apt):null,
   vendidos:has("vendidos")?sum("vendidos"):null, puesta:rate.length?100*sum("huevos",rate)/sum("hembras",rate):null,
   piensoDocena:aptos(feed)>0 ? 12*sum("pienso",feed)/aptos(feed) : null};
 }
 const bajas = sum("bajas"), salidas = sum("salidas");
 return {...stats, bajas, salidas, vivas:lot.initial-bajas-salidas, mortalidad:100*bajas/lot.initial};
}
function serialize(state) {
 return JSON.stringify(state,(key,value)=>{
  if(value===null && (key==="currency" || key.startsWith("coste") || (state.mode==="huevos" && (key==="peso" || key==="muestra"))))return undefined;
  if(value==="" && key==="health")return undefined;
  if(Array.isArray(value) && value.length===0 && (key==="profiles" || key==="birds"))return undefined;
  return value;
 });
}
function persist(storage, key, snapshot, state) {
 const data = serialize(state);
 if (new TextEncoder().encode(data).length > MAX_COPY_BYTES) throw Error("El registro supera el límite de 4 MB para guardar y recuperar copias.");
 let current;
 try { current = storage.getItem(key); } catch (_) { throw Error("El navegador no permite acceder al registro local."); }
 if (current !== snapshot) throw Error(conflict);
 try { storage.setItem(key,data); } catch (_) { throw Error("El navegador no pudo guardar. No se reemplazaron los registros anteriores."); }
 return data;
}
if (typeof module !== "undefined" && module.exports) module.exports = {empty,validate,summarize,validDate,today,fields,persist,serialize};
if (typeof document === "undefined") return;
const mode = document.body.dataset.registro;
if (!definitions[mode]) return;
const $ = id => document.getElementById(id);
const key = "gr-codornices-v1-"+mode, copy = data => JSON.parse(JSON.stringify(data));
let selectedBird="";
const cards = fields(mode), moneyKeys = new Set(extras.map(([key])=>key)), amounts = new Map();
let state = empty(mode), blocked = false, snapshot = null;
const announce = msg => { $("estado").textContent = msg; };
try {
 snapshot = localStorage.getItem(key);
 if (snapshot !== null) state = validate(JSON.parse(snapshot), mode);
} catch (_) { blocked=true; announce("No se pudieron leer los datos guardados. No se sobrescribirán. Puedes recuperar una copia válida."); }
async function save(next, text, recover=false, expected=snapshot) {
 try {
  if (blocked && !recover) throw Error("Primero recupera una copia válida antes de guardar.");
  next = validate(next,mode);
  const commit = () => {
   snapshot = persist(localStorage,key,expected,next);
   state=next; blocked=false; render(); announce(text); return true;
  };
  const locks = globalThis.navigator?.locks;
  return locks ? await locks.request(key,commit) : commit();
 } catch (err) { announce(err.message); return false; }
}
const lot = () => state.lots.find(l=>l.id===state.active);
const element = (tag,text) => { const e=document.createElement(tag); if (text != null) e.textContent=text; return e; };
for (const [id,label,,step] of cards) {
 const wrap=element("label",label); const i=element("input"); i.name=id; i.type="number"; i.min="0"; i.max=MAX; i.step=String(step); i.inputMode=step===1?"numeric":"decimal"; wrap.append(i); $(moneyKeys.has(id) ? "importes" : "campos").append(wrap);
 if(moneyKeys.has(id)) amounts.set(id,{wrap,caption:wrap.firstChild});
}
function addBird(data={}) {
 const row=element("fieldset"); const list=$("aves"); if (list.children.length >= 100) {announce("Máximo de 100 aves por fecha.");return;}
 row.append(element("legend","Ave"));
 const input = (tag,label,key) => {
  const wrap=element("label",label), control=element(tag); control.dataset.bird=key;
  control.value=data[key] ?? ""; wrap.append(control); row.append(wrap); return control;
 };
 const name=input("select","Ave","id"); name.required=true;
 const placeholder=element("option","Selecciona un ave");placeholder.value="";name.append(placeholder);
 for(const b of lot()?.profiles || []){const o=element("option",displayBird(b));o.value=b.id;name.append(o);}
 name.value=data.id??"";
 const weight=input("input","Peso (g)","weight");weight.type="number";weight.min="0.1";weight.max=MAX;weight.step="0.1";weight.inputMode="decimal";
 const health=input("textarea","Incidencia de salud del ave","health");health.maxLength=300;health.rows=2;
 const remove=element("button","Quitar ave");remove.type="button";remove.className="secondary";
 remove.addEventListener("click",()=>row.remove());row.append(remove);list.append(row);
 return name;
}
$("agregar-ave").addEventListener("click",()=>{
 if(!lot()?.profiles.length){$("ficha-editor").open=true;$("ficha-form").elements.name.focus();announce("Crea primero una ficha para esa ave.");return;}
 addBird()?.focus();
});
function loggedBirds() {
 return [...$("aves").children].map(el=>{
  const get = key => el.querySelector('[data-bird="'+key+'"]');
  const weight=get("weight");
  return {id:get("id").value,weight:weight.value===""?null:weight.valueAsNumber,health:get("health").value};
 });
}
let loadedDate="";
function edit(date) {
 const form=$("registro"), current=lot(); if (!current) return;
 loadedDate=date;
 form.reset(); $("aves").replaceChildren(); form.elements.date.min=current.start; form.elements.date.value=date;
 const row=current.rows.find(r=>r.date===date);
 if (!row) return;
 for (const [id] of cards) form.elements[id].value=row[id] ?? "";
 form.elements.notes.value=row.notes;
 form.elements.health.value=row.health;
 if(row.birds.length)$("anotacion-individual").open=true;
 if([...moneyKeys].some(k=>row[k]!==null))$("economia-diaria").open=true;
 for (const b of row.birds) addBird(b);
}
function displayBird(b) {return [b.name,b.color,b.code].filter(Boolean).join(" · ");}
function showBird(id, focus=false) {
 const current=lot(), b=current?.profiles.find(x=>x.id===id);
 const panel=$("ficha-activa");panel.hidden=!b;selectedBird=b?.id||"";
 if(!b)return;
 $("ficha-nombre").textContent=b.name;
 const rows=[
  ["Sexo",sexes[b.sex]],["Nacimiento",b.birth||"Sin fecha"],["Identificación",tags[b.tag]],
  ["Color de anilla",b.color||"Sin especificar"],["Código de anilla",b.code||"Sin código escrito"],
  ["Código de ficha",b.id],["Precio de compra",money(b.price,current.currency)],["Valor estimado",money(b.value,current.currency)]
 ];
 $("ficha-datos").replaceChildren(...rows.map(([label,value])=>{const div=element("div");div.append(element("dt",label),element("dd",value));return div;}));
 $("ficha-notas").textContent=b.notes;
 const entries=[...current.rows].reverse().flatMap(r=>{
  const note=r.birds.find(x=>x.id===id);
  return note ? [{date:r.date, ...note}] : [];
 });
 const recent=entries.find(x=>x.weight!==null);
 $("ficha-peso").textContent=recent?"Último peso: "+nice(recent.weight)+" g ("+recent.date+")":"Sin pesajes todavía.";
 $("historial-aves").replaceChildren(...entries.map(x=>element("li",x.date+" · "+[x.weight!==null?nice(x.weight)+" g":"",x.health].filter(Boolean).join(" · "))));
 $("ficha-qr").hidden=true;
 if(focus){$("ficha-nombre").focus();panel.scrollIntoView({block:"nearest"});}
}
function allProfiles() {
 return state.lots.flatMap(l=>l.profiles.map(b=>({l,b})));
}
function pendingDay(){
 const f=$("registro").elements, previous=lot()?.rows.find(r=>r.date===loadedDate);
 if(f.notes.value.trim()!==(previous?.notes??"") || f.health.value.trim()!==(previous?.health??""))return true;
 if(cards.some(([k])=>f[k].validity?.badInput || (f[k].value===""?null:f[k].valueAsNumber)!==(previous?.[k]??null)))return true;
 return JSON.stringify(loggedBirds())!==JSON.stringify(previous?.birds??[]);
}
function allowLotChange(){
 return !(pendingDay() || ($("ficha-editor").open && bf.name.value.trim())) ||
  confirm("Tienes cambios sin guardar en el lote actual. ¿Cambiar de lote sin guardarlos?");
}
function openDay(date){
 const input=$("registro").elements.date, current=lot();
 if(!current || !validDate(date) || date<current.start){
  input.value=loadedDate;return false;
 }
 if(date===loadedDate)return true;
 if(pendingDay() && !confirm("Tienes cambios sin guardar en esta anotación. ¿Cambiar de fecha sin guardarlos?")){
  input.value=loadedDate;return false;
 }
 edit(date);return true;
}
function goToBird(l,b) {
 if(!l || !b)return;
 if(state.active!==l.id){
  if(!allowLotChange())return;
  state={...state,active:l.id};
  birdForm.reset();$("ficha-editor").open=false;render();
 }
 showBird(b.id,true);
}
function renderFinder() {
 const term=normalizeFind($("buscar-ave").value);
 const all=allProfiles();
 const results=term ? all.filter(({b})=>normalizeFind(displayBird(b)+" "+b.id).includes(term))
                    : all.filter(({l})=>l.id===state.active);
 const buttons=results.slice(0,30).map(({l,b})=>{
  const item=element("li"),button=element("button",displayBird(b)+" · "+b.id+(l.id===state.active?"":" · Lote: "+l.name));
  button.type="button";button.className="secondary";
  button.addEventListener("click",()=>goToBird(l,b));item.append(button);return item;
 });
 $("buscar-resultado").replaceChildren(...buttons);
 $("buscar-estado").textContent=results.length>30?"Se muestran 30. Escribe un nombre, color o código para acotar.":results.length?"":all.length?term?"No hay coincidencias en los lotes de esta app.":"No hay fichas en este lote. Puedes buscar en los demás.":"Todavía no hay fichas de aves.";
}
$("buscar-ave").addEventListener("input",renderFinder);
$("buscar-form").addEventListener("submit",e=>{
 e.preventDefault();const term=normalizeFind($("buscar-ave").value);
 if(!term)return;
 const exact=allProfiles().filter(({b})=>[b.id,b.code,b.name].some(s=>normalizeFind(s)===term));
 if(exact.length===1){goToBird(exact[0].l,exact[0].b);return;}
 const results=$("buscar-resultado").querySelectorAll("button");
 if(results.length===1)results[0].click();else renderFinder();
});
const birdForm=$("ficha-form"), bf=birdForm.elements;
function profileEditor(b=null){
 birdForm.reset();
 bf.profileId.value=b?.id||"";
 for(const k of ["name","sex","birth","tag","color","code","price","value","notes"]) if(b)bf[k].value=b[k]??"";
 $("ficha-editor").open=true;bf.name.focus();
}
$("ficha-editar").addEventListener("click",()=>profileEditor(lot()?.profiles.find(x=>x.id===selectedBird)));
$("ficha-nueva").addEventListener("click",()=>profileEditor());
$("ficha-pesar").addEventListener("click",()=>{$("anotacion-individual").open=true;addBird({id:selectedBird})?.focus();});
function draftDay(){
 const form=$("registro"), ids=[...cards.map(([id])=>id),"date","notes","health"];
 return {loadedDate,fields:ids.map(id=>[id,form.elements[id].value]),birds:loggedBirds()};
}
function resumeDay(draft){
 loadedDate=draft.loadedDate;
 $("aves").replaceChildren();
 for(const [id,value] of draft.fields)$("registro").elements[id].value=value;
 for(const b of draft.birds)addBird(b);
}
birdForm.addEventListener("submit",async e=>{
 e.preventDefault();
 const next=copy(state), current=next.lots.find(l=>l.id===next.active);if(!current)return;
 const id=bf.profileId.value || "gr-"+[...crypto.getRandomValues(new Uint8Array(8))].map(n=>n.toString(16).padStart(2,"0")).join("");
 const b={id,name:bf.name.value,birth:bf.birth.value,sex:bf.sex.value,tag:bf.tag.value,color:bf.color.value,
  code:bf.code.value.trim().toUpperCase(),price:bf.price.value===""?null:bf.price.valueAsNumber,
  value:bf.value.value===""?null:bf.value.valueAsNumber,notes:bf.notes.value};
 const i=current.profiles.findIndex(x=>x.id===id);
 if(i<0)current.profiles.push(b);else current.profiles[i]=b;
 const draft=draftDay();
 if(await save(next,"Ficha guardada.")){resumeDay(draft);birdForm.reset();$("ficha-editor").open=false;showBird(id,true);}
});
function qrLink(id) {return "https://granjarentable.com/app-codornices/"+mode+"/#ave="+id;}
function makeLabel(b){
 const Q=globalThis.qrcodegen?.QrCode;
 if(!Q)throw Error("No cargó el generador de QR. Puedes usar el código escrito.");
 const qr=Q.encodeText(qrLink(b.id),Q.Ecc.MEDIUM), border=4, size=qr.size+border*2;
 let path="";
 for(let y=0;y<qr.size;y++)for(let x=0;x<qr.size;x++)if(qr.getModule(x,y))path+="M"+(x+border)+","+(y+border)+"h1v1h-1z";
 const code=b.code||b.id; // Ambos se validan antes de guardarse y solo contienen caracteres ASCII seguros para SVG.
 return '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="400" viewBox="0 0 '+size+' '+(size+5)+'"><title>Identificación de ave Granja Rentable</title><path fill="white" d="M0 0h'+size+'v'+(size+5)+'H0z"/><path fill="black" d="'+path+'"/><text x="'+size/2+'" y="'+(size+1)+'" font-size="2.2" font-family="monospace" text-anchor="middle">'+code+'</text></svg>';
}
let labelURL="";
$("ficha-mostrar-qr").addEventListener("click",()=>{
 const b=lot()?.profiles.find(x=>x.id===selectedBird);if(!b)return;
 try {
  if(labelURL)URL.revokeObjectURL(labelURL);
  labelURL=URL.createObjectURL(new Blob([makeLabel(b)],{type:"image/svg+xml"}));
  $("ficha-qr-img").src=labelURL;$("ficha-qr").hidden=false;
 }catch(err){announce(err.message);}
});
$("ficha-bajar-qr").addEventListener("click",()=>{
 const b=lot()?.profiles.find(x=>x.id===selectedBird);if(!b)return;
 try {download(makeLabel(b),"anilla-"+b.id+".svg","image/svg+xml");}catch(err){announce(err.message);}
});
function fromQR(){
 const match=location.hash.match(/^#ave=([a-z0-9-]{8,80})$/);if(!match)return;
 const id=match[1], current=state.lots.find(l=>l.profiles.some(b=>b.id===id));
 if(!current){announce("Esa ficha no está guardada en este navegador. Si tienes una copia del registro, puedes restaurarla.");return;}
 goToBird(current,current.profiles.find(b=>b.id===id));
}
window.addEventListener("hashchange",fromQR);
function render() {
 const current=lot(), selector=$("lotes");
 selector.replaceChildren(...state.lots.map(l=>{const o=element("option",l.name); o.value=l.id;return o;}));
 selector.value=state.active;
 $("trabajo").hidden=!current; $("sin-lote").hidden=!!current;
 if (!current) return;
 const d=summarize(current,mode);
 const labels = mode==="huevos" ? [
  ["Huevos recogidos",d.huevos],["Huevos aptos",d.aptos],["Huevos vendidos",d.vendidos],
  ["Puesta en días con datos",d.puesta,"%"],["Pienso por docena apta",d.piensoDocena,"g"]
 ] : [
  ["Aves vivas según registro",d.vivas],["Bajas registradas",d.bajas],["Salidas registradas",d.salidas],
  ["Mortalidad del lote",d.mortalidad,"%"]
 ];
 labels.push(["Último peso medio"+(d.fechaPeso?" ("+d.fechaPeso+"; "+d.muestra+" aves; "+d.origenPeso+")":""),d.peso,"g"],
  ["Cambio entre los dos últimos pesajes",d.cambio,"g/día"],["Pienso anotado",d.pienso,"kg"]);
 $("resumen").replaceChildren(...labels.map(([label,n,unit])=>{
  const cell=element("div"); cell.append(element("dt",label),element("dd",nice(n)+(n!=null&&unit?" "+unit:"")));return cell;
 }));
 const c=current.currency;
 $("elegir-moneda").hidden=!!c;
 bf.price.disabled=!c;bf.value.disabled=!c;
 $("ficha-moneda-aviso").hidden=!!c;
 $("moneda-activa").textContent=c ? "Moneda: "+(c==="EUR"?"EUR (€)":"USD (dólares estadounidenses)") : "Moneda aún sin asignar.";
 for(const [id,label] of extras) amounts.get(id).caption.nodeValue=label+(c?" ("+c+")":"");
 const fin = [["Ingresos anotados",d.ingresos],["Gastos anotados",d.gastos],
  [d.saldo===null?"Beneficio o pérdida":d.saldo<0?"Pérdida según lo anotado":d.saldo===0?"Resultado según lo anotado":"Beneficio según lo anotado",d.saldo]];
 const line = ([label,n])=>{const e=element("div");e.append(element("dt",label),element("dd",money(n,c)));return e;};
 $("finanzas").replaceChildren(...fin.map(line));
 $("partidas").replaceChildren(...[["gastos","Gastos sin desglosar"],...costItems].filter(([k])=>Object.hasOwn(d.partidas,k)).map(([k,label])=>line([label,d.partidas[k]])));
 $("desglose").hidden=!Object.keys(d.partidas).length;
 renderFinder();
 showBird(selectedBird);
 $("historial").replaceChildren(...[...current.rows].reverse().map(r=>{
  const li=element("li"), action=element("button","Editar"); action.type="button";
  action.addEventListener("click",()=>{if(openDay(r.date))$("registro").elements.date.focus();});
  const values=cards.filter(([id])=>r[id]!=null).map(([id,label])=>label+": "+(moneyKeys.has(id)?money(r[id],c):nice(r[id])));
  li.append(element("strong",r.date),element("p",values.join(" · ") || "Sin cifras anotadas"),element("p",r.notes),action);
  if(r.health) li.insertBefore(element("p","Salud del lote: "+r.health),action);
  if(r.birds.length) li.insertBefore(element("p",r.birds.length+" aves con anotación individual"),action);
  return li;
 }));
 edit(today()<current.start?current.start:today());
}
$("alta").elements.start.value=today();
$("alta").addEventListener("submit",async e=>{
 e.preventDefault(); const form=e.currentTarget, f=form.elements, next=copy(state);
 const id=typeof crypto.randomUUID==="function"?crypto.randomUUID():String(Date.now());
 if(!currencyOK(f.currency.value)){announce("Elige euros o dólares para este lote.");return;}
 if(lot() && !allowLotChange())return;
 next.lots.push({id,name:f.name.value,start:f.start.value,currency:f.currency.value,initial:Number(f.initial?.value),profiles:[],rows:[]}); next.active=id;
 if(await save(next,"Lote creado.")){birdForm.reset();$("ficha-editor").open=false;form.reset(); f.start.value=today(); $("alta-lote").open=false;}
});
$("elegir-moneda").addEventListener("submit",async e=>{
 e.preventDefault();const form=e.currentTarget,c=form.elements.currency.value, current=lot();
 if(!current || current.currency || !currencyOK(c))return;
 const draft=draftDay(),next=copy(state);next.lots.find(l=>l.id===next.active).currency=c;
 if(await save(next,"Moneda asignada. Los importes anteriores no se han convertido."))resumeDay(draft);
});
$("lotes").addEventListener("change",async e=>{const el=e.target;if(el.value===state.active)return;if(!allowLotChange()){el.value=state.active;return;}const next=copy(state);next.active=el.value;if(!await save(next,"Lote seleccionado."))el.value=state.active;else{birdForm.reset();$("ficha-editor").open=false;}});
$("registro").elements.date.addEventListener("change",e=>{openDay(e.target.value);});
$("registro").addEventListener("submit",async e=>{
 e.preventDefault(); const f=e.currentTarget.elements, next=copy(state), l=next.lots.find(a=>a.id===next.active); if(!l)return;
 const row={date:f.date.value,notes:f.notes.value.trim(),health:f.health.value.trim(),birds:loggedBirds()};
 for (const [id] of cards) row[id]=f[id].value===""?null:f[id].valueAsNumber;
 if (!l.currency && [...moneyKeys].some(id=>row[id]!==null)){announce("Asigna la moneda del lote antes de guardar ingresos o gastos.");return;}
 if (!cards.some(([id])=>row[id]!==null) && !row.notes && !row.health && !row.birds.length) {announce("Anota al menos una cifra o una observación.");return;}
 l.rows=l.rows.filter(r=>r.date!==row.date);l.rows.push(row);if(await save(next,"Registro guardado."))edit(row.date);
});
$("borrar").addEventListener("click",()=>{
 const date=$("registro").elements.date.value, current=lot();
 if(!current?.rows.some(r=>r.date===date)){announce("Ese día no tiene registro.");return;}
 if(!confirm("¿Eliminar el registro del "+date+"?"))return;
 const next=copy(state), l=next.lots.find(x=>x.id===next.active);
 l.rows=l.rows.filter(r=>r.date!==date);save(next,"Registro eliminado.");
});
function download(value,name,type) {
 const u=URL.createObjectURL(new Blob([value],{type}));const a=element("a");a.href=u;a.download=name;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
$("copia").addEventListener("click",()=>{
 if(blocked){announce("No hay datos legibles para exportar.");return;}
 download(serialize(state),"codornices-"+mode+"-"+today()+".json","application/json");
});
$("restaurar").addEventListener("change",async e=>{
 const i=e.target,file=i.files[0],expected=snapshot;if(!file)return;
 try{
  if(file.size>MAX_COPY_BYTES)throw Error("La copia supera 4 MB.");
  const next=validate(JSON.parse(await file.text()), mode);
  if ((state.lots.length || blocked) && !confirm("La copia reemplazará los lotes de este registro. Si quieres conservar los actuales, cancela y descarga una copia primero. ¿Continuar?"))return;
  if(await save(next,"Copia recuperada.",true,expected))fromQR();
 }catch(err){announce(err instanceof SyntaxError?"El archivo no contiene una copia válida.":err.message);}
 finally{i.value="";}
});
render();
fromQR();
})();
