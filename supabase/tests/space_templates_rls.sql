-- Temporary data, failure trigger, and users disappear on rollback.
begin;
insert into auth.users(id,email) values
 ('ad55172a-f871-43b3-a610-a838d8b7e001','templates-a@example.invalid'),
 ('ad55172a-f871-43b3-a610-a838d8b7e002','templates-b@example.invalid');
insert into public.spaces(id,user_id,title) values('ad55172a-f871-43b3-a610-a838d8b7a099','ad55172a-f871-43b3-a610-a838d8b7e001','Legacy space');
create function pg_temp.reject_template_fixture_page() returns trigger language plpgsql as $$
begin
 if new.space_id='ad55172a-f871-43b3-a610-a838d8b7a098' and new.title='Ideas & reminders' then raise exception 'Intentional atomicity fixture' using errcode='23514';end if;
 return new;
end;$$;
create trigger template_fixture_failure before insert on public.space_pages for each row execute function pg_temp.reject_template_fixture_page();
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"ad55172a-f871-43b3-a610-a838d8b7e001","role":"authenticated"}',true);
do $$
declare first_id uuid; before_count integer; starter record; request_id uuid; i integer:=1;
begin
 if (select count(*) from public.planner_space_templates())<>3 then raise exception 'FAIL: catalog';end if;
 for starter in select * from public.planner_space_templates() order by key loop
  request_id=('ad55172a-f871-43b3-a610-'||lpad(i::text,12,'0'))::uuid;
  select r.first_page_id into first_id from public.create_planner_space(request_id,starter.title,starter.key) r;
  if first_id is null or (select count(*) from public.space_pages p where p.space_id=request_id)<>jsonb_array_length(starter.pages) then raise exception 'FAIL: complete starter pages';end if;
  if exists(select 1 from jsonb_array_elements(starter.pages) item where not exists(select 1 from public.space_pages p where p.space_id=request_id and p.title=item->>'title' and p.body=item->>'body')) then raise exception 'FAIL: catalog/created content mismatch';end if;
  if not exists(select 1 from public.space_pages p where p.id=first_id and p.space_id=request_id and p.title=starter.pages->0->>'title') then raise exception 'FAIL: first page destination';end if;
  update public.space_pages set body='My editable content' where id=first_id;
  update public.spaces set title='Renamed '||starter.title where id=request_id;
  perform 1 from public.create_planner_space(request_id,starter.title,starter.key);
  if (select count(*) from public.space_pages p where p.space_id=request_id)<>3 or not exists(select 1 from public.space_pages p where p.id=first_id and p.body='My editable content') then raise exception 'FAIL: retry duplicated or overwrote pages';end if;
  if not exists(select 1 from public.spaces s where s.id=request_id and s.title='Renamed '||starter.title) then raise exception 'FAIL: retry renamed space';end if;
  begin perform 1 from public.create_planner_space(request_id,'Changed request',starter.key);raise exception 'FAIL: mismatched retry';exception when unique_violation then null;end;
  i=i+1;
 end loop;
 perform 1 from public.create_planner_space('ad55172a-f871-43b3-a610-a838d8b7a004','Blank space','blank');
 if exists(select 1 from public.space_pages where space_id='ad55172a-f871-43b3-a610-a838d8b7a004') then raise exception 'FAIL: blank created pages';end if;
 select count(*) into before_count from public.spaces;
 begin perform 1 from public.create_planner_space('ad55172a-f871-43b3-a610-a838d8b7a098','Failed personal','personal');raise exception 'FAIL: fixture did not reject';exception when check_violation then null;end;
 if (select count(*) from public.spaces)<>before_count or exists(select 1 from public.space_pages where space_id='ad55172a-f871-43b3-a610-a838d8b7a098') or exists(select 1 from public.space_creation_receipts where space_id='ad55172a-f871-43b3-a610-a838d8b7a098') then raise exception 'FAIL: partial creation survived rollback';end if;
 begin perform 1 from public.create_planner_space('ad55172a-f871-43b3-a610-a838d8b7a090','Bad','unknown');raise exception 'FAIL: unknown starter';exception when invalid_parameter_value then null;end;
 begin perform 1 from public.create_planner_space('ad55172a-f871-43b3-a610-a838d8b7a090','  ','personal');raise exception 'FAIL: blank title';exception when invalid_parameter_value then null;end;
 begin perform 1 from public.create_planner_space('ad55172a-f871-43b3-a610-a838d8b7a090',repeat('x',101),'personal');raise exception 'FAIL: oversized title';exception when invalid_parameter_value then null;end;
 begin perform 1 from public.create_planner_space('ad55172a-f871-43b3-a610-a838d8b7a099','Legacy space','personal');raise exception 'FAIL: preexisting unrelated space';exception when unique_violation then null;end;
 begin update public.space_creation_receipts set initial_title='Spoof';raise exception 'FAIL: receipt edit';exception when insufficient_privilege then null;end;
 begin delete from public.space_creation_receipts;raise exception 'FAIL: receipt delete';exception when insufficient_privilege then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"ad55172a-f871-43b3-a610-a838d8b7e002","role":"authenticated"}',true);
do $$ begin
 if exists(select 1 from public.space_creation_receipts) or exists(select 1 from public.space_pages) or exists(select 1 from public.spaces) then raise exception 'FAIL: cross-account reads';end if;
 begin perform 1 from public.create_planner_space('ad55172a-f871-43b3-a610-000000000001','Personal','personal');raise exception 'FAIL: foreign request replay';exception when unique_violation or insufficient_privilege then null;end;
 begin insert into public.space_creation_receipts(space_id,user_id,template_key,initial_title) values('ad55172a-f871-43b3-a610-a838d8b7a099','ad55172a-f871-43b3-a610-a838d8b7e001','blank','Forged');raise exception 'FAIL: forged receipt owner';exception when insufficient_privilege then null;end;
 begin insert into public.space_creation_receipts(space_id,template_key,initial_title) values('ad55172a-f871-43b3-a610-a838d8b7a099','blank','Foreign space');raise exception 'FAIL: receipt parent ownership';exception when foreign_key_violation then null;end;
 perform 1 from public.create_planner_space('ad55172a-f871-43b3-a610-a838d8b7a002','Own B work','work');
 if (select count(*) from public.space_pages)<>3 then raise exception 'FAIL: own second account create';end if;
end;$$;
select set_config('request.jwt.claims','{}',true);
do $$ begin
 begin perform 1 from public.create_planner_space('ad55172a-f871-43b3-a610-a838d8b7a091','No identity','personal');raise exception 'FAIL: missing identity create';exception when insufficient_privilege then null;end;
 if exists(select 1 from public.space_creation_receipts) then raise exception 'FAIL: missing identity read';end if;
end;$$;
reset role;
set local role anon;
do $$ begin
 begin perform 1 from public.planner_space_templates();raise exception 'FAIL: anonymous catalog';exception when insufficient_privilege then null;end;
 begin perform 1 from public.create_planner_space('ad55172a-f871-43b3-a610-a838d8b7a092','Anonymous','personal');raise exception 'FAIL: anonymous create';exception when insufficient_privilege then null;end;
 begin perform 1 from public.space_creation_receipts;raise exception 'FAIL: anonymous receipts';exception when insufficient_privilege then null;end;
end;$$;
reset role;
do $$ begin
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('planner_space_templates','create_planner_space') and p.prosecdef) then raise exception 'FAIL: privileged template function';end if;
end;$$;
rollback;
select 'PASS: templates catalog/create, atomic rollback, retry safety, editable pages, owner isolation, receipt constraints, and anonymous denial' as result;
