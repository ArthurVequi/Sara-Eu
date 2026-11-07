create table if not exists public.organiza_members (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.organiza_members enable row level security;
create policy "Read own membership" on public.organiza_members for select
  to authenticated using (user_id = auth.uid());

create table if not exists public.organiza_workspace (
  id integer primary key check (id = 1),
  version integer not null default 0,
  entries jsonb not null default '[]' check (jsonb_typeof(entries) = 'array')
);
insert into public.organiza_workspace (id) values (1) on conflict do nothing;
alter table public.organiza_workspace enable row level security;
create policy "Members read workspace" on public.organiza_workspace for select
  to authenticated using (exists (select 1 from public.organiza_members where user_id = auth.uid()));
create policy "Members edit workspace" on public.organiza_workspace for update
  to authenticated using (exists (select 1 from public.organiza_members where user_id = auth.uid()));

create table if not exists public.organiza_push (
  endpoint text primary key,
  user_id uuid not null references public.organiza_members(user_id) on delete cascade,
  subscription jsonb not null
);
alter table public.organiza_push enable row level security;
create policy "Members manage own notifications" on public.organiza_push for all
  to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
