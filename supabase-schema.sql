-- Rode este script inteiro no SQL Editor do Supabase (Project > SQL Editor > New query)

create table if not exists app_storage (
  user_id uuid not null default auth.uid(),
  key text not null,
  value text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table app_storage enable row level security;

create policy "usuário lê seus próprios dados"
  on app_storage for select
  using (auth.uid() = user_id);

create policy "usuário insere seus próprios dados"
  on app_storage for insert
  with check (auth.uid() = user_id);

create policy "usuário atualiza seus próprios dados"
  on app_storage for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "usuário apaga seus próprios dados"
  on app_storage for delete
  using (auth.uid() = user_id);
