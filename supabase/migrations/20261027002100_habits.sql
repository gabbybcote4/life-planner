begin;
create function public.planner_valid_habit_days(days smallint[]) returns boolean language sql immutable set search_path='' as $$
 select days is not null and cardinality(days)<=7 and coalesce(array_ndims(days),1)=1 and not exists(select 1 from unnest(days) d where d is null or d not between 0 and 6) and cardinality(days)=(select count(distinct d) from unnest(days) d);
$$;
revoke all on function public.planner_valid_habit_days(smallint[]) from public,anon;
grant execute on function public.planner_valid_habit_days(smallint[]) to authenticated;
create table public.habits(
 id uuid primary key,user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check(char_length(title) between 1 and 200 and title~'[^[:space:]]'),
 kind text not null check(kind in('check','amount')),target numeric(10,2) not null check(target>0 and target<=1000000),
 unit text not null check(char_length(unit) between 1 and 30 and unit~'[^[:space:]]'),
 schedule text not null check(schedule in('daily','weekdays','weekly')),weekdays smallint[] not null default '{}',weekly_goal integer not null default 3 check(weekly_goal between 1 and 7),
 space_id uuid, start_date date not null check(start_date between date '1900-01-01' and date '2100-12-31'), paused boolean not null default false,
 revision integer not null default 1 check(revision>0),created_at timestamptz not null default now(),
 unique(id,user_id),foreign key(space_id,user_id) references public.spaces(id,user_id),
 check(public.planner_valid_habit_days(weekdays)),check(schedule<>'weekdays' or cardinality(weekdays)>0),check(kind<>'check' or (target=1 and unit='done'))
);
create index habits_owner_idx on public.habits(user_id,paused,created_at,id);
create table public.habit_checkins(
 habit_id uuid not null,user_id uuid not null default auth.uid(),log_date date not null check(log_date between date '1900-01-01' and date '2100-12-31'),
 amount numeric(10,2) not null check(amount between 0 and 1000000),target numeric(10,2) not null check(target>0 and target<=1000000),
 unit text not null,kind text not null check(kind in('check','amount')),revision integer not null default 1 check(revision>0),
 primary key(habit_id,log_date),foreign key(habit_id,user_id) references public.habits(id,user_id) on delete cascade,
 check(kind<>'check' or (amount in(0,1) and target=1 and unit='done'))
);
create index habit_checkins_owner_date_idx on public.habit_checkins(user_id,log_date,habit_id);
alter table public.habits enable row level security;
alter table public.habits force row level security;
alter table public.habit_checkins enable row level security;
alter table public.habit_checkins force row level security;
revoke all on public.habits,public.habit_checkins from public,anon,authenticated;
grant select on public.habits,public.habit_checkins to authenticated;
grant insert(id,user_id,title,kind,target,unit,schedule,weekdays,weekly_goal,space_id,start_date,paused) on public.habits to authenticated;
grant update(title,kind,target,unit,schedule,weekdays,weekly_goal,space_id,paused) on public.habits to authenticated;
grant insert(habit_id,user_id,log_date,amount,target,unit,kind) on public.habit_checkins to authenticated;
grant update(amount) on public.habit_checkins to authenticated;
create policy habits_read on public.habits for select to authenticated using(user_id=(select auth.uid()));
create policy habits_insert on public.habits for insert to authenticated with check(user_id=(select auth.uid()));
create policy habits_update on public.habits for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy habit_checkins_read on public.habit_checkins for select to authenticated using(user_id=(select auth.uid()));
create policy habit_checkins_insert on public.habit_checkins for insert to authenticated with check(user_id=(select auth.uid()));
create policy habit_checkins_update on public.habit_checkins for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create function public.planner_habit_revision() returns trigger language plpgsql set search_path='' as $$
begin new.revision=old.revision+1;return new;end;$$;
revoke all on function public.planner_habit_revision() from public,anon,authenticated;
create trigger habits_revision before update on public.habits for each row execute function public.planner_habit_revision();
create trigger habit_checkins_revision before update on public.habit_checkins for each row execute function public.planner_habit_revision();
-- Original targets are fixed when a check-in is first recorded, including direct inserts.
create function public.planner_habit_snapshot() returns trigger language plpgsql set search_path='' as $$
declare h public.habits%rowtype;
begin
 select * into h from public.habits where id=new.habit_id and user_id=new.user_id;
 if not found or h.user_id is distinct from auth.uid() then raise exception 'Habit unavailable' using errcode='42501';end if;
 if h.paused or new.log_date<h.start_date then raise exception 'Paused or before habit start' using errcode='22023';end if;
 new.target=h.target;new.unit=h.unit;new.kind=h.kind;return new;
