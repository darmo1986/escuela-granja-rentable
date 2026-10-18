-- Premium de Granja Rentable. NO se ha ejecutado desde el repositorio.
-- Pégalo en el SQL Editor de Supabase, una sola vez, después de:
--   20261018120000_reto.sql
--   20261018120100_cuenta.sql
--   20261018130000_apodo.sql
-- Si ya pegaste una versión anterior de ESTE archivo, vuélvelo a pegar:
-- la tabla de suscripciones de prueba se recrea (una fila por suscripción).
-- No toca las tablas del concurso (PR #15, migración 20261018140200_concurso.sql).
-- No lleva claves. El navegador no puede poner premium = true.
-- anon no puede leer premium_hasta, ni ejecutar es_premium(), ni abrir perfiles_insignia.

-- 1) Marca en el perfil. Solo la escribe el webhook (service_role).
alter table public.perfiles add column if not exists premium boolean not null default false;
alter table public.perfiles add column if not exists premium_hasta timestamptz;

comment on column public.perfiles.premium is
  'La pone el webhook de Stripe, a partir de todas las suscripciones vivas. El apodo público sigue siendo nombre.';
comment on column public.perfiles.premium_hasta is
  'Fin de la suscripción viva que acaba más tarde. Si premium es true, esta fecha no puede ser null.';

-- La v1 podía dejar premium=true sin fecha. Si no se apaga, el CHECK aborta todo el script.
update public.perfiles set premium = false where premium and premium_hasta is null;

alter table public.perfiles drop constraint if exists premium_con_fecha;
alter table public.perfiles add constraint premium_con_fecha
  check (not premium or premium_hasta is not null);

-- Estas dos columnas no se leen desde el navegador. La fecha propia sale de suscripciones.
-- La insignia pública es un sí/no (ranking_mes o la vista), nunca la fecha.
revoke select (premium, premium_hasta) on public.perfiles from public, anon, authenticated;
revoke update (premium, premium_hasta) on public.perfiles from public, anon, authenticated;
grant update (premium, premium_hasta) on public.perfiles to service_role;

create or replace function public.proteger_premium()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.role() in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.premium := false;
      new.premium_hasta := null;
    elsif new.premium is distinct from old.premium
       or new.premium_hasta is distinct from old.premium_hasta then
      raise exception 'premium solo lo cambia el servidor';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists perfiles_proteger_premium on public.perfiles;
create trigger perfiles_proteger_premium
  before insert or update on public.perfiles
  for each row execute function public.proteger_premium();

-- 2) Una fila por suscripción de Stripe, no por persona.
--    Si la versión anterior usaba user_id como clave, se tira: era solo de prueba.
do $$
begin
  if exists (
    select 1
    from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any (i.indkey)
    join pg_class c on c.oid = i.indrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'suscripciones'
      and i.indisprimary
      and a.attname = 'user_id'
  ) then
    drop table public.suscripciones;
  end if;
end $$;

create table if not exists public.suscripciones (
  stripe_subscription_id text primary key,
  user_id uuid not null references public.perfiles (id) on delete cascade,
  stripe_customer_id text,
  estado text not null default 'incomplete',
  plan text check (plan is null or plan in ('mensual', 'anual')),
  moneda text check (moneda is null or moneda in ('usd', 'eur')),
  vence timestamptz,
  evento_en timestamptz,
  actualizado timestamptz not null default now()
);

create index if not exists suscripciones_usuario on public.suscripciones (user_id);
create index if not exists suscripciones_cliente on public.suscripciones (stripe_customer_id);

-- Una sola suscripción viva por cuenta. La cancelada no cuenta.
create unique index if not exists una_suscripcion_viva
  on public.suscripciones (user_id)
  where estado in ('trialing', 'active', 'past_due');

-- Un cliente de Stripe por cuenta. El checkout toma este candado para no abrir dos pruebas a la vez.
create table if not exists public.clientes_stripe (
  user_id uuid primary key references public.perfiles (id) on delete cascade,
  stripe_customer_id text not null,
  prueba_usada boolean not null default false,
  prueba_sub text,
  checkout_en timestamptz
);

create unique index if not exists clientes_stripe_customer
  on public.clientes_stripe (stripe_customer_id);

alter table public.clientes_stripe enable row level security;
revoke all on public.clientes_stripe from public, anon, authenticated;
grant select, insert, update on public.clientes_stripe to service_role;

alter table public.suscripciones enable row level security;
revoke all on public.suscripciones from public, anon, authenticated;
grant select on public.suscripciones to authenticated;
grant select, insert, update, delete on public.suscripciones to service_role;

drop policy if exists suscripcion_propia on public.suscripciones;
create policy suscripcion_propia on public.suscripciones
  for select to authenticated
  using (user_id = auth.uid());

