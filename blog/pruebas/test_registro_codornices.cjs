const test = require("node:test");
const assert = require("node:assert/strict");
const { empty, validate, summarize, validDate, today, fields } = require("../../app-codornices/registro.js");
const start = "2026-11-23";
const row = (mode,date,values) => ({date,notes:"",...Object.fromEntries(fields(mode).map(([id])=>[id,null])),...values});
const state = (mode,rows) => ({...empty(mode),active:"lote-1",lots:[{id:"lote-1",name:"Lote 1",start,initial:40,rows}]});
const egg = (date,values) => row("huevos",date,values);
const meat = (date,values) => row("carne",date,values);
test("puesta: tasa ponderada, descartes, ventas y pienso por docena",()=>{
 const data=state("huevos",[
  egg(start,{hembras:20,huevos:15,noAptos:1,vendidos:10,pienso:600,ingresos:8,gastos:3}),
  egg("2026-11-24",{hembras:10,huevos:9,noAptos:0,vendidos:6,pienso:300,gastos:0.5})]);
 const cleaned=validate(JSON.parse(JSON.stringify(data)),"huevos");
 const p=summarize(cleaned.lots[0],"huevos");
 assert.equal(p.huevos,24);assert.equal(p.aptos,23);assert.equal(p.vendidos,16);
 assert.equal(p.puesta,80);assert.equal(p.piensoDocena,10800/23);
 assert.equal(p.pienso,0.9);assert.equal(p.saldo,4.5);
});
test("puesta: vacío no equivale a cero y se rechazan más descartes que huevos",()=>{
 const missing=state("huevos",[egg(start,{hembras:20,huevos:0,noAptos:null})]);
 const stats=summarize(validate(missing,"huevos").lots[0],"huevos");
 assert.equal(stats.huevos,0);assert.equal(stats.aptos,null);assert.equal(stats.piensoDocena,null);
 assert.throws(()=>validate(state("huevos",[egg(start,{huevos:1,noAptos:2})]),"huevos"),/no aptos/);
});
test("carne: inventario, mortalidad, pienso y cambio de peso registrado",()=>{
 const data=state("carne",[
  meat("2026-11-25",{bajas:1,salidas:5,muestra:8,peso:128,pienso:820}),
  meat(start,{bajas:2,muestra:10,peso:104,pienso:750})]);
 const s=summarize(validate(data,"carne").lots[0],"carne");
 assert.equal(s.vivas,32);assert.equal(s.mortalidad,7.5);assert.equal(s.pienso,1.57);
 assert.equal(s.peso,128);assert.equal(s.cambio,12);assert.equal(s.muestra,8);
});
test("carne: se rechazan inventario negativo y pesajes incompletos",()=>{
 assert.throws(()=>validate(state("carne",[meat(start,{bajas:2,salidas:39})]),"carne"),/superan/);
 assert.throws(()=>validate(state("carne",[meat(start,{peso:90})]),"carne"),/pesaje/);
 assert.throws(()=>validate(state("carne",[meat(start,{peso:90,muestra:41})]),"carne"),/muestra/);
});
test("copias separadas por modo y por lote; no admite fechas duplicadas",()=>{
 assert.throws(()=>validate(state("huevos",[]),"carne"),/corresponde/);
 assert.throws(()=>validate(state("huevos",[egg(start,{huevos:1}),egg(start,{huevos:2})]),"huevos"),/fechas/);
 const a=state("huevos",[egg(start,{huevos:1})]);a.lots.push({...a.lots[0],id:"lote-2",rows:[egg(start,{huevos:2})]});
 assert.deepEqual(validate(a,"huevos").lots.map(l=>summarize(l,"huevos").huevos),[1,2]);
});
test("fechas válidas, incluida la fecha local del dispositivo",()=>{
 assert.equal(validDate("2026-02-30"),false);assert.equal(validDate("2024-02-29"),true);
 assert.equal(today(new Date(2026,10,23,23,59)),"2026-11-23");
 assert.throws(()=>validate(state("huevos",[egg("2026-11-22",{huevos:1})]),"huevos"),/fechas/);
});

