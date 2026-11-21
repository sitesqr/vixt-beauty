"use client";

import { useEffect, useState } from "react";
import { Download, X, Share, Smartphone } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "vixt-pwa-install-dismissed-at";
const DISMISS_DAYS = 7;

/**
 * Banner de instalação da PWA.
 * - Android/Chrome: captura o `beforeinstallprompt` e chama prompt() ao clicar.
 * - iOS Safari: não dispara o evento; mostra instruções para "Adicionar à Tela de Início".
 * - Se já estiver instalado (standalone), não exibe nada.
 */
export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    // Já instalado (modo standalone): não mostrar banner.
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86_400_000) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // Fallback: nem todos os navegadores disparam beforeinstallprompt
    // (iOS nunca dispara; Chrome exige engajamento). Mostramos o banner
    // após um curto delay para que o botão de instalação esteja sempre
    // acessível — no iOS ele exibe instruções, nos demais chama prompt().
    const fallback = setTimeout(() => setVisible(true), ios ? 1500 : 4000);

    return () => {
      clearTimeout(fallback);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setVisible(false);
      setDeferred(null);
    } else {
      // Sem evento disponível: mostra instruções manuais.
      setShowIOSHelp(true);
    }
  }

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-md rounded-2xl border border-rose-500/30 bg-[#1a1014]/95 p-4 shadow-2xl shadow-black/50 backdrop-blur-md">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15">
          <Smartphone className="h-5 w-5 text-rose-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Instale o VIXT Beauty</p>
          <p className="mt-0.5 text-xs leading-relaxed text-rose-100/60">
            {isIOS
              ? "Tenha o app na sua tela inicial para acessar rapidamente."
              : "Instale na tela inicial para acessar mais rápido e funcionar offline."}
          </p>

          {showIOSHelp && (
            <div className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3 text-xs text-rose-100/70">
              <p className="flex items-center gap-1.5 font-medium text-rose-200">
                <Share className="h-3.5 w-3.5" /> {isIOS ? "Como instalar no iPhone:" : "Como instalar pelo navegador:"}
              </p>
              {isIOS ? (
                <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                  <li>Toque no botão de compartilhar (⬆️) na barra do Safari.</li>
                  <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
                  <li>Confirme com <strong>Adicionar</strong>.</li>
                </ol>
              ) : (
                <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                  <li>Toque no menu do navegador (⋮).</li>
                  <li>Escolha <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
                  <li>Confirme a instalação.</li>
                </ol>
              )}
            </div>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Fechar"
          className="shrink-0 rounded-lg p-1 text-rose-100/40 transition hover:bg-white/5 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!showIOSHelp && (
        <button
          onClick={install}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-400"
        >
          <Download className="h-4 w-4" /> Instalar aplicativo
        </button>
      )}
    </div>
  );
}
