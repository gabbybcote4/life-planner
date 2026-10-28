begin;
create table public.projects(
 id uuid primary key,user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check(char_length(title) between 1 and 200 and title~'[^[:space:]]'),description text not null default '' check(char_length(description)<=500),
 status text not null default 'active' check(status in('active','paused','completed')),space_id uuid,
 revision integer not null default 1 check(revision>0),created_at timestamptz not null default now(),
 unique(id,user_id),foreign key(space_id,user_id) references public.spaces(id,user_id)
);
create index projects_owner_created_idx on public.projects(user_id,created_at,id);
create table public.project_items(
 project_id uuid not null,user_id uuid not null default auth.uid(),kind text not null check(kind in('task','note','page')),target_id uuid not null,
 task_id uuid,note_id uuid,page_id uuid,active boolean not null default true,revision integer not null default 1 check(revision>0),
 primary key(project_id,kind,target_id),
 foreign key(project_id,user_id) references public.projects(id,user_id) on delete cascade,
 foreign key(task_id,user_id) references public.tasks(id,user_id) on delete cascade,
 foreign key(note_id,user_id) references public.notes(id,user_id) on delete cascade,
 foreign key(page_id,user_id) references public.space_pages(id,user_id) on delete cascade,
 check((kind='task' and task_id=target_id and task_id is not null and note_id is null and page_id is null) or (kind='note' and note_id=target_id and note_id is not null and task_id is null and page_id is null) or (kind='page' and page_id=target_id and page_id is not null and task_id is null and note_id is null))
);
create index project_items_owner_target_idx on public.project_items(user_id,kind,target_id,active);
alter table public.projects enable row level security;
alter table public.projects force row level security;
alter table public.project_items enable row level security;
alter table public.project_items force row level security;
revoke all on public.projects,public.project_items from public,anon,authenticated;
grant select on public.projects,public.project_items to authenticated;
grant insert(id,user_id,title,description,status,space_id) on public.projects to authenticated;
grant update(title,description,status,space_id) on public.projects to authenticated;
grant insert(project_id,user_id,kind,target_id,task_id,note_id,page_id) on public.project_items to authenticated;
grant update(active) on public.project_items to authenticated;
create policy projects_select on public.projects for select to authenticated using(user_id=(select auth.uid()));
create policy projects_insert on public.projects for insert to authenticated with check(user_id=(select auth.uid()));
create policy projects_update on public.projects for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy project_items_select on public.project_items for select to authenticated using(user_id=(select auth.uid()));
create policy project_items_insert on public.project_items for insert to authenticated with check(user_id=(select auth.uid()));
create policy project_items_update on public.project_items for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create function public.planner_project_revision() returns trigger language plpgsql set search_path='' as $$begin new.revision=old.revision+1;return new;end;$$;
revoke all on function public.planner_project_revision() from public,anon,authenticated;
create trigger projects_revision before update on public.projects for each row execute function public.planner_project_revision();
create trigger project_items_revision before update on public.project_items for each row execute function public.planner_project_revision();
create function public.planner_save_project(p_id uuid,p_revision integer,p_settings jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare p public.projects%rowtype;s public.projects%rowtype;
begin
 if auth.uid() is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_id is null or p_revision is null or p_revision<0 or jsonb_typeof(p_settings) is distinct from 'object' then raise exception 'Invalid project' using errcode='22023';end if;
 select * into s from jsonb_populate_record(null::public.projects,p_settings);
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text||p_id::text,0));
 select * into p from public.projects where id=p_id and user_id=auth.uid() for update;
 if found then
  if p_revision=0 then
   if (to_jsonb(p)-array['id','user_id','revision','created_at']) is distinct from p_settings then raise exception 'Changed retry' using errcode='23505';end if;
   return jsonb_build_object('id',p.id,'revision',p.revision);
  end if;
  if p.revision<>p_revision then raise exception 'Stale project' using errcode='40001';end if;
  update public.projects set title=s.title,description=s.description,status=s.status,space_id=s.space_id where id=p_id and user_id=auth.uid() returning * into p;
 else
  if p_revision<>0 then raise exception 'Project unavailable' using errcode='42501';end if;
  insert into public.projects(id,user_id,title,description,status,space_id) values(p_id,auth.uid(),s.title,s.description,s.status,s.space_id) returning * into p;
 end if;
 return jsonb_build_object('id',p.id,'revision',p.revision);
