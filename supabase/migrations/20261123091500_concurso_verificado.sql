-- Verified prize track only. Installing does not create or enable a contest.
-- Practice assets and legacy ranking are untouched and never read here.
begin;

create schema if not exists concurso_verificado;
revoke all on schema concurso_verificado from public, anon, authenticated;

create table concurso_verificado.periods (
  period date primary key check (extract(day from period) = 1),
  enabled boolean not null default false
);

create table concurso_verificado.bank (
  id uuid primary key default gen_random_uuid(),
  period date not null references concurso_verificado.periods(period),
  category text not null check (length(btrim(category)) between 1 and 100),
  prompt text not null check (length(btrim(prompt)) between 1 and 1500),
  choices text[] not null check (
    array_ndims(choices) = 1 and array_lower(choices, 1) = 1 and cardinality(choices) = 4 and
    array_position(choices, null) is null and
    length(btrim(choices[1])) between 1 and 500 and length(btrim(choices[2])) between 1 and 500 and
    length(btrim(choices[3])) between 1 and 500 and length(btrim(choices[4])) between 1 and 500 and
    btrim(choices[1]) <> all (array[btrim(choices[2]), btrim(choices[3]), btrim(choices[4])]) and
    btrim(choices[2]) <> all (array[btrim(choices[3]), btrim(choices[4])]) and btrim(choices[3]) <> btrim(choices[4])
  ),
  correct_choice integer not null check (correct_choice between 1 and 4),
  explanation text not null check (length(btrim(explanation)) between 1 and 2500),
  unique(period, prompt),
  unique(period, id)
);

create table concurso_verificado.attempts (
  id uuid primary key default gen_random_uuid(),
  period date not null references concurso_verificado.periods(period),
  user_id uuid not null references auth.users(id) on delete cascade,
  alias text not null check (alias ~ '^Jugador [0-9a-f]{12}$'),
  created_at timestamptz not null default clock_timestamp(),
  finished_at timestamptz,
  answered integer not null default 0 check (answered between 0 and 100),
  score integer not null default 0 check (score between 0 and answered),
  sum_ms bigint not null default 0 check (sum_ms between 0 and answered * 30000),
  check ((finished_at is not null) = (answered = 100)),
  unique(id, period)
);
create unique index concurso_verified_single_active
  on concurso_verificado.attempts(period, user_id) where finished_at is null;
create index concurso_verified_user
  on concurso_verificado.attempts(user_id, period, created_at);
create index concurso_verified_finishes
  on concurso_verificado.attempts(period, user_id, score desc, sum_ms) where finished_at is not null;

-- Freeze item text, choices, answer, explanation at reservation time.
-- A reload never changes items already assigned to the attempt.
create table concurso_verificado.items (
  attempt_id uuid not null,
  period date not null,
  position integer not null check (position between 1 and 100),
  bank_id uuid not null,
  category text not null,
  prompt text not null,
  choices text[] not null,
  correct_choice integer not null check (correct_choice between 1 and 4),
  explanation text not null,
  issued_at timestamptz,
  answered_at timestamptz,
  selected_choice integer check (selected_choice between 1 and 4),
  elapsed_ms integer check (elapsed_ms between 0 and 30000),
  is_correct boolean,
  check ((answered_at is null) = (elapsed_ms is null) and (answered_at is null) = (is_correct is null)),
  check (answered_at is null or issued_at is not null),
  primary key (attempt_id, position),
  unique (attempt_id, bank_id),
  foreign key (attempt_id, period) references concurso_verificado.attempts(id, period) on delete cascade,
  foreign key (period, bank_id) references concurso_verificado.bank(period, id)
);

alter table concurso_verificado.periods enable row level security;
alter table concurso_verificado.bank enable row level security;
alter table concurso_verificado.attempts enable row level security;
alter table concurso_verificado.items enable row level security;
revoke all on all tables in schema concurso_verificado from public, anon, authenticated;

create function concurso_verificado.madrid_month(p_now timestamptz)
returns date language sql stable set search_path = '' as $$
  select date_trunc('month', p_now at time zone 'Europe/Madrid')::date
$$;

create function concurso_verificado.month_end(p_period date)
returns timestamptz language sql stable set search_path = '' as $$
  select (p_period + interval '1 month') at time zone 'Europe/Madrid'
$$;

create function concurso_verificado.state(p_attempt concurso_verificado.attempts)
returns jsonb language sql stable set search_path = '' as $$
  select jsonb_build_object('attempt_id', p_attempt.id,
    'status', case when p_attempt.finished_at is null then 'ready' else 'finished' end,
    'answered', p_attempt.answered, 'total', 100) ||
    case when p_attempt.finished_at is null then '{}'::jsonb
    else jsonb_build_object('score', p_attempt.score, 'mean_ms', round(p_attempt.sum_ms / 100.0)::int)
    end
