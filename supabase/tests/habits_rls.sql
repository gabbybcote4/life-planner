-- Fictional accounts/records only; all test writes roll back.
begin;
insert into auth.users(id,email) values
 ('cf22172a-f871-43b3-a610-a838d8b7a901','habits-a@example.invalid'),
 ('cf22172a-f871-43b3-a610-a838d8b7a902','habits-b@example.invalid');
insert into public.spaces(id,user_id,title) values
 ('cf22172a-f871-43b3-a610-a838d8b7a910','cf22172a-f871-43b3-a610-a838d8b7a901','Habit space'),
 ('cf22172a-f871-43b3-a610-a838d8b7a920','cf22172a-f871-43b3-a610-a838d8b7a902','Other space');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7a901","role":"authenticated"}',true);
do $$
declare s jsonb='{"title":"Water","kind":"amount","target":2,"unit":"glasses","schedule":"weekly","weekdays":[],"weekly_goal":3,"space_id":"cf22172a-f871-43b3-a610-a838d8b7a910","start_date":"2026-10-26","paused":false}';r jsonb;changed integer;
begin
 perform public.planner_save_habit('cf22172a-f871-43b3-a610-a838d8b7a911',0,s);
 perform public.planner_save_habit('cf22172a-f871-43b3-a610-a838d8b7a911',0,s);
 if (select count(*) from public.habits)<>1 then raise exception 'FAIL retry duplicate';end if;
 perform public.planner_check_habit('cf22172a-f871-43b3-a610-a838d8b7a911','2026-10-27',2,0,1);
 perform public.planner_check_habit('cf22172a-f871-43b3-a610-a838d8b7a911','2026-10-27',2,0,1);
 if not exists(select 1 from public.habit_checkins where revision=1 and amount=2 and target=2) then raise exception 'FAIL retry rewrote log';end if;
 perform public.planner_save_habit('cf22172a-f871-43b3-a610-a838d8b7a911',1,s||'{"target":4}'::jsonb);
 if not exists(select 1 from public.habit_checkins where target=2 and revision=1) then raise exception 'FAIL target history changed';end if;
 begin perform public.planner_save_habit('cf22172a-f871-43b3-a610-a838d8b7a911',0,s);raise exception 'FAIL changed create retry';exception when unique_violation then null;end;
 begin perform public.planner_save_habit('cf22172a-f871-43b3-a610-a838d8b7a911',1,s);raise exception 'FAIL stale settings';exception when serialization_failure then null;end;
 begin perform public.planner_check_habit('cf22172a-f871-43b3-a610-a838d8b7a911','2026-10-27',3,1,1);raise exception 'FAIL stale habit target';exception when serialization_failure then null;end;
 perform public.planner_check_habit('cf22172a-f871-43b3-a610-a838d8b7a911','2026-10-27',3,1,2);
 begin perform public.planner_check_habit('cf22172a-f871-43b3-a610-a838d8b7a911','2026-10-27',1,1,2);raise exception 'FAIL stale check-in';exception when serialization_failure then null;end;
 insert into public.habit_checkins(habit_id,log_date,amount,target,unit,kind) values('cf22172a-f871-43b3-a610-a838d8b7a911','2026-10-29',4,99,'forged','amount');
 if not exists(select 1 from public.habit_checkins where log_date='2026-10-29' and target=4 and unit='glasses') then raise exception 'FAIL snapshot trigger';end if;
 r=public.planner_habit_day('2026-10-27',0);
 if (r->>'total')::integer<>1 or (r->'items'->0->>'week_done')::integer<>2 or (r->'items'->0->'log'->>'target')::numeric<>2 or r->'items'->0->>'space_title'<>'Habit space' then raise exception 'FAIL day/history/week view';end if;
 begin update public.habit_checkins set target=99;raise exception 'FAIL snapshot mutation';exception when insufficient_privilege then null;end;
 begin update public.habits set revision=99;raise exception 'FAIL revision grant';exception when insufficient_privilege then null;end;
 begin update public.habits set start_date='2025-01-01';raise exception 'FAIL start date changed';exception when insufficient_privilege then null;end;
 begin perform public.planner_check_habit('cf22172a-f871-43b3-a610-a838d8b7a911','2026-10-25',1,0,2);raise exception 'FAIL before start';exception when invalid_parameter_value then null;end;
 begin perform public.planner_check_habit('cf22172a-f871-43b3-a610-a838d8b7a911','2026-10-30',1.001,0,2);raise exception 'FAIL fractional precision';exception when invalid_parameter_value then null;end;
 begin perform public.planner_save_habit('cf22172a-f871-43b3-a610-a838d8b7a912',0,s||'{"space_id":"cf22172a-f871-43b3-a610-a838d8b7a920"}'::jsonb);raise exception 'FAIL foreign space';exception when foreign_key_violation then null;end;
 begin perform public.planner_save_habit('cf22172a-f871-43b3-a610-a838d8b7a912',0,s||'{"schedule":"weekdays","weekdays":[]}'::jsonb);raise exception 'FAIL empty weekdays';exception when check_violation then null;end;
 begin perform public.planner_save_habit('cf22172a-f871-43b3-a610-a838d8b7a912',0,s||'{"weekdays":[1,1]}'::jsonb);raise exception 'FAIL duplicate weekdays';exception when check_violation then null;end;
 perform public.planner_save_habit('cf22172a-f871-43b3-a610-a838d8b7a913',0,s||'{"kind":"check","target":1,"unit":"done","schedule":"daily"}'::jsonb);
 begin perform public.planner_check_habit('cf22172a-f871-43b3-a610-a838d8b7a913','2026-10-27',2,0,1);raise exception 'FAIL binary amount';exception when check_violation then null;end;
 perform public.planner_check_habit('cf22172a-f871-43b3-a610-a838d8b7a913','2026-10-27',1,0,1);
 perform public.planner_check_habit('cf22172a-f871-43b3-a610-a838d8b7a913','2026-10-27',0,1,1);
 if not exists(select 1 from public.habit_checkins where habit_id='cf22172a-f871-43b3-a610-a838d8b7a913' and amount=0 and revision=2) then raise exception 'FAIL undo';end if;
 perform public.planner_save_habit('cf22172a-f871-43b3-a610-a838d8b7a911',2,s||'{"target":4,"paused":true}'::jsonb);
 begin perform public.planner_check_habit('cf22172a-f871-43b3-a610-a838d8b7a911','2026-10-30',1,0,3);raise exception 'FAIL paused new log';exception when invalid_parameter_value then null;end;
 if (select count(*) from public.habit_checkins where habit_id='cf22172a-f871-43b3-a610-a838d8b7a911')<>2 then raise exception 'FAIL pause lost history';end if;
 insert into public.dashboard_layouts(user_id) values(auth.uid());
 if not exists(select 1 from public.dashboard_layouts where jsonb_array_length(layout)=7) then raise exception 'FAIL default changed';end if;
 update public.dashboard_layouts set layout='[{"id":"habits","width":"full","accent":"mint"}]' where user_id=auth.uid() and revision=1;
 if not exists(select 1 from public.dashboard_layouts where layout->0->>'id'='habits' and revision=2) then raise exception 'FAIL widget save';end if;
 if public.is_valid_dashboard_layout('[{"id":"habits","width":"full"},{"id":"habits","width":"half"}]') or public.is_valid_dashboard_layout('[{"id":"habits","width":"full","records":[]}]') then raise exception 'FAIL widget constraints';end if;
 update public.dashboard_layouts set layout='[]' where user_id=auth.uid() and revision=2;
 if (select count(*) from public.habits)<>2 then raise exception 'FAIL widget removal deleted sources';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7a902","role":"authenticated"}',true);
