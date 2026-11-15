const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../js/site.js'),'utf8').split('/* === Panel:')[1];
assert.ok(source);
function ejecutar(flag,search){
 const rows=[],listeners={};
 const window={GR:{comunidad:{supabaseUrl:'https://example.invalid',supabaseAnonKey:'test'},analitica:{atribucionUtm:flag}}};
 const document={referrer:'',readyState:'complete',addEventListener:(e,f)=>listeners[e]=f,querySelector:()=>null};
 const location={pathname:'/youtube/costes.html',hostname:'example.invalid',search};
 vm.runInNewContext('/* === Panel:'+source,{window,document,location,URL,URLSearchParams,localStorage:{getItem:()=>null},fetch:(url,args)=>{rows.push(JSON.parse(args.body));return Promise.resolve();}});
 const target={disabled:false,href:'https://pay.example.invalid',getAttribute:()=>null,hasAttribute:n=>n==='data-checkout',classList:{contains:()=>false}};
 listeners.click({target:{closest:()=>target}});return rows;
}
const query='?utm_source=youtube&utm_medium=organic_video&utm_campaign=engorde_registro&utm_content=w4c0OzCPWKI';
for(const r of ejecutar(true,query)){assert.equal(r.utm_source,'youtube');assert.equal(r.utm_content,'w4c0OzCPWKI');assert.ok(!JSON.stringify(r).includes('https://'));}
for(const r of ejecutar(false,query))assert.equal(r.utm_source,undefined);
for(const r of ejecutar(undefined,query))assert.equal(r.utm_source,undefined);
for(const r of ejecutar(true,'?utm_source=correo@example.com&utm_medium=123456789&utm_campaign=NombrePersona&utm_content=secreto'))assert.ok(!Object.keys(r).some(k=>k.startsWith('utm_')));
for(const r of ejecutar(true,'?utm_source=youtube&utm_source=instagram'))assert.equal(r.utm_source,undefined);
for(const r of ejecutar(true,query))assert.ok(!('purchase' in r)&&!('begin_checkout' in r));
console.log('UTM: visita y clic, bandera apagada, rechazo de texto libre y duplicados; sin eventos de venta inventados.');
