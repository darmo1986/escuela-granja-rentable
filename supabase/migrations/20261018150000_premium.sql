-- Premium de Granja Rentable. NO se ha ejecutado desde el repositorio.
-- Pégalo en el SQL Editor de Supabase, una sola vez, después de:
--   20261018120000_reto.sql
--   20261018120100_cuenta.sql
--   20261018130000_apodo.sql
-- No toca las tablas del concurso (PR #15, migración 20261018140200_concurso.sql).
-- No lleva claves. El navegador no puede poner premium = true.

-- 1) Marca pública. Solo la escribe el webhook (service_role).
alter table public.perfiles add column if not exists premium boolean not null default false;
alter table public.perfiles add column if not exists premium_hasta timestamptz;

comment on column public.perfiles.premium is
  'La pone el webhook de Stripe. El apodo público sigue siendo nombre, nada más.';
comment on column public.perfiles.premium_hasta is
  'Fin del periodo pagado o de la prueba. Pasada esa hora, es_premium() devuelve false.';

-- El grant de perfiles es por columnas. Estas dos se pueden LEER (insignia y cuenta).
-- No se añaden a grant update: el navegador no puede escribirlas.
grant select (premium, premium_hasta) on public.perfiles to anon, authenticated;
grant update (premium, premium_hasta) on public.perfiles to service_role;

create or replace function public.proteger_premium()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.role() in ('anon', 'authenticated')
     and (
       new.premium is distinct from old.premium
       or new.premium_hasta is distinct from old.premium_hasta
     ) then
    raise exception 'premium solo lo cambia el servidor';
  end if;
  return new;
end;
$$;

drop trigger if exists perfiles_proteger_premium on public.perfiles;
create trigger perfiles_proteger_premium
  before update on public.perfiles
  for each row execute function public.proteger_premium();

-- 2) Datos de Stripe. Cada persona solo lee su fila. Nadie la escribe desde el navegador.
create table if not exists public.suscripciones (
  user_id uuid primary key references public.perfiles (id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  estado text not null default 'incomplete',
  plan text check (plan is null or plan in ('mensual', 'anual')),
  moneda text check (moneda is null or moneda in ('usd', 'eur')),
  vence timestamptz,
  evento_en timestamptz,
  actualizado timestamptz not null default now()
);

alter table public.suscripciones enable row level security;
revoke all on public.suscripciones from anon, authenticated;
grant select on public.suscripciones to authenticated;
grant select, insert, update, delete on public.suscripciones to service_role;

drop policy if exists suscripcion_propia on public.suscripciones;
create policy suscripcion_propia on public.suscripciones
  for select to authenticated
  using (user_id = auth.uid());

-- 3) ¿Sigue en vigor la suscripción de quien pregunta?
create or replace function public.es_premium()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select premium and (premium_hasta is null or premium_hasta > now())
      from public.perfiles
      where id = auth.uid()
    ),
    false
  );
$$;

revoke all on function public.es_premium() from public;
grant execute on function public.es_premium() to authenticated;

-- 4) Lecciones. El texto real no se sube a GitHub: se inserta aquí, en Supabase.
--    Las dos filas de abajo son EJEMPLO y también están en este archivo, que es público.
--    El curso de verdad no se pega en el repositorio.
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
revoke all on public.contenido_premium from anon, authenticated;
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
    '<p><strong>EJEMPLO.</strong> La hoja de verdad no está en la web. Vive en el almacén privado de Supabase, en la ruta <strong>ejemplo/plantilla-costos.txt</strong>.</p><p>El botón de descarga pide un enlace que caduca en dos minutos. Si la cuenta no es Premium, la base no entrega la fila y el almacén tampoco abre el archivo.</p><p>WhatsApp prioritario, el mismo número de siempre: <a href="https://wa.me/34656267726?text=Hola%2C%20soy%20Premium%20en%20Granja%20Rentable.%20Mi%20apodo%20es%20">+34 656 267 726</a>. Escribe ese texto para que Pablo vea que eres miembro. Respuesta en 48 horas laborables. No es una consulta veterinaria ni un sitio para pedir dosis.</p>',
    2,
    'ejemplo/plantilla-costos.txt',
    true
  )
on conflict (slug) do nothing;

-- 5) Lotes de la calculadora avanzada. Cada persona ve los suyos, y solo si es Premium.
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
revoke all on public.lotes from anon, authenticated;
grant select, insert, update, delete on public.lotes to authenticated;
grant select, insert, update, delete on public.lotes to service_role;

drop policy if exists lotes_propios on public.lotes;
create policy lotes_propios on public.lotes
  for all to authenticated
  using (usuario = auth.uid() and public.es_premium())
  with check (usuario = auth.uid() and public.es_premium());

-- 6) Insignia. El ranking del reto devuelve el apodo (perfiles.nombre) y un sí/no.
--    No devuelve el correo. Hay que volver a crear la función porque cambia lo que devuelve.
drop function if exists public.ranking_mes(text);

create or replace function public.ranking_mes(p_periodo text)
returns table (usuario uuid, nombre text, puntos int, aciertos int, llegado timestamptz, premium boolean)
language sql
stable
security definer
set search_path = public
as $$
  select i.usuario, pf.nombre,
    sum(i.puntos)::int as puntos,
    count(*) filter (where i.acierto and i.puntos > 0)::int as aciertos,
    max(i.creado) filter (where i.puntos > 0) as llegado,
    bool_or(pf.premium and (pf.premium_hasta is null or pf.premium_hasta > now())) as premium
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

-- Vista corta para pintar la insignia junto al apodo, nunca junto a otro nombre.
create or replace view public.perfiles_insignia
with (security_invoker = true) as
select id,
       nombre,
       (premium and (premium_hasta is null or premium_hasta > now())) as premium
from public.perfiles;

grant select on public.perfiles_insignia to anon, authenticated;

-- 7) Almacén privado. Si esta inserción falla, créalo a mano:
--    Storage → New bucket → nombre «premium» → Public desactivado.
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

drop policy if exists premium_descarga on storage.objects;
create policy premium_descarga on storage.objects
  for select to authenticated
  using (bucket_id = 'premium' and public.es_premium());
