import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso em Client Components (browser).
 * Usa apenas a chave anon/publishable — nunca use service role no client.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
