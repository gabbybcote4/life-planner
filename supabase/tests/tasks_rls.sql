-- Run after the migration in a disposable local/test database, or review before
-- using the SQL Editor. Two fictional users/tasks exist only inside this transaction.
-- A passing run ends with ROLLBACK; no test users/tasks are kept.
begin;

insert into auth.users (id, email) values
  ('cf22172a-f871-43b3-a610-a838d8b7a001', 'planner-rls-a@example.invalid'),
  ('cf22172a-f871-43b3-a610-a838d8b7a002', 'planner-rls-b@example.invalid');

insert into public.tasks (id, user_id, title) values
  ('cf22172a-f871-43b3-a610-a838d8b7b001', 'cf22172a-f871-43b3-a610-a838d8b7a001', 'User A task'),
  ('cf22172a-f871-43b3-a610-a838d8b7b002', 'cf22172a-f871-43b3-a610-a838d8b7a002', 'User B task');

set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"sub":"cf22172a-f871-43b3-a610-a838d8b7a001","role":"authenticated"}', true);

do $$
declare visible_rows integer;
changed_rows integer;
begin
  select count(*) into visible_rows from public.tasks;
  if visible_rows <> 1 then raise exception 'FAIL: user A can read another account or cannot read own task'; end if;

  update public.tasks set title = 'Own edit', completed = true
    where id = 'cf22172a-f871-43b3-a610-a838d8b7b001';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then raise exception 'FAIL: own update denied'; end if;

  update public.tasks set title = 'Cross-account edit', completed = true
    where id = 'cf22172a-f871-43b3-a610-a838d8b7b002';
  get diagnostics changed_rows = row_count;
  if changed_rows <> 0 then raise exception 'FAIL: cross-account update permitted'; end if;

  insert into public.tasks (id, title) values
    ('cf22172a-f871-43b3-a610-a838d8b7b003', 'Own insert');
  if not exists (select 1 from public.tasks where id = 'cf22172a-f871-43b3-a610-a838d8b7b003'
    and user_id = 'cf22172a-f871-43b3-a610-a838d8b7a001') then
    raise exception 'FAIL: own insert or default ownership failed';
  end if;

  begin
    insert into public.tasks (user_id, title) values
      ('cf22172a-f871-43b3-a610-a838d8b7a002', 'Forged owner');
    raise exception 'FAIL: forged ownership insert permitted';
  exception when insufficient_privilege then null;
  end;

  begin
    update public.tasks set user_id = 'cf22172a-f871-43b3-a610-a838d8b7a002'
      where id = 'cf22172a-f871-43b3-a610-a838d8b7b001';
    raise exception 'FAIL: ownership reassignment permitted';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.tasks (title) values (E' \t\n ');
    raise exception 'FAIL: blank title permitted';
  exception when check_violation then null;
  end;

  begin
    insert into public.tasks (title) values (repeat('x', 201));
    raise exception 'FAIL: oversized title permitted';
  exception when check_violation then null;
  end;

  begin
    delete from public.tasks where id = 'cf22172a-f871-43b3-a610-a838d8b7b001';
    raise exception 'FAIL: deletion permitted before deletion feature exists';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claims', '{"sub":"cf22172a-f871-43b3-a610-a838d8b7a002","role":"authenticated"}', true);

do $$
begin
  if (select count(*) from public.tasks) <> 1 then raise exception 'FAIL: user B isolation failed'; end if;
  if not exists (select 1 from public.tasks where title = 'User B task' and not completed) then
    raise exception 'FAIL: user A modified user B task';
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
    perform 1 from public.tasks;
    raise exception 'FAIL: anonymous read permitted';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.tasks (title) values ('Anonymous task');
    raise exception 'FAIL: anonymous insert permitted';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.tasks set title = 'Anonymous edit';
    raise exception 'FAIL: anonymous update permitted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
rollback;
select 'PASS: own read/write, cross-account isolation, anonymous denial, and constraints' as result;
