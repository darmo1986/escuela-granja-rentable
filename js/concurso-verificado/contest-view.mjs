import {createVerifiedContest} from './contest-flow.mjs';

export function mountVerifiedContest({root, rpc, loginHref='cuenta.html', now, setTick=setInterval, clearTick=clearInterval, onFinished=()=>{}}) {
  const doc=root.ownerDocument;
  const host=doc.createElement('div'), live=doc.createElement('p'), stat=doc.createElement('p');
  live.setAttribute('role','status'); live.setAttribute('aria-live','polite');
  root.replaceChildren(live,stat,host);
  stat.setAttribute('aria-label','Tiempo restante');
  const add=(parent,tag,text)=>{const el=doc.createElement(tag);el.textContent=text;parent.append(el);return el};
  const button=(parent,text,fn)=>{const b=add(parent,'button',text);b.type='button';b.className='btn';b.addEventListener('click',fn);return b};
  let ticker, disposed=false, announcedAttempt=null;
  const game=createVerifiedContest({rpc,now,publish:render});
  function render(v) {
    if(disposed) return;
    if(ticker!==undefined){clearTick(ticker);ticker=undefined;}
    host.replaceChildren(); live.textContent=''; stat.textContent='';
    if(v.phase==='idle'){
      live.textContent='Partida que cuenta para el ranking mensual. Inicia sesión antes de empezar.';
      const a=add(host,'a','Iniciar sesión');a.setAttribute('href',loginHref);
      button(host,'Empezar o continuar',game.start);
    } else if(v.phase==='loading'){
      live.textContent='Comprobando la partida…';
    } else if(v.phase==='error'){
      live.textContent=v.message;
      if(v.kind==='contest_login_required'){
        const a=add(host,'a','Iniciar sesión');a.setAttribute('href',loginHref);
      }
      button(host,'Recuperar partida',game.recover);
    } else if(v.phase==='ready'){
      live.textContent='Respuesta registrada. El resultado se confirma al terminar.';
      button(host,'Siguiente pregunta',game.recover).focus();
    } else if(v.phase==='finished'){
      live.textContent=v.score===null?'Partida terminada. No se confirmó la marca.':'Partida terminada.';
      if(v.score!==null){
        const h=add(host,'h3',v.score+' de 100 aciertos'); h.tabIndex=-1; h.focus();
        if(v.meanMs!==null) add(host,'p','Tiempo medio: '+(v.meanMs/1000).toFixed(1).replace('.',',')+' s.');
        add(host,'p','El premio del mes se confirma después de verificar al ganador.');
        if(v.attempt!==announcedAttempt){announcedAttempt=v.attempt;onFinished(v);}
      } else button(host,'Comprobar resultado',game.recover);
    } else if(v.phase==='question'){
      add(host,'p','Pregunta '+v.position+' de 100 · '+v.category);
      const h=add(host,'h3',v.prompt);h.tabIndex=-1;h.focus();
      const options=doc.createElement('div');options.setAttribute('role','group');options.setAttribute('aria-label','Opciones de respuesta');host.append(options);
      const controls=v.choices.map((c,i)=>button(options,c,()=>game.answer(i+1)));
      const tick=()=>{
        const seconds=game.snapshot().seconds;
        if(seconds===undefined)return;
        stat.textContent=seconds+' s';
        if(seconds===0){
          controls.forEach(b=>{b.disabled=true;});
          game.answer(null);
        }
      };
      ticker=setTick(tick,250);
      tick();
    }
  }
  render(game.snapshot());
  return {unmount(){disposed=true;if(ticker!==undefined)clearTick(ticker);root.replaceChildren();}};
}
