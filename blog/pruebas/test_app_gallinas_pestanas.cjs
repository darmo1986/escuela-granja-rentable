const vm=require("node:vm"),test=require("node:test"),assert=require("node:assert/strict");
const source=require("node:fs").readFileSync(require.resolve("../../app-gallinas/app.js"),"utf8");
const KEY="gr_gallinas_v1";
function tab(store, writeFails=false) {
 const elements={}, alerts=[];
 const document={querySelectorAll:()=>[],getElementById:id=>elements[id] ||= {value:"",addEventListener(){},focus(){}}};
 const localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(writeFails)throw Error("quota");store.set(k,v);}};
 const context=vm.createContext({document,localStorage,alert:m=>alerts.push(m)});
 vm.runInContext(source.slice(0,source.lastIndexOf("cargar();"))+"\ncargar();refrescar=()=>{};",context);
 return {alerts,run:s=>vm.runInContext(s,context),elements};
}
test("no sobrescribe un guardado desde otra pestaña ni borra los campos",()=>{
 const storage=new Map(), a=tab(storage), b=tab(storage);
 a.run('$("p-kg").value="5";$("p-coste").value="10";guardarPienso();');
 b.run('$("m-tipo").value="gasto";$("m-eur").value="3";$("m-con").value="Cama";guardarMov();');
 assert.match(b.alerts.at(-1),/otra pestaña/);assert.equal(b.elements["m-eur"].value,"3");
 assert.equal(JSON.parse(storage.get(KEY)).pienso[0].kg,5);
 assert.equal(JSON.parse(storage.get(KEY)).movs.length,0);
 const c=tab(storage);
 c.run('$("m-tipo").value="gasto";$("m-eur").value="3";guardarMov();');
 assert.equal(JSON.parse(storage.get(KEY)).movs.length,1);
 assert.equal(JSON.parse(storage.get(KEY)).pienso.length,1);
});
test("si falla el guardado conserva datos, formulario y estado previo",()=>{
 const storage=new Map(), a=tab(storage,true);
 a.run('$("p-kg").value="5";guardarPienso();');
 assert.match(a.alerts.at(-1),/no pudo guardar/);assert.equal(a.elements["p-kg"].value,"5");
 assert.equal(a.run("DB.pienso.length"),0);assert.equal(storage.has(KEY),false);
});
test("una copia aprobada actualiza la revisión para los guardados siguientes",()=>{
 const storage=new Map(), a=tab(storage);
 a.run("limpiarFormAve=()=>{};guardarCopia(vacia(),null);");
 a.run('$("p-kg").value="5";guardarPienso();');
 assert.equal(JSON.parse(storage.get(KEY)).pienso.length,1);
 assert.equal(a.alerts.at(-1),"Pienso guardado.");
});
