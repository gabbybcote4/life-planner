-- Fixtures and temporary users are removed by ROLLBACK.
begin;
insert into auth.users(id,email) values
 ('ac44172a-f871-43b3-a610-a838d8b7e001','search-a@example.invalid'),
 ('ac44172a-f871-43b3-a610-a838d8b7e002','search-b@example.invalid');
insert into public.tasks(id,user_id,title,completed) values
 ('ac44172a-f871-43b3-a610-a838d8b7c001','ac44172a-f871-43b3-a610-a838d8b7e001','Needle A task 100%_',true),
 ('ac44172a-f871-43b3-a610-a838d8b7c002','ac44172a-f871-43b3-a610-a838d8b7e002','Needle B secret task',false);
insert into public.calendar_events(id,user_id,title,event_date) values
 ('ac44172a-f871-43b3-a610-a838d8b7d001','ac44172a-f871-43b3-a610-a838d8b7e001','Needle A event','2026-12-31'),
 ('ac44172a-f871-43b3-a610-a838d8b7d002','ac44172a-f871-43b3-a610-a838d8b7e002','Needle B secret event','2027-01-01');
insert into public.notes(id,user_id,title,body) values
 ('ac44172a-f871-43b3-a610-a838d8b7f001','ac44172a-f871-43b3-a610-a838d8b7e001','Needle A note','bodyneedle <script>literal</script>'),
 ('ac44172a-f871-43b3-a610-a838d8b7f002','ac44172a-f871-43b3-a610-a838d8b7e002','Needle B secret note','privatebody');
insert into public.spaces(id,user_id,title) values
 ('ac44172a-f871-43b3-a610-a838d8b7a001','ac44172a-f871-43b3-a610-a838d8b7e001','Needle A space O''Reilly'),
 ('ac44172a-f871-43b3-a610-a838d8b7a002','ac44172a-f871-43b3-a610-a838d8b7e002','Needle B secret space');
insert into public.space_pages(id,user_id,space_id,title,body) values
 ('ac44172a-f871-43b3-a610-a838d8b7b001','ac44172a-f871-43b3-a610-a838d8b7e001','ac44172a-f871-43b3-a610-a838d8b7a001','Needle A page','bodyneedle'),
 ('ac44172a-f871-43b3-a610-a838d8b7b002','ac44172a-f871-43b3-a610-a838d8b7e002','ac44172a-f871-43b3-a610-a838d8b7a002','Needle B secret page','privatebody');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"ac44172a-f871-43b3-a610-a838d8b7e001","role":"authenticated"}',true);
do $$
declare category text;
begin
 if (select count(*) from public.planner_search('NEEDLE','all',0))<>5 then raise exception 'FAIL: five-kind search or case matching';end if;
 foreach category in array array['task','event','note','space','page'] loop
  if (select count(*) from public.planner_search('needle',category,0))<>1 then raise exception 'FAIL: category %',category;end if;
 end loop;
 if exists(select 1 from public.planner_search('B secret','all',0)) or exists(select 1 from public.planner_search('privatebody','all',0)) then raise exception 'FAIL: cross-account title/body search';end if;
 if (select count(*) from public.planner_search('bodyneedle','all',0))<>2 then raise exception 'FAIL: note/page body search';end if;
 if (select count(*) from public.planner_search('O''Reilly','all',0))<>2 then raise exception 'FAIL: parent context/quote search';end if;
 if (select count(*) from public.planner_search('%','all',0))<>1 or (select count(*) from public.planner_search('_','all',0))<>1 then raise exception 'FAIL: literal wildcard characters';end if;
 if exists(select 1 from public.planner_search(''' OR true --','all',0)) then raise exception 'FAIL: literal query handling';end if;
 if exists(select 1 from public.planner_search('  ','all',0)) or exists(select 1 from public.planner_search(null,'all',0)) or exists(select 1 from public.planner_search('needle','invalid',0)) then raise exception 'FAIL: blank/invalid search';end if;
 if not exists(select 1 from public.planner_search('2026-12-31','event',0) where event_date='2026-12-31') then raise exception 'FAIL: event date context';end if;
 if not exists(select 1 from public.planner_search('needle','task',0) where completed=true) then raise exception 'FAIL: completion metadata';end if;
 if not exists(select 1 from public.planner_search('needle','page',0) where space_id='ac44172a-f871-43b3-a610-a838d8b7a001' and space_title='Needle A space O''Reilly') then raise exception 'FAIL: page route context';end if;
 insert into public.tasks(title) select 'Pager '||n from generate_series(1,25) n;
 if (select count(*) from public.planner_search('Pager','all',0))<>21 or (select count(*) from public.planner_search('Pager','all',20))<>5 then raise exception 'FAIL: result pagination';end if;
 if exists((select id from public.planner_search('Pager','all',0) limit 20) intersect (select id from public.planner_search('Pager','all',20))) then raise exception 'FAIL: duplicate result pages';end if;
 if exists(select 1 from public.planner_search('Pager','all',999980)) then raise exception 'FAIL: high offset';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"ac44172a-f871-43b3-a610-a838d8b7e002","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.planner_search('needle','all',0))<>5 then raise exception 'FAIL: second account search';end if;
 if exists(select 1 from public.planner_search('bodyneedle','all',0)) or exists(select 1 from public.planner_search('Pager','all',0)) then raise exception 'FAIL: second account isolation';end if;
end;$$;
select set_config('request.jwt.claims','{}',true);
do $$ begin
 if exists(select 1 from public.planner_search('needle','all',0)) then raise exception 'FAIL: missing identity';end if;
end;$$;
reset role;
set local role anon;
do $$ begin
 begin perform 1 from public.planner_search('needle','all',0);raise exception 'FAIL: anonymous search';exception when insufficient_privilege then null;end;
end;$$;
reset role;
do $$ begin
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='planner_search' and p.prosecdef) then raise exception 'FAIL: privileged search function';end if;
end;$$;
rollback;
select 'PASS: search across all five types, own-account isolation, anonymous denial, literal matching, filters, body/context search, and pagination' as result;
