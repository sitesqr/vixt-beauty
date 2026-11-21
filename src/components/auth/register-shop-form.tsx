"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2, ArrowLeft, ArrowRight, Building2, User } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { slugify } from "@/lib/utils";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  trialDays: number;
  features: unknown;
};

type Form = {
  name: string; email: string; phone: string; password: string; confirmPassword: string;
  companyName: string; slug: string; whatsapp: string; address: string; city: string; state: string; planId: string;
};

const initial: Form = {
  name: "", email: "", phone: "", password: "", confirmPassword: "",
  companyName: "", slug: "", whatsapp: "", address: "", city: "São Paulo", state: "SP", planId: "",
};

export function RegisterShopForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState<Form>(initial);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setPlans(j.data);
          setForm((f) => ({ ...f, planId: j.data.find((p: Plan) => p.name === "Profissional")?.id || j.data[0]?.id || "" }));
        }
      });
  }, []);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Erro no cadastro");
      toast(`Salão criada! ${json.data.trialDays} dias grátis.`);
      router.push(json.data.redirect);
      router.refresh();
    } catch (err: any) {
      toast(err.message || "Erro no cadastro", "error");
    } finally {
      setLoading(false);
    }
  }

  const stepTitles = ["Seus dados", "Seu salão", "Escolha o plano"];

  return (
    <>
      {/* Stepper */}
      <div className="mb-8 flex items-center gap-2">
        {stepTitles.map((t, i) => {
          const n = i + 1;
          return (
            <div key={t} className="flex flex-1 items-center gap-2">
              <button
                onClick={() => n < step && setStep(n)}
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition ${n <= step ? "bg-rose-500 text-white" : "bg-white/5 text-rose-100/45"}`}
              >
                {n < step ? <Check className="h-4 w-4" /> : n}
              </button>
              <span className={`hidden text-xs sm:block ${n <= step ? "text-rose-50" : "text-rose-100/40"}`}>{t}</span>
              {n < 3 && <div className={`h-px flex-1 ${n < step ? "bg-rose-500" : "bg-white/10"}`} />}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <div className="animate-fade-in space-y-4">
          <div className="mb-5 flex items-center gap-3 text-rose-100">
            <User className="h-5 w-5 text-rose-400" />
            <p className="text-sm">Dados da proprietária</p>
          </div>
          <div>
            <label className="vixt-label">Nome completo</label>
            <input required className="vixt-input" placeholder="Seu nome completo" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="vixt-label">E-mail</label>
            <input required type="email" className="vixt-input" placeholder="voce@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <label className="vixt-label">Telefone</label>
            <input required className="vixt-input" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="vixt-label">Senha</label>
              <input required type="password" minLength={8} className="vixt-input" placeholder="Mín. 8 caracteres" value={form.password} onChange={(e) => set("password", e.target.value)} />
            </div>
            <div>
              <label className="vixt-label">Confirmar senha</label>
              <input required type="password" minLength={8} className="vixt-input" placeholder="Repita a senha" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} />
            </div>
          </div>
          <button onClick={() => setStep(2)} className="vixt-btn-primary w-full" disabled={!form.name || !form.email || !form.phone || !form.password || form.password !== form.confirmPassword}>
            Continuar <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="animate-fade-in space-y-4">
          <div className="mb-5 flex items-center gap-3 text-rose-100">
            <Building2 className="h-5 w-5 text-rose-400" />
            <p className="text-sm">Dados da salão</p>
          </div>
          <div>
            <label className="vixt-label">Nome comercial</label>
            <input required className="vixt-input" placeholder="Ex.: Belle Essence Salão" value={form.companyName} onChange={(e) => {
              set("companyName", e.target.value);
              if (!form.slug) set("slug", slugify(e.target.value));
            }} />
          </div>
          <div>
            <label className="vixt-label">Identificador público (seu endereço no site)</label>
            <div className="flex items-center rounded-xl border border-white/10 bg-ink-900 pl-3 focus-within:border-rose-500">
              <span className="text-sm text-rose-100/45">/b/</span>
              <input required className="w-full bg-transparent px-1 py-3 text-sm text-white outline-none" placeholder="belle-essence" value={form.slug} onChange={(e) => set("slug", slugify(e.target.value))} />
            </div>
            <p className="mt-1 text-[11px] text-rose-100/45">Sua página: vixtbeauty.com/b/{form.slug || "seu-identificador"}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="vixt-label">WhatsApp</label>
              <input className="vixt-input" placeholder="(11) 98888-7777" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} />
            </div>
            <div>
              <label className="vixt-label">Endereço</label>
              <input required className="vixt-input" placeholder="Rua, número" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="vixt-label">Cidade</label>
              <input required className="vixt-input" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <label className="vixt-label">UF</label>
              <input required maxLength={2} className="vixt-input" value={form.state} onChange={(e) => set("state", e.target.value.toUpperCase())} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="vixt-btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
            <button onClick={() => setStep(3)} className="vixt-btn-primary flex-1" disabled={!form.companyName || form.slug.length < 3 || !form.address}>
              Continuar <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="animate-fade-in space-y-4">
          <p className="text-sm text-rose-100">Escolha o plano para sua salão</p>
          <div className="space-y-3">
            {plans.map((p) => {
              const features = Array.isArray(p.features) ? p.features : [];
              const selected = form.planId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => set("planId", p.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${selected ? "border-rose-500 bg-rose-500/[0.08] ring-1 ring-rose-500/40" : "border-white/10 bg-ink-900 hover:border-white/20"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`grid h-4 w-4 place-items-center rounded-full border ${selected ? "border-rose-500" : "border-rose-100/40"}`}>
                        {selected && <span className="h-2 w-2 rounded-full bg-rose-500" />}
                      </span>
                      <span className="font-semibold text-white">{p.name}</span>
                    </div>
                    <span className="font-bold text-white">
                      R$ {(p.priceCents / 100).toFixed(0).replace(".", ",")}
                      <span className="text-xs font-normal text-rose-100/45">/mês</span>
                    </span>
                  </div>
                  <p className="mt-1.5 pl-6 text-xs text-rose-100/45">{p.description}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 pl-6">
                    {(features as string[]).slice(0, 4).map((f) => (
                      <span key={f} className="flex items-center gap-1 text-[11px] text-rose-100/60"><Check className="h-3 w-3 text-rose-400" />{f}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3 text-xs text-rose-200">
            🎉 Você terá <strong>{plans.find((p) => p.id === form.planId)?.trialDays || 14} dias grátis</strong> para testar todas as funcionalidades. Sem cartão de crédito.
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="vixt-btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
            <button onClick={submit} disabled={loading || !form.planId} className="vixt-btn-primary flex-1">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar meu salão"}
            </button>
          </div>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-rose-100/45">
        Já tem conta? <Link href="/login" className="font-medium text-rose-400 hover:text-rose-300">Entrar</Link>
      </p>
    </>
  );
}
