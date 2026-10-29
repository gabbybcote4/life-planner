-- VERSION: EXPORT-CHECKS-V3. Paste this entire file into a NEW SQL query.
-- Fictional records only. Export creates no persisted rows; fixtures roll back.
begin;
insert into auth.users(id,email) values('b829eb33-8222-4b11-8900-000000000001','export-1@example.invalid');
insert into public.spaces(id,user_id,title) values('b829eb33-8222-4b11-8900-000000000013','b829eb33-8222-4b11-8900-000000000001','OWN_A space');
insert into public.tasks(id,user_id,title) values('b829eb33-8222-4b11-8900-000000000011','b829eb33-8222-4b11-8900-000000000001','OWN_A task');
insert into public.notes(id,user_id,title,body) values('b829eb33-8222-4b11-8900-000000000012','b829eb33-8222-4b11-8900-000000000001','OWN_A note','OWN_A [[OWN_A page|page:b829eb33-8222-4b11-8900-000000000014]] [[Unresolved private reference|note:b829eb33-8222-4b11-8900-000000000022]]');
insert into public.space_pages(id,user_id,space_id,title,body) values('b829eb33-8222-4b11-8900-000000000014','b829eb33-8222-4b11-8900-000000000001','b829eb33-8222-4b11-8900-000000000013','OWN_A page','A saved body');
insert into public.calendar_events(id,user_id,title,event_date) values('b829eb33-8222-4b11-8900-000000000015','b829eb33-8222-4b11-8900-000000000001','OWN_A event','2026-10-29');
insert into public.habits(id,user_id,title,kind,target,unit,schedule,start_date) values('b829eb33-8222-4b11-8900-000000000016','b829eb33-8222-4b11-8900-000000000001','OWN_A habit','check',1,'done','daily','2026-10-29');
insert into public.projects(id,user_id,title) values('b829eb33-8222-4b11-8900-000000000017','b829eb33-8222-4b11-8900-000000000001','OWN_A project');
insert into public.project_items(project_id,user_id,kind,target_id,task_id,active,revision) values('b829eb33-8222-4b11-8900-000000000017','b829eb33-8222-4b11-8900-000000000001','task','b829eb33-8222-4b11-8900-000000000011','b829eb33-8222-4b11-8900-000000000011',false,2);
insert into public.inbox_captures(id,user_id,kind,title,task_id) values('b829eb33-8222-4b11-8900-000000000011','b829eb33-8222-4b11-8900-000000000001','task','OWN_A original','b829eb33-8222-4b11-8900-000000000011');
insert into public.space_creation_receipts(space_id,user_id,template_key,initial_title) values('b829eb33-8222-4b11-8900-000000000013','b829eb33-8222-4b11-8900-000000000001','blank','OWN_A original space');
insert into public.planner_preferences(user_id) values('b829eb33-8222-4b11-8900-000000000001');
insert into public.dashboard_layouts(user_id) values('b829eb33-8222-4b11-8900-000000000001');
insert into auth.users(id,email) values('b829eb33-8222-4b11-8900-000000000002','export-2@example.invalid');
insert into public.spaces(id,user_id,title) values('b829eb33-8222-4b11-8900-000000000023','b829eb33-8222-4b11-8900-000000000002','FOREIGN_SECRET space');
insert into public.tasks(id,user_id,title) values('b829eb33-8222-4b11-8900-000000000021','b829eb33-8222-4b11-8900-000000000002','FOREIGN_SECRET task');
insert into public.notes(id,user_id,title,body) values('b829eb33-8222-4b11-8900-000000000022','b829eb33-8222-4b11-8900-000000000002','FOREIGN_SECRET note','FOREIGN_SECRET [[FOREIGN_SECRET page|page:b829eb33-8222-4b11-8900-000000000024]]');
insert into public.space_pages(id,user_id,space_id,title,body) values('b829eb33-8222-4b11-8900-000000000024','b829eb33-8222-4b11-8900-000000000002','b829eb33-8222-4b11-8900-000000000023','FOREIGN_SECRET page','A saved body');
insert into public.calendar_events(id,user_id,title,event_date) values('b829eb33-8222-4b11-8900-000000000025','b829eb33-8222-4b11-8900-000000000002','FOREIGN_SECRET event','2026-10-29');
insert into public.habits(id,user_id,title,kind,target,unit,schedule,start_date) values('b829eb33-8222-4b11-8900-000000000026','b829eb33-8222-4b11-8900-000000000002','FOREIGN_SECRET habit','check',1,'done','daily','2026-10-29');
insert into public.projects(id,user_id,title) values('b829eb33-8222-4b11-8900-000000000027','b829eb33-8222-4b11-8900-000000000002','FOREIGN_SECRET project');
insert into public.project_items(project_id,user_id,kind,target_id,task_id,active,revision) values('b829eb33-8222-4b11-8900-000000000027','b829eb33-8222-4b11-8900-000000000002','task','b829eb33-8222-4b11-8900-000000000021','b829eb33-8222-4b11-8900-000000000021',false,2);
insert into public.inbox_captures(id,user_id,kind,title,task_id) values('b829eb33-8222-4b11-8900-000000000021','b829eb33-8222-4b11-8900-000000000002','task','FOREIGN_SECRET original','b829eb33-8222-4b11-8900-000000000021');
insert into public.space_creation_receipts(space_id,user_id,template_key,initial_title) values('b829eb33-8222-4b11-8900-000000000023','b829eb33-8222-4b11-8900-000000000002','blank','FOREIGN_SECRET original space');
insert into public.planner_preferences(user_id) values('b829eb33-8222-4b11-8900-000000000002');
insert into public.dashboard_layouts(user_id) values('b829eb33-8222-4b11-8900-000000000002');
insert into public.tasks(id,user_id,title) select ('b829eb33-8222-4b11-8900-'||lpad((1000+i)::text,12,'0'))::uuid,'b829eb33-8222-4b11-8900-000000000001','Older task '||i from generate_series(1,1005) i;
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
-- Check-ins must be inserted as their owner: the snapshot trigger verifies auth.uid().
select set_config('request.jwt.claims','{"sub":"b829eb33-8222-4b11-8900-000000000001","role":"authenticated"}',true);
insert into public.habit_checkins(habit_id,user_id,log_date,amount,target,unit,kind) values('b829eb33-8222-4b11-8900-000000000016','b829eb33-8222-4b11-8900-000000000001','2026-10-29',1,1,'done','check');
select set_config('request.jwt.claims','{"sub":"b829eb33-8222-4b11-8900-000000000002","role":"authenticated"}',true);
insert into public.habit_checkins(habit_id,user_id,log_date,amount,target,unit,kind) values('b829eb33-8222-4b11-8900-000000000026','b829eb33-8222-4b11-8900-000000000002','2026-10-29',1,1,'done','check');
select set_config('request.jwt.claims','{"sub":"b829eb33-8222-4b11-8900-000000000001","role":"authenticated"}',true);
do $$
declare r jsonb;key text;total bigint=0;
begin
 r=public.planner_export_data();
 if r->>'format'<>'life-planner-export' or (r->>'format_version')::integer not in(1,2,3,4,5) or (select count(*) from jsonb_object_keys(r->'data'))<>14 then raise exception 'EXPORT-V3 FAIL export contract';end if;
 if r::text like '%FOREIGN_SECRET%' then raise exception 'EXPORT-V3 FAIL foreign content exposed';end if;
 if (r->'counts'->>'tasks')::integer<>1006 then raise exception 'EXPORT-V3 FAIL truncated beyond 1000 records';end if;
 for key in select jsonb_object_keys(r->'data') loop
  if jsonb_array_length(r->'data'->key)<>(r->'counts'->>key)::integer then raise exception 'EXPORT-V3 FAIL incomplete collection';end if;
  if key<>'tasks' and (r->'counts'->>key)::integer<>1 then raise exception 'EXPORT-V3 FAIL missing or foreign collection: %',key;end if;
  total=total+(r->'counts'->>key)::bigint;
 end loop;
 if total<>(r->>'total_records')::bigint then raise exception 'EXPORT-V3 FAIL total mismatch';end if;
 if r->'data'->'project_items'->0->>'active'<>'false' or (r->'data'->'project_items'->0->>'revision')::integer<>2 then raise exception 'EXPORT-V3 FAIL inactive links/history omitted';end if;
 if r->'data'->'knowledge_links'->0->>'target_kind'<>'page' then raise exception 'EXPORT-V3 FAIL link reconstruction/foreign resolution';end if;
 if (r->'data'->'habit_checkins'->0->>'amount')::numeric is distinct from 1
 or (r->'data'->'habit_checkins'->0->>'target')::numeric is distinct from 1
 or r->'data'->'habit_checkins'->0->>'kind' is distinct from 'check'
 or r->'data'->'habit_checkins'->0->>'unit' is distinct from 'done'
 or r->'data'->'habit_checkins'->0->>'log_date' is distinct from '2026-10-29'
 then raise exception 'EXPORT-V3 history mismatch; expected amount=1, target=1, check/done, 2026-10-29. Fixture received: %',r->'data'->'habit_checkins';end if;
 if exists(select 1 from jsonb_each(r->'data') c cross join lateral jsonb_array_elements(c.value) item where item ? 'user_id' or item ? 'password' or item ? 'access_token') then raise exception 'EXPORT-V3 FAIL unapproved export fields';end if;
 if public.planner_export_data()<>r then raise exception 'EXPORT-V3 FAIL export mutated saved records/order';end if;
