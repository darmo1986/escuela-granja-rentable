const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../js/granja-motor.js');

test('la reposición en una operación respeta el presupuesto y las reservas',()=>{
  const s=M.fresh(0);s.feed=0;s.youngFeed=0;s.water=0;s.money=100;
  const before=s.money;
  const result=M.action(s,'restockEssentials');
  assert.match(result,/Reposición completa/);
  assert.equal(s.feed,0);
  assert.equal(s.youngFeed,10);
  assert.equal(s.water,20);
  assert.ok(s.money<before&&s.money>=0);
  assert.equal(s.expenses,before-s.money);
  assert.match(M.action(s,'restockEssentials'),/ya cubren/);
});

test('si falta dinero la compra conjunta es atómica y no crea recursos',()=>{
  const s=M.fresh(0);s.money=1;s.youngFeed=0;s.water=0;
  const before=JSON.stringify(s);
  assert.match(M.action(s,'restockEssentials'),/Saldo insuficiente/);
  assert.equal(JSON.stringify(s),before);
});

test('los lotes mixtos reciben pienso propio y agua sin comprar innecesario',()=>{
  const s=M.fresh(0);s.money=1000;s.hens[0].age=250;s.hens.push({breed:'sussex',count:2,age:145,health:100,quarantine:0,isolated:false});
  s.feed=0;s.youngFeed=0;s.water=0;
  assert.match(M.action(s,'restockEssentials'),/Reposición completa/);
  assert.equal(s.feed,10);assert.equal(s.youngFeed,10);assert.equal(s.water,20);
  assert.deepEqual(M.restore(JSON.stringify(s),s.last),s);
});

test('la mejora automática de defensa no necesita intervención del jugador',()=>{
  const s=M.fresh(0);s.money=1000;
  M.action(s,'upgrade','dog');
  const before=M.threats(s);
  M.action(s,'upgradeDefender',0);
  const after=M.threats(s);
  assert.ok(after.ground<before.ground);
  assert.equal(s.defenders[0].level,2);
});
