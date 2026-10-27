begin;
alter table public.planner_preferences
 add column nav_position text not null default 'left' check(nav_position in ('left','right','top','bottom')),
 add column nav_revision integer not null default 1 check(nav_revision > 0);
grant insert(nav_position), update(nav_position) on public.planner_preferences to authenticated;
create function public.bump_nav_revision() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' then
   if new.nav_position <> 'left' then new.nav_revision=2; end if;
 elsif new.nav_position is distinct from old.nav_position then
   new.nav_revision=old.nav_revision+1;
 end if;
 return new;
end;
$$;
revoke all on function public.bump_nav_revision() from public,anon,authenticated;
create trigger preferences_nav_revision before insert or update on public.planner_preferences for each row execute function public.bump_nav_revision();
commit;
