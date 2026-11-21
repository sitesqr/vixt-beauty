"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            ux_mode?: "popup" | "redirect";
            locale?: string;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const SCRIPT_URL = "https://accounts.google.com/gsi/client";

/** Botão oficial de login com Google (Identity Services). */
export function GoogleButton({ label = "Entrar com Google" }: { label?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const divRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) {
      setError("Login com Google indisponível (não configurado).");
      return;
    }

    function render() {
      if (!window.google || !divRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId!,
        ux_mode: "popup",
        locale: "pt-BR",
        callback: async ({ credential }) => {
          setLoading(true);
          try {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error?.message || "Falha ao entrar com Google");
            toast("Bem-vinda ao VIXT Beauty!");
            router.push(json.data.redirect);
            router.refresh();
          } catch (err: any) {
            toast(err.message || "Falha ao entrar com Google", "error");
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
        logo_alignment: "center",
        width: 320,
      });
      setReady(true);
    }

    if (window.google) {
      render();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", render);
      return () => existing.removeEventListener("load", render);
    }

    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = render;
    script.onerror = () => setError("Não foi possível carregar o Google.");
    document.head.appendChild(script);
  }, [clientId, router, toast]);

  if (!clientId || error) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs text-rose-100/45">
        {error || "Login com Google indisponível"}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative flex items-center gap-3">
        <div className="vixt-divider flex-1" />
        <span className="text-[11px] uppercase tracking-wider text-rose-100/40">ou</span>
        <div className="vixt-divider flex-1" />
      </div>
      <div ref={divRef} className="flex min-h-[44px] w-full items-center justify-center overflow-hidden rounded-full">
        {!ready && (
          <span className="flex items-center gap-2 text-sm text-rose-100/60">
            <Loader2 className="h-4 w-4 animate-spin" /> {label}
          </span>
        )}
      </div>
      {loading && (
        <p className="flex items-center justify-center gap-2 text-xs text-rose-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Conectando...
        </p>
      )}
    </div>
  );
}
