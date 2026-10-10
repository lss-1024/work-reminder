begin;
create table public.reminder_boards (
 owner_id uuid primary key references auth.users(id) on delete cascade,
 version bigint not null default 1,
 payload jsonb not null default '{"tasks":[],"history":[]}'::jsonb,
 updated_at timestamptz not null default now(),
 constraint board_size check (octet_length(payload::text) < 4000000)
);
alter table public.reminder_boards enable row level security;
revoke all on public.reminder_boards from anon, authenticated;
grant select, insert, update on public.reminder_boards to authenticated;
create policy board_read on public.reminder_boards for select to authenticated using (owner_id=(select auth.uid()));
create policy board_insert on public.reminder_boards for insert to authenticated with check (owner_id=(select auth.uid()));
create policy board_update on public.reminder_boards for update to authenticated using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
insert into storage.buckets (id,name,public,file_size_limit) values ('reminder-docs','reminder-docs',false,20971520);
create policy doc_read on storage.objects for select to authenticated using (bucket_id='reminder-docs' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy doc_upload on storage.objects for insert to authenticated with check (bucket_id='reminder-docs' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