end;$$;
revoke all on function public.planner_habit_snapshot() from public,anon,authenticated;
create trigger habit_checkins_snapshot before insert on public.habit_checkins for each row execute function public.planner_habit_snapshot();

create function public.planner_save_habit(p_id uuid,p_revision integer,p_settings jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare h public.habits%rowtype;s public.habits%rowtype;days smallint[];
begin
 if auth.uid() is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_id is null or p_revision is null or p_revision<0 or jsonb_typeof(p_settings) is distinct from 'object' then raise exception 'Invalid habit' using errcode='22023';end if;
 if jsonb_typeof(p_settings->'target') is distinct from 'number' or (p_settings->>'target')::numeric<>round((p_settings->>'target')::numeric,2) then raise exception 'Invalid target precision' using errcode='22023';end if;
 select * into s from jsonb_populate_record(null::public.habits,p_settings);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text||p_id::text,0));
 select * into h from public.habits where id=p_id and user_id=auth.uid() for update;
 if found then
  -- New-record retries confirm only matching settings; never overwrite subsequent edits.
  if p_revision=0 then
   if (to_jsonb(h)-array['id','user_id','revision','created_at']) is distinct from p_settings then raise exception 'Changed retry' using errcode='23505';end if;
   return jsonb_build_object('revision',h.revision);
  end if;
  if h.revision<>p_revision then raise exception 'Stale habit' using errcode='40001';end if;
  update public.habits set title=s.title,kind=s.kind,target=s.target,unit=s.unit,schedule=s.schedule,weekdays=s.weekdays,weekly_goal=s.weekly_goal,space_id=s.space_id,paused=s.paused where id=p_id and user_id=auth.uid() returning * into h;
 else
  if p_revision<>0 then raise exception 'Habit unavailable' using errcode='42501';end if;
  insert into public.habits(id,user_id,title,kind,target,unit,schedule,weekdays,weekly_goal,space_id,start_date,paused)
  values(p_id,auth.uid(),s.title,s.kind,s.target,s.unit,s.schedule,s.weekdays,s.weekly_goal,s.space_id,s.start_date,s.paused) returning * into h;
 end if;
 return jsonb_build_object('revision',h.revision);
end;$$;
create function public.planner_check_habit(p_id uuid,p_day date,p_amount numeric,p_revision integer,p_habit_revision integer) returns jsonb language plpgsql security invoker set search_path='' as $$
declare h public.habits%rowtype;c public.habit_checkins%rowtype;
begin
 if auth.uid() is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_day is null or p_day not between date '1900-01-01' and date '2100-12-31' or p_revision is null or p_revision<0 or p_amount is null or p_amount<0 or p_amount>1000000 or p_amount<>round(p_amount,2) then raise exception 'Invalid check-in' using errcode='22023';end if;
 select * into h from public.habits where id=p_id and user_id=auth.uid() for share;
 if not found or p_habit_revision is distinct from h.revision then raise exception 'Habit changed or unavailable' using errcode='40001';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_id::text||p_day::text,0));
 select * into c from public.habit_checkins where habit_id=p_id and log_date=p_day and user_id=auth.uid() for update;
 if found then
  if p_revision=0 then
   if c.amount<>p_amount then raise exception 'Changed check-in retry' using errcode='40001';end if;
   return jsonb_build_object('revision',c.revision);
  end if;
  if c.revision<>p_revision then raise exception 'Stale check-in' using errcode='40001';end if;
  update public.habit_checkins set amount=p_amount where habit_id=p_id and log_date=p_day and user_id=auth.uid() returning * into c;
 else
  if p_revision<>0 or h.paused or p_day<h.start_date then raise exception 'Cannot create this check-in' using errcode='22023';end if;
  insert into public.habit_checkins(habit_id,user_id,log_date,amount,target,unit,kind) values(p_id,auth.uid(),p_day,p_amount,h.target,h.unit,h.kind) returning * into c;
 end if;
 return jsonb_build_object('revision',c.revision);
