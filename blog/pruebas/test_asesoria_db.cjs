/* npm install --prefix /tmp/asesoria-qa @electric-sql/pglite
   NODE_PATH=/tmp/asesoria-qa/node_modules node blog/pruebas/test_asesoria_db.cjs */
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();
 const client='00000000-0000-0000-0000-000000000001',other='00000000-0000-0000-0000-000000000002',admin='00000000-0000-0000-0000-000000000003';
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
 create table auth.users(id uuid primary key,email text);grant usage on schema auth to authenticated;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.perfiles(id uuid primary key,es_admin boolean,nombre text);
 create function public.es_admin_actual() returns boolean language sql stable security definer as $$select coalesce((select es_admin from public.perfiles where id=auth.uid()),false)$$;
 insert into auth.users values('${client}','a@example.test'),('${other}','b@example.test'),('${admin}','admin@example.test');
 insert into public.perfiles values('${client}',false,'Cliente'),('${other}',false,'Otro'),('${admin}',true,'Asesor');`);
 await db.exec(fs.readFileSync('supabase/migrations/20261113221000_asesoria.sql','utf8'));
 async function as(id){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');}
 async function query(sql,args=[]){return (await db.query(sql,args)).rows;}
 async function rejects(sql,args=[]){await assert.rejects(()=>query(sql,args));}
 const first=(await query("select public.asesoria_activar_pago($1,'cs_verified',now()-interval '1 hour') as id",[client]))[0].id;
 assert.equal((await query("select public.asesoria_activar_pago($1,'cs_verified',now()) as id",[client]))[0].id,first,'Webhook replay must not extend access');
 const second=(await query("select public.asesoria_activar_pago($1,'cs_other',now()) as id",[other]))[0].id;
 await as(client);
 assert.equal((await query('select * from asesoria_accesos')).length,1,'RLS hides other customers');
 await rejects("select asesoria_activar_pago($1,'fake',now())",[client]);
 await rejects("insert into asesoria_accesos(usuario,pago,inicio,fin) values($1,'fake',now(),now()+interval '1 day')",[client]);
 await rejects('select asesoria_clientes()');
 await rejects("select asesoria_abrir_consulta($1,'Tema','Mensaje')",[first]);
 const answers=Object.fromEntries(['objetivo','ubicacion','aves','edad','alojamiento','alimentacion','cantidad','agua','rutina','problema'].map(k=>[k,'Dato']));
 await rejects('select asesoria_guardar_ficha($1,$2)',[first,{objetivo:'Solo una'}]);
 await rejects('select asesoria_guardar_ficha($1,$2)',[second,answers]);
 await query('select asesoria_guardar_ficha($1,$2)',[first,answers]);
 let thread;
 for(let i=0;i<10;i++)thread=(await query("select asesoria_abrir_consulta($1,'Tema','Hola') as id",[first]))[0].id;
 await rejects("select asesoria_abrir_consulta($1,'Once','No debe entrar')",[first]);
 await query("select asesoria_responder($1,'Aclaración incluida')",[thread]);
 await rejects("select asesoria_publicar_plan($1,'Plan falso')",[first]);
 await rejects('select * from asesoria_avisos');
 await as(other);assert.equal((await query('select * from asesoria_mensajes')).length,0);
 await rejects("select asesoria_responder($1,'Intrusión')",[thread]);
 await as(admin);assert.equal((await query('select * from asesoria_accesos')).length,2);
 assert.equal((await query('select asesoria_clientes() as clients'))[0].clients.length,2);
 await query("select asesoria_publicar_plan($1,'Plan de prueba con alimentación y cuidados')",[first]);
 await query("select asesoria_responder($1,'Respuesta del asesor')",[thread]);
 await db.exec('reset role');await db.query("update asesoria_accesos set fin=now()-interval '1 second' where id=$1",[first]);
 await as(client);assert.equal((await query('select * from asesoria_planes')).length,1,'Expired access retains readable plan');
 await rejects("select asesoria_responder($1,'Fuera de plazo')",[thread]);
 await rejects('select asesoria_guardar_ficha($1,$2)',[first,answers]);
 await as(admin);await query("select asesoria_responder($1,'Respuesta pendiente después de vencer')",[thread]);
 await db.exec('reset role');await db.query('update asesoria_accesos set revocado=true where id=$1',[second]);
 await as(other);await rejects('select asesoria_guardar_ficha($1,$2)',[second,answers]);
 await db.close();console.log('PASS: real PostgreSQL migration, identity isolation, admin controls, payment idempotency, intake, 10-query limit, follow-ups, expiry and revocation.');
})().catch(e=>{console.error(e);process.exit(1)});
