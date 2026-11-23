import {mountVerifiedContest} from './contest-view.mjs';
import {loadVerifiedRanking,renderVerifiedRanking} from './contest-ranking.mjs';

export function initVerifiedContest({
  document:doc, client, mountGame=mountVerifiedContest, loadRanking=loadVerifiedRanking,
  paintRanking=renderVerifiedRanking, defer=fn=>setTimeout(fn,0), cancelDeferred=clearTimeout
}) {
  // No session checks, rendering, or RPC while the rollout is disabled.
  if(doc.body.dataset.concursoVerificado!=='on') return null;
  const play=doc.getElementById('concurso-verificado-juego');
  const rank=doc.getElementById('concurso-verificado-ranking');
  const retry=doc.getElementById('concurso-verificado-recargar');
  if(!play||!rank||!retry)return null;
  let destroyed=false, game=null, gameUser=null, sessionUser=null, sessionKnown=false;
  let sessionFailed=false, rankState=null, rankBusy=false, authRevision=0, rankRevision=0, subscription=null;
  let deferred;
  const label='No se pudo comprobar el concurso verificado. Puedes practicar sin premio.';
  const status=(text, withLogin=false)=>{
    const p=doc.createElement('p');
    p.setAttribute('role','status');
    p.textContent=text;
    play.replaceChildren(p);
    if(withLogin){
      const login=doc.createElement('a');
      login.href='cuenta.html'; login.textContent='Iniciar sesión';
      play.append(login);
    }
  };
  const detach=()=>{
    if(game){game.unmount();game=null;}
    gameUser=null;
  };
  const rpc=async (name,args)=>{
    if(destroyed) return {data:null,error:{message:'contest_closed'}};
    if(name==='concurso_verificado_ranking') return client.rpc(name);
    return client.rpc(name,args);
  };
  const renderPlay=()=>{
    if(destroyed)return;
    if(rankState!=='open'){
      detach();
      status(rankState==='closed' ? 'El concurso verificado no está abierto. Puedes practicar sin premio.' :
        rankState==='error' ? label : 'Comprobando la disponibilidad del concurso…');
      return;
    }
    if(!sessionUser){
      detach();
      if(sessionFailed) status('No se pudo comprobar tu sesión. Vuelve a iniciar sesión para participar.',true);
      else if(sessionKnown) status('Inicia sesión antes de jugar por el premio o de continuar tu partida.',true);
      else status('Comprobando tu sesión…');
      return;
    }
    if(gameUser===sessionUser&&game)return;
    detach();
    gameUser=sessionUser;
    // The client session is for UX only; the server verifies each attempt/answer.
    const currentUser=gameUser;
    game=mountGame({root:play,rpc:async (name,args)=>{
      if(destroyed||sessionUser!==currentUser) return {data:null,error:{message:'contest_login_required'}};
      return rpc(name,args);
    },loginHref:'cuenta.html',onFinished:()=>{void refreshRanking();}});
  };
  const refreshRanking=async ()=>{
    if(destroyed||rankBusy||!client)return;
    rankBusy=true;retry.disabled=true;
    const rev=++rankRevision;
    if(rankState===null)rank.textContent='Cargando clasificación verificada…';
    try {
      const model=await loadRanking(rpc);
      if(destroyed||rev!==rankRevision)return;
      rankState=model.status;
      paintRanking(rank,model);
      renderPlay();
    } catch {
      if(destroyed||rev!==rankRevision)return;
      // A refresh failure must not erase a player's existing result.
      if(rankState!=='open')rankState='error';
      paintRanking(rank,null);
      renderPlay();
    } finally {
      if(!destroyed&&rev===rankRevision){rankBusy=false;retry.disabled=false;}
    }
  };
  if(!client?.auth?.getSession||!client?.rpc){
    status(label); paintRanking(rank,null); return null;
  }
  const applySession=(session, failed=false)=>{
    if(destroyed)return;
    sessionUser=typeof session?.user?.id==='string'&&session.user.id?session.user.id:null;
    sessionKnown=true;
    sessionFailed=failed;
    renderPlay();
  };
  retry.hidden=false;
  retry.addEventListener('click',refreshRanking);
  try {
    subscription=client.auth.onAuthStateChange?.((_event,session)=>{
      const rev=++authRevision;
      if(deferred!==undefined)cancelDeferred(deferred);
      // Leave Supabase's callback before re-rendering or making API calls.
      deferred=defer(()=>{deferred=undefined;if(rev===authRevision)applySession(session);});
    })?.data?.subscription??null;
  } catch { subscription=null; }
  const authLoadRevision=authRevision;
  Promise.resolve().then(()=>client.auth.getSession()).then(({data,error}={})=>{
    if(authRevision===authLoadRevision)applySession(error?null:data?.session,Boolean(error));
  }).catch(()=>{if(authRevision===authLoadRevision)applySession(null,true);});
  void refreshRanking();
  return {destroy(){
    destroyed=true;rankRevision++;authRevision++;
    subscription?.unsubscribe();
    if(deferred!==undefined)cancelDeferred(deferred);
    retry.removeEventListener('click',refreshRanking);
    detach();
  }};
}
