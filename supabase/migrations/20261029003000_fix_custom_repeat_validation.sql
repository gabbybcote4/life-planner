begin;
-- Repair the seven-field validator from applied migration 029.
create or replace function public.planner_valid_repeat_rule(r jsonb) returns boolean language plpgsql immutable set search_path='' as $$
begin
 if r is null or jsonb_typeof(r)<>'object' or (select count(*) from jsonb_object_keys(r))<>7 or exists(select 1 from jsonb_object_keys(r) as keys(key) where key not in('interval','unit','weekdays','monthly_mode','ends','end_date','count')) then return false;end if;
 if jsonb_typeof(r->'interval')<>'number' or (r->>'interval')!~'^[1-9][0-9]?$' or jsonb_typeof(r->'unit') is distinct from 'string' or jsonb_typeof(r->'monthly_mode') is distinct from 'string' or jsonb_typeof(r->'ends') is distinct from 'string' or r->>'unit' not in('day','week','month','year') or r->>'monthly_mode' not in('date','weekday','last_weekday') or r->>'ends' not in('never','on','after') then return false;end if;
 if jsonb_typeof(r->'weekdays')<>'array' then return false;end if;
 if exists(select 1 from jsonb_array_elements(r->'weekdays') as days(day) where jsonb_typeof(day)<>'number' or day::text!~'^[0-6]$') or (select count(*)<>count(distinct day) from jsonb_array_elements(r->'weekdays') as days(day)) then return false;end if;
 if r->>'unit'='week' then if jsonb_array_length(r->'weekdays') not between 1 and 7 then return false;end if;
 else if jsonb_array_length(r->'weekdays')<>0 then return false;end if;end if;
 if r->>'unit'<>'month' and r->>'monthly_mode'<>'date' then return false;end if;
 if r->>'ends'='on' then
  if jsonb_typeof(r->'end_date')<>'string' or (r->>'end_date')!~'^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or (r->>'end_date')::date not between date '1900-01-01' and date '2100-12-31' or r->'count'<>'null'::jsonb then return false;end if;
 else if r->'end_date'<>'null'::jsonb then return false;end if;end if;
 if r->>'ends'='after' then
  if jsonb_typeof(r->'count')<>'number' or (r->>'count')!~'^[1-9][0-9]{0,2}$' then return false;end if;
 else if r->'count'<>'null'::jsonb then return false;end if;end if;
 return true;
exception when others then return false;
end;$$;

commit;
