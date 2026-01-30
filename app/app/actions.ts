"use server";

import {
  ACTIVE_SHOP_COOKIE_MAX_AGE,
  ACTIVE_SHOP_ID_COOKIE,
} from "@/src/lib/constants";
import { createClient } from "@/src/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * Define a barbearia ativa (cookie HTTP-only). Só persiste se o usuário for membro da shop.
 */
export async function setActiveShop(shopId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Não autenticado." };
  }

  const { data: membership } = await supabase
    .from("shop_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("shop_id", shopId)
    .single();

  if (!membership) {
    return { error: "Você não tem acesso a esta barbearia." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SHOP_ID_COOKIE, shopId, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ACTIVE_SHOP_COOKIE_MAX_AGE,
  });

  revalidatePath("/app");
  revalidatePath("/app/onboarding");
  return {};
}
