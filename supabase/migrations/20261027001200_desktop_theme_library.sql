begin;
-- Extend the allowed palette names without changing saved choices or ownership.
alter table public.planner_preferences drop constraint planner_preferences_theme_check;
alter table public.planner_preferences add constraint planner_preferences_theme_check
 check(theme in('sage','rose','midnight','classic','cloud','peach','lavender','plum','ocean','forest','espresso','graphite'));
commit;
