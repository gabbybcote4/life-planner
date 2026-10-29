-- VERSION: CUSTOM-REPEAT-CHECKS-V1. Fictional records roll back.
begin;
insert into auth.users(id,email) values
 ('d929eb33-8222-4b11-8900-000000000001','custom-a@example.invalid'),
 ('d929eb33-8222-4b11-8900-000000000002','custom-b@example.invalid');
insert into public.tasks(id,user_id,title) values
 ('d929eb33-8222-4b11-8900-000000000011','d929eb33-8222-4b11-8900-000000000001','Custom task'),
 ('d929eb33-8222-4b11-8900-000000000021','d929eb33-8222-4b11-8900-000000000002','PRIVATE CUSTOM B');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"d929eb33-8222-4b11-8900-000000000001","role":"authenticated"}',true);
do $$
declare t public.tasks%rowtype;r jsonb;next_id uuid;third_id uuid;n integer;rule jsonb='{"interval":2,"unit":"week","weekdays":[1,3],"monthly_mode":"date","ends":"after","end_date":null,"count":3}';
begin
 if public.planner_valid_repeat_rule(rule||'{"unit":null}') or public.planner_valid_repeat_rule(rule||'{"weekdays":[1,1]}') or public.planner_valid_repeat_rule(rule||'{"interval":0}') or public.planner_valid_repeat_rule(rule||'{"extra":"bad"}') then raise exception 'FAIL custom validation';end if;
 update public.tasks set due_date='2026-11-02',repeat_frequency='custom',repeat_rule=rule where id='d929eb33-8222-4b11-8900-000000000011';
 select * into t from public.tasks where id='d929eb33-8222-4b11-8900-000000000011';
 if public.planner_task_repeat_next(t)<>'2026-11-04'::date then raise exception 'FAIL multiple weekdays in same week';end if;
 next_id=t.repeat_next_id;
 update public.tasks set completed=true where id=t.id;
 select * into t from public.tasks where id=next_id;
 if t.repeat_index<>2 or t.repeat_anchor_date<>'2026-11-02'::date or public.planner_task_repeat_next(t)<>'2026-11-16'::date then raise exception 'FAIL every two weeks anchor';end if;
 third_id=t.repeat_next_id;
 update public.tasks set completed=true where id=next_id;
 select * into t from public.tasks where id=third_id;
 if t.repeat_index<>3 then raise exception 'FAIL occurrence counter';end if;
 update public.tasks set completed=true where id=third_id;
 if not exists(select 1 from public.tasks where id=third_id and repeat_finished) or (select count(*) from public.tasks)<>3 then raise exception 'FAIL count ending';end if;
 update public.tasks set completed=false where id=third_id;update public.tasks set completed=true where id=third_id;
 if (select count(*) from public.tasks)<>3 then raise exception 'FAIL final occurrence retry';end if;
 -- Pure calculations use a typed fictional row; no stored history is changed.
 t.due_date='2026-11-02';t.repeat_anchor_date=t.due_date;t.repeat_anchor_day=2;t.repeat_index=1;
 t.repeat_rule='{"interval":3,"unit":"day","weekdays":[],"monthly_mode":"date","ends":"on","end_date":"2026-11-04","count":null}';
 if public.planner_task_repeat_next(t) is not null then raise exception 'FAIL date ending';end if;
 t.repeat_rule=jsonb_set(t.repeat_rule,'{end_date}','"2026-11-05"');
 if public.planner_task_repeat_next(t)<>'2026-11-05'::date then raise exception 'FAIL inclusive ending';end if;
 t.due_date='2026-01-30';t.repeat_anchor_date=t.due_date;t.repeat_anchor_day=30;
 t.repeat_rule='{"interval":1,"unit":"month","weekdays":[],"monthly_mode":"last_weekday","ends":"never","end_date":null,"count":null}';
 if public.planner_task_repeat_next(t)<>'2026-02-27'::date then raise exception 'FAIL last weekday';end if;
 t.due_date='2026-01-31';t.repeat_anchor_date=t.due_date;t.repeat_anchor_day=31;t.repeat_rule=jsonb_set(t.repeat_rule,'{monthly_mode}','"weekday"');
 if public.planner_task_repeat_next(t)<>'2026-05-30'::date then raise exception 'FAIL fifth weekday skip';end if;
 t.repeat_rule='{"interval":2,"unit":"month","weekdays":[],"monthly_mode":"date","ends":"never","end_date":null,"count":null}';
 if public.planner_task_repeat_next(t)<>'2026-03-31'::date then raise exception 'FAIL two-month repeat';end if;
 t.due_date='2028-02-29';t.repeat_anchor_date=t.due_date;t.repeat_anchor_day=29;t.repeat_frequency='yearly';
 if public.planner_task_repeat_next(t)<>'2029-02-28'::date then raise exception 'FAIL yearly leap clamp';end if;
 t.due_date='2031-02-28';if public.planner_task_repeat_next(t)<>'2032-02-29'::date then raise exception 'FAIL yearly leap restore';end if;
 t.repeat_frequency='custom';t.due_date='2028-02-29';t.repeat_rule='{"interval":4,"unit":"year","weekdays":[],"monthly_mode":"date","ends":"never","end_date":null,"count":null}';
 if public.planner_task_repeat_next(t)<>'2032-02-29'::date then raise exception 'FAIL custom year interval';end if;
 begin update public.tasks set repeat_index=1 where id=third_id;raise exception 'FAIL internal count mutable';exception when insufficient_privilege then null;end;
 update public.tasks set due_date='2026-12-01' where id='d929eb33-8222-4b11-8900-000000000021';get diagnostics n=row_count;
 if n<>0 then raise exception 'FAIL calendar foreign task edit';end if;
 -- The calendar reads original tasks by due_date, not copied events.
 select count(*) into n from public.tasks where user_id=auth.uid() and due_date>='2026-11-01' and due_date<'2026-12-01';
 if n<>3 or exists(select 1 from public.tasks where user_id<>auth.uid()) then raise exception 'FAIL calendar range/isolation';end if;
 if exists(select 1 from public.calendar_events) then raise exception 'FAIL copied calendar events';end if;
 r=public.planner_export_data();
 if (r->>'format_version')::integer not in(3,4,5,6) or r::text like '%PRIVATE CUSTOM B%' or not exists(select 1 from jsonb_array_elements(r->'data'->'tasks') x where x->>'id'=third_id::text and (x->>'repeat_finished')::boolean and x->'repeat_rule'=rule) then raise exception 'FAIL custom export';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"d929eb33-8222-4b11-8900-000000000002","role":"authenticated"}',true);
do $$begin
 if (select count(*) from public.tasks)<>1 then raise exception 'FAIL custom account B isolation';end if;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$begin
 begin perform 1 from public.tasks;raise exception 'FAIL anonymous calendar tasks';exception when insufficient_privilege then null;end;
 begin perform public.planner_valid_repeat_rule('{}');raise exception 'FAIL anonymous custom function';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
select 'PASS CUSTOM-REPEAT-V1: intervals, weekdays, monthly patterns, leap years, endings, duplicate protection, calendar task ownership and v3 export' as result;
