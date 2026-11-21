"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function GoogleCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // O Google retorna o id_token no fragmento (#id_token=...).
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const credential = params.get("id_token");
    const googleError = params.get("error");

    if (googleError || !credential) {
      setError(
        googleError === "access_denied"
          ? "Você cancelou o login com Google."
          : "Não foi possível autenticar com o Google. Tente novamente."
      );
      return;
    }

    fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || "Falha ao entrar com Google");
        router.push(json.data.redirect || "/cliente");
        router.refresh();
      })
      .catch((err) => setError(err.message || "Falha ao entrar com Google"));
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink-950 px-6 text-center">
      <Logo href="/" />
      {error ? (
        <>
          <AlertCircle className="h-10 w-10 text-rose-400" />
          <h1 className="text-xl font-semibold text-white">Ops!</h1>
          <p className="max-w-md text-sm text-rose-100/60">{error}</p>
          <a href="/login" className="vixt-btn-primary">Voltar para o login</a>
        </>
      ) : (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-rose-400" />
          <h1 className="text-xl font-semibold text-white">Conectando ao Google...</h1>
          <p className="text-sm text-rose-100/60">Aguarde um momento.</p>
        </>
      )}
    </main>
  );
}
