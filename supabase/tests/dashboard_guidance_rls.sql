-- Rollback-only fixtures. Apply migration 019 after task planning setup.
begin;
insert into auth.users(id,email) values
 ('cf22172a-f871-43b3-a610-a838d8b7e601','guide-a@example.invalid'),
 ('cf22172a-f871-43b3-a610-a838d8b7e602','guide-b@example.invalid');
insert into public.spaces(id,user_id,title) values ('cf22172a-f871-43b3-a610-a838d8b7e600','cf22172a-f871-43b3-a610-a838d8b7e601','Owned space');
insert into public.tasks(id,user_id,title,due_date,priority,created_at,space_id) values
 ('cf22172a-f871-43b3-a610-a838d8b7e611','cf22172a-f871-43b3-a610-a838d8b7e601','Old overdue','2026-10-26','low','2000-01-01','cf22172a-f871-43b3-a610-a838d8b7e600'),
 ('cf22172a-f871-43b3-a610-a838d8b7e612','cf22172a-f871-43b3-a610-a838d8b7e601','Due today','2026-10-27','none','2001-01-01',null),
 ('cf22172a-f871-43b3-a610-a838d8b7e613','cf22172a-f871-43b3-a610-a838d8b7e601','High priority',null,'high','2001-01-01',null),
 ('cf22172a-f871-43b3-a610-a838d8b7e614','cf22172a-f871-43b3-a610-a838d8b7e601','Soon','2026-10-30','medium','2001-01-01',null),
 ('cf22172a-f871-43b3-a610-a838d8b7e622','cf22172a-f871-43b3-a610-a838d8b7e602','Other account task','2020-01-01','high','2000-01-01',null);
insert into public.tasks(user_id,title,due_date,priority,completed) values ('cf22172a-f871-43b3-a610-a838d8b7e601','Already done','2020-01-01','high',true);
insert into public.tasks(user_id,title,created_at) select 'cf22172a-f871-43b3-a610-a838d8b7e601','Capture '||g,now() from generate_series(1,205) g;
insert into public.calendar_events(user_id,title,event_date) values
 ('cf22172a-f871-43b3-a610-a838d8b7e601','Today one','2026-10-27'),
 ('cf22172a-f871-43b3-a610-a838d8b7e601','Today two','2026-10-27'),
 ('cf22172a-f871-43b3-a610-a838d8b7e601','Tomorrow','2026-10-28'),
 ('cf22172a-f871-43b3-a610-a838d8b7e602','Other account event','2026-10-27');
insert into public.dashboard_layouts(user_id,layout) values ('cf22172a-f871-43b3-a610-a838d8b7e602','[]');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7e601","role":"authenticated"}',true);
do $$
declare result jsonb; changed integer;
begin
 result=public.planner_dashboard_guidance('2026-10-27');
 if (result->>'open')::integer<>209 or (result->>'overdue')::integer<>1 or (result->>'today')::integer<>1 or (result->>'unplanned')::integer<>205 then raise exception 'FAIL untruncated counts';end if;
 if result->'tasks'->0->>'title'<>'Old overdue' or result->'tasks'->1->>'title'<>'Due today' or result->'tasks'->2->>'title'<>'High priority' then raise exception 'FAIL ranking older tasks';end if;
 if result->'tasks'->0->>'space_title'<>'Owned space' then raise exception 'FAIL owned space context';end if;
 if (result->>'events_today')::integer<>2 or jsonb_array_length(result->'events')<>3 then raise exception 'FAIL event context';end if;
 if result::text like '%Other account%' or result::text like '%Already done%' then raise exception 'FAIL foreign/completed suggestion';end if;
 begin perform public.planner_dashboard_guidance('2101-01-01');raise exception 'FAIL date constraint';exception when invalid_parameter_value then null;end;
 insert into public.dashboard_layouts(user_id) values ('cf22172a-f871-43b3-a610-a838d8b7e601');
 if not exists(select 1 from public.dashboard_layouts where jsonb_array_length(layout)=7 and revision=1) then raise exception 'FAIL preserved default';end if;
 update public.dashboard_layouts set layout='[{"id":"guidance","width":"full","accent":"yellow"},{"id":"timer","width":"half"}]' where revision=1;
 if not exists(select 1 from public.dashboard_layouts where revision=2 and layout->0->>'id'='guidance') then raise exception 'FAIL save guidance';end if;
 update public.dashboard_layouts set layout='[]' where revision=1;get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL stale layout save';end if;
 update public.dashboard_layouts set layout='[]' where user_id='cf22172a-f871-43b3-a610-a838d8b7e602';get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL foreign layout write';end if;
 begin update public.dashboard_layouts set layout='[{"id":"guidance","width":"full","task":"stored content"}]';raise exception 'FAIL layout content constraint';exception when check_violation then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7e602","role":"authenticated"}',true);
do $$ declare result jsonb;begin
 result=public.planner_dashboard_guidance('2026-10-27');
 if (result->>'open')::integer<>1 or result->'tasks'->0->>'title'<>'Other account task' or (result->>'events_today')::integer<>1 or result::text like '%Owned space%' then raise exception 'FAIL second owner';end if;
end;$$;
set local role anon;
do $$ begin
 begin perform public.planner_dashboard_guidance('2026-10-27');raise exception 'FAIL anonymous execution';exception when insufficient_privilege then null;end;
end;$$;
rollback;
select 'PASS: guidance owner isolation, complete counts, ranking, event context, completed exclusion, anonymous denial, and saved-layout protection' as result;
