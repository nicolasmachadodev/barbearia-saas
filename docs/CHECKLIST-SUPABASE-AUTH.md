# Checklist manual – Supabase SSR (Next.js App Router)

Use este checklist para validar a configuração de autenticação Supabase SSR.

---

## Pré-requisitos

- [ ] `.env.local` configurado com:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - (Opcional) `SUPABASE_SERVICE_ROLE_KEY` **apenas** em código server-side, nunca no client.)

- [ ] No Supabase Dashboard → Authentication → URL Configuration:
  - **Site URL**: `http://localhost:3000` (dev) ou sua URL de produção.
  - **Redirect URLs**: incluir `http://localhost:3000/auth/callback` (e a URL de produção se aplicável).

---

## 1. Clientes Supabase (sem service role no client)

- [ ] **Client** (`src/lib/supabase/client.ts`): usado apenas em Client Components; usa somente `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- [ ] **Server** (`src/lib/supabase/server.ts`): usado em Server Components, Server Actions e Route Handlers; usa somente `NEXT_PUBLIC_SUPABASE_ANON_KEY` (não usar service role aqui para fluxo de auth do usuário).

---

## 2. Rotas de autenticação

### Login (`/auth/login`)

- [ ] Acessar `http://localhost:3000/auth/login`.
- [ ] Formulário exibe campos **E-mail** e **Senha**.
- [ ] Submeter com credenciais inválidas: mensagem de erro aparece.
- [ ] Submeter com credenciais válidas: redireciona para **`/app`**.
- [ ] Link “Cadastre-se” leva para `/auth/signup`.

### Cadastro (`/auth/signup`)

- [ ] Acessar `http://localhost:3000/auth/signup`.
- [ ] Formulário exibe campos **E-mail** e **Senha**.
- [ ] Cadastrar novo usuário: mensagem de sucesso (e/ou instrução de confirmar e-mail, se estiver ativo).
- [ ] Link “Entrar” leva para `/auth/login`.

### Callback (`/auth/callback`)

- [ ] Se usar confirmação por e-mail: clicar no link do e-mail deve abrir algo como `.../auth/callback?code=...` e redirecionar para **`/app`** após troca do code por sessão.

---

## 3. Middleware – proteção de `/app/*`

- [ ] **Sem login**: acessar `http://localhost:3000/app` (ou qualquer rota em `/app/*`) redireciona para **`/auth/login`**.
- [ ] **Com login**: após entrar, acessar `http://localhost:3000/app` exibe a página do app (ex.: “Área do app” e e-mail do usuário).
- [ ] **Logado em `/auth/login` ou `/auth/signup`**: ao acessar `/auth/login` ou `/auth/signup` já autenticado, deve redirecionar para **`/app`**.

---

## 4. Redirecionamento pós-login

- [ ] Após login com sucesso, o usuário é redirecionado para **`/app`**.
- [ ] Se houver `?redirectTo=/app/outra-rota` em `/auth/login`, após login o usuário deve ir para essa rota (se estiver implementado no formulário).

---

## 5. Logout

- [ ] Na página `/app`, clicar em **Sair** (ou botão que chama a rota de signout).
- [ ] Deve redirecionar para **`/auth/login`** e a sessão deve estar encerrada (ao tentar acessar `/app` de novo, volta para `/auth/login`).

---

## 6. Segurança (revisão rápida)

- [ ] Nenhum uso de **service role** em:
  - `src/lib/supabase/client.ts`
  - Componentes que rodam no browser.
- [ ] Proteção de rotas em `/app/*` feita no **middleware** usando sessão (ex.: `getUser()`), não apenas em componentes.

---

## Resumo de arquivos envolvidos

| Arquivo | Função |
|--------|--------|
| `src/lib/supabase/client.ts` | Cliente browser (cookies; anon key apenas). |
| `src/lib/supabase/server.ts` | Cliente server (cookies; anon key apenas). |
| `middleware.ts` | Refresh de sessão + proteção de `/app/*` + redirecionamentos. |
| `app/auth/login/page.tsx` | Formulário de login; redireciona para `/app` após sucesso. |
| `app/auth/signup/page.tsx` | Formulário de cadastro. |
| `app/auth/callback/route.ts` | Troca de code por sessão (ex.: confirmação de e-mail). |
| `app/auth/signout/route.ts` | Logout e redirecionamento para `/auth/login`. |
| `app/app/page.tsx` | Página protegida (ex.: “Área do app”). |
