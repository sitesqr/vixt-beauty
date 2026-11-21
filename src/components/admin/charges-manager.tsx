"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Receipt, QrCode } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Invoice = {
  id: string; number: string; amountCents: number; status: string; description: string;
  dueDate: string; paidAt: string | null; companyName: string; companySlug: string;
};

export function ChargesManager({ initial, asaasConfigured = false }: { initial: Invoice[]; asaasConfigured?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [pix, setPix] = useState<{ url?: string; copy?: string } | null>(null);

  async function chargeAsaas(inv: Invoice) {
    setBusy(inv.id);
    try {
      const r = await fetch(`/api/asaas/charge/${inv.id}`, { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Erro ao gerar cobrança");
      setPix({ url: j.data.invoiceUrl, copy: j.data.pixCopyPaste });
      toast("Cobrança PIX gerada no Asaas");
      router.refresh();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setBusy(null); }
  }

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
                <div className="flex flex-wrap gap-2">
                  {asaasConfigured && (
                    <button onClick={() => chargeAsaas(i)} disabled={busy === i.id} className="vixt-btn-champagne !py-2 text-xs">
                      {busy === i.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><QrCode className="h-3.5 w-3.5" /> Cobrar no Asaas</>}
                    </button>
                  )}
                  <button onClick={() => markPaid(i)} disabled={busy === i.id} className="vixt-btn-ghost !py-2 text-xs">
                    <Check className="h-3.5 w-3.5" /> Registrar manualmente
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pix && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setPix(null)}>
          <div className="vixt-card w-full max-w-md space-y-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="flex items-center gap-2 font-semibold text-white"><QrCode className="h-5 w-5 text-rose-400" /> Cobrança PIX gerada</h3>
            {pix.url && <a href={pix.url} target="_blank" rel="noreferrer" className="vixt-btn-primary w-full">Abrir cobrança no Asaas</a>}
            {pix.copy && (
              <div>
                <p className="vixt-label">PIX Copia e Cola</p>
                <textarea readOnly value={pix.copy} className="vixt-input h-24 resize-none text-xs" />
                <button onClick={() => { navigator.clipboard.writeText(pix.copy!); toast("PIX copiado"); }} className="vixt-btn-ghost mt-2 w-full">Copiar código PIX</button>
              </div>
            )}
            <button onClick={() => setPix(null)} className="vixt-btn-ghost w-full">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}
