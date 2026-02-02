import Link from "next/link";
import { createClient } from "@/src/lib/supabase/server";
import { createTestAppointment } from "./actions";
import { getActiveShopId } from "@/src/lib/shop";
import { getAvailableSlots } from "@/src/lib/booking/get-available-slots";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ serviceId?: string; date?: string }>;
}) {
  const { id: staffId } = await params;
  const { serviceId, date } = await searchParams;

  const activeShopId = await getActiveShopId();
  const supabase = await createClient();

  if (!activeShopId) {
    return (
      <div className="p-6">
        <p>Sem barbearia ativa.</p>
        <Link href="/app/onboarding">Ir para onboarding</Link>
      </div>
    );
  }

  // lista serviços ativos para escolher
  const { data: services } = await supabase
    .from("services")
    .select("id, name, duration_min")
    .eq("shop_id", activeShopId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const selectedService = (services ?? []).find((s: any) => s.id === serviceId);
  const durationMin = Number(selectedService?.duration_min ?? 0);

  let slots: { time: string }[] = [];
  let errorMsg: string | null = null;

  if (serviceId && date) {
    try {
      slots = await getAvailableSlots({
        staffId,
        serviceId,
        date,
        slotStepMin: 15,
      });
    } catch (e: any) {
      errorMsg = e?.message ?? "Erro ao calcular slots.";
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="space-y-2">
        <Link
          href={`/app/staff/${staffId}`}
          className="text-sm underline opacity-80"
        >
          ← Voltar
        </Link>
        <h1 className="text-xl font-semibold">Teste de horários disponíveis</h1>
        <p className="text-sm opacity-80">
          Escolha um serviço e uma data para ver os slots calculados.
        </p>
      </div>

      <form className="flex flex-col gap-3 max-w-md">
        <label className="text-sm">
          Serviço
          <select
            name="serviceId"
            defaultValue={serviceId ?? ""}
            className="mt-1 w-full border rounded p-2"
          >
            <option value="">Selecione...</option>
            {(services ?? []).map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration_min} min)
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Data
          <input
            type="date"
            name="date"
            defaultValue={date ?? ""}
            className="mt-1 w-full border rounded p-2"
          />
        </label>

        <button
          formAction={async (formData: FormData) => {
            "use server";
            const sid = String(formData.get("serviceId") ?? "");
            const d = String(formData.get("date") ?? "");
            // redireciona com querystring (sem JS client)
            const { redirect } = await import("next/navigation");
            redirect(
              `/app/staff/${staffId}/slots?serviceId=${encodeURIComponent(sid)}&date=${encodeURIComponent(d)}`,
            );
          }}
          className="border rounded p-2"
        >
          Calcular slots
        </button>
      </form>

      {errorMsg ? <p className="text-red-500">{errorMsg}</p> : null}

      {serviceId && date ? (
        <div className="border rounded p-4">
          <div className="text-sm opacity-80 mb-2">
            Resultado para <strong>{date}</strong>
          </div>

          {slots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <form
                  key={s.time}
                  action={async () => {
                    "use server";

                    // segurança mínima
                    if (!serviceId || !date) return;

                    await createTestAppointment({
                      staffId,
                      serviceId,
                      date,
                      time: s.time,
                      durationMin,
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="border rounded px-2 py-1 text-sm"
                  >
                    {s.time}
                  </button>
                </form>
              ))}
            </div>
          ) : (
            <p className="text-sm opacity-80">Nenhum horário disponível.</p>
          )}
        </div>
      ) : (
        <p className="text-sm opacity-80">
          Selecione um serviço e uma data, depois clique em “Calcular slots”.
        </p>
      )}
    </div>
  );
}
