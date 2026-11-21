"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Receipt } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Invoice = {
  id: string; number: string; amountCents: number; status: string; description: string;
  dueDate: string; paidAt: string | null; companyName: string; companySlug: string;
};

export function ChargesManager({ initial }: { initial: Invoice[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);

  async function markPaid(inv: Invoice) {
    setBusy(inv.id);
    try {
      const r = await fetch(`/api/admin/charges/${inv.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "MARK_PAID" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Erro");
      toast("Pagamento registrado");
      setItems((p) => p.map((x) => x.id === inv.id ? { ...x, status: "PAID", paidAt: new Date().toISOString() } : x));
      router.refresh();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setBusy(null); }
  }

  return (
    <div className="vixt-card overflow-hidden">
      {items.length === 0 ? <p className="p-10 text-center text-sm text-rose-100/45">Nenhuma cobrança.</p> : (
        <div className="divide-y divide-white/[0.05]">
          {items.map((i) => (
            <div key={i.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-400"><Receipt className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white">{i.companyName} <span className="font-normal text-rose-100/45">· {i.description}</span></p>
                <p className="font-mono text-xs text-rose-100/45">{i.number} · vence em {formatDate(i.dueDate)}</p>
              </div>
              <span className="font-semibold text-white">{formatCurrency(i.amountCents)}</span>
              <span className={cn("vixt-badge w-fit", i.status === "PAID" ? "bg-emerald-500/10 text-emerald-400" : i.status === "FAILED" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-champagne-400")}>
                {i.status === "PAID" ? "Pago" : i.status === "FAILED" ? "Falhou" : "Pendente"}
              </span>
              {i.status === "PENDING" && (
                <button onClick={() => markPaid(i)} disabled={busy === i.id} className="vixt-btn-ghost !py-2 text-xs">
                  {busy === i.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5" /> Registrar pagamento</>}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
