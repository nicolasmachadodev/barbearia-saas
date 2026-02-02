"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Service = {
  id: string;
  name: string;
  duration_min: number;
  price_cents?: number;
};
type Staff = { id: string; name: string };
type Slot = { time: string };

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

function formatISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function maskBRPhone(value: string) {
  // mantém só números
  const digits = value.replace(/\D/g, "").slice(0, 11);

  // (11) 99999-9999
  const ddd = digits.slice(0, 2);
  const part1 = digits.slice(2, 7);
  const part2 = digits.slice(7, 11);

  if (digits.length <= 2) return digits.length ? `(${ddd}` : "";
  if (digits.length <= 7) return `(${ddd}) ${digits.slice(2)}`;
  return `(${ddd}) ${part1}-${part2}`;
}

function formatBRLFromCents(value?: number) {
  if (value === null || value === undefined) return null;
  return `R$ ${(value / 100).toFixed(2)}`;
}

export default function BookingClient({
  slug,
  shopName,
  services,
  staff,
  staffFiltered,
  initialServiceId,
  initialStaffId,
  initialDate,
  slots,
  ok,
  onCreateAppointment,
}: {
  slug: string;
  shopName: string;
  services: Service[];
  staff: Staff[];
  staffFiltered: Staff[];
  initialServiceId?: string;
  initialStaffId?: string;
  initialDate?: string;
  slots: Slot[];
  ok?: string;
  onCreateAppointment: (formData: FormData) => Promise<void>;
}) {
  // seleção (para UX melhor)
  const [serviceId, setServiceId] = useState(initialServiceId ?? "");
  const [staffId, setStaffId] = useState(initialStaffId ?? "");
  const [date, setDate] = useState(initialDate ?? "");

  // UI: combobox simples com busca
  const [serviceQuery, setServiceQuery] = useState("");
  const [staffQuery, setStaffQuery] = useState("");

  // UI: calendário painel
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const selectedDateObj = useMemo(() => {
    if (!date) return undefined;
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [date]);

  // UX “perfeita”: escolher slot e depois confirmar
  const [selectedTime, setSelectedTime] = useState<string>("");

  // erro de concorrência (horário reservado por outro no momento da confirmação)
  const [concurrencyError, setConcurrencyError] = useState<string | null>(null);
  
  // estado de loading no submit (evita double-click)
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // validação: nome do cliente
  const [customerName, setCustomerName] = useState("");

  const slotsCtaRef = useRef<HTMLAnchorElement | null>(null);

  // Limpa erro de concorrência quando slots mudam (nova consulta) ou quando confirma com sucesso
  useEffect(() => {
    setConcurrencyError(null);
  }, [serviceId, staffId, date, ok]);

  // estilos (mantém o tema dark que aplicamos)
  const card = "rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5";
  const label = "text-sm text-zinc-300";
  const hint = "text-xs text-zinc-500";
  const inputBase =
    "h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-600 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
  const btnPrimary =
    "h-10 rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-950 hover:opacity-90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
  const btnSecondary =
    "h-10 rounded-xl border border-zinc-800 bg-transparent px-4 text-sm text-zinc-200 hover:bg-zinc-900/50 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

  const servicesFiltered = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, serviceQuery]);

  const staffOptions = staffFiltered.length > 0 ? staffFiltered : staff;
  const staffFilteredByQuery = useMemo(() => {
    const q = staffQuery.trim().toLowerCase();
    if (!q) return staffOptions;
    return staffOptions.filter((s) => s.name.toLowerCase().includes(q));
  }, [staffOptions, staffQuery]);

  const slotGroups = useMemo(() => {
    const groups = { manha: [] as Slot[], tarde: [] as Slot[], noite: [] as Slot[] };

    for (const s of slots) {
      const h = Number(String(s.time).slice(0, 2));
      if (h < 12) groups.manha.push(s);
      else if (h < 18) groups.tarde.push(s);
      else groups.noite.push(s);
    }
    return groups;
  }, [slots]);


  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  const selectedStaff = useMemo(() => {
    const all = staffFiltered.length > 0 ? staffFiltered : staff;
    return all.find((s) => s.id === staffId);
  }, [staff, staffFiltered, staffId]);

  const okDetails = useMemo(() => {
    if (!ok) return null;
    if (typeof window === "undefined") return null;

    const qs = new URLSearchParams(window.location.search);
    return {
      serviceId: qs.get("serviceId") ?? "",
      staffId: qs.get("staffId") ?? "",
      date: qs.get("date") ?? "",
      time: qs.get("time") ?? "",
    };
  }, [ok]);

  const okServiceName = okDetails?.serviceId
    ? services.find((s) => s.id === okDetails.serviceId)?.name
    : selectedService?.name;

  const okServicePriceCents = okDetails?.serviceId
    ? services.find((s) => s.id === okDetails.serviceId)?.price_cents
    : selectedService?.price_cents;

  const okStaffName = okDetails?.staffId
    ? staff.find((s) => s.id === okDetails.staffId)?.name
    : selectedStaff?.name;

  const okDate = okDetails?.date || date;
  const okTime = okDetails?.time || selectedTime;




  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-48 bg-gradient-to-b from-zinc-900/60 to-transparent" />

      <div className="mx-auto max-w-md p-4 sm:p-6 space-y-4 relative">
        {/* HEADER / HERO */}
        {/* HEADER / HERO (destacado + sticky no mobile) */}
        <div className="sticky top-0 z-20 -mx-4 sm:mx-0">
          <div className="bg-zinc-950/85 backdrop-blur border-b border-zinc-900 sm:border-none sm:bg-transparent sm:backdrop-blur-0">
            <div className="px-4 sm:px-0 py-3 sm:py-0">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/40 via-transparent to-transparent" />
                <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-zinc-700/10 blur-3xl" />

                <div className="relative">
                  <div className="mb-3 inline-flex items-center rounded-full border border-zinc-700/60 bg-zinc-950/60 px-3 py-1 text-xs text-zinc-300">
                    Agendamento online
                  </div>

                  {/* ✅ Nome da barbearia (não parece path) */}
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
                    {shopName}
                  </h1>

                  <p className="mt-1 text-sm text-zinc-400">
                    Escolha seu corte, o barbeiro, o dia e o horário.
                  </p>

                  <div className="mt-3 inline-flex items-center gap-2 text-xs text-zinc-400">
                    <span className="rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1">
                      {slug}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span>Agendamento</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RESUMO (barra de estado) */}
        <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/60 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-500">
                <span>Resumo</span>
                <span
                  className={cx(
                    "inline-block h-2 w-2 rounded-full",
                    selectedTime ? "bg-emerald-400" : "bg-zinc-600"
                  )}
                />
              </div>
              <div className="mt-1 text-xs text-zinc-300 flex items-center gap-2 min-w-0">
                <span className="text-zinc-500 shrink-0">Corte:</span>
                <span className="text-zinc-100 truncate max-w-[160px] sm:max-w-[240px] inline-block">
                  {selectedService?.name ?? "—"}
                </span>
                {selectedService?.price_cents !== undefined ? (
                  <>
                    <span className="text-zinc-700 shrink-0">•</span>
                    <span className="text-zinc-300 shrink-0">
                      {formatBRLFromCents(selectedService.price_cents)}
                    </span>
                  </>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-zinc-300 flex items-center gap-2 min-w-0">
                <span className="text-zinc-500 shrink-0">Barbeiro:</span>
                <span className="text-zinc-100 truncate max-w-[160px] sm:max-w-[240px] inline-block">
                  {selectedStaff?.name ?? "—"}
                </span>
              </div>
              <div className="mt-1 text-xs text-zinc-300 flex items-center gap-2 min-w-0 whitespace-nowrap">
                <span className="text-zinc-500">Data:</span>
                <span className="text-zinc-100">{date || "—"}</span>
                <span className="text-zinc-700">•</span>
                <span className="text-zinc-500">Horário:</span>
                <span className="text-zinc-100">{selectedTime || "—"}</span>
              </div>
            </div>

            {selectedTime ? (
              <div className="shrink-0 rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-[11px] text-zinc-100">
                Pronto
              </div>
            ) : (
              <div className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1 text-[11px] text-zinc-400">
                Selecione um horário
              </div>
            )}
          </div>
        </div>

        {/* STEPPER */}
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-950/40 px-4 py-4">
          <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            {[
              { n: 1, label: "Corte", done: !!serviceId },
              { n: 2, label: "Barbeiro", done: !!staffId },
              { n: 3, label: "Dia", done: !!date },
              { n: 4, label: "Horário", done: !!selectedTime },
            ].map((s) => {
              const active =
                (s.n === 1 && !serviceId) ||
                (s.n === 2 && serviceId && !staffId) ||
                (s.n === 3 && serviceId && staffId && !date) ||
                (s.n === 4 && serviceId && staffId && date && !selectedTime);

              return (
                <div key={s.n} className="flex items-center gap-2">
                  <div
                    className={cx(
                      "h-7 w-7 rounded-full grid place-items-center border text-[12px] transition-all duration-300",
                      s.done
                        ? "border-zinc-600 bg-zinc-100 text-zinc-950"
                        : active
                          ? "border-zinc-600 bg-zinc-950/40 text-zinc-100 animate-pulse"
                          : "border-zinc-800 bg-zinc-950/20 text-zinc-500"
                    )}
                  >
                    {s.done ? "✓" : s.n}
                  </div>
                  <div
                    className={cx(
                      "whitespace-normal text-[12px]",
                      s.done ? "text-zinc-200" : active ? "text-zinc-100" : "text-zinc-500"
                    )}
                  >
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {ok ? (
          <div className={cx(card, "border-emerald-900/50")}>
            <div className="text-sm font-semibold text-emerald-300">
              Agendamento confirmado!
            </div>

            <div className="mt-3 text-sm text-zinc-200 space-y-1">
              <div>
                <span className="text-zinc-500">Serviço:</span>{" "}
                {okServiceName ?? "—"}
                {okServicePriceCents !== undefined ? (
                  <span className="text-zinc-400">
                    {" "}
                    • {formatBRLFromCents(okServicePriceCents)}
                  </span>
                ) : null}
              </div>
              <div>
                <span className="text-zinc-500">Profissional:</span>{" "}
                {okStaffName ?? "—"}
              </div>
              <div>
                <span className="text-zinc-500">Data:</span> {okDate || "—"}
              </div>
              <div>
                <span className="text-zinc-500">Horário:</span> {okTime || "—"}
              </div>
            </div>

            <p className="mt-4 text-sm text-zinc-400 text-center">
              ✓ Tudo certo! Seu horário está confirmado
            </p>
            <p className="mt-2 text-xs text-zinc-500 text-center">
              Te esperamos lá 😊
            </p>
          </div>
        ) : null}


        {!ok && concurrencyError ? (
          <div className={cx(card, "border-amber-900/50 bg-amber-950/20 transition-opacity duration-300")}>
            <div className="flex items-start gap-3">
              <span className="text-amber-400 text-lg shrink-0">⚠</span>
              <div>
                <p className="text-sm font-medium text-amber-200">{concurrencyError}</p>
                <p className="text-xs text-amber-300/70 mt-1">Escolha outro horário abaixo ↓</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* ETAPA 1: escolhas (UI bonita) */}
        <div className={cx(card, "space-y-4")}>
          {/* Serviço */}
          <div className="space-y-2">
            <div className={label}>Escolha seu corte</div>
            <input
              className={inputBase}
              placeholder="Buscar por nome..."
              value={serviceQuery}
              onChange={(e) => setServiceQuery(e.target.value)}
            />
            <div className="grid gap-2 max-h-44 overflow-auto pr-1">
              {servicesFiltered.map((s) => {
                const active = s.id === serviceId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setServiceId(s.id);
                      setSelectedTime("");
                      setConcurrencyError(null);
                    }}
                    className={cx(
                      "text-left rounded-xl border px-3 py-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-zinc-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                      active
                        ? "border-zinc-600 bg-zinc-900/70 ring-1 ring-zinc-600/40"
                        : "border-zinc-800 bg-zinc-950/30 hover:bg-zinc-900/50 hover:border-zinc-700 active:scale-[0.98]"
                    )}
                  >
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-zinc-400">
                      {s.duration_min} min
                      {s.price_cents !== undefined ? (
                        <> • {formatBRLFromCents(s.price_cents)}</>
                      ) : null}
                    </div>
                  </button>
                );
              })}
              {servicesFiltered.length === 0 ? (
                <div className="text-sm text-zinc-400">Nada encontrado. Tente outro termo.</div>
              ) : null}
            </div>
            {serviceId && staffFiltered.length > 0 && staffFiltered.length < staff.length && (
              <div className="text-xs text-emerald-400/80">
                ✓ Mostrando {staffFiltered.length} profissional(is) que faz(em) esse corte
              </div>
            )}
          </div>

          {/* Profissional */}
          <div className="space-y-2">
            <div className={label}>Com quem você quer cortar?</div>
            <input
              className={inputBase}
              placeholder="Buscar por nome..."
              value={staffQuery}
              onChange={(e) => setStaffQuery(e.target.value)}
            />
            <div className="grid gap-2 max-h-44 overflow-auto pr-1">
              {staffFilteredByQuery.map((p) => {
                const active = p.id === staffId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setStaffId(p.id);
                      setSelectedTime("");
                      setConcurrencyError(null);
                    }}
                    className={cx(
                      "text-left rounded-xl border px-3 py-2 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-zinc-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                      active
                        ? "border-zinc-600 bg-zinc-900/70 ring-1 ring-zinc-600/40"
                        : "border-zinc-800 bg-zinc-950/30 hover:bg-zinc-900/50 hover:border-zinc-700 active:scale-[0.98]"
                    )}
                  >
                    <div className="text-sm font-medium">{p.name}</div>
                  </button>
                );
              })}
              {staffFilteredByQuery.length === 0 ? (
                <div className="text-sm text-zinc-400">Nada encontrado. Tente outro nome.</div>
              ) : null}
            </div>
          </div>

          {/* Data com calendário */}
          <div className="space-y-2">
            <div className={label}>Qual dia fica melhor pra você?</div>

            <button
              type="button"
              className={cx(
                inputBase,
                "text-left flex items-center justify-between"
              )}
              onClick={() => setCalendarOpen((v) => !v)}
            >
              <span className={cx(!date && "text-zinc-500")}>
                {date ? date : "Clique para escolher"}
              </span>
              <span className="text-zinc-400 text-sm">▾</span>
            </button>

            {calendarOpen ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                <DayPicker
                  mode="single"
                  selected={selectedDateObj}
                  onSelect={(d) => {
                    if (!d) return;
                    setDate(formatISODate(d));
                    setCalendarOpen(false);
                    setSelectedTime("");
                    setConcurrencyError(null);
                    requestAnimationFrame(() => {
                      slotsCtaRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    });
                  }}
                  disabled={[
                    { dayOfWeek: [0] }, // domingo
                    { before: new Date() }, // dias passados
                  ]}
                  modifiersClassNames={{
                    disabled: "!text-rose-400/40 !opacity-40 line-through cursor-not-allowed",
                  }}
                  classNames={{
                    day: "hover:bg-zinc-800/50 transition-colors duration-200",
                    day_selected: "!bg-zinc-100 !text-zinc-950 font-semibold",
                  }}
                />
                  <div className="mt-2 space-y-1">
                  <div className="text-xs text-zinc-500">
                    Clique no dia que você quer ir
                  </div>
                  <div className="text-[11px] text-rose-400/60">
                    Dias em vermelho estão indisponíveis
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Botão “ver horários” (simula querystring, mas sem te obrigar a digitar data) */}
          <a
            className={cx(
              btnPrimary,
              "grid place-items-center h-11 text-base shadow-sm shadow-zinc-100/20 ring-1 ring-zinc-100/60 active:scale-[0.99] transition",
              !(serviceId && staffId && date) && "pointer-events-none opacity-50"
            )}
            ref={slotsCtaRef}
            href={`/b/${encodeURIComponent(slug)}?serviceId=${encodeURIComponent(
              serviceId
            )}&staffId=${encodeURIComponent(staffId)}&date=${encodeURIComponent(date)}`}
          >
            Ver horários
          </a>
          <div className="text-xs text-zinc-500 text-center">
            Vamos mostrar os horários que estão livres pra você
          </div>

          <a
            className={cx(
              btnSecondary,
              "grid place-items-center h-10 text-zinc-400 hover:text-zinc-200 active:scale-[0.98] transition"
            )}
            href={`/b/${encodeURIComponent(slug)}`}
          >
            Limpar
          </a>
        </div>

        {/* ETAPA 2: horários + dados do cliente */}
        {!ok && serviceId && staffId && date ? (
          <form
            className={cx(card, "space-y-4")}
            onSubmit={async (e) => {
              e.preventDefault();
              if (!customerName.trim()) return;
              
              setIsSubmitting(true);
              setConcurrencyError(null);
              const form = e.currentTarget;
              const formData = new FormData(form);
              
              try {
                await onCreateAppointment(formData);
              } catch {
                setSelectedTime("");
                setConcurrencyError(
                  "Este horário acabou de ser reservado."
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {/* inputs hidden pra action */}
            <input type="hidden" name="serviceId" value={serviceId} />
            <input type="hidden" name="staffId" value={staffId} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="time" value={selectedTime} />

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-zinc-300">Escolha o melhor horário</div>
                {selectedTime && (
                  <div className="text-xs text-zinc-500">Você escolheu: {selectedTime}</div>
                )}
              </div>

              {slots.length > 0 ? (
                <div className="space-y-4">
                  {[
                    { key: "manha", title: "Manhã", items: slotGroups.manha },
                    { key: "tarde", title: "Tarde", items: slotGroups.tarde },
                    { key: "noite", title: "Noite", items: slotGroups.noite },
                  ].map((g) =>
                    g.items.length ? (
                      <div key={g.key}>
                        <div className="mb-2 text-xs font-medium text-zinc-300">{g.title}</div>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {g.items.map((s) => {
                            const active = s.time === selectedTime;
                            return (
                              <button
                                key={s.time}
                                type="button"
                                onClick={() => {
                                  setSelectedTime(s.time);
                                  setConcurrencyError(null);
                                }}
                                className={cx(
                                  "h-10 rounded-xl border text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-zinc-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                                  active
                                    ? "border-zinc-500 bg-zinc-100 text-zinc-950 ring-2 ring-zinc-400/50 scale-105"
                                    : "border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900/60 hover:border-zinc-700 hover:scale-105 active:scale-95"
                                )}
                              >
                                <span className="inline-flex items-center gap-1">
                                  {active ? <span className="text-[10px]">✓</span> : null}
                                  <span>{s.time}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800/50 bg-zinc-950/20 p-6 text-center">
                  <div className="text-2xl mb-2">😔</div>
                  <p className="text-sm text-zinc-400 mb-3">
                    Ops, nenhum horário disponível neste dia.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDate("");
                      setSelectedTime("");
                      setConcurrencyError(null);
                    }}
                    className="inline-block text-xs text-zinc-500 hover:text-zinc-300 underline focus-visible:ring-2 focus-visible:ring-zinc-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    ← Tente outro dia
                  </button>
                </div>
              )}

            </div>

            <div className="grid gap-3">
              <div>
                <label htmlFor="customerName" className={label}>
                  Como você se chama? <span className="text-amber-400">*</span>
                </label>
                <input
                  id="customerName"
                  name="customerName"
                  className={inputBase}
                  placeholder="Ex: João Silva"
                  required
                  autoComplete="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value.trim())}
                  aria-label="Nome completo"
                />
              </div>

              <div>
                <label htmlFor="customerPhone" className={label}>
                  Qual seu telefone?
                </label>
                <input
                  id="customerPhone"
                  name="customerPhone"
                  className={inputBase}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(maskBRPhone(e.target.value))}
                  aria-label="Telefone com DDD"
                />
                <div className={hint}>Só pra gente te avisar se precisar.</div>
              </div>
            </div>

            <button
              type="submit"
              className={cx(
                btnPrimary,
                "w-full h-12 text-base font-semibold transition-all duration-200",
                isSubmitting && "opacity-75 cursor-wait"
              )}
              disabled={!selectedTime || slots.length === 0 || !customerName.trim() || isSubmitting}
              aria-label="Confirmar horário"
            >
              {isSubmitting ? "Confirmando…" : "Confirmar horário"}
            </button>

            {!customerName.trim() && (
              <div className="text-xs text-amber-400/80 text-center">
                Falta só o seu nome 😊
              </div>
            )}
          </form>
        ) : !ok ? (
          <div className={cx(card, "text-sm text-zinc-400 text-center")}>
            👆 Preencha as informações acima para ver os horários disponíveis
          </div>
        ) : null}

        <div className="pb-6 text-center text-xs text-zinc-600">
          Powered by • MVP
        </div>
      </div>
    </div>
  );
}
