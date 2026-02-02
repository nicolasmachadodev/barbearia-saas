import { createAdminClient } from "@/src/lib/supabase/admin";
import { getAvailableSlots } from "@/src/lib/booking/get-available-slots";
import { createPublicAppointment } from "./actions";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    serviceId?: string;
    staffId?: string;
    date?: string;
    ok?: string;
  }>;
}) {
  const { slug } = await params;
  const { serviceId, staffId, date, ok } = await searchParams;

  const admin = createAdminClient();

  // 1) carregar shop pelo slug
  const { data: shop, error: shopError } = await admin
    .from("shops")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (shopError || !shop) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Barbearia não encontrada</h1>
      </div>
    );
  }

  // 2) serviços ativos
  const { data: services } = await admin
    .from("services")
    .select("id, name, duration_min")
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // 3) staff ativo
  const { data: staff } = await admin
    .from("staff")
    .select("id, name")
    .eq("shop_id", shop.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // (opcional) filtrar staff pelo service selecionado
  let staffFiltered = staff ?? [];
  if (serviceId) {
    const { data: links } = await admin
      .from("staff_services")
      .select("staff_id")
      .eq("service_id", serviceId);

    const allowed = new Set((links ?? []).map((x: any) => x.staff_id));
    staffFiltered = (staff ?? []).filter((s: any) => allowed.has(s.id));
  }

  const selectedService = (services ?? []).find((s: any) => s.id === serviceId);
  const durationMin = Number(selectedService?.duration_min ?? 0);

  // 4) calcular slots se tiver tudo selecionado
  let slots: { time: string }[] = [];
  if (serviceId && staffId && date) {
    slots = await getAvailableSlots({
      shopId: shop.id,
      serviceId,
      staffId,
      date,
      slotStepMin: 15,
    });
  }

  return (
    <div style={{ padding: 16, display: "grid", gap: 16, maxWidth: 520 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <h1 style={{ margin: 0 }}>{shop.name}</h1>
        <div style={{ opacity: 0.8 }}>Agendamento online</div>
      </div>

      {ok ? (
        <div style={{ border: "1px solid #16a34a", padding: 12, borderRadius: 8 }}>
          <strong>Agendamento confirmado!</strong>
          <div style={{ opacity: 0.8 }}>Você já pode fechar essa página.</div>
        </div>
      ) : null}

      {/* FORM 1: escolher serviço, staff e data (recarrega via querystring) */}
      <form
        action={async (formData: FormData) => {
          "use server";
          const { redirect } = await import("next/navigation");
          const s = String(formData.get("serviceId") ?? "");
          const st = String(formData.get("staffId") ?? "");
          const d = String(formData.get("date") ?? "");
          redirect(`/b/${encodeURIComponent(slug)}?serviceId=${encodeURIComponent(s)}&staffId=${encodeURIComponent(st)}&date=${encodeURIComponent(d)}`);
        }}
        style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, display: "grid", gap: 10 }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <span>Serviço</span>
          <select name="serviceId" defaultValue={serviceId ?? ""}>
            <option value="">Selecione...</option>
            {(services ?? []).map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration_min} min)
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Profissional</span>
          <select name="staffId" defaultValue={staffId ?? ""}>
            <option value="">Selecione...</option>
            {staffFiltered.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Data</span>
          <input type="date" name="date" defaultValue={date ?? ""} />
        </label>

        <button type="submit">Ver horários</button>
      </form>

      {/* FORM 2: confirmar (cliente) + escolher horário */}
      {serviceId && staffId && date ? (
        <form
          action={async (formData: FormData) => {
            "use server";
            const { redirect } = await import("next/navigation");

            const customerName = String(formData.get("customerName") ?? "");
            const customerPhone = String(formData.get("customerPhone") ?? "");
            const time = String(formData.get("time") ?? "");

            await createPublicAppointment({
              shopId: shop.id,
              staffId,
              serviceId,
              date,
              time,
              customerName,
              customerPhone,
            });

            redirect(`/b/${encodeURIComponent(slug)}?ok=1`);
          }}
          style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, display: "grid", gap: 10 }}
        >
          <div style={{ opacity: 0.8 }}>
            Serviço: <strong>{selectedService?.name ?? "-"}</strong>{" "}
            {durationMin ? `(${durationMin} min)` : null}
          </div>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Seu nome</span>
            <input name="customerName" placeholder="Ex: João" />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Seu telefone (opcional)</span>
            <input name="customerPhone" placeholder="Ex: (11) 99999-9999" />
          </label>

          <div style={{ marginTop: 6 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>Horários disponíveis em {date}</strong>
            </div>

            {slots.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="submit"
                    name="time"
                    value={s.time}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: 8,
                      padding: "6px 10px",
                      cursor: "pointer",
                    }}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ opacity: 0.8 }}>Nenhum horário disponível.</div>
            )}
          </div>
        </form>
      ) : (
        <div style={{ opacity: 0.8 }}>
          Selecione serviço, profissional e data para ver os horários.
        </div>
      )}
    </div>
  );
}