-- 3) Cada aviso de Stripe se guarda una vez. El webhook relee el evento en la API.
create table if not exists public.stripe_eventos (
  id text primary key,
  tipo text not null,
  recibido timestamptz not null default now()
);

alter table public.stripe_eventos enable row level security;
revoke all on public.stripe_eventos from public, anon, authenticated;
grant select, insert, delete on public.stripe_eventos to service_role;

-- Acuse del botón de desistimiento. Solo lo escribe el servidor. anon no lo lee.
-- Sin clave ajena: cerrar la cuenta no borra el registro. Se conserva 6 años.
create table if not exists public.desistimientos (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  stripe_subscription_id text not null,
  pedido_en timestamptz not null default now(),
  ip text,
  correo text,
  acuse_en timestamptz,
  conservar_hasta timestamptz not null default (now() + interval '6 years')
);

alter table public.desistimientos drop constraint if exists desistimientos_user_id_fkey;
alter table public.desistimientos add column if not exists acuse_en timestamptz;
alter table public.desistimientos add column if not exists conservar_hasta timestamptz;
update public.desistimientos
  set conservar_hasta = pedido_en + interval '6 years'
  where conservar_hasta is null;
alter table public.desistimientos alter column conservar_hasta set default (now() + interval '6 years');
alter table public.desistimientos alter column conservar_hasta set not null;

create unique index if not exists desistimientos_una_vez
  on public.desistimientos (user_id, stripe_subscription_id);

alter table public.desistimientos enable row level security;
revoke all on public.desistimientos from public, anon, authenticated;
grant select, insert, update on public.desistimientos to service_role;

-- 4) ¿Sigue en vigor alguna suscripción de quien pregunta?
--    premium_hasta null no cuenta, aunque premium estuviera en true.
create or replace function public.es_premium()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select p.premium
         and p.premium_hasta is not null
         and p.premium_hasta > pg_catalog.now()
      from public.perfiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.es_premium() from public, anon, authenticated;
grant execute on function public.es_premium() to authenticated, service_role;

-- 5) Lecciones. El texto real no se sube a GitHub: se inserta aquí, en Supabase.
--    Las dos filas de abajo son EJEMPLO y también están en este archivo, que es público.
create table if not exists public.contenido_premium (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,80}$'),
  titulo text not null check (char_length(titulo) between 2 and 140),
  html text not null check (char_length(html) between 1 and 20000),
  orden int not null default 0,
  archivo text check (archivo is null or (
    archivo ~ '^[a-zA-Z0-9._/-]{1,160}$' and position('..' in archivo) = 0
  )),
  ejemplo boolean not null default false,
  creado timestamptz not null default now()
);

alter table public.contenido_premium enable row level security;
revoke all on public.contenido_premium from public, anon, authenticated;
grant select on public.contenido_premium to authenticated;
grant select, insert, update, delete on public.contenido_premium to service_role;

drop policy if exists leer_si_premium on public.contenido_premium;
create policy leer_si_premium on public.contenido_premium
  for select to authenticated
  using (public.es_premium());

insert into public.contenido_premium (slug, titulo, html, orden, archivo, ejemplo)
values
  (
    'ejemplo-leccion',
    'EJEMPLO · Una lección que no es el curso',
    '<p><strong>EJEMPLO.</strong> Esto no es el curso avanzado. Sirve para comprobar que la puerta funciona: solo lo lee una cuenta Premium, porque la base lo filtra.</p><p>Cuando el equipo escriba el módulo de verdad (el lote de pollos de principio a fin, la incubación avanzada o cómo vender), lo insertará en esta tabla y no lo subirá al repositorio.</p><p>No hay dosis de medicamentos. En salud, la información es general y la decisión es del veterinario.</p>',
    1,
    null,
    true
  ),
  (
    'ejemplo-plantilla',
    'EJEMPLO · Dónde está la plantilla de prueba',
    '<p><strong>EJEMPLO.</strong> La hoja de verdad no está en la web. Vive en el almacén privado de Supabase, en la ruta <strong>ejemplo/plantilla-costos.txt</strong>.</p><p>El botón de descarga pide un enlace al servidor. Caduca a los dos minutos, y ese plazo lo fija el servidor. Si la cuenta no es Premium, no se entrega la fila ni el archivo.</p><p>Soporte prioritario por Messenger de la Página o formulario de la web, respuesta en un máximo de 2 días hábiles. Información general: no sustituye al veterinario; ante urgencias, acude hoy a tu veterinario. No damos dosis de medicamentos. El usuario de Messenger de la Página está PENDIENTE (m.me/…).</p>',
    2,
    'ejemplo/plantilla-costos.txt',
    true
  )
on conflict (slug) do update
  set titulo = excluded.titulo,
      html = excluded.html,
      orden = excluded.orden,
      archivo = excluded.archivo,
      ejemplo = excluded.ejemplo;

