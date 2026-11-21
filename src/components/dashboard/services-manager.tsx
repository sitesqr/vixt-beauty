"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Scissors, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn, formatCurrency } from "@/lib/utils";

type Service = {
  id: string; name: string; description: string | null; category: string | null;
  priceCents: number; durationMin: number; imageUrl: string | null; active: boolean;
};

const empty = { name: "", description: "", category: "", price: "", durationMin: "30", imageUrl: "", active: true };

export function ServicesManager({ initial }: { initial: Service[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [services, setServices] = useState(initial);
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(s: Service) {
    setEditing(s);
    setForm({
      name: s.name, description: s.description || "", category: s.category || "",
      price: (s.priceCents / 100).toFixed(2).replace(".", ","), durationMin: String(s.durationMin),
      imageUrl: s.imageUrl || "", active: s.active,
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/services/${editing.id}` : "/api/services", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price.replace(",", ".")) }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Erro ao salvar");
      toast(editing ? "Serviço atualizado" : "Serviço criado");
      setOpen(false);
      router.refresh();
      if (j.data?.id) {
        setServices((prev) => editing ? prev.map((s) => s.id === j.data.id ? { ...s, ...j.data } : s) : [...prev, j.data]);
      } else if (editing) {
        setServices((prev) => prev.map((s) => s.id === editing.id ? { ...s, name: form.name, priceCents: Number(form.price.replace(",", ".")) * 100, durationMin: Number(form.durationMin), active: form.active } : s));
      }
    } catch (err: any) {
      toast(err.message || "Erro ao salvar", "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: Service) {
    if (!confirm(`Desativar "${s.name}"? O histórico será preservado.`)) return;
    const res = await fetch(`/api/services/${s.id}`, { method: "DELETE" });
    if (res.ok) { toast("Serviço desativado"); setServices((p) => p.map((x) => x.id === s.id ? { ...x, active: false } : x)); }
    else toast("Erro ao desativar", "error");
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button onClick={openNew} className="vixt-btn-primary"><Plus className="h-4 w-4" /> Novo serviço</button>
      </div>

      {services.length === 0 ? (
        <div className="vixt-card p-12 text-center text-rose-100/45"><Scissors className="mx-auto mb-3 h-8 w-8 opacity-40" />Nenhum serviço cadastrado.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {services.map((s) => (
            <div key={s.id} className={cn("vixt-card p-5 transition", !s.active && "opacity-50")}>
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-400"><Scissors className="h-5 w-5" /></div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-100/45 hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(s)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-100/45 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <h3 className="mt-4 font-semibold text-white">{s.name}</h3>
              <p className="mt-1 line-clamp-2 min-h-[2rem] text-xs text-rose-100/45">{s.description || "Sem descrição"}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-lg font-bold text-rose-300">{formatCurrency(s.priceCents)}</span>
                <span className="text-xs text-rose-100/45">{s.durationMin} min</span>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-white/[0.06] pt-3">
                <span className={cn("vixt-badge text-[10px]", s.active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-100/45/10 text-rose-100/60")}>{s.active ? "Ativo" : "Inativo"}</span>
                {s.category && <span className="text-[10px] text-rose-100/40">{s.category}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="vixt-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editing ? "Editar serviço" : "Novo serviço"}</h2>
              <button onClick={() => setOpen(false)} className="text-rose-100/45 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div><label className="vixt-label">Nome</label><input required className="vixt-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Corte Feminino" /></div>
              <div><label className="vixt-label">Descrição</label><textarea className="vixt-input min-h-[80px] resize-none" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="vixt-label">Preço (R$)</label><input required className="vixt-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="45,00" /></div>
                <div><label className="vixt-label">Duração (min)</label><input required type="number" min={5} className="vixt-input" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: e.target.value })} /></div>
              </div>
              <div><label className="vixt-label">Categoria</label><input className="vixt-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Cabelo, Coloração, Unhas, Estética..." /></div>
              <label className="flex items-center gap-2 text-sm text-rose-100"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-rose-500" /> Serviço ativo</label>
              <button disabled={saving} className="vixt-btn-primary w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