end;$$;

select set_config('request.jwt.claims','{"sub":"b829eb33-8222-4b11-8900-000000000002","role":"authenticated"}',true);
do $$
declare r jsonb;key text;
begin
 r=public.planner_export_data();
 if r::text like '%OWN_A%' then raise exception 'EXPORT-V3 FAIL reverse isolation';end if;
 for key in select jsonb_object_keys(r->'data') loop
  if (r->'counts'->>key)::integer<>1 then raise exception 'EXPORT-V3 FAIL reverse collection isolation';end if;
 end loop;
end;$$;
select set_config('request.jwt.claims','{"sub":"b829eb33-8222-4b11-8900-000000000001","role":"authenticated"}',true);
insert into public.notes(user_id,title,body) select 'b829eb33-8222-4b11-8900-000000000001','Size check '||i,repeat('x',20000) from generate_series(1,1050) i;
do $$ begin
 begin perform public.planner_export_data();raise exception 'EXPORT-V3 FAIL oversized export accepted';exception when program_limit_exceeded then null;end;
end;$$;
select set_config('request.jwt.claims','{"role":"authenticated"}',true);
do $$ begin
 begin perform public.planner_export_data();raise exception 'EXPORT-V3 FAIL missing identity accepted';exception when insufficient_privilege then null;end;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ begin
 begin perform public.planner_export_data();raise exception 'EXPORT-V3 FAIL anonymous export';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
select 'PASS EXPORT-V3: complete export, all-collection account isolation, anonymous denial, history/links, no mutation, >1000 records and oversized failure' as result;
