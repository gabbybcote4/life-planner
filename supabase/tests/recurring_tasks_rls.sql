-- VERSION: REPEAT-CHECKS-V1. Fictional fixtures, rolled back on success.
begin;
insert into auth.users(id,email) values
 ('c928eb33-8222-4b11-8900-000000000001','repeat-a@example.invalid'),
 ('c928eb33-8222-4b11-8900-000000000002','repeat-b@example.invalid');
insert into public.spaces(id,user_id,title) values('c928eb33-8222-4b11-8900-000000000010','c928eb33-8222-4b11-8900-000000000001','Repeat space');
insert into public.tasks(id,user_id,title,space_id) values
 ('c928eb33-8222-4b11-8900-000000000011','c928eb33-8222-4b11-8900-000000000001','Monthly chore','c928eb33-8222-4b11-8900-000000000010'),
 ('c928eb33-8222-4b11-8900-000000000021','c928eb33-8222-4b11-8900-000000000002','FOREIGN_REPEAT',null);
insert into public.projects(id,user_id,title) values
 ('c928eb33-8222-4b11-8900-000000000012','c928eb33-8222-4b11-8900-000000000001','Active link'),
 ('c928eb33-8222-4b11-8900-000000000013','c928eb33-8222-4b11-8900-000000000001','Unlinked');
