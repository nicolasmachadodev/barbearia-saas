# Bugfix: Checkbox de serviços não marca (INSERT falha)

## 🔍 Diagnóstico

### Causa raiz
**RLS (Row Level Security) bloqueando INSERT** na tabela `staff_services`.

- ✅ **DELETE funciona**: Provavelmente há policy de DELETE ou RLS não está bloqueando DELETE.
- ❌ **INSERT falha**: Não há policy de INSERT permitindo que usuários autenticados criem vínculos em `staff_services`.

### Por que DELETE funciona mas INSERT não?
- DELETE pode ter uma policy existente ou RLS pode estar configurado de forma diferente.
- INSERT requer policy explícita que verifique:
  1. O usuário é membro da shop (`shop_members`)
  2. O `staff` pertence à shop do usuário
  3. O `service` pertence à mesma shop

### Arquivos envolvidos
- `app/app/staff/[id]/services-picker.tsx` - Componente que chama a action
- `app/app/staff/actions.ts` - Server Action que faz INSERT/DELETE
- `supabase/migrations/20250129000001_staff_services_rls.sql` - **NOVO**: Policies de RLS

---

## 🔧 Correções aplicadas

### 1. Migration SQL: Policies de RLS
**Arquivo:** `supabase/migrations/20250129000001_staff_services_rls.sql`

- ✅ Cria constraint única `(staff_id, service_id)` se não existir
- ✅ Policy de SELECT: usuário vê vínculos de shops que é membro
- ✅ Policy de INSERT: usuário pode criar vínculo se staff e service pertencem à mesma shop e o usuário é membro
- ✅ Policy de DELETE: usuário pode deletar vínculos de shops que é membro

### 2. Ajuste no código: Tratamento de erro
**Arquivo:** `app/app/staff/actions.ts`

- ✅ Troca `upsert` por `insert` (mais explícito)
- ✅ Trata erro de duplicata (código `23505`) como idempotência (ignora se já existe)
- ✅ Mensagem de erro mais clara

---

## 📋 Checklist de teste manual

### Pré-requisitos
- [ ] Executar a migration SQL no Supabase:
  ```sql
  -- Copiar e executar o conteúdo de:
  supabase/migrations/20250129000001_staff_services_rls.sql
  ```
- [ ] Verificar no Supabase Dashboard → Authentication → Policies que `staff_services` tem:
  - Policy de SELECT
  - Policy de INSERT
  - Policy de DELETE

### Teste 1: Marcar checkbox (INSERT)
- [ ] Acessar `/app/staff/[id]` (onde `[id]` é um staff válido)
- [ ] Verificar que há serviços listados
- [ ] **Marcar um checkbox de serviço que está desmarcado**
- [ ] ✅ **Resultado esperado**: Checkbox marca imediatamente (sem F5), sem erro no console
- [ ] Verificar no Supabase (Table Editor → `staff_services`) que a linha foi inserida

### Teste 2: Desmarcar checkbox (DELETE)
- [ ] Na mesma página, **desmarcar um checkbox que está marcado**
- [ ] ✅ **Resultado esperado**: Checkbox desmarca imediatamente, sem erro
- [ ] Verificar no Supabase que a linha foi removida de `staff_services`

### Teste 3: Marcar novamente (idempotência)
- [ ] Marcar o mesmo serviço que acabou de desmarcar
- [ ] ✅ **Resultado esperado**: Marca sem erro (mesmo que já exista no banco, ignora duplicata)

### Teste 4: Múltiplos serviços
- [ ] Marcar vários checkboxes em sequência rápida
- [ ] ✅ **Resultado esperado**: Todos marcam sem erro, UI atualiza imediatamente

### Teste 5: Verificar console do browser
- [ ] Abrir DevTools → Console
- [ ] Marcar/desmarcar checkboxes
- [ ] ✅ **Resultado esperado**: Nenhum erro vermelho no console

### Teste 6: Verificar terminal do Next.js
- [ ] Verificar terminal onde `npm run dev` está rodando
- [ ] Marcar/desmarcar checkboxes
- [ ] ✅ **Resultado esperado**: Nenhum erro de "permission denied" ou "RLS policy violation"

### Teste 7: Segurança (usuário de outra shop)
- [ ] Criar outro usuário e fazer login
- [ ] Tentar acessar `/app/staff/[id]` de uma shop que não é membro
- [ ] ✅ **Resultado esperado**: Não consegue ver/marcar serviços (ou página retorna erro/permissão negada)

---

## 🐛 Se ainda não funcionar

### Verificar no Supabase Dashboard:
1. **Table Editor → `staff_services`**:
   - Verificar se a tabela existe
   - Verificar se tem colunas `staff_id` e `service_id`
   - Verificar se há constraint única em `(staff_id, service_id)`

2. **Authentication → Policies → `staff_services`**:
   - Verificar se há 3 policies (SELECT, INSERT, DELETE)
   - Verificar se as policies estão **habilitadas** (não desabilitadas)

3. **SQL Editor**:
   ```sql
   -- Verificar se RLS está habilitado
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'staff_services';
   -- rowsecurity deve ser true
   
   -- Verificar policies
   SELECT * FROM pg_policies WHERE tablename = 'staff_services';
   -- Deve retornar 3 policies
   ```

### Verificar no código:
- [ ] `app/app/staff/actions.ts` usa `insert` (não `upsert` sem parâmetros)
- [ ] A action valida que `staff` e `service` pertencem à `activeShopId`
- [ ] O componente `services-picker.tsx` trata erros e reverte UI em caso de falha

---

## 📝 Resumo das mudanças

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/20250129000001_staff_services_rls.sql` | **CRIADO**: Policies de RLS para SELECT/INSERT/DELETE |
| `app/app/staff/actions.ts` | `upsert` → `insert` + tratamento de duplicata |
