/* Node 24 (type stripping): node blog/pruebas/test_asesoria_edge.cjs */
const assert=require('node:assert/strict'),{createHmac}=require('node:crypto');
(async()=>{
 const settings={SUPABASE_URL:'https://db.example.test',SUPABASE_SERVICE_ROLE_KEY:'TEST-SERVICE',SUPABASE_ANON_KEY:'TEST-ANON',STRIPE_SECRET_KEY:'TEST-STRIPE',STRIPE_WEBHOOK_SECRET:'TEST-WEBHOOK',ASESORIA_CHECKOUT_ENABLED:'true'};
 let handler,calls=[];
 global.Deno={env:{get:key=>settings[key]},serve:fn=>handler=fn};
 const {validSignature}=require('../../supabase/functions/asesoria/index.ts');
 const stamp=String(Math.floor(Date.now()/1000)),raw='{}';
 const signature=body=>'t='+stamp+',v1='+createHmac('sha256',settings.STRIPE_WEBHOOK_SECRET).update(stamp+'.'+body).digest('hex');
 assert(await validSignature(raw,signature(raw),settings.STRIPE_WEBHOOK_SECRET));
 assert(!await validSignature('changed',signature(raw),settings.STRIPE_WEBHOOK_SECRET));
 assert(!await validSignature(raw,signature(raw),settings.STRIPE_WEBHOOK_SECRET,Date.now()+600000));
 global.fetch=async(url,opts={})=>{calls.push({url,opts});if(url.endsWith('/auth/v1/user')&&opts.headers.Authorization==='Bearer INVALID')return new Response('{}',{status:401});let data={};if(url.endsWith('/auth/v1/user'))data={id:'u1',email:'test@example.test',email_confirmed_at:stamp};else if(url.includes('checkout/sessions?'))data={data:[{id:'cs_paid',metadata:{producto:'asesoria-30d-v1'}}]};else if(url.includes('checkout/sessions'))data={url:'https://checkout.stripe.com/c/pay/test'};else if(url.includes('/rpc/asesoria_activar_pago'))data='a1';else if(url.includes('/rest/v1/'))data=[];return new Response(JSON.stringify(data));};
 const req=(body,auth=true)=>new Request('https://edge.test/asesoria',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer TEST-USER'}:{})},body:JSON.stringify(body)});
 assert.equal((await handler(req({accion:'checkout'},false))).status,400);
 assert.equal((await handler(req({accion:'avisar'},false))).status,400);
 const invalidAuth=new Request('https://edge.test/asesoria',{method:'POST',headers:{Authorization:'Bearer INVALID','Content-Type':'application/json'},body:JSON.stringify({accion:'avisar'})});
 assert.equal((await handler(invalidAuth)).status,400,'Invalid bearer token is rejected by Supabase Auth');
 assert.equal(calls.filter(x=>x.url.includes('/rest/v1/')).length,0,'No database or notification operation before successful identity verification');
 assert.equal((await handler(req({accion:'checkout'}))).status,400);
 const checkout={accion:'checkout',condiciones:'asesoria-30d-v1'};
 assert.equal((await handler(req(checkout))).status,200);
 assert.equal((await handler(req(checkout))).status,200);
 const creates=calls.filter(x=>x.url==='https://api.stripe.com/v1/checkout/sessions');assert.equal(creates.length,2);
 assert.equal(creates[0].opts.body.toString(),creates[1].opts.body.toString(),'Stable idempotent parameters');
 assert.equal(creates[0].opts.body.get('line_items[0][price_data][unit_amount]'),'2900');
 const event={type:'checkout.session.completed',created:Number(stamp),data:{object:{id:'cs_paid',mode:'payment',payment_status:'paid',amount_total:2900,currency:'eur',metadata:{producto:'asesoria-30d-v1',usuario:'u1'}}}};
 async function webhook(value,signed=true){const body=JSON.stringify(value);return handler(new Request('https://edge.test/asesoria?webhook=stripe',{method:'POST',headers:{'stripe-signature':signed?signature(body):'invalid'},body}));}
 assert.equal((await webhook(event,false)).status,400);
 assert.equal((await webhook(event)).status,200);
 assert.equal(calls.filter(x=>x.url.includes('rpc/asesoria_activar_pago')).length,1);
 const wrong=structuredClone(event);wrong.data.object.amount_total=1;assert.equal((await webhook(wrong)).status,400);
 await webhook({type:'charge.refunded',data:{object:{refunded:true,payment_intent:'pi_test'}}});
 assert(calls.some(x=>x.opts.method==='PATCH'&&x.url.includes('pago=eq.cs_paid')));
 settings.ASESORIA_CHECKOUT_ENABLED='false';assert.equal((await handler(req(checkout))).status,503);
 console.log('PASS: webhook HMAC, replay tolerance, identity, server price, stable checkout retries, payment activation, invalid amount rejection and refund revocation.');
})().catch(e=>{console.error(e);process.exit(1)});
