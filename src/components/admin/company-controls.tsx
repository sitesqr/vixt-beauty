"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Ban, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const statuses = ["TRIAL", "ACTIVE", "PAST_DUE", "SUSPENDED", "CANCELLED"];
const labels: Record<string, string> = { TRIAL: "Em teste", ACTIVE: "Ativa", PAST_DUE: "Inadimplente", SUSPENDED: "Suspensa", CANCELLED: "Cancelada" };

export function CompanyControls({ companyId, status, name, trialEndsAt }: { companyId: string; status: string; name: string; trialEndsAt: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({ name, status, trialEndsAt: trialEndsAt ? trialEndsAt.slice(0, 10) : "" });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Erro");
      toast("Empresa atualizada");
      router.refresh();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setSaving(false); }
  }

  return (
    <div className="vixt-card p-6">
      <h2 className="mb-5 font-semibold text-white">Controles administrativos</h2>
      <div className="space-y-4">
        <div><label className="vixt-label">Nome da empresa</label><input className="vixt-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div>
          <label className="vixt-label">Status</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {statuses.map((s) => (
              <button key={s} onClick={() => setForm({ ...form, status: s })} className={cn("rounded-xl border px-3 py-2.5 text-xs font-medium transition", form.status === s ? "border-rose-500 bg-rose-500/10 text-rose-300" : "border-white/10 text-rose-100/60 hover:text-white")}>
                {labels[s]}
              </button>
            ))}
          </div>
        </div>
        <div><label className="vixt-label">Fim do período de teste</label><input type="date" className="vixt-input" value={form.trialEndsAt} onChange={(e) => setForm({ ...form, trialEndsAt: e.target.value })} /></div>
        <button onClick={save} disabled={saving} className="vixt-btn-primary w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar alterações</>}</button>
      </div>
    </div>
  );
}
