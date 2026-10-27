begin;
insert into auth.users(id,email) values('b188172a-f871-43b3-a610-a838d8b7e001','palette-a@example.invalid'),('b188172a-f871-43b3-a610-a838d8b7e002','palette-b@example.invalid');
insert into public.planner_preferences(user_id,theme) values('b188172a-f871-43b3-a610-a838d8b7e002','rose');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"b188172a-f871-43b3-a610-a838d8b7e001","role":"authenticated"}',true);
do $$ declare choice text; changed integer;begin
 insert into public.planner_preferences(user_id) values('b188172a-f871-43b3-a610-a838d8b7e001');
 if not exists(select 1 from public.planner_preferences where theme='sage') then raise exception 'FAIL: legacy default';end if;
 foreach choice in array array['sage','rose','midnight','classic','cloud','peach','lavender','plum','ocean','forest','espresso','graphite'] loop
  update public.planner_preferences set theme=choice where user_id='b188172a-f871-43b3-a610-a838d8b7e001';
  get diagnostics changed=row_count;if changed<>1 or not exists(select 1 from public.planner_preferences where theme=choice) then raise exception 'FAIL: palette roundtrip %',choice;end if;
 end loop;
 begin update public.planner_preferences set theme='constructor';raise exception 'FAIL: inherited key accepted';exception when check_violation then null;end;
 begin update public.planner_preferences set theme='PLUM';raise exception 'FAIL: invalid case';exception when check_violation then null;end;
 begin update public.planner_preferences set theme='custom; background:red';raise exception 'FAIL: arbitrary style value';exception when check_violation then null;end;
 update public.planner_preferences set theme='forest' where user_id='b188172a-f871-43b3-a610-a838d8b7e002';get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL: cross-owner palette update';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"b188172a-f871-43b3-a610-a838d8b7e002","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.planner_preferences)<>1 or not exists(select 1 from public.planner_preferences where theme='rose') then raise exception 'FAIL: second account palette isolation';end if;
end;$$;
reset role;
rollback;
select 'PASS: all twelve palettes persist, legacy choices/default remain valid, arbitrary styles denied, and account choices stay isolated' as result;
