"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet, Save, Webhook, RefreshCw, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Overview = {
  configured: boolean;
  environment: string;
  walletId: string | null;
  balance: number | null;
  localCharges: number;
  localTotalCents: number;
  events: number;
  asaasPayments: Array<{
    id: string; status: string; value: number; netValue?: number;
    billingType: string; dueDate: string; invoiceUrl?: string;
  }>;
};

type Config = {
  apiKey: string; environment: string; walletId: string | null;
  webhookToken: string | null; active: boolean;
};

export function AsaasManager({ overview, config }: { overview: Overview; config: Config | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    apiKey: config?.apiKey || "",
    environment: config?.environment || "sandbox",
    walletId: config?.walletId || "",
    webhookToken: config?.webhookToken || "",
    active: config?.active ?? true,
  });
  const [busy, setBusy] = useState<string | null>(null);

  async function save() {
    setBusy("save");
    try {
      const r = await fetch("/api/admin/asaas/config", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Erro ao salvar");
      toast("Configuração salva");
      router.refresh();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setBusy(null); }
  }

  async function setupWebhook() {
    setBusy("webhook");
    try {
      const r = await fetch("/api/admin/asaas/webhook", { method: "POST" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Erro ao configurar webhook");
      toast("Webhook configurado no Asaas");
    } catch (e: any) { toast(e.message, "error"); }
    finally { setBusy(null); }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
      {/* Configuração */}
      <div className="vixt-card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-white"><Wallet className="h-4 w-4 text-rose-400" /> Configuração da carteira</h2>
        <p className="mt-1 text-xs text-rose-100/45">Credenciais da sua conta Asaas.</p>
        <div className="mt-5 space-y-4">
          <div>
            <label className="vixt-label">Ambiente</label>
            <select className="vixt-input" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
              <option value="sandbox">Sandbox (testes)</option>
              <option value="production">Produção</option>
            </select>
          </div>
          <div>
            <label className="vixt-label">API Key</label>
            <input type="password" className="vixt-input" placeholder="Chave de API do Asaas" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
            {config?.apiKey && <p className="mt-1 text-[11px] text-rose-100/35">Atual: {config.apiKey} (deixe em branco para manter)</p>}
          </div>
          <div>
            <label className="vixt-label">Wallet ID (opcional)</label>
            <input className="vixt-input" placeholder="ID da carteira" value={form.walletId} onChange={(e) => setForm({ ...form, walletId: e.target.value })} />
          </div>
          <div>
            <label className="vixt-label">Webhook Token (opcional)</label>
            <input type="password" className="vixt-input" placeholder="Token de segurança do webhook" value={form.webhookToken} onChange={(e) => setForm({ ...form, webhookToken: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-rose-50/80">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-rose-500" /> Integração ativa
          </label>
          <button onClick={save} disabled={busy === "save"} className="vixt-btn-primary w-full">
            {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar configuração</>}
          </button>
          <button onClick={setupWebhook} disabled={busy === "webhook" || !overview.configured} className="vixt-btn-ghost w-full">
            {busy === "webhook" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Webhook className="h-4 w-4" /> Configurar webhook no Asaas</>}
          </button>
        </div>
      </div>

      {/* Visão geral */}
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="vixt-card p-5">
            <p className="text-[11px] text-rose-100/50">Saldo da carteira</p>
            <p className="mt-2 text-2xl font-bold text-white">{overview.balance === null ? "—" : formatCurrency(Math.round(overview.balance * 100))}</p>
            <p className="mt-1 text-[11px] text-rose-100/40">atualizado pelo Asaas</p>
          </div>
          <div className="vixt-card p-5">
            <p className="text-[11px] text-rose-100/50">Cobranças locais</p>
            <p className="mt-2 text-2xl font-bold text-white">{overview.localCharges}</p>
            <p className="mt-1 text-[11px] text-rose-100/40">{formatCurrency(overview.localTotalCents)} emitidas</p>
          </div>
          <div className="vixt-card p-5">
            <p className="text-[11px] text-rose-100/50">Status</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
              {overview.configured ? <><CheckCircle2 className="h-5 w-5 text-emerald-400" /> Conectado</> : "Não configurado"}
            </p>
            <p className="mt-1 text-[11px] text-rose-100/40">ambiente {overview.environment}</p>
          </div>
        </div>

        <div className="vixt-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <h2 className="font-semibold text-white">Cobranças no Asaas</h2>
            <button onClick={() => router.refresh()} className="text-rose-400 hover:text-rose-300"><RefreshCw className="h-4 w-4" /></button>
          </div>
          {overview.asaasPayments.length === 0 ? (
            <p className="p-10 text-center text-sm text-rose-100/45">Nenhuma cobrança no Asaas ainda.</p>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {overview.asaasPayments.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-4 text-sm">
                  <span className={cn("vixt-badge", p.status === "RECEIVED" || p.status === "CONFIRMED" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-champagne-400")}>{p.status}</span>
                  <span className="flex-1 text-rose-50/80">{p.billingType} · vence {formatDate(p.dueDate)}</span>
                  <span className="font-semibold text-white">{formatCurrency(Math.round(p.value * 100))}</span>
                  {p.invoiceUrl && <a href={p.invoiceUrl} target="_blank" rel="noreferrer" className="text-rose-400 hover:text-rose-300">Abrir</a>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
