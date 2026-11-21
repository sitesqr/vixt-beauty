"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";

/** Botão de login com Google via fluxo OAuth (redirect). Funciona sem scripts externos. */
export function GoogleButton({ label = "Entrar com Google" }: { label?: string }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-xs text-rose-100/45">
        Login com Google indisponível (não configurado)
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
      <Link
        href="/api/auth/google/start"
        className="vixt-btn-ghost w-full !border-white/15 !bg-white/[0.04] !text-white"
      >
        <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.6.27-3.14.78-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        {label}
      </Link>
      <p className="flex items-center justify-center gap-1.5 text-[11px] text-rose-100/35">
        <Loader2 className="h-3 w-3" /> Você será direcionada ao Google com segurança
      </p>
    </div>
  );
}
