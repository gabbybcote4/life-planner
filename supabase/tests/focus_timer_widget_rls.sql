-- Rollback-only fixtures. Apply migration 017 first.
begin;
insert into auth.users(id,email) values
 ('cf22172a-f871-43b3-a610-a838d8b7c401','timer-a@example.invalid'),
 ('cf22172a-f871-43b3-a610-a838d8b7c402','timer-b@example.invalid');
insert into public.dashboard_layouts(user_id,layout) values ('cf22172a-f871-43b3-a610-a838d8b7c402','[]');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7c401","role":"authenticated"}',true);
do $$
declare changed integer; bad jsonb; color text; version integer:=2;
begin
 if (select count(*) from public.dashboard_layouts)<>0 then raise exception 'FAIL foreign read';end if;
 insert into public.dashboard_layouts(user_id) values ('cf22172a-f871-43b3-a610-a838d8b7c401');
 if not exists(select 1 from public.dashboard_layouts where jsonb_array_length(layout)=7 and revision=1 and not layout @> '[{"id":"timer"}]'::jsonb) then raise exception 'FAIL unchanged optional default';end if;
 update public.dashboard_layouts set layout='[{"id":"recent","width":"full"},{"id":"timer","width":"half","accent":"mint"}]' where revision=1;
 if not exists(select 1 from public.dashboard_layouts where revision=2 and layout->1->>'id'='timer') then raise exception 'FAIL own timer save';end if;
 foreach color in array array['pink','mint','blue','yellow','lilac'] loop
  update public.dashboard_layouts set layout=jsonb_build_array(jsonb_build_object('id','timer','width','full','accent',color)) where revision=version;
  get diagnostics changed=row_count;version=version+1;
  if changed<>1 then raise exception 'FAIL timer accents';end if;
 end loop;
 update public.dashboard_layouts set layout='[]' where revision=1;get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL stale save';end if;
 update public.dashboard_layouts set layout='[]' where user_id='cf22172a-f871-43b3-a610-a838d8b7c402';get diagnostics changed=row_count;
 if changed<>0 then raise exception 'FAIL foreign write';end if;
 if not public.is_valid_dashboard_layout('[{"id":"spaces","width":"full"},{"id":"overview","width":"full"},{"id":"capture","width":"half"},{"id":"progress","width":"half"},{"id":"recent","width":"full"},{"id":"calendar","width":"half"},{"id":"connections","width":"full"},{"id":"timer","width":"half"}]') then raise exception 'FAIL eight widgets';end if;
 foreach bad in array array[
 '[{"id":"timer","width":"half"},{"id":"timer","width":"full"}]'::jsonb,
 '[{"id":"timer","width":"giant"}]'::jsonb,
 '[{"id":"timer","width":"half","remainingMs":200}]'::jsonb,
 '[{"id":"timer","width":"half","accent":"url(evil)"}]'::jsonb,
 '[{"id":"timer","width":"half","accent":null}]'::jsonb,
 '[{"id":"unregistered","width":"half"}]'::jsonb
 ] loop
  begin update public.dashboard_layouts set layout=bad;raise exception 'FAIL invalid timer metadata';exception when check_violation then null;end;
 end loop;
 update public.dashboard_layouts set layout='[]' where revision=version;
 get diagnostics changed=row_count;
 if changed<>1 then raise exception 'FAIL remove timer';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"cf22172a-f871-43b3-a610-a838d8b7c402","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.dashboard_layouts)<>1 or not exists(select 1 from public.dashboard_layouts where layout='[]' and revision=1) then raise exception 'FAIL second owner';end if;
end;$$;
set local role anon;
do $$ begin
 begin perform * from public.dashboard_layouts;raise exception 'FAIL anonymous read';exception when insufficient_privilege then null;end;
 begin update public.dashboard_layouts set layout='[]';raise exception 'FAIL anonymous update';exception when insufficient_privilege then null;end;
end;$$;
rollback;
select 'PASS: optional focus timer layout save/remove, accents, legacy defaults, owner isolation, anonymous denial, constraints, and stale-save protection' as result;
