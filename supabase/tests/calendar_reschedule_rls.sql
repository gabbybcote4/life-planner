-- VERSION: MOVE-CHECKS-V1. Fictional records; all changes roll back.
begin;
insert into auth.users(id,email) values
 ('a933eb33-8222-4b11-8900-000000000001','move-a@example.invalid'),
 ('a933eb33-8222-4b11-8900-000000000002','move-b@example.invalid');
insert into public.tasks(id,user_id,title) values
 ('a933eb33-8222-4b11-8900-000000000011','a933eb33-8222-4b11-8900-000000000001','Weekly move fixture'),
 ('a933eb33-8222-4b11-8900-000000000012','a933eb33-8222-4b11-8900-000000000001','One-off move'),
 ('a933eb33-8222-4b11-8900-000000000014','a933eb33-8222-4b11-8900-000000000001','Current future phase'),
 ('a933eb33-8222-4b11-8900-000000000015','a933eb33-8222-4b11-8900-000000000001','Monthly one move'),
 ('a933eb33-8222-4b11-8900-000000000021','a933eb33-8222-4b11-8900-000000000002','FOREIGN MOVE');
insert into public.projects(id,user_id,title) values('a933eb33-8222-4b11-8900-000000000013','a933eb33-8222-4b11-8900-000000000001','Move project');
insert into public.project_items(project_id,user_id,kind,target_id,task_id) values('a933eb33-8222-4b11-8900-000000000013','a933eb33-8222-4b11-8900-000000000001','task','a933eb33-8222-4b11-8900-000000000011','a933eb33-8222-4b11-8900-000000000011');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"a933eb33-8222-4b11-8900-000000000001","role":"authenticated"}',true);
do $$
declare t public.tasks%rowtype;r jsonb;child uuid;detached uuid;split uuid;series uuid;rev integer;before_count integer;req uuid='a933eb33-8222-4b11-8900-000000000101';
begin
 update public.tasks set due_date='2026-10-30',due_time='09:00',due_timezone='America/Edmonton',repeat_frequency='custom',repeat_rule='{"interval":1,"unit":"week","weekdays":[5],"monthly_mode":"date","ends":"after","end_date":null,"count":6}' where id='a933eb33-8222-4b11-8900-000000000011';
 select * into t from public.tasks where id='a933eb33-8222-4b11-8900-000000000011';series=t.repeat_series_id;rev=t.planning_revision;child=t.repeat_next_id;
 r=public.planner_reschedule_task(req,t.id,rev,1,'2026-10-30','2026-10-31','11:00','America/Edmonton','one');
 if not exists(select 1 from public.tasks where id=t.id and due_date='2026-10-31' and due_time='11:00' and repeat_scheduled_date='2026-10-30' and repeat_series_id=series and repeat_index=1) then raise exception 'FAIL current-only move';end if;
 if public.planner_reschedule_task(req,t.id,rev,1,'2026-10-30','2026-10-31','11:00','America/Edmonton','one')<>r then raise exception 'FAIL move retry';end if;
 begin perform public.planner_reschedule_task(req,t.id,rev,1,'2026-10-30','2026-11-01','11:00','America/Edmonton','one');raise exception 'FAIL changed retry';exception when unique_violation then null;end;
 update public.tasks set completed=true where id=t.id;
 select * into t from public.tasks where id=child;
 if t.due_date<>'2026-11-06'::date or t.due_time<>time '09:00' or t.repeat_index<>2 or t.repeat_series_id<>series then raise exception 'FAIL original weekly phase/clock';end if;
 r=public.planner_reschedule_task('a933eb33-8222-4b11-8900-000000000102',t.id,t.planning_revision,3,'2026-11-13','2026-11-14','10:30','America/Edmonton','one');detached=(r->>'id')::uuid;
 if not exists(select 1 from public.tasks where id=detached and due_date='2026-11-14' and due_time='10:30' and repeat_frequency='none') then raise exception 'FAIL future single move';end if;
 if not exists(select 1 from public.project_items where task_id=detached and active) then raise exception 'FAIL single project link';end if;
 r=public.planner_calendar_repeats('2026-11-01');
 if exists(select 1 from jsonb_array_elements(r) x where x->>'due_date'='2026-11-13') or not exists(select 1 from jsonb_array_elements(r) x where x->>'due_date'='2026-11-20' and x->>'occurrence_index'='4') then raise exception 'FAIL moved preview suppression';end if;
 child=t.repeat_next_id;update public.tasks set completed=true where id=t.id;
 select * into t from public.tasks where id=child;
 if t.due_date<>'2026-11-20'::date or t.repeat_index<>4 then raise exception 'FAIL skip detached occurrence';end if;
 rev=t.planning_revision;
 r=public.planner_reschedule_task('a933eb33-8222-4b11-8900-000000000103',t.id,rev,5,'2026-11-27','2026-11-28','12:00','America/Edmonton','future');split=(r->>'id')::uuid;
 if not exists(select 1 from public.tasks where id=split and due_date='2026-11-28' and repeat_frequency='custom' and repeat_rule->'weekdays'='[6]'::jsonb and repeat_rule->>'count'='2' and repeat_index=1 and repeat_series_id<>series) then raise exception 'FAIL future split phase/count';end if;
 select count(*) into before_count from public.tasks;
 if public.planner_reschedule_task('a933eb33-8222-4b11-8900-000000000103',t.id,rev,5,'2026-11-27','2026-11-28','12:00','America/Edmonton','future')<>r or (select count(*) from public.tasks)<>before_count then raise exception 'FAIL split retry duplicated';end if;
 begin perform public.planner_reschedule_task(gen_random_uuid(),t.id,rev,4,'2026-11-20','2026-11-21',null,null,'one');raise exception 'FAIL stale move';exception when serialization_failure then null;end;
 update public.tasks set completed=true where id=t.id;
 if exists(select 1 from public.tasks where id=t.repeat_next_id) then raise exception 'FAIL old series continued beyond split';end if;
 select * into t from public.tasks where id=split;child=t.repeat_next_id;
 update public.tasks set completed=true where id=split;
 if not exists(select 1 from public.tasks where id=child and due_date='2026-12-05' and due_time='12:00' and repeat_index=2) then raise exception 'FAIL shifted future schedule';end if;
 update public.tasks set completed=true where id=child;
 if not exists(select 1 from public.tasks where id=child and repeat_finished) then raise exception 'FAIL split retained count ending';end if;
 if not exists(select 1 from public.tasks where id='a933eb33-8222-4b11-8900-000000000011' and completed and due_date='2026-10-31') then raise exception 'FAIL completed history altered';end if;
 update public.tasks set due_date='2026-11-01' where id='a933eb33-8222-4b11-8900-000000000012';
 select * into t from public.tasks where id='a933eb33-8222-4b11-8900-000000000012';
 perform public.planner_reschedule_task('a933eb33-8222-4b11-8900-000000000104',t.id,t.planning_revision,0,t.due_date,'2026-11-02','00:00','UTC','one');
 if not exists(select 1 from public.tasks where id=t.id and due_date='2026-11-02' and due_time='00:00') then raise exception 'FAIL one-off midnight move';end if;
 begin perform public.planner_reschedule_task(gen_random_uuid(),'a933eb33-8222-4b11-8900-000000000021',1,0,'2026-11-01','2026-11-02',null,null,'one');raise exception 'FAIL foreign move';exception when insufficient_privilege then null;end;
 begin insert into public.task_reschedule_receipts(id,user_id,payload,target_id) values(gen_random_uuid(),auth.uid(),'{}',t.id);raise exception 'FAIL forged receipt';exception when insufficient_privilege then null;end;
 begin update public.task_repeat_changes set kind='future';raise exception 'FAIL raw override update';exception when insufficient_privilege then null;end;
 begin update public.tasks set repeat_series_id=gen_random_uuid() where id=t.id;raise exception 'FAIL internal identity write';exception when insufficient_privilege then null;end;
 -- A current-only exception can later become a new future phase without using its old clock.
 update public.tasks set due_date='2026-10-30',due_time='09:00',due_timezone='UTC',repeat_frequency='custom',repeat_rule='{"interval":1,"unit":"week","weekdays":[5],"monthly_mode":"date","ends":"after","end_date":null,"count":4}' where id='a933eb33-8222-4b11-8900-000000000014';
 select repeat_next_id into child from public.tasks where id='a933eb33-8222-4b11-8900-000000000014';
 update public.tasks set completed=true where id='a933eb33-8222-4b11-8900-000000000014';
 select * into t from public.tasks where id=child;
 perform public.planner_reschedule_task('a933eb33-8222-4b11-8900-000000000105',t.id,t.planning_revision,2,'2026-11-06','2026-11-07','11:00','UTC','one');
 select * into t from public.tasks where id=child;
 perform public.planner_reschedule_task('a933eb33-8222-4b11-8900-000000000106',t.id,t.planning_revision,2,'2026-11-06','2026-11-07','12:00','UTC','future');
 select * into t from public.tasks where id=child;
 if t.repeat_index<>1 or t.repeat_rule->>'count'<>'3' or t.repeat_rule->'weekdays'<>'[6]'::jsonb then raise exception 'FAIL current future phase remaining count';end if;
 update public.tasks set completed=true where id=child;
 if not exists(select 1 from public.tasks where id=t.repeat_next_id and due_date='2026-11-14' and due_time='12:00' and repeat_index=2) then raise exception 'FAIL future clock overrode single exception';end if;
 -- One moved monthly date must retain its original month-end anchor.
 update public.tasks set due_date='2026-01-31',repeat_frequency='custom',repeat_rule='{"interval":1,"unit":"month","weekdays":[],"monthly_mode":"date","ends":"after","end_date":null,"count":2}' where id='a933eb33-8222-4b11-8900-000000000015';
 select * into t from public.tasks where id='a933eb33-8222-4b11-8900-000000000015';
 perform public.planner_reschedule_task('a933eb33-8222-4b11-8900-000000000107',t.id,t.planning_revision,1,'2026-01-31','2026-01-30',null,null,'one');
 update public.tasks set completed=true where id=t.id;
 if not exists(select 1 from public.tasks where id=t.repeat_next_id and due_date='2026-02-28' and repeat_anchor_day=31) then raise exception 'FAIL monthly single anchor';end if;
 r=public.planner_export_data();
 if (r->>'format_version')::integer<>6 or (r->'counts'->>'task_repeat_changes')::integer<>5 or (r->'counts'->>'task_reschedule_receipts')::integer<>7 or r::text like '%FOREIGN MOVE%' then raise exception 'FAIL move export/isolation';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"a933eb33-8222-4b11-8900-000000000002","role":"authenticated"}',true);
do $$begin
 if exists(select 1 from public.task_repeat_changes) or exists(select 1 from public.task_reschedule_receipts) or (select count(*) from public.tasks)<>1 then raise exception 'FAIL reverse move isolation';end if;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$begin
 begin perform public.planner_reschedule_task(gen_random_uuid(),'a933eb33-8222-4b11-8900-000000000012',1,0,'2026-11-01','2026-11-02',null,null,'one');raise exception 'FAIL anonymous move';exception when insufficient_privilege then null;end;
 begin perform 1 from public.task_repeat_changes;raise exception 'FAIL anonymous changes';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
select 'PASS MOVE-V1: one/current/future moves, original phase, split endings, project links, history, retry/stale protection, private writes, account isolation and v6 export' as result;
