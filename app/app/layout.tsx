import { createClient } from "@/src/lib/supabase/server";
import { getActiveShopId } from "@/src/lib/shop";
import { redirect } from "next/navigation";
import { AppHeader } from "./app-header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const activeShopId = await getActiveShopId();

  return (
    <div className="min-h-screen">
      <AppHeader
        userEmail={user.email ?? ""}
        shops={[]} // vazio por enquanto (correto)
        activeShopId={activeShopId}
      />
      <main className="p-6">{children}</main>
    </div>
  );
}
