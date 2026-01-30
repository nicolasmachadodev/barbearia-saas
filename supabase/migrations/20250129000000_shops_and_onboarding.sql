-- Tabela de barbearias (shops)
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  constraint shops_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' or length(slug) = 1 and slug ~ '^[a-z0-9]$')
);

create unique index if not exists shops_slug_key on public.shops (slug);

alter table public.shops enable row level security;

-- Apenas membros da barbearia podem ver
create policy "Users can view their shops"
  on public.shops for select
  using (
    id in (
      select shop_id from public.shop_members where user_id = auth.uid()
    )
  );

-- Tabela de vínculo usuário <-> barbearia (memberships)
create table if not exists public.shop_members (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (shop_id, user_id)
);

create index if not exists shop_members_user_id_idx on public.shop_members (user_id);

alter table public.shop_members enable row level security;

create policy "Users can view own memberships"
  on public.shop_members for select
  using (user_id = auth.uid());

create policy "Users can insert own membership"
  on public.shop_members for insert
  with check (user_id = auth.uid());

-- RPC: cria barbearia e associa o usuário atual como owner
-- Chamar com supabase.rpc('create_shop_and_owner', { p_name, p_slug })
create or replace function public.create_shop_and_owner(p_name text, p_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid;
  v_slug text := trim(both '-' from lower(trim(regexp_replace(p_slug, '[^a-z0-9-]', '-', 'g'))));
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if length(trim(p_name)) < 1 then
    raise exception 'Name is required';
  end if;

  if length(v_slug) < 1 then
    raise exception 'Slug is required';
  end if;

  insert into public.shops (name, slug)
  values (trim(p_name), v_slug)
  returning id into v_shop_id;

  insert into public.shop_members (shop_id, user_id, role)
  values (v_shop_id, auth.uid(), 'owner');

  return v_shop_id;
end;
$$;

comment on function public.create_shop_and_owner is 'Cria uma nova barbearia e associa o usuário autenticado como owner. Retorna o id da barbearia.';
