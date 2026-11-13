-- Área privada Premium. Requiere las migraciones de cuenta y panel.
-- Aplicar antes de habilitar GR.asesoria.activa. No activa compras antiguas.
begin;
create table public.asesoria_accesos (
 id uuid primary key default gen_random_uuid(),
 usuario uuid not null references auth.users(id) on delete cascade,
 pago text not null unique,
 inicio timestamptz not null,
 fin timestamptz not null,
 limite integer not null default 10 check (limite between 1 and 100),
 revocado boolean not null default false,
 check (fin > inicio)
);
create index on public.asesoria_accesos(usuario, fin);
create function public.asesoria_clientes() returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
 if not public.es_admin_actual() then raise exception 'Solo el asesor.'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'nombre',coalesce(p.nombre,'Cliente'),'correo',u.email))
 from public.asesoria_accesos a join auth.users u on u.id=a.usuario left join public.perfiles p on p.id=a.usuario),'[]'::jsonb);
end;
$$;
revoke all on function public.asesoria_clientes() from public,anon;
grant execute on function public.asesoria_clientes() to authenticated;
create table public.asesoria_fichas (
 acceso uuid primary key references public.asesoria_accesos(id) on delete cascade,
 respuestas jsonb not null,
 actualizado timestamptz not null default now()
);
create table public.asesoria_planes (
 acceso uuid primary key references public.asesoria_accesos(id) on delete cascade,
 contenido text not null check (length(contenido) between 1 and 30000),
 actualizado timestamptz not null default now()
);
create table public.asesoria_consultas (
 id uuid primary key default gen_random_uuid(),
 acceso uuid not null references public.asesoria_accesos(id) on delete cascade,
 titulo text not null check (length(titulo) between 1 and 140),
 creado timestamptz not null default now()
);
create index on public.asesoria_consultas(acceso, creado);
create table public.asesoria_mensajes (
 id uuid primary key default gen_random_uuid(),
 consulta uuid not null references public.asesoria_consultas(id) on delete cascade,
 autor uuid not null references auth.users(id),
 asesor boolean not null,
 texto text not null check (length(texto) between 1 and 5000),
 creado timestamptz not null default now()
);
create index on public.asesoria_mensajes(consulta, creado);
-- La bandeja nunca se expone al navegador. Los correos no contienen la consulta.
create table public.asesoria_avisos (
 id uuid primary key default gen_random_uuid(),
 solicitante uuid not null references auth.users(id) on delete cascade,
 acceso uuid not null references public.asesoria_accesos(id) on delete cascade,
 para_asesor boolean not null,
 motivo text not null,
 creado timestamptz not null default now(),
 enviado timestamptz
);

create function public.asesoria_puede_leer(p_acceso uuid) returns boolean
language sql stable security definer set search_path = public as $$
 select auth.uid() is not null and exists (
  select 1 from public.asesoria_accesos a where a.id=p_acceso
   and (a.usuario=auth.uid() or public.es_admin_actual())
 );
$$;
revoke all on function public.asesoria_puede_leer(uuid) from public;
grant execute on function public.asesoria_puede_leer(uuid) to authenticated;

alter table public.asesoria_accesos enable row level security;
alter table public.asesoria_fichas enable row level security;
alter table public.asesoria_planes enable row level security;
alter table public.asesoria_consultas enable row level security;
alter table public.asesoria_mensajes enable row level security;
alter table public.asesoria_avisos enable row level security;
revoke all on public.asesoria_accesos, public.asesoria_fichas, public.asesoria_planes,
 public.asesoria_consultas, public.asesoria_mensajes, public.asesoria_avisos from anon, authenticated;
grant select on public.asesoria_accesos, public.asesoria_fichas, public.asesoria_planes,
 public.asesoria_consultas, public.asesoria_mensajes to authenticated;
grant all on public.asesoria_accesos, public.asesoria_fichas, public.asesoria_planes,
 public.asesoria_consultas, public.asesoria_mensajes, public.asesoria_avisos to service_role;
create policy acceso_lectura on public.asesoria_accesos for select to authenticated
 using (usuario=auth.uid() or public.es_admin_actual());
create policy ficha_lectura on public.asesoria_fichas for select to authenticated
 using (public.asesoria_puede_leer(acceso));
create policy plan_lectura on public.asesoria_planes for select to authenticated
 using (public.asesoria_puede_leer(acceso));
create policy consulta_lectura on public.asesoria_consultas for select to authenticated
 using (public.asesoria_puede_leer(acceso));
create policy mensaje_lectura on public.asesoria_mensajes for select to authenticated
 using (exists(select 1 from public.asesoria_consultas c
  where c.id=consulta and public.asesoria_puede_leer(c.acceso)));

