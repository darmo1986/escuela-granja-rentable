-- Premio único del concurso. La cifra 20 está solo en public.premio_euros().
-- El reto de /preguntas no tiene premio. Sus filas viejas pasan a reto_premios
-- sin cambiar el importe, tampoco si ya están pagadas.
-- quiz_premios queda solo para el concurso: el historial público y el formulario
-- de reclamación leen esa tabla, así que un premio del reto no sale ni se reclama.
-- No se ha corrido desde el repositorio.

create or replace function public.premio_euros()
returns integer
language sql
immutable
parallel safe
as $$
  select 20;
$$;

comment on function public.premio_euros() is
  'Única cifra del premio. Es del concurso: 10 preguntas, más aciertos y, si empatan, menos tiempo. El mes es Europe/Madrid y el ranking vuelve a cero. El reto no tiene premio.';

revoke all on function public.premio_euros() from public;
grant execute on function public.premio_euros() to anon, authenticated;

create table if not exists public.reto_premios (
  periodo text primary key check (periodo ~ '^[0-9]{4}-[0-9]{2}$'),
  ganador uuid not null references public.perfiles (id),
  euros int not null,
  estado text not null check (estado in ('pendiente', 'reclamado', 'aprobado', 'pagado', 'anulado')),
  reclamo_nombre text,
  reclamo_pais text,
  metodo text,
  paypal text,
  dispositivo text not null default '',
  ip text not null default '',
  motivo text not null default '',
  creado timestamptz not null default now()
);

comment on table public.reto_premios is
  'Premios viejos del reto. No los lee el historial del concurso ni su formulario.';

alter table public.reto_premios enable row level security;

revoke all on public.reto_premios from anon, authenticated;
grant select on public.reto_premios to authenticated;

drop policy if exists reto_premio_leer on public.reto_premios;
create policy reto_premio_leer on public.reto_premios
  for select to authenticated
  using (
    ganador = auth.uid()
    or exists (select 1 from public.perfiles p where p.id = auth.uid() and p.es_admin)
  );

alter table public.quiz_premios add column if not exists origen text;
update public.quiz_premios set origen = 'reto' where origen is null;

insert into public.reto_premios (
  periodo, ganador, euros, estado, reclamo_nombre, reclamo_pais,
  metodo, paypal, dispositivo, ip, motivo, creado
)
select
  periodo, ganador, euros, estado, reclamo_nombre, reclamo_pais,
  metodo, paypal, dispositivo, ip, motivo, creado
from public.quiz_premios
where origen = 'reto'
on conflict (periodo) do nothing;

delete from public.quiz_premios where origen = 'reto';

alter table public.quiz_premios alter column origen set default 'concurso';
update public.quiz_premios set origen = 'concurso' where origen is null;
alter table public.quiz_premios alter column origen set not null;

alter table public.quiz_premios drop constraint if exists quiz_premios_origen_check;
alter table public.quiz_premios
  add constraint quiz_premios_origen_check
  check (origen = 'concurso');

alter table public.quiz_premios alter column euros set default public.premio_euros();

do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.quiz_premios'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%euros%'
      and con.conname <> 'quiz_premios_euros_check'
  loop
    execute format('alter table public.quiz_premios drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.quiz_premios drop constraint if exists quiz_premios_euros_check;
alter table public.quiz_premios
  add constraint quiz_premios_euros_check
  check (estado = 'pagado' or euros = public.premio_euros());

create or replace function public.quiz_premios_guardar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.origen is null or new.origen = 'reto' then
    insert into public.reto_premios (
      periodo, ganador, euros, estado, reclamo_nombre, reclamo_pais,
      metodo, paypal, dispositivo, ip, motivo, creado
    )
    values (
      new.periodo, new.ganador, new.euros, new.estado, new.reclamo_nombre, new.reclamo_pais,
      new.metodo, new.paypal, coalesce(new.dispositivo, ''), coalesce(new.ip, ''),
      coalesce(new.motivo, ''), coalesce(new.creado, now())
    )
    on conflict (periodo) do update
    set ganador = excluded.ganador,
        euros = excluded.euros,
        estado = excluded.estado,
        reclamo_nombre = excluded.reclamo_nombre,
        reclamo_pais = excluded.reclamo_pais,
        metodo = excluded.metodo,
        paypal = excluded.paypal,
        dispositivo = excluded.dispositivo,
        ip = excluded.ip,
        motivo = excluded.motivo
    where public.reto_premios.estado is distinct from 'pagado';
    return null;
  end if;
  new.origen := 'concurso';
  if tg_op = 'UPDATE' and old.estado = 'pagado' then
    new.euros := old.euros;
  elsif new.estado is distinct from 'pagado' then
    new.euros := public.premio_euros();
  end if;
  return new;
end;
$$;

drop trigger if exists quiz_premios_guardar on public.quiz_premios;
create trigger quiz_premios_guardar
  before insert or update on public.quiz_premios
  for each row execute function public.quiz_premios_guardar();

create or replace function public.concurso_historial()
returns table (periodo text, apodo text)
language sql
stable
security definer
set search_path = public
as $$
  select q.periodo, p.nombre
  from public.quiz_premios q
  join public.perfiles p on p.id = q.ganador
  where q.origen = 'concurso'
    and q.estado <> 'anulado'
    and q.periodo < public.periodo_madrid(now())
  order by q.periodo desc;
$$;

comment on function public.concurso_historial() is
  'Historial público del concurso. No lee reto_premios.';

create or replace function public.concurso_premio_pendiente(p_periodo text, p_usuario uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.quiz_premios q
    where q.periodo = p_periodo
      and q.ganador = p_usuario
      and q.origen = 'concurso'
      and q.estado = 'pendiente'
  );
$$;

comment on function public.concurso_premio_pendiente(text, uuid) is
  'El formulario del concurso solo reclama si esto devuelve true. Un premio del reto no cuenta.';

revoke all on function public.quiz_premios_guardar() from public;
revoke all on function public.concurso_historial() from public;
revoke all on function public.concurso_premio_pendiente(text, uuid) from public;
grant execute on function public.concurso_historial() to anon, authenticated;
grant execute on function public.concurso_premio_pendiente(text, uuid) to authenticated;
