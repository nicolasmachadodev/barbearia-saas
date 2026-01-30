import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveShopId } from "@/src/lib/shop";
import StaffForm from "./staff-form";

export default async function StaffPage() {
  const activeShopId = await getActiveShopId();
  if (!activeShopId) redirect("/app/onboarding");

  const supabase = await createClient();

  const { data: staff, error } = await supabase
    .from("staff")
    .select("id, name, is_active, created_at")
    .eq("shop_id", activeShopId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Profissionais</h1>
        <p className="mt-3 text-red-500">Erro ao carregar: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Profissionais</h1>

      <StaffForm />

      <div className="space-y-3">
        {staff?.length ? (
          staff.map((s) => (
            <div key={s.id} className="rounded-lg border border-white/10 p-4">
              <div className="font-medium">{s.name}</div>
              <div className="text-sm opacity-80">
                {s.is_active ? "Ativo" : "Inativo"}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-white/10 p-4 opacity-80">
            Nenhum profissional cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}
