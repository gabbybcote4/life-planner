begin;
alter table public.tasks add constraint tasks_capture_owner_unique unique(id,user_id);
alter table public.notes add constraint notes_capture_owner_unique unique(id,user_id);
alter table public.space_pages add constraint pages_capture_owner_unique unique(id,user_id);
create table public.inbox_captures(
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 kind text not null check(kind in ('task','note','page')),
 title text not null check(char_length(title) between 1 and 200 and title ~ '[^[:space:]]'),
 body text not null default '' check(char_length(body)<=20000),
 space_id uuid,
 task_id uuid, note_id uuid, page_id uuid,
 reviewed boolean not null default false,
 revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),
 foreign key(space_id,user_id) references public.spaces(id,user_id),
 foreign key(task_id,user_id) references public.tasks(id,user_id),
 foreign key(note_id,user_id) references public.notes(id,user_id),
 foreign key(page_id,user_id) references public.space_pages(id,user_id),
 check((kind='task' and task_id is not null and task_id=id and note_id is null and page_id is null and body='')
 or (kind='note' and note_id is not null and note_id=id and task_id is null and page_id is null and space_id is null)
 or (kind='page' and page_id is not null and page_id=id and task_id is null and note_id is null and space_id is not null))
);
create index inbox_owner_reviewed_created_idx on public.inbox_captures(user_id,reviewed,created_at desc,id);
alter table public.inbox_captures enable row level security;
alter table public.inbox_captures force row level security;
revoke all on public.inbox_captures from public,anon,authenticated;
grant select on public.inbox_captures to authenticated;
grant insert(id,user_id,kind,title,body,space_id,task_id,note_id,page_id) on public.inbox_captures to authenticated;
grant update(reviewed) on public.inbox_captures to authenticated;
create policy inbox_select_own on public.inbox_captures for select to authenticated using((select auth.uid())=user_id);
create policy inbox_insert_own on public.inbox_captures for insert to authenticated with check((select auth.uid())=user_id);
create policy inbox_update_own on public.inbox_captures for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create function public.bump_capture_revision() returns trigger language plpgsql set search_path='' as $$
begin
 new.revision=old.revision+1;
 return new;
end;$$;
revoke all on function public.bump_capture_revision() from public,anon,authenticated;
create trigger inbox_revision before update on public.inbox_captures for each row execute function public.bump_capture_revision();

-- One atomic source record + original capture. Retries never overwrite later work.
create function public.planner_quick_capture(p_id uuid,p_kind text,p_space_id uuid,p_title text,p_body text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare owner_id uuid:=(select auth.uid()); target_kind text; existing public.inbox_captures%rowtype;
begin
 if owner_id is null then raise exception 'Sign in required' using errcode='42501';end if;
 if p_id is null or p_kind is null or p_kind not in ('task','note') or p_title is null or char_length(p_title) not between 1 and 200 or p_title !~ '[^[:space:]]' or p_body is null or char_length(p_body)>20000 or (p_kind='task' and p_body<>'') then
  raise exception 'Invalid capture' using errcode='22023';
 end if;
 target_kind:=case when p_kind='note' and p_space_id is not null then 'page' else p_kind end;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(owner_id::text||':'||p_id::text,0));
 select * into existing from public.inbox_captures where id=p_id and user_id=owner_id;
 if found then
  if existing.kind<>target_kind or existing.title<>p_title or existing.body<>p_body or existing.space_id is distinct from p_space_id then
   raise exception 'Capture retry changed' using errcode='23505';
  end if;
  return jsonb_build_object('id',existing.id,'kind',existing.kind,'space_id',existing.space_id);
 end if;
 if p_space_id is not null and not exists(select 1 from public.spaces where id=p_space_id and user_id=owner_id) then
  raise exception 'Space unavailable' using errcode='42501';
 end if;
 if target_kind='task' then
  insert into public.tasks(id,user_id,title,space_id) values(p_id,owner_id,p_title,p_space_id);
 elsif target_kind='note' then
  insert into public.notes(id,user_id,title,body) values(p_id,owner_id,p_title,p_body);
 else
  insert into public.space_pages(id,user_id,space_id,title,body) values(p_id,owner_id,p_space_id,p_title,p_body);
 end if;
 insert into public.inbox_captures(id,user_id,kind,title,body,space_id,task_id,note_id,page_id)
 values(p_id,owner_id,target_kind,p_title,p_body,p_space_id,case when target_kind='task' then p_id end,case when target_kind='note' then p_id end,case when target_kind='page' then p_id end);
 return jsonb_build_object('id',p_id,'kind',target_kind,'space_id',p_space_id);
end;$$;
revoke all on function public.planner_quick_capture(uuid,text,uuid,text,text) from public,anon;
grant execute on function public.planner_quick_capture(uuid,text,uuid,text,text) to authenticated;
commit;
