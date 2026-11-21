"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function RegisterClientForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Erro no cadastro");
      toast("Conta criada! Bem-vindo ao VIXT Beauty.");
      router.push(json.data.redirect);
      router.refresh();
    } catch (err: any) {
      toast(err.message || "Erro no cadastro", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="vixt-label">Nome completo</label>
          <input required className="vixt-input" placeholder="Seu nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="vixt-label">E-mail</label>
          <input required type="email" className="vixt-input" placeholder="voce@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="vixt-label">Telefone / WhatsApp</label>
          <input required className="vixt-input" placeholder="(11) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="vixt-label">Senha</label>
            <input required type="password" minLength={8} className="vixt-input" placeholder="Mín. 8 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="vixt-label">Confirmar senha</label>
            <input required type="password" minLength={8} className="vixt-input" placeholder="Repita a senha" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
          </div>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3 text-xs text-rose-200">
          ✓ Seu cadastro é <strong>100% gratuito</strong>. Sem mensalidades ou taxas de agendamento.
        </div>
        <button disabled={loading} type="submit" className="vixt-btn-primary w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar minha conta grátis"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-rose-100/45">
        Já tem conta? <Link href="/login" className="font-medium text-rose-400 hover:text-rose-300">Entrar</Link>
      </p>
    </>
  );
}
