const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'js/site.js'),'utf8').split('/* === Panel:')[1];
const config=fs.readFileSync(path.join(root,'js/config.js'),'utf8');
const sql=fs.readFileSync(path.join(root,'supabase/migrations/20261115083000_atribucion_controlada.sql'),'utf8');
assert.ok(source);
function ejecutar(flag,search){
 const rows=[],listeners={};
 const window={GR:{comunidad:{supabaseUrl:'https://example.invalid',supabaseAnonKey:'test'},analitica:{atribucionUtm:flag}}};
 const document={referrer:'',readyState:'complete',addEventListener:(e,f)=>listeners[e]=f,querySelector:()=>null};
 const location={pathname:'/youtube/costes.html',hostname:'example.invalid',search};
 vm.runInNewContext('/* === Panel:'+source,{window,document,location,URL,URLSearchParams,localStorage:{getItem:()=>null},fetch:(url,args)=>{rows.push({url,row:JSON.parse(args.body)});return Promise.resolve();}});
 const target={disabled:false,href:'https://pay.example.invalid',getAttribute:()=>null,hasAttribute:n=>n==='data-checkout',classList:{contains:()=>false}};
 listeners.click({target:{closest:()=>target}});return rows;
}
const query='?utm_source=youtube&utm_medium=organic_video&utm_campaign=engorde_registro&utm_content=w4c0OzCPWKI';
const activos=ejecutar(true,query);
assert.equal(activos.length,2);
assert.match(activos[0].url,/\/visitas$/);
assert.match(activos[1].url,/\/intenciones_compra$/);
for(const {row} of activos){
 assert.deepEqual({source:row.utm_source,medium:row.utm_medium,campaign:row.utm_campaign,content:row.utm_content},{source:'youtube',medium:'organic_video',campaign:'engorde_registro',content:'w4c0OzCPWKI'});
 assert.ok(!JSON.stringify(row).includes('https://'));
 assert.ok(!('purchase' in row)&&!('begin_checkout' in row));
}
for(const flag of [false,undefined]){
 const apagados=ejecutar(flag,query);assert.equal(apagados.length,2);
 for(const {row} of apagados)assert.ok(!Object.keys(row).some(k=>k.startsWith('utm_')));
}
const libres=ejecutar(true,'?utm_source=correo@example.com&utm_medium=123456789&utm_campaign=NombrePersona&utm_content=secreto');
assert.equal(libres.length,2);
for(const {row} of libres)assert.ok(!Object.keys(row).some(k=>k.startsWith('utm_')));
const duplicados=ejecutar(true,'?utm_source=youtube&utm_source=instagram');
assert.equal(duplicados.length,2);
for(const {row} of duplicados)assert.equal(row.utm_source,undefined);
assert.doesNotMatch(config,/atribucionUtm\s*:\s*true/);
const permitidosSql={
 utm_source:['youtube','instagram','facebook','tiktok','granjarentable'],
 utm_medium:['organic_video','organic_social','banner'],
 utm_campaign:['engorde_registro','ebook-pack','ebook-alimenta','ebook-elegir','ebook-hacer','ebook-empezar'],
 utm_content:['w4c0OzCPWKI','fP3Df9d8gPI','GpRK3Sej8vE']
};
for(const [campo,valores] of Object.entries(permitidosSql)){
 const siguiente=Object.keys(permitidosSql)[Object.keys(permitidosSql).indexOf(campo)+1];
 const inicio=sql.indexOf('add column if not exists '+campo);
 const fin=siguiente?sql.indexOf('add column if not exists '+siguiente,inicio):sql.indexOf("', tabla)",inicio);
 assert.ok(inicio>=0&&fin>inicio,campo+' no tiene una restricción identificable en SQL');
 const restriccion=sql.slice(inicio,fin);
 for(const valor of valores)assert.ok(restriccion.includes("''"+valor+"''"),valor+' falta en la restricción de '+campo);
 for(const ajeno of Object.entries(permitidosSql).filter(([otro])=>otro!==campo).flatMap(([,lista])=>lista))assert.ok(!restriccion.includes("''"+ajeno+"''"),ajeno+' aparece en la restricción equivocada: '+campo);
}
for(const tabla of ["'visitas'","'intenciones_compra'"])assert.ok(sql.includes(tabla));
console.log('UTM: visita y clic, bandera apagada, rechazo de texto libre y duplicados; sin eventos de venta inventados.');
