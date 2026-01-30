# Checklist manual – Onboarding seguro

Use este checklist para validar o fluxo de onboarding (criação de barbearia e barbearia ativa).

---

## Pré-requisitos

- [ ] **Migração aplicada no Supabase**  
  Execute o SQL em `supabase/migrations/20250129000000_shops_and_onboarding.sql` no SQL Editor do Supabase (ou via `supabase db push` se usar CLI), para criar:
  - Tabela `public.shops`
  - Tabela `public.shop_members`
  - RPC `public.create_shop_and_owner(p_name, p_slug)`

- [ ] **RLS**  
  As políticas de RLS da migração garantem que usuários só vejam/inserem em shops em que são membros.

---

## 1. Redirecionamento quando não há membership

- [ ] **Usuário novo (sem nenhuma barbearia)**  
  Após login, ao acessar `/app` (ou qualquer rota em `/app/*` exceto `/app/onboarding`), o usuário é **redirecionado para `/app/onboarding`**.

- [ ] **Usuário com pelo menos uma barbearia**  
  Acessar `/app` **não** redireciona para onboarding; a página do app é exibida.

---

## 2. Página `/app/onboarding`

- [ ] **Formulário**  
  A página exibe os campos:
  - **Nome da barbearia** (obrigatório)
  - **Slug** (obrigatório; apenas letras minúsculas, números e hífens; ex.: `barbearia-do-joao`)

- [ ] **Validação**  
  Envio sem nome ou slug exibe mensagem de erro (ex.: "Nome e slug são obrigatórios.").

- [ ] **Slug duplicado**  
  Se o slug já existir em `shops`, o Supabase retorna erro; a mensagem de erro do RPC é exibida.

- [ ] **Sucesso**  
  Ao salvar com sucesso:
  1. O RPC `create_shop_and_owner` é chamado com `p_name` e `p_slug`.
  2. O cookie HTTP-only `active_shop_id` é definido com o id da nova barbearia.
  3. O usuário é redirecionado para **`/app`**.

- [ ] **Usuário já com membership**  
  Se o usuário já tiver pelo menos uma barbearia e acessar `/app/onboarding` diretamente, é **redirecionado para `/app`** (evita re-criar barbearia desnecessariamente).

---

## 3. Cookie `active_shop_id` (HTTP-only)

- [ ] **Após criar a primeira barbearia**  
  O cookie `active_shop_id` é definido no **server** (Server Action), com opções:
  - `httpOnly: true`
  - `path: '/'`
  - `sameSite: 'lax'`
  - `secure: true` em produção

- [ ] **Uso no app**  
  A barbearia ativa é lida a partir desse cookie em Server Components (ex.: header, página principal) para exibir o nome da barbearia ativa e o seletor (quando houver mais de uma).

---

## 4. Seletor de barbearia ativa (mais de uma barbearia)

- [ ] **Uma barbearia**  
  O seletor **não** é exibido; a barbearia ativa é a única e o cookie é definido automaticamente se ainda não existir.

- [ ] **Duas ou mais barbearias**  
  No header da área `/app` é exibido um **seletor** (dropdown) “Barbearia:” com a lista de barbearias do usuário.

- [ ] **Troca de barbearia**  
  Ao selecionar outra barbearia no dropdown:
  1. Uma Server Action atualiza o cookie `active_shop_id`.
  2. A página é atualizada (ex.: `revalidatePath` + `router.refresh()`) e o conteúdo reflete a barbearia ativa.

- [ ] **Segurança**  
  A action que define o cookie só persiste o valor se o usuário for membro da shop escolhida (consulta em `shop_members`).

---

## 5. Segurança e RPC

- [ ] **RPC `create_shop_and_owner`**  
  Usa `auth.uid()` no server para associar o owner; não aceita `user_id` do client.

- [ ] **Nenhum uso de service role no client**  
  Todo o fluxo (onboarding, cookie, seletor) usa apenas o cliente Supabase com anon key e sessão do usuário.

- [ ] **RLS**  
  Usuários só leem/escrevem em `shops` e `shop_members` conforme as políticas da migração.

---

## Resumo de arquivos

| Arquivo | Função |
|--------|--------|
| `supabase/migrations/..._shops_and_onboarding.sql` | Tabelas `shops`, `shop_members` e RPC `create_shop_and_owner`. |
| `src/lib/constants.ts` | Nome e maxAge do cookie `active_shop_id`. |
| `src/lib/shop.ts` | Leitura do cookie `active_shop_id` (server). |
| `app/app/onboarding/page.tsx` | Página de onboarding; redireciona se já tiver membership. |
| `app/app/onboarding/onboarding-form.tsx` | Formulário name + slug (client). |
| `app/app/onboarding/actions.ts` | Server Action: RPC + set cookie + redirect. |
| `app/app/actions.ts` | Server Action: `setActiveShop(shopId)` (cookie + revalidate). |
| `app/app/layout.tsx` | Layout que carrega shops e active_shop_id; passa ao header. |
| `app/app/app-header.tsx` | Header com seletor de barbearia (quando > 1) e botão Sair. |
| `middleware.ts` | Redireciona para `/app/onboarding` se usuário sem nenhuma membership em `/app/*`. |

---

## Fluxo resumido

1. Usuário faz login → vai para `/app`.
2. Middleware vê que não há membership → redireciona para `/app/onboarding`.
3. Usuário preenche nome e slug e envia → Server Action chama `create_shop_and_owner`, seta cookie `active_shop_id`, redirect para `/app`.
4. Em `/app`, layout lê cookie e shops; se mais de uma shop, exibe seletor; troca de shop atualiza cookie e revalida.