create function public.asesoria_exigir_activo(p_acceso uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
 if auth.uid() is null or not exists(select 1 from public.asesoria_accesos a
  where a.id=p_acceso and a.usuario=auth.uid() and not a.revocado
   and now()>=a.inicio and now()<a.fin) then
  raise exception 'El seguimiento no está activo para esta cuenta.';
 end if;
end;
$$;
revoke all on function public.asesoria_exigir_activo(uuid) from public;

create function public.asesoria_guardar_ficha(p_acceso uuid, p_respuestas jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare k text;
begin
 perform public.asesoria_exigir_activo(p_acceso);
 if jsonb_typeof(p_respuestas) is distinct from 'object' then raise exception 'Completa las diez preguntas.'; end if;
 if (select count(*) from jsonb_object_keys(p_respuestas))<>10 then raise exception 'Completa las diez preguntas.'; end if;
 foreach k in array array['objetivo','ubicacion','aves','edad','alojamiento','alimentacion','cantidad','agua','rutina','problema'] loop
  if jsonb_typeof(p_respuestas->k) is distinct from 'string'
   or length(trim(p_respuestas->>k)) not between 1 and 2000 then
   raise exception 'Completa las diez preguntas (máximo 2000 caracteres por respuesta).';
  end if;
 end loop;
 insert into public.asesoria_fichas(acceso,respuestas) values(p_acceso,p_respuestas)
 on conflict(acceso) do update set respuestas=excluded.respuestas, actualizado=now();
 insert into public.asesoria_avisos(solicitante,acceso,para_asesor,motivo)
 values(auth.uid(),p_acceso,true,'Cuestionario actualizado');
end;
$$;

create function public.asesoria_abrir_consulta(p_acceso uuid, p_titulo text, p_texto text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_limite integer;
begin
 perform public.asesoria_exigir_activo(p_acceso);
 -- Bloqueo evita superar el cupo mediante peticiones simultáneas.
 select limite into v_limite from public.asesoria_accesos where id=p_acceso for update;
 if not exists(select 1 from public.asesoria_fichas where acceso=p_acceso) then
  raise exception 'Completa primero las diez preguntas de tu granja.';
 end if;
 if (select count(*) from public.asesoria_consultas where acceso=p_acceso)>=v_limite then
  raise exception 'Has utilizado las consultas incluidas. Puedes seguir aclarando esos mismos temas.';
 end if;
 insert into public.asesoria_consultas(acceso,titulo) values(p_acceso,trim(p_titulo)) returning id into v_id;
 insert into public.asesoria_mensajes(consulta,autor,asesor,texto) values(v_id,auth.uid(),false,trim(p_texto));
 insert into public.asesoria_avisos(solicitante,acceso,para_asesor,motivo)
 values(auth.uid(),p_acceso,true,'Nueva consulta');
 return v_id;
end;
$$;

create function public.asesoria_responder(p_consulta uuid, p_texto text) returns void
language plpgsql security definer set search_path = public as $$
declare v_acceso uuid; v_admin boolean := public.es_admin_actual();
begin
 select acceso into v_acceso from public.asesoria_consultas where id=p_consulta;
 if v_acceso is null then raise exception 'Consulta no disponible.'; end if;
 if not v_admin then perform public.asesoria_exigir_activo(v_acceso); end if;
 -- El asesor puede responder una pregunta pendiente aunque venza el mes.
 insert into public.asesoria_mensajes(consulta,autor,asesor,texto)
 values(p_consulta,auth.uid(),v_admin,trim(p_texto));
 insert into public.asesoria_avisos(solicitante,acceso,para_asesor,motivo)
 values(auth.uid(),v_acceso,not v_admin,'Nuevo mensaje');
end;
$$;

create function public.asesoria_publicar_plan(p_acceso uuid, p_contenido text) returns void
language plpgsql security definer set search_path = public as $$
begin
 if not public.es_admin_actual() then raise exception 'Solo el asesor puede publicar el plan.'; end if;
 insert into public.asesoria_planes(acceso,contenido) values(p_acceso,trim(p_contenido))
 on conflict(acceso) do update set contenido=excluded.contenido,actualizado=now();
 insert into public.asesoria_avisos(solicitante,acceso,para_asesor,motivo)
 values(auth.uid(),p_acceso,false,'Plan de acción actualizado');
end;
$$;

-- Solo el servidor tras comprobar Stripe. El navegador NO puede activar acceso.
create function public.asesoria_activar_pago(p_usuario uuid, p_pago text, p_inicio timestamptz) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_usuario uuid;
begin
 perform pg_advisory_xact_lock(hashtext('asesoria-cupos'));
 select id,usuario into v_id,v_usuario from public.asesoria_accesos where pago=p_pago;
 if v_id is not null then
  if v_usuario<>p_usuario then raise exception 'Pago asociado a otra cuenta.'; end if;
  return v_id;
 end if;
 if exists(select 1 from public.asesoria_accesos where usuario=p_usuario and not revocado and fin>now()) then
  raise exception 'Esta cuenta ya tiene un mes activo. Revisar el pago sin ampliar automáticamente.';
 end if;
 insert into public.asesoria_accesos(usuario,pago,inicio,fin)
 values(p_usuario,p_pago,p_inicio,p_inicio+interval '30 days') returning id into v_id;
 insert into public.asesoria_avisos(solicitante,acceso,para_asesor,motivo)
 values(p_usuario,v_id,false,'Tu acompañamiento está activo'),(p_usuario,v_id,true,'Nuevo cliente Premium');
 return v_id;
end;
$$;
revoke all on function public.asesoria_activar_pago(uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.asesoria_activar_pago(uuid,text,timestamptz) to service_role;
revoke all on function public.asesoria_guardar_ficha(uuid,jsonb), public.asesoria_abrir_consulta(uuid,text,text),
 public.asesoria_responder(uuid,text), public.asesoria_publicar_plan(uuid,text) from public,anon;
grant execute on function public.asesoria_guardar_ficha(uuid,jsonb), public.asesoria_abrir_consulta(uuid,text,text),
 public.asesoria_responder(uuid,text), public.asesoria_publicar_plan(uuid,text) to authenticated;
commit;
