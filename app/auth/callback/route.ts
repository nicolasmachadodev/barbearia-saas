import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Rota de callback para troca de code por sessão (ex.: confirmação de e-mail).
 * Após sucesso, redireciona para /app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
