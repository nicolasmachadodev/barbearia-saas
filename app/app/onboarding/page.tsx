import { createClient } from "@/src/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: memberships } = await supabase
    .from("shop_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (memberships && memberships.length > 0) {
    redirect("/app");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="mb-2 text-xl font-semibold">Criar sua barbearia</h1>
        <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
          Defina o nome e o identificador (slug) da sua barbearia.
        </p>
        <OnboardingForm />
      </div>
    </div>
  );
}
