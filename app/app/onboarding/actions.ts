"use server";

import {
  ACTIVE_SHOP_COOKIE_MAX_AGE,
  ACTIVE_SHOP_ID_COOKIE,
} from "@/src/lib/constants";
import { createClient } from "@/src/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type OnboardingState = {
  error?: string;
};

export async function createShopAndSetActive(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const name = (formData.get("name") as string)?.trim();
  const slug = (formData.get("slug") as string)?.trim();

  if (!name || !slug) {
    return { error: "Nome e slug são obrigatórios." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão inválida. Faça login novamente." };
  }

  const { data: shopId, error } = await supabase.rpc("create_shop_and_owner", {
    p_name: name,
    p_slug: slug,
  });

  if (error) return { error: error.message };
  if (!shopId) return { error: "Não foi possível criar a barbearia." };

  // ✅ NO SEU NEXT: cookies() É Promise, então precisa await
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SHOP_ID_COOKIE, String(shopId), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ACTIVE_SHOP_COOKIE_MAX_AGE,
  });

  redirect("/app");
}
