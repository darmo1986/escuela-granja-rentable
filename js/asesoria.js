(function(){
 'use strict';
 var $=id=>document.getElementById(id), sb, user, admin=false, access=null, threads=[], current=null, plan='', revision='', generation=0, sessionGeneration=0;
 var cfg=(window.GR&&GR.asesoria)||{};
 var questions=[['objetivo','1. ¿Qué quieres conseguir con tu granja?','Por ejemplo: empezar con ponedoras, mejorar el manejo o controlar costes.'],['ubicacion','2. ¿En qué zona y clima está tu granja?','País, región y condiciones habituales. No necesitamos tu dirección.'],['aves','3. ¿Qué aves y cuántas tienes?','Especie, raza o línea y número por lote.'],['edad','4. ¿Qué edad y etapa tienen?','Distingue pollitos, recría, engorde o puesta.'],['alojamiento','5. ¿Cómo es su alojamiento?','Superficie, corral, ventilación, sombra, nidales y perchas.'],['alimentacion','6. ¿Qué comen actualmente?','Nombre del pienso y datos de su etiqueta; otros alimentos y suplementos.'],['cantidad','7. ¿Cuánto pienso consumes y cómo lo repartes?','Cantidad diaria del lote, número de aves y desperdicio observado. Si no lo sabes, indícalo.'],['agua','8. ¿Cómo les suministras agua?','Bebederos, disponibilidad y rutina de limpieza.'],['rutina','9. ¿Qué cuidados y registros llevas?','Limpieza, puesta, peso, gastos y cambios recientes.'],['problema','10. ¿Qué problema quieres abordar primero?','Qué ocurre, desde cuándo y qué has probado.']];
 function status(t,error){$('ap-status').textContent=t;$('ap-status').dataset.error=!!error;}
 function fail(e){status(e.message||'No se pudo conectar. Vuelve a intentarlo.',true);}
 function check(r){if(r.error)throw r.error;return r.data;}
 function date(v){return new Date(v).toLocaleString('es-ES',{dateStyle:'medium',timeStyle:'short'});}
 function active(){return access&&!access.revocado&&Date.now()>=Date.parse(access.inicio)&&Date.now()<Date.parse(access.fin);}
 function node(tag,text,cls){var n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
 async function api(action){var session=check(await sb.auth.getSession()).session;if(!session)throw Error('Entra en tu cuenta.');var r=await fetch(cfg.endpoint,{method:'POST',headers:{Authorization:'Bearer '+session.access_token,apikey:GR.comunidad.supabaseAnonKey,'Content-Type':'application/json'},body:JSON.stringify({accion:action,condiciones:action==='checkout'&&$('ap-accept').checked?'asesoria-30d-v1':''})});var d=await r.json();if(!r.ok||d.error)throw Error(d.error||'Servicio no disponible.');return d;}
 async function notify(){try{var d=await api('avisar');if(d.pendiente)status('Guardado en el área privada. El aviso por correo queda pendiente.');}catch(e){status('Guardado en el área privada. No se ha podido confirmar el aviso por correo.');}}
 function tab(name){document.querySelectorAll('[data-ap-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.apTab===name)));document.querySelectorAll('[data-ap-pane]').forEach(p=>p.hidden=p.dataset.apPane!==name);}
 document.querySelectorAll('[data-ap-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.apTab)));
 questions.forEach(q=>{var label=node('label',q[1]), field=node('textarea');field.name=q[0];field.maxLength=2000;field.required=true;field.rows=3;field.placeholder=q[2];field.addEventListener('input',progress);label.append(field);$('ap-fields').append(label);});
 function progress(){var count=questions.filter(q=>$('ap-ficha').elements[q[0]].value.trim()).length;$('ap-progress').value=count;$('ap-progress-text').textContent=count+' de 10 respuestas completas';}
 async function busy(button,fn){button.disabled=true;try{await fn();}catch(e){fail(e);}finally{button.disabled=false;}}
 function reset(){generation++;access=null;threads=[];current=null;plan='';revision='';$('ap-workspace').hidden=true;$('ap-admin').hidden=true;$('ap-no-access').hidden=true;$('ap-ficha').reset();$('ap-plan-text').textContent='';$('ap-messages').replaceChildren();$('ap-thread-list').replaceChildren();$('ap-plan-editor').value='';progress();}
 async function load(){var ticket=++generation;status('Consultando tu área privada…');var data=check(await sb.from('asesoria_accesos').select('*').order('inicio',{ascending:false}));if(ticket!==generation)return;
 if(!data.length){$('ap-workspace').hidden=true;$('ap-no-access').hidden=false;status('Tu cuenta todavía no tiene un acompañamiento activado.');return;}
 $('ap-no-access').hidden=true;
 if(admin){var clients=check(await sb.rpc('asesoria_clientes'));if(ticket!==generation)return;$('ap-admin').hidden=false;var selector=$('ap-access-select'),previous=selector.value;selector.replaceChildren();data.forEach(a=>{var c=clients.find(c=>c.id===a.id)||{},o=node('option',(c.nombre||'Cliente')+' · '+(c.correo||a.usuario.slice(0,8))+' · '+date(a.inicio)+(a.revocado?' · Revocado':''));o.value=a.id;selector.append(o);});if(data.some(a=>a.id===previous))selector.value=previous;access=data.find(a=>a.id===selector.value)||data[0];}
 else access=data.find(a=>!a.revocado&&Date.parse(a.fin)>Date.now())||data[0];
 await loadAccess(ticket);
 }
 async function loadAccess(ticket){var id=access.id;var results=await Promise.all([sb.from('asesoria_fichas').select('*').eq('acceso',id).maybeSingle(),sb.from('asesoria_planes').select('*').eq('acceso',id).maybeSingle(),sb.from('asesoria_consultas').select('*').eq('acceso',id).order('creado',{ascending:false})]);var ficha=check(results[0]),p=check(results[1]),ts=check(results[2]);if(ticket!==generation)return;
 threads=ts;plan=p?p.contenido:'';revision=p?p.actualizado:'';$('ap-workspace').hidden=false;$('ap-no-access').hidden=admin||active();
 $('ap-access-state').textContent=access.revocado?'Acceso revocado':active()?'Seguimiento activo':'Seguimiento finalizado';
 $('ap-dates').textContent='Del '+date(access.inicio)+' al '+date(access.fin)+'. '+threads.length+' de '+access.limite+' consultas abiertas.';
 questions.forEach(q=>{$('ap-ficha').elements[q[0]].value=ficha?ficha.respuestas[q[0]]||'':'';$('ap-ficha').elements[q[0]].disabled=admin||!active();});progress();
 $('ap-save-ficha').hidden=admin||!active();$('ap-plan-admin').hidden=!admin;$('ap-new-consulta').hidden=admin||!active()||!ficha||threads.length>=access.limite;
 $('ap-no-ficha').hidden=!!ficha||admin;$('ap-plan-text').textContent=plan;$('ap-plan-empty').hidden=!!plan;$('ap-download').disabled=!plan;$('ap-plan-editor').value=plan;
 $('ap-plan-date').textContent=revision?'Última actualización: '+date(revision):'';
 renderThreads();current=threads.some(t=>t.id===current)?current:threads[0]?.id||null;await showThread(current,ticket);
 tab(!ficha&&!admin?'ficha':'plan');status(active()||admin?'Área privada actualizada.':'Tu seguimiento ha finalizado. Puedes consultar y descargar tu plan y leer el historial.');
 }
 function renderThreads(){var list=$('ap-thread-list');list.replaceChildren();threads.forEach(t=>{var b=node('button',t.titulo);b.type='button';b.setAttribute('aria-current',String(t.id===current));b.append(node('span',date(t.creado),'thread-meta'));b.onclick=()=>showThread(t.id,generation).catch(fail);list.append(b);});if(!threads.length)list.append(node('p','Todavía no hay consultas.'))}
 async function showThread(id,ticket){current=id;renderThreads();$('ap-reply').hidden=!id||(!admin&&!active());$('ap-messages').replaceChildren();$('ap-thread-title').textContent=threads.find(t=>t.id===id)?.titulo||'Tu conversación con el asesor';$('ap-wait').textContent='';if(!id)return;
 var messages=check(await sb.from('asesoria_mensajes').select('*').eq('consulta',id).order('creado',{ascending:true}));if(ticket!==generation||id!==current)return;
 var container=$('ap-messages');messages.forEach(m=>{var b=node('div',m.texto,'bubble'+(m.asesor?' adviser':''));b.append(node('small',(m.asesor?'Granja Rentable':'Cliente')+' · '+date(m.creado)));container.append(b);});container.scrollTop=container.scrollHeight;
 var lastAdviser=-1;messages.forEach((m,i)=>{if(m.asesor)lastAdviser=i;});var pending=messages.slice(lastAdviser+1).find(m=>!m.asesor);if(pending){var due=Date.parse(pending.creado)+86400000;$('ap-wait').textContent=(Date.now()>due?'Respuesta pendiente desde ':'Respuesta prevista antes del ')+date(due)+'.';}
 }
 $('ap-ficha').onsubmit=ev=>{ev.preventDefault();busy($('ap-save-ficha'),async()=>{var answers={};questions.forEach(q=>answers[q[0]]=$('ap-ficha').elements[q[0]].value.trim());check(await sb.rpc('asesoria_guardar_ficha',{p_acceso:access.id,p_respuestas:answers}));await load();status('Tus diez respuestas se han guardado. El asesor ya puede revisarlas.');await notify();});};
 $('ap-new-consulta').onsubmit=ev=>{ev.preventDefault();busy($('ap-open-thread'),async()=>{var f=ev.target;current=check(await sb.rpc('asesoria_abrir_consulta',{p_acceso:access.id,p_titulo:f.elements.titulo.value.trim(),p_texto:f.elements.texto.value.trim()}));f.reset();await load();tab('chat');status('Consulta enviada. Recibirás respuesta en un máximo de 24 horas.');await notify();});};
 $('ap-reply').onsubmit=ev=>{ev.preventDefault();busy($('ap-send'),async()=>{check(await sb.rpc('asesoria_responder',{p_consulta:current,p_texto:$('ap-reply-text').value.trim()}));$('ap-reply-text').value='';await showThread(current,generation);status('Mensaje guardado en la conversación.');await notify();});};
 $('ap-plan-admin').onsubmit=ev=>{ev.preventDefault();busy($('ap-publish'),async()=>{check(await sb.rpc('asesoria_publicar_plan',{p_acceso:access.id,p_contenido:$('ap-plan-editor').value.trim()}));await load();status('Plan publicado. El cliente puede consultarlo y descargarlo.');await notify();});};
 $('ap-access-select').onchange=()=>load().catch(fail);
 $('ap-refresh').onclick=()=>busy($('ap-refresh'),async()=>{await load();await notify();});
 $('ap-login').onclick=()=>GRAuth.abrir('entrar');
 $('ap-pay').onclick=()=>busy($('ap-pay'),async()=>{if(!$('ap-accept').checked)throw Error('Lee y acepta las condiciones del servicio antes de pagar.');var d=await api('checkout');var url=new URL(d.url);if(url.protocol!=='https:'||url.hostname!=='checkout.stripe.com')throw Error('Página de pago no válida.');location.assign(url.href);});
 $('ap-download').onclick=()=>busy($('ap-download'),download);
 async function download(){
  if(!plan||!window.PDFLib)throw Error('El plan o el generador de PDF no está disponible. Recarga la página.');
  var pdf=await PDFLib.PDFDocument.create(),font=await pdf.embedFont(PDFLib.StandardFonts.Helvetica),bold=await pdf.embedFont(PDFLib.StandardFonts.HelveticaBold),page,y;
  pdf.setTitle('Plan de acción · Granja Rentable');pdf.setAuthor('Granja Rentable');
  function newPage(){page=pdf.addPage([595.28,841.89]);y=785;page.drawText('GRANJA RENTABLE',{x:48,y,size:12,font:bold,color:PDFLib.rgb(.09,.27,.17)});y-=32;page.drawText('Plan de acción personalizado',{x:48,y,size:19,font:bold});y-=26;}
  function safe(s){return Array.from(s).map(c=>{try{font.encodeText(c);return c;}catch(e){return '?';}}).join('');}
  function line(text,size){if(y<65)newPage();page.drawText(safe(text),{x:48,y,size:size||11,font});y-=17;}
  newPage();line('Seguimiento: '+date(access.inicio)+' - '+date(access.fin),9);line('Actualizado: '+date(revision),9);y-=15;
  for(var paragraph of plan.split('\n')){var output='';for(var word of safe(paragraph).split(/\s+/)){if(font.widthOfTextAtSize(output?output+' '+word:word,11)>495&&output){line(output);output='';}while(font.widthOfTextAtSize(word,11)>495){var part='';while(word&&font.widthOfTextAtSize(part+word[0],11)<490){part+=word[0];word=word.slice(1);}if(output){line(output);output='';}line(part);}output+=(output?' ':'')+word;}line(output);}
  y-=12;line('Orientación sobre alimentación y manejo. No sustituye al veterinario.',9);
  var bytes=await pdf.save(),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),link=node('a');link.href=url;link.download='plan-accion-granja-rentable.pdf';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);status('PDF generado con la última versión de tu plan.');
 }
 async function init(){
  if(!cfg.activa){$('ap-login-box').hidden=true;status('Estamos preparando el área privada. Las nuevas altas desde este panel todavía no están abiertas.');return;}
  if(!window.GRAuth){status('No se pudo cargar el acceso. Recarga la página.',true);return;}
  sb=await GRAuth.cliente();if(!sb)throw Error('No se pudo conectar con el área privada.');
  async function session(){var authTicket=++sessionGeneration;var me=check(await sb.auth.getUser());if(authTicket!==sessionGeneration)return;user=me?.user;if(!user){admin=false;reset();$('ap-login-box').hidden=false;return;}reset();$('ap-login-box').hidden=true;var role=check(await sb.rpc('es_admin_actual'));if(authTicket!==sessionGeneration)return;admin=!!role;await load();}
  // GRAuth emite también al refrescar la sesión. No duplicamos clientes Auth.
  window.addEventListener('gr-auth',()=>{if(!GRAuth.usuario()){sessionGeneration++;user=null;admin=false;reset();$('ap-login-box').hidden=false;status('Has salido de tu área privada.');}else session().catch(fail);});
  var s=check(await sb.auth.getSession());if(s.session)await session();else status('Entra con tu cuenta para consultar tu acompañamiento.');
 }
 if(new URLSearchParams(location.search).get('pago')==='recibido')$('ap-payment-note').hidden=false;
 init().catch(fail);
})();
