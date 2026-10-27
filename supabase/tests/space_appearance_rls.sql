begin;
insert into auth.users(id,email) values('b3aa172a-f871-43b3-a610-a838d8b7e001','appearance-a@example.invalid'),('b3aa172a-f871-43b3-a610-a838d8b7e002','appearance-b@example.invalid');
insert into public.spaces(id,user_id,title) values('b3aa172a-f871-43b3-a610-a838d8b7a001','b3aa172a-f871-43b3-a610-a838d8b7e001','A space'),('b3aa172a-f871-43b3-a610-a838d8b7a002','b3aa172a-f871-43b3-a610-a838d8b7e002','B space');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"b3aa172a-f871-43b3-a610-a838d8b7e001","role":"authenticated"}',true);
do $$ declare changed integer;begin
 if not exists(select 1 from public.spaces where icon='folder' and cover='auto' and accent='auto' and revision=1) then raise exception 'FAIL: compatible defaults';end if;
 update public.spaces set title='A renamed',icon='home',cover='desk',accent='mint' where id='b3aa172a-f871-43b3-a610-a838d8b7a001' and revision=1;
 get diagnostics changed=row_count;
 if changed<>1 or not exists(select 1 from public.spaces where title='A renamed' and icon='home' and cover='desk' and accent='mint' and revision=2) then raise exception 'FAIL: appearance/title/revision save';end if;
 update public.spaces set icon='star' where id='b3aa172a-f871-43b3-a610-a838d8b7a001' and revision=1;
 get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL: stale appearance overwrite';end if;
 begin update public.spaces set cover='https://example.invalid/image';raise exception 'FAIL: external cover';exception when check_violation then null;end;
 begin update public.spaces set icon='<svg>';raise exception 'FAIL: arbitrary markup';exception when check_violation then null;end;
 begin update public.spaces set accent='#ffffff';raise exception 'FAIL: arbitrary color';exception when check_violation then null;end;
 update public.spaces set cover='none',accent='auto',icon='folder' where id='b3aa172a-f871-43b3-a610-a838d8b7a001' and revision=2;
 if not exists(select 1 from public.spaces where cover='none' and accent='auto' and revision=3) then raise exception 'FAIL: no cover/default reset';end if;
 update public.spaces set accent='pink' where id='b3aa172a-f871-43b3-a610-a838d8b7a002';get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL: foreign appearance update';end if;
 perform 1 from public.create_planner_space('b3aa172a-f871-43b3-a610-a838d8b7a003','My starter','personal');
 update public.spaces set title='Renamed starter',icon='book',cover='study',accent='lilac' where id='b3aa172a-f871-43b3-a610-a838d8b7a003' and revision=1;
 perform 1 from public.create_planner_space('b3aa172a-f871-43b3-a610-a838d8b7a003','My starter','personal');
 if not exists(select 1 from public.spaces where id='b3aa172a-f871-43b3-a610-a838d8b7a003' and title='Renamed starter' and icon='book' and cover='study' and accent='lilac' and revision=2) then raise exception 'FAIL: retry overwrote customization';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"b3aa172a-f871-43b3-a610-a838d8b7e002","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.spaces)<>1 or not exists(select 1 from public.spaces where title='B space' and icon='folder' and cover='auto' and accent='auto' and revision=1) then raise exception 'FAIL: second account isolation';end if;
end;$$;
reset role;
set local role anon;
do $$ begin
 begin update public.spaces set cover='none';raise exception 'FAIL: anonymous appearance update';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
select 'PASS: private space appearance save/reset, defaults, revision protection, allowed built-ins, template retry preservation, and owner isolation' as result;
