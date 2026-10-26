-- Fixture users and notes are removed by ROLLBACK.
begin;
insert into auth.users (id, email) values
  ('cf22172a-f871-43b3-a610-a838d8b7e001', 'spaces-rls-a@example.invalid'),
  ('cf22172a-f871-43b3-a610-a838d8b7e002', 'spaces-rls-b@example.invalid');
insert into public.spaces(id,user_id,title) values
 ('cf22172a-f871-43b3-a610-a838d8b7a001','cf22172a-f871-43b3-a610-a838d8b7e001','Space A'),
 ('cf22172a-f871-43b3-a610-a838d8b7a002','cf22172a-f871-43b3-a610-a838d8b7e002','Space B');
insert into public.space_pages (id, user_id, space_id, title, body) values
  ('cf22172a-f871-43b3-a610-a838d8b7f001', 'cf22172a-f871-43b3-a610-a838d8b7e001', 'cf22172a-f871-43b3-a610-a838d8b7a001', 'A note', 'Original A'),
  ('cf22172a-f871-43b3-a610-a838d8b7f002', 'cf22172a-f871-43b3-a610-a838d8b7e002', 'cf22172a-f871-43b3-a610-a838d8b7a002', 'B note', 'Original B');
set local role authenticated;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{"sub":"cf22172a-f871-43b3-a610-a838d8b7e001","role":"authenticated"}', true);
do $$
declare changed integer;
begin
  if (select count(*) from public.space_pages) <> 1 then raise exception 'FAIL: note read isolation'; end if;
  update public.space_pages set title = 'Own edit', body = E'Line one\nLine two'
    where id = 'cf22172a-f871-43b3-a610-a838d8b7f001' and revision = 1;
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: own note update'; end if;
  if not exists (select 1 from public.space_pages where revision = 2 and body = E'Line one\nLine two') then
    raise exception 'FAIL: note revision/body persistence';
  end if;
  update public.space_pages set body = 'Stale overwrite'
    where id = 'cf22172a-f871-43b3-a610-a838d8b7f001' and revision = 1;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: stale revision overwrite'; end if;
  update public.space_pages set body = 'Cross-account overwrite'
    where id = 'cf22172a-f871-43b3-a610-a838d8b7f002';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: cross-account note update'; end if;
  insert into public.space_pages (space_id, id, title) values ('cf22172a-f871-43b3-a610-a838d8b7a001', 'cf22172a-f871-43b3-a610-a838d8b7f003', 'Own insert');
  if not exists (select 1 from public.space_pages where id = 'cf22172a-f871-43b3-a610-a838d8b7f003'
    and user_id = 'cf22172a-f871-43b3-a610-a838d8b7e001' and body = '') then
    raise exception 'FAIL: note insert/default ownership';
  end if;
  begin
    insert into public.space_pages (space_id, user_id, title) values ('cf22172a-f871-43b3-a610-a838d8b7a001', 'cf22172a-f871-43b3-a610-a838d8b7e002', 'Forged owner');
    raise exception 'FAIL: forged note owner';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.space_pages set user_id = 'cf22172a-f871-43b3-a610-a838d8b7e002'
      where id = 'cf22172a-f871-43b3-a610-a838d8b7f001';
    raise exception 'FAIL: note ownership reassignment';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.space_pages set revision = 1 where id = 'cf22172a-f871-43b3-a610-a838d8b7f001';
    raise exception 'FAIL: revision spoofing';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.space_pages (space_id, title) values ('cf22172a-f871-43b3-a610-a838d8b7a001', E' \n\t ');
    raise exception 'FAIL: blank note title';
  exception when check_violation then null;
  end;
  begin
    insert into public.space_pages (space_id, title) values ('cf22172a-f871-43b3-a610-a838d8b7a001', repeat('x', 201));
    raise exception 'FAIL: oversized note title';
  exception when check_violation then null;
  end;
  begin
    insert into public.space_pages (space_id, title, body) values ('cf22172a-f871-43b3-a610-a838d8b7a001', 'Too long', repeat('x', 20001));
    raise exception 'FAIL: oversized note body';
  exception when check_violation then null;
  end;
  begin
    delete from public.space_pages where id = 'cf22172a-f871-43b3-a610-a838d8b7f001';
    raise exception 'FAIL: premature note deletion permission';
  exception when insufficient_privilege then null;
  end;
