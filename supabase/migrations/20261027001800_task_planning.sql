begin;
alter table public.tasks
 add column due_date date check(due_date is null or due_date between date '1900-01-01' and date '2100-12-31'),
 add column priority text not null default 'none' check(priority in ('none','low','medium','high')),
 add column planning_revision integer not null default 1 check(planning_revision > 0);
grant update(due_date,priority) on public.tasks to authenticated;
-- Quick capture keeps existing insert grants; database defaults provide an unplanned task.
create function public.bump_task_planning_revision() returns trigger language plpgsql set search_path='' as $$
begin
 if new.due_date is distinct from old.due_date or new.priority is distinct from old.priority then
  new.planning_revision=old.planning_revision+1;
 end if;
 return new;
end;
$$;
revoke all on function public.bump_task_planning_revision() from public,anon,authenticated;
create trigger tasks_planning_revision before update on public.tasks for each row execute function public.bump_task_planning_revision();
commit;
