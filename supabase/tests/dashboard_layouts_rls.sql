-- Layout fixtures are removed by ROLLBACK.
begin;
insert into auth.users (id, email) values
  ('cf22172a-f871-43b3-a610-a838d8b7b101', 'layout-rls-a@example.invalid'),
  ('cf22172a-f871-43b3-a610-a838d8b7b102', 'layout-rls-b@example.invalid'),
  ('cf22172a-f871-43b3-a610-a838d8b7b103', 'layout-rls-c@example.invalid');
insert into public.dashboard_layouts (user_id, layout) values ('cf22172a-f871-43b3-a610-a838d8b7b102', '[]');
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"sub":"cf22172a-f871-43b3-a610-a838d8b7b101","role":"authenticated"}', true);
do $$
declare changed integer;
bad jsonb;
begin
  if (select count(*) from public.dashboard_layouts) <> 0 then raise exception 'FAIL: cross-account layout read'; end if;
  insert into public.dashboard_layouts (user_id) values ('cf22172a-f871-43b3-a610-a838d8b7b101');
  if not exists (select 1 from public.dashboard_layouts where jsonb_array_length(layout) = 4 and revision = 1) then
    raise exception 'FAIL: default layout/own insert';
  end if;
  update public.dashboard_layouts set layout = '[{"id":"recent","width":"half"},{"id":"overview","width":"full"}]'
    where user_id = 'cf22172a-f871-43b3-a610-a838d8b7b101' and revision = 1;
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: own layout update'; end if;
  if not exists (select 1 from public.dashboard_layouts where revision = 2 and layout->0->>'id' = 'recent'
    and layout->0->>'width' = 'half') then raise exception 'FAIL: saved layout order/size/revision'; end if;
  update public.dashboard_layouts set layout = '[]'
    where user_id = 'cf22172a-f871-43b3-a610-a838d8b7b101' and revision = 1;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: stale layout overwrite'; end if;
  update public.dashboard_layouts set layout = '[]'
    where user_id = 'cf22172a-f871-43b3-a610-a838d8b7b101' and revision = 2;
  if not exists (select 1 from public.dashboard_layouts where layout = '[]'::jsonb and revision = 3) then
    raise exception 'FAIL: empty dashboard save';
  end if;
  update public.dashboard_layouts set layout = '[{"id":"overview","width":"full"}]'
    where user_id = 'cf22172a-f871-43b3-a610-a838d8b7b102';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: cross-account layout update'; end if;
  begin
    insert into public.dashboard_layouts (user_id) values ('cf22172a-f871-43b3-a610-a838d8b7b103');
    raise exception 'FAIL: forged layout owner';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.dashboard_layouts set user_id = 'cf22172a-f871-43b3-a610-a838d8b7b103';
    raise exception 'FAIL: layout owner reassignment';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.dashboard_layouts set revision = 1;
    raise exception 'FAIL: layout revision spoofing';
  exception when insufficient_privilege then null;
  end;
  foreach bad in array array[
    'null'::jsonb, '{}'::jsonb, '[null]'::jsonb,
    '[{"id":"overview","width":"huge"}]'::jsonb,
    '[{"id":"unknown","width":"full"}]'::jsonb,
    '[{"id":"overview","width":"full","extra":"content"}]'::jsonb,
    '[{"id":"overview","width":"full"},{"id":"overview","width":"half"}]'::jsonb,
    '[{"id":null,"width":"full"}]'::jsonb
  ] loop
    begin
      update public.dashboard_layouts set layout = bad;
      raise exception 'FAIL: invalid layout accepted: %', bad;
    exception when check_violation then null;
    end;
  end loop;
  begin
    delete from public.dashboard_layouts;
    raise exception 'FAIL: layout deletion grant';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select set_config('request.jwt.claims', '{"sub":"cf22172a-f871-43b3-a610-a838d8b7b102","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.dashboard_layouts) <> 1 then raise exception 'FAIL: second account layout isolation'; end if;
  if not exists (select 1 from public.dashboard_layouts where layout = '[]'::jsonb and revision = 1) then
    raise exception 'FAIL: second account layout changed';
  end if;
end;
$$;
reset role;
set local role anon;
select set_config('request.jwt.claims', '{}', true);
do $$
begin
  begin
    perform 1 from public.dashboard_layouts;
    raise exception 'FAIL: anonymous layout read';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.dashboard_layouts (user_id) values ('cf22172a-f871-43b3-a610-a838d8b7b103');
    raise exception 'FAIL: anonymous layout insert';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.dashboard_layouts set layout = '[]';
    raise exception 'FAIL: anonymous layout update';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
select 'PASS: dashboard layout own read/write, cross-account isolation, anonymous denial, widget constraints, and revision protection' as result;
