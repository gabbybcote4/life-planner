-- Rollback-only fixtures. Apply migration 016 first.
begin;
insert into auth.users(id,email) values
 ('cf22172a-f871-43b3-a610-a838d8b7a301','nav-a@example.invalid'),
 ('cf22172a-f871-43b3-a610-a838d8b7a302','nav-b@example.invalid'),
 ('cf22172a-f871-43b3-a610-a838d8b7a303','nav-c@example.invalid');
insert into public.planner_preferences(user_id) values ('cf22172a-f871-43b3-a610-a838d8b7a302');
insert into public.planner_preferences(user_id,nav_position) values ('cf22172a-f871-43b3-a610-a838d8b7a303','bottom');
do $$ begin
 if not exists(select 1 from public.planner_preferences where user_id='cf22172a-f871-43b3-a610-a838d8b7a303' and nav_revision=2) then raise exception 'FAIL first-save revision';end if;
end;$$;
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7a301","role":"authenticated"}',true);
do $$
declare changed integer; pos text;
begin
 if (select count(*) from public.planner_preferences)<>0 then raise exception 'FAIL foreign read';end if;
 insert into public.planner_preferences(user_id) values ('cf22172a-f871-43b3-a610-a838d8b7a301');
 if not exists(select 1 from public.planner_preferences where nav_position='left' and nav_revision=1) then raise exception 'FAIL defaults';end if;
 update public.planner_preferences set theme='rose',background_pattern='grid',background_intensity='strong';
 foreach pos in array array['right','top','bottom','left'] loop
  update public.planner_preferences set nav_position=pos;
  if not exists(select 1 from public.planner_preferences where nav_position=pos) then raise exception 'FAIL own save';end if;
 end loop;
 if not exists(select 1 from public.planner_preferences where theme='rose' and background_pattern='grid' and background_intensity='strong' and background_revision=2) then raise exception 'FAIL appearance preservation';end if;
 if not exists(select 1 from public.planner_preferences where nav_revision=5) then raise exception 'FAIL revision trigger';end if;
 update public.planner_preferences set nav_position='right' where nav_revision=1;
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL stale save';end if;
 update public.planner_preferences set theme='rose',background_pattern='grid',background_intensity='strong';
 if not exists(select 1 from public.planner_preferences where nav_position='left' and nav_revision=5) then raise exception 'FAIL other preference interference';end if;
 update public.planner_preferences set nav_position='bottom' where user_id='cf22172a-f871-43b3-a610-a838d8b7a302';
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL foreign update';end if;
 begin update public.planner_preferences set nav_position='left;display:none';raise exception 'FAIL position constraint';exception when check_violation then null;end;
 begin update public.planner_preferences set nav_revision=99;raise exception 'FAIL revision grant';exception when insufficient_privilege then null;end;
 begin insert into public.planner_preferences(user_id,nav_position) values ('cf22172a-f871-43b3-a610-a838d8b7a303','right');raise exception 'FAIL forged owner';exception when insufficient_privilege then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7a302","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.planner_preferences)<>1 or not exists(select 1 from public.planner_preferences where nav_position='left' and nav_revision=1) then raise exception 'FAIL second owner';end if;
end;$$;
set local role anon;
do $$ begin
 begin perform * from public.planner_preferences;raise exception 'FAIL anonymous read';exception when insufficient_privilege then null;end;
 begin update public.planner_preferences set nav_position='top';raise exception 'FAIL anonymous update';exception when insufficient_privilege then null;end;
end;$$;
rollback;
select 'PASS: navigation positions own save/reset, account isolation, anonymous denial, constraints, preference preservation, and stale-save protection' as result;
