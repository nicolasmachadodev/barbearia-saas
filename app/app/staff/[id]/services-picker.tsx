"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleStaffService } from "../actions";

type Service = {
  id: string;
  name: string;
  duration_min: number;
  price_cents: number;
};

export default function ServicesPicker({
  staffId,
  services,
  selectedServiceIds,
}: {
  staffId: string;
  services: Service[];
  selectedServiceIds: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // estado local (fonte da verdade do checkbox)
  const [selected, setSelected] = useState<string[]>(selectedServiceIds);

  // se o server mandar uma lista nova (por refresh), sincroniza
  useEffect(() => {
    setSelected(selectedServiceIds);
  }, [selectedServiceIds]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function setChecked(serviceId: string, checked: boolean) {
    setSelected((prev) => {
      const has = prev.includes(serviceId);
      if (checked) return has ? prev : [...prev, serviceId];
      return has ? prev.filter((x) => x !== serviceId) : prev;
    });
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Serviços que este profissional faz</h2>

      <div className="space-y-2">
        {services.map((s) => {
          const checked = selectedSet.has(s.id);

          return (
            <label key={s.id} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={checked}
                disabled={isPending} // ✅ trava enquanto salva (remove spam)
                onChange={(e) => {
                  const next = e.target.checked;

                  // ✅ atualiza na hora (optimistic)
                  setChecked(s.id, next);

                  startTransition(async () => {
                    try {
                      await toggleStaffService(staffId, s.id, next);

                      // ✅ mantém UI consistente com server
                      router.refresh();
                    } catch (err) {
                      // ✅ rollback se falhar
                      setChecked(s.id, !next);
                      console.error(err);
                      alert("Falhou ao salvar. Veja o console/terminal.");
                    }
                  });
                }}
              />

              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-sm opacity-80">
                  {s.duration_min} min • R$ {(s.price_cents / 100).toFixed(2)}
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
