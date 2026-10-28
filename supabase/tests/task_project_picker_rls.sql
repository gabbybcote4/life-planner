-- Fictional test accounts only. All changes roll back.
begin;
insert into auth.users(id,email) values('e6410b22-4b22-49b1-8b11-110000000001','task-project-a@example.invalid'),('e6410b22-4b22-49b1-8b11-110000000002','task-project-b@example.invalid');
insert into public.tasks(id,user_id,title,due_date,priority) values('e6410b22-4b22-49b1-8b11-110000000011','e6410b22-4b22-49b1-8b11-110000000001','Original','2026-10-28','high'),('e6410b22-4b22-49b1-8b11-110000000012','e6410b22-4b22-49b1-8b11-110000000002','Other',null,'none');
insert into public.projects(id,user_id,title) select ('e6410b22-4b22-49b1-8b11-1100000001'||lpad(i::text,2,'0'))::uuid,'e6410b22-4b22-49b1-8b11-110000000001',case when i=1 then 'Literal %_' else 'Project '||lpad(i::text,2,'0') end from generate_series(1,23) i;
insert into public.projects(id,user_id,title) values('e6410b22-4b22-49b1-8b11-110000000201','e6410b22-4b22-49b1-8b11-110000000002','Hidden project');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"e6410b22-4b22-49b1-8b11-110000000001","role":"authenticated"}',true);
do $$
declare t uuid='e6410b22-4b22-49b1-8b11-110000000011';p uuid='e6410b22-4b22-49b1-8b11-110000000101';r jsonb;b jsonb;i integer;
begin
 for i in 1..4 loop perform public.planner_set_project_item(('e6410b22-4b22-49b1-8b11-1100000001'||lpad(i::text,2,'0'))::uuid,'task',t,true,0);end loop;
 r=public.planner_task_project_choices(t,'',0);
 if jsonb_array_length(r->'items')<>20 or not (r->>'more')::boolean or not (r->'items'->0->>'active')::boolean then raise exception 'FAIL bounded active-first choices';end if;
 if exists(select 1 from jsonb_array_elements(r->'items') x where x->>'title'='Hidden project') then raise exception 'FAIL foreign project exposed';end if;
 r=public.planner_task_project_choices(t,'',20);
 if jsonb_array_length(r->'items')<>3 or (r->>'more')::boolean then raise exception 'FAIL next project page';end if;
 r=public.planner_task_project_choices(t,'%_',0);
 if jsonb_array_length(r->'items')<>1 or r->'items'->0->>'title'<>'Literal %_' then raise exception 'FAIL literal substring';end if;
 b=public.planner_task_project_badges(array[t,'e6410b22-4b22-49b1-8b11-110000000012'::uuid]);
 if jsonb_array_length(b)<>1 or (b->0->>'total')::integer<>4 or jsonb_array_length(b->0->'projects')<>3 then raise exception 'FAIL bounded badges/full count/foreign task';end if;
 perform public.planner_set_project_item(p,'task',t,false,1);
 r=public.planner_task_project_choices(t,'%_',0);
 if (r->'items'->0->>'active')::boolean or (r->'items'->0->>'revision')::integer<>2 then raise exception 'FAIL inactive revision baseline';end if;
 begin perform public.planner_set_project_item(p,'task',t,true,0);raise exception 'FAIL stale restore';exception when serialization_failure then null;end;
 perform public.planner_set_project_item(p,'task',t,true,2);
 if not exists(select 1 from public.tasks where id=t and title='Original' and not completed and due_date='2026-10-28' and priority='high' and space_id is null) then raise exception 'FAIL source changed';end if;
 begin perform public.planner_task_project_choices('e6410b22-4b22-49b1-8b11-110000000012','',0);raise exception 'FAIL foreign task picker';exception when insufficient_privilege then null;end;
 begin perform public.planner_task_project_choices(t,'',1);raise exception 'FAIL unbounded page';exception when invalid_parameter_value then null;end;
 begin perform public.planner_task_project_badges(array_fill(t,array[201]));raise exception 'FAIL unbounded batch';exception when invalid_parameter_value then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"e6410b22-4b22-49b1-8b11-110000000002","role":"authenticated"}',true);
do $$
declare r jsonb;
begin
 r=public.planner_task_project_badges(array['e6410b22-4b22-49b1-8b11-110000000011'::uuid,'e6410b22-4b22-49b1-8b11-110000000012'::uuid]);
 if jsonb_array_length(r)<>1 or r->0->>'task_id'<>'e6410b22-4b22-49b1-8b11-110000000012' or (r->0->>'total')::integer<>0 then raise exception 'FAIL reverse account isolation';end if;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$
begin
 begin perform public.planner_task_project_choices('e6410b22-4b22-49b1-8b11-110000000011','',0);raise exception 'FAIL anonymous choices';exception when insufficient_privilege then null;end;
 begin perform public.planner_task_project_badges('{}'::uuid[]);raise exception 'FAIL anonymous badges';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
select 'PASS: task project choices, badge bounds/counts, literal search, revision restore, source preservation, account isolation and anonymous denial' as result;
