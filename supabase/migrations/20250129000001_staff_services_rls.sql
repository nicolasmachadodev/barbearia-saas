-- RLS para staff_services: permite INSERT/DELETE quando o usuário é membro da shop
-- que possui tanto o staff quanto o service.

-- Garantir constraint única (staff_id, service_id) se não existir
create unique index if not exists staff_services_staff_service_unique 
  on public.staff_services (staff_id, service_id);

-- Garantir que RLS está habilitado
alter table if exists public.staff_services enable row level security;

-- Policy para SELECT: usuário pode ver vínculos de staffs/services da sua shop
create policy if not exists "Users can view staff_services from their shops"
  on public.staff_services for select
  using (
    exists (
      select 1 from public.staff s
      inner join public.shop_members sm on sm.shop_id = s.shop_id
      where s.id = staff_services.staff_id
        and sm.user_id = auth.uid()
    )
  );

-- Policy para INSERT: usuário pode criar vínculo se staff e service pertencem à mesma shop
-- e o usuário é membro dessa shop
create policy if not exists "Users can insert staff_services for their shops"
  on public.staff_services for insert
  with check (
    exists (
      select 1 from public.staff s
      inner join public.services sv on sv.shop_id = s.shop_id
      inner join public.shop_members sm on sm.shop_id = s.shop_id
      where s.id = staff_services.staff_id
        and sv.id = staff_services.service_id
        and sm.user_id = auth.uid()
    )
  );

-- Policy para DELETE: usuário pode deletar vínculos de staffs/services da sua shop
create policy if not exists "Users can delete staff_services from their shops"
  on public.staff_services for delete
  using (
    exists (
      select 1 from public.staff s
      inner join public.shop_members sm on sm.shop_id = s.shop_id
      where s.id = staff_services.staff_id
        and sm.user_id = auth.uid()
    )
  );