const vm = require("node:vm");
const runtime = require("node:fs").readFileSync(require.resolve("../../app-codornices/registro.js"),"utf8");
function simulatedTab(mode, files, confirm, id) {
 const ids = {};
 const mk = () => ({value:"",textContent:"",children:[],events:{},append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},addEventListener(k,v){this.events[k]=v;},focus(){}});
 const el = k => ids[k] ||= mk();
 function form(name,keys) {
  const f=el(name);f.elements=Object.fromEntries(keys.map(k=>[k,mk()]));
  f.reset=()=>Object.values(f.elements).forEach(x=>{x.value="";x.valueAsNumber=NaN;});
  return f;
 }
 const alta=form("alta",["name","start","initial"]);
 const reg=form("registro",["date","notes",...fields(mode).map(([id])=>id)]);
 const store={getItem:k=>files.get(k)??null,setItem:(k,v)=>files.set(k,v)};
 vm.runInNewContext(runtime,{TextEncoder,document:{body:{dataset:{registro:mode}},createElement:mk,getElementById:el},
  localStorage:store,crypto:{randomUUID:()=>id},confirm,navigator:{locks:{request:async (_key,run)=>run()}}});
 const fire=(e,k)=>e.events[k]({currentTarget:e,target:e,preventDefault(){}});
 return {
  create:async()=>{alta.elements.name.value="Lote";alta.elements.start.value=start;alta.elements.initial.value="40";await fire(alta,"submit");},
  save:async(date,val)=>{reg.elements.date.value=date;const f=reg.elements[mode==="huevos"?"huevos":"bajas"];f.value=String(val);f.valueAsNumber=val;await fire(reg,"submit");return f.value;},
  imported:async reader=>{const f=el("restaurar");f.files=[{size:100,text:reader}];await fire(f,"change");},
  message:()=>el("estado").textContent,
 };
}
test("dos pestañas: no se pierde el día guardado y las entradas se conservan",async()=>{
 for (const mode of ["huevos","carne"]) {
  const files=new Map(), k="gr-codornices-v1-"+mode;
  const a=simulatedTab(mode,files,()=>true,"lote-1");await a.create();
  const b=simulatedTab(mode,files,()=>true,"lote-2");
  await a.save(start,8);
  assert.equal(await b.save("2026-11-24",9),"9");assert.match(b.message(),/otra pestaña/);
  assert.equal(JSON.parse(files.get(k)).lots[0].rows.length,1);
  const c=simulatedTab(mode,files,()=>true,"lote-3");await c.save("2026-11-24",9);
  assert.deepEqual(JSON.parse(files.get(k)).lots[0].rows.map(r=>r.date),[start,"2026-11-24"]);
 }
});
test("recuperación: se vuelve a verificar después de leer el archivo y confirmar",async()=>{
 const files=new Map(), k="gr-codornices-v1-huevos";
 const a=simulatedTab("huevos",files,()=>true,"lote-1");await a.create();const backup=files.get(k);
 const b=simulatedTab("huevos",files,()=>true,"lote-2");
 await b.imported(async()=>{await a.save(start,8);return backup;});
 assert.match(b.message(),/otra pestaña/);assert.equal(JSON.parse(files.get(k)).lots[0].rows[0].huevos,8);
 const c=simulatedTab("huevos",files,()=>{files.set(k,backup);return true;},"lote-3");
 await c.imported(async()=>JSON.stringify(empty("huevos")));
 assert.match(c.message(),/otra pestaña/);assert.equal(files.get(k),backup);
});
test("el guardado tiene el mismo límite en bytes que la copia compacta",()=>{
 const {persist}=require("../../app-codornices/registro.js");
 const files=new Map(), storage={getItem:k=>files.get(k)??null,setItem:(k,v)=>files.set(k,v)};
 const raw={text:"á".repeat(1_900_000)};const json=persist(storage,"huevos",null,raw);
 assert.ok(Buffer.byteLength(json)<4*1024*1024);assert.equal(JSON.parse(json).text,raw.text);
 assert.throws(()=>persist(storage,"huevos",json,{text:"á".repeat(2_200_000)}),/límite/);
 assert.equal(files.get("huevos"),json);
});
