"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveShopId } from "@/src/lib/shop";

export async function createTestAppointment(input: {
  staffId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMin: number;
}) {
  const supabase = await createClient();
  const shopId = await getActiveShopId();
  if (!shopId) throw new Error("Barbearia ativa não encontrada.");

  const startIso = `${input.date}T${input.time}:00-03:00`;
  const start = new Date(startIso);
  const end = new Date(start.getTime() + input.durationMin * 60000);

  const endIso = end.toISOString(); // ok para timestamptz

  const { error } = await supabase.from("appointments").insert({
    shop_id: shopId,
    staff_id: input.staffId,
    service_id: input.serviceId,
    customer_name: "Teste",
    customer_phone: null,
    start_at: startIso,
    end_at: endIso,
    status: "confirmed",
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/app/staff/${input.staffId}/slots`);
}