end;$$;
create function public.planner_set_project_item(p_project uuid,p_kind text,p_target uuid,p_active boolean,p_revision integer) returns jsonb language plpgsql security invoker set search_path='' as $$
declare i public.project_items%rowtype;
begin
 if auth.uid() is null then raise exception 'Sign in' using errcode='42501';end if;
 if p_project is null or p_target is null or p_kind is null or p_kind not in('task','note','page') or p_active is null or p_revision is null or p_revision<0 then raise exception 'Invalid relation' using errcode='22023';end if;
 perform 1 from public.projects where id=p_project and user_id=auth.uid() for share;
 if not found then raise exception 'Project unavailable' using errcode='42501';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_project::text||p_kind||p_target::text,0));
 select * into i from public.project_items where project_id=p_project and kind=p_kind and target_id=p_target and user_id=auth.uid() for update;
 if found then
  if p_revision=0 and p_active and i.active then return jsonb_build_object('revision',i.revision);end if;
  if i.revision<>p_revision then raise exception 'Relation changed' using errcode='40001';end if;
  update public.project_items set active=p_active where project_id=p_project and kind=p_kind and target_id=p_target and user_id=auth.uid() returning * into i;
 else
  if p_revision<>0 or not p_active then raise exception 'Relation unavailable' using errcode='40001';end if;
  insert into public.project_items(project_id,user_id,kind,target_id,task_id,note_id,page_id) values(p_project,auth.uid(),p_kind,p_target,case when p_kind='task' then p_target end,case when p_kind='note' then p_target end,case when p_kind='page' then p_target end) returning * into i;
 end if;
 return jsonb_build_object('revision',i.revision);
end;$$;
-- One reusable source for complete project counters and Space context.
create function public.planner_project_summaries() returns setof jsonb language sql stable security invoker set search_path='' as $$
 select (to_jsonb(p)-array['user_id','created_at'])||jsonb_build_object('space_title',s.title,
 'task_count',(select count(*) from public.project_items i where i.project_id=p.id and i.user_id=auth.uid() and i.active and i.kind='task'),
 'done_count',(select count(*) from public.project_items i join public.tasks t on t.id=i.task_id and t.user_id=i.user_id where i.project_id=p.id and i.user_id=auth.uid() and i.active and t.completed),
 'note_count',(select count(*) from public.project_items i where i.project_id=p.id and i.user_id=auth.uid() and i.active and i.kind='note'),
 'page_count',(select count(*) from public.project_items i where i.project_id=p.id and i.user_id=auth.uid() and i.active and i.kind='page'))
 from public.projects p left join public.spaces s on s.id=p.space_id and s.user_id=p.user_id where p.user_id=auth.uid() order by p.created_at,p.id;
$$;
create function public.planner_projects(p_offset integer default 0) returns jsonb language plpgsql stable security invoker set search_path='' as $$
begin
 if p_offset is null or p_offset not between 0 and 999984 or p_offset%12<>0 then raise exception 'Invalid page' using errcode='22023';end if;
 return (with owned as(select value from public.planner_project_summaries() as summaries(value)),page as(select value from owned order by lower(value->>'title'),value->>'id' limit 12 offset p_offset) select jsonb_build_object('total',(select count(*) from owned),'items',coalesce((select jsonb_agg(value order by lower(value->>'title'),value->>'id') from page),'[]'::jsonb)));
end;$$;
create function public.planner_project_detail(p_id uuid,p_offset integer default 0) returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare summary jsonb;
begin
 if p_id is null or p_offset is null or p_offset not between 0 and 999980 or p_offset%20<>0 then raise exception 'Invalid project/page' using errcode='22023';end if;
 select value into summary from public.planner_project_summaries() as summaries(value) where value->>'id'=p_id::text;
 if summary is null then raise exception 'Project unavailable' using errcode='42501';end if;
 return (with owned as(
 select i.kind,i.target_id,i.active,i.revision,
 case i.kind when 'task' then (to_jsonb(t)-'user_id')||jsonb_build_object('space',case when ts.id is null then null else jsonb_build_object('title',ts.title) end)
 when 'note' then jsonb_build_object('id',n.id,'title',n.title,'space_id',null)
 else jsonb_build_object('id',g.id,'title',g.title,'space_id',g.space_id,'space_title',gs.title) end as target
 from public.project_items i
 left join public.tasks t on t.id=i.task_id and t.user_id=i.user_id
 left join public.spaces ts on ts.id=t.space_id and ts.user_id=t.user_id
 left join public.notes n on n.id=i.note_id and n.user_id=i.user_id
 left join public.space_pages g on g.id=i.page_id and g.user_id=i.user_id
 left join public.spaces gs on gs.id=g.space_id and gs.user_id=g.user_id
 where i.project_id=p_id and i.user_id=auth.uid()
 ),page as(select * from owned order by active desc,kind,target_id limit 20 offset p_offset)
 select jsonb_build_object('project',summary,'total_links',(select count(*) from owned),'items',coalesce((select jsonb_agg(to_jsonb(page) order by active desc,kind,target_id) from page),'[]'::jsonb)));
end;$$;
revoke all on function public.planner_save_project(uuid,integer,jsonb),public.planner_set_project_item(uuid,text,uuid,boolean,integer),public.planner_project_summaries(),public.planner_projects(integer),public.planner_project_detail(uuid,integer) from public,anon;
grant execute on function public.planner_save_project(uuid,integer,jsonb),public.planner_set_project_item(uuid,text,uuid,boolean,integer),public.planner_project_summaries(),public.planner_projects(integer),public.planner_project_detail(uuid,integer) to authenticated;
commit;