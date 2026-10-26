-- All fixture identities and preference rows are removed by ROLLBACK.
begin;
insert into auth.users (id, email) values
  ('cf22172a-f871-43b3-a610-a838d8b7a101', 'theme-rls-a@example.invalid'),
  ('cf22172a-f871-43b3-a610-a838d8b7a102', 'theme-rls-b@example.invalid'),
  ('cf22172a-f871-43b3-a610-a838d8b7a103', 'theme-rls-c@example.invalid');
insert into public.planner_preferences (user_id, theme) values
  ('cf22172a-f871-43b3-a610-a838d8b7a102', 'rose');
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"sub":"cf22172a-f871-43b3-a610-a838d8b7a101","role":"authenticated"}', true);
do $$
declare changed integer;
begin
  if (select count(*) from public.planner_preferences) <> 0 then raise exception 'FAIL: cross-account preference read'; end if;
  insert into public.planner_preferences (user_id) values ('cf22172a-f871-43b3-a610-a838d8b7a101');
  if not exists (select 1 from public.planner_preferences where theme = 'sage') then raise exception 'FAIL: default theme/own insert'; end if;
  update public.planner_preferences set theme = 'midnight' where user_id = 'cf22172a-f871-43b3-a610-a838d8b7a101';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: own preference update'; end if;
  if not exists (select 1 from public.planner_preferences where theme = 'midnight') then raise exception 'FAIL: theme save'; end if;
  update public.planner_preferences set theme = 'sage' where user_id = 'cf22172a-f871-43b3-a610-a838d8b7a102';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: cross-account preference update'; end if;
  begin
    insert into public.planner_preferences (user_id, theme) values ('cf22172a-f871-43b3-a610-a838d8b7a103', 'midnight');
    raise exception 'FAIL: forged preference owner';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.planner_preferences set user_id = 'cf22172a-f871-43b3-a610-a838d8b7a102';
    raise exception 'FAIL: preference owner reassignment';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.planner_preferences set updated_at = now();
    raise exception 'FAIL: preference timestamp spoofing';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.planner_preferences set theme = 'unknown-theme';
    raise exception 'FAIL: invalid theme';
  exception when check_violation then null;
  end;
  begin
    delete from public.planner_preferences;
    raise exception 'FAIL: preference delete grant';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select set_config('request.jwt.claims', '{"sub":"cf22172a-f871-43b3-a610-a838d8b7a102","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.planner_preferences) <> 1 then raise exception 'FAIL: second account isolation'; end if;
  if not exists (select 1 from public.planner_preferences where theme = 'rose') then raise exception 'FAIL: second account theme changed'; end if;
end;
$$;
reset role;
set local role anon;
select set_config('request.jwt.claims', '{}', true);
do $$
begin
  begin
    perform 1 from public.planner_preferences;
    raise exception 'FAIL: anonymous preference read';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.planner_preferences (user_id) values ('cf22172a-f871-43b3-a610-a838d8b7a101');
    raise exception 'FAIL: anonymous preference insert';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.planner_preferences set theme = 'sage';
    raise exception 'FAIL: anonymous preference update';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
select 'PASS: theme own read/write, cross-account isolation, anonymous denial, and theme constraints' as result;

