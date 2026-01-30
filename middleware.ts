import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // 🔑 MUITO IMPORTANTE: sincroniza sessão antes de ler cookies
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = req.nextUrl.pathname
  const isOnboarding = pathname.startsWith('/app/onboarding')

  // 🔒 Protege /app
  if (pathname.startsWith('/app')) {
    if (!user) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Onboarding: redireciona só quando não tem NENHUMA membership no banco.
    // Não usa cookie active_shop_id (pode não vir no primeiro request após Server Action).
    if (!isOnboarding) {
      const { data: memberships } = await supabase
        .from('memberships')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

      if (!memberships || memberships.length === 0) {
        return NextResponse.redirect(new URL('/app/onboarding', req.url))
      }
    }
  }

  // 🚫 Impede usuário logado de voltar para login/signup
  if (
    user &&
    (pathname.startsWith('/auth/login') ||
      pathname.startsWith('/auth/signup'))
  ) {
    return NextResponse.redirect(new URL('/app', req.url))
  }

  return res
}

export const config = {
  matcher: ['/app/:path*', '/auth/:path*'],
}
