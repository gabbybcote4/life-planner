-- Rollback-only fixtures. Apply migration 018 first.
begin;
insert into auth.users(id,email) values
 ('cf22172a-f871-43b3-a610-a838d8b7d501','planning-a@example.invalid'),
 ('cf22172a-f871-43b3-a610-a838d8b7d502','planning-b@example.invalid');
insert into public.tasks(id,user_id,title) values ('cf22172a-f871-43b3-a610-a838d8b7d512','cf22172a-f871-43b3-a610-a838d8b7d502','Other task');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7d501","role":"authenticated"}',true);
do $$
declare changed integer; p text; version integer:=2; bad_date date;
begin
 if (select count(*) from public.tasks)<>0 then raise exception 'FAIL foreign read';end if;
 insert into public.tasks(id,user_id,title) values ('cf22172a-f871-43b3-a610-a838d8b7d511','cf22172a-f871-43b3-a610-a838d8b7d501','Quick capture');
 if not exists(select 1 from public.tasks where due_date is null and priority='none' and planning_revision=1) then raise exception 'FAIL neutral defaults';end if;
 update public.tasks set due_date='2028-02-29',priority='high' where planning_revision=1;
 if not exists(select 1 from public.tasks where due_date='2028-02-29' and priority='high' and planning_revision=2) then raise exception 'FAIL own planning save';end if;
 update public.tasks set title='Renamed task',completed=true;
 if not exists(select 1 from public.tasks where due_date='2028-02-29' and priority='high' and planning_revision=2) then raise exception 'FAIL title/completion interference';end if;
 foreach p in array array['low','medium','high','none'] loop
  update public.tasks set priority=p where planning_revision=version;get diagnostics changed=row_count;version=version+1;
  if changed<>1 then raise exception 'FAIL priority allowlist';end if;
 end loop;
 update public.tasks set due_date=null,priority='none' where planning_revision=1;get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL stale overwrite';end if;
 update public.tasks set priority='high' where id='cf22172a-f871-43b3-a610-a838d8b7d512';get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL foreign write';end if;
 foreach bad_date in array array[date '1899-12-31',date '2101-01-01',date 'infinity'] loop
  begin update public.tasks set due_date=bad_date;raise exception 'FAIL date constraint';exception when check_violation then null;end;
 end loop;
 begin update public.tasks set priority='urgent';raise exception 'FAIL priority constraint';exception when check_violation then null;end;
 begin update public.tasks set priority=null;raise exception 'FAIL null priority';exception when not_null_violation then null;end;
 begin update public.tasks set planning_revision=99;raise exception 'FAIL revision grant';exception when insufficient_privilege then null;end;
 begin insert into public.tasks(user_id,title,due_date) values ('cf22172a-f871-43b3-a610-a838d8b7d501','Injected plan','2028-01-01');raise exception 'FAIL widened insert grant';exception when insufficient_privilege then null;end;
 update public.tasks set due_date=null,priority='none' where planning_revision=version;
 get diagnostics changed=row_count;
 if changed<>1 or not exists(select 1 from public.tasks where due_date is null and priority='none' and completed=true and title='Renamed task' and planning_revision=version+1) then raise exception 'FAIL reset preserves task';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7d502","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.tasks)<>1 or not exists(select 1 from public.tasks where title='Other task' and due_date is null and priority='none' and planning_revision=1) then raise exception 'FAIL second owner';end if;
end;$$;
set local role anon;
do $$ begin
 begin perform * from public.tasks;raise exception 'FAIL anonymous read';exception when insufficient_privilege then null;end;
 begin update public.tasks set priority='high';raise exception 'FAIL anonymous update';exception when insufficient_privilege then null;end;
end;$$;
rollback;
select 'PASS: task due dates/priorities own save/clear, account isolation, anonymous denial, constraints, stale protection, and independent title/completion' as result;
