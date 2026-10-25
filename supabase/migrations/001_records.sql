-- Backend-only metadata store. The browser never receives a database secret.
create table if not exists public.sa_records (
  kind text not null check (kind in ('user','integration','repository','activity','standup','recap','dismissal','session','oauth','job','sync')),
  id text not null,
  owner text not null,
  payload jsonb not null,
  version integer not null default 1 check (version > 0),
  primary key (kind, id)
);
create index if not exists sa_records_owner on public.sa_records(owner, kind);
alter table public.sa_records enable row level security;
revoke all on public.sa_records from anon, authenticated;
grant select, insert, update, delete on public.sa_records to service_role;
-- No browser policies: all user authorization is enforced by the backend.
