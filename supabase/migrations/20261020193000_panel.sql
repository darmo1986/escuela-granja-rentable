-- Granja Rentable. Ejecutar en el SQL Editor, DESPUÉS de las anteriores.
-- No lleva claves. RLS queda activo en cada tabla. No se ha ejecutado desde el repositorio.
-- Orden completo: 20261018120000_reto, 20261018120100_cuenta, 20261018130000_apodo,
-- 20261018140000_apodo_reglas, 20261018140100_premio y esta, 20261020193000_panel.
--
-- Qué crea:
--   public.visitas            una fila por página vista (sin cookies, sin IP, sin datos personales)
--   public.intenciones_compra una fila por clic en «Comprar» (tienda) o en un WhatsApp de producto
--   public.panel_resumen()    resumen completo SOLO para el administrador (perfiles.es_admin)
--   public.estadisticas_publicas()  solo CIFRAS (sin filas ni datos) para la revisión diaria automática
--
-- Las tablas no se pueden leer desde el navegador: no hay política de lectura.
-- Todo pasa por las dos funciones, que son security definer y comprueban lo que toca.
-- Una intención de compra NO es una venta: es el clic antes de ir a la tienda (Stripe, en Netlify)
-- o de abrir WhatsApp. La venta confirmada la sabe Stripe, no esta tabla.

create table if not exists public.visitas (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  ruta text not null check (char_length(ruta) between 1 and 300),
  referer text check (char_length(referer) <= 200),
  pais text check (char_length(pais) <= 2)
);

create table if not exists public.intenciones_compra (
  id bigint generated always as identity primary key,
  creado timestamptz not null default now(),
  producto text not null check (char_length(producto) between 1 and 140),
  canal text not null default 'tienda' check (canal in ('tienda', 'whatsapp')),
  ruta text check (char_length(ruta) <= 300),
  pais text check (char_length(pais) <= 2)
);

create index if not exists visitas_creado_idx on public.visitas (creado desc);
create index if not exists intenciones_creado_idx on public.intenciones_compra (creado desc);

alter table public.visitas enable row level security;
alter table public.intenciones_compra enable row level security;

-- Sin lectura para nadie desde el cliente. Solo se puede INSERTAR (la baliza de js/site.js).
revoke all on public.visitas, public.intenciones_compra from anon, authenticated;
grant insert on public.visitas to anon, authenticated;
grant insert on public.intenciones_compra to anon, authenticated;

drop policy if exists visitas_insertar on public.visitas;
create policy visitas_insertar on public.visitas
  for insert to anon, authenticated
  with check (true);

drop policy if exists intenciones_insertar on public.intenciones_compra;
create policy intenciones_insertar on public.intenciones_compra
  for insert to anon, authenticated
  with check (true);

-- ¿Es administrador quien llama? perfiles.es_admin se marca a mano (ver supabase/LEEME.md).
create or replace function public.es_admin_actual()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select p.es_admin from public.perfiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.es_admin_actual() from public;
grant execute on function public.es_admin_actual() to authenticated;

-- Resumen del panel. Solo lo puede ejecutar un administrador con sesión.
create or replace function public.panel_resumen()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  hoy date := (now() at time zone 'Europe/Madrid')::date;
  resultado jsonb;
begin
  if not public.es_admin_actual() then
    raise exception 'solo administrador';
  end if;

  select jsonb_build_object(
    'generado_en', now(),
    'visitas_hoy', (select count(*) from public.visitas
                    where (creado at time zone 'Europe/Madrid')::date = hoy),
    'visitas_7d', (select count(*) from public.visitas
                   where creado >= now() - interval '7 days'),
    'visitas_30d', (select count(*) from public.visitas
                    where creado >= now() - interval '30 days'),
    'top_rutas_7d', coalesce((
      select jsonb_agg(jsonb_build_object('ruta', ruta, 'n', n) order by n desc)
      from (
        select ruta, count(*) as n
        from public.visitas
        where creado >= now() - interval '7 days'
        group by ruta
        order by n desc
        limit 10
      ) t
    ), '[]'::jsonb),
    'intenciones_hoy', (select count(*) from public.intenciones_compra
                        where (creado at time zone 'Europe/Madrid')::date = hoy),
    'intenciones_7d', (select count(*) from public.intenciones_compra
                       where creado >= now() - interval '7 days'),
    'ultimas_intenciones', coalesce((
      select jsonb_agg(jsonb_build_object(
               'producto', producto, 'canal', canal, 'creado', creado) order by creado desc)
      from (
        select producto, canal, creado
        from public.intenciones_compra
        order by creado desc
        limit 10
      ) u
    ), '[]'::jsonb)
  ) into resultado;

  return resultado;
end;
$$;

revoke all on function public.panel_resumen() from public;
grant execute on function public.panel_resumen() to authenticated;

-- Solo cifras agregadas, sin filas y sin ningún dato personal.
-- Sirve para la revisión diaria automática del tráfico y las intenciones.
create or replace function public.estadisticas_publicas()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'fecha', to_char((now() at time zone 'Europe/Madrid')::date, 'YYYY-MM-DD'),
    'visitas_hoy', (select count(*) from public.visitas
                    where (creado at time zone 'Europe/Madrid')::date
                        = (now() at time zone 'Europe/Madrid')::date),
    'visitas_7d', (select count(*) from public.visitas
                   where creado >= now() - interval '7 days'),
    'intenciones_hoy', (select count(*) from public.intenciones_compra
                        where (creado at time zone 'Europe/Madrid')::date
                            = (now() at time zone 'Europe/Madrid')::date),
    'intenciones_7d', (select count(*) from public.intenciones_compra
                       where creado >= now() - interval '7 days'),
    'productos_hoy', coalesce((
      select jsonb_agg(distinct producto)
      from public.intenciones_compra
      where (creado at time zone 'Europe/Madrid')::date
          = (now() at time zone 'Europe/Madrid')::date
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.estadisticas_publicas() from public;
grant execute on function public.estadisticas_publicas() to anon, authenticated;
