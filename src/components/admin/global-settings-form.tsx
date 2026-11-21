"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Settings } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type S = { platformName: string; supportEmail: string; defaultTrialDays: number; allowSelfRegistration: boolean; maintenanceMode: boolean };

export function GlobalSettingsForm({ initial }: { initial: S }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error("Erro ao salvar");
      toast("Configurações salvas");
      router.refresh();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={save} className="max-w-2xl vixt-card p-6">
      <h2 className="mb-5 flex items-center gap-2 font-semibold text-white"><Settings className="h-4 w-4 text-rose-400" /> Parâmetros da plataforma</h2>
      <div className="space-y-4">
        <div><label className="vixt-label">Nome da plataforma</label><input className="vixt-input" value={form.platformName} onChange={(e) => setForm({ ...form, platformName: e.target.value })} /></div>
        <div><label className="vixt-label">E-mail de suporte</label><input type="email" className="vixt-input" value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} /></div>
        <div><label className="vixt-label">Dias padrão de teste</label><input type="number" min={0} className="vixt-input" value={form.defaultTrialDays} onChange={(e) => setForm({ ...form, defaultTrialDays: Number(e.target.value) })} /></div>
        <label className="flex items-center gap-2 text-sm text-rose-100"><input type="checkbox" checked={form.allowSelfRegistration} onChange={(e) => setForm({ ...form, allowSelfRegistration: e.target.checked })} className="accent-rose-500" /> Permitir cadastro autônomo de salões</label>
        <label className="flex items-center gap-2 text-sm text-rose-100"><input type="checkbox" checked={form.maintenanceMode} onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })} className="accent-rose-500" /> Modo manutenção</label>
      </div>
      <button disabled={saving} className="vixt-btn-primary mt-6">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar</>}</button>
    </form>
  );
}
