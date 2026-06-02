create table quiniela (
  id text primary key,
  data jsonb not null,
  updated_at timestamp default now()
);

alter table quiniela enable row level security;

create policy "public read write" on quiniela
  for all using (true) with check (true);