do $$ declare changed integer;r jsonb;begin
 if (select count(*) from public.habits)<>0 or (select count(*) from public.habit_checkins)<>0 then raise exception 'FAIL foreign read';end if;
 r=public.planner_habit_day('2026-10-27',0);if (r->>'total')::integer<>0 then raise exception 'FAIL foreign RPC read';end if;
 update public.habits set title='Foreign';get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL foreign habit update';end if;
 update public.habit_checkins set amount=0;get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL foreign log update';end if;
 begin perform public.planner_check_habit('cf22172a-f871-43b3-a610-a838d8b7a911','2026-10-27',1,2,3);raise exception 'FAIL foreign check-in RPC';exception when serialization_failure then null;end;
 begin insert into public.habit_checkins(habit_id,user_id,log_date,amount,target,unit,kind) values('cf22172a-f871-43b3-a610-a838d8b7a911',auth.uid(),'2026-10-28',1,1,'done','check');raise exception 'FAIL foreign log reference';exception when insufficient_privilege then null;end;
 begin insert into public.habits(id,user_id,title,kind,target,unit,schedule,start_date) values('cf22172a-f871-43b3-a610-a838d8b7a921','cf22172a-f871-43b3-a610-a838d8b7a901','Forged','check',1,'done','daily','2026-10-27');raise exception 'FAIL forged owner';exception when insufficient_privilege then null;end;
 perform public.planner_save_habit('cf22172a-f871-43b3-a610-a838d8b7a922',0,'{"title":"Own habit","kind":"check","target":1,"unit":"done","schedule":"weekdays","weekdays":[1,3,5],"weekly_goal":3,"space_id":null,"start_date":"2026-10-27","paused":false}');
 if (select count(*) from public.habits)<>1 then raise exception 'FAIL own second account';end if;
end;$$;
set local role anon;
do $$ begin
 begin perform * from public.habits;raise exception 'FAIL anon habits';exception when insufficient_privilege then null;end;
 begin perform * from public.habit_checkins;raise exception 'FAIL anon logs';exception when insufficient_privilege then null;end;
 begin perform public.planner_habit_day('2026-10-27',0);raise exception 'FAIL anon RPC';exception when insufficient_privilege then null;end;
end;$$;
rollback;
select 'PASS: habits own writes, cross-account isolation, anonymous denial, target history, check-in revisions, retry safety, schedules, space ownership and optional widget constraints' as result;