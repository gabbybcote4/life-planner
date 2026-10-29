begin;
alter table public.planner_preferences
 add column week_start text not null default 'sunday' check(week_start in ('sunday','monday')),
 add column date_format text not null default 'iso' check(date_format in ('iso','dmy','mdy')),
 add column planning_revision integer not null default 1 check(planning_revision>0);
grant insert(week_start,date_format),update(week_start,date_format) on public.planner_preferences to authenticated;
create function public.bump_planning_revision() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' then
  if new.week_start<>'sunday' or new.date_format<>'iso' then new.planning_revision=2;end if;
 elsif (new.week_start,new.date_format) is distinct from (old.week_start,old.date_format) then new.planning_revision=old.planning_revision+1;
 end if;return new;
end;$$;
revoke all on function public.bump_planning_revision() from public,anon,authenticated;
create trigger preferences_planning_revision before insert or update on public.planner_preferences for each row execute function public.bump_planning_revision();
commit;
