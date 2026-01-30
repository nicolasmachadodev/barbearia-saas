import { cookies } from "next/headers";
import { ACTIVE_SHOP_ID_COOKIE } from "./constants";

export async function getActiveShopId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_SHOP_ID_COOKIE)?.value ?? null;
}
