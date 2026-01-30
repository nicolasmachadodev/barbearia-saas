"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setActiveShop } from "./actions";

type Shop = { id: string; name: string; slug: string };

export function AppHeader({
  userEmail,
  shops,
  activeShopId,
}: {
  userEmail: string;
  shops: Shop[];
  activeShopId: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    if (shops.length === 1 && !activeShopId) {
      setActiveShop(shops[0].id).then(() => router.refresh());
    }
  }, [shops, activeShopId, router]);

  async function handleShopChange(shopId: string) {
    await setActiveShop(shopId);
    router.refresh();
  }

  const showSelector = shops.length > 1;

  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Área do app</h1>
        {showSelector && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">
              Barbearia:
            </span>
            <select
              value={activeShopId ?? ""}
              onChange={(e) => handleShopChange(e.target.value)}
              className="rounded border border-neutral-300 bg-white px-2 py-1.5 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            >
              {!activeShopId && <option value="">Selecione</option>}
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {userEmail}
        </span>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  );
}
