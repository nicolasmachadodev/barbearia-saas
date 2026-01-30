"use client";

import { createClient } from "@/src/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setMessage(
      "Conta criada. Se o projeto tiver confirmação por e-mail, verifique sua caixa de entrada. Caso contrário, você já pode entrar."
    );
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="mb-6 text-xl font-semibold">Cadastro</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </p>
          )}
          {message && (
            <p className="rounded bg-green-100 px-3 py-2 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
              {message}
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
              autoComplete="new-password"
              minLength={6}
              className="rounded border border-neutral-300 px-3 py-2 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded bg-neutral-900 px-4 py-2 font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {loading ? "Cadastrando…" : "Cadastrar"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Já tem conta?{" "}
          <a href="/auth/login" className="underline hover:no-underline">
            Entrar
          </a>
        </p>
      </div>
    </div>
  );
}
