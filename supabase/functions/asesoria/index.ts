// Edge Function: platform auth configuration authorized for this endpoint.
// Every route validates identity or Stripe signature. No secrets in the website.
const env = (key: string) => Deno.env.get(key) || '';
const origin = 'https://granjarentable.com';
const headers = {'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization,apikey,content-type,x-client-info', 'Access-Control-Allow-Methods': 'POST,OPTIONS', 'Vary':'Origin'};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {status, headers:{...headers,'Content-Type':'application/json'}});
async function checked(r: Response) {
 if (!r.ok) throw new Error('El servicio no pudo completar la operación.');
 return r.json();
}
async function db(path: string, body?: unknown, method = body === undefined ? 'GET' : 'POST') {
 return checked(await fetch(env('SUPABASE_URL')+'/rest/v1/'+path, {method, headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:'Bearer '+env('SUPABASE_SERVICE_ROLE_KEY'),'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)}));
}
async function user(req: Request) {
 const token=req.headers.get('Authorization')||'';
 if (!token.startsWith('Bearer ')) throw new Error('Entra en tu cuenta para continuar.');
 const u=await checked(await fetch(env('SUPABASE_URL')+'/auth/v1/user',{headers:{apikey:env('SUPABASE_ANON_KEY'),Authorization:token}}));
 if (!u.id || !u.email_confirmed_at) throw new Error('Verifica el correo de tu cuenta para continuar.');
 return u;
}
async function stripe(path: string, body?: URLSearchParams, idempotency?: string) {
 return checked(await fetch('https://api.stripe.com/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+env('STRIPE_SECRET_KEY'),...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{}),...(idempotency?{'Idempotency-Key':idempotency}:{})},body}));
}
async function activate(session: any, at: number) {
 if (session.payment_status!=='paid' || session.mode!=='payment' || session.amount_total!==2900 || session.currency!=='eur' || session.metadata?.producto!=='asesoria-30d-v1' || !session.metadata?.usuario) throw new Error('Pago no válido para este servicio.');
 return db('rpc/asesoria_activar_pago',{p_usuario:session.metadata.usuario,p_pago:session.id,p_inicio:new Date(at*1000).toISOString()});
}
export async function validSignature(raw: string, signature: string, secret: string, now = Date.now()) {
 const parts=signature.split(',').map(x=>x.split('='));
 const stamp=parts.find(x=>x[0]==='t')?.[1];
 const candidates=parts.filter(x=>x[0]==='v1').map(x=>x[1]);
 if (!stamp || !secret || Math.abs(now/1000-Number(stamp))>300) return false;
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const mac=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(stamp+'.'+raw)));
 const expected=Array.from(mac,x=>x.toString(16).padStart(2,'0')).join('');
 return candidates.some(x=>{if(x.length!==expected.length)return false;let diff=0;for(let i=0;i<x.length;i++)diff|=x.charCodeAt(i)^expected.charCodeAt(i);return diff===0;});
}
async function notify(u: any) {
 if (!env('RESEND_API_KEY') || !env('ASESORIA_MAIL_FROM') || !env('ASESORIA_ADMIN_EMAIL')) return {enviados:0,pendiente:true};
 const admins=await db('perfiles?select=es_admin&id=eq.'+encodeURIComponent(u.id));
 const admin=admins[0]?.es_admin===true;
 const queue=await db('asesoria_avisos?select=*&enviado=is.null&order=creado.asc&limit=20'+(admin?'':'&solicitante=eq.'+encodeURIComponent(u.id)));
 let sent=0;
 for(const item of queue){
  let to=env('ASESORIA_ADMIN_EMAIL');
  if(!item.para_asesor){
   const access=await db('asesoria_accesos?select=usuario&id=eq.'+encodeURIComponent(item.acceso));
   const recipient=await checked(await fetch(env('SUPABASE_URL')+'/auth/v1/admin/users/'+access[0].usuario,{headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:'Bearer '+env('SUPABASE_SERVICE_ROLE_KEY')}}));
   to=recipient.email;
  }
  const mailed=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env('RESEND_API_KEY'),'Content-Type':'application/json','Idempotency-Key':item.id},body:JSON.stringify({from:env('ASESORIA_MAIL_FROM'),to:[to],subject:'Granja Rentable · '+item.motivo,text:item.motivo+'. Entra en tu área privada para consultar el contenido y responder: '+origin+'/asesoria.html\nEste correo es un aviso; responde desde el área privada.'})});
  if(!mailed.ok) continue;
  await db('asesoria_avisos?id=eq.'+encodeURIComponent(item.id),{enviado:new Date().toISOString()},'PATCH');sent++;
 }
 return {enviados:sent,pendiente:sent<queue.length};
}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return json({error:'Método no permitido.'},405);
 try{
  if(new URL(req.url).searchParams.get('webhook')==='stripe'){
   const raw=await req.text();
   if(!await validSignature(raw,req.headers.get('stripe-signature')||'',env('STRIPE_WEBHOOK_SECRET')))return json({error:'Firma no válida.'},400);
   const event=JSON.parse(raw);
   if(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type)){
    const session=event.data.object;
    if(session.metadata?.producto==='asesoria-30d-v1'&&session.payment_status==='paid'){
     await activate(session,event.created);
     try{await notify({id:session.metadata.usuario});}catch(_e){console.error('Aviso pendiente tras activar el pago.');}
    }
   }
   if(event.type==='charge.refunded'&&event.data.object.refunded===true || event.type==='charge.dispute.created'){
    const object=event.data.object;
    const sessions=await stripe('checkout/sessions?payment_intent='+encodeURIComponent(object.payment_intent));
    for(const s of sessions.data||[])if(s.metadata?.producto==='asesoria-30d-v1')await db('asesoria_accesos?pago=eq.'+encodeURIComponent(s.id),{revocado:true},'PATCH');
   }
   return json({ok:true});
  }
  const u=await user(req), data=await req.json();
  if(data.accion==='avisar')return json(await notify(u));
  if(data.accion==='checkout'){
   if(data.condiciones!=='asesoria-30d-v1')return json({error:'Acepta las condiciones del acompañamiento antes de pagar.'},400);
   if(env('ASESORIA_CHECKOUT_ENABLED')!=='true')return json({error:'Las nuevas plazas todavía no están abiertas.'},503);
   const existing=await db('asesoria_accesos?select=id&usuario=eq.'+encodeURIComponent(u.id)+'&revocado=eq.false&fin=gt.'+encodeURIComponent(new Date().toISOString()));
   if(existing.length)return json({error:'Ya tienes seguimiento activo. Entra en tu área privada.'},409);
   // Solo tarjeta: evita activar tarde un pago asíncrono o crear dos cobros
   // mediante reintentos. Misma sesión pendiente por usuario durante 24 horas.
   const p=new URLSearchParams({mode:'payment','payment_method_types[0]':'card','line_items[0][price_data][currency]':'eur','line_items[0][price_data][unit_amount]':'2900','line_items[0][price_data][product_data][name]':'Granja Rentable · Acompañamiento 30 días','line_items[0][quantity]':'1','metadata[producto]':'asesoria-30d-v1','metadata[usuario]':u.id,client_reference_id:u.id,customer_email:u.email,success_url:origin+'/asesoria.html?pago=recibido',cancel_url:origin+'/asesoria.html?pago=cancelado'});
   p.set('metadata[condiciones]',data.condiciones);
   // Stripe conserva created de la sesión junto con la versión aceptada.
   // No variar parámetros en reintentos con la misma clave de idempotencia.
   const session=await stripe('checkout/sessions',p,'asesoria-'+u.id+'-'+Math.floor(Date.now()/86400000));
   return json({url:session.url});
  }
  return json({error:'Operación no disponible.'},400);
 }catch(e){console.error('Asesoria:',e instanceof Error?e.message:'Error');return json({error:'No se pudo completar la operación. Si has pagado, no repitas el pago; contacta con Granja Rentable.'},400);}
});
