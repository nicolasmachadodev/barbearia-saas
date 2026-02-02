import Link from "next/link";
import AvailabilityForm from "./availability-form";
import { deleteWeeklyAvailability } from "./actions";
import { createClient } from "@/src/lib/supabase/server";

const DOW_LABEL: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ IMPORTANTE: no seu projeto params é Promise (igual em app/app/staff/[id]/page.tsx)
  const { id: staffId } = await params;

  const supabase = await createClient();

  // Buscar profissional
  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("id, name")
    .eq("id", staffId)
    .single();

  if (staffError || !staff) {
    return (
      <div style={{ padding: 16 }}>
        <p>Erro ao carregar profissional: {staffError?.message ?? "Não encontrado"}</p>
        <Link href="/app/staff">Voltar</Link>
      </div>
    );
  }

  // Buscar disponibilidade semanal
  const { data: rows, error: rowsError } = await supabase
    .from("staff_weekly_availability")
    .select("id, dow, start_time, end_time")
    .eq("staff_id", staffId)
    .order("dow", { ascending: true })
    .order("start_time", { ascending: true });

  if (rowsError) {
    return (
      <div style={{ padding: 16 }}>
        <p>Erro ao carregar disponibilidade: {rowsError.message}</p>
        <Link href={`/app/staff/${staffId}`}>Voltar</Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <div>
        <Link href={`/app/staff/${staffId}`}>← Voltar</Link>
        <h1>Disponibilidade semanal</h1>
        <p>
          Profissional: <strong>{staff.name}</strong>
        </p>
      </div>

      <AvailabilityForm staffId={staffId} />

      <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}>
        <h3>Faixas cadastradas</h3>

        {rows && rows.length > 0 ? (
          <ul style={{ paddingLeft: 18, display: "grid", gap: 8 }}>
            {rows.map((r: any) => (
              <li key={r.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ minWidth: 120 }}>
                  <strong>{DOW_LABEL[r.dow]}</strong>
                </span>

                <span>
                  {String(r.start_time).slice(0, 5)}–{String(r.end_time).slice(0, 5)}
                </span>

                <form
                  action={async () => {
                    "use server";
                    await deleteWeeklyAvailability({
                      staffId,
                      availabilityId: r.id,
                    });
                  }}
                  style={{ marginLeft: "auto" }}
                >
                  <button type="submit">Remover</button>
                </form>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma faixa cadastrada ainda.</p>
        )}
      </div>
    </div>
  );
}
