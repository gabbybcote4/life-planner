-- Fictional accounts. Every change rolls back.
begin;
insert into auth.users(id,email) values('a401fbb1-6b19-4c22-8610-990000000001','display-a@example.invalid'),('a401fbb1-6b19-4c22-8610-990000000002','display-b@example.invalid');
insert into public.planner_preferences(user_id,theme) values('a401fbb1-6b19-4c22-8610-990000000002','midnight');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"a401fbb1-6b19-4c22-8610-990000000001","role":"authenticated"}',true);
do $$
declare changed integer;
begin
 if (select count(*) from public.planner_preferences)<>0 then raise exception 'FAIL foreign settings read';end if;
 insert into public.planner_preferences(user_id,font_preset,text_size) values('a401fbb1-6b19-4c22-8610-990000000001','system',16);
 if not exists(select 1 from public.planner_preferences where text_revision=2 and zoom_revision=1 and accessibility_revision=1 and app_zoom=100 and theme='sage') then raise exception 'FAIL group defaults/revision';end if;
 update public.planner_preferences set app_zoom=125 where user_id='a401fbb1-6b19-4c22-8610-990000000001' and zoom_revision=1;
 if not exists(select 1 from public.planner_preferences where text_revision=2 and zoom_revision=2 and accessibility_revision=1 and app_zoom=125) then raise exception 'FAIL independent zoom';end if;
 update public.planner_preferences set reduce_motion=true,strong_focus=true,simple_background=true where user_id='a401fbb1-6b19-4c22-8610-990000000001' and accessibility_revision=1;
 if not exists(select 1 from public.planner_preferences where text_revision=2 and zoom_revision=2 and accessibility_revision=2 and reduce_motion and strong_focus and simple_background) then raise exception 'FAIL accessibility save';end if;
 update public.planner_preferences set text_size=18 where user_id='a401fbb1-6b19-4c22-8610-990000000001' and text_revision=1;
 get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL stale text update';end if;
 update public.planner_preferences set app_zoom=90 where user_id='a401fbb1-6b19-4c22-8610-990000000002';get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL foreign write';end if;
 begin update public.planner_preferences set text_revision=99;raise exception 'FAIL manual revision';exception when insufficient_privilege then null;end;
 begin update public.planner_preferences set font_preset='untrusted';raise exception 'FAIL font allowlist';exception when check_violation then null;end;
 begin update public.planner_preferences set text_size=1;raise exception 'FAIL text bounds';exception when check_violation then null;end;
 begin update public.planner_preferences set app_zoom=999;raise exception 'FAIL zoom bounds';exception when check_violation then null;end;
 begin insert into public.planner_preferences(user_id,text_size) values('a401fbb1-6b19-4c22-8610-990000000002',18);raise exception 'FAIL foreign insert';exception when insufficient_privilege then null;end;
end;$$;
select set_config('request.jwt.claims','{"sub":"a401fbb1-6b19-4c22-8610-990000000002","role":"authenticated"}',true);
do $$
begin
 if (select count(*) from public.planner_preferences)<>1 or not exists(select 1 from public.planner_preferences where theme='midnight' and font_preset='retro' and text_size=14 and app_zoom=100 and not reduce_motion and not strong_focus and not simple_background) then raise exception 'FAIL reverse account isolation';end if;
end;$$;
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$
begin
 begin perform text_size from public.planner_preferences;raise exception 'FAIL anonymous read';exception when insufficient_privilege then null;end;
 begin update public.planner_preferences set app_zoom=125;raise exception 'FAIL anonymous write';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
select 'PASS: display preferences own save/read, account isolation, anonymous denial, independent revisions and allowlists' as result;
