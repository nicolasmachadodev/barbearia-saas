"use client";

import { createClient } from "@/src/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="mb-6 text-xl font-semibold">Entrar</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </p>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Não tem conta?{" "}
          <a href="/auth/signup" className="underline hover:no-underline">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
}