$$;
revoke all on all functions in schema concurso_verificado from public, anon, authenticated;

create function public.concurso_verificado_empezar()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_month date := concurso_verificado.madrid_month(clock_timestamp());
  v_attempt concurso_verificado.attempts%rowtype;
  v_bank uuid[];
  v_alias text;
begin
  if v_user is null then raise exception 'contest_login_required' using errcode = '42501'; end if;
  -- Serializes starts for the account, including nonconcurrent uniqueness and reservation checks.
  perform pg_advisory_xact_lock(hashtextextended('gr:contest:start:' || v_user::text, 0));
  perform 1 from concurso_verificado.periods p where p.period = v_month and p.enabled for share;
  if not found or clock_timestamp() >= concurso_verificado.month_end(v_month) then
    raise exception 'contest_closed';
  end if;
  select * into v_attempt from concurso_verificado.attempts a
    where a.period = v_month and a.user_id = v_user and a.finished_at is null for update;
  if found then return concurso_verificado.state(v_attempt); end if;
  select array_agg(q.id order by q.shuffle) into v_bank from (
    select b.id, random() as shuffle from concurso_verificado.bank b where b.period = v_month
      and not exists (
        select 1 from concurso_verificado.attempts a
        join concurso_verificado.items i on i.attempt_id = a.id
        where a.period = v_month and a.user_id = v_user and i.bank_id = b.id
      ) order by shuffle limit 100
  ) q;
  if coalesce(cardinality(v_bank), 0) <> 100 then
    select * into v_attempt from concurso_verificado.attempts a
      where a.period = v_month and a.user_id = v_user and a.finished_at is not null
      order by a.finished_at desc, a.id limit 1;
    if found then return concurso_verificado.state(v_attempt); end if;
    raise exception 'contest_bank_unavailable';
  end if;
  select a.alias into v_alias from concurso_verificado.attempts a
    where a.period = v_month and a.user_id = v_user order by a.created_at, a.id limit 1;
  insert into concurso_verificado.attempts(period, user_id, alias)
    values(v_month, v_user, coalesce(v_alias, 'Jugador ' || left(replace(gen_random_uuid()::text, '-', ''), 12)))
    returning * into v_attempt;
  insert into concurso_verificado.items(attempt_id, period, position, bank_id, category, prompt, choices, correct_choice, explanation)
    select v_attempt.id, v_month, q.position, b.id, b.category, b.prompt,
      array[b.choices[o.perm[1]], b.choices[o.perm[2]], b.choices[o.perm[3]], b.choices[o.perm[4]]],
      array_position(o.perm, b.correct_choice), b.explanation
    from unnest(v_bank) with ordinality q(id, position)
    join concurso_verificado.bank b on b.id = q.id and b.period = v_month
    cross join lateral (select array_agg(s.x order by random()) as perm
      from generate_series(1, cardinality(b.choices)) s(x)) o;
  return concurso_verificado.state(v_attempt);
end
$$;

