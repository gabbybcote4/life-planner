-- Fixture users and notes are removed by ROLLBACK.
begin;
insert into auth.users (id, email) values
  ('cf22172a-f871-43b3-a610-a838d8b7e001', 'notes-rls-a@example.invalid'),
  ('cf22172a-f871-43b3-a610-a838d8b7e002', 'notes-rls-b@example.invalid');
insert into public.notes (id, user_id, title, body) values
  ('cf22172a-f871-43b3-a610-a838d8b7f001', 'cf22172a-f871-43b3-a610-a838d8b7e001', 'A note', 'Original A'),
  ('cf22172a-f871-43b3-a610-a838d8b7f002', 'cf22172a-f871-43b3-a610-a838d8b7e002', 'B note', 'Original B');
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"sub":"cf22172a-f871-43b3-a610-a838d8b7e001","role":"authenticated"}', true);
do $$
declare changed integer;
begin
  if (select count(*) from public.notes) <> 1 then raise exception 'FAIL: note read isolation'; end if;
  update public.notes set title = 'Own edit', body = E'Line one\nLine two'
    where id = 'cf22172a-f871-43b3-a610-a838d8b7f001' and revision = 1;
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: own note update'; end if;
  if not exists (select 1 from public.notes where revision = 2 and body = E'Line one\nLine two') then
    raise exception 'FAIL: note revision/body persistence';
  end if;
  update public.notes set body = 'Stale overwrite'
    where id = 'cf22172a-f871-43b3-a610-a838d8b7f001' and revision = 1;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: stale revision overwrite'; end if;
  update public.notes set body = 'Cross-account overwrite'
    where id = 'cf22172a-f871-43b3-a610-a838d8b7f002';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: cross-account note update'; end if;
  insert into public.notes (id, title) values ('cf22172a-f871-43b3-a610-a838d8b7f003', 'Own insert');
  if not exists (select 1 from public.notes where id = 'cf22172a-f871-43b3-a610-a838d8b7f003'
    and user_id = 'cf22172a-f871-43b3-a610-a838d8b7e001' and body = '') then
    raise exception 'FAIL: note insert/default ownership';
  end if;
  begin
    insert into public.notes (user_id, title) values ('cf22172a-f871-43b3-a610-a838d8b7e002', 'Forged owner');
    raise exception 'FAIL: forged note owner';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.notes set user_id = 'cf22172a-f871-43b3-a610-a838d8b7e002'
      where id = 'cf22172a-f871-43b3-a610-a838d8b7f001';
    raise exception 'FAIL: note ownership reassignment';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.notes set revision = 1 where id = 'cf22172a-f871-43b3-a610-a838d8b7f001';
    raise exception 'FAIL: revision spoofing';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.notes (title) values (E' \n\t ');
    raise exception 'FAIL: blank note title';
  exception when check_violation then null;
  end;
  begin
    insert into public.notes (title) values (repeat('x', 201));
    raise exception 'FAIL: oversized note title';
  exception when check_violation then null;
  end;
  begin
    insert into public.notes (title, body) values ('Too long', repeat('x', 20001));
    raise exception 'FAIL: oversized note body';
  exception when check_violation then null;
  end;
  begin
    delete from public.notes where id = 'cf22172a-f871-43b3-a610-a838d8b7f001';
    raise exception 'FAIL: premature note deletion permission';
  exception when insufficient_privilege then null;
  end;
end;
$$;
select set_config('request.jwt.claims', '{"sub":"cf22172a-f871-43b3-a610-a838d8b7e002","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.notes) <> 1 then raise exception 'FAIL: second account isolation'; end if;
  if not exists (select 1 from public.notes where body = 'Original B' and revision = 1) then
    raise exception 'FAIL: second account note changed';
  end if;
end;
$$;
reset role;
set local role anon;
select set_config('request.jwt.claims', '{}', true);
do $$
begin
  begin
    perform 1 from public.notes;
    raise exception 'FAIL: anonymous note read';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.notes (title) values ('Anonymous note');
    raise exception 'FAIL: anonymous note insert';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.notes set body = 'Anonymous edit';
    raise exception 'FAIL: anonymous note update';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
select 'PASS: notes own read/write, cross-account isolation, anonymous denial, revision protection, and title/body constraints' as result;
