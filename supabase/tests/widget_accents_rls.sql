begin;
insert into auth.users(id,email) values('b299172a-f871-43b3-a610-a838d8b7e001','accents-a@example.invalid'),('b299172a-f871-43b3-a610-a838d8b7e002','accents-b@example.invalid');
insert into public.dashboard_layouts(user_id,layout) values('b299172a-f871-43b3-a610-a838d8b7e002','[]');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"b299172a-f871-43b3-a610-a838d8b7e001","role":"authenticated"}',true);
do $$ declare color text;bad jsonb;version integer:=1;changed integer;begin
 insert into public.dashboard_layouts(user_id,layout) values('b299172a-f871-43b3-a610-a838d8b7e001','[{"id":"overview","width":"full"}]');
 foreach color in array array['pink','mint','blue','yellow','lilac'] loop
  update public.dashboard_layouts set layout=jsonb_build_array(jsonb_build_object('id','calendar','width','half','accent',color)) where revision=version;
  get diagnostics changed=row_count;version=version+1;
  if changed<>1 or not exists(select 1 from public.dashboard_layouts where layout->0->>'accent'=color and revision=version) then raise exception 'FAIL: accent roundtrip %',color;end if;
 end loop;
 update public.dashboard_layouts set layout='[{"id":"calendar","width":"full","accent":"mint"},{"id":"spaces","width":"half","accent":"blue"}]' where revision=version;
 version=version+1;
 update public.dashboard_layouts set layout='[]' where revision=1;get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL: stale accent overwrite';end if;
 foreach bad in array array[
 '[{"id":"calendar","width":"half","accent":null}]'::jsonb,
 '[{"id":"calendar","width":"half","accent":"auto"}]'::jsonb,
 '[{"id":"calendar","width":"half","accent":"#ff0000"}]'::jsonb,
 '[{"id":"calendar","width":"half","accent":"constructor"}]'::jsonb,
 '[{"id":"calendar","width":"half","accent":true}]'::jsonb,
 '[{"id":"calendar","width":"half","body":"private"}]'::jsonb,
 '[{"id":"calendar","width":"half","accent":"blue","extra":1}]'::jsonb
 ] loop
  begin update public.dashboard_layouts set layout=bad;raise exception 'FAIL: invalid accent accepted';exception when check_violation then null;end;
 end loop;
 update public.dashboard_layouts set layout='[{"id":"calendar","width":"full"},{"id":"spaces","width":"half"}]' where revision=version;
 version=version+1;
 if not exists(select 1 from public.dashboard_layouts where revision=version and not(layout->0 ? 'accent')) then raise exception 'FAIL: automatic color reset';end if;
 update public.dashboard_layouts set layout='[]' where user_id='b299172a-f871-43b3-a610-a838d8b7e002';get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL: foreign accent write';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"b299172a-f871-43b3-a610-a838d8b7e002","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.dashboard_layouts)<>1 or not exists(select 1 from public.dashboard_layouts where layout='[]'::jsonb and revision=1) then raise exception 'FAIL: account isolation';end if;
end;$$;
reset role;
rollback;
select 'PASS: widget accent persistence/reset, strict allowed values, legacy compatibility, revision conflicts, and account isolation' as result;
