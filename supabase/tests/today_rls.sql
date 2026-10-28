-- Fictional fixtures only. Every source write is rolled back.
begin;
insert into auth.users(id,email) values('f8a3d661-4d7b-43af-98e1-6d2658ad9001','today-a@example.invalid'),('f8a3d661-4d7b-43af-98e1-6d2658ad9002','today-b@example.invalid');
insert into public.spaces(id,user_id,title) values('f8a3d661-4d7b-43af-98e1-6d2658ad9401','f8a3d661-4d7b-43af-98e1-6d2658ad9001','Owned area'),('f8a3d661-4d7b-43af-98e1-6d2658ad9402','f8a3d661-4d7b-43af-98e1-6d2658ad9002','Other area');
insert into public.tasks(id,user_id,title,due_date,priority,created_at,space_id)
select ('f8a3d661-4d7b-43af-98e1-6d2658ad91'||lpad(i::text,2,'0'))::uuid,'f8a3d661-4d7b-43af-98e1-6d2658ad9001','Due task '||i,case when i<=5 then date '2026-10-27' else date '2026-10-28' end,'none','2020-01-01'::timestamptz+i*interval '1 day','f8a3d661-4d7b-43af-98e1-6d2658ad9401' from generate_series(1,7) i;
insert into public.tasks(id,user_id,title,due_date,priority,completed) values
('f8a3d661-4d7b-43af-98e1-6d2658ad9108','f8a3d661-4d7b-43af-98e1-6d2658ad9001','Completed excluded','2026-10-27','high',true),
('f8a3d661-4d7b-43af-98e1-6d2658ad9109','f8a3d661-4d7b-43af-98e1-6d2658ad9001','Undated excluded',null,'high',false),
('f8a3d661-4d7b-43af-98e1-6d2658ad9110','f8a3d661-4d7b-43af-98e1-6d2658ad9001','Future excluded','2026-10-29','high',false),
('f8a3d661-4d7b-43af-98e1-6d2658ad9111','f8a3d661-4d7b-43af-98e1-6d2658ad9002','Other task','2026-10-28','none',false);
insert into public.calendar_events(id,user_id,title,event_date)
select ('f8a3d661-4d7b-43af-98e1-6d2658ad92'||lpad(i::text,2,'0'))::uuid,'f8a3d661-4d7b-43af-98e1-6d2658ad9001','Today event '||i,'2026-10-28' from generate_series(1,6) i;
insert into public.calendar_events(id,user_id,title,event_date) values
('f8a3d661-4d7b-43af-98e1-6d2658ad9207','f8a3d661-4d7b-43af-98e1-6d2658ad9001','Past excluded','2026-10-27'),
('f8a3d661-4d7b-43af-98e1-6d2658ad9208','f8a3d661-4d7b-43af-98e1-6d2658ad9001','Future excluded','2026-10-29'),
('f8a3d661-4d7b-43af-98e1-6d2658ad9209','f8a3d661-4d7b-43af-98e1-6d2658ad9002','Other event','2026-10-28');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"f8a3d661-4d7b-43af-98e1-6d2658ad9001","role":"authenticated"}',true);
do $$
declare s jsonb='{"title":"Habit","kind":"check","target":1,"unit":"done","schedule":"daily","weekdays":[],"weekly_goal":1,"space_id":"f8a3d661-4d7b-43af-98e1-6d2658ad9401","start_date":"2026-10-26","paused":false}';r jsonb;page2 jsonb;
begin
 perform public.planner_save_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9301',0,s||'{"title":"Daily due"}'::jsonb);
 perform public.planner_save_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9302',0,s||'{"title":"Weekday partial","kind":"amount","target":2,"unit":"glasses","schedule":"weekdays","weekdays":[3]}'::jsonb);
 perform public.planner_check_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9302','2026-10-28',1,0,1);
 perform public.planner_save_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9302',1,s||'{"title":"Weekday partial","kind":"amount","target":10,"unit":"glasses","schedule":"weekdays","weekdays":[3]}'::jsonb);
 perform public.planner_save_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9303',0,s||'{"title":"Weekly met earlier","schedule":"weekly"}'::jsonb);
 perform public.planner_check_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9303','2026-10-26',1,0,1);
 perform public.planner_save_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9304',0,s||'{"title":"Paused excluded","paused":true}'::jsonb);
 perform public.planner_save_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9305',0,s||'{"title":"Future habit excluded","start_date":"2026-10-29"}'::jsonb);
 perform public.planner_save_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9306',0,s||'{"title":"Other weekday excluded","schedule":"weekdays","weekdays":[2]}'::jsonb);
 perform public.planner_save_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9307',0,s||'{"title":"Paused logged today"}'::jsonb);
 perform public.planner_check_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9307','2026-10-28',1,0,1);
 perform public.planner_save_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9307',1,s||'{"title":"Paused logged today","paused":true}'::jsonb);
 perform public.planner_save_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9308',0,s||'{"title":"Weekly checked today","schedule":"weekly"}'::jsonb);
 perform public.planner_check_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9308','2026-10-28',1,0,1);
 r=public.planner_today('2026-10-28',0,0,0);
 if r->'counts'<>'{"tasks":7,"overdue":5,"habits":4,"habits_done":2,"events":6,"undated":1}'::jsonb then raise exception 'FAIL full-source counts: %',r->'counts';end if;
 if jsonb_array_length(r->'tasks')<>5 or jsonb_array_length(r->'events')<>5 or jsonb_array_length(r->'habits')<>4 then raise exception 'FAIL page bounds';end if;
 if r->'tasks'->0->>'title'<>'Due task 1' or r->'tasks'->0->'space'->>'title'<>'Owned area' then raise exception 'FAIL old source/order/context';end if;
 if not exists(select 1 from jsonb_array_elements(r->'habits') h where h->>'title'='Weekday partial' and (h->'log'->>'target')::numeric=2 and (h->>'target')::numeric=10) then raise exception 'FAIL recorded target context';end if;
 if r::text like '%excluded%' or r::text like '%Other event%' or r::text like '%Weekly met earlier%' then raise exception 'FAIL source exclusions';end if;
 page2=public.planner_today('2026-10-28',5,0,5);
 if jsonb_array_length(page2->'tasks')<>2 or jsonb_array_length(page2->'events')<>1 or page2->'counts'<>r->'counts' then raise exception 'FAIL independent pagination/counts';end if;
 begin perform public.planner_today('2026-10-28',1,0,0);raise exception 'FAIL invalid offset';exception when invalid_parameter_value then null;end;
 begin perform public.planner_today(null,0,0,0);raise exception 'FAIL invalid day';exception when invalid_parameter_value then null;end;
 if (select count(*) from public.tasks)<>10 or (select count(*) from public.habits)<>8 then raise exception 'FAIL read mutated sources';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"f8a3d661-4d7b-43af-98e1-6d2658ad9002","role":"authenticated"}',true);
do $$ declare r jsonb;begin
 perform public.planner_save_habit('f8a3d661-4d7b-43af-98e1-6d2658ad9310',0,'{"title":"Other habit","kind":"check","target":1,"unit":"done","schedule":"daily","weekdays":[],"weekly_goal":1,"space_id":null,"start_date":"2026-10-26","paused":false}');
 r=public.planner_today('2026-10-28',0,0,0);
 if (r->'counts'->>'tasks')::integer<>1 or (r->'counts'->>'events')::integer<>1 or (r->'counts'->>'habits')::integer<>1 or r::text like '%Owned area%' or r::text like '%Due task%' then raise exception 'FAIL cross-account isolation';end if;
end;$$;
set local role anon;
do $$ begin
 begin perform public.planner_today('2026-10-28',0,0,0);raise exception 'FAIL anonymous execution';exception when insufficient_privilege then null;end;
end;$$;
rollback;
select 'PASS: Today full-source counts, older tasks, exclusions, pagination, habit schedules/snapshots, space context, account isolation and anonymous denial' as result;