(function () {
"use strict";
const definitions = {
 huevos: [
  ["hembras","Hembras presentes","",1],["huevos","Huevos recogidos","",1],
  ["noAptos","Huevos no aptos","",1],["vendidos","Huevos vendidos","",1],
  ["pienso","Pienso consumido (g)","",1]
 ],
 carne: [
  ["bajas","Bajas del día","",1],["salidas","Aves que salen del lote","",1],
  ["muestra","Aves pesadas","",1],["peso","Peso medio de la muestra (g)","",0.1],
  ["pienso","Pienso consumido (g)","",1]
 ]
};
const extras = [["ingresos","Ingresos del día","",0.01],["gastos","Gastos del día","",0.01]];
const fields = mode => [...definitions[mode], ...extras];
const MAX = 99999999;
const nice = n => n == null ? "Sin datos" : n.toLocaleString("es-ES", {maximumFractionDigits:2});
const validDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && s >= "1900-01-01" && s <= "9999-12-31" && !isNaN(Date.parse(s+"T00:00:00Z")) && new Date(s+"T00:00:00Z").toISOString().slice(0,10) === s;
function today(d = new Date()) { return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-"); }
function empty(mode) { return {version:1, mode, active:"", lots:[]}; }
function validate(raw, mode) {
 if (!definitions[mode] || !raw || raw.version !== 1 || raw.mode !== mode || !Array.isArray(raw.lots) || raw.lots.length > 200) throw Error("La copia no corresponde a este registro.");
 const ids = new Set();
 const lots = raw.lots.map(lot => {
  if (!lot || typeof lot.id !== "string" || !/^[a-zA-Z0-9-]{1,80}$/.test(lot.id) || ids.has(lot.id) ||
      typeof lot.name !== "string" || !lot.name.trim() || lot.name.length > 60 || !validDate(lot.start) ||
      !Array.isArray(lot.rows) || lot.rows.length > 3660) throw Error("Hay un lote con datos no válidos.");
  ids.add(lot.id);
  if (mode === "carne" && (!Number.isInteger(lot.initial) || lot.initial < 1 || lot.initial > MAX))
   throw Error("Indica cuántas aves había al iniciar el lote.");
  const dates = new Set();
  const rows = lot.rows.map(row => {
   if (!row || !validDate(row.date) || row.date < lot.start || dates.has(row.date) ||
       typeof row.notes !== "string" || row.notes.length > 500) throw Error("Revisa las fechas o notas del registro.");
   dates.add(row.date);
   const clean = {date:row.date,notes:row.notes};
   for (const [key,label,,step] of fields(mode)) {
    const n = row[key];
    if (n !== null && (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > MAX || (step === 1 && !Number.isInteger(n)))) throw Error("Revisa el dato: " + label + ".");
    clean[key] = n;
   }
   if (mode === "huevos" && clean.noAptos != null && (clean.huevos == null || clean.noAptos > clean.huevos))
    throw Error("Los huevos no aptos no pueden superar los recogidos.");
   if (mode === "carne" && Boolean(clean.muestra) !== Boolean(clean.peso))
    throw Error("Para registrar un pesaje, indica cuántas aves pesaste y su peso medio.");
   return clean;
  }).sort((a,b)=>a.date.localeCompare(b.date));
  if (mode === "carne") {
   let alive = lot.initial;
   for (const row of rows) {
    if ((row.muestra || 0) > alive) throw Error("El tamaño de la muestra supera las aves del lote el " + row.date + ".");
    alive -= (row.bajas || 0) + (row.salidas || 0);
    if (alive < 0) throw Error("Las bajas y salidas superan las aves disponibles el " + row.date + ".");
   }
  }
  return {id:lot.id, name:lot.name.trim(), start:lot.start, ...(mode === "carne" ? {initial:lot.initial} : {}), rows};
 });
 if (raw.active && !ids.has(raw.active)) throw Error("El lote seleccionado no existe en la copia.");
 return {version:1, mode, active:raw.active || (lots[0] && lots[0].id) || "", lots};
}
function summarize(lot,mode) {
 const rows = lot.rows;
 const sum = (key, set = rows) => set.reduce((s,r)=>s+(r[key] || 0),0);
 const has = key => rows.some(r=>r[key] != null);
 const stats = {dias:rows.length, pienso:has("pienso") ? sum("pienso") / 1000 : null,
  saldo:has("ingresos") || has("gastos") ? sum("ingresos")-sum("gastos") : null};
 if (mode === "huevos") {
  const rate = rows.filter(r=>r.hembras > 0 && r.huevos != null);
  const apt = rows.filter(r=>r.huevos != null && r.noAptos != null);
  const feed = apt.filter(r=>r.pienso != null);
  const aptos = set => sum("huevos",set)-sum("noAptos",set);
  return {...stats, huevos:has("huevos")?sum("huevos"):null, aptos:apt.length?aptos(apt):null,
   vendidos:has("vendidos")?sum("vendidos"):null, puesta:rate.length?100*sum("huevos",rate)/sum("hembras",rate):null,
   piensoDocena:aptos(feed)>0 ? 12*sum("pienso",feed)/aptos(feed) : null};
 }
 const pesajes = rows.filter(r=>r.muestra>0 && r.peso>0);
 const last = pesajes.at(-1), prev = pesajes.at(-2);
 const bajas = sum("bajas"), salidas = sum("salidas");
 const dias = last && prev ? (Date.parse(last.date)-Date.parse(prev.date))/86400000 : 0;
 return {...stats, bajas, salidas, vivas:lot.initial-bajas-salidas,
  mortalidad:100*bajas/lot.initial, peso:last ? last.peso : null, muestra:last ? last.muestra : null,
  fechaPeso:last ? last.date : null, cambio:dias>0?(last.peso-prev.peso)/dias:null};
}
if (typeof module !== "undefined" && module.exports) module.exports = {empty,validate,summarize,validDate,today,fields};
if (typeof document === "undefined") return;
const mode = document.body.dataset.registro;
if (!definitions[mode]) return;
const $ = id => document.getElementById(id);
const key = "gr-codornices-v1-"+mode, copy = data => JSON.parse(JSON.stringify(data));
const cards = [...fields(mode)];
let state = empty(mode), blocked = false;
const announce = msg => { $("estado").textContent = msg; };
try {
 const saved = localStorage.getItem(key);
 if (saved) state = validate(JSON.parse(saved), mode);
} catch (_) { blocked=true; announce("No se pudieron leer los datos guardados. No se sobrescribirán. Puedes recuperar una copia válida."); }
function save(next, text, recover=false) {
 try {
  if (blocked && !recover) throw Error("Primero recupera una copia válida antes de guardar.");
  next = validate(next,mode);
  try { localStorage.setItem(key,JSON.stringify(next)); } catch (_) { throw Error("El navegador no pudo guardar. No se reemplazaron los registros anteriores."); }
  state=next; blocked=false; render(); announce(text); return true;
 } catch (err) { announce(err.message); return false; }
}
const lot = () => state.lots.find(l=>l.id===state.active);
const element = (tag,text) => { const e=document.createElement(tag); if (text != null) e.textContent=text; return e; };
for (const [id,label,,step] of cards) {
 const wrap=element("label",label); const i=element("input"); i.name=id; i.type="number"; i.min="0"; i.max=MAX; i.step=String(step); i.inputMode=step===1?"numeric":"decimal"; wrap.append(i); $("campos").append(wrap);
}
function edit(date) {
 const form=$("registro"), current=lot(); if (!current) return;
 form.reset(); form.elements.date.min=current.start; form.elements.date.value=date;
 const row=current.rows.find(r=>r.date===date);
 if (!row) return;
 for (const [id] of cards) form.elements[id].value=row[id] ?? "";
 form.elements.notes.value=row.notes;
}
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
  ["Mortalidad del lote",d.mortalidad,"%"],["Último peso medio"+(d.fechaPeso?" ("+d.fechaPeso+"; "+d.muestra+" aves)":""),d.peso,"g"],
  ["Cambio entre los dos últimos pesajes",d.cambio,"g/día"]
 ];
 labels.push(["Pienso anotado",d.pienso,"kg"],["Ingresos menos gastos anotados",d.saldo]);
 $("resumen").replaceChildren(...labels.map(([label,n,unit])=>{
  const cell=element("div"); cell.append(element("dt",label),element("dd",nice(n)+(n!=null&&unit?" "+unit:"")));return cell;
 }));
 $("historial").replaceChildren(...[...current.rows].reverse().map(r=>{
  const li=element("li"), action=element("button","Editar"); action.type="button";
  action.addEventListener("click",()=>{edit(r.date);$("registro").elements.date.focus();});
  const values=cards.filter(([id])=>r[id]!=null).map(([id,label])=>label+": "+nice(r[id]));
  li.append(element("strong",r.date),element("p",values.join(" · ") || "Sin cifras anotadas"),element("p",r.notes),action);
  return li;
 }));
 edit(today()<current.start?current.start:today());
}
$("alta").elements.start.value=today();
$("alta").addEventListener("submit",e=>{
 e.preventDefault(); const f=e.currentTarget.elements, next=copy(state);
 const id=typeof crypto.randomUUID==="function"?crypto.randomUUID():String(Date.now());
 next.lots.push({id,name:f.name.value,start:f.start.value,initial:Number(f.initial?.value),rows:[]}); next.active=id;
 if(save(next,"Lote creado.")){e.currentTarget.reset(); f.start.value=today(); $("alta-lote").open=false;}
});
$("lotes").addEventListener("change",e=>{const next=copy(state);next.active=e.target.value;if(!save(next,"Lote seleccionado."))e.target.value=state.active;});
$("registro").elements.date.addEventListener("change",e=>{if (validDate(e.target.value)) edit(e.target.value);});
$("registro").addEventListener("submit",e=>{
 e.preventDefault(); const f=e.currentTarget.elements, next=copy(state), l=next.lots.find(a=>a.id===next.active); if(!l)return;
 const row={date:f.date.value,notes:f.notes.value.trim()};
 for (const [id] of cards) row[id]=f[id].value===""?null:f[id].valueAsNumber;
 if (!cards.some(([id])=>row[id]!==null) && !row.notes) {announce("Anota al menos una cifra o una observación.");return;}
 l.rows=l.rows.filter(r=>r.date!==row.date);l.rows.push(row);if(save(next,"Registro guardado."))edit(row.date);
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
 download(JSON.stringify(state,null,2),"codornices-"+mode+"-"+today()+".json","application/json");
});
$("restaurar").addEventListener("change",async e=>{
 const i=e.target,file=i.files[0];if(!file)return;
 try{
  if(file.size>4*1024*1024)throw Error("La copia supera 4 MB.");
  const next=validate(JSON.parse(await file.text()), mode);
  if ((state.lots.length || blocked) && !confirm("La copia reemplazará los lotes de este registro. Si quieres conservar los actuales, cancela y descarga una copia primero. ¿Continuar?"))return;
  save(next,"Copia recuperada.",true);
 }catch(err){announce(err instanceof SyntaxError?"El archivo no contiene una copia válida.":err.message);}
 finally{i.value="";}
});
render();
})();
