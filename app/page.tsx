import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Se estiver logado, manda pro app
  if (user) redirect("/app");

  // Se não estiver logado, manda pro login
  redirect("/auth/login");
}
