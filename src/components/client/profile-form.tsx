"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Mail, Lock } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function ProfileForm({ initial }: { initial: { name: string; email: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: initial.name, email: initial.email, phone: "", currentPassword: "", newPassword: "" });

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((j) => {
      if (j.success) setForm((f) => ({ ...f, phone: j.data.phone || "" }));
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/me", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Erro");
      toast("Perfil atualizado");
      setForm((f) => ({ ...f, currentPassword: "", newPassword: "" }));
      router.refresh();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-5">
      <div className="vixt-card p-6">
        <h2 className="mb-5 font-semibold text-white">Dados pessoais</h2>
        <div className="space-y-4">
          <div><label className="vixt-label">Nome completo</label><input required className="vixt-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="vixt-label">E-mail</label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-100/45" /><input disabled className="vixt-input !pl-10 opacity-60" value={form.email} /></div><p className="mt-1 text-[11px] text-rose-100/45">O e-mail não pode ser alterado.</p></div>
          <div><label className="vixt-label">Telefone / WhatsApp</label><input className="vixt-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
      </div>
      <div className="vixt-card p-6">
        <h2 className="mb-5 flex items-center gap-2 font-semibold text-white"><Lock className="h-4 w-4 text-rose-400" /> Alterar senha</h2>
        <p className="mb-4 text-xs text-rose-100/45">Deixe em branco para manter a senha atual.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="vixt-label">Senha atual</label><input type="password" className="vixt-input" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></div>
          <div><label className="vixt-label">Nova senha (mín. 8)</label><input type="password" minLength={8} className="vixt-input" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></div>
        </div>
      </div>
      <button disabled={saving} className="vixt-btn-primary">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Salvar alterações</>}</button>
    </form>
  );
}