create function public.concurso_verificado_pregunta(p_attempt uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_attempt concurso_verificado.attempts%rowtype;
  v_item concurso_verificado.items%rowtype;
  v_now timestamptz;
  v_close timestamptz;
begin
  if v_user is null then raise exception 'contest_login_required' using errcode = '42501'; end if;
  select * into v_attempt from concurso_verificado.attempts a
    where a.id = p_attempt and a.user_id = v_user for update;
  if not found then raise exception 'contest_attempt_not_found'; end if;
  if v_attempt.finished_at is not null then return concurso_verificado.state(v_attempt); end if;
  v_close := concurso_verificado.month_end(v_attempt.period);
  perform 1 from concurso_verificado.periods p where p.period = v_attempt.period and p.enabled;
  v_now := clock_timestamp();
  if not found or v_now >= v_close then raise exception 'contest_closed'; end if;
  select * into strict v_item from concurso_verificado.items i
    where i.attempt_id = p_attempt and i.position = v_attempt.answered + 1;
  if v_item.issued_at is null then
    update concurso_verificado.items i set issued_at = v_now
      where i.attempt_id = p_attempt and i.position = v_item.position returning * into v_item;
  end if;
  return jsonb_build_object('attempt_id', p_attempt, 'status', 'question',
    'position', v_item.position, 'total', 100, 'category', v_item.category,
    'prompt', v_item.prompt, 'choices', v_item.choices,
    'deadline', least(v_close, v_item.issued_at + interval '30 seconds'), 'server_now', v_now);
end
$$;

create function public.concurso_verificado_responder(p_attempt uuid, p_position integer, p_choice integer default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_attempt concurso_verificado.attempts%rowtype;
  v_item concurso_verificado.items%rowtype;
  v_now timestamptz;
  v_timed_out boolean;
  v_correct boolean;
  v_ms integer;
begin
  if v_user is null then raise exception 'contest_login_required' using errcode = '42501'; end if;
  if p_position is null or p_position not between 1 and 100 or
     (p_choice is not null and p_choice not between 1 and 4) then
    raise exception 'contest_invalid_answer';
  end if;
  select * into v_attempt from concurso_verificado.attempts a
    where a.id = p_attempt and a.user_id = v_user for update;
  if not found then raise exception 'contest_attempt_not_found'; end if;
  -- A lost response may be retried without charging elapsed time or recording twice.
  if p_position <= v_attempt.answered then return concurso_verificado.state(v_attempt); end if;
  perform 1 from concurso_verificado.periods p where p.period = v_attempt.period and p.enabled;
  v_now := clock_timestamp();
  if not found or v_now >= concurso_verificado.month_end(v_attempt.period) then
    raise exception 'contest_closed';
  end if;
  if p_position <> v_attempt.answered + 1 then raise exception 'contest_invalid_position'; end if;
  select * into strict v_item from concurso_verificado.items i
    where i.attempt_id = p_attempt and i.position = p_position;
  if v_item.issued_at is null then raise exception 'contest_question_not_issued'; end if;
  v_timed_out := v_now >= v_item.issued_at + interval '30 seconds';
  if p_choice is null and not v_timed_out then raise exception 'contest_timer_running'; end if;
  v_correct := not v_timed_out and p_choice is not distinct from v_item.correct_choice;
  v_ms := case when v_timed_out then 30000 else
    least(30000, greatest(0, floor(extract(epoch from v_now - v_item.issued_at) * 1000)::int)) end;
  update concurso_verificado.items i set answered_at = v_now,
    selected_choice = case when v_timed_out then null else p_choice end,
    elapsed_ms = v_ms, is_correct = v_correct
    where i.attempt_id = p_attempt and i.position = p_position;
  update concurso_verificado.attempts a set
    answered = p_position, score = a.score + (v_correct::int), sum_ms = a.sum_ms + v_ms,
    finished_at = case when p_position = 100 then v_now else null end
    where a.id = p_attempt returning * into v_attempt;
  return concurso_verificado.state(v_attempt);
end
$$;

-- An open month uses only server-graded completed rounds. Exact ties share a rank.
-- Pseudonyms are generated per account/month; the RPC never exposes account identifiers.
create function public.concurso_verificado_ranking()
returns jsonb language sql stable security definer set search_path = '' as $$
  with p as (
    select period from concurso_verificado.periods
    where enabled and period = concurso_verificado.madrid_month(statement_timestamp())
  ), best as (
    select distinct on (a.user_id) a.alias, a.score, a.sum_ms
    from concurso_verificado.attempts a join p on p.period = a.period
    where a.finished_at is not null
    order by a.user_id, a.score desc, a.sum_ms, a.finished_at, a.id
  ), ranks as (
    select alias, score, sum_ms, dense_rank() over(order by score desc, sum_ms) as rank
    from best
  ), top as (
    select alias, score, round(sum_ms / 100.0)::int as mean_ms, rank, sum_ms from ranks
    order by rank, alias limit 10
  )
  select jsonb_build_object('status', case when exists(select 1 from p) then 'open' else 'closed' end,
    'period', (select period from p), 'rows', coalesce(
     (select jsonb_agg(jsonb_build_object('alias', alias, 'score', score, 'mean_ms', mean_ms, 'rank', rank)
       order by rank, alias) from top), '[]'::jsonb))
$$;

revoke all on function public.concurso_verificado_empezar() from public, anon, authenticated;
revoke all on function public.concurso_verificado_pregunta(uuid) from public, anon, authenticated;
revoke all on function public.concurso_verificado_responder(uuid, integer, integer) from public, anon, authenticated;
revoke all on function public.concurso_verificado_ranking() from public, anon, authenticated;
grant execute on function public.concurso_verificado_empezar() to authenticated;
grant execute on function public.concurso_verificado_pregunta(uuid) to authenticated;
grant execute on function public.concurso_verificado_responder(uuid, integer, integer) to authenticated;
grant execute on function public.concurso_verificado_ranking() to anon, authenticated;

commit;
