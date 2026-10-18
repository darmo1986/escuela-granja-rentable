-- Prueba local de permisos y apodos. No es una migración.
-- No la pegues en el proyecto real. Corre después de las cinco migraciones,
-- en una base de prueba que ya tenga los papeles anon, authenticated y service_role.

do $$
begin
  if has_table_privilege('anon', 'public.quiz_premios', 'INSERT')
     or has_table_privilege('anon', 'public.quiz_premios', 'UPDATE')
     or has_table_privilege('anon', 'public.quiz_premios', 'DELETE')
     or has_table_privilege('anon', 'public.quiz_premios', 'TRUNCATE')
     or has_table_privilege('anon', 'public.quiz_premios', 'TRIGGER')
     or has_table_privilege('anon', 'public.quiz_premios', 'REFERENCES')
     or has_table_privilege('authenticated', 'public.quiz_premios', 'INSERT')
     or has_table_privilege('authenticated', 'public.quiz_premios', 'UPDATE')
     or has_table_privilege('authenticated', 'public.quiz_premios', 'DELETE')
     or has_table_privilege('authenticated', 'public.quiz_premios', 'TRUNCATE')
     or has_table_privilege('authenticated', 'public.quiz_premios', 'TRIGGER')
     or has_table_privilege('authenticated', 'public.quiz_premios', 'REFERENCES')
     or has_table_privilege('anon', 'public.reto_premios', 'INSERT')
     or has_table_privilege('anon', 'public.reto_premios', 'UPDATE')
     or has_table_privilege('anon', 'public.reto_premios', 'DELETE')
     or has_table_privilege('anon', 'public.reto_premios', 'TRUNCATE')
     or has_table_privilege('anon', 'public.reto_premios', 'TRIGGER')
     or has_table_privilege('anon', 'public.reto_premios', 'REFERENCES')
     or has_table_privilege('authenticated', 'public.reto_premios', 'INSERT')
     or has_table_privilege('authenticated', 'public.reto_premios', 'UPDATE')
     or has_table_privilege('authenticated', 'public.reto_premios', 'DELETE')
     or has_table_privilege('authenticated', 'public.reto_premios', 'TRUNCATE')
     or has_table_privilege('authenticated', 'public.reto_premios', 'TRIGGER')
     or has_table_privilege('authenticated', 'public.reto_premios', 'REFERENCES') then
    raise exception 'anon o authenticated conservan truncate, trigger u otra escritura';
  end if;
  if not has_table_privilege('authenticated', 'public.quiz_premios', 'SELECT')
     or not has_table_privilege('authenticated', 'public.reto_premios', 'SELECT') then
    raise exception 'authenticated no puede leer los premios';
  end if;
  if has_table_privilege('anon', 'public.quiz_premios', 'SELECT')
     or has_table_privilege('anon', 'public.reto_premios', 'SELECT') then
    raise exception 'anon puede leer los premios';
  end if;
  if has_function_privilege('anon', 'public.concurso_premio_pendiente(text)', 'EXECUTE') then
    raise exception 'anon puede ejecutar concurso_premio_pendiente';
  end if;
  if not has_function_privilege('authenticated', 'public.concurso_premio_pendiente(text)', 'EXECUTE') then
    raise exception 'authenticated no puede ejecutar concurso_premio_pendiente';
  end if;
  if exists (
    select 1 from pg_proc
    where proname = 'concurso_premio_pendiente'
      and pg_get_function_identity_arguments(oid) like '%uuid%'
  ) then
    raise exception 'concurso_premio_pendiente sigue recibiendo un usuario';
  end if;
  if exists (
    select 1 from pg_proc
    where proname = 'quiz_premios_guardar' and prosecdef
  ) then
    raise exception 'quiz_premios_guardar sigue siendo security definer';
  end if;
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'quiz_premios'
      and column_name = 'origen'
      and (column_default is not null or is_nullable <> 'NO')
  ) then
    raise exception 'origen no es obligatorio o tiene valor por defecto';
  end if;
end $$;

insert into auth.users (id, email, raw_user_meta_data)
values (
  '11111111-1111-1111-1111-111111111111',
  'ana@example.com',
  '{"nombre":"Ana Ruiz"}'::jsonb
)
on conflict (id) do nothing;

insert into public.perfiles (id, nombre)
values ('11111111-1111-1111-1111-111111111111', 'Ana Ruiz')
on conflict (id) do nothing;

