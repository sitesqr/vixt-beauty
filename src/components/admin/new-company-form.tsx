"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";

type Plan = { id: string; name: string; priceCents: number; trialDays: number };

export function NewCompanyForm({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    companyName: "", slug: "", whatsapp: "", address: "", city: "São Paulo", state: "SP",
    planId: plans.find((p) => p.name === "Profissional")?.id || plans[0]?.id || "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/admin/companies/create", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error?.message || "Erro");
      toast("Empresa criada com sucesso");
      router.push(`/admin/empresas/${j.data.company.id}`);
      router.refresh();
    } catch (e: any) { toast(e.message, "error"); }
    finally { setSaving(false); }
  }

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5">
      <div className="vixt-card p-6">
        <h2 className="mb-5 font-semibold text-white">Dados da proprietária</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="vixt-label">Nome completo</label><input required className="vixt-input" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div><label className="vixt-label">E-mail</label><input required type="email" className="vixt-input" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div><label className="vixt-label">Telefone</label><input required className="vixt-input" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-9999" /></div>
          <div><label className="vixt-label">Senha provisória</label><input required type="password" minLength={8} className="vixt-input" value={form.password} onChange={(e) => set("password", e.target.value)} /></div>
          <div><label className="vixt-label">Confirmar senha</label><input required type="password" minLength={8} className="vixt-input" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} /></div>
        </div>
      </div>

      <div className="vixt-card p-6">
        <h2 className="mb-5 font-semibold text-white">Dados da salão</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="vixt-label">Nome comercial</label><input required className="vixt-input" value={form.companyName} onChange={(e) => { set("companyName", e.target.value); if (!form.slug) set("slug", slugify(e.target.value)); }} /></div>
          <div className="sm:col-span-2"><label className="vixt-label">Identificador público</label><div className="flex items-center rounded-xl border border-white/10 bg-ink-900 pl-3"><span className="text-sm text-rose-100/45">/b/</span><input required className="w-full bg-transparent px-1 py-3 text-sm text-white outline-none" value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} /></div></div>
          <div><label className="vixt-label">WhatsApp</label><input className="vixt-input" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
          <div><label className="vixt-label">Endereço</label><input required className="vixt-input" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div><label className="vixt-label">Cidade</label><input required className="vixt-input" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
          <div><label className="vixt-label">UF</label><input required maxLength={2} className="vixt-input" value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} /></div>
          <div className="sm:col-span-2">
            <label className="vixt-label">Plano</label>
            <select className="vixt-input" value={form.planId} onChange={(e) => set("planId", e.target.value)}>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name} — R$ {(p.priceCents / 100).toFixed(2).replace(".", ",")}/mês ({p.trialDays}d teste)</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Link href="/admin/empresas" className="vixt-btn-ghost"><ArrowLeft className="h-4 w-4" /></Link>
        <button disabled={saving || form.password !== form.confirmPassword} className="vixt-btn-primary flex-1">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar empresa"}</button>
      </div>
    </form>
  );
}
