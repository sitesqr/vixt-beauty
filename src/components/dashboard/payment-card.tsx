"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, QrCode, CreditCard, Copy, CheckCircle2, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/utils";

type PayResult = {
  method: "PIX" | "CREDIT_CARD";
  amountCents: number;
  invoiceNumber: string;
  pixCopyPaste?: string;
  pixQrCode?: string;
  invoiceUrl?: string;
  checkoutUrl?: string;
};

export function PaymentCard({ priceCents, pendingCount }: { priceCents: number; pendingCount: number }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<PayResult | null>(null);

  async function pay(method: "PIX" | "CREDIT_CARD") {
    setLoading(method);
    try {
      const r = await fetch("/api/billing/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Erro ao gerar pagamento");
      const data: PayResult = j.data;
      setResult(data);
      if (data.checkoutUrl) window.open(data.checkoutUrl, "_blank");
      router.refresh();
    } catch (e: any) {
      toast(e.message || "Erro ao gerar pagamento", "error");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="vixt-card mt-6 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-gradient-to-r from-champagne-500/[0.08] to-transparent px-6 py-4">
        <CreditCard className="h-5 w-5 text-champagne-400" />
        <div>
          <h3 className="font-semibold text-white">Pagar assinatura</h3>
          <p className="text-xs text-rose-100/45">Escolha como deseja pagar — valor {formatCurrency(priceCents)}</p>
        </div>
      </div>
      <div className="space-y-4 p-6">
        {pendingCount > 0 && (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3 text-xs text-amber-200">
            Você tem {pendingCount} fatura(s) pendente(s). Ao pagar, a mais recente será quitada.
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <button onClick={() => pay("PIX")} disabled={loading !== null} className="vixt-btn-champagne w-full">
            {loading === "PIX" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><QrCode className="h-4 w-4" /> Gerar PIX</>}
          </button>
          <button onClick={() => pay("CREDIT_CARD")} disabled={loading !== null} className="vixt-btn-primary w-full">
            {loading === "CREDIT_CARD" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CreditCard className="h-4 w-4" /> Cartão de crédito</>}
          </button>
        </div>

        {result?.method === "PIX" && (
          <div className="space-y-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-white"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> PIX gerado · {formatCurrency(result.amountCents)}</p>
            {result.pixQrCode && (
              <img src={`data:image/png;base64,${result.pixQrCode}`} alt="QR Code PIX" className="mx-auto h-44 w-44 rounded-lg bg-white p-2" />
            )}
            {result.pixCopyPaste && (
              <>
                <textarea readOnly value={result.pixCopyPaste} className="vixt-input h-20 resize-none text-xs" />
                <button onClick={() => { navigator.clipboard.writeText(result.pixCopyPaste!); toast("Código PIX copiado"); }} className="vixt-btn-ghost w-full !py-2 text-xs">
                  <Copy className="h-3.5 w-3.5" /> Copiar código PIX
                </button>
              </>
            )}
            {result.invoiceUrl && (
              <a href={result.invoiceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-xs text-rose-400 hover:text-rose-300">
                Abrir cobrança no Asaas <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <p className="text-center text-[11px] text-rose-100/40">Após o pagamento, sua assinatura é ativada automaticamente.</p>
          </div>
        )}

        {result?.method === "CREDIT_CARD" && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.05] p-4 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
            <p className="mt-2 text-sm font-semibold text-white">Checkout de cartão aberto</p>
            <p className="mt-1 text-xs text-rose-100/45">Conclua o pagamento na página segura do Asaas. Sua assinatura será ativada automaticamente.</p>
            {result.checkoutUrl && <a href={result.checkoutUrl} target="_blank" rel="noreferrer" className="vixt-btn-ghost mt-3 w-full !py-2 text-xs">Reabrir checkout</a>}
          </div>
        )}
      </div>
    </div>
  );
}
