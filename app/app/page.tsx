import { createClient } from "@/src/lib/supabase/server";
import Link from "next/link";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen p-6">
      <header className="mb-8 flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <h1 className="text-2xl font-semibold">Área do app</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {user?.email}
          </span>
          <form action="/auth/signout" method="POST">
            <SignOutButton />
          </form>
        </div>
      </header>
      <p className="text-neutral-600 dark:text-neutral-400">
        Você está autenticado. Esta rota está protegida pelo middleware.
      </p>
    </div>
  );
}

function SignOutButton() {
  return (
    <button
      type="submit"
      className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
    >
      Sair
    </button>
  );
}
