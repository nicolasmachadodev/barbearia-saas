"use server";

import { z } from "zod";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveShopId } from "@/src/lib/shop";
import { revalidatePath } from "next/cache";

/* =========================
   CREATE STAFF
========================= */

const StaffSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
});

export type CreateStaffState = {
  error?: string;
};

export async function createStaff(
  _prev: CreateStaffState,
  formData: FormData
): Promise<CreateStaffState> {
  const parsed = StaffSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message };
  }

  const activeShopId = await getActiveShopId();
  if (!activeShopId) {
    return { error: "Nenhuma barbearia ativa." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("staff").insert({
    shop_id: activeShopId,
    name: parsed.data.name,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/app/staff");
  return {};
}

/* =========================
   TOGGLE STAFF SERVICE
========================= */

export async function toggleStaffService(
  staffId: string,
  serviceId: string,
  checked: boolean
) {
  const activeShopId = await getActiveShopId();
  if (!activeShopId) {
    throw new Error("Nenhuma barbearia ativa.");
  }

  const supabase = await createClient();

  if (checked) {
    const { error } = await supabase.from("staff_services").insert({
      staff_id: staffId,
      service_id: serviceId,
    });

    if (error && error.code !== "23505") {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase
      .from("staff_services")
      .delete()
      .eq("staff_id", staffId)
      .eq("service_id", serviceId);

    if (error) throw new Error(error.message);
  }

  revalidatePath(`/app/staff/${staffId}`);
}
