begin;
alter table public.spaces
 add column icon text not null default 'folder' check(icon in('folder','home','briefcase','book','star','leaf')),
 add column cover text not null default 'auto' check(cover in('auto','cozy','desk','study','none')),
 add column accent text not null default 'auto' check(accent in('auto','pink','mint','blue','yellow','lilac'));
grant update(icon,cover,accent) on public.spaces to authenticated;
-- Existing RLS, owner immutability, and revision trigger continue to apply.
commit;
