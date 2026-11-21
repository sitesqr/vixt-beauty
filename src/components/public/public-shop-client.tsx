"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Scissors, User, Clock, Check, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";
import type { BookingService, BookingPro } from "@/components/booking/booking-widget";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function PublicShopClient({
  companyId,
  services,
  professionals,
}: {
  companyId: string;
  services: BookingService[];
  professionals: BookingPro[];
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState("");
  const [proId, setProId] = useState("");
  const [date, setDate] = useState(toISO(new Date()));
  const [week, setWeek] = useState(0);
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [guest, setGuest] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const service = services.find((s) => s.id === serviceId);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + week * 7 + i);
    return { iso: toISO(d), label: WEEKDAYS[d.getDay()], num: d.getDate() };
  });

  async function loadSlots(d: string, s: string, p: string) {
    setLoading(true);
    const r = await fetch(`/api/availability?companyId=${companyId}&professionalId=${p}&serviceId=${s}&date=${d}`);
    const j = await r.json();
    setSlots(j.success ? j.data : []);
    setLoading(false);
  }

  async function confirm() {
    if (!time) return;
    if (!guest.name || !guest.email || !guest.phone) {
      toast("Preencha seus dados", "error");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, serviceId, professionalId: proId, date, time, ...guest }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Erro ao agendar");
      setDone(true);
      toast("Horário reservado! Enviamos a confirmação.");
    } catch (e: any) {
      toast(e.message || "Erro ao agendar", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="vixt-card border-emerald-500/30 p-6 text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-400"><Check className="h-7 w-7" /></div>
        <h3 className="text-lg font-bold text-white">Horário reservado!</h3>
        <p className="mt-2 text-sm text-rose-100/60">
          {service?.name} em {date.split("-").reverse().join("/")} às {time}.
        </p>
        <p className="mt-3 text-xs text-rose-100/45">Criamos sua conta gratuita. Você pode acompanhar tudo em <Link className="text-rose-400" href="/cliente/agendamentos">Meus agendamentos</Link>.</p>
        <button onClick={() => { setDone(false); setStep(0); setTime(null); }} className="vixt-btn-ghost mt-5 w-full !py-2.5 text-xs">Novo agendamento</button>
      </div>
    );
  }

  return (
    <div className="vixt-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-rose-500/[0.06] px-5 py-4">
        <CalendarDays className="h-5 w-5 text-rose-400" />
        <h3 className="font-semibold text-white">Agendar horário</h3>
      </div>
      <div className="p-5">
        {/* step indicator */}
        <div className="mb-5 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => <div key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-rose-500" : "bg-white/10")} />)}
        </div>

        {step === 0 && (
          <div className="animate-fade-in">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-rose-100/45">Escolha o serviço</p>
            <div className="space-y-2">
              {services.map((s) => (
                <button key={s.id} onClick={() => { setServiceId(s.id); setStep(1); }} className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] p-3 text-left hover:border-rose-500/50">
                  <Scissors className="h-4 w-4 text-rose-400" />
                  <span className="flex-1 text-sm font-medium text-white">{s.name}</span>
                  <span className="text-sm font-semibold text-rose-300">{formatCurrency(s.priceCents)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-rose-100/45">Com qual profissional?</p>
            <div className="space-y-2">
              {professionals.map((p) => (
                <button key={p.id} onClick={() => { setProId(p.id); setStep(2); }} className="flex w-full items-center gap-3 rounded-xl border border-white/[0.07] p-3 text-left hover:border-rose-500/50">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-rose-500/15 text-xs font-bold text-rose-300">{p.name.charAt(0)}</span>
                  <span className="text-sm font-medium text-white">{p.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(0)} className="mt-4 text-xs text-rose-100/45 hover:text-white">← Voltar</button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-rose-100/45">Escolha a data</p>
            <div className="mb-3 flex justify-between">
              <button onClick={() => setWeek(Math.max(0, week - 1))} disabled={week === 0} className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-rose-100/60 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setWeek(week + 1)} className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 text-rose-100/60"><ChevronRight className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d) => (
                <button key={d.iso} onClick={() => { setDate(d.iso); loadSlots(d.iso, serviceId, proId); }} className={cn("flex flex-col items-center rounded-lg border py-2 text-xs", d.iso === date ? "border-rose-500 bg-rose-500/10 text-white" : "border-white/[0.07] text-rose-100/60")}>
                  <span className="text-[9px]">{d.label}</span><span className="font-bold">{d.num}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-rose-100/45">Horários</p>
              {loading ? (
                <div className="flex h-20 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-rose-400" /></div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {slots.map((s) => (
                    <button key={s.time} disabled={!s.available} onClick={() => setTime(s.time)} className={cn("rounded-lg border py-2 text-xs font-medium", !s.available ? "border-transparent bg-white/[0.02] text-rose-100/30 line-through" : s.time === time ? "border-rose-500 bg-rose-500 text-white" : "border-white/10 text-rose-50 hover:border-rose-500/50")}>{s.time}</button>
                  ))}
                  {slots.length === 0 && <p className="col-span-4 py-4 text-center text-xs text-rose-100/45">Sem horários nesta data</p>}
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setStep(1)} className="vixt-btn-ghost !py-2 flex-1 text-xs">Voltar</button>
              <button disabled={!time} onClick={() => setStep(3)} className="vixt-btn-primary !py-2 flex-1 text-xs">Continuar</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-rose-100/45">Seus dados</p>
            <div className="space-y-2.5">
              <input className="vixt-input !py-2.5" placeholder="Nome completo" value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
              <input className="vixt-input !py-2.5" type="email" placeholder="E-mail" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} />
              <input className="vixt-input !py-2.5" placeholder="WhatsApp" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} />
            </div>
            <div className="mt-4 rounded-xl bg-white/[0.03] p-3 text-xs text-rose-100/60">
              <div className="flex justify-between"><span>Serviço</span><span className="text-white">{service?.name}</span></div>
              <div className="mt-1.5 flex justify-between"><span>Data</span><span className="text-white">{date.split("-").reverse().join("/")} às {time}</span></div>
              <div className="mt-1.5 flex justify-between"><span>Valor</span><span className="font-semibold text-rose-300">{service ? formatCurrency(service.priceCents) : ""}</span></div>
            </div>
            <p className="mt-2 text-[10px] text-rose-100/40">Ao confirmar, criamos sua conta gratuita automaticamente.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setStep(2)} className="vixt-btn-ghost !py-2 flex-1 text-xs">Voltar</button>
              <button onClick={confirm} disabled={submitting} className="vixt-btn-primary !py-2 flex-1 text-xs">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
