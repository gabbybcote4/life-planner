begin;
-- Single stable statement snapshot, caller permissions and existing forced RLS.
-- Only this internal allowlist supplies identifiers/columns; there are no caller arguments.
create function public.planner_export_data() returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare owner_id uuid=auth.uid();entry record;n bigint;bytes bigint;total_rows bigint=0;total_bytes bigint=0;rows jsonb;data jsonb='{}';counts jsonb='{}';links jsonb;result jsonb;
begin
 if owner_id is null then raise exception 'Sign in to export' using errcode='42501';end if;
 for entry in select * from (values
 ('tasks','id,title,completed,created_at,updated_at,due_date,priority,planning_revision,space_id','id'),
 ('calendar_events','id,title,event_date,created_at,updated_at','id'),
 ('notes','id,title,body,revision,created_at,updated_at','id'),
 ('spaces','id,title,revision,created_at,updated_at,icon,cover,accent','id'),
 ('space_pages','id,space_id,title,body,revision,created_at,updated_at','id'),
 ('habits','id,title,kind,target,unit,schedule,weekdays,weekly_goal,space_id,start_date,paused,revision,created_at','id'),
 ('habit_checkins','habit_id,log_date,amount,target,unit,kind,revision','habit_id,log_date'),
 ('projects','id,title,description,status,space_id,revision,created_at','id'),
 ('project_items','project_id,kind,target_id,task_id,note_id,page_id,active,revision','project_id,kind,target_id'),
 ('inbox_captures','id,kind,title,body,space_id,task_id,note_id,page_id,reviewed,revision,created_at','id'),
 ('space_creation_receipts','space_id,template_key,initial_title,first_page_id,created_at','space_id'),
 ('planner_preferences','theme,updated_at,background_pattern,background_intensity,background_revision,nav_position,nav_revision,font_preset,text_size,app_zoom,reduce_motion,strong_focus,simple_background,text_revision,zoom_revision,accessibility_revision,week_start,date_format,planning_revision','updated_at'),
 ('dashboard_layouts','layout,revision,updated_at','updated_at')
 ) as catalog(collection,projection,ordering) loop
  execute format('select count(*),coalesce(sum(octet_length(to_jsonb(r)::text)),0) from (select %s from public.%I where user_id=$1) r',entry.projection,entry.collection) into n,bytes using owner_id;
  total_rows=total_rows+n;total_bytes=total_bytes+bytes;
  if total_rows>50000 or total_bytes>20971520 then raise exception 'Export exceeds safe size; no partial export' using errcode='54000';end if;
  execute format('select coalesce(jsonb_agg(to_jsonb(r) order by %s),''[]''::jsonb) from (select %s from public.%I where user_id=$1) r',entry.ordering,entry.projection,entry.collection) into rows using owner_id;
  data=data||jsonb_build_object(entry.collection,rows);counts=counts||jsonb_build_object(entry.collection,n);
 end loop;
 with docs as materialized(select * from public.planner_link_documents()),edges as(
  select d.kind as source_kind,d.id as source_id,l.kind as target_kind,l.id as target_id
  from docs d cross join lateral public.planner_extract_links(d.body) l
  join docs target on target.kind=l.kind and target.id=l.id
 ) select coalesce(jsonb_agg(to_jsonb(e) order by source_kind,source_id,target_kind,target_id),'[]'::jsonb) into links from edges e;
 total_rows=total_rows+jsonb_array_length(links);
 data=data||jsonb_build_object('knowledge_links',links);counts=counts||jsonb_build_object('knowledge_links',jsonb_array_length(links));
 result=jsonb_build_object('format','life-planner-export','format_version',1,'exported_at',to_char(transaction_timestamp() at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),'total_records',total_rows,'counts',counts,'data',data);
 if total_rows>50000 or octet_length(result::text)>20971520 then raise exception 'Export exceeds safe size; no partial export' using errcode='54000';end if;
 return result;
end;$$;
revoke all on function public.planner_export_data() from public,anon;
grant execute on function public.planner_export_data() to authenticated;
commit;
