import { createClient } from "@/src/lib/supabase/server";
import { getActiveShopId } from "@/src/lib/shop";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const activeShopId = await getActiveShopId();

  let activeShopName: string | null = null;
  if (activeShopId) {
    const { data: shop } = await supabase
      .from("shops")
      .select("name")
      .eq("id", activeShopId)
      .single();
    activeShopName = shop?.name ?? null;
  }

  return (
    <div>
      <p className="mb-4 text-neutral-600 dark:text-neutral-400">
        Você está autenticado. Esta rota está protegida pelo middleware.
      </p>
      {activeShopName && (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Barbearia ativa: <strong>{activeShopName}</strong>
        </p>
      )}
    </div>
  );
}
