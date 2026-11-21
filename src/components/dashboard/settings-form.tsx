"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Clock } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
type WH = { dayOfWeek: number; openTime: string; closeTime: string; enabled: boolean };

type Initial = {
  name: string; description: string; logoUrl: string; phone: string; whatsapp: string; address: string;
  city: string; state: string; workingHours: WH[]; minAdvanceHours: number; minRescheduleHours: number;
};

export function SettingsForm({ initial, planName }: { initial: Initial; planName: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const setWH = (d: number, patch: Partial<WH>) =>
    setForm((f) => ({ ...f, workingHours: f.workingHours.map((w) => w.dayOfWeek === d ? { ...w, ...patch } : w) }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Erro ao salvar");
      toast("Configurações salvas com sucesso");
      router.refresh();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="vixt-card p-6">
        <h2 className="mb-5 font-semibold text-white">Dados da salão</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="vixt-label">Nome comercial</label>
            <input required className="vixt-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="vixt-label">URL do logo</label>
            <input className="vixt-input" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://exemplo.com/logo.png" />
          </div>
          <div className="sm:col-span-2">
            <label className="vixt-label">Descrição</label>
            <textarea className="vixt-input min-h-[90px] resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div><label className="vixt-label">Telefone</label><input className="vixt-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="vixt-label">WhatsApp</label><input className="vixt-input" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
          <div className="sm:col-span-2"><label className="vixt-label">Endereço</label><input className="vixt-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="vixt-label">Cidade</label><input className="vixt-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><label className="vixt-label">UF</label><input maxLength={2} className="vixt-input" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })} /></div>
        </div>
      </div>

      <div className="vixt-card p-6">
        <h2 className="mb-1 font-semibold text-white">Horário de funcionamento</h2>
        <p className="mb-5 text-xs text-rose-100/45">Defina os dias e horários em que a salão atende.</p>
        <div className="space-y-2.5">
          {form.workingHours.map((w) => (
            <div key={w.dayOfWeek} className={cn("flex flex-wrap items-center gap-3 rounded-xl border p-3", w.enabled ? "border-white/[0.08] bg-white/[0.02]" : "border-transparent bg-white/[0.01] opacity-50")}>
              <label className="flex w-32 shrink-0 items-center gap-2 text-sm text-rose-100">
                <input type="checkbox" checked={w.enabled} onChange={(e) => setWH(w.dayOfWeek, { enabled: e.target.checked })} className="accent-rose-500" />
                {DAYS[w.dayOfWeek]}
              </label>
              <input type="time" disabled={!w.enabled} className="vixt-input !w-32 !py-2" value={w.openTime} onChange={(e) => setWH(w.dayOfWeek, { openTime: e.target.value })} />
              <span className="text-rose-100/40">até</span>
              <input type="time" disabled={!w.enabled} className="vixt-input !w-32 !py-2" value={w.closeTime} onChange={(e) => setWH(w.dayOfWeek, { closeTime: e.target.value })} />
            </div>
          ))}
        </div>
      </div>

      <div className="vixt-card p-6">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-white"><Clock className="h-4 w-4 text-rose-400" /> Políticas de agendamento</h2>
        <p className="mb-5 text-xs text-rose-100/45">Plano atual: <span className="text-rose-300">{planName}</span></p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="vixt-label">Antecedência mínima para agendar (horas)</label><input type="number" min={0} className="vixt-input" value={form.minAdvanceHours} onChange={(e) => setForm({ ...form, minAdvanceHours: Number(e.target.value) })} /></div>
          <div><label className="vixt-label">Antecedência mínima para remarcar (horas)</label><input type="number" min={0} className="vixt-input" value={form.minRescheduleHours} onChange={(e) => setForm({ ...form, minRescheduleHours: Number(e.target.value) })} /></div>
        </div>
      </div>

      <button type="submit" disabled={saving} className="vixt-btn-primary">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar alterações</>}
      </button>
    </form>
  );
}
