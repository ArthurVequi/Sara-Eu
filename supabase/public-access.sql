drop policy "Members read workspace" on public.organiza_workspace;
drop policy "Members edit workspace" on public.organiza_workspace;
create policy "Anyone can read workspace" on public.organiza_workspace for select
  to anon, authenticated using (id = 1);
create policy "Anyone can edit workspace" on public.organiza_workspace for update
  to anon, authenticated using (id = 1) with check (id = 1);
grant select on public.organiza_workspace to anon;
grant update (version, entries) on public.organiza_workspace to anon;

drop policy "Members manage own notifications" on public.organiza_push;
revoke all on public.organiza_push from anon, authenticated;
alter table public.organiza_push drop column user_id;
grant select, insert, delete on public.organiza_push to service_role;
drop table public.organiza_members;
