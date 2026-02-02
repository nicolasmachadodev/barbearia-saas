"use server";

import { createAdminClient } from "@/src/lib/supabase/admin";
import { getAvailableSlots } from "@/src/lib/booking/get-available-slots";

function isoAtSaoPaulo(date: string, time: string) {
  return `${date}T${time}:00-03:00`;
}

export async function createPublicAppointment(input: {
  shopId: string;
  staffId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  customerName: string;
  customerPhone?: string;
}) {
  const admin = createAdminClient();

  const customerName = (input.customerName ?? "").trim();
  const customerPhone = (input.customerPhone ?? "").trim();

  if (!customerName) throw new Error("Informe seu nome.");
  if (!input.shopId || !input.staffId || !input.serviceId) throw new Error("Dados inválidos.");
  if (!input.date || !input.time) throw new Error("Data/hora inválidas.");

  // 1) pega duração do serviço
  const { data: service, error: serviceError } = await admin
    .from("services")
    .select("id, duration_min, is_active, shop_id")
    .eq("id", input.serviceId)
    .eq("shop_id", input.shopId)
    .single();

  if (serviceError || !service || !service.is_active) {
    throw new Error("Serviço inválido.");
  }

  const durationMin = Number(service.duration_min ?? 0);
  if (!durationMin || durationMin <= 0) throw new Error("Serviço com duração inválida.");

  // 2) valida se o horário ainda está disponível (recalcula slots no server)
  const slots = await getAvailableSlots({
    staffId: input.staffId,
    serviceId: input.serviceId,
    date: input.date,
    slotStepMin: 15,
    shopId: input.shopId,
  });

  const isAllowed = slots.some((s) => s.time === input.time);
  if (!isAllowed) {
    throw new Error("Esse horário não está mais disponível. Atualize a página e tente outro.");
  }

  const startIso = isoAtSaoPaulo(input.date, input.time);
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMin * 60000);
  const endIso = end.toISOString();

  // 3) cria appointment (confirmado)
  const { error: insError } = await admin.from("appointments").insert({
    shop_id: input.shopId,
    staff_id: input.staffId,
    service_id: input.serviceId,
    customer_name: customerName,
    customer_phone: customerPhone ? customerPhone : null,
    start_at: startIso,
    end_at: endIso,
    status: "confirmed",
  });

  if (insError) throw new Error(insError.message);

  return { ok: true };
}
