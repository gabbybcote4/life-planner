-- Temporary users and link fixtures are removed by the final rollback.
begin;
insert into auth.users(id,email) values
 ('ab33172a-f871-43b3-a610-a838d8b7e001','links-a@example.invalid'),
 ('ab33172a-f871-43b3-a610-a838d8b7e002','links-b@example.invalid');
insert into public.spaces(id,user_id,title) values
 ('ab33172a-f871-43b3-a610-a838d8b7a001','ab33172a-f871-43b3-a610-a838d8b7e001','A space'),
 ('ab33172a-f871-43b3-a610-a838d8b7a002','ab33172a-f871-43b3-a610-a838d8b7e002','B secret space');
insert into public.notes(id,user_id,title,body) values
 ('ab33172a-f871-43b3-a610-a838d8b7f001','ab33172a-f871-43b3-a610-a838d8b7e001','A note',
 '[[A page|page:ab33172a-f871-43b3-a610-a838d8b7b001]] [[Duplicate|page:ab33172a-f871-43b3-a610-a838d8b7b001]] [[Foreign|page:ab33172a-f871-43b3-a610-a838d8b7b002]] [[Missing|note:ab33172a-f871-43b3-a610-a838d8b7f099]]'),
 ('ab33172a-f871-43b3-a610-a838d8b7f002','ab33172a-f871-43b3-a610-a838d8b7e002','B secret note',
 '[[Foreign A|page:ab33172a-f871-43b3-a610-a838d8b7b001]]');
insert into public.space_pages(id,user_id,space_id,title,body) values
 ('ab33172a-f871-43b3-a610-a838d8b7b001','ab33172a-f871-43b3-a610-a838d8b7e001','ab33172a-f871-43b3-a610-a838d8b7a001','A page','[[A note|note:ab33172a-f871-43b3-a610-a838d8b7f001]]'),
 ('ab33172a-f871-43b3-a610-a838d8b7b002','ab33172a-f871-43b3-a610-a838d8b7e002','ab33172a-f871-43b3-a610-a838d8b7a002','B secret page','');
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"sub":"ab33172a-f871-43b3-a610-a838d8b7e001","role":"authenticated"}',true);
do $$
begin
 if (select count(*) from public.planner_link_catalog('',0))<>2 then raise exception 'FAIL: catalog isolation';end if;
 if (select count(*) from public.planner_link_documents())<>2 then raise exception 'FAIL: helper isolation';end if;
 if exists(select 1 from public.planner_link_catalog('B secret',0)) then raise exception 'FAIL: search leak';end if;
 if exists(select 1 from public.planner_link_catalog('%',0)) then raise exception 'FAIL: wildcard search was not literal';end if;
 if (select count(*) from public.planner_link_catalog('a SPACE',0))<>1 then raise exception 'FAIL: space context search';end if;
 if (select count(*) from public.planner_link_connections('note','ab33172a-f871-43b3-a610-a838d8b7f001','outgoing',0))<>1 then raise exception 'FAIL: own outgoing/duplicate/foreign filtering';end if;
 if not exists(select 1 from public.planner_link_connections('note','ab33172a-f871-43b3-a610-a838d8b7f001','outgoing',0) where kind='page' and title='A page') then raise exception 'FAIL: note to page';end if;
 if not exists(select 1 from public.planner_link_connections('page','ab33172a-f871-43b3-a610-a838d8b7b001','outgoing',0) where kind='note' and title='A note') then raise exception 'FAIL: page to note';end if;
 if (select count(*) from public.planner_link_connections('page','ab33172a-f871-43b3-a610-a838d8b7b001','backlinks',0))<>1 then raise exception 'FAIL: private backlinks';end if;
 if (select count(*) from public.planner_link_connections('note','ab33172a-f871-43b3-a610-a838d8b7f001','backlinks',0))<>1 then raise exception 'FAIL: page backlink';end if;
 if exists(select 1 from public.planner_link_connections('page','ab33172a-f871-43b3-a610-a838d8b7b002','outgoing',0)) or exists(select 1 from public.planner_link_connections('page','ab33172a-f871-43b3-a610-a838d8b7b002','backlinks',0)) then raise exception 'FAIL: foreign target enumeration';end if;
 update public.space_pages set title='Renamed A' where id='ab33172a-f871-43b3-a610-a838d8b7b001';
 if not exists(select 1 from public.planner_link_connections('note','ab33172a-f871-43b3-a610-a838d8b7f001','outgoing',0) where title='Renamed A') then raise exception 'FAIL: rename broke identity';end if;
 update public.notes set body='No links now' where id='ab33172a-f871-43b3-a610-a838d8b7f001';
 if exists(select 1 from public.planner_link_connections('page','ab33172a-f871-43b3-a610-a838d8b7b001','backlinks',0)) then raise exception 'FAIL: removed reference backlink';end if;
 insert into public.notes(title) select 'Pagination '||n from generate_series(1,25) n;
 if (select count(*) from public.planner_link_catalog('',0))<>21 or (select count(*) from public.planner_link_catalog('',20))<>7 then raise exception 'FAIL: catalog pagination';end if;
 update public.notes set body='[[A page|page:ab33172a-f871-43b3-a610-a838d8b7b001]]' where title like 'Pagination %';
 if (select count(*) from public.planner_link_connections('page','ab33172a-f871-43b3-a610-a838d8b7b001','backlinks',0))<>21 or (select count(*) from public.planner_link_connections('page','ab33172a-f871-43b3-a610-a838d8b7b001','backlinks',20))<>5 then raise exception 'FAIL: backlink pagination';end if;
 update public.notes set body=(select string_agg('[[Item|note:'||n.id::text||']]', ' ') from public.notes n where n.title like 'Pagination %') where id='ab33172a-f871-43b3-a610-a838d8b7f001';
 if (select count(*) from public.planner_link_connections('note','ab33172a-f871-43b3-a610-a838d8b7f001','outgoing',0))<>21 or (select count(*) from public.planner_link_connections('note','ab33172a-f871-43b3-a610-a838d8b7f001','outgoing',20))<>5 then raise exception 'FAIL: outgoing pagination';end if;
 if exists(select 1 from public.planner_link_catalog('',999999)) then raise exception 'FAIL: catalog high offset';end if;
 if (select count(*) from public.planner_extract_links('[[UPPER|NOTE:AB33172A-F871-43B3-A610-A838D8B7F001]] [[bad|url:ab33172a-f871-43b3-a610-a838d8b7f001]]'))<>1 then raise exception 'FAIL: marker validation';end if;
 if exists(select 1 from public.planner_extract_links('[[bad|note:not-an-id]]')) then raise exception 'FAIL: malformed id';end if;