end;
$$;

do $$
declare changed integer;
begin
 if (select count(*) from public.spaces) <> 1 then raise exception 'FAIL: spaces read isolation';end if;
 update public.spaces set title='Renamed A' where id='cf22172a-f871-43b3-a610-a838d8b7a001' and revision=1;
 get diagnostics changed=row_count;
 if changed<>1 or not exists(select 1 from public.spaces where revision=2 and title='Renamed A') then raise exception 'FAIL: space rename/revision';end if;
 update public.spaces set title='Stale' where id='cf22172a-f871-43b3-a610-a838d8b7a001' and revision=1;
 get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL: stale space rename';end if;
 update public.spaces set title='Cross owner' where id='cf22172a-f871-43b3-a610-a838d8b7a002';
 get diagnostics changed=row_count;if changed<>0 then raise exception 'FAIL: cross space rename';end if;
 insert into public.spaces(title) values('Own space');
 begin insert into public.spaces(user_id,title) values('cf22172a-f871-43b3-a610-a838d8b7e002','Forged');raise exception 'FAIL: forged space owner';exception when insufficient_privilege then null;end;
 begin insert into public.spaces(title) values('  ');raise exception 'FAIL: blank space';exception when check_violation then null;end;
 begin insert into public.spaces(title) values(repeat('x',101));raise exception 'FAIL: long space';exception when check_violation then null;end;
 begin insert into public.space_pages(space_id,title) values('cf22172a-f871-43b3-a610-a838d8b7a002','Foreign parent');raise exception 'FAIL: cross owner parent';exception when foreign_key_violation then null;end;
 begin update public.space_pages set space_id='cf22172a-f871-43b3-a610-a838d8b7a002';raise exception 'FAIL: page reparent';exception when insufficient_privilege then null;end;
 begin update public.spaces set user_id='cf22172a-f871-43b3-a610-a838d8b7e002';raise exception 'FAIL: space owner reassignment';exception when insufficient_privilege then null;end;
 begin update public.spaces set revision=1;raise exception 'FAIL: space revision spoof';exception when insufficient_privilege then null;end;
 begin delete from public.spaces;raise exception 'FAIL: space deletion';exception when insufficient_privilege then null;end;
end;$$;

select set_config('request.jwt.claims', '{"sub":"cf22172a-f871-43b3-a610-a838d8b7e002","role":"authenticated"}', true);
do $$
begin
  if (select count(*) from public.space_pages) <> 1 then raise exception 'FAIL: second account isolation'; end if;
  if not exists (select 1 from public.space_pages where body = 'Original B' and revision = 1) then
    raise exception 'FAIL: second account note changed';
  end if;
end;
$$;
reset role;
set local role anon;
do $$ begin
 begin perform 1 from public.spaces;raise exception 'FAIL: anonymous space read';exception when insufficient_privilege then null;end;
 begin insert into public.spaces(title) values('Anon');raise exception 'FAIL: anonymous space insert';exception when insufficient_privilege then null;end;
end;$$;

select set_config('request.jwt.claims', '{}', true);
do $$
begin
  begin
    perform 1 from public.space_pages;
    raise exception 'FAIL: anonymous note read';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.space_pages (space_id, title) values ('cf22172a-f871-43b3-a610-a838d8b7a001', 'Anonymous note');
    raise exception 'FAIL: anonymous note insert';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.space_pages set body = 'Anonymous edit';
    raise exception 'FAIL: anonymous note update';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
select 'PASS: spaces/pages own read/write, cross-account isolation, anonymous denial, parent ownership, revision protection, and constraints' as result;
