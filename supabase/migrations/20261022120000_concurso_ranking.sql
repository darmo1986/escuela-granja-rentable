-- Concurso mensual (lanzado el 22-oct-2026 a petición de pablo):
-- 100 preguntas, 4 respuestas, 30 s; desempate por tiempo medio.
-- Ranking en ranking_mensual; la lectura pública va por la vista
-- ranking_mensual_top (mejor marca de cada usuario y mes).
-- Ejecutado en el SQL Editor el 22-oct-2026 (verificado: tabla y vista a 0).

create table if not exists public.ranking_mensual (
  id bigint generated always as identity primary key,
  mes text not null check (mes ~ '^[0-9]{4}-[0-9]{2}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  nombre text,
  aciertos int not null check (aciertos between 0 and 100),
  tiempo_medio numeric not null,
  fecha timestamptz not null default now()
);

alter table public.ranking_mensual enable row level security;

drop policy if exists "ranking insert propio" on public.ranking_mensual;
create policy "ranking insert propio" on public.ranking_mensual
  for insert to authenticated
  with check (auth.uid() = user_id);

create or replace view public.ranking_mensual_top as
  select distinct on (rm.mes, rm.user_id)
    rm.mes, rm.nombre, rm.aciertos, rm.tiempo_medio, rm.fecha
  from public.ranking_mensual rm
  order by rm.mes, rm.user_id, rm.aciertos desc, rm.tiempo_medio asc;

grant select on public.ranking_mensual_top to anon, authenticated;
