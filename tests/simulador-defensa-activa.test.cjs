const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../js/granja-motor.js');

test('el dueño tiene energía, experiencia y ataque real contra amenazas',()=>{
  const s=M.fresh(0);
  assert.deepEqual(s.owner,{level:1,energy:3,xp:0,pos:2});
  assert.match(M.action(s,'ownerAttack'),/No hay amenaza/);
  assert.equal(s.owner.energy,3);
  s.pending={type:'ground'};
  for(let i=0;i<3&&s.pending;i++)M.action(s,'ownerAttack');
  assert.ok(s.owner.energy>=0&&s.owner.energy<=2);
  assert.match(M.action(s,'ownerAttack'),/agotado|No hay amenaza|fuera de alcance|Impacto|falló|Ataque defendido/);
  assert.ok(!s.pending||['ground','air'].includes(s.pending.type));
});

test('la energía se recupera al cambiar de día y guarda el nivel',()=>{
  const s=M.fresh(0);
  s.owner={level:3,energy:0,xp:2,pos:2};
  M.advance(s,s.last+M.DAY/3);
  assert.equal(s.owner.energy,3);
  assert.equal(s.owner.level,3);
  assert.deepEqual(M.restore(JSON.stringify(s),s.last).owner,s.owner);
});

test('las partidas antiguas reciben personaje y niveles sin reiniciarse',()=>{
  const s=M.fresh(0);
  s.money=1000;
  M.action(s,'upgrade','dog');
  delete s.owner;
  delete s.defenders[0].level;
  const r=M.restore(JSON.stringify(s),0);
  assert.equal(r.money,s.money);
  assert.deepEqual(r.owner,{level:1,energy:3,xp:0,pos:2});
  assert.equal(r.defenders[0].level,1);
});

test('entrenar defensores cuesta dinero y aumenta protección',()=>{
  const s=M.fresh(0);
  s.money=1000;
  M.action(s,'upgrade','dog');
  assert.equal(s.money,955);
  const before=M.threats(s).ground;
  assert.match(M.action(s,'upgradeDefender',0),/nivel 2/);
  assert.equal(s.money,949);
  assert.ok(M.threats(s).ground<before);
  assert.match(M.action(s,'upgradeDefender',0),/nivel 3/);
  assert.match(M.action(s,'upgradeDefender',0),/máximo/);
  assert.equal(s.defenders[0].level,3);
});

test('un dueño mejora solo con victorias y saldo suficiente',()=>{
  const s=M.fresh(0);
  assert.match(M.action(s,'upgradeOwner'),/experiencia/);
  s.owner.xp=1;
  assert.match(M.action(s,'upgradeOwner'),/nivel 2/);
  assert.equal(s.owner.level,2);
  assert.equal(s.money,170);
});

test('datos adulterados de personaje o defensor no provocan niveles ilegales',()=>{
  const s=M.fresh(0);s.owner.energy=-10;
  assert.deepEqual(M.restore(JSON.stringify(s),0),M.fresh(0));
  const d=M.fresh(0);M.action(d,'upgrade','guard');d.defenders[0].level=99;
  assert.deepEqual(M.restore(JSON.stringify(d),0),M.fresh(0));
});
