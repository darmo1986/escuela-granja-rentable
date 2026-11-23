import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createVerifiedContest} from './contest-flow.mjs';
function fixture(){
  let t=0, starts=0, position=1, answers=[], fail=false;
  const end={attempt_id:'staging-local',status:'finished',score:98,mean_ms:6900,total:100};
  const calls=[];
  const game=createVerifiedContest({now:()=>t,publish(){},rpc:async(name,args)=>{
    calls.push([name,args]);
    if(name.endsWith('_empezar')){
      starts++;
      return {data:position>100?end:{attempt_id:'staging-local',status:'ready'}};
    }
    if(name.endsWith('_pregunta')){
      return {data:position>100?end:{status:'question',total:100,position,category:'Prueba',prompt:'Pregunta de prueba '+position,choices:['a','b','c','d'],deadline:'2026-11-23T09:00:30Z',server_now:'2026-11-23T09:00:00Z'}};
    }
    if(name.endsWith('_responder')){
      assert.equal(args.p_position,position);
      answers.push(args.p_choice);++position;
      if(fail){fail=false;throw Error('respuesta perdida tras confirmar');}
      return {data:position>100?end:{status:'ready'}};
    }
    throw Error(name);
  }});
  return {game,calls,answers,end,time(n){t+=n},loseResponse(){fail=true},get starts(){return starts;}};
}
test('100 preguntas, 30 s, recuperación sin reenviar, resultado procedente del servidor',async()=>{
  const f=fixture(), g=f.game;
  await g.start();
  assert.equal(g.snapshot().position,1);
  assert.equal(g.snapshot().seconds,30);
  await g.answer(null);assert.equal(f.answers.length,0);
  f.time(30000);await g.answer(1);await g.answer(null);
  assert.deepEqual(f.answers,[null]);assert.equal(g.snapshot().phase,'ready');await g.recover();
  f.loseResponse();await g.answer(2);assert.equal(g.snapshot().phase,'error');
  await g.recover();assert.equal(g.snapshot().position,3);assert.equal(f.answers.length,2);
  for(let i=3;i<=100;i++){assert.equal(g.snapshot().position,i);await g.answer(3);if(i!==100)await g.recover();}
  assert.equal(g.snapshot().score,98);assert.equal(g.snapshot().meanMs,6900);assert.equal(f.answers.length,100);
  await g.start();assert.equal(g.snapshot().phase,'finished');assert.equal(f.starts,2);
  assert.ok(f.calls.every(([_,arg])=>!arg||!('score' in arg)&&!('mean_ms' in arg)&&!('deadline' in arg)));
});
test('si no se confirma el inicio se puede recuperar y no se afirma marca guardada',async()=>{
  const g=createVerifiedContest({rpc:async()=>({error:{code:'mock'}}),publish(){}});
  await g.start();assert.equal(g.snapshot().phase,'error');assert.equal(g.snapshot().attempt,null);
  await g.recover();assert.equal(g.snapshot().phase,'error');
});
