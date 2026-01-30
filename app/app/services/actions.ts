"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/src/lib/supabase/server";
import { getActiveShopId } from "@/src/lib/shop";

const ServiceSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  duration_min: z.coerce.number().int().min(5).max(480),
  price_reais: z.coerce.number().min(0),
});

export type CreateServiceState = {
  error?: string;
};

export async function createService(
  _prev: CreateServiceState,
  formData: FormData
): Promise<CreateServiceState> {
  const parsed = ServiceSchema.safeParse({
    name: formData.get("name"),
    duration_min: formData.get("duration_min"),
    price_reais: formData.get("price_reais"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const activeShopId = await getActiveShopId();
  if (!activeShopId) return { error: "Nenhuma barbearia ativa." };

  const supabase = await createClient();

  const price_cents = Math.round(parsed.data.price_reais * 100);

  const { error } = await supabase.from("services").insert({
    shop_id: activeShopId,
    name: parsed.data.name,
    duration_min: parsed.data.duration_min,
    price_cents,
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/app/services");
  return {};
}