-- Aunque alguien vuelva a dar INSERT, el trigger no corre como dueño
-- y no copia un premio a reto_premios.
do $$
declare
  n int;
begin
  grant insert on public.quiz_premios to anon, authenticated;
  grant execute on function public.quiz_premios_guardar() to anon, authenticated;
  begin
    begin
      set local role anon;
      insert into public.quiz_premios (periodo, ganador, euros, estado, origen)
      values ('2099-01', '11111111-1111-1111-1111-111111111111', 9999, 'aprobado', 'reto');
      reset role;
      raise exception 'anon creo un premio de 9999';
    exception
      when others then
        reset role;
        if sqlerrm = 'anon creo un premio de 9999' then
          raise;
        end if;
        if sqlstate not in ('P0001', '42501') then
          raise;
        end if;
    end;
    begin
      set local role authenticated;
      insert into public.quiz_premios (periodo, ganador, euros, estado, origen)
      values ('2099-01', '11111111-1111-1111-1111-111111111111', 9999, 'pagado', 'concurso');
      reset role;
      raise exception 'authenticated creo un premio pagado de 9999';
    exception
      when others then
        reset role;
        if sqlerrm = 'authenticated creo un premio pagado de 9999' then
          raise;
        end if;
        if sqlstate not in ('P0001', '42501') then
          raise;
        end if;
    end;
    revoke insert on public.quiz_premios from anon, authenticated;
    revoke execute on function public.quiz_premios_guardar() from anon, authenticated;
  exception
    when others then
      reset role;
      revoke insert on public.quiz_premios from anon, authenticated;
      revoke execute on function public.quiz_premios_guardar() from anon, authenticated;
      raise;
  end;
  select count(*) into n from public.reto_premios where euros = 9999;
  if n <> 0 then
    raise exception 'reto_premios recibio 9999';
  end if;
  select count(*) into n from public.quiz_premios where euros = 9999 or periodo = '2099-01';
  if n <> 0 then
    raise exception 'quiz_premios recibio el premio de prueba';
  end if;
end $$;

do $$
declare
  papel text;
  orden text;
begin
  foreach papel in array ARRAY['anon', 'authenticated'] loop
    foreach orden in array ARRAY['insert', 'update', 'delete'] loop
      begin
        execute format('set local role %I', papel);
        if orden = 'insert' then
          insert into public.quiz_premios (periodo, ganador, euros, estado, origen)
          values ('2098-01', '11111111-1111-1111-1111-111111111111', 20, 'pendiente', 'concurso');
        elsif orden = 'update' then
          update public.quiz_premios set euros = 1 where periodo = '2098-01';
        else
          delete from public.quiz_premios where periodo = '2098-01';
        end if;
        reset role;
        raise exception '% escribio en quiz_premios (%).', papel, orden;
      exception
        when insufficient_privilege then
          reset role;
      end;
      begin
        execute format('set local role %I', papel);
        if orden = 'insert' then
          insert into public.reto_premios (periodo, ganador, euros, estado)
          values ('2098-02', '11111111-1111-1111-1111-111111111111', 20, 'aprobado');
        elsif orden = 'update' then
          update public.reto_premios set euros = 1 where periodo = '2098-02';
        else
          delete from public.reto_premios where periodo = '2098-02';
        end if;
        reset role;
        raise exception '% escribio en reto_premios (%).', papel, orden;
      exception
        when insufficient_privilege then
          reset role;
      end;
    end loop;
  end loop;
  begin
    set local role anon;
    perform public.concurso_premio_pendiente('2099-02');
    reset role;
    raise exception 'anon ejecuto concurso_premio_pendiente';
  exception
    when insufficient_privilege then
      reset role;
  end;
end $$;

do $$
begin
  begin
    insert into public.quiz_premios (periodo, ganador, euros, estado)
    values ('2099-05', '11111111-1111-1111-1111-111111111111', 20, 'pendiente');
    raise exception 'un premio sin origen entro en quiz_premios';
  exception
    when others then
      if sqlerrm = 'un premio sin origen entro en quiz_premios' then
        raise;
      end if;
  end;
  if exists (select 1 from public.quiz_premios where periodo = '2099-05') then
    raise exception 'se guardo un premio sin origen';
  end if;
end $$;

insert into public.quiz_premios (periodo, ganador, euros, estado, origen)
values ('2099-02', '11111111-1111-1111-1111-111111111111', 99, 'pendiente', 'concurso')
on conflict (periodo) do update
set euros = excluded.euros, estado = 'pendiente', origen = 'concurso';

