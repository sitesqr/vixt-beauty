"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Clock, CalendarDays, Loader2, RefreshCw, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

type Appt = {
  id: string; startAt: string; endAt: string; status: string;
  serviceName: string; servicePriceCents: number; clientName: string;
  clientPhone: string | null; professionalName: string; notes: string | null;
  rescheduleRequestedAt: string | null;
};

const filters = [
  { key: "ALL", label: "Todos" },
  { key: "PENDING", label: "Pendentes" },
  { key: "CONFIRMED", label: "Confirmados" },
  { key: "COMPLETED", label: "Concluídos" },
  { key: "CANCELLED", label: "Cancelados" },
  { key: "RESCHEDULE_REQUESTED", label: "Remarcação" },
];

const statusStyle: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-champagne-400",
  CONFIRMED: "bg-emerald-500/10 text-emerald-400",
  COMPLETED: "bg-rose-500/10 text-rose-400",
  CANCELLED: "bg-red-500/10 text-red-400",
  NO_SHOW: "bg-red-500/10 text-red-400",
  RESCHEDULE_REQUESTED: "bg-violet-500/10 text-violet-400",
};
const statusLabel: Record<string, string> = {
  PENDING: "Pendente", CONFIRMED: "Confirmado", COMPLETED: "Concluído",
  CANCELLED: "Cancelado", NO_SHOW: "Não compareceu", RESCHEDULE_REQUESTED: "Remarcação",
};

export function AppointmentsManager({ initial }: { initial: Appt[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Erro");
      toast("Atualizado com sucesso");
      setItems((p) => p.map((a) => a.id === id ? { ...a, status: j.data.status, rescheduleRequestedAt: null } : a));
      router.refresh();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setBusy(null); }
  }

  const shown = filter === "ALL" ? items : items.filter((a) => a.status === filter);

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={cn("rounded-xl border px-3.5 py-2 text-xs font-medium transition", filter === f.key ? "border-rose-500 bg-rose-500/10 text-rose-300" : "border-white/10 text-rose-100/60 hover:text-white")}>
            {f.label}
            <span className="ml-1.5 opacity-60">{f.key === "ALL" ? items.length : items.filter((a) => a.status === f.key).length}</span>
          </button>
        ))}
      </div>

      <div className="vixt-card overflow-hidden">
        {shown.length === 0 ? (
          <div className="p-12 text-center text-rose-100/45"><CalendarDays className="mx-auto mb-3 h-8 w-8 opacity-40" />Nenhum agendamento neste filtro.</div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {shown.map((a) => (
              <div key={a.id} className="flex flex-col gap-4 p-4 transition hover:bg-white/[0.02] sm:flex-row sm:items-center">
                <div className="flex w-full items-center gap-3 sm:w-44 sm:shrink-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-400"><CalendarDays className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-semibold text-white">{formatDateTime(a.startAt)}</p>
                    <p className="text-[11px] text-rose-100/45">até {new Date(a.endAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{a.serviceName} <span className="font-normal text-rose-100/45">· {a.professionalName}</span></p>
                  <p className="text-xs text-rose-100/60">{a.clientName} {a.clientPhone && <span className="text-rose-100/40">· {a.clientPhone}</span>}</p>
                  {a.notes && <p className="mt-1 truncate text-[11px] text-rose-100/40">Obs: {a.notes}</p>}
                </div>
                <span className="font-semibold text-rose-300 sm:w-20 sm:text-right">{formatCurrency(a.servicePriceCents)}</span>
                <span className={cn("vixt-badge w-fit sm:w-28 sm:justify-center", statusStyle[a.status])}>{statusLabel[a.status] || a.status}</span>
                <div className="flex flex-wrap gap-1.5">
                  {busy === a.id ? <Loader2 className="h-5 w-5 animate-spin text-rose-400" /> : (
                    <>
                      {a.status === "PENDING" && <button onClick={() => act(a.id, "CONFIRM")} title="Confirmar" className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"><Check className="h-4 w-4" /></button>}
                      {["PENDING", "CONFIRMED", "RESCHEDULE_REQUESTED"].includes(a.status) && (
                        <>
                          <button onClick={() => act(a.id, "COMPLETE")} title="Concluir" className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"><Check className="h-4 w-4" /></button>
                          <button onClick={() => act(a.id, "CANCEL")} title="Cancelar" className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><X className="h-4 w-4" /></button>
                          <button onClick={() => act(a.id, "NO_SHOW")} title="Não compareceu" className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-rose-100/60 hover:bg-white/10"><EyeOff className="h-4 w-4" /></button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