insert into public.project_items(project_id,user_id,kind,target_id,task_id,active) values
 ('c928eb33-8222-4b11-8900-000000000012','c928eb33-8222-4b11-8900-000000000001','task','c928eb33-8222-4b11-8900-000000000011','c928eb33-8222-4b11-8900-000000000011',true),
 ('c928eb33-8222-4b11-8900-000000000013','c928eb33-8222-4b11-8900-000000000001','task','c928eb33-8222-4b11-8900-000000000011','c928eb33-8222-4b11-8900-000000000011',false);
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"c928eb33-8222-4b11-8900-000000000001","role":"authenticated"}',true);
do $$
declare next_id uuid;third_id uuid;n integer;r jsonb;rev integer;
begin
 if public.planner_next_task_date('2028-01-31','monthly',31)<>'2028-02-29'::date or public.planner_next_task_date('2026-02-28','monthly',31)<>'2026-03-31'::date or public.planner_next_task_date('2026-10-30','weekdays',30)<>'2026-11-02'::date or public.planner_next_task_date('2026-10-31','weekdays',31)<>'2026-11-02'::date or public.planner_next_task_date('2026-12-28','weekly',28)<>'2027-01-04'::date or public.planner_next_task_date('2026-12-31','daily',31)<>'2027-01-01'::date then raise exception 'FAIL repeat arithmetic';end if;
 begin
  update public.tasks set repeat_frequency='daily' where id='c928eb33-8222-4b11-8900-000000000011';
  raise exception 'FAIL repeat without date';
 exception when check_violation then null;end;
 update public.tasks set due_date='2026-01-31',priority='high',repeat_frequency='monthly' where id='c928eb33-8222-4b11-8900-000000000011';
 select repeat_next_id,planning_revision into next_id,rev from public.tasks where id='c928eb33-8222-4b11-8900-000000000011';
 if rev<>2 then raise exception 'FAIL repeat planning revision';end if;
 update public.tasks set repeat_frequency='weekly' where id='c928eb33-8222-4b11-8900-000000000011' and planning_revision=1;
 get diagnostics n=row_count;if n<>0 then raise exception 'FAIL stale repeat edit';end if;
 update public.tasks set completed=true where id='c928eb33-8222-4b11-8900-000000000011';
 if not exists(select 1 from public.tasks where id=next_id and title='Monthly chore' and not completed and due_date='2026-02-28' and priority='high' and space_id='c928eb33-8222-4b11-8900-000000000010' and repeat_anchor_day=31 and repeat_frequency='monthly' and repeat_parent_id='c928eb33-8222-4b11-8900-000000000011') then raise exception 'FAIL next task or monthly anchor';end if;
 if (select count(*) from public.project_items where task_id=next_id and active)<>1 then raise exception 'FAIL copied active project links';end if;
 if not exists(select 1 from public.project_items where task_id=next_id and project_id='c928eb33-8222-4b11-8900-000000000012') then raise exception 'FAIL correct project link';end if;
 r=public.planner_today('2026-02-28');
 if r->'tasks'->0->>'repeat_frequency' is distinct from 'monthly' then raise exception 'FAIL Today repeat metadata';end if;
 select repeat_next_id into third_id from public.tasks where id=next_id;
 update public.tasks set completed=true where id=next_id;
 if not exists(select 1 from public.tasks where id=third_id and due_date='2026-03-31' and repeat_anchor_day=31) then raise exception 'FAIL restored monthly anchor';end if;
 update public.tasks set completed=false where id='c928eb33-8222-4b11-8900-000000000011';
 update public.tasks set completed=true where id='c928eb33-8222-4b11-8900-000000000011';
 update public.tasks set completed=true where id='c928eb33-8222-4b11-8900-000000000011';
 if (select count(*) from public.tasks)<>3 then raise exception 'FAIL duplicate occurrence or isolation';end if;
 begin
  update public.tasks set due_date='2026-01-30' where id='c928eb33-8222-4b11-8900-000000000011';
  raise exception 'FAIL completed repeat schedule changed';
 exception when check_violation then null;end;
 update public.tasks set repeat_frequency='none',due_date=null where id=third_id;
 update public.tasks set completed=true where id=third_id;
 if (select count(*) from public.tasks)<>3 then raise exception 'FAIL stopped repeat';end if;
 begin
  update public.tasks set due_date='2026-04-30',repeat_frequency='monthly' where id=third_id;
  raise exception 'FAIL repeat added to completed task';
 exception when check_violation then null;end;
 update public.tasks set repeat_frequency='weekly' where id='c928eb33-8222-4b11-8900-000000000021';get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL foreign repeat update';end if;
 begin
  update public.tasks set repeat_next_id=gen_random_uuid() where id=third_id;
  raise exception 'FAIL internal identity mutable';
 exception when insufficient_privilege then null;end;
 begin
  update public.tasks set repeat_anchor_day=1 where id=third_id;
  raise exception 'FAIL internal anchor mutable';
 exception when insufficient_privilege then null;end;
 insert into public.tasks(id,title) values('c928eb33-8222-4b11-8900-000000000014','Range boundary');
 update public.tasks set due_date='2100-12-31',repeat_frequency='daily' where id='c928eb33-8222-4b11-8900-000000000014';
 begin
  update public.tasks set completed=true where id='c928eb33-8222-4b11-8900-000000000014';
  raise exception 'FAIL unsupported repeat date accepted';
 exception when invalid_parameter_value then null;end;
 if not exists(select 1 from public.tasks where id='c928eb33-8222-4b11-8900-000000000014' and not completed) or (select count(*) from public.tasks)<>4 then raise exception 'FAIL atomic rollback';end if;
 r=public.planner_export_data();
 if (r->>'format_version')::integer not in(2,3,4,5) or r::text like '%FOREIGN_REPEAT%' or not exists(select 1 from jsonb_array_elements(r->'data'->'tasks') t where t->>'id'=next_id::text and t->>'repeat_parent_id'='c928eb33-8222-4b11-8900-000000000011' and t->>'repeat_anchor_day'='31') then raise exception 'FAIL repeat export';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"c928eb33-8222-4b11-8900-000000000002","role":"authenticated"}',true);
do $$begin
 if (select count(*) from public.tasks)<>1 then raise exception 'FAIL account B isolation';end if;
 update public.tasks set due_date='2026-11-01',repeat_frequency='daily' where id='c928eb33-8222-4b11-8900-000000000021';
 update public.tasks set completed=true where id='c928eb33-8222-4b11-8900-000000000021';
 if (select count(*) from public.tasks)<>2 then raise exception 'FAIL account B own repeat';end if;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$begin
 begin perform 1 from public.tasks;raise exception 'FAIL anonymous read';exception when insufficient_privilege then null;end;
 begin update public.tasks set completed=true;raise exception 'FAIL anonymous write';exception when insufficient_privilege then null;end;
 begin perform public.planner_next_task_date('2026-01-01','daily',1);raise exception 'FAIL anonymous function';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
select 'PASS REPEAT-V1: schedules, monthly anchors, saved history, project links, duplicate protection, revision checks, account isolation, anonymous denial, atomic rollback and v2 export' as result;
