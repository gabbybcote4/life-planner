begin;
-- The database catalog is the single source for the UI preview and created text.
create function public.planner_space_templates()
returns table(key text,title text,description text,pages jsonb)
language sql immutable security invoker set search_path='' as $$
 select c.key,c.title,c.description,c.pages from (values
 ('personal','Personal','A little room for everyday priorities, reflection, and ideas.',$catalog$[{"title":"My priorities","body":"What matters most to me right now?\n\n- A small step I can take\n- Something I want to make time for\n- Something I can let go of"},{"title":"Weekly reflection","body":"What went well this week?\n\nWhat felt difficult?\n\nWhat would make next week a little easier?"},{"title":"Ideas & reminders","body":"A place for thoughts I want to return to.\n\n- An idea to explore\n- Something to remember\n- A small moment worth keeping"}]$catalog$::jsonb),
 ('work','Work','Keep project thinking, meeting notes, and weekly reflection together.',$catalog$[{"title":"Current projects","body":"Project name:\n\nWhat does a useful outcome look like?\n\nNext steps:\n\nQuestions and decisions:"},{"title":"Meeting notes","body":"Topic and date:\n\nWhat did we discuss?\n\nDecisions:\n\nFollow-up actions and owners:"},{"title":"Weekly review","body":"Progress this week:\n\nWhat needs attention?\n\nMy priorities for next week:\n\nWho do I need to follow up with?"}]$catalog$::jsonb),
 ('study','Study','Collect learning goals, study plans, and notes in one place.',$catalog$[{"title":"Learning goals","body":"What do I want to understand or practise?\n\nWhy does it matter to me?\n\nHow will I notice progress?"},{"title":"Study plan","body":"Topic or course:\n\nWhat will I work on next?\n\nResources to use:\n\nQuestions to ask:"},{"title":"Learning notes","body":"Topic:\n\nKey ideas in my own words:\n\nExamples:\n\nWhat is still unclear?"}]$catalog$::jsonb)
 ) as c(key,title,description,pages);
$$;
-- Receipts describe an immutable creation request, not the current editable text.
alter table public.space_pages add constraint space_pages_id_owner_parent_key unique(id,user_id,space_id);
create table public.space_creation_receipts (
 space_id uuid primary key,
 user_id uuid not null default auth.uid(),
 template_key text not null check(template_key in('blank','personal','work','study')),
 initial_title text not null check(char_length(initial_title) between 1 and 100 and initial_title ~ '[^[:space:]]'),
 first_page_id uuid,
 created_at timestamptz not null default now(),
 foreign key(space_id,user_id) references public.spaces(id,user_id) on delete cascade,
 foreign key(first_page_id,user_id,space_id) references public.space_pages(id,user_id,space_id) on delete cascade,
 check((template_key='blank' and first_page_id is null) or (template_key<>'blank' and first_page_id is not null))
);
alter table public.space_creation_receipts enable row level security;
alter table public.space_creation_receipts force row level security;
revoke all on public.space_creation_receipts from public,anon,authenticated;
grant select on public.space_creation_receipts to authenticated;
grant insert(space_id,user_id,template_key,initial_title,first_page_id) on public.space_creation_receipts to authenticated;
create policy receipts_read on public.space_creation_receipts for select to authenticated using((select auth.uid())=user_id);
create policy receipts_insert on public.space_creation_receipts for insert to authenticated with check((select auth.uid())=user_id);
create function public.create_planner_space(p_request_id uuid,p_title text,p_template_key text)
returns table(space_id uuid,first_page_id uuid)
language plpgsql volatile security invoker set search_path='' as $$
declare
 owner_id uuid := auth.uid(); clean_title text := trim(p_title); starter_pages jsonb;
 inserted integer; item jsonb; page_id uuid; first_id uuid; receipt public.space_creation_receipts%rowtype;
begin
 if owner_id is null then raise exception 'Sign in to create a space' using errcode='42501';end if;
 if p_request_id is null or clean_title is null or char_length(clean_title) not between 1 and 100 or clean_title !~ '[^[:space:]]' then raise exception 'Invalid space name or request' using errcode='22023';end if;
 if p_template_key='blank' then starter_pages='[]'::jsonb;
 else select t.pages into starter_pages from public.planner_space_templates() t where t.key=p_template_key;
 end if;
 if starter_pages is null then raise exception 'Unknown template' using errcode='22023';end if;
 insert into public.spaces(id,user_id,title) values(p_request_id,owner_id,clean_title) on conflict(id) do nothing;
 get diagnostics inserted=row_count;
 if inserted=0 then
  select r.* into receipt from public.space_creation_receipts r where r.space_id=p_request_id and r.user_id=owner_id;
  if not found or receipt.template_key<>p_template_key or receipt.initial_title<>clean_title then raise exception 'An earlier creation request could not be confirmed' using errcode='23505';end if;
  -- Foreign keys preserve the receipt's owner/parent relationship; no content is overwritten.
  return query select receipt.space_id,receipt.first_page_id;return;
 end if;
 for item in select value from jsonb_array_elements(starter_pages) loop
  page_id=gen_random_uuid();
  insert into public.space_pages(id,user_id,space_id,title,body) values(page_id,owner_id,p_request_id,item->>'title',item->>'body');
  if first_id is null then first_id=page_id;end if;
 end loop;
 insert into public.space_creation_receipts(space_id,user_id,template_key,initial_title,first_page_id) values(p_request_id,owner_id,p_template_key,clean_title,first_id);
 return query select p_request_id,first_id;
end;$$;
revoke all on function public.planner_space_templates() from public,anon,authenticated;
revoke all on function public.create_planner_space(uuid,text,text) from public,anon,authenticated;
grant execute on function public.planner_space_templates() to authenticated;
grant execute on function public.create_planner_space(uuid,text,text) to authenticated;
commit;
