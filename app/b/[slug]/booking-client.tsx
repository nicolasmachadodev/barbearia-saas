"use client";

import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Service = { id: string; name: string; duration_min: number };
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

  // estilos (mantém o tema dark que aplicamos)
  const card = "rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5";
  const label = "text-sm text-zinc-300";
  const hint = "text-xs text-zinc-500";
  const inputBase =
    "h-10 w-full rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 text-sm text-zinc-100 outline-none focus:border-zinc-600";
  const btnPrimary =
    "h-10 rounded-xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-950 hover:opacity-90 disabled:opacity-50";
  const btnSecondary =
    "h-10 rounded-xl border border-zinc-800 bg-transparent px-4 text-sm text-zinc-200 hover:bg-zinc-900/50 disabled:opacity-50";

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

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId),
    [services, serviceId]
  );

  const selectedStaff = useMemo(() => {
    const all = staffFiltered.length > 0 ? staffFiltered : staff;
    return all.find((s) => s.id === staffId);
  }, [staff, staffFiltered, staffId]);


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
                    Escolha serviço, profissional, data e horário.
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

        {/* RESUMO VIVO */}
        <div className={cx(card, "flex items-center justify-between gap-3")}>
          <div className="flex min-w-0 flex-col gap-1 text-xs text-zinc-400">
            <div className="font-medium text-zinc-200">Resumo</div>

            <div className="flex min-w-0 items-center gap-2">
              <span className="text-zinc-500">Serviço:</span>
              <span className="truncate whitespace-nowrap text-zinc-200 max-w-[140px]">
                {selectedService?.name ?? "—"}
              </span>

              <span className="text-zinc-700">•</span>

              <span className="text-zinc-500">Profissional:</span>
              <span className="truncate whitespace-nowrap text-zinc-200 max-w-[120px]">
                {selectedStaff?.name ?? "—"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Data:</span>
              <span className="whitespace-nowrap text-zinc-200">
                {date || "—"}
              </span>

              <span className="text-zinc-700">•</span>

              <span className="text-zinc-500">Horário:</span>
              <span className="whitespace-nowrap text-zinc-200">
                {selectedTime || "—"}
              </span>
            </div>
          </div>

          {selectedTime ? (
            <div className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-200">
              Pronto
            </div>
          ) : (
            <div className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1 text-xs text-zinc-400">
              Selecione um horário
            </div>
          )}
        </div>



        {ok ? (
          <div className={cx(card, "border-emerald-900/50")}>
            <div className="text-sm font-semibold text-emerald-300">
              Agendamento confirmado!
            </div>
            <p className="mt-1 text-sm text-zinc-400">
              Você já pode fechar essa página.
            </p>
          </div>
        ) : null}

        {concurrencyError ? (
          <div className={cx(card, "border-amber-900/50 bg-amber-950/20")}>
            <p className="text-sm text-amber-200">{concurrencyError}</p>
          </div>
        ) : null}

        {/* ETAPA 1: escolhas (UI bonita) */}
        <div className={cx(card, "space-y-4")}>
          {/* Serviço */}
          <div className="space-y-2">
            <div className={label}>Serviço</div>
            <input
              className={inputBase}
              placeholder="Buscar serviço..."
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
                      "text-left rounded-xl border px-3 py-2",
                      active
                        ? "border-zinc-600 bg-zinc-900/70"
                        : "border-zinc-800 bg-zinc-950/30 hover:bg-zinc-900/50"
                    )}
                  >
                    <div className="text-sm font-medium">{s.name}</div>
                    <div className="text-xs text-zinc-400">{s.duration_min} min</div>
                  </button>
                );
              })}
              {servicesFiltered.length === 0 ? (
                <div className="text-sm text-zinc-400">Nenhum serviço encontrado.</div>
              ) : null}
            </div>
            <div className={hint}>
              Dica: ao selecionar o serviço, a lista de profissionais pode filtrar.
            </div>
          </div>

          {/* Profissional */}
          <div className="space-y-2">
            <div className={label}>Profissional</div>
            <input
              className={inputBase}
              placeholder="Buscar profissional..."
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
                      "text-left rounded-xl border px-3 py-2",
                      active
                        ? "border-zinc-600 bg-zinc-900/70"
                        : "border-zinc-800 bg-zinc-950/30 hover:bg-zinc-900/50"
                    )}
                  >
                    <div className="text-sm font-medium">{p.name}</div>
                  </button>
                );
              })}
              {staffFilteredByQuery.length === 0 ? (
                <div className="text-sm text-zinc-400">Nenhum profissional encontrado.</div>
              ) : null}
            </div>
          </div>

          {/* Data com calendário */}
          <div className="space-y-2">
            <div className={label}>Data</div>

            <button
              type="button"
              className={cx(
                inputBase,
                "text-left flex items-center justify-between"
              )}
              onClick={() => setCalendarOpen((v) => !v)}
            >
              <span className={cx(!date && "text-zinc-500")}>
                {date ? date : "Escolher no calendário"}
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
                  }}
                />
                <div className="mt-2 text-xs text-zinc-500">
                  Clique em um dia para selecionar.
                </div>
              </div>
            ) : null}
          </div>

          {/* Botão “ver horários” (simula querystring, mas sem te obrigar a digitar data) */}
          <a
            className={cx(
              btnPrimary,
              "grid place-items-center",
              !(serviceId && staffId && date) && "pointer-events-none opacity-50"
            )}
            href={`/b/${encodeURIComponent(slug)}?serviceId=${encodeURIComponent(
              serviceId
            )}&staffId=${encodeURIComponent(staffId)}&date=${encodeURIComponent(date)}`}
          >
            Ver horários
          </a>

          <a
            className={cx(btnSecondary, "grid place-items-center")}
            href={`/b/${encodeURIComponent(slug)}`}
          >
            Limpar
          </a>
        </div>

        {/* ETAPA 2: horários + dados do cliente */}
        {serviceId && staffId && date ? (
          <form
            className={cx(card, "space-y-4")}
            onSubmit={async (e) => {
              e.preventDefault();
              setConcurrencyError(null);
              const form = e.currentTarget;
              const formData = new FormData(form);
              try {
                await onCreateAppointment(formData);
              } catch {
                setConcurrencyError(
                  "Este horário acabou de ser reservado por outra pessoa. Por favor, escolha outro."
                );
              }
            }}
          >
            {/* inputs hidden pra action */}
            <input type="hidden" name="serviceId" value={serviceId} />
            <input type="hidden" name="staffId" value={staffId} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="time" value={selectedTime} />

            <div>
              <div className="text-sm text-zinc-300 mb-2">Horários disponíveis</div>

              {slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => {
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
                          "h-10 rounded-xl border text-sm",
                          active
                            ? "border-zinc-500 bg-zinc-100 text-zinc-950"
                            : "border-zinc-800 bg-zinc-950/40 text-zinc-100 hover:bg-zinc-900/60 hover:border-zinc-700"
                        )}
                      >
                        {s.time}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-zinc-400">Nenhum horário disponível.</div>
              )}
            </div>

            <div className="grid gap-3">
              <div>
                <div className={label}>Seu nome</div>
                <input name="customerName" className={inputBase} placeholder="Ex: João" />
              </div>

              <div>
                <div className={label}>Seu telefone</div>

                <input
                  name="customerPhone"
                  className={inputBase}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(maskBRPhone(e.target.value))}
                />

                <div className={hint}>Opcional, mas recomendado para confirmação.</div>
              </div>
            </div>

            <button
              type="submit"
              className={cx(btnPrimary, "w-full")}
              disabled={!selectedTime || slots.length === 0}
            >
              Confirmar agendamento
            </button>

            <div className="text-xs text-zinc-500 text-center">
              Você escolhe o horário e depois confirma (menos erro, mais confiança).
            </div>
          </form>
        ) : (
          <div className={cx(card, "text-sm text-zinc-400")}>
            Selecione serviço, profissional e data para ver os horários.
          </div>
        )}

        <div className="pb-6 text-center text-xs text-zinc-600">
          Powered by • MVP
        </div>
      </div>
    </div>
  );
}
