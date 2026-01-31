"use server";

import { createClient } from "@/src/lib/supabase/server";
import { getActiveShopId } from "@/src/lib/shop";
import { revalidatePath } from "next/cache";

export type ToggleState = { error?: string };

export async function toggleStaffService(
  _prev: ToggleState,
  formData: FormData
): Promise<ToggleState> {
  const staff_id = String(formData.get("staff_id") ?? "");
  const service_id = String(formData.get("service_id") ?? "");
  const checked = String(formData.get("checked") ?? "") === "true";

  if (!staff_id || !service_id) return { error: "Dados inválidos." };

  const activeShopId = await getActiveShopId();
  if (!activeShopId) return { error: "Nenhuma barbearia ativa." };

  const supabase = await createClient();

  if (checked) {
    const { error } = await supabase.from("staff_services").insert({
      staff_id,
      service_id,
    });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("staff_services")
      .delete()
      .eq("staff_id", staff_id)
      .eq("service_id", service_id);

    if (error) return { error: error.message };
  }

  revalidatePath(`/app/staff/${staff_id}`);
  return {};
}
