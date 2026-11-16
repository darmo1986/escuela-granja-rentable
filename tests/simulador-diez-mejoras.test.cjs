const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../js/granja-motor.js');

test('1. el dueño se mueve por cinco zonas y no sale del corral',()=>{
 const s=M.fresh(0);assert.equal(s.owner.pos,2);
 for(let i=0;i<8;i++)M.action(s,'moveOwner','left');
 assert.equal(s.owner.pos,0);
 for(let i=0;i<8;i++)M.action(s,'moveOwner','right');
 assert.equal(s.owner.pos,4);
 assert.equal(M.restore(JSON.stringify(s),0).owner.pos,4);
});
test('2 y 3. vida del depredador y alcance aumentable del dueño',()=>{
 const s=M.fresh(0);s.pending={type:'ground',hp:3,lane:4};
 assert.match(M.action(s,'ownerAttack'),/fuera de alcance/);
 assert.equal(s.owner.energy,3);
 s.owner.level=3;s.owner.pos=2;
 assert.notMatch(M.action(s,'ownerAttack'),/fuera de alcance/);
 assert.ok(!s.pending||s.pending.hp>=1&&s.pending.hp<=3);
 const old=M.fresh(0);old.pending={type:'air'};delete old.owner.pos;
 const migrated=M.restore(JSON.stringify(old),0);
 assert.deepEqual(migrated.pending,{type:'air',hp:3,lane:2});
 assert.equal(migrated.owner.pos,2);
});
test('4. el mercado cambia tres veces por día simulado',()=>{
 const s=M.fresh(0),scale=M.clockScale(s);
 M.advance(s,8*M.HOUR/scale);
 assert.equal(s.hour,8);assert.ok(s.eggPrice>=.19&&s.eggPrice<=.34);
 M.advance(s,16*M.HOUR/scale);
 assert.equal(s.hour,16);assert.ok(s.eggPrice>=.19&&s.eggPrice<=.34);
 M.advance(s,24*M.HOUR/scale);
 assert.equal(s.day,1);
});
test('5. comprar tres pollitas es atómico y respeta plazas',()=>{
 const s=M.fresh(0);s.money=200;const b=s.money;
 assert.match(M.action(s,'buyHenThree','brown'),/tres pollitas/);
 assert.equal(M.count(s),7);assert.equal(s.money,b-54);
 assert.match(M.action(s,'buyHenThree','brown'),/tres pollitas/);
 assert.equal(M.count(s),10);const before=JSON.stringify(s);
 assert.match(M.action(s,'buyHenThree','brown'),/plazas/);assert.equal(JSON.stringify(s),before);
});
test('6. kit comedero y bebedero no cobra si falta dinero',()=>{
 const s=M.fresh(0);s.money=21;const b=JSON.stringify(s);
 assert.match(M.action(s,'installPair'),/Saldo insuficiente/);assert.equal(JSON.stringify(s),b);
 s.money=22;M.action(s,'installPair');assert.equal(s.money,0);
 assert.equal(s.facilities.feeder,2);assert.equal(s.facilities.waterer,2);
});
test('7. compra de agua de 100 litros',()=>{
 const s=M.fresh(0);s.water=0;const b=s.money;
 assert.match(M.action(s,'waterBulk'),/100 litros/);
 assert.equal(s.water,100);assert.equal(s.money,b-2);
});
test('8. recogida y venta de huevos en una operación',()=>{
 const s=M.fresh(0);s.nest=7;s.nestLots=[{count:7,day:0}];
 const b=s.money;assert.match(M.action(s,'collectAndSell'),/ingresaste/);
 assert.equal(s.eggs,0);assert.equal(s.nest,0);assert.equal(s.money,b+7*s.eggPrice);
});
test('9. compra de pienso de 30 kg sin saldo negativo',()=>{
 const s=M.fresh(0);s.money=14.4;s.feed=0;
 assert.match(M.action(s,'feedBulk','layer'),/30 kg/);
 assert.equal(s.feed,30);assert.ok(s.money>=0&&s.money<.00001);
});
test('10. panel táctico está conectado con la escena',()=>{
 const fs=require('node:fs'),p=require('node:path'),root=p.resolve(__dirname,'..');
 const html=fs.readFileSync(p.join(root,'simulador-granja.html'),'utf8');
 const scene=fs.readFileSync(p.join(root,'js/granja-escena.js'),'utf8');
 for(const id of ['owner-position','enemy-health','market-next'])assert.ok(html.includes('id="'+id+'"'));
 assert.match(scene,/farmer\.style\.left/);
 assert.match(scene,/pending\.hp/);
});