-- 6) Lotes de la calculadora avanzada. Cada persona ve los suyos, y solo si es Premium.
create table if not exists public.lotes (
  id uuid primary key default gen_random_uuid(),
  usuario uuid not null references public.perfiles (id) on delete cascade,
  nombre text not null check (char_length(nombre) between 1 and 80),
  aves int not null check (aves between 1 and 100000),
  costo_ave numeric(12, 2) not null check (costo_ave >= 0 and costo_ave <= 1000000),
  precio_venta numeric(12, 2) not null check (precio_venta >= 0 and precio_venta <= 1000000),
  notas text not null default '' check (char_length(notas) <= 500),
  creado timestamptz not null default now()
);

alter table public.lotes enable row level security;
revoke all on public.lotes from public, anon, authenticated;
grant select, insert, update, delete on public.lotes to authenticated;
grant select, insert, update, delete on public.lotes to service_role;

drop policy if exists lotes_propios on public.lotes;
create policy lotes_propios on public.lotes
  for all to authenticated
  using (usuario = auth.uid() and public.es_premium())
  with check (usuario = auth.uid() and public.es_premium());

-- 7) Insignia. El ranking del reto devuelve el apodo (perfiles.nombre) y un sí/no.
--    No devuelve el correo ni la fecha. Hay que volver a crear la función porque cambia lo que devuelve.
drop function if exists public.ranking_mes(text);

create or replace function public.ranking_mes(p_periodo text)
returns table (usuario uuid, nombre text, puntos int, aciertos int, llegado timestamptz, premium boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select i.usuario, pf.nombre,
    sum(i.puntos)::int as puntos,
    count(*) filter (where i.acierto and i.puntos > 0)::int as aciertos,
    max(i.creado) filter (where i.puntos > 0) as llegado,
    bool_or(
      pf.premium
      and pf.premium_hasta is not null
      and pf.premium_hasta > pg_catalog.now()
    ) as premium
  from public.quiz_intentos i
  join public.quiz_preguntas q on q.id = i.pregunta
  join public.perfiles pf on pf.id = i.usuario
  where not i.anulado and q.periodo = p_periodo
  group by i.usuario, pf.nombre
  having sum(i.puntos) > 0
  order by sum(i.puntos) desc, max(i.creado) filter (where i.puntos > 0) asc, count(*) filter (where i.acierto and i.puntos > 0) desc, pf.nombre asc;
$$;

revoke all on function public.ranking_mes(text) from public;
grant execute on function public.ranking_mes(text) to anon, authenticated;

-- La vista corre como su dueño y solo devuelve el sí/no. anon no tiene acceso.
drop view if exists public.perfiles_insignia;
create view public.perfiles_insignia
with (security_invoker = false) as
select id,
       nombre,
       (premium and premium_hasta is not null and premium_hasta > pg_catalog.now()) as premium
from public.perfiles;

revoke all on table public.perfiles_insignia from public, anon, authenticated;
grant select on table public.perfiles_insignia to authenticated;

-- Los privilegios por defecto de Supabase vuelven a dar EXECUTE a anon en cada función nueva,
-- y ALL a anon en cada tabla o vista nueva. Además Postgres da EXECUTE a PUBLIC en toda función
-- nueva: ese permiso solo se quita sin «in schema». Revocarlos aquí evita que un alta futura
-- reabra es_premium() o la vista. Las funciones que anon sí usa (ranking_mes) se conceden a mano.
do $$
declare
  dueno text;
begin
  foreach dueno in array array['postgres', 'supabase_admin']
  loop
    begin
      execute format(
        'alter default privileges for role %I revoke execute on functions from public, anon, authenticated',
        dueno
      );
      execute format(
        'alter default privileges for role %I in schema public revoke execute on functions from public, anon, authenticated',
        dueno
      );
      execute format(
        'alter default privileges for role %I in schema public revoke all on tables from anon',
        dueno
      );
    exception
      when undefined_object or insufficient_privilege then
        raise notice 'No se pudieron ajustar los privilegios por defecto de %.', dueno;
    end;
  end loop;
end $$;

-- 8) Almacén privado. El navegador no firma enlaces: lo hace la función premium-archivo,
--    con 120 segundos fijos. Esta política no existe a propósito.
do $$
begin
  drop policy if exists premium_descarga on storage.objects;
exception when undefined_table then
  null;
end $$;

do $$
begin
  insert into storage.buckets (id, name, public, file_size_limit)
  values ('premium', 'premium', false, 52428800)
  on conflict (id) do update
    set public = false,
        file_size_limit = excluded.file_size_limit;
exception when others then
  raise notice 'No se pudo crear el bucket premium (%). Créalo a mano, con Public desactivado.', sqlerrm;
end $$;
