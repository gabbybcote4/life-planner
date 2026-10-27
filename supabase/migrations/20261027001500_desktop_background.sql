begin;
alter table public.planner_preferences
 add column background_pattern text not null default 'dots' check (background_pattern in ('solid','dots','grid')),
 add column background_intensity text not null default 'medium' check (background_intensity in ('subtle','medium','strong')),
 add column background_revision integer not null default 1 check(background_revision > 0);
grant insert(background_pattern,background_intensity), update(background_pattern,background_intensity) on public.planner_preferences to authenticated;
create function public.bump_background_revision() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' then
 if new.background_pattern <> 'dots' or new.background_intensity <> 'medium' then new.background_revision=2; end if;
 elsif new.background_pattern is distinct from old.background_pattern or new.background_intensity is distinct from old.background_intensity then
 new.background_revision=old.background_revision+1;
 end if;
 return new;
end;
$$;
revoke all on function public.bump_background_revision() from public,anon,authenticated;
create trigger preferences_background_revision before insert or update on public.planner_preferences for each row execute function public.bump_background_revision();
commit;