end;$$;
create function public.planner_habit_day(p_day date,p_offset integer default 0) returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if p_day is null or p_day not between date '1900-01-01' and date '2100-12-31' or p_offset is null or p_offset not between 0 and 999980 then raise exception 'Invalid day' using errcode='22023';end if;
 return (with owned as (
 select h.*,s.title as space_title,
 (select count(*)::integer from public.habit_checkins w where w.habit_id=h.id and w.user_id=auth.uid() and w.log_date>=date_trunc('week',p_day::timestamp)::date and w.log_date<date_trunc('week',p_day::timestamp)::date+7 and w.amount>=w.target) as week_done,
 (select jsonb_build_object('amount',c.amount,'target',c.target,'unit',c.unit,'kind',c.kind,'revision',c.revision) from public.habit_checkins c where c.habit_id=h.id and c.user_id=auth.uid() and c.log_date=p_day) as log
 from public.habits h left join public.spaces s on s.id=h.space_id and s.user_id=h.user_id where h.user_id=auth.uid()
  ),ranked as(select *,case when paused or start_date>p_day then 2 when log is not null then 0 when schedule='daily' or (schedule='weekdays' and extract(dow from p_day)::smallint=any(weekdays)) or (schedule='weekly' and week_done<weekly_goal) then 0 else 1 end as day_rank from owned),
 page as(select * from ranked order by day_rank,created_at,id limit 20 offset p_offset)
 select jsonb_build_object('total',(select count(*) from owned),'items',coalesce((select jsonb_agg(to_jsonb(page)-array['user_id','created_at','day_rank'] order by day_rank,created_at,id) from page),'[]'::jsonb)));
end;$$;
revoke all on function public.planner_save_habit(uuid,integer,jsonb),public.planner_check_habit(uuid,date,numeric,integer,integer),public.planner_habit_day(date,integer) from public,anon;
grant execute on function public.planner_save_habit(uuid,integer,jsonb),public.planner_check_habit(uuid,date,numeric,integer,integer),public.planner_habit_day(date,integer) to authenticated;
create or replace function public.is_valid_dashboard_layout(candidate jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare item jsonb;
seen text[] := '{}';
widget_id text;
begin
  if jsonb_typeof(candidate) is distinct from 'array' then return false; end if;
  if jsonb_array_length(candidate) > 10 then return false; end if;
  for item in select value from jsonb_array_elements(candidate) loop
    if jsonb_typeof(item) is distinct from 'object' then return false; end if;
    if (select count(*) from jsonb_object_keys(item)) not between 2 and 3 then return false; end if;
    if exists(select 1 from jsonb_object_keys(item) as keys(key) where key not in('id','width','accent')) then return false; end if;
    if item ? 'accent' then
      if jsonb_typeof(item->'accent') is distinct from 'string' or item->>'accent' not in('pink','mint','blue','yellow','lilac') then return false; end if;
    end if;
    widget_id = item->>'id';
    if widget_id is null or widget_id not in ('overview', 'capture', 'progress', 'recent', 'spaces', 'calendar', 'connections', 'timer', 'guidance', 'habits') then return false; end if;
    if item->>'width' is null or item->>'width' not in ('half', 'full') then return false; end if;
    if widget_id = any(seen) then return false; end if;
    seen = array_append(seen, widget_id);
  end loop;
  return true;
end;
$$;
revoke all on function public.is_valid_dashboard_layout(jsonb) from public, anon;
grant execute on function public.is_valid_dashboard_layout(jsonb) to authenticated;





commit;
