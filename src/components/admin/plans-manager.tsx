"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, X, Loader2, CreditCard } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";

type Plan = {
  id: string; name: string; slug: string; description: string; priceCents: number;
  trialDays: number; maxProfessionals: number; maxServices: number;
  features: string[]; active: boolean; sortOrder: number; subscriptions: number;
};

const empty = { name: "", slug: "", description: "", price: "", trialDays: "14", maxProfessionals: "5", maxServices: "20", features: "", active: true, sortOrder: "0" };

export function PlansManager({ initial }: { initial: Plan[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [plans, setPlans] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(p: Plan) {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, description: p.description,
      price: (p.priceCents / 100).toFixed(2).replace(".", ","), trialDays: String(p.trialDays),
      maxProfessionals: String(p.maxProfessionals), maxServices: String(p.maxServices),
      features: p.features.join("\n"), active: p.active, sortOrder: String(p.sortOrder),
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        priceCents: Math.round(Number(form.price.replace(",", ".")) * 100),
        trialDays: Number(form.trialDays), maxProfessionals: Number(form.maxProfessionals),
        maxServices: Number(form.maxServices), sortOrder: Number(form.sortOrder),
        features: form.features.split("\n").map((s) => s.trim()).filter(Boolean),
      };
      const res = await fetch(editing ? `/api/admin/plans/${editing.id}` : "/api/admin/plans", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Erro ao salvar");
      toast(editing ? "Plano atualizado" : "Plano criado");
      setOpen(false);
      router.refresh();
      if (!editing && j.data) setPlans((p) => [...p, { ...j.data, subscriptions: 0, features: payload.features, priceCents: payload.priceCents }]);
      else if (editing) setPlans((p) => p.map((x) => x.id === editing.id ? { ...x, name: form.name, priceCents: payload.priceCents, active: form.active } : x));
    } catch (err: any) { toast(err.message, "error"); }
    finally { setSaving(false); }
  }

  return (
    <>
      <div className="mb-5 flex justify-end"><button onClick={openNew} className="vixt-btn-primary"><Plus className="h-4 w-4" /> Novo plano</button></div>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className={cn("vixt-card p-6", !p.active && "opacity-50")}>
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-400"><CreditCard className="h-5 w-5" /></div>
              <button onClick={() => openEdit(p)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-100/45 hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></button>
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">{p.name}</h3>
            <p className="text-xs text-rose-100/45">{p.description}</p>
            <p className="mt-4 text-3xl font-extrabold text-white">{formatCurrency(p.priceCents)}<span className="text-sm font-normal text-rose-100/45">/mês</span></p>
            <div className="mt-4 space-y-1.5 text-xs text-rose-100/60">
              <p>{p.maxProfessionals} profissionais · {p.maxServices} serviços</p>
              <p>{p.trialDays} dias de teste</p>
              <p>{p.subscriptions} assinatura(s)</p>
            </div>
            <div className="mt-3 border-t border-white/[0.06] pt-3 text-[11px] text-rose-100/45">{p.features.slice(0, 3).join(" · ")}</div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="vixt-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold text-white">{editing ? "Editar plano" : "Novo plano"}</h2><button onClick={() => setOpen(false)} className="text-rose-100/45 hover:text-white"><X className="h-5 w-5" /></button></div>
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="vixt-label">Nome</label><input required className="vixt-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="vixt-label">Identificador</label><input required className="vixt-input" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="starter" /></div>
              </div>
              <div><label className="vixt-label">Descrição</label><input className="vixt-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="vixt-label">Preço (R$)</label><input required className="vixt-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="49,00" /></div>
                <div><label className="vixt-label">Dias de teste</label><input type="number" className="vixt-input" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="vixt-label">Máx. profissionais</label><input type="number" className="vixt-input" value={form.maxProfessionals} onChange={(e) => setForm({ ...form, maxProfessionals: e.target.value })} /></div>
                <div><label className="vixt-label">Máx. serviços</label><input type="number" className="vixt-input" value={form.maxServices} onChange={(e) => setForm({ ...form, maxServices: e.target.value })} /></div>
              </div>
              <div><label className="vixt-label">Recursos (um por linha)</label><textarea className="vixt-input min-h-[90px] resize-none" value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="vixt-label">Ordem</label><input type="number" className="vixt-input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></div>
                <label className="flex items-end gap-2 pb-3 text-sm text-rose-100"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-rose-500" /> Plano ativo</label>
              </div>
              <button disabled={saving} className="vixt-btn-primary w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