end;$$;
select set_config('request.jwt.claims','{"sub":"ab33172a-f871-43b3-a610-a838d8b7e002","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.planner_link_catalog('',0))<>2 then raise exception 'FAIL: second account catalog';end if;
 if exists(select 1 from public.planner_link_connections('page','ab33172a-f871-43b3-a610-a838d8b7b001','backlinks',0)) then raise exception 'FAIL: second account foreign backlinks';end if;
 if exists(select 1 from public.planner_link_connections('note','ab33172a-f871-43b3-a610-a838d8b7f002','outgoing',0)) then raise exception 'FAIL: reference exposes foreign title';end if;
end;$$;
select set_config('request.jwt.claims','{}',true);
do $$ begin
 if exists(select 1 from public.planner_link_catalog('',0)) or exists(select 1 from public.planner_link_documents()) then raise exception 'FAIL: missing identity access';end if;
end;$$;
reset role;
set local role anon;
do $$ begin
 begin perform 1 from public.planner_link_catalog('',0);raise exception 'FAIL: anonymous catalog';exception when insufficient_privilege then null;end;
 begin perform 1 from public.planner_link_connections('note','ab33172a-f871-43b3-a610-a838d8b7f001','backlinks',0);raise exception 'FAIL: anonymous connections';exception when insufficient_privilege then null;end;
 begin perform 1 from public.planner_link_documents();raise exception 'FAIL: anonymous helper';exception when insufficient_privilege then null;end;
 begin perform 1 from public.planner_extract_links('');raise exception 'FAIL: anonymous parser';exception when insufficient_privilege then null;end;
end;$$;
reset role;
do $$ begin
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('planner_link_documents','planner_link_catalog','planner_link_connections','planner_extract_links') and p.prosecdef) then raise exception 'FAIL: privileged function';end if;
end;$$;
rollback;
select 'PASS: links own search/read, cross-account isolation, anonymous denial, parent context, backlinks, rename/removal, and pagination' as result;
