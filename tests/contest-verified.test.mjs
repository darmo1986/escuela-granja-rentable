import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const migration = process.argv[2] || new URL('./20261123091500_concurso_verificado.sql', import.meta.url);
const alice = '10000000-0000-4000-8000-000000000001';
const bob = '10000000-0000-4000-8000-000000000002';
const unsafe = '10000000-0000-4000-8000-000000000003';
await db.exec(`
create role anon;
create role authenticated;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
 select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create table public.ranking_mensual (user_id uuid, aciertos integer, tiempo_medio numeric);
insert into public.ranking_mensual values ('${unsafe}', 100, 0);
`);
await db.query('insert into auth.users values ($1),($2),($3)', [alice, bob, unsafe]);
await db.exec(await readFile(migration, 'utf8'));
const rpc = async (fn, args = []) => (await db.query(
  `select public.concurso_verificado_${fn}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as data`, args
)).rows[0].data;
const user = async id => {
  await db.exec('reset role;');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec('set role authenticated;');
};
const admin = () => db.exec('reset role;');
const month = (await db.query("select concurso_verificado.madrid_month(clock_timestamp())::text as month")).rows[0].month;
const boundary = await db.query(`select
  concurso_verificado.madrid_month('2026-11-30 22:59:59+00')::text as before,
  concurso_verificado.madrid_month('2026-11-30 23:00:00+00')::text as after,
  concurso_verificado.month_end('2026-07-01') = '2026-07-31 22:00:00+00'::timestamptz as summer`);
assert.deepEqual(boundary.rows[0], {before:'2026-11-01',after:'2026-12-01',summer:true});
await db.exec('set role anon');
assert.equal((await rpc('ranking')).status, 'closed');
await assert.rejects(rpc('empezar'), /permission denied/);
await user(alice);
await assert.rejects(rpc('empezar'), /contest_closed/);
await admin();
const perms = (await db.query(`select
 has_schema_privilege('authenticated','concurso_verificado','usage') as usage,
 has_table_privilege('authenticated','concurso_verificado.bank','select') as bank,
 has_table_privilege('authenticated','concurso_verificado.attempts','insert') as insert`)).rows[0];
assert.deepEqual(perms, {usage:false,bank:false,insert:false});
await admin();
await db.query('insert into concurso_verificado.periods(period, enabled) values ($1,true)', [month]);
await user(alice);
await assert.rejects(rpc('empezar'), /contest_bank_unavailable/);
await admin();
await db.query(`insert into concurso_verificado.bank(period, category, prompt, choices, correct_choice, explanation)
select $1,'Fixture', 'Pregunta ficticia ' || n, array['Correcta fixture','Otra b','Otra c','Otra d'],1,'Explicación ficticia'
from generate_series(1,100) as n`, [month]);
await user(alice);
const start = await rpc('empezar');
assert.equal(start.status,'ready');
assert.equal((await rpc('empezar')).attempt_id,start.attempt_id);
const first = await rpc('pregunta',[start.attempt_id]);
const reload = await rpc('pregunta',[start.attempt_id]);
assert.deepEqual(Object.keys(first).sort(),
 ['attempt_id','status','position','total','category','prompt','choices','deadline','server_now'].sort());
assert.equal(first.deadline,reload.deadline);
assert.deepEqual(first.choices,reload.choices);
assert.equal(Date.parse(first.deadline)-Date.parse(first.server_now),30000);
await assert.rejects(rpc('responder',[start.attempt_id,1,null]), /contest_timer_running/);
await assert.rejects(rpc('responder',[start.attempt_id,2,1]), /contest_invalid_position/);
await user(bob);
await assert.rejects(rpc('pregunta',[start.attempt_id]), /contest_attempt_not_found/);
await assert.rejects(rpc('responder',[start.attempt_id,1,1]), /contest_attempt_not_found/);
await admin();
await db.query("update concurso_verificado.items set issued_at=clock_timestamp()-interval '31 seconds' where attempt_id=$1 and position=1",[start.attempt_id]);
await user(alice);
const expired = await rpc('pregunta',[start.attempt_id]);
assert.ok(Date.parse(expired.deadline)<=Date.parse(expired.server_now));
const timeout = await rpc('responder',[start.attempt_id,1,null]);
assert.equal(timeout.answered,1);
assert.ok(!Object.hasOwn(timeout,'score'));
assert.deepEqual(await rpc('responder',[start.attempt_id,1,null]),timeout);
assert.deepEqual((await rpc('ranking')).rows,[]);
let result;
const seen = new Set([first.prompt]);
for (let i=2; i<=100; i++){
  const q=await rpc('pregunta',[start.attempt_id]);seen.add(q.prompt);
  assert.equal(q.position,i);assert.equal(q.choices.length,4);
  result=await rpc('responder',[start.attempt_id,i,q.choices.indexOf('Correcta fixture')+1]);
  if(i<100) assert.ok(!Object.hasOwn(result,'score'));
}
assert.equal(seen.size,100);
assert.equal(result.score,99);
assert.equal(result.status,'finished');
assert.ok(result.mean_ms>=300);
assert.deepEqual(await rpc('pregunta',[start.attempt_id]),result);
assert.deepEqual(await rpc('empezar'),result);
const ranking = await rpc('ranking');
assert.equal(ranking.rows[0].score,99);
assert.deepEqual(Object.keys(ranking.rows[0]).sort(),['alias','mean_ms','rank','score']);
assert.match(ranking.rows[0].alias,/^Jugador [0-9a-f]{12}$/);
await admin();
await db.query(`insert into concurso_verificado.bank(period, category, prompt, choices, correct_choice, explanation)
select $1,'Fixture', 'Pregunta ficticia ' || n, array['Correcta fixture','Otra b','Otra c','Otra d'],1,'Explicación ficticia'
from generate_series(101,200) as n`, [month]);
await user(alice);
const repeat=await rpc('empezar');assert.notEqual(repeat.attempt_id,start.attempt_id);
await admin();
const overlap=await db.query(`select count(*)::int as n from concurso_verificado.items one join concurso_verificado.items two on one.bank_id=two.bank_id and two.attempt_id=$2 where one.attempt_id=$1`,[start.attempt_id,repeat.attempt_id]);
assert.equal(overlap.rows[0].n,0);
await db.query('update concurso_verificado.periods set enabled=false where period=$1',[month]);
await user(alice);
await assert.rejects(rpc('pregunta',[repeat.attempt_id]), /contest_closed/);
assert.deepEqual(await rpc('pregunta',[start.attempt_id]),result);
assert.equal((await rpc('ranking')).status,'closed');
await db.close();
console.info('PASS fixture: ACL, disabled / missing bank, Madrid DST and month cutoff calculation, 100 sequential questions, stable reload, non-owner rejected, early timeout rejected, elapsed timeout, replay idempotency, server score, isolated pseudonymous ranking, no reused questions per account, explicit deactivation.');
