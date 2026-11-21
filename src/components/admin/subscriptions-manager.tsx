"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Ban, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Sub = {
  id: string; status: string; companyName: string; companySlug: string; planName: string;
  priceCents: number; currentPeriodEnd: string; trialEndsAt: string | null; cancelAtPeriodEnd: boolean;
};

const style: Record<string, string> = {
  TRIALING: "bg-amber-500/10 text-champagne-400", ACTIVE: "bg-emerald-500/10 text-emerald-400",
  PAST_DUE: "bg-orange-500/10 text-orange-400", CANCELLED: "bg-rose-100/45/10 text-rose-100/60", EXPIRED: "bg-red-500/10 text-red-400",
};
const label: Record<string, string> = { TRIALING: "Em teste", ACTIVE: "Ativa", PAST_DUE: "Inadimplente", CANCELLED: "Cancelada", EXPIRED: "Expirada" };

export function SubscriptionsManager({ initial }: { initial: Sub[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function change(s: Sub, patch: any) {
    setBusy(s.id);
    try {
      const r = await fetch(`/api/admin/subscriptions/${s.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Erro");
      toast("Assinatura atualizada");
      setItems((p) => p.map((x) => x.id === s.id ? { ...x, ...patch } : x));
      router.refresh();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setBusy(null); }
  }

  return (
    <div className="vixt-card overflow-hidden">
      <div className="divide-y divide-white/[0.05]">
        {items.map((s) => (
          <div key={s.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-400"><CreditCard className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-white">{s.companyName}</p>
              <p className="text-xs text-rose-100/45">{s.planName} · /b/{s.companySlug} · até {formatDate(s.currentPeriodEnd)}</p>
            </div>
            <span className="font-semibold text-rose-300">{formatCurrency(s.priceCents)}</span>
            <span className={cn("vixt-badge w-fit", style[s.status])}>{label[s.status] || s.status}</span>
            <div className="flex gap-2">
              {busy === s.id ? <Loader2 className="h-5 w-5 animate-spin text-rose-400" /> : (
                <>
                  {s.status !== "ACTIVE" && <button onClick={() => change(s, { status: "ACTIVE" })} title="Ativar" className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"><CheckCircle2 className="h-4 w-4" /></button>}
                  {s.status !== "CANCELLED" && <button onClick={() => change(s, { status: "CANCELLED" })} title="Cancelar" className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"><Ban className="h-4 w-4" /></button>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
