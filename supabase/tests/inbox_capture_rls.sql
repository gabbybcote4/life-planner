-- Rollback-only fixtures. Apply migration 020 after 001-019.
begin;
insert into auth.users(id,email) values
 ('cf22172a-f871-43b3-a610-a838d8b7f701','capture-a@example.invalid'),
 ('cf22172a-f871-43b3-a610-a838d8b7f702','capture-b@example.invalid');
insert into public.spaces(id,user_id,title) values
 ('cf22172a-f871-43b3-a610-a838d8b7f710','cf22172a-f871-43b3-a610-a838d8b7f701','Work'),
 ('cf22172a-f871-43b3-a610-a838d8b7f720','cf22172a-f871-43b3-a610-a838d8b7f702','Other space');
insert into public.tasks(id,user_id,title) values ('cf22172a-f871-43b3-a610-a838d8b7f740','cf22172a-f871-43b3-a610-a838d8b7f701','Uncaptured foreign target');
-- Force a receipt failure to prove the preceding source insert rolls back too.
create function public.test_capture_rollback() returns trigger language plpgsql set search_path='' as $$
begin
 if new.id='cf22172a-f871-43b3-a610-a838d8b7f799' then raise exception 'test rollback' using errcode='23514';end if;return new;
end;$$;
create trigger test_capture_rollback before insert on public.inbox_captures for each row execute function public.test_capture_rollback();
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7f701","role":"authenticated"}',true);
do $$
declare result jsonb; changed integer;
begin
 result=public.planner_quick_capture('cf22172a-f871-43b3-a610-a838d8b7f711','task','cf22172a-f871-43b3-a610-a838d8b7f710','A task','');
 if result->>'kind'<>'task' or not exists(select 1 from public.tasks where id='cf22172a-f871-43b3-a610-a838d8b7f711' and space_id='cf22172a-f871-43b3-a610-a838d8b7f710' and due_date is null and priority='none') then raise exception 'FAIL real task/defaults';end if;
 perform public.planner_quick_capture('cf22172a-f871-43b3-a610-a838d8b7f712','note',null,'A note','Original note');
 result=public.planner_quick_capture('cf22172a-f871-43b3-a610-a838d8b7f713','note','cf22172a-f871-43b3-a610-a838d8b7f710','A page','Original page');
 if result->>'kind'<>'page' or not exists(select 1 from public.space_pages where id='cf22172a-f871-43b3-a610-a838d8b7f713' and body='Original page') then raise exception 'FAIL contextual page';end if;
 if (select count(*) from public.inbox_captures)<>3 then raise exception 'FAIL capture receipts';end if;
 update public.tasks set title='Edited later',completed=true where id='cf22172a-f871-43b3-a610-a838d8b7f711';
 update public.inbox_captures set reviewed=true where id='cf22172a-f871-43b3-a610-a838d8b7f711' and revision=1;
 if not exists(select 1 from public.inbox_captures where reviewed and revision=2 and title='A task') then raise exception 'FAIL review/original';end if;
 perform public.planner_quick_capture('cf22172a-f871-43b3-a610-a838d8b7f711','task','cf22172a-f871-43b3-a610-a838d8b7f710','A task','');
 if not exists(select 1 from public.tasks where title='Edited later' and completed) or not exists(select 1 from public.inbox_captures where reviewed and revision=2) then raise exception 'FAIL retry overwrote edits/review';end if;
 if (select count(*) from public.inbox_captures)<>3 then raise exception 'FAIL duplicate retry';end if;
 update public.inbox_captures set reviewed=false where id='cf22172a-f871-43b3-a610-a838d8b7f711' and revision=1;
 get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL stale review';end if;
 begin perform public.planner_quick_capture('cf22172a-f871-43b3-a610-a838d8b7f711','note',null,'Changed kind','Changed');raise exception 'FAIL changed retry';exception when unique_violation then null;end;
 if exists(select 1 from public.notes where id='cf22172a-f871-43b3-a610-a838d8b7f711') then raise exception 'FAIL retarget duplicate';end if;
 begin perform public.planner_quick_capture('cf22172a-f871-43b3-a610-a838d8b7f714','note','cf22172a-f871-43b3-a610-a838d8b7f720','Foreign','body');raise exception 'FAIL foreign space';exception when insufficient_privilege then null;end;
 begin perform public.planner_quick_capture('cf22172a-f871-43b3-a610-a838d8b7f799','task',null,'Rollback','');raise exception 'FAIL expected receipt failure';exception when check_violation then null;end;
 if exists(select 1 from public.tasks where id='cf22172a-f871-43b3-a610-a838d8b7f799') then raise exception 'FAIL non-atomic capture';end if;
 begin update public.inbox_captures set title='rewrite';raise exception 'FAIL original mutation';exception when insufficient_privilege then null;end;
 begin update public.inbox_captures set revision=99;raise exception 'FAIL revision mutation';exception when insufficient_privilege then null;end;
 begin delete from public.inbox_captures;raise exception 'FAIL delete grant';exception when insufficient_privilege then null;end;
 begin perform public.planner_quick_capture('cf22172a-f871-43b3-a610-a838d8b7f715','bad',null,'Invalid','');raise exception 'FAIL input';exception when invalid_parameter_value then null;end;
 update public.inbox_captures set reviewed=false where id='cf22172a-f871-43b3-a610-a838d8b7f711' and revision=2;
 if not exists(select 1 from public.inbox_captures where revision=3 and not reviewed) then raise exception 'FAIL restore queue';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7f702","role":"authenticated"}',true);
do $$ declare changed integer;begin
 if (select count(*) from public.inbox_captures)<>0 or (select count(*) from public.notes)<>0 or (select count(*) from public.space_pages)<>0 or (select count(*) from public.tasks)<>0 then raise exception 'FAIL foreign read';end if;
 update public.inbox_captures set reviewed=true;get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL foreign update';end if;
 begin insert into public.inbox_captures(id,user_id,kind,title,body,task_id) values('cf22172a-f871-43b3-a610-a838d8b7f740','cf22172a-f871-43b3-a610-a838d8b7f702','task','Foreign ref','','cf22172a-f871-43b3-a610-a838d8b7f740');raise exception 'FAIL foreign target';exception when foreign_key_violation then null;end;
 begin insert into public.inbox_captures(id,user_id,kind,title,body,task_id) values('cf22172a-f871-43b3-a610-a838d8b7f740','cf22172a-f871-43b3-a610-a838d8b7f701','task','Forged owner','','cf22172a-f871-43b3-a610-a838d8b7f740');raise exception 'FAIL forged owner';exception when insufficient_privilege then null;end;
 perform public.planner_quick_capture('cf22172a-f871-43b3-a610-a838d8b7f721','note',null,'Own note','Own text');
 if (select count(*) from public.inbox_captures)<>1 then raise exception 'FAIL own second account';end if;
end;$$;
set local role anon;
do $$ begin
 begin perform * from public.inbox_captures;raise exception 'FAIL anonymous read';exception when insufficient_privilege then null;end;
 begin perform public.planner_quick_capture('cf22172a-f871-43b3-a610-a838d8b7f731','task',null,'Anon','');raise exception 'FAIL anonymous capture';exception when insufficient_privilege then null;end;
end;$$;
rollback;
select 'PASS: Inbox atomic capture, original preservation, retry safety, review revisions, space ownership, cross-account isolation, and anonymous denial' as result;
