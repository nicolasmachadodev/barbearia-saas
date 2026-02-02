import { createClient } from "@/src/lib/supabase/server";
import { getActiveShopId } from "@/src/lib/shop";

type GetAvailableSlotsInput = {
  staffId: string;
  serviceId: string;
  date: string; // "YYYY-MM-DD"
  slotStepMin?: number; // default 15
  shopId?: string; // ✅ opcional (para booking público)
};

type Slot = {
  time: string; // "HH:MM"
};

const DEFAULT_STEP_MIN = 15;

// Constrói ISO com timezone -03:00 (America/Sao_Paulo) a partir de "YYYY-MM-DD" + "HH:MM"
function isoAtSaoPaulo(date: string, hhmm: string) {
  return `${date}T${hhmm}:00-03:00`;
}

function isoDayStart(date: string) {
  return `${date}T00:00:00-03:00`;
}

function isoDayEnd(date: string) {
  // próximo dia 00:00:00 (fim exclusivo)
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d)); // UTC midnight
  dt.setUTCDate(dt.getUTCDate() + 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}T00:00:00-03:00`;
}

function toMs(iso: string) {
  return new Date(iso).getTime();
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function minutesFromHHMM(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function hhmmFromMinutes(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${pad2(h)}:${pad2(m)}`;
}

// Recebe intervalos [startMin, endMin) e remove (subtrai) intervalos de bloqueio
function subtractIntervals(
  base: Array<[number, number]>,
  blocks: Array<[number, number]>
) {
  let result = base.slice();

  for (const [bStart, bEnd] of blocks) {
    const next: Array<[number, number]> = [];

    for (const [s, e] of result) {
      // sem overlap
      if (bEnd <= s || bStart >= e) {
        next.push([s, e]);
        continue;
      }

      // overlap: corta esquerda
      if (bStart > s) next.push([s, bStart]);
      // overlap: corta direita
      if (bEnd < e) next.push([bEnd, e]);
    }

    result = next;
  }

  // remove intervalos vazios/negativos
  return result.filter(([s, e]) => e > s);
}

export async function getAvailableSlots(input: GetAvailableSlotsInput): Promise<Slot[]> {
  const { staffId, serviceId } = input;
  const slotStepMin = input.slotStepMin ?? DEFAULT_STEP_MIN;

  if (!staffId) throw new Error("staffId é obrigatório.");
  if (!serviceId) throw new Error("serviceId é obrigatório.");
  if (!input.date) throw new Error("date é obrigatório (YYYY-MM-DD).");

  const supabase = await createClient();
  const shopId = input.shopId ?? (await getActiveShopId());
  if (!shopId) throw new Error("Barbearia ativa não encontrada.");


  // 1) Confirma que o staff pertence ao shop e existe
  const { data: staff, error: staffError } = await supabase
    .from("staff")
    .select("id")
    .eq("id", staffId)
    .eq("shop_id", shopId)
    .single();

  if (staffError || !staff) return [];

  // 2) Confirma que o serviço pertence ao shop e pega duração
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, duration_min, is_active")
    .eq("id", serviceId)
    .eq("shop_id", shopId)
    .single();

  if (serviceError || !service || !service.is_active) return [];
  const durationMin = Number(service.duration_min ?? 0);
  if (!durationMin || durationMin <= 0) return [];

  // 3) Confirma que esse staff faz esse serviço (pivot staff_services)
  const { data: link, error: linkError } = await supabase
    .from("staff_services")
    .select("staff_id, service_id")
    .eq("staff_id", staffId)
    .eq("service_id", serviceId)
    .maybeSingle();

  if (linkError || !link) return [];

  // 4) Descobre o dow da data no fuso -03
  // Como estamos fixando -03:00 nos ISO, vamos derivar o dow a partir do Date local do ISO
  const dayStartIso = isoDayStart(input.date);
  const dayStart = new Date(dayStartIso);
  const dow = dayStart.getDay(); // 0=domingo ... 6=sábado

  // 5) Pega as faixas semanais do staff para esse DOW
  const { data: weekly, error: weeklyError } = await supabase
    .from("staff_weekly_availability")
    .select("start_time, end_time")
    .eq("staff_id", staffId)
    .eq("shop_id", shopId)
    .eq("dow", dow)
    .order("start_time", { ascending: true });

  if (weeklyError || !weekly || weekly.length === 0) return [];

  // Converte faixas semanais (time) -> minutos no dia
  const baseIntervals: Array<[number, number]> = weekly.map((r: any) => {
    const start = String(r.start_time).slice(0, 5); // "HH:MM"
    const end = String(r.end_time).slice(0, 5);
    return [minutesFromHHMM(start), minutesFromHHMM(end)];
  });

  // 6) Pega time off que overlap o dia (fim > dayStart e início < dayEnd)
  const dayEndIso = isoDayEnd(input.date);

  const { data: timeOff, error: timeOffError } = await supabase
    .from("staff_time_off")
    .select("start_at, end_at")
    .eq("staff_id", staffId)
    .eq("shop_id", shopId)
    .gt("end_at", dayStartIso)
    .lt("start_at", dayEndIso)
    .order("start_at", { ascending: true });

  if (timeOffError) return [];

  const dayStartMs = toMs(dayStartIso);
  const dayEndMs = toMs(dayEndIso);

  // Converte timeOff -> intervalos em minutos dentro do dia
  const blockIntervals: Array<[number, number]> = (timeOff ?? []).map((r: any) => {
    const sMs = Math.max(toMs(r.start_at), dayStartMs);
    const eMs = Math.min(toMs(r.end_at), dayEndMs);
  
    const startMin = Math.floor((sMs - dayStartMs) / 60000);
    const endMin = Math.ceil((eMs - dayStartMs) / 60000);
  
    return [startMin, endMin];
  });
  
  // 6.1) Pega appointments confirmados que overlap o dia
  const { data: appts, error: apptError } = await supabase
    .from("appointments")
    .select("start_at, end_at, status")
    .eq("staff_id", staffId)
    .eq("shop_id", shopId)
    .neq("status", "cancelled")
    .gt("end_at", dayStartIso)
    .lt("start_at", dayEndIso)
    .order("start_at", { ascending: true });
  
  if (apptError) return [];
  
  const apptBlocks: Array<[number, number]> = (appts ?? []).map((r: any) => {
    const sMs = Math.max(toMs(r.start_at), dayStartMs);
    const eMs = Math.min(toMs(r.end_at), dayEndMs);
  
    const startMin = Math.floor((sMs - dayStartMs) / 60000);
    const endMin = Math.ceil((eMs - dayStartMs) / 60000);
  
    return [startMin, endMin];
  });
  
  // 7) Subtrai folgas + appointments das faixas base
  const availableIntervals = subtractIntervals(baseIntervals, [...blockIntervals, ...apptBlocks]);
  

  // 8) Gera slots (HH:MM) respeitando duração e step
  const slots: Slot[] = [];

  for (const [startMin, endMin] of availableIntervals) {
    // alinha para o step (ex: 15 em 15)
    const alignedStart = Math.ceil(startMin / slotStepMin) * slotStepMin;

    for (let t = alignedStart; t + durationMin <= endMin; t += slotStepMin) {
      slots.push({ time: hhmmFromMinutes(t) });
    }
  }

  return slots;
}
