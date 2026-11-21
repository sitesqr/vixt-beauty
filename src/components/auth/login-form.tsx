"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Erro ao entrar");
      toast("Bem-vindo de volta!");
      router.push(json.data.redirect);
      router.refresh();
    } catch (err: any) {
      toast(err.message || "Erro ao entrar", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="vixt-label">E-mail</label>
          <input
            type="email"
            required
            autoComplete="email"
            className="vixt-input"
            placeholder="voce@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="vixt-label">Senha</label>
            <Link href="/esqueci-senha" className="mb-1.5 text-xs text-rose-400 hover:text-rose-300">Esqueceu?</Link>
          </div>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              required
              autoComplete="current-password"
              className="vixt-input pr-12"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-100/45 hover:text-rose-100">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="vixt-btn-primary w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-rose-100/45">
        Ainda não tem conta?{" "}
        <Link href="/cadastro-salao" className="font-medium text-rose-400 hover:text-rose-300">Abrir salão</Link>
        {" · "}
        <Link href="/cadastro-cliente" className="font-medium text-rose-400 hover:text-rose-300">Sou cliente</Link>
      </p>
    </>
  );
}