do $$
declare
  cifra int;
begin
  select euros into cifra from public.quiz_premios where periodo = '2099-02';
  if cifra is distinct from public.premio_euros() then
    raise exception 'el concurso no guardo la cifra de premio_euros()';
  end if;
end $$;

insert into public.reto_premios (periodo, ganador, euros, estado)
values ('2099-04', '11111111-1111-1111-1111-111111111111', 25, 'pagado')
on conflict (periodo) do update
set euros = 25, estado = 'pagado'
where public.reto_premios.estado is distinct from 'pagado';

insert into public.quiz_premios (periodo, ganador, euros, estado, origen)
values ('2099-04', '11111111-1111-1111-1111-111111111111', 99, 'pendiente', 'reto');

do $$
declare
  cifra int;
  n int;
begin
  select euros into cifra from public.reto_premios where periodo = '2099-04';
  if cifra is distinct from 25 then
    raise exception 'se reescribio un premio del reto ya pagado';
  end if;
  select count(*) into n from public.quiz_premios where periodo = '2099-04';
  if n <> 0 then
    raise exception 'un premio del reto quedo en quiz_premios';
  end if;
end $$;

insert into public.quiz_premios (periodo, ganador, euros, estado, origen)
values ('2099-03', '11111111-1111-1111-1111-111111111111', 15, 'pendiente', 'reto');

do $$
declare
  n int;
begin
  select count(*) into n from public.quiz_premios where periodo = '2099-03';
  if n <> 0 then
    raise exception 'el reto se guardo en quiz_premios';
  end if;
  select count(*) into n from public.reto_premios where periodo = '2099-03' and euros = 15;
  if n <> 1 then
    raise exception 'el administrador no pudo archivar el premio del reto';
  end if;
end $$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$ select '11111111-1111-1111-1111-111111111111'::uuid $$;

do $$
begin
  if not public.concurso_premio_pendiente('2099-02') then
    raise exception 'el premio pendiente del concurso no se ve con auth.uid()';
  end if;
  if public.concurso_premio_pendiente('2099-03') then
    raise exception 'un premio del reto sale como pendiente del concurso';
  end if;
end $$;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$ select null::uuid $$;

do $$
begin
  if public.concurso_premio_pendiente('2099-02') then
    raise exception 'sin sesion, concurso_premio_pendiente no debe devolver true';
  end if;
end $$;

do $$
declare
  caso record;
begin
  for caso in
    select *
    from (values
      ('Putumayo', true),
      ('Maricarmen', true),
      ('Conchita', true),
      ('Cabrera', true),
      ('Diputado', true),
      ('Gonçalo', true),
      ('O''Brien', true),
      ('Łukasz', true),
      ('Ana Ruiz', true),
      ('María', true),
      ('Navarro', true),
      ('Eva', true),
      ('disputa', true),
      ('computadora', true),
      ('reputación', true),
      ('Disputo', true),
      ('Reputo', true),
      ('Imputo', true),
      ('Computa', true),
      ('Putri', true),
      ('Putra', true),
      ('Putnam', true),
      ('Puttanesca', true),
      ('coño', false),
      ('polla', false),
      ('zorra', false),
      ('pinche', false),
      ('idiota', false),
      ('fuck', false),
      ('pvta', false),
      ('pụta', false),
      ('ıdiota', false),
      ('pvto', false),
      ('hijodeputa', false),
      ('putamadre', false),
      ('joder', false),
      ('culo', false),
      ('imbécil', false),
      ('bitch', false),
      ('f u c k', false),
      ('Pụta', false),
      ('HIJODEPUTA', false),
      ('putita', false),
      ('pvtita', false),
      ('granjaputa', false),
      ('Elputo', false),
      ('subnormal', false),
      ('perra', false),
      ('shit', false),
      ('carajo', false),
      (U&'\02CDmierda', false),
      ('p.v.t.a', false),
      ('Putin', false),
      ('laputaza', false),
      ('hijoeputaso', false),
      ('superputaso', false),
      (U&'\028Dmierda', false),
      ('elpendejo', false),
      ('fuuck', false),
      ('coñazo', false)
    ) as t(nombre, vale)
  loop
    if public.apodo_ok(caso.nombre) is distinct from caso.vale then
      raise exception 'apodo_ok(%) devolvio %', caso.nombre, public.apodo_ok(caso.nombre);
    end if;
  end loop;
end $$;
