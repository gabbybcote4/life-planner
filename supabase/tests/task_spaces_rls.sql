begin;
insert into auth.users(id,email) values('ae66172a-f871-43b3-a610-a838d8b7e001','task-spaces-a@example.invalid'),('ae66172a-f871-43b3-a610-a838d8b7e002','task-spaces-b@example.invalid');
insert into public.spaces(id,user_id,title) values
 ('ae66172a-f871-43b3-a610-a838d8b7a001','ae66172a-f871-43b3-a610-a838d8b7e001','A Work'),
 ('ae66172a-f871-43b3-a610-a838d8b7a002','ae66172a-f871-43b3-a610-a838d8b7e001','A Study'),
 ('ae66172a-f871-43b3-a610-a838d8b7a003','ae66172a-f871-43b3-a610-a838d8b7e002','B Private');
insert into public.tasks(id,user_id,title,space_id) values
 ('ae66172a-f871-43b3-a610-a838d8b7c001','ae66172a-f871-43b3-a610-a838d8b7e001','A task',null),
 ('ae66172a-f871-43b3-a610-a838d8b7c002','ae66172a-f871-43b3-a610-a838d8b7e002','B task','ae66172a-f871-43b3-a610-a838d8b7a003');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"ae66172a-f871-43b3-a610-a838d8b7e001","role":"authenticated"}',true);
do $$ declare changed integer;begin
 update public.tasks set space_id='ae66172a-f871-43b3-a610-a838d8b7a001' where id='ae66172a-f871-43b3-a610-a838d8b7c001' and space_id is null;
 get diagnostics changed=row_count;if changed<>1 then raise exception 'FAIL: assign task';end if;
 if not exists(select 1 from public.planner_search('A Work','task',0) where space_id='ae66172a-f871-43b3-a610-a838d8b7a001' and space_title='A Work') then raise exception 'FAIL: task space search context';end if;
 update public.tasks set space_id='ae66172a-f871-43b3-a610-a838d8b7a002' where id='ae66172a-f871-43b3-a610-a838d8b7c001' and space_id is null;
 get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL: stale conditional move';end if;
 update public.tasks set space_id='ae66172a-f871-43b3-a610-a838d8b7a002' where id='ae66172a-f871-43b3-a610-a838d8b7c001' and space_id='ae66172a-f871-43b3-a610-a838d8b7a001';
 get diagnostics changed=row_count;if changed<>1 then raise exception 'FAIL: move own task';end if;
 begin update public.tasks set space_id='ae66172a-f871-43b3-a610-a838d8b7a003' where id='ae66172a-f871-43b3-a610-a838d8b7c001';raise exception 'FAIL: foreign parent assignment';exception when foreign_key_violation then null;end;
 begin insert into public.tasks(title,space_id) values('Foreign insert','ae66172a-f871-43b3-a610-a838d8b7a003');raise exception 'FAIL: foreign parent insert';exception when foreign_key_violation then null;end;
 update public.tasks set space_id=null where id='ae66172a-f871-43b3-a610-a838d8b7c002';
 get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL: foreign task move';end if;
 update public.tasks set space_id=null where id='ae66172a-f871-43b3-a610-a838d8b7c001';
 if not exists(select 1 from public.tasks where id='ae66172a-f871-43b3-a610-a838d8b7c001' and space_id is null and title='A task' and completed=false) then raise exception 'FAIL: unassignment deleted/changed task';end if;
 insert into public.tasks(title,space_id) values('Created in Work','ae66172a-f871-43b3-a610-a838d8b7a001');
 if (select count(*) from public.tasks where space_id='ae66172a-f871-43b3-a610-a838d8b7a001')<>1 then raise exception 'FAIL: own space create/view';end if;
 if exists(select 1 from public.tasks where id='ae66172a-f871-43b3-a610-a838d8b7c002') then raise exception 'FAIL: foreign task read';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"ae66172a-f871-43b3-a610-a838d8b7e002","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.tasks)<>1 then raise exception 'FAIL: second account isolation';end if;
 if exists(select 1 from public.planner_search('A Work','task',0)) then raise exception 'FAIL: search space leakage';end if;
end;$$;
reset role;
set local role anon;
do $$ begin
 begin perform 1 from public.tasks;raise exception 'FAIL: anonymous read';exception when insufficient_privilege then null;end;
 begin insert into public.tasks(title,space_id) values('Anon','ae66172a-f871-43b3-a610-a838d8b7a001');raise exception 'FAIL: anonymous create';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
select 'PASS: task space create/move/remove, stale conditional moves, same-owner constraints, account isolation, search context, and anonymous denial' as result;
