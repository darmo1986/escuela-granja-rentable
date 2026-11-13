/* NODE_PATH=/tmp/asesoria-qa/node_modules node blog/pruebas/test_asesoria_ui.cjs
   Test DOM con datos ficticios; no prueba diseño visual ni conexiones reales. */
const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const {PDFDocument}=require('../../js/vendor/pdf-lib.min.js');
(async()=>{
 const dom=new JSDOM(fs.readFileSync('asesoria.html','utf8'),{url:'https://granjarentable.com/asesoria.html',runScripts:'outside-only'}),w=dom.window;
 w.eval(fs.readFileSync('js/config.js','utf8'));w.GR.asesoria.activa=true;
 w.eval(fs.readFileSync('js/vendor/pdf-lib.min.js','utf8'));
 const access={id:'a1',usuario:'u1',inicio:new Date().toISOString(),fin:new Date(Date.now()+30*86400000).toISOString(),revocado:false,limite:10};
 const answers=Object.fromEntries(['objetivo','ubicacion','aves','edad','alojamiento','alimentacion','cantidad','agua','rutina','problema'].map(k=>[k,'Datos de prueba para '+k]));
 const plan='OBJETIVO\nRevisar el manejo del lote.\n\nALIMENTACIÓN\nRegistrar el consumo diario. Revisar la etiqueta del pienso.\n'+Array(100).fill('Línea con acentos: alimentación, producción y revisión.').join('\n');
 let isAdmin=false,logged=true,captured,mutations=[];
 const sb={auth:{getSession:async()=>({data:{session:{access_token:'TEST'}}}),getUser:async()=>({data:{user:logged?{id:'u1'}:null}})},
 rpc:async(name,args)=>{mutations.push(name);return {data:name==='es_admin_actual'?isAdmin:name==='asesoria_clientes'?[{id:'a1',nombre:'Cliente de prueba',correo:'cliente@example.test'}]:name==='asesoria_abrir_consulta'?'t1':null}},
 from(table){let q={select(){return q},eq(){return q},order(){return q},maybeSingle(){return q},then(resolve){let data=table==='asesoria_accesos'?[access]:table==='asesoria_fichas'?{respuestas:answers}:table==='asesoria_planes'?{contenido:plan,actualizado:new Date().toISOString()}:table==='asesoria_consultas'?[{id:'t1',titulo:'Reparto del pienso',creado:new Date().toISOString()}]:[{texto:'Consulta <img src=x onerror=alert(1)>',asesor:false,creado:new Date().toISOString()}];resolve({data});}};return q;}};
 w.GRAuth={cliente:async()=>sb,usuario:()=>logged?{id:'u1'}:null,abrir:()=>{}};
 w.fetch=async()=>({ok:true,json:async()=>({enviados:1})});
 w.URL.createObjectURL=blob=>{captured=blob;return 'blob:test'};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};
 w.eval(fs.readFileSync('js/asesoria.js','utf8'));
 const tick=()=>new Promise(r=>setTimeout(r,30));await tick();
 const $=id=>w.document.getElementById(id);
 assert.equal($('ap-workspace').hidden,false);assert.equal(w.document.querySelectorAll('#ap-fields textarea').length,10);
 assert.equal($('ap-progress').value,10);assert.equal($('ap-plan-text').textContent,plan);
 $('ap-download').click();await tick();assert(captured,'PDF generated');
 const bytes=await new Promise(resolve=>{const reader=new w.FileReader();reader.onload=()=>resolve(Buffer.from(reader.result));reader.readAsArrayBuffer(captured)});
 const pdf=await PDFDocument.load(bytes);assert(pdf.getPageCount()>=3,'Long plan paginates');fs.writeFileSync('/tmp/plan-asesoria-qa.pdf',bytes);
 w.document.querySelector('[data-ap-tab="chat"]').click();assert.equal($('ap-messages').querySelectorAll('img').length,0,'Chat content stays literal');
 $('ap-reply-text').value='Mensaje';$('ap-reply').dispatchEvent(new w.Event('submit',{cancelable:true}));await tick();assert(mutations.includes('asesoria_responder'));
 isAdmin=true;w.dispatchEvent(new w.Event('gr-auth'));await tick();assert.equal($('ap-admin').hidden,false);assert($('ap-access-select').textContent.includes('cliente@example.test'));
 assert(w.document.querySelector('#ap-fields textarea').disabled);assert.equal($('ap-plan-admin').hidden,false);
 logged=false;w.dispatchEvent(new w.Event('gr-auth'));assert($('ap-workspace').hidden);assert.equal($('ap-plan-text').textContent,'');assert.equal($('ap-messages').childElementCount,0);
 // A delayed auth response must not reopen private data after logout.
 let resolveUser;logged=true;sb.auth.getUser=()=>new Promise(resolve=>{resolveUser=resolve});
 w.dispatchEvent(new w.Event('gr-auth'));await tick();
 logged=false;w.dispatchEvent(new w.Event('gr-auth'));
 resolveUser({data:{user:{id:'u1'}}});await tick();
 assert($('ap-workspace').hidden,'Late auth response cannot reopen workspace');
 assert.equal($('ap-plan-text').textContent,'');
 dom.window.close();console.log('PASS: customer/admin DOM, ten intake fields, literal chat content, message RPC, multipage PDF, logout clears private content.');
})().catch(e=>{console.error(e);process.exit(1)});
