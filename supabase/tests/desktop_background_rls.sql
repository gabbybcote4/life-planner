-- Rollback-only fixtures; run after migration 015.
begin;
insert into auth.users(id,email) values
 ('cf22172a-f871-43b3-a610-a838d8b7a201','background-a@example.invalid'),
 ('cf22172a-f871-43b3-a610-a838d8b7a202','background-b@example.invalid');
insert into public.planner_preferences(user_id) values ('cf22172a-f871-43b3-a610-a838d8b7a202');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7a201","role":"authenticated"}',true);
do $$
declare changed integer;
begin
 if (select count(*) from public.planner_preferences)<>0 then raise exception 'FAIL foreign read'; end if;
 insert into public.planner_preferences(user_id) values ('cf22172a-f871-43b3-a610-a838d8b7a201');
 if not exists(select 1 from public.planner_preferences where background_pattern='dots' and background_intensity='medium' and background_revision=1) then raise exception 'FAIL defaults';end if;
 update public.planner_preferences set background_pattern='grid',background_intensity='strong' where background_revision=1;
 if not exists(select 1 from public.planner_preferences where background_pattern='grid' and background_revision=2) then raise exception 'FAIL save';end if;
 update public.planner_preferences set background_pattern='solid' where background_revision=1;
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL stale save';end if;
 update public.planner_preferences set theme='rose';
 if not exists(select 1 from public.planner_preferences where background_pattern='grid' and background_revision=2) then raise exception 'FAIL theme interference';end if;
 update public.planner_preferences set background_pattern='solid' where user_id='cf22172a-f871-43b3-a610-a838d8b7a202';
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL foreign update';end if;
 begin update public.planner_preferences set background_pattern='url(evil)';raise exception 'FAIL pattern constraint';exception when check_violation then null;end;
 begin update public.planner_preferences set background_intensity='99';raise exception 'FAIL intensity constraint';exception when check_violation then null;end;
 begin update public.planner_preferences set background_revision=99;raise exception 'FAIL revision grant';exception when insufficient_privilege then null;end;
 update public.planner_preferences set background_pattern='dots',background_intensity='medium' where background_revision=2;
 if not exists(select 1 from public.planner_preferences where background_revision=3) then raise exception 'FAIL reset';end if;
end;
$$;
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7a202","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.planner_preferences)<>1 or not exists(select 1 from public.planner_preferences where background_revision=1 and background_pattern='dots') then raise exception 'FAIL second owner';end if;
end;$$;
set local role anon;
do $$ begin
 begin perform * from public.planner_preferences;raise exception 'FAIL anon read';exception when insufficient_privilege then null;end;
 begin update public.planner_preferences set background_pattern='solid';raise exception 'FAIL anon update';exception when insufficient_privilege then null;end;
end;$$;
rollback;
select 'PASS: desktop background own save/reset, account isolation, anonymous denial, constraints, theme preservation, and stale-save protection' as result;
