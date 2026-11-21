"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Loader2, Clock, Scissors, User, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";

export type BookingService = { id: string; name: string; durationMin: number; priceCents: number };
export type BookingPro = { id: string; name: string };

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function BookingWidget({
  companyId,
  services,
  professionals,
  mode = "public",
  onBooked,
}: {
  companyId: string;
  services: BookingService[];
  professionals: BookingPro[];
  mode?: "owner" | "client" | "public";
  onBooked?: () => void;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id || "");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(toISO(new Date()));
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [guest, setGuest] = useState({ name: "", email: "", phone: "" });
  const [showGuest, setShowGuest] = useState(mode === "public");

  const service = services.find((s) => s.id === serviceId);

  const days = useMemo(() => {
    const base = new Date();
    base.setDate(base.getDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return { iso: toISO(d), day: WEEKDAYS[d.getDay()], num: d.getDate(), month: d.getMonth() + 1 };
    });
  }, [weekOffset]);

  useEffect(() => {
    if (!serviceId || !professionalId || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    fetch(`/api/availability?companyId=${companyId}&professionalId=${professionalId}&serviceId=${serviceId}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((j) => setSlots(j.success ? j.data : []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [companyId, professionalId, serviceId, selectedDate]);

  async function confirm() {
    if (!selectedTime) return;
    if (showGuest && (!guest.name || !guest.email || !guest.phone)) {
      toast("Preencha seus dados para confirmar", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId, professionalId, serviceId,
          date: selectedDate, time: selectedTime,
          guestName: guest.name, guestEmail: guest.email, guestPhone: guest.phone,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Erro ao agendar");
      toast("Agendamento confirmado com sucesso!");
      setSelectedTime(null);
      onBooked?.();
      router.refresh();
      // reload slots
      const r = await fetch(`/api/availability?companyId=${companyId}&professionalId=${professionalId}&serviceId=${serviceId}&date=${selectedDate}`);
      const jj = await r.json();
      if (jj.success) setSlots(jj.data);
    } catch (err: any) {
      toast(err.message || "Erro ao agendar", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <div className="space-y-5">
        <div className="vixt-card p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-rose-100/45">1. Serviço</p>
          <div className="space-y-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                  s.id === serviceId ? "border-rose-500/50 bg-rose-500/[0.08]" : "border-white/[0.06] hover:border-white/15"
                )}
              >
                <Scissors className={cn("h-4 w-4 shrink-0", s.id === serviceId ? "text-rose-400" : "text-rose-100/45")} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{s.name}</span>
                  <span className="text-[11px] text-rose-100/45">{s.durationMin} min</span>
                </span>
                <span className="text-sm font-semibold text-rose-300">{formatCurrency(s.priceCents)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="vixt-card p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-rose-100/45">2. Profissional</p>
          <div className="space-y-2">
            {professionals.map((p) => (
              <button
                key={p.id}
                onClick={() => setProfessionalId(p.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                  p.id === professionalId ? "border-rose-500/50 bg-rose-500/[0.08]" : "border-white/[0.06] hover:border-white/15"
                )}
              >
                <span className={cn("grid h-8 w-8 place-items-center rounded-full text-xs font-bold", p.id === professionalId ? "bg-rose-500/20 text-rose-300" : "bg-white/5 text-rose-100/60")}>
                  {p.name.charAt(0)}
                </span>
                <span className="text-sm font-medium text-white">{p.name}</span>
                {p.id === professionalId && <Check className="ml-auto h-4 w-4 text-rose-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="vixt-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-100/45">3. Data e horário</p>
            <div className="flex gap-1">
              <button
                onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                disabled={weekOffset === 0}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-rose-100/60 disabled:opacity-30 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-rose-100/60 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {days.map((d) => (
              <button
                key={d.iso}
                onClick={() => setSelectedDate(d.iso)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border py-3 transition",
                  d.iso === selectedDate
                    ? "border-rose-500 bg-rose-500/10 text-white"
                    : "border-white/[0.06] text-rose-100/60 hover:border-white/15"
                )}
              >
                <span className="text-[10px] uppercase">{d.day}</span>
                <span className="text-lg font-bold">{d.num}</span>
                <span className="text-[10px]">{d.month}/{String(d.num % 100).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="vixt-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-100/45">Horários disponíveis</p>
            {service && <span className="flex items-center gap-1 text-[11px] text-rose-100/45"><Clock className="h-3 w-3" /> {service.durationMin} min</span>}
          </div>
          {loadingSlots ? (
            <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-rose-400" /></div>
          ) : slots.length === 0 ? (
            <p className="py-10 text-center text-sm text-rose-100/45">Nenhum horário disponível nesta data.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
              {slots.map((s) => (
                <button
                  key={s.time}
                  disabled={!s.available}
                  onClick={() => setSelectedTime(s.time)}
                  className={cn(
                    "rounded-lg border py-2.5 text-sm font-medium transition",
                    !s.available
                      ? "cursor-not-allowed border-white/[0.03] bg-white/[0.01] text-rose-100/30 line-through"
                      : s.time === selectedTime
                        ? "border-rose-500 bg-rose-500 text-white"
                        : "border-white/10 bg-white/[0.03] text-rose-50 hover:border-rose-500/50"
                  )}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedTime && (
          <div className="animate-fade-in vixt-card border-rose-500/30 p-5">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-xs text-rose-100/45">Resumo do agendamento</p>
                <p className="mt-1 font-semibold text-white">{service?.name}</p>
                <p className="text-xs text-rose-100/60">
                  {selectedDate.split("-").reverse().join("/")} às {selectedTime} · {professionals.find((p) => p.id === professionalId)?.name}
                </p>
              </div>
              <span className="text-xl font-bold text-rose-300">{service ? formatCurrency(service.priceCents) : ""}</span>
            </div>

            {mode === "public" && showGuest && (
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <input className="vixt-input !py-2.5" placeholder="Seu nome" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
                <input className="vixt-input !py-2.5" type="email" placeholder="Seu e-mail" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} />
                <input className="vixt-input !py-2.5" placeholder="WhatsApp" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} />
                <p className="sm:col-span-3 text-[11px] text-rose-100/45">
                  Ao agendar, criamos sua conta gratuita automaticamente. Sem assinatura ou taxas.
                </p>
              </div>
            )}

            <button onClick={confirm} disabled={submitting} className="vixt-btn-primary w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Confirmar agendamento</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
