"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, UserCog, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Pro = {
  id: string; name: string; photoUrl: string | null; email: string | null; phone: string | null; bio: string | null;
  specialties: string[]; commissionRate: number; active: boolean; serviceIds: string[];
};

const empty = { name: "", photoUrl: "", email: "", phone: "", bio: "", specialties: "", commissionRate: "0", active: true, serviceIds: [] as string[] };

export function ProfessionalsManager({ initial, services }: { initial: Pro[]; services: { id: string; name: string }[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pro | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  function openNew() { setEditing(null); setForm(empty); setOpen(true); }
  function openEdit(p: Pro) {
    setEditing(p);
    setForm({
      name: p.name, photoUrl: p.photoUrl || "", email: p.email || "", phone: p.phone || "", bio: p.bio || "",
      specialties: p.specialties.join(", "), commissionRate: String(p.commissionRate),
      active: p.active, serviceIds: p.serviceIds,
    });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/professionals/${editing.id}` : "/api/professionals", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          commissionRate: Number(form.commissionRate),
          specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Erro ao salvar");
      toast(editing ? "Profissional atualizado" : "Profissional cadastrado");
      setOpen(false);
      router.refresh();
      if (!editing && j.data?.id) {
        setItems((p) => [...p, { ...form, id: j.data.id, photoUrl: form.photoUrl || null, email: form.email || null, phone: form.phone || null, bio: form.bio || null, specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean), commissionRate: Number(form.commissionRate) }]);
      } else if (editing) {
        setItems((p) => p.map((x) => x.id === editing.id ? { ...x, name: form.name, active: form.active, commissionRate: Number(form.commissionRate) } : x));
      }
    } catch (err: any) {
      toast(err.message || "Erro ao salvar", "error");
    } finally { setSaving(false); }
  }

  async function remove(p: Pro) {
    if (!confirm(`Desativar ${p.name}?`)) return;
    const res = await fetch(`/api/professionals/${p.id}`, { method: "DELETE" });
    if (res.ok) { toast("Profissional desativado"); setItems((x) => x.map((i) => i.id === p.id ? { ...i, active: false } : i)); }
  }

  return (
    <>
      <div className="mb-5 flex justify-end"><button onClick={openNew} className="vixt-btn-primary"><Plus className="h-4 w-4" /> Novo profissional</button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((p) => (
          <div key={p.id} className={cn("vixt-card p-5", !p.active && "opacity-50")}>
            <div className="flex items-start justify-between">
              {p.photoUrl ? (
                <img src={p.photoUrl} alt={p.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-rose-500/30" />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-rose-500 to-rose-800 text-lg font-bold text-white">{p.name.charAt(0)}</div>
              )}
              <div className="flex gap-1">
                <button onClick={() => openEdit(p)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-100/45 hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(p)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-100/45 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <h3 className="mt-4 font-semibold text-white">{p.name}</h3>
            <p className="text-xs text-rose-100/45">{p.email || p.phone || "Sem contato"}</p>
            {p.specialties.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">{p.specialties.map((s) => <span key={s} className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-rose-100/60">{s}</span>)}</div>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
              <span className="text-xs text-rose-100/45">Comissão</span>
              <span className="font-bold text-rose-300">{p.commissionRate}%</span>
            </div>
            <span className={cn("vixt-badge mt-3 text-[10px]", p.active ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-100/45/10 text-rose-100/60")}>{p.active ? "Ativo" : "Inativo"}</span>
          </div>
        ))}
        {items.length === 0 && <div className="vixt-card col-span-full p-12 text-center text-rose-100/45"><UserCog className="mx-auto mb-3 h-8 w-8 opacity-40" />Nenhum profissional cadastrado.</div>}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="vixt-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editing ? "Editar profissional" : "Novo profissional"}</h2>
              <button onClick={() => setOpen(false)} className="text-rose-100/45 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div><label className="vixt-label">Nome</label><input required className="vixt-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><label className="vixt-label">URL da foto</label><input className="vixt-input" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://exemplo.com/foto.jpg" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="vixt-label">E-mail</label><input type="email" className="vixt-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><label className="vixt-label">Telefone</label><input className="vixt-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              </div>
              <div><label className="vixt-label">Especialidades (separadas por vírgula)</label><input className="vixt-input" value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Cabelo, Coloração, Unhas" /></div>
              <div><label className="vixt-label">Bio</label><textarea className="vixt-input min-h-[70px] resize-none" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
              <div><label className="vixt-label">Comissão (%)</label><input type="number" min={0} max={100} className="vixt-input" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} /></div>
              <div>
                <label className="vixt-label">Serviços realizados</label>
                <div className="flex flex-wrap gap-2 rounded-xl border border-white/10 p-3">
                  {services.map((s) => (
                    <button type="button" key={s.id} onClick={() => setForm({ ...form, serviceIds: form.serviceIds.includes(s.id) ? form.serviceIds.filter((id) => id !== s.id) : [...form.serviceIds, s.id] })}
                      className={cn("rounded-lg border px-2.5 py-1.5 text-xs", form.serviceIds.includes(s.id) ? "border-rose-500 bg-rose-500/15 text-rose-300" : "border-white/10 text-rose-100/60")}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-rose-100"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-rose-500" /> Profissional ativo</label>
              <button disabled={saving} className="vixt-btn-primary w-full">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
