"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, X, RefreshCw, Star, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

type A = {
  id: string; startAt: string; endAt: string; status: string; serviceName: string;
  servicePriceCents: number; professionalName: string; professionalId: string;
  companyName: string; companySlug: string; companyId: string; alreadyReviewed: boolean;
  rescheduleRequestedAt: string | null;
};

const style: Record<string, string> = {
  CONFIRMED: "bg-emerald-500/10 text-emerald-400", PENDING: "bg-amber-500/10 text-champagne-400",
  COMPLETED: "bg-rose-500/10 text-rose-400", CANCELLED: "bg-red-500/10 text-red-400",
  NO_SHOW: "bg-red-500/10 text-red-400", RESCHEDULE_REQUESTED: "bg-violet-500/10 text-violet-400",
};
const label: Record<string, string> = { CONFIRMED: "Confirmado", PENDING: "Pendente", COMPLETED: "Concluído", CANCELLED: "Cancelado", NO_SHOW: "Não compareceu", RESCHEDULE_REQUESTED: "Remarcação solicitada" };

export function ClientAppointments({ initial }: { initial: A[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [rating, setRating] = useState<Record<string, number>>({});
  const [reviewOpen, setReviewOpen] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  async function act(a: A, action: string) {
    setBusy(a.id);
    try {
      const r = await fetch(`/api/appointments/${a.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Erro");
      toast(action === "CANCEL" ? "Agendamento cancelado" : "Solicitação enviada à salão");
      setItems((p) => p.map((x) => x.id === a.id ? { ...x, status: j.data.status, rescheduleRequestedAt: action === "REQUEST_RESCHEDULE" ? new Date().toISOString() : x.rescheduleRequestedAt } : x));
      router.refresh();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setBusy(null); }
  }

  async function submitReview(a: A) {
    if (!rating[a.id]) { toast("Escolha uma nota", "error"); return; }
    setBusy(a.id);
    try {
      const r = await fetch("/api/reviews", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: a.companyId, appointmentId: a.id, professionalId: a.professionalId, rating: rating[a.id], comment }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Erro");
      toast("Obrigado pela avaliação!");
      setItems((p) => p.map((x) => x.id === a.id ? { ...x, alreadyReviewed: true } : x));
      setReviewOpen(null);
      router.refresh();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-4">
      {items.length === 0 && <div className="vixt-card p-12 text-center text-rose-100/45"><CalendarDays className="mx-auto mb-3 h-8 w-8 opacity-40" />Você ainda não tem agendamentos.</div>}
      {items.map((a) => (
        <div key={a.id} className="vixt-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-400"><CalendarDays className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{a.serviceName}</p>
              <p className="text-xs text-rose-100/60">{a.companyName} · {a.professionalName}</p>
              <p className="mt-1 text-xs text-rose-300">{formatDateTime(a.startAt)}</p>
            </div>
            <span className="font-semibold text-white">{formatCurrency(a.servicePriceCents)}</span>
            <span className={cn("vixt-badge w-fit", style[a.status])}>{label[a.status] || a.status}</span>
            <div className="flex flex-wrap gap-2">
              {busy === a.id ? <Loader2 className="h-5 w-5 animate-spin text-rose-400" /> : (
                <>
                  {["CONFIRMED", "PENDING"].includes(a.status) && (
                    <>
                      <button onClick={() => act(a, "REQUEST_RESCHEDULE")} disabled={!!a.rescheduleRequestedAt} className="vixt-btn-ghost !py-2 text-xs disabled:opacity-40"><RefreshCw className="h-3.5 w-3.5" /> Remarcar</button>
                      <button onClick={() => act(a, "CANCEL")} className="vixt-btn-danger !py-2 text-xs"><X className="h-3.5 w-3.5" /> Cancelar</button>
                    </>
                  )}
                  {a.status === "COMPLETED" && !a.alreadyReviewed && (
                    <button onClick={() => setReviewOpen(reviewOpen === a.id ? null : a.id)} className="vixt-btn-primary !py-2 text-xs"><Star className="h-3.5 w-3.5" /> Avaliar</button>
                  )}
                  {a.alreadyReviewed && <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Avaliado</span>}
                </>
              )}
            </div>
          </div>

          {a.rescheduleRequestedAt && a.status === "RESCHEDULE_REQUESTED" && (
            <p className="mt-3 rounded-lg bg-violet-500/10 px-3 py-2 text-xs text-violet-300">Aguardando a salão confirmar a nova data e horário.</p>
          )}

          {reviewOpen === a.id && (
            <div className="mt-4 animate-fade-in border-t border-white/[0.06] pt-4">
              <p className="mb-2 text-sm text-rose-100">Como foi seu atendimento?</p>
              <div className="mb-3 flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => setRating({ ...rating, [a.id]: n })}><Star className={cn("h-7 w-7 transition", n <= (rating[a.id] || 0) ? "fill-champagne-400 text-champagne-400" : "text-rose-100/30")} /></button>)}
              </div>
              <textarea className="vixt-input min-h-[70px] resize-none" placeholder="Deixe um comentário (opcional)" value={comment} onChange={(e) => setComment(e.target.value)} />
              <button onClick={() => submitReview(a)} disabled={busy === a.id} className="vixt-btn-primary mt-3 !py-2 text-xs">Enviar avaliação</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
