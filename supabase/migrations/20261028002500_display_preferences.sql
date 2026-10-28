begin;
alter table public.planner_preferences
 add column font_preset text not null default 'retro' check(font_preset in ('retro','system','rounded','mono')),
 add column text_size integer not null default 14 check(text_size in (14,16,18)),
 add column app_zoom integer not null default 100 check(app_zoom in (90,100,110,125)),
 add column reduce_motion boolean not null default false,
 add column strong_focus boolean not null default false,
 add column simple_background boolean not null default false,
 add column text_revision integer not null default 1 check(text_revision>0),
 add column zoom_revision integer not null default 1 check(zoom_revision>0),
 add column accessibility_revision integer not null default 1 check(accessibility_revision>0);
grant insert(font_preset,text_size,app_zoom,reduce_motion,strong_focus,simple_background),update(font_preset,text_size,app_zoom,reduce_motion,strong_focus,simple_background) on public.planner_preferences to authenticated;
create function public.bump_display_revisions() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' then
  if new.font_preset<>'retro' or new.text_size<>14 then new.text_revision=2;end if;
  if new.app_zoom<>100 then new.zoom_revision=2;end if;
  if new.reduce_motion or new.strong_focus or new.simple_background then new.accessibility_revision=2;end if;
 else
  if (new.font_preset,new.text_size) is distinct from (old.font_preset,old.text_size) then new.text_revision=old.text_revision+1;end if;
  if new.app_zoom is distinct from old.app_zoom then new.zoom_revision=old.zoom_revision+1;end if;
  if (new.reduce_motion,new.strong_focus,new.simple_background) is distinct from (old.reduce_motion,old.strong_focus,old.simple_background) then new.accessibility_revision=old.accessibility_revision+1;end if;
 end if;return new;
end;$$;
revoke all on function public.bump_display_revisions() from public,anon,authenticated;
create trigger preferences_display_revisions before insert or update on public.planner_preferences for each row execute function public.bump_display_revisions();
commit;
