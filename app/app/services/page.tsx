import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveShopId } from "@/src/lib/shop";
import ServicesForm from "./services-form";

export default async function ServicesPage() {
  const activeShopId = await getActiveShopId();
  if (!activeShopId) redirect("/app/onboarding");

  const supabase = await createClient();

  const { data: services, error } = await supabase
    .from("services")
    .select("id, name, duration_min, price_cents, is_active, created_at")
    .eq("shop_id", activeShopId)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Serviços</h1>
        <p className="mt-3 text-red-500">Erro ao carregar: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Serviços</h1>

      <ServicesForm />

      <div className="space-y-3">
        {services?.length ? (
          services.map((s) => (
            <div key={s.id} className="rounded-lg border border-white/10 p-4">
              <div className="font-medium">{s.name}</div>
              <div className="text-sm opacity-80">
                {s.duration_min} min • R$ {(s.price_cents / 100).toFixed(2)} •{" "}
                {s.is_active ? "Ativo" : "Inativo"}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-white/10 p-4 opacity-80">
            Nenhum serviço cadastrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}
