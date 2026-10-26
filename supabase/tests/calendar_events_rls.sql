-- Direct calendar permission assertions. Fixtures exist only until ROLLBACK.
begin;
insert into auth.users (id, email) values
  ('cf22172a-f871-43b3-a610-a838d8b7c001', 'calendar-rls-a@example.invalid'),
  ('cf22172a-f871-43b3-a610-a838d8b7c002', 'calendar-rls-b@example.invalid');
insert into public.calendar_events (id, user_id, title, event_date) values
  ('cf22172a-f871-43b3-a610-a838d8b7d001', 'cf22172a-f871-43b3-a610-a838d8b7c001', 'User A event', '2030-04-05'),
  ('cf22172a-f871-43b3-a610-a838d8b7d002', 'cf22172a-f871-43b3-a610-a838d8b7c002', 'User B event', '2030-04-05');

set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"sub":"cf22172a-f871-43b3-a610-a838d8b7c001","role":"authenticated"}', true);

do $$
declare visible_rows integer;
changed_rows integer;
begin
  select count(*) into visible_rows from public.calendar_events;
  if visible_rows <> 1 then raise exception 'FAIL: user A event visibility'; end if;

  update public.calendar_events set title = 'Own edit', event_date = '2030-05-06'
    where id = 'cf22172a-f871-43b3-a610-a838d8b7d001';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then raise exception 'FAIL: own event update denied'; end if;
  if not exists (select 1 from public.calendar_events where title = 'Own edit' and event_date = '2030-05-06') then
    raise exception 'FAIL: event title/date did not persist';
  end if;

  update public.calendar_events set title = 'Cross-account edit', event_date = '2030-06-07'
    where id = 'cf22172a-f871-43b3-a610-a838d8b7d002';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then raise exception 'FAIL: cross-account event update permitted'; end if;

  insert into public.calendar_events (id, title, event_date) values
    ('cf22172a-f871-43b3-a610-a838d8b7d003', 'Own insert', '2030-07-08');
  if not exists (select 1 from public.calendar_events where id = 'cf22172a-f871-43b3-a610-a838d8b7d003'
    and user_id = 'cf22172a-f871-43b3-a610-a838d8b7c001') then
    raise exception 'FAIL: event insert/default ownership';
  end if;

  begin
    insert into public.calendar_events (user_id, title, event_date) values
      ('cf22172a-f871-43b3-a610-a838d8b7c002', 'Forged owner', '2030-04-05');
    raise exception 'FAIL: forged event ownership permitted';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.calendar_events set user_id = 'cf22172a-f871-43b3-a610-a838d8b7c002'
      where id = 'cf22172a-f871-43b3-a610-a838d8b7d001';
    raise exception 'FAIL: event ownership reassignment permitted';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.calendar_events set created_at = now()
      where id = 'cf22172a-f871-43b3-a610-a838d8b7d001';
    raise exception 'FAIL: event creation timestamp modification permitted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.calendar_events (title, event_date) values (E' \n\t ', '2030-04-05');
    raise exception 'FAIL: blank event title permitted';
  exception when check_violation then null;
  end;
  begin
    insert into public.calendar_events (title, event_date) values (repeat('x', 201), '2030-04-05');
    raise exception 'FAIL: oversized event title permitted';
  exception when check_violation then null;
  end;
  begin
    insert into public.calendar_events (title, event_date) values ('Outside date range', '2101-01-01');
    raise exception 'FAIL: unsupported event date permitted';
  exception when check_violation then null;
  end;
  begin
    delete from public.calendar_events where id = 'cf22172a-f871-43b3-a610-a838d8b7d001';
    raise exception 'FAIL: deletion permitted before deletion feature exists';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claims', '{"sub":"cf22172a-f871-43b3-a610-a838d8b7c002","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.calendar_events) <> 1 then raise exception 'FAIL: user B event isolation'; end if;
  if not exists (select 1 from public.calendar_events where title = 'User B event' and event_date = '2030-04-05') then
    raise exception 'FAIL: user B event was changed by user A';
  end if;
end;
$$;

reset role;
set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);
do $$
begin
  begin
    perform 1 from public.calendar_events;
    raise exception 'FAIL: anonymous event read permitted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.calendar_events (title, event_date) values ('Anonymous event', '2030-04-05');
    raise exception 'FAIL: anonymous event insert permitted';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.calendar_events set title = 'Anonymous edit';
    raise exception 'FAIL: anonymous event update permitted';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
select 'PASS: calendar own read/write, cross-account isolation, anonymous denial, and date/title constraints' as result;
