import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveShopId } from "@/src/lib/shop";
import ServicesPicker from "./services-picker";

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const activeShopId = await getActiveShopId();
  if (!activeShopId) redirect("/app/onboarding");

  const supabase = await createClient();

  // 1) carrega profissional (garantindo shop_id)
  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("id, name, is_active")
    .eq("id", id)
    .eq("shop_id", activeShopId)
    .single();

  if (staffError || !staff) {
    return (
      <div className="p-6">
        <p className="text-red-500">Profissional não encontrado.</p>
      </div>
    );
  }

  // 2) lista serviços da shop
  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, name, duration_min, price_cents")
    .eq("shop_id", activeShopId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (servicesError) {
    return (
      <div className="p-6">
        <p className="text-red-500">Erro ao carregar serviços: {servicesError.message}</p>
      </div>
    );
  }

  // 3) serviços marcados (join pela tabela pivot)
  const { data: links, error: linksError } = await supabase
    .from("staff_services")
    .select("service_id")
    .eq("staff_id", staff.id);

  if (linksError) {
    return (
      <div className="p-6">
        <p className="text-red-500">Erro ao carregar vínculos: {linksError.message}</p>
      </div>
    );
  }

  const selectedServiceIds = (links ?? []).map((x) => x.service_id as string);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{staff.name}</h1>
        <div className="text-sm opacity-80">
          Status: {staff.is_active ? "Ativo" : "Inativo"}
        </div>
      </div>

      <ServicesPicker
        staffId={staff.id}
        services={services ?? []}
        selectedServiceIds={selectedServiceIds}
      />
    </div>
  );
}
