-- Fictional identities only; all writes roll back.
begin;
insert into auth.users(id,email) values('f1122a55-9220-4700-8900-770000000001','planning-a@example.invalid'),('f1122a55-9220-4700-8900-770000000002','planning-b@example.invalid');
insert into public.planner_preferences(user_id) values('f1122a55-9220-4700-8900-770000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"f1122a55-9220-4700-8900-770000000001","role":"authenticated"}',true);
do $$
declare changed integer;
begin
 if (select count(*) from public.planner_preferences)<>0 then raise exception 'FAIL foreign read';end if;
 insert into public.planner_preferences(user_id,week_start,date_format) values('f1122a55-9220-4700-8900-770000000001','monday','dmy');
 if not exists(select 1 from public.planner_preferences where planning_revision=2 and text_revision=1 and nav_revision=1 and theme='sage') then raise exception 'FAIL independent defaults';end if;
 update public.planner_preferences set date_format='mdy' where planning_revision=2;
 if not exists(select 1 from public.planner_preferences where planning_revision=3 and date_format='mdy') then raise exception 'FAIL own update';end if;
 update public.planner_preferences set date_format='iso' where planning_revision=2;get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL stale save';end if;
 update public.planner_preferences set week_start='sunday' where user_id='f1122a55-9220-4700-8900-770000000002';get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL foreign update';end if;
 begin update public.planner_preferences set week_start='other';raise exception 'FAIL week allowlist';exception when check_violation then null;end;
 begin update public.planner_preferences set date_format='other';raise exception 'FAIL format allowlist';exception when check_violation then null;end;
 begin update public.planner_preferences set planning_revision=100;raise exception 'FAIL manual revision';exception when insufficient_privilege then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"f1122a55-9220-4700-8900-770000000002","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.planner_preferences)<>1 or not exists(select 1 from public.planner_preferences where week_start='sunday' and date_format='iso' and planning_revision=1) then raise exception 'FAIL reverse isolation';end if;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ begin
 begin perform week_start from public.planner_preferences;raise exception 'FAIL anonymous read';exception when insufficient_privilege then null;end;
 begin update public.planner_preferences set week_start='monday';raise exception 'FAIL anonymous update';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
select 'PASS: planning defaults own read/write, account isolation, anonymous denial, allowlists and independent revision protection' as result;
