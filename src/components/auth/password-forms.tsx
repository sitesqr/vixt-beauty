"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message);
      setDone(true);
    } catch (err: any) {
      toast(err.message || "Erro ao enviar", "error");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.07] p-5 text-sm text-emerald-200">
        <p className="font-semibold">E-mail enviado!</p>
        <p className="mt-1 text-emerald-300/70">Se o e-mail estiver cadastrado, você receberá o link de recuperação em breve.</p>
        <Link href="/login" className="mt-4 inline-block font-medium text-emerald-300 underline">Voltar para o login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="vixt-label">E-mail cadastrado</label>
        <input required type="email" className="vixt-input" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <button disabled={loading} className="vixt-btn-primary w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar link de recuperação"}
      </button>
      <p className="text-center text-sm text-rose-100/45"><Link href="/login" className="text-rose-400">Voltar ao login</Link></p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ token: params.get("token") || "", password: "", confirmPassword: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message);
      toast("Senha redefinida! Faça login com a nova senha.");
      router.push("/login");
    } catch (err: any) {
      toast(err.message || "Erro ao redefinir", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="vixt-label">Token de recuperação</label>
        <input required className="vixt-input" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
      </div>
      <div>
        <label className="vixt-label">Nova senha</label>
        <input required type="password" minLength={8} className="vixt-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </div>
      <div>
        <label className="vixt-label">Confirmar nova senha</label>
        <input required type="password" minLength={8} className="vixt-input" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
      </div>
      <button disabled={loading} className="vixt-btn-primary w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir senha"}
      </button>
    </form>
  );
}
